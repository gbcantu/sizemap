import type { BackendRuntimeStatus, DirectoryAnalysisResult } from '../types/directory'
import {
  Dot,
  Item,
  StatusBar,
  StatusMessage,
  Summary,
} from './BackendStatusBar.styles'

interface BackendStatusBarProps {
  backendStatus: BackendRuntimeStatus
  result: DirectoryAnalysisResult | null
  visibleRowCount: number
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export default function BackendStatusBar({
  backendStatus,
  result,
  visibleRowCount,
}: BackendStatusBarProps) {
  const statusText = backendStatus.state === 'ready'
    ? 'Serviço pronto'
    : backendStatus.message

  return (
    <StatusBar $state={backendStatus.state}>
      <Item>
        <Dot $state={backendStatus.state} />
        <StatusMessage>{statusText}</StatusMessage>
      </Item>
      {result && (
        <Summary>
          {visibleRowCount} itens visíveis <span>·</span> {formatBytes(result.totalSizeBytes)}
          <span>·</span> {result.totalFileCount.toLocaleString('pt-BR')} arquivos
        </Summary>
      )}
    </StatusBar>
  )
}
