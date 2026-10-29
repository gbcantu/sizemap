#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"

if ! command -v npm >/dev/null 2>&1; then
    echo "Erro: npm não encontrado. Instale o Node.js para executar o SizeMap." >&2
    exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
    echo "Erro: Python 3 não encontrado. Instale o Python 3 para executar o backend." >&2
    exit 1
fi

if [[ ! -x "$FRONTEND_DIR/node_modules/.bin/electron" || ! -x "$FRONTEND_DIR/node_modules/.bin/vite" ]]; then
    echo "Erro: dependências do frontend não encontradas em frontend/node_modules." >&2
    echo "Instale-as uma vez com 'cd frontend && npm ci' e execute este script novamente." >&2
    exit 1
fi

cd "$FRONTEND_DIR"

echo "Compilando os scripts do Electron..."
npm run build:electron-scripts

echo "Iniciando o SizeMap..."
exec npm run dev
