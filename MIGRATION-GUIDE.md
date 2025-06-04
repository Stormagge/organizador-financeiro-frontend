# 🚀 Migração do Render para Railway

## Por que Railway é melhor que Render?

### ❌ Problemas do Render:
- **Cold Starts**: Serviço "hiberna" após inatividade (15+ segundos para acordar)
- **Timeouts frequentes**: Conexões lentas e instáveis
- **Configuração complexa**: Requer configuração manual no dashboard
- **Logs limitados**: Difícil debugar problemas
- **Free tier restritivo**: Apenas 750 horas/mês

### ✅ Vantagens do Railway:
- **Sempre ativo**: Sem cold starts significativos
- **Deploy automático**: Conecta direto ao GitHub
- **Logs em tempo real**: Melhor debugging
- **Configuração simples**: Arquivo de config opcional
- **Free tier generoso**: $5 de crédito mensal
- **Performance superior**: Infraestrutura mais rápida

## 📋 Passo a Passo da Migração

### 1. Instalar Railway CLI
```powershell
npm install -g @railway/cli
```

### 2. Fazer Login no Railway
```powershell
railway login
```

### 3. Criar Novo Projeto
```powershell
cd BACKEND
railway init
```

### 4. Configurar Variáveis de Ambiente
No dashboard do Railway (https://railway.app/dashboard):
- Vá em seu projeto
- Clique em "Variables"
- Adicione:
  - `NODE_ENV=production`
  - `PORT` (será automaticamente definida pelo Railway)

### 5. Upload do Firebase Service Account
- No Railway dashboard, vá em "Settings" > "Files"
- Upload do arquivo `firebase-service-account.json`
- Ou configure via variável de ambiente (JSON em uma linha)

### 6. Deploy
```powershell
railway deploy
```

### 7. Obter URL do Deploy
```powershell
railway status
```

### 8. Atualizar Frontend
Substitua a URL do Render pela nova URL do Railway no arquivo `.env`:
```
VITE_API_URL=https://sua-nova-url.railway.app
```

## 🔧 Configuração Automática

O projeto já está preparado com:
- ✅ `Dockerfile` otimizado
- ✅ `railway.toml` configurado
- ✅ `package.json` atualizado
- ✅ Health checks implementados
- ✅ Logs melhorados

## 🧪 Testando a Migração

1. **Teste local primeiro**:
```powershell
cd BACKEND
npm start
```

2. **Teste o health check**:
```powershell
curl http://localhost:4000/health
```

3. **Deploy no Railway**:
```powershell
railway deploy
```

4. **Teste o deploy**:
```powershell
curl https://sua-url.railway.app/health
```

## 📊 Monitoramento

Railway oferece:
- **Logs em tempo real**
- **Métricas de performance**
- **Alertas automáticos**
- **Restart automático** em caso de crash

## 💰 Custos

Railway Free Tier:
- **$5 de crédito/mês** (≈ 500 horas de execução)
- **1GB RAM**
- **1GB storage**
- **Domínio customizado gratuito**

Muito mais generoso que o Render!

## 🔄 Rollback (se necessário)

Se algo der errado, você pode voltar para o Render temporariamente:
```
VITE_API_URL=https://organizador-financeiro-backend.onrender.com
```

## ⚡ Próximos Passos

1. Execute este comando para começar a migração:
```powershell
.\deploy-railway.ps1
```

2. Ou siga o processo manual acima
3. Atualize o frontend com a nova URL
4. Teste todas as funcionalidades
5. Delete o serviço do Render quando tudo estiver funcionando
