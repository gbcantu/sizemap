import styled, { keyframes } from 'styled-components'
import { colors } from '../styles/theme'

const spin = keyframes`
  to { transform: rotate(360deg); }
`

export const Header = styled.header`
  flex-shrink: 0;
  border-bottom: 1px solid ${colors.border};
  background: ${colors.surface};
  box-shadow: 0 1px 3px rgb(15 23 42 / 4%);
`

export const ToolbarContent = styled.div`
  display: flex;
  width: min(100%, 1480px);
  min-height: 76px;
  align-items: center;
  gap: 24px;
  margin: 0 auto;
  padding: 14px 28px;

  @media (max-width: 760px) {
    flex-wrap: wrap;
    gap: 12px;
    padding: 14px 16px;
  }
`

export const Brand = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 10px;
  color: ${colors.text};
  font-size: 19px;
  font-weight: 750;
  letter-spacing: -0.6px;
`

export const BrandMark = styled.div`
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 12px;
  background: ${colors.accentSoft};
  color: ${colors.accent};

  svg {
    width: 23px;
    height: 23px;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 1.7;
  }
`

export const PathInput = styled.input`
  width: 100%;
  min-width: 100px;
  height: 42px;
  flex: 1;
  padding: 0 14px;
  border: 1px solid ${colors.borderStrong};
  border-radius: 9px;
  outline: none;
  background: ${colors.surfaceSubtle};
  color: ${colors.text};
  font-size: 13px;
  transition: border-color 140ms ease, box-shadow 140ms ease;

  &::placeholder {
    color: ${colors.textSubtle};
  }

  &:focus {
    border-color: ${colors.accent};
    box-shadow: 0 0 0 3px ${colors.accentSoft};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }

  @media (max-width: 760px) {
    order: 2;
    flex-basis: 100%;
  }
`

export const Actions = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;

  @media (max-width: 760px) {
    margin-left: auto;
  }
`

const Button = styled.button`
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 13px;
  border: 1px solid transparent;
  border-radius: 9px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  transition: background 140ms ease, border-color 140ms ease, color 140ms ease;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  svg {
    width: 17px;
    height: 17px;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 1.8;
  }
`

export const BrowseButton = styled(Button)`
  border-color: ${colors.borderStrong};
  background: ${colors.surface};
  color: ${colors.textMuted};

  &:hover:not(:disabled) {
    border-color: ${colors.accent};
    background: ${colors.accentSoft};
    color: ${colors.accent};
  }

  @media (max-width: 500px) {
    span {
      display: none;
    }
  }
`

export const AnalyzeButton = styled(Button)`
  background: ${colors.accent};
  color: white;

  &:hover:not(:disabled) {
    background: ${colors.accentHover};
  }

  svg circle {
    stroke: rgb(255 255 255 / 40%);
    stroke-width: 2;
  }

  svg path {
    stroke: white;
    stroke-linecap: round;
    stroke-width: 2;
  }

  svg[viewBox="0 0 20 20"] path {
    fill: currentColor;
    stroke: none;
  }

  svg[viewBox="0 0 20 20"]:has(circle) {
    animation: ${spin} 900ms linear infinite;
  }
`

export const CancelButton = styled(Button)`
  border-color: #fecaca;
  background: ${colors.dangerSoft};
  color: ${colors.danger};

  &:hover {
    background: #fee2e2;
  }
`
