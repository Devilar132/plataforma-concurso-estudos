# 🚀 Deploy Rápido - Passo a Passo

## Opção Mais Rápida: Render (Tudo em um lugar)

### 1️⃣ Preparar o Código

1. **Criar arquivo `.env` no servidor** (opcional para desenvolvimento local):
```env
PORT=5000
JWT_SECRET=seu_jwt_secret_aqui
NODE_ENV=production
```

2. **Fazer commit e push para GitHub**:
```bash
git add .
git commit -m "Preparar para deploy"
git push origin main
```

### 2️⃣ Deploy no Render

#### **A. Criar Banco de Dados PostgreSQL**

1. Acesse [render.com](https://render.com) e faça login com GitHub
2. Clique em **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `plataforma-concurso-db`
   - **Database**: `plataforma_concurso`
   - **User**: `plataforma_user`
   - **Plan**: Free
4. Clique em **"Create Database"**
5. **Copie a "Internal Database URL"** (você vai precisar depois)

#### **B. Deploy do Backend**

1. Clique em **"New +"** → **"Web Service"**
2. Conecte seu repositório GitHub
3. Configure:
   - **Name**: `plataforma-concurso-backend`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Adicione **Environment Variables**:
   - `NODE_ENV` = `production`
   - `PORT` = `5000` (ou deixe vazio, Render define automaticamente)
   - `JWT_SECRET` = (gere uma string aleatória segura)
   - `DATABASE_URL` = (cole a Internal Database URL do passo A)
5. Clique em **"Create Web Service"**
6. **Aguarde o deploy** (pode demorar alguns minutos)
7. **Copie a URL** do serviço (ex: `https://plataforma-concurso-backend.onrender.com`)

#### **C. Deploy do Frontend**

1. Clique em **"New +"** → **"Static Site"**
2. Conecte seu repositório GitHub
3. Configure:
   - **Name**: `plataforma-concurso-frontend`
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`
4. Adicione **Environment Variable**:
   - `REACT_APP_API_URL` = `https://plataforma-concurso-backend.onrender.com/api`
   - (Use a URL do backend que você copiou no passo B)
5. Clique em **"Create Static Site"**
6. **Aguarde o build** (pode demorar alguns minutos)

### 3️⃣ Migrar Banco de Dados

Após o backend estar rodando:

1. Acesse o **Shell** do serviço backend no Render
2. Execute:
```bash
cd server
node database/migrate-to-postgres.js
```

Ou crie um script de migração automática no primeiro deploy.

### 4️⃣ Testar

1. Acesse a URL do frontend (ex: `https://plataforma-concurso-frontend.onrender.com`)
2. Teste criar uma conta
3. Teste fazer login
4. Verifique se tudo está funcionando

---

## ⚠️ Importante

### Limitações do Plano Gratuito do Render:

- **Serviços "dormem" após 15 minutos de inatividade**
- Primeira requisição após dormir pode demorar ~30 segundos
- Isso é normal e não afeta a funcionalidade

### Para Evitar o "Sleep":

- Use **Railway** ou **Fly.io** (mais complexo)
- Ou faça upgrade para plano pago no Render ($7/mês)

---

## 🔧 Troubleshooting

### Backend não inicia
- Verifique os logs no Render
- Certifique-se que `DATABASE_URL` está configurado
- Verifique se a porta está correta

### Frontend não conecta ao backend
- Verifique `REACT_APP_API_URL` no build
- Certifique-se que o backend está rodando
- Verifique CORS no backend

### Erro de banco de dados
- Verifique se a migração foi executada
- Certifique-se que `DATABASE_URL` está correto
- Verifique se o PostgreSQL está ativo no Render

---

## 📝 Checklist Final

- [ ] Backend deployado e rodando
- [ ] Frontend deployado e rodando
- [ ] Banco de dados criado
- [ ] Migração executada
- [ ] Variáveis de ambiente configuradas
- [ ] Testado criar conta
- [ ] Testado fazer login
- [ ] Testado criar metas
- [ ] Testado registrar horas

**Pronto! Sua plataforma está no ar! 🎉**
