import styled, { keyframes } from 'styled-components'
import { colors } from '../styles/theme'

const indeterminate = keyframes`
  from { transform: translateX(-110%); }
  to { transform: translateX(430%); }
`

export const ProgressTrack = styled.div<{ $isAnalyzing: boolean }>`
  height: 3px;
  flex-shrink: 0;
  overflow: hidden;
  background: ${({ $isAnalyzing }) => $isAnalyzing ? colors.accentSoft : colors.border};
`

export const ProgressFill = styled.div<{ $isAnalyzing: boolean; $percentage: number }>`
  width: ${({ $isAnalyzing, $percentage }) => $isAnalyzing ? '30%' : `${$percentage}%`};
  height: 100%;
  border-radius: 0 3px 3px 0;
  background: ${colors.accent};
  transition: width 250ms ease;
  animation: ${({ $isAnalyzing }) => $isAnalyzing ? indeterminate : 'none'} 1.4s ease-in-out infinite;
`

export const Message = styled.div`
  display: flex;
  min-height: 38px;
  align-items: center;
  gap: 12px;
  padding: 0 28px;
  border-bottom: 1px solid ${colors.border};
  background: ${colors.surface};
  color: ${colors.textMuted};
  font-size: 12px;
`

export const MessageCount = styled.span`
  margin-left: auto;
  color: ${colors.textSubtle};
  font-variant-numeric: tabular-nums;
`
