import { useCallback, useEffect, useMemo, useState } from 'react'
import AnalysisProgress from '../components/AnalysisProgress'
import AnalysisToolbar from '../components/AnalysisToolbar'
import BackendStatusBar from '../components/BackendStatusBar'
import DirectoryTree from '../components/DirectoryTree'
import SummaryCards from '../components/SummaryCards'
import { directoryService } from '../services/directoryService'
import type {
  BackendRuntimeStatus,
  DirectoryAnalysisResult,
  DirectoryNode,
  ProgressInfo,
} from '../types/directory'
import { MainArea, PageShell } from './AnalyzerPage.styles'

interface FlatRow {
  node: DirectoryNode
  depth: number
  colorIndex: number
  isExpanded: boolean
  parentSize: number
}

export default function AnalyzerPage() {
  const [backendStatus, setBackendStatus] = useState<BackendRuntimeStatus>({
    state: 'starting',
    message: 'Aguardando serviço Python...',
  })
  const [progress, setProgress] = useState<ProgressInfo | null>(null)
  const [pathInput, setPathInput] = useState('')
  const [result, setResult] = useState<DirectoryAnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [nodeCache, setNodeCache] = useState<Map<string, DirectoryNode>>(new Map())

  useEffect(() => {
    const unsubscribeStatus = directoryService.onBackendStatus(setBackendStatus)
    const unsubscribeProgress = directoryService.onProgress(setProgress)
    directoryService.getBackendStatus().then(setBackendStatus).catch(() => undefined)

    return () => {
      unsubscribeStatus()
      unsubscribeProgress()
    }
  }, [])

  useEffect(() => {
    if (!result) return

    const nodes = new Map<string, DirectoryNode>()
    nodes.set(result.rootNode.id, result.rootNode)
    result.childNodes.forEach((node) => nodes.set(node.id, node))
    setNodeCache(nodes)
    setExpanded(new Set([result.rootNode.id]))
  }, [result])

  const rows = useMemo(() => {
    if (!result) return []

    const flattenedRows: FlatRow[] = []
    const rootSize = result.rootNode.sizeBytes || 1

    function walk(node: DirectoryNode, depth: number, colorIndex: number, parentSize: number) {
      flattenedRows.push({
        node,
        depth,
        colorIndex,
        isExpanded: expanded.has(node.id),
        parentSize,
      })

      if (!expanded.has(node.id)) return

      const children = node.children
        .map((childId) => nodeCache.get(childId))
        .filter((child): child is DirectoryNode => Boolean(child))
        .sort((a, b) => b.sizeBytes - a.sizeBytes)

      children.forEach((child, index) => {
        walk(child, depth + 1, depth === 0 ? index : colorIndex, node.sizeBytes || 1)
      })
    }

    walk(result.rootNode, 0, 0, rootSize)
    return flattenedRows
  }, [expanded, nodeCache, result])

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
      const analysis = await directoryService.analyzeDirectory({
        path,
        throttleMs: 0,
        maxDepth: 1,
      })
      setResult(analysis)
    } catch (error) {
      alert(error instanceof Error ? error.message : String(error))
    } finally {
      setIsAnalyzing(false)
      setProgress(null)
    }
  }, [pathInput])

  const handleCancel = async () => {
    await directoryService.cancelOperation().catch(() => undefined)
    setIsAnalyzing(false)
    setProgress(null)
  }

  const handleBrowse = async () => {
    const selectedPath = await window.directoryAnalyzer.chooseDirectory()
    if (selectedPath) setPathInput(selectedPath)
  }

  const handleToggle = useCallback(async (node: DirectoryNode) => {
    if (!node.isDirectory) return

    if (expanded.has(node.id)) {
      setExpanded((current) => {
        const next = new Set(current)
        next.delete(node.id)
        return next
      })
      return
    }

    setExpanded((current) => new Set(current).add(node.id))

    if (node.hasChildren && node.children.length === 0) {
      try {
        const response = await directoryService.expandNode(node.id)
        setNodeCache((current) => {
          const next = new Map(current)
          const parent = next.get(node.id)
          if (parent) {
            next.set(node.id, {
              ...parent,
              children: response.children.map((child) => child.id),
              hasChildren: response.children.length > 0,
            })
          }
          response.children.forEach((child) => next.set(child.id, child))
          return next
        })
      } catch (error) {
        alert(error instanceof Error ? error.message : String(error))
      }
    }
  }, [expanded])

  return (
    <PageShell>
      <AnalysisToolbar
        backendStatus={backendStatus}
        isAnalyzing={isAnalyzing}
        path={pathInput}
        onAnalyze={handleAnalyze}
        onBrowse={handleBrowse}
        onCancel={handleCancel}
        onPathChange={setPathInput}
      />
      <AnalysisProgress isAnalyzing={isAnalyzing} progress={progress} />
      {result && <SummaryCards result={result} />}
      <MainArea>
        <DirectoryTree
          isAnalyzing={isAnalyzing}
          result={result}
          rows={rows}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onToggle={handleToggle}
        />
      </MainArea>
      <BackendStatusBar
        backendStatus={backendStatus}
        result={result}
        visibleRowCount={rows.length}
      />
    </PageShell>
  )
}
