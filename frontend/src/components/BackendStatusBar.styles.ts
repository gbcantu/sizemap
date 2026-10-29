import styled from 'styled-components'
import type { BackendRuntimeStatus } from '../types/directory'
import { colors } from '../styles/theme'

type BackendState = BackendRuntimeStatus['state']

export const StatusBar = styled.footer<{ $state: BackendState }>`
  display: flex;
  min-height: 42px;
  align-items: center;
  gap: 16px;
  padding: 0 28px;
  border-top: 1px solid ${colors.border};
  background: ${colors.surface};
  color: ${colors.textMuted};
  font-size: 11px;

  @media (max-width: 700px) {
    padding: 0 14px;
  }
`

export const Item = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
`

export const Dot = styled.span<{ $state: BackendState }>`
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border-radius: 50%;
  background: ${({ $state }) => (
    $state === 'ready' ? colors.success
      : $state === 'error' ? colors.danger
        : colors.warning
  )};
  box-shadow: 0 0 0 3px ${({ $state }) => (
    $state === 'ready' ? colors.successSoft
      : $state === 'error' ? colors.dangerSoft
        : colors.warningSoft
  )};
`

export const StatusMessage = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

export const Summary = styled.span`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  color: ${colors.textSubtle};

  span {
    color: ${colors.borderStrong};
  }

  @media (max-width: 600px) {
    display: none;
  }
`
