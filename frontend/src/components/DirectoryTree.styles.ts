import styled from 'styled-components'
import { colors } from '../styles/theme'

export const TreePanel = styled.div`
  display: flex;
  width: min(100%, 1432px);
  min-height: 0;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
  margin: 0 auto;
  border: 1px solid ${colors.border};
  border-radius: 12px;
  background: ${colors.surface};
  box-shadow: 0 2px 8px rgb(15 23 42 / 4%);
`

export const TableHeader = styled.div`
  display: grid;
  min-height: 44px;
  grid-template-columns: minmax(180px, 1fr) 170px 120px 82px;
  flex-shrink: 0;
  border-bottom: 1px solid ${colors.border};
  background: ${colors.surfaceSubtle};

  @media (max-width: 700px) {
    grid-template-columns: minmax(130px, 1fr) 110px 72px 56px;
  }
`

export const ColumnHeader = styled.div<{ $right?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${({ $right }) => $right ? 'flex-end' : 'flex-start'};
  padding: 0 14px;
  color: ${colors.textMuted};
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;

  @media (max-width: 700px) {
    padding: 0 8px;
  }
`

export const TreeScroll = styled.div`
  min-height: 0;
  flex: 1;
  overflow: auto;

  &::-webkit-scrollbar {
    width: 9px;
    height: 9px;
  }

  &::-webkit-scrollbar-thumb {
    border: 2px solid ${colors.surface};
    border-radius: 8px;
    background: ${colors.borderStrong};
  }
`

export const TreeRow = styled.div<{ $selected: boolean }>`
  display: grid;
  min-height: 42px;
  grid-template-columns: minmax(180px, 1fr) 170px 120px 82px;
  align-items: center;
  border-bottom: 1px solid ${colors.border};
  background: ${({ $selected }) => $selected ? colors.accentSoft : colors.surface};
  cursor: pointer;
  transition: background 100ms ease;

  &:hover {
    background: ${({ $selected }) => $selected ? '#e5efff' : colors.surfaceSubtle};
  }

  @media (max-width: 700px) {
    grid-template-columns: minmax(130px, 1fr) 110px 72px 56px;
  }
`

export const TreeCell = styled.div<{ $right?: boolean }>`
  min-width: 0;
  overflow: hidden;
  padding: 0 14px;
  color: ${({ $right }) => $right ? colors.textMuted : colors.text};
  font-size: 12px;
  text-align: ${({ $right }) => $right ? 'right' : 'left'};
  text-overflow: ellipsis;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;

  @media (max-width: 700px) {
    padding: 0 8px;
  }
`

export const NameCell = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
`

export const ToggleButton = styled.button<{ $open: boolean; $visible: boolean }>`
  display: grid;
  width: 18px;
  height: 22px;
  flex-shrink: 0;
  place-items: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: ${colors.textSubtle};
  cursor: ${({ $visible }) => $visible ? 'pointer' : 'default'};
  font-size: 21px;
  line-height: 1;
  opacity: ${({ $visible }) => $visible ? 1 : 0};
  transform: rotate(${({ $open }) => $open ? '90deg' : '0deg'});
  transition: color 120ms ease, transform 120ms ease;

  &:hover {
    color: ${colors.accent};
  }
`

export const NodeIcon = styled.span`
  flex-shrink: 0;
  font-size: 15px;
`

export const NodeName = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

export const SizeBarTrack = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 9px;
`

export const SizeBar = styled.div`
  min-width: 2px;
  height: 7px;
  flex-shrink: 0;
  border-radius: 5px;
  opacity: 0.8;
  transition: width 180ms ease;
`

export const SizeValue = styled.span`
  min-width: 54px;
  color: ${colors.textMuted};
  font-size: 11px;
  text-align: right;
`

export const EmptyState = styled.div`
  display: flex;
  height: 100%;
  min-height: 280px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  text-align: center;
`

export const EmptyIcon = styled.div`
  display: grid;
  width: 64px;
  height: 64px;
  place-items: center;
  margin-bottom: 16px;
  border-radius: 20px;
  background: ${colors.accentSoft};
  color: ${colors.accent};

  svg {
    width: 36px;
    height: 36px;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 1.6;
  }
`

export const EmptyTitle = styled.h2`
  margin: 0 0 6px;
  color: ${colors.text};
  font-size: 16px;
  font-weight: 650;
`

export const EmptyDescription = styled.p`
  max-width: 360px;
  margin: 0;
  color: ${colors.textMuted};
  font-size: 13px;
  line-height: 1.6;
`
