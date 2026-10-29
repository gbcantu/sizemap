import styled from 'styled-components'
import { colors } from '../styles/theme'

export const Cards = styled.section`
  display: grid;
  width: min(100% - 48px, 1432px);
  grid-template-columns: 1fr 1fr 2fr;
  gap: 14px;
  flex-shrink: 0;
  margin: 22px auto 0;

  @media (max-width: 700px) {
    width: calc(100% - 24px);
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 12px;
  }
`

export const Card = styled.div<{ $wide?: boolean }>`
  display: flex;
  min-width: 0;
  min-height: 90px;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  padding: 16px 18px;
  border: 1px solid ${colors.border};
  border-radius: 12px;
  background: ${colors.surface};
  box-shadow: 0 2px 6px rgb(15 23 42 / 3%);

  @media (max-width: 700px) {
    grid-column: ${({ $wide }) => $wide ? '1 / -1' : 'auto'};
    min-height: 76px;
    padding: 12px 14px;
  }
`

export const Label = styled.span`
  color: ${colors.textMuted};
  font-size: 11px;
  font-weight: 650;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`

export const Value = styled.span`
  overflow: hidden;
  color: ${colors.text};
  font-size: 20px;
  font-weight: 650;
  letter-spacing: -0.4px;
  text-overflow: ellipsis;
  white-space: nowrap;

  ${Card}:last-child & {
    font-size: 14px;
    font-weight: 550;
    letter-spacing: 0;
  }
`
