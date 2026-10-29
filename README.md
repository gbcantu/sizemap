<p align="center">
  <img src="assets/belagio-sizemap-banner.png" alt="BELAGIO-stock" width="100%" />
</p>

# SizeMap

Aplicativo desktop para analisar o espaço ocupado por diretórios. A interface é
feita com React, TypeScript e Electron; o serviço de análise é escrito em Python
e se comunica com o Electron por mensagens JSON.

## Recursos

- Analisa uma pasta local e mostra o tamanho total e a quantidade de arquivos.
- Apresenta os itens do primeiro nível com tamanho, proporção e barras visuais.
- Permite escolher a pasta pelo seletor do sistema ou informar seu caminho.
- Exibe o progresso da análise e permite interrompê-la.

## Requisitos

- Node.js 20 ou superior e npm.
- Python 3.10 ou superior.

O backend usa apenas a biblioteca padrão do Python. Não é necessário instalar
pacotes Python para executar em modo de desenvolvimento.

## Executar em desenvolvimento

Na raiz do projeto, instale as dependências e inicie a aplicação:

```bash
cd frontend
npm ci
npm run dev
```

O comando inicia o servidor do Vite e o Electron. O backend Python é iniciado
automaticamente pelo Electron. Se o Python não estiver no `PATH`, defina
`DIRECTORY_ANALYZER_PYTHON` com o caminho do interpretador antes de iniciar.

Para gerar apenas os arquivos estáticos da interface:

```bash
cd frontend
npm run build:vite
```

## Estrutura

```text
backend/   Serviço Python e lógica de análise
frontend/  Interface React e aplicação Electron
```

## Limitações conhecidas

A análise inicial calcula a pasta raiz e seus itens de primeiro nível. A
expansão de níveis adicionais ainda não está implementada no backend. A
listagem de compartilhamentos de rede usa o comando `net view` do Windows.
