import type { DirectoryAnalysisResult } from '../types/directory'
import { Card, Cards, Label, Value } from './SummaryCards.styles'

interface SummaryCardsProps {
  result: DirectoryAnalysisResult
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export default function SummaryCards({ result }: SummaryCardsProps) {
  return (
    <Cards>
      <Card>
        <Label>Tamanho total</Label>
        <Value>{formatBytes(result.totalSizeBytes)}</Value>
      </Card>
      <Card>
        <Label>Arquivos analisados</Label>
        <Value>{result.totalFileCount.toLocaleString('pt-BR')}</Value>
      </Card>
      <Card $wide>
        <Label>Pasta analisada</Label>
        <Value title={result.rootNode.path}>{result.rootNode.path}</Value>
      </Card>
    </Cards>
  )
}
