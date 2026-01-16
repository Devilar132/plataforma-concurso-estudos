# 🚀 Guia de Hospedagem Gratuita

Este guia mostra como hospedar sua plataforma de estudos gratuitamente usando serviços modernos e confiáveis.

## 📋 Opções Recomendadas

### **Opção 1: Vercel (Frontend) + Railway (Backend) + Supabase (Banco)** ⭐ RECOMENDADO

#### **Frontend - Vercel** (Gratuito)
- ✅ Deploy automático do GitHub
- ✅ HTTPS automático
- ✅ CDN global
- ✅ Sempre gratuito para projetos pessoais

**Passos:**
1. Faça push do código para GitHub
2. Acesse [vercel.com](https://vercel.com)
3. Conecte seu repositório
4. Configure:
   - **Build Command**: `cd client && npm install && npm run build`
   - **Output Directory**: `client/build`
   - **Install Command**: `cd client && npm install`

#### **Backend - Railway** (Gratuito com créditos)
- ✅ $5 créditos grátis/mês (suficiente para começar)
- ✅ Deploy automático
- ✅ Variáveis de ambiente fáceis
- ✅ Suporta Node.js nativamente

**Passos:**
1. Acesse [railway.app](https://railway.app)
2. Conecte GitHub
3. New Project → Deploy from GitHub
4. Selecione o repositório
5. Configure:
   - **Root Directory**: `server`
   - **Start Command**: `npm start`
   - Adicione variáveis de ambiente (se necessário)

#### **Banco de Dados - Supabase** (Gratuito)
- ✅ PostgreSQL gratuito (500MB)
- ✅ 2GB de transferência/mês
- ✅ API REST automática
- ✅ Dashboard completo

**Passos:**
1. Acesse [supabase.com](https://supabase.com)
2. Crie um projeto
3. Copie a connection string
4. Configure no Railway como variável de ambiente:
   - `DATABASE_URL=postgresql://...`

---

### **Opção 2: Render (Tudo em um lugar)** ⭐ MAIS SIMPLES

#### **Frontend + Backend no Render** (Gratuito)
- ✅ Deploy automático do GitHub
- ✅ HTTPS automático
- ✅ PostgreSQL gratuito incluído
- ⚠️ Serviços gratuitos "dormem" após 15min de inatividade

**Passos:**

1. **Backend:**
   - Acesse [render.com](https://render.com)
   - New → Web Service
   - Conecte GitHub
   - Configure:
     - **Name**: `plataforma-concurso-backend`
     - **Root Directory**: `server`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Environment**: `Node`

2. **Frontend:**
   - New → Static Site
   - Conecte GitHub
   - Configure:
     - **Root Directory**: `client`
     - **Build Command**: `npm install && npm run build`
     - **Publish Directory**: `build`

3. **Banco de Dados:**
   - New → PostgreSQL
   - Copie a connection string
   - Configure no backend como `DATABASE_URL`

---

### **Opção 3: Netlify (Frontend) + Fly.io (Backend)** ⭐ MAIS FLEXÍVEL

#### **Frontend - Netlify** (Gratuito)
- ✅ Deploy automático
- ✅ HTTPS automático
- ✅ Formulários e funções serverless

**Passos:**
1. Acesse [netlify.com](https://netlify.com)
2. New site from Git
3. Configure build:
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `build`

#### **Backend - Fly.io** (Gratuito)
- ✅ 3 VMs grátis compartilhadas
- ✅ Deploy via CLI
- ✅ Suporta PostgreSQL

**Passos:**
1. Instale Fly CLI: `npm install -g @fly/cli`
2. Login: `fly auth login`
3. No diretório `server`: `fly launch`
4. Configure PostgreSQL: `fly postgres create`

---

## 🔧 Preparação do Código

### 1. Criar arquivo `.env.example`

```env
# Backend
PORT=5000
JWT_SECRET=seu_jwt_secret_aqui
NODE_ENV=production

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@host:port/database

# Frontend (ajustar URL da API)
REACT_APP_API_URL=https://seu-backend.railway.app
```

### 2. Atualizar `server/index.js` para usar PostgreSQL

```javascript
// Adicionar suporte a PostgreSQL
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
```

### 3. Criar script de build para produção

**`server/package.json`:**
```json
{
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "migrate": "node database/migrate-to-postgres.js"
  }
}
```

### 4. Atualizar `client/src/services/api.js` (ou similar)

```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
```

---

## 📝 Checklist de Deploy

### Antes de fazer deploy:

- [ ] Testar localmente (`npm start` no backend e frontend)
- [ ] Criar arquivo `.env` com variáveis de ambiente
- [ ] Fazer commit e push para GitHub
- [ ] Verificar se `package.json` tem script `start`
- [ ] Configurar CORS no backend para aceitar o domínio do frontend
- [ ] Migrar banco de dados SQLite para PostgreSQL (se necessário)

### Variáveis de ambiente necessárias:

**Backend:**
- `PORT` (geralmente 5000 ou automático)
- `JWT_SECRET` (uma string aleatória segura)
- `DATABASE_URL` (connection string do PostgreSQL)
- `NODE_ENV=production`

**Frontend:**
- `REACT_APP_API_URL` (URL do backend em produção)

---

## 🎯 Recomendação Final

**Para começar rápido:** Use **Render** (Opção 2)
- Mais simples
- Tudo em um lugar
- PostgreSQL incluído
- ⚠️ Serviços "dormem" após inatividade (primeira requisição pode demorar)

**Para produção séria:** Use **Vercel + Railway + Supabase** (Opção 1)
- Mais confiável
- Sem "sleep"
- Melhor performance
- Mais configuração inicial

---

## 🔗 Links Úteis

- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Render Docs](https://render.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Netlify Docs](https://docs.netlify.com)
- [Fly.io Docs](https://fly.io/docs)

---

## ⚠️ Limitações dos Planos Gratuitos

- **Render**: Serviços "dormem" após 15min (primeira requisição pode demorar ~30s)
- **Railway**: $5 créditos/mês (pode acabar se usar muito)
- **Vercel**: 100GB bandwidth/mês (geralmente suficiente)
- **Supabase**: 500MB de banco (pode migrar depois)

---

## 🆘 Troubleshooting

### Backend não conecta ao banco
- Verifique `DATABASE_URL` nas variáveis de ambiente
- Certifique-se que o banco aceita conexões externas
- Verifique SSL (alguns serviços exigem)

### Frontend não encontra API
- Verifique `REACT_APP_API_URL` no build
- Configure CORS no backend
- Verifique se o backend está rodando

### Build falha
- Verifique logs de build
- Certifique-se que `package.json` tem todas as dependências
- Verifique se o Node.js version está correto

---

**Dica:** Comece com Render para testar, depois migre para Vercel + Railway quando precisar de mais performance!
