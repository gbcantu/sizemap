import type { DirectoryNode, DirectoryAnalysisResult } from '../types/directory'
import { chartColors } from '../styles/theme'
import {
  ColumnHeader,
  EmptyDescription,
  EmptyIcon,
  EmptyState,
  EmptyTitle,
  TableHeader,
  TreePanel,
  TreeRow,
  TreeScroll,
  TreeCell,
  NameCell,
  ToggleButton,
  NodeIcon,
  NodeName,
  SizeBar,
  SizeBarTrack,
  SizeValue,
} from './DirectoryTree.styles'

interface FlatRow {
  node: DirectoryNode
  depth: number
  colorIndex: number
  isExpanded: boolean
  parentSize: number
}

interface DirectoryTreeProps {
  isAnalyzing: boolean
  result: DirectoryAnalysisResult | null
  rows: FlatRow[]
  selectedId: string | null
  onSelect: (id: string) => void
  onToggle: (node: DirectoryNode) => void
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export default function DirectoryTree({
  isAnalyzing,
  result,
  rows,
  selectedId,
  onSelect,
  onToggle,
}: DirectoryTreeProps) {
  return (
    <TreePanel>
      {result && (
        <TableHeader>
          <ColumnHeader>Nome</ColumnHeader>
          <ColumnHeader $right>Tamanho</ColumnHeader>
          <ColumnHeader $right>Arquivos</ColumnHeader>
          <ColumnHeader $right>%</ColumnHeader>
        </TableHeader>
      )}
      <TreeScroll>
        {!result && !isAnalyzing && (
          <EmptyState>
            <EmptyIcon aria-hidden="true">
              <svg viewBox="0 0 48 48" fill="none">
                <path d="M7 15h13l4 4h17v18H7z" />
                <path d="M7 15v-5h13l4 5" />
              </svg>
            </EmptyIcon>
            <EmptyTitle>Comece por uma pasta</EmptyTitle>
            <EmptyDescription>
              Informe o caminho ou use “Explorar” para escolher um diretório.
            </EmptyDescription>
          </EmptyState>
        )}
        {result && rows.map((row) => {
          const parentPercentage = row.parentSize > 0
            ? (row.node.sizeBytes / row.parentSize) * 100
            : 0
          const rootPercentage = result.rootNode.sizeBytes > 0
            ? (row.node.sizeBytes / result.rootNode.sizeBytes) * 100
            : 0
          const barWidth = Math.max(2, Math.min(80, rootPercentage * 0.8))

          return (
            <TreeRow
              key={row.node.id}
              $selected={selectedId === row.node.id}
              onClick={() => onSelect(row.node.id)}
              onDoubleClick={() => onToggle(row.node)}
            >
              <TreeCell>
                <NameCell style={{ paddingLeft: row.depth * 20 }}>
                  <ToggleButton
                    $open={row.isExpanded}
                    $visible={row.node.isDirectory && row.node.hasChildren}
                    aria-label={row.isExpanded ? 'Recolher pasta' : 'Expandir pasta'}
                    onClick={(event) => {
                      event.stopPropagation()
                      onToggle(row.node)
                    }}
                  >
                    ›
                  </ToggleButton>
                  <NodeIcon aria-hidden="true">
                    {row.node.isDirectory ? (row.isExpanded ? '📂' : '📁') : '📄'}
                  </NodeIcon>
                  <NodeName title={row.node.name}>{row.node.name}</NodeName>
                </NameCell>
              </TreeCell>
              <TreeCell $right>
                <SizeBarTrack>
                  <SizeBar
                    style={{
                      width: `${barWidth}%`,
                      background: chartColors[row.colorIndex % chartColors.length],
                    }}
                  />
                  <SizeValue>{formatBytes(row.node.sizeBytes)}</SizeValue>
                </SizeBarTrack>
              </TreeCell>
              <TreeCell $right>
                {row.node.fileCount > 0 ? row.node.fileCount.toLocaleString('pt-BR') : '—'}
              </TreeCell>
              <TreeCell $right>
                {parentPercentage > 0 ? `${parentPercentage.toFixed(1)}%` : '—'}
              </TreeCell>
            </TreeRow>
          )
        })}
      </TreeScroll>
    </TreePanel>
  )
}
