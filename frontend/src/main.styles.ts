import { createGlobalStyle } from 'styled-components'
import { colors } from './styles/theme'

export const GlobalStyles = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
  }

  html, body, #root {
    width: 100%;
    height: 100%;
    margin: 0;
  }

  body {
    overflow: hidden;
    background: ${colors.page};
    color: ${colors.text};
    color-scheme: light;
    font-family: Inter, "Segoe UI", system-ui, -apple-system, sans-serif;
    font-size: 14px;
    -webkit-font-smoothing: antialiased;
  }

  button, input {
    font: inherit;
  }

  button {
    color: inherit;
  }

  ::selection {
    color: ${colors.accent};
    background: ${colors.accentSoft};
  }
`
