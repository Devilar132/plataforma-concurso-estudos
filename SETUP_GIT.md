# 🚀 Setup do Repositório Git - Passo a Passo

## 1️⃣ Inicializar o Repositório Git

Execute os comandos abaixo no terminal (PowerShell) na pasta do projeto:

```powershell
# Navegar para a pasta do projeto
cd "c:\Users\HTDOCS\Desktop\Plataforma de concurso"

# Inicializar repositório Git
git init

# Adicionar todos os arquivos
git add .

# Fazer o primeiro commit
git commit -m "Initial commit: Plataforma de estudos completa"
```

## 2️⃣ Criar Repositório no GitHub

1. Acesse [github.com](https://github.com) e faça login
2. Clique no botão **"+"** no canto superior direito → **"New repository"**
3. Configure:
   - **Repository name**: `plataforma-concurso-estudos` (ou o nome que preferir)
   - **Description**: "Plataforma de acompanhamento de estudos e metas diárias"
   - **Visibility**: Public (ou Private, sua escolha)
   - ⚠️ **NÃO marque** "Initialize with README" (já temos arquivos)
4. Clique em **"Create repository"**

## 3️⃣ Conectar Repositório Local com GitHub

Após criar o repositório no GitHub, você verá instruções. Execute:

```powershell
# Adicionar o repositório remoto (substitua SEU_USUARIO pelo seu username do GitHub)
git remote add origin https://github.com/SEU_USUARIO/plataforma-concurso-estudos.git

# Renomear branch principal para main (se necessário)
git branch -M main

# Fazer push do código
git push -u origin main
```

## 4️⃣ Configurar Deploy no Vercel (Frontend)

1. Acesse [vercel.com](https://vercel.com) e faça login com GitHub
2. Clique em **"Add New..."** → **"Project"**
3. Selecione o repositório que você acabou de criar
4. Configure o projeto:
   - **Framework Preset**: Create React App
   - **Root Directory**: `client` (clique em "Edit" e defina)
   - **Build Command**: `npm run build` (já vem preenchido)
   - **Output Directory**: `build` (já vem preenchido)
   - **Install Command**: `npm install` (já vem preenchido)
5. Adicione **Environment Variable**:
   - **Name**: `REACT_APP_API_URL`
   - **Value**: `https://seu-backend.railway.app/api` (você vai atualizar depois com a URL do Railway)
6. Clique em **"Deploy"**
7. Aguarde o deploy (pode demorar alguns minutos)
8. **Copie a URL** do frontend (ex: `https://plataforma-concurso.vercel.app`)

## 5️⃣ Configurar Deploy no Railway (Backend)

1. Acesse [railway.app](https://railway.app) e faça login com GitHub
2. Clique em **"New Project"**
3. Selecione **"Deploy from GitHub repo"**
4. Escolha o repositório que você criou
5. Railway vai detectar automaticamente, mas configure:
   - **Root Directory**: `server`
   - **Start Command**: `npm start`
6. Clique nos **"..."** do serviço → **"Variables"**
7. Adicione as variáveis de ambiente:
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = (gere uma string aleatória segura, ex: `openssl rand -hex 32`)
   - `DATABASE_URL` = (vamos configurar depois com Supabase)
8. Clique em **"Settings"** → **"Generate Domain"** para obter a URL
9. **Copie a URL** do backend (ex: `https://plataforma-concurso-backend.railway.app`)

## 6️⃣ Configurar Banco de Dados (Supabase)

1. Acesse [supabase.com](https://supabase.com) e faça login
2. Clique em **"New Project"**
3. Configure:
   - **Name**: `plataforma-concurso-db`
   - **Database Password**: (anote essa senha!)
   - **Region**: Escolha a mais próxima (ex: South America)
4. Aguarde a criação do projeto (~2 minutos)
5. Vá em **"Settings"** → **"Database"**
6. Role até **"Connection string"** → **"URI"**
7. **Copie a connection string** (formato: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`)
8. Volte ao Railway:
   - Adicione a variável `DATABASE_URL` com a connection string copiada
9. No Railway, vá em **"Deployments"** → clique no último deploy → **"View Logs"**
10. Verifique se o servidor iniciou corretamente

## 7️⃣ Inicializar Banco de Dados PostgreSQL

Após o backend estar rodando no Railway:

1. No Railway, clique no serviço → **"View Logs"**
2. Verifique se há erros de conexão com o banco
3. Se necessário, execute a migração:
   - No Railway, vá em **"Settings"** → **"Connect"** → **"Open Shell"**
   - Execute:
   ```bash
   cd server
   node database/init-postgres.js
   ```

## 8️⃣ Atualizar URL da API no Vercel

1. Volte ao Vercel
2. Vá em seu projeto → **"Settings"** → **"Environment Variables"**
3. Atualize `REACT_APP_API_URL` com a URL do Railway:
   - `https://seu-backend.railway.app/api`
4. Vá em **"Deployments"** → clique nos **"..."** do último deploy → **"Redeploy"**

## 9️⃣ Testar Tudo

1. Acesse a URL do frontend (Vercel)
2. Teste criar uma conta
3. Teste fazer login
4. Teste criar uma meta
5. Teste registrar horas de estudo

## ✅ Checklist Final

- [ ] Repositório Git inicializado
- [ ] Código commitado e no GitHub
- [ ] Frontend deployado no Vercel
- [ ] Backend deployado no Railway
- [ ] Banco PostgreSQL criado no Supabase
- [ ] Variáveis de ambiente configuradas
- [ ] Schema do banco inicializado
- [ ] Frontend conectando com backend
- [ ] Tudo funcionando!

---

## 🆘 Problemas Comuns

### Git não está instalado
- Baixe em: [git-scm.com](https://git-scm.com/download/win)
- Instale e reinicie o terminal

### Erro ao fazer push
- Verifique se você está autenticado no GitHub
- Use: `git config --global user.name "Seu Nome"`
- Use: `git config --global user.email "seu@email.com"`

### Backend não inicia no Railway
- Verifique os logs no Railway
- Certifique-se que `DATABASE_URL` está configurado
- Verifique se `package.json` tem script `start`

### Frontend não conecta ao backend
- Verifique `REACT_APP_API_URL` no Vercel
- Certifique-se que a URL termina com `/api`
- Verifique CORS no backend

---

**Pronto para começar! 🚀**
