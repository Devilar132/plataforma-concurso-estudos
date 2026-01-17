# 🗄️ Guia Completo: Instalar Cliente PostgreSQL

## 📋 O que você precisa

Para acessar o banco PostgreSQL do Railway, você precisa de um **cliente PostgreSQL**, não do Stack Builder.

O **Stack Builder** é apenas para instalar ferramentas adicionais. Você pode **cancelar** essa janela.

---

## ✅ Opção 1: DBeaver (Recomendado - Mais Fácil)

### Passo 1: Baixar DBeaver

1. Acesse: https://dbeaver.io/download/
2. Clique em **"Windows Installer"** (versão Community - gratuita)
3. Baixe o arquivo `.exe`

### Passo 2: Instalar DBeaver

1. Execute o arquivo baixado
2. Clique em **"Next"** nas telas
3. Aceite os termos
4. Escolha o local de instalação (pode deixar padrão)
5. Clique em **"Install"**
6. Aguarde a instalação
7. Clique em **"Finish"**

### Passo 3: Obter dados de conexão do Railway

1. Acesse https://railway.app
2. Entre no seu projeto
3. Clique no serviço **PostgreSQL** (ou o banco de dados)
4. Vá em **Variables** (ou **Settings** → **Variables**)
5. Copie o valor de `DATABASE_URL`

A string será algo como:
```
postgresql://postgres:senha@containers-us-west-xxx.railway.app:5432/railway
```

### Passo 4: Conectar no DBeaver

1. Abra o **DBeaver**
2. Na tela inicial, clique em **"Nova Conexão"** (ícone de plug)
3. Selecione **"PostgreSQL"**
4. Clique em **"Next"**

#### Preencher dados de conexão:

**Opção A: Usar DATABASE_URL completa**
- Cole a `DATABASE_URL` completa no campo especial (se houver)
- Clique em **"Test Connection"**

**Opção B: Preencher manualmente** (extrair da DATABASE_URL)

Exemplo de DATABASE_URL:
```
postgresql://postgres:ABC123@containers-us-west-123.railway.app:5432/railway
```

Preencha:
- **Host**: `containers-us-west-123.railway.app`
- **Port**: `5432`
- **Database**: `railway`
- **Username**: `postgres`
- **Password**: `ABC123` (a senha da URL)

5. Clique em **"Test Connection"**
6. Se pedir para baixar driver, clique em **"Download"** e aguarde
7. Se aparecer **"Connected"**, clique em **"Finish"**

### Passo 5: Explorar o banco

1. No painel esquerdo, expanda sua conexão
2. Expanda **"Databases"** → **"railway"** → **"Schemas"** → **"public"** → **"Tables"**
3. Você verá as tabelas:
   - `users`
   - `study_sessions`
   - `goals`
   - `achievements`
   - etc.

### Passo 6: Executar queries

1. Clique com botão direito na conexão
2. Selecione **"SQL Editor"** → **"New SQL Script"**
3. Digite sua query, por exemplo:
   ```sql
   SELECT * FROM users;
   ```
4. Pressione **Ctrl+Enter** (ou clique no botão ▶️) para executar

---

## ✅ Opção 2: pgAdmin (Interface Oficial)

### Passo 1: Baixar pgAdmin

1. Acesse: https://www.pgadmin.org/download/pgadmin-4-windows/
2. Baixe o instalador Windows
3. Execute e instale (Next, Next, Install)

### Passo 2: Conectar

1. Abra **pgAdmin**
2. Clique com botão direito em **"Servers"**
3. Selecione **"Create"** → **"Server"**
4. Na aba **"General"**:
   - **Name**: `Railway Production`
5. Na aba **"Connection"**:
   - **Host**: (extrair da DATABASE_URL)
   - **Port**: `5432`
   - **Database**: `railway`
   - **Username**: `postgres`
   - **Password**: (senha da DATABASE_URL)
6. Clique em **"Save"**

---

## ✅ Opção 3: Via Railway Dashboard (Mais Simples)

Se você só quer ver os dados rapidamente:

1. Acesse https://railway.app
2. Entre no seu projeto
3. Clique no serviço **PostgreSQL**
4. Vá em **"Data"** → **"Query"**
5. Digite sua query SQL
6. Clique em **"Run"**

---

## ✅ Opção 4: Via Supabase (Se estiver usando)

1. Acesse https://supabase.com
2. Entre no seu projeto
3. No menu lateral, clique em **"SQL Editor"**
4. Digite sua query
5. Clique em **"Run"**

---

## 🔍 Queries Úteis para Começar

### Ver todos os usuários
```sql
SELECT id, name, email, created_at 
FROM users 
ORDER BY created_at DESC;
```

### Ver sessões de estudo
```sql
SELECT 
  s.id,
  s.date,
  s.minutes,
  s.hours,
  s.subject,
  u.name as user_name,
  u.email
FROM study_sessions s
JOIN users u ON s.user_id = u.id
ORDER BY s.date DESC
LIMIT 20;
```

### Ver total de minutos por usuário
```sql
SELECT 
  u.name,
  u.email,
  SUM(s.minutes) as total_minutos,
  ROUND(SUM(s.minutes) / 60.0, 2) as total_horas
FROM users u
LEFT JOIN study_sessions s ON u.id = s.user_id
GROUP BY u.id, u.name, u.email
ORDER BY total_minutos DESC;
```

### Encontrar usuário específico
```sql
SELECT * FROM users WHERE email = 'recruta132senhor@gmail.com';
```

### Ver sessões de um usuário
```sql
SELECT * FROM study_sessions 
WHERE user_id = (SELECT id FROM users WHERE email = 'recruta132senhor@gmail.com')
ORDER BY date DESC;
```

---

## ⚠️ Importante

1. **Não compartilhe** a `DATABASE_URL` - ela contém senha
2. **Backup antes de modificar** dados em produção
3. **Teste queries** antes de executar UPDATE ou DELETE
4. **Senhas são hasheadas** - não é possível ver senhas originais

---

## 🎯 Recomendação

Para começar rápido, use a **Opção 3 (Railway Dashboard)** ou **Opção 1 (DBeaver)**.

O DBeaver é melhor para uso contínuo porque:
- Interface mais amigável
- Permite salvar queries
- Tem autocomplete
- Permite editar dados visualmente

---

## ❓ Problemas Comuns

### "Connection refused"
- Verifique se a `DATABASE_URL` está correta
- Verifique se o Railway está rodando

### "Authentication failed"
- Verifique usuário e senha na `DATABASE_URL`
- A senha pode ter caracteres especiais - copie exatamente

### "Database does not exist"
- Verifique o nome do database na `DATABASE_URL`
- Geralmente é `railway` ou `postgres`

---

**Pronto! Agora você pode acessar e gerenciar seu banco de dados PostgreSQL! 🚀**
