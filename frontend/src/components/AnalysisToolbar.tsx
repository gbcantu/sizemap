import type { KeyboardEvent } from 'react'
import type { BackendRuntimeStatus } from '../types/directory'
import {
  Actions,
  AnalyzeButton,
  BrowseButton,
  Brand,
  BrandMark,
  CancelButton,
  Header,
  PathInput,
  ToolbarContent,
} from './AnalysisToolbar.styles'

interface AnalysisToolbarProps {
  backendStatus: BackendRuntimeStatus
  isAnalyzing: boolean
  path: string
  onAnalyze: () => void
  onBrowse: () => void
  onCancel: () => void
  onPathChange: (path: string) => void
}

export default function AnalysisToolbar({
  backendStatus,
  isAnalyzing,
  path,
  onAnalyze,
  onBrowse,
  onCancel,
  onPathChange,
}: AnalysisToolbarProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') onAnalyze()
  }

  return (
    <Header>
      <ToolbarContent>
        <Brand>
          <BrandMark aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M3.5 7.5h6l2 2h9v9h-17z" />
              <path d="M3.5 7.5v-2h6l2 2" />
            </svg>
          </BrandMark>
          <span>SizeMap</span>
        </Brand>

        <PathInput
          aria-label="Caminho do diretório"
          value={path}
          onChange={(event) => onPathChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Informe o caminho da pasta para analisar"
          disabled={isAnalyzing}
          spellCheck={false}
        />

        <Actions>
          <BrowseButton onClick={onBrowse} disabled={isAnalyzing} title="Selecionar pasta">
            <FolderIcon />
            <span>Explorar</span>
          </BrowseButton>
          <AnalyzeButton
            onClick={onAnalyze}
            disabled={isAnalyzing || backendStatus.state !== 'ready'}
          >
            {isAnalyzing ? <Spinner /> : <PlayIcon />}
            <span>{isAnalyzing ? 'Analisando' : 'Analisar'}</span>
          </AnalyzeButton>
          {isAnalyzing && <CancelButton onClick={onCancel}>Parar</CancelButton>}
        </Actions>
      </ToolbarContent>
    </Header>
  )
}

function FolderIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path d="M2.5 5.5h5l1.7 1.8h8.3v7.2H2.5z" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path d="m7 4.5 8 5.5-8 5.5z" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7" />
      <path d="M10 3a7 7 0 0 1 7 7" />
    </svg>
  )
}
