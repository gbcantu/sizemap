import { useState, useEffect, useCallback, KeyboardEvent } from 'react'
import { directoryService } from './services/directoryService'
import type { ProgressInfo, BackendRuntimeStatus, DirectoryAnalysisResult, DirectoryNode } from './types/directory'
import './App.css'

// ── Utilidades ────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

// Cor da barra de tamanho baseada no índice do item
const BAR_COLORS = ['#007acc', '#16825d', '#795e26', '#d16969', '#608b4e', '#9b4db0', '#c07e29']
function barColor(idx: number) {
  return BAR_COLORS[idx % BAR_COLORS.length]
}

// ── Tipos internos ────────────────────────────────────────────────────────────

interface FlatRow {
  node: DirectoryNode
  depth: number
  colorIdx: number
  isExpanded: boolean
  parentSize: number  // tamanho do pai para calcular % da barra
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function App() {
  const [backendStatus, setBackendStatus] = useState<BackendRuntimeStatus>({
    state: 'starting',
    message: 'Aguardando serviço Python...',
  })
  const [progress, setProgress]         = useState<ProgressInfo | null>(null)
  const [pathInput, setPathInput]       = useState('')
  const [result, setResult]             = useState<DirectoryAnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing]   = useState(false)
  const [selectedId, setSelectedId]     = useState<string | null>(null)
  // Set de IDs expandidos
  const [expanded, setExpanded]         = useState<Set<string>>(new Set())
  // Cache de nós carregados (além do rootNode inicial)
  const [nodeCache, setNodeCache]       = useState<Map<string, DirectoryNode>>(new Map())

  // ── Listeners de backend ────────────────────────────────────────────────────
  useEffect(() => {
    const offStatus   = directoryService.onBackendStatus(setBackendStatus)
    const offProgress = directoryService.onProgress(setProgress)
    directoryService.getBackendStatus().then(setBackendStatus).catch(() => null)
    return () => { offStatus(); offProgress() }
  }, [])

  // ── Analisar ────────────────────────────────────────────────────────────────
  const handleAnalyze = useCallback(async () => {
    const path = pathInput.trim()
    if (!path) return
    setIsAnalyzing(true)
    setResult(null)
    setProgress(null)
    setExpanded(new Set())
    setNodeCache(new Map())
    setSelectedId(null)
    try {
      const res = await directoryService.analyzeDirectory({ path, throttleMs: 0, maxDepth: 1 })
      setResult(res)
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err))
    } finally {
      setIsAnalyzing(false)
      setProgress(null)
    }
  }, [pathInput])

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAnalyze()
  }

  const handleCancel = async () => {
    await directoryService.cancelOperation().catch(() => null)
    setIsAnalyzing(false)
    setProgress(null)
  }

  const handleBrowse = async () => {
    const picked = await (window.directoryAnalyzer as any).chooseDirectory?.()
    if (picked) setPathInput(picked)
  }

  // ── Expandir nó ─────────────────────────────────────────────────────────────
  const handleToggle = useCallback(async (node: DirectoryNode) => {
    if (!node.isDirectory) return
    const id = node.id

    if (expanded.has(id)) {
      // Colapsar
      setExpanded(prev => { const s = new Set(prev); s.delete(id); return s })
      return
    }

    // Expandir — buscar filhos se ainda não carregados
    setExpanded(prev => new Set(prev).add(id))

    if (node.hasChildren && node.children.length === 0) {
      try {
        const res = await directoryService.expandNode(id)
        setNodeCache(prev => {
          const m = new Map(prev)
          res.children.forEach(c => m.set(c.id, c))
          return m
        })
      } catch (_) {
        // silencioso — o nó simplesmente não expandirá
      }
    }
  }, [expanded])

  // ── Montar linhas planas para renderização ───────────────────────────────────
  const buildRows = useCallback((): FlatRow[] => {
    if (!result) return []

    const rows: FlatRow[] = []
    const rootSize = result.rootNode.sizeBytes || 1

    function walk(node: DirectoryNode, depth: number, colorIdx: number, parentSize: number) {
      rows.push({ node, depth, colorIdx, isExpanded: expanded.has(node.id), parentSize })
      if (expanded.has(node.id)) {
        const children: DirectoryNode[] = node.children
          .map(childId => nodeCache.get(childId))
          .filter((c): c is DirectoryNode => !!c)
          .sort((a, b) => b.sizeBytes - a.sizeBytes)

        children.forEach((child, i) => {
          walk(child, depth + 1, depth === 0 ? i : colorIdx, node.sizeBytes || 1)
        })
      }
    }

    walk(result.rootNode, 0, 0, rootSize)
    return rows
  }, [result, expanded, nodeCache])

  // Ao carregar o resultado, popular o cache com os filhos do root já disponíveis
  useEffect(() => {
    if (!result) return
    const m = new Map<string, DirectoryNode>()
    m.set(result.rootNode.id, result.rootNode)
    result.childNodes.forEach(n => m.set(n.id, n))
    setNodeCache(m)
    // Expandir o rootNode automaticamente
    setExpanded(new Set([result.rootNode.id]))
  }, [result])

  const rows = buildRows()

  // ── Render ───────────────────────────────────────────────────────────────────
  const rootSize = result?.rootNode.sizeBytes ?? 1

  return (
    <div className="sizemap-root">

      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <div className="toolbar">
        <div className="toolbar-logo">
          {/* Ícone de disco/pasta */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M3 6C3 4.9 3.9 4 5 4h14c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V6z" stroke="#007acc" strokeWidth="1.5"/>
            <path d="M3 10h18" stroke="#007acc" strokeWidth="1.5"/>
            <rect x="6" y="14" width="3" height="3" rx="0.5" fill="#007acc"/>
          </svg>
          SizeMap
        </div>
        <div className="toolbar-sep" />

        <input
          className="toolbar-input"
          type="text"
          value={pathInput}
          onChange={e => setPathInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Caminho do diretório  (ex: /home/user  ou  C:\Users)"
          disabled={isAnalyzing}
          spellCheck={false}
        />

        <button
          className="toolbar-btn"
          style={{ background: '#3c3c3c', color: '#ccc', border: '1px solid #555' }}
          onClick={handleBrowse}
          disabled={isAnalyzing}
          title="Selecionar pasta"
        >
          …
        </button>

        <button
          className="toolbar-btn primary"
          onClick={handleAnalyze}
          disabled={isAnalyzing || backendStatus.state !== 'ready'}
        >
          {isAnalyzing
            ? <><Spinner /> Analisando…</>
            : <>▶ Analisar</>}
        </button>

        {isAnalyzing && (
          <button className="toolbar-btn danger" onClick={handleCancel}>
            ■ Parar
          </button>
        )}
      </div>

      {/* ── Barra de progresso ──────────────────────────────────────────────── */}
      <div className={`progress-bar ${isAnalyzing ? 'indeterminate' : ''}`}>
        <div
          className="progress-bar-fill"
          style={{
            width: progress && progress.total > 0
              ? `${Math.round((progress.completed / progress.total) * 100)}%`
              : isAnalyzing ? '0%' : '0%'
          }}
        />
      </div>

      {/* Mensagem de progresso */}
      {(isAnalyzing || progress) && (
        <div className="progress-msg">
          {progress?.message ?? 'Preparando análise…'}
          {progress && progress.total > 0 &&
            <span style={{ marginLeft: 'auto', fontFamily: 'monospace' }}>
              {progress.completed} / {progress.total}
            </span>
          }
        </div>
      )}

      {/* ── Cards de resumo ─────────────────────────────────────────────────── */}
      {result && (
        <div className="summary-bar">
          <div className="summary-card">
            <span className="summary-label">Tamanho total</span>
            <span className="summary-value">{formatBytes(result.totalSizeBytes)}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Arquivos</span>
            <span className="summary-value">{result.totalFileCount.toLocaleString('pt-BR')}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Pasta raiz</span>
            <span className="summary-value" style={{ fontSize: 13, marginTop: 3 }}>
              {result.rootNode.path}
            </span>
          </div>
        </div>
      )}

      {/* ── Painel principal ────────────────────────────────────────────────── */}
      <div className="main-area">
        <div className="tree-panel">

          {/* Cabeçalhos das colunas */}
          {result && (
            <div className="col-headers">
              <div className="col-head">Nome</div>
              <div className="col-head right">Tamanho</div>
              <div className="col-head right">Arquivos</div>
              <div className="col-head right">%</div>
            </div>
          )}

          {/* Área de rolagem da árvore */}
          <div className="tree-scroll">
            {!result && !isAnalyzing && (
              <div className="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6C3 4.9 3.9 4 5 4h14c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V6z"
                    stroke="#ccc" strokeWidth="1"/>
                  <path d="M3 10h18" stroke="#ccc" strokeWidth="1"/>
                </svg>
                <p>Informe um caminho e clique em <strong style={{ color: '#ccc' }}>▶ Analisar</strong></p>
              </div>
            )}

            {result && rows.map((row) => {
              const pct = row.parentSize > 0
                ? (row.node.sizeBytes / row.parentSize) * 100
                : 0
              const rootPct = rootSize > 0
                ? (row.node.sizeBytes / rootSize) * 100
                : 0
              const barW = Math.max(2, Math.min(80, rootPct * 0.8))
              const color = barColor(row.colorIdx)

              return (
                <div
                  key={row.node.id}
                  className={`tree-row${selectedId === row.node.id ? ' selected' : ''}`}
                  onClick={() => setSelectedId(row.node.id)}
                  onDoubleClick={() => handleToggle(row.node)}
                >
                  {/* Nome */}
                  <div className="tree-cell">
                    <div
                      className="name-cell"
                      style={{ paddingLeft: row.depth * 16 }}
                    >
                      <span
                        className={`toggle-btn ${!row.node.isDirectory || !row.node.hasChildren ? 'leaf' : row.isExpanded ? 'open' : ''}`}
                        onClick={e => { e.stopPropagation(); handleToggle(row.node) }}
                      >
                        ▶
                      </span>
                      <span className="node-icon">
                        {row.node.isDirectory ? (row.isExpanded ? '📂' : '📁') : '📄'}
                      </span>
                      <span className="node-name">{row.node.name}</span>
                    </div>
                  </div>

                  {/* Tamanho + barra */}
                  <div className="tree-cell right">
                    <div className="size-bar-wrap">
                      <div
                        className="size-bar"
                        style={{ width: barW, background: color }}
                      />
                      <span className="size-label">{formatBytes(row.node.sizeBytes)}</span>
                    </div>
                  </div>

                  {/* Arquivos */}
                  <div className="tree-cell right">
                    {row.node.fileCount > 0 ? row.node.fileCount.toLocaleString('pt-BR') : '—'}
                  </div>

                  {/* % */}
                  <div className="tree-cell right">
                    {pct > 0 ? `${pct.toFixed(1)}%` : '—'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Status bar ──────────────────────────────────────────────────────── */}
      <div className={`statusbar ${backendStatus.state}`}>
        <span className="statusbar-item">
          <StatusDot state={backendStatus.state} />
          {backendStatus.state === 'ready' ? 'Serviço pronto' : backendStatus.message}
        </span>
        {result && (
          <span className="statusbar-item right">
            {rows.length} itens  ·  {formatBytes(result.totalSizeBytes)}  ·  {result.totalFileCount.toLocaleString('pt-BR')} arquivos
          </span>
        )}
      </div>

    </div>
  )
}

// ── Sub-componentes pequenos ──────────────────────────────────────────────────

function Spinner() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  )
}

function StatusDot({ state }: { state: string }) {
  const color = state === 'ready' ? '#4ec9b0' : state === 'error' ? '#f44747' : '#cca700'
  return (
    <svg width="8" height="8" viewBox="0 0 8 8">
      <circle cx="4" cy="4" r="3.5" fill={color} />
    </svg>
  )
}
