import type { ProgressInfo } from '../types/directory'
import {
  Message,
  MessageCount,
  ProgressFill,
  ProgressTrack,
} from './AnalysisProgress.styles'

interface AnalysisProgressProps {
  isAnalyzing: boolean
  progress: ProgressInfo | null
}

export default function AnalysisProgress({ isAnalyzing, progress }: AnalysisProgressProps) {
  const percentage = progress && progress.total > 0
    ? Math.round((progress.completed / progress.total) * 100)
    : 0

  return (
    <>
      <ProgressTrack $isAnalyzing={isAnalyzing}>
        <ProgressFill $isAnalyzing={isAnalyzing} $percentage={percentage} />
      </ProgressTrack>
      {(isAnalyzing || progress) && (
        <Message>
          <span>{progress?.message ?? 'Preparando análise…'}</span>
          {progress && progress.total > 0 && (
            <MessageCount>
              {progress.completed} / {progress.total}
            </MessageCount>
          )}
        </Message>
      )}
    </>
  )
}
