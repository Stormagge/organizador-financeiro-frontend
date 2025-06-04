# PowerShell Script para Deploy no Railway
Write-Host "=== Deploy Organizador Financeiro ===" -ForegroundColor Cyan
Write-Host "Preparando deploy do backend..." -ForegroundColor Yellow

# Verificar se o Railway CLI está instalado
if (!(Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Railway CLI não encontrado!" -ForegroundColor Red
    Write-Host "📥 Instale com: npm install -g @railway/cli" -ForegroundColor Green
    Write-Host "🔗 Ou baixe de: https://railway.app/cli" -ForegroundColor Green
    exit 1
}

# Navegar para o diretório do backend
Push-Location -Path "BACKEND"

Write-Host "📦 Verificando dependências..." -ForegroundColor Yellow
npm install

Write-Host "🧪 Testando localmente..." -ForegroundColor Yellow
Start-Process -FilePath "npm" -ArgumentList "start" -NoNewWindow -PassThru | Out-Null
Start-Sleep -Seconds 5

# Testar se o servidor está respondendo
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4000/health" -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Servidor local funcionando!" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Aviso: Servidor local não respondeu (pode ser normal)" -ForegroundColor Yellow
}

# Parar processos do Node.js
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "🚀 Fazendo deploy no Railway..." -ForegroundColor Cyan
railway login
railway deploy

Write-Host "✅ Deploy concluído!" -ForegroundColor Green
Write-Host "🔗 Acesse: https://railway.app/dashboard" -ForegroundColor Blue

Pop-Location
