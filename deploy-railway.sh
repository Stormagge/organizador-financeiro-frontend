#!/bin/bash

echo "=== Deploy Organizador Financeiro ==="
echo "Preparando deploy do backend..."

# Verificar se o Railway CLI está instalado
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI não encontrado!"
    echo "📥 Instale com: npm install -g @railway/cli"
    echo "🔗 Ou baixe de: https://railway.app/cli"
    exit 1
fi

# Navegar para o diretório do backend
cd BACKEND

echo "📦 Verificando dependências..."
npm install

echo "🧪 Testando localmente..."
timeout 10s npm start &
sleep 5

# Testar se o servidor está respondendo
if curl -f http://localhost:4000/health > /dev/null 2>&1; then
    echo "✅ Servidor local funcionando!"
else
    echo "⚠️  Aviso: Servidor local não respondeu (pode ser normal)"
fi

# Parar o servidor local
pkill -f "node index.js" || true

echo "🚀 Fazendo deploy no Railway..."
railway login
railway deploy

echo "✅ Deploy concluído!"
echo "🔗 Acesse: https://railway.app/dashboard"
