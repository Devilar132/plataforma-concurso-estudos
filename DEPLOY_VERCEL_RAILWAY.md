# 🚀 Deploy no Vercel + Railway - Passo a Passo

## ✅ Status Atual
- [x] Repositório Git inicializado
- [x] Código commitado
- [x] Código no GitHub: `https://github.com/Devilar132/plataforma-concurso-estudos`

---

## 1️⃣ Deploy do Backend no Railway

### Passo 1: Criar Projeto no Railway
1. Acesse [railway.app](https://railway.app)
2. Faça login com GitHub
3. Clique em **"New Project"**
4. Selecione **"Deploy from GitHub repo"**
5. Escolha o repositório: `Devilar132/plataforma-concurso-estudos`

### Passo 2: Configurar o Serviço
1. Railway vai detectar automaticamente, mas **clique no serviço** para configurar
2. Vá em **"Settings"** → **"Root Directory"**
3. Defina: `server`
4. Vá em **"Settings"** → **"Start Command"**
5. Defina: `npm start`

### Passo 3: Variáveis de Ambiente
1. Clique nos **"..."** do serviço → **"Variables"**
2. Adicione as seguintes variáveis:

```
NODE_ENV = production
JWT_SECRET = (gere uma string aleatória - pode usar: openssl rand -hex 32)
```

**Para gerar JWT_SECRET:**
- No PowerShell: `[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))`
- Ou use um gerador online: https://randomkeygen.com/

### Passo 4: Obter URL do Backend
1. Vá em **"Settings"** → **"Generate Domain"**
2. Railway vai gerar uma URL como: `https://plataforma-concurso-backend.railway.app`
3. **COPIE ESSA URL** - você vai precisar depois!

### Passo 5: Verificar Deploy
1. Vá em **"Deployments"** → clique no último deploy
2. Clique em **"View Logs"**
3. Verifique se aparece: `🚀 Servidor rodando na porta...`
4. Se aparecer erro, verifique os logs

---

## 2️⃣ Criar Banco de Dados (Supabase)

### Passo 1: Criar Projeto
1. Acesse [supabase.com](https://supabase.com)
2. Faça login (pode usar GitHub)
3. Clique em **"New Project"**
4. Configure:
   - **Name**: `plataforma-concurso-db`
   - **Database Password**: (ANOTE ESSA SENHA!)
   - **Region**: Escolha a mais próxima (ex: South America - São Paulo)
5. Clique em **"Create new project"**
6. Aguarde ~2 minutos para criação

### Passo 2: Obter Connection String
1. Após criar, vá em **"Settings"** (ícone de engrenagem) → **"Database"**
2. Role até **"Connection string"**
3. Clique na aba **"URI"**
4. **COPIE a connection string** (formato: `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`)
5. **IMPORTANTE**: Substitua `[PASSWORD]` pela senha que você anotou!

### Passo 3: Adicionar DATABASE_URL no Railway
1. Volte ao Railway
2. Vá em **"Variables"** do seu serviço
3. Adicione:
   ```
   DATABASE_URL = (cole a connection string do Supabase)
   ```
4. Railway vai fazer redeploy automaticamente

### Passo 4: Inicializar Banco de Dados
1. No Railway, vá em **"Deployments"** → último deploy → **"View Logs"**
2. Verifique se o servidor iniciou sem erros
3. Se aparecer erro de tabelas, vamos inicializar:
   - No Railway, vá em **"Settings"** → **"Connect"** → **"Open Shell"**
   - Execute:
   ```bash
   cd server
   node database/init-postgres.js
   ```
4. Ou aguarde - o código deve inicializar automaticamente na primeira execução

---

## 3️⃣ Deploy do Frontend no Vercel

### Passo 1: Criar Projeto
1. Acesse [vercel.com](https://vercel.com)
2. Faça login com GitHub
3. Clique em **"Add New..."** → **"Project"**
4. Selecione o repositório: `Devilar132/plataforma-concurso-estudos`

### Passo 2: Configurar Build
1. **Framework Preset**: Deixe como "Create React App" (detecta automaticamente)
2. Clique em **"Edit"** ao lado de **"Root Directory"**
3. Defina: `client`
4. **Build Command**: `npm run build` (já vem preenchido)
5. **Output Directory**: `build` (já vem preenchido)
6. **Install Command**: `npm install` (já vem preenchido)

### Passo 3: Variáveis de Ambiente
1. Role até **"Environment Variables"**
2. Clique em **"Add"**
3. Adicione:
   - **Name**: `REACT_APP_API_URL`
   - **Value**: `https://seu-backend.railway.app/api` (use a URL do Railway que você copiou!)
4. Clique em **"Save"**

### Passo 4: Deploy
1. Clique em **"Deploy"**
2. Aguarde o build (pode demorar 2-5 minutos)
3. Quando terminar, **copie a URL** do frontend (ex: `https://plataforma-concurso.vercel.app`)

---

## 4️⃣ Atualizar CORS no Backend

Após ter a URL do frontend (Vercel):

1. Volte ao Railway
2. Vá em **"Variables"**
3. Adicione:
   ```
   FRONTEND_URL = https://sua-url-do-vercel.vercel.app
   ```
4. Railway vai fazer redeploy automaticamente

---

## 5️⃣ Testar Tudo

1. **Acesse a URL do frontend** (Vercel)
2. **Teste criar uma conta**
3. **Teste fazer login**
4. **Teste criar uma meta**
5. **Teste registrar horas de estudo**

---

## 🆘 Troubleshooting

### Backend não inicia
- Verifique logs no Railway
- Certifique-se que `DATABASE_URL` está correto
- Verifique se `JWT_SECRET` está definido

### Frontend não conecta ao backend
- Verifique `REACT_APP_API_URL` no Vercel
- Certifique-se que termina com `/api`
- Verifique CORS no backend (deve aceitar a URL do Vercel)

### Erro de banco de dados
- Verifique se `DATABASE_URL` está correto no Railway
- Certifique-se que substituiu `[PASSWORD]` na connection string
- Verifique se o banco foi inicializado (veja logs)

### Build do frontend falha
- Verifique logs no Vercel
- Certifique-se que `REACT_APP_API_URL` está configurado
- Verifique se todas as dependências estão no `package.json`

---

## ✅ Checklist Final

- [ ] Backend deployado no Railway
- [ ] Variáveis de ambiente configuradas no Railway
- [ ] Banco PostgreSQL criado no Supabase
- [ ] `DATABASE_URL` configurado no Railway
- [ ] Banco inicializado (verificar logs)
- [ ] Frontend deployado no Vercel
- [ ] `REACT_APP_API_URL` configurado no Vercel
- [ ] CORS configurado no backend
- [ ] Tudo testado e funcionando!

---

**Pronto! Sua plataforma está no ar! 🎉**
