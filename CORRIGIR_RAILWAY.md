# 🔧 Corrigir Erro de Deploy no Railway

## ❌ Problema
O Railway está tentando fazer `npm ci` na raiz do projeto, mas deveria estar usando o diretório `server`.

## ✅ Solução: Configurar Root Directory Corretamente

### No Railway:

1. **Acesse seu projeto no Railway**
2. **Clique no serviço do backend** (não o frontend!)
3. Vá em **"Settings"** → **"Source"**
4. Configure:
   - **Root Directory**: `server` ⚠️ **MUITO IMPORTANTE!**
5. Vá em **"Settings"** → **"Build"**
6. Configure:
   - **Build Command**: Deixe **VAZIO** (ou `npm install`)
   - **NÃO use** `npm ci` - use `npm install`
7. Vá em **"Settings"** → **"Deploy"**
8. Configure:
   - **Start Command**: `npm start`

### ⚠️ IMPORTANTE:

- **Root Directory DEVE ser `server`** - isso faz o Railway trabalhar apenas no diretório do servidor
- Se você criou um serviço para o frontend no Railway, **DELETE-O** - o frontend vai no Vercel!
- Você deve ter **APENAS UM serviço no Railway** - o backend

### Verificar se está correto:

1. No Railway, vá em **"Settings"** → **"Source"**
2. **Root Directory** deve mostrar: `server`
3. Se mostrar `/` ou vazio, **corrija para `server`**

---

## 🔄 Forçar Novo Deploy

Após corrigir as configurações:

1. No Railway, vá em **"Deployments"**
2. Clique nos **"..."** do último deploy
3. Selecione **"Redeploy"**
4. Ou faça um novo commit (qualquer mudança) e o Railway vai fazer deploy automático

---

## ✅ Checklist

- [ ] Root Directory configurado como `server`
- [ ] Build Command vazio ou `npm install` (não `npm ci`)
- [ ] Start Command: `npm start`
- [ ] Apenas um serviço no Railway (backend)
- [ ] Frontend vai no Vercel (não no Railway)

---

**Depois de corrigir, o deploy deve funcionar! 🚀**
