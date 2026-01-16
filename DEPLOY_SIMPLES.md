# 🚀 Deploy Simples - Vercel + Railway

## ✅ Status
- [x] Código no GitHub: `https://github.com/Devilar132/plataforma-concurso-estudos`

---

## 🎯 Estratégia: Começar Simples, Escalar Depois

**Para começar rápido**, vamos usar:
- **SQLite no Railway** (funciona perfeitamente para começar)
- Depois migramos para PostgreSQL quando precisar escalar

---

## 1️⃣ Deploy Backend no Railway

### Passo 1: Criar Projeto
1. Acesse [railway.app](https://railway.app)
2. Login com GitHub
3. **"New Project"** → **"Deploy from GitHub repo"**
4. Selecione: `Devilar132/plataforma-concurso-estudos`

### Passo 2: Configurar
1. Railway vai detectar automaticamente
2. Clique no serviço → **"Settings"** → **"Source"**
3. Configure:
   - **Root Directory**: `server` ⚠️ **MUITO IMPORTANTE!**
4. Vá em **"Settings"** → **"Build"**
5. Configure:
   - **Build Command**: Deixe **VAZIO** ou `npm install` (NÃO use `npm ci`)
6. Vá em **"Settings"** → **"Deploy"**
7. Configure:
   - **Start Command**: `npm start`
8. Vá em **"Variables"** → Adicione:
   ```
   NODE_ENV = production
   JWT_SECRET = (gere uma string aleatória - pode usar: https://randomkeygen.com/)
   ```
9. **"Settings"** → **"Generate Domain"** → Copie a URL

**⚠️ IMPORTANTE:** 
- O **Root Directory DEVE ser `server`** - isso faz o Railway trabalhar apenas no diretório do servidor
- Se você criou um serviço para o frontend no Railway, **DELETE-O** - o frontend vai no Vercel!
- Você deve ter **APENAS UM serviço no Railway** - o backend

**✅ Backend pronto!** (Usando SQLite por enquanto - funciona perfeitamente)

---

## 2️⃣ Deploy Frontend no Vercel

### Passo 1: Criar Projeto
1. Acesse [vercel.com](https://vercel.com)
2. Login com GitHub
3. **"Add New..."** → **"Project"**
4. Selecione: `Devilar132/plataforma-concurso-estudos`

### Passo 2: Configurar
1. **Framework**: Create React App (detecta automaticamente)
2. Clique **"Edit"** em **"Root Directory"** → Defina: `client`
3. **Build Command**: `npm run build` ✅
4. **Output Directory**: `build` ✅
5. **Environment Variables** → Adicione:
   ```
   REACT_APP_API_URL = https://sua-url-do-railway.railway.app/api
   ```
   (Use a URL do Railway que você copiou)
6. Clique **"Deploy"**

**✅ Frontend pronto!**

---

## 3️⃣ Atualizar CORS

1. Volte ao Railway
2. **"Variables"** → Adicione:
   ```
   FRONTEND_URL = https://sua-url-do-vercel.vercel.app
   ```
3. Railway faz redeploy automático

---

## 4️⃣ Testar

1. Acesse a URL do Vercel
2. Crie uma conta
3. Faça login
4. Teste criar metas e registrar horas

**🎉 Pronto! Está no ar!**

---

## 📝 Migrar para PostgreSQL Depois (Opcional)

Quando precisar escalar:

1. Crie projeto no [Supabase](https://supabase.com)
2. Copie a connection string
3. Adicione `DATABASE_URL` no Railway
4. Execute: `node server/database/init-postgres.js` no Railway Shell
5. Pronto! Agora usa PostgreSQL

---

**Dica:** SQLite funciona perfeitamente para começar. Migre para PostgreSQL quando tiver muitos usuários ou precisar de mais recursos!
