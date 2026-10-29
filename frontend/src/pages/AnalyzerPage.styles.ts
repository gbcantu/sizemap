import styled from 'styled-components'
import { colors } from '../styles/theme'

export const PageShell = styled.main`
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
  overflow: hidden;
  background: ${colors.page};
`

export const MainArea = styled.section`
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 20px 24px 24px;

  @media (max-width: 700px) {
    padding: 12px;
  }
`
