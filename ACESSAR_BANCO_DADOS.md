# 🗄️ Como Acessar o Banco de Dados

## 📋 Verificar qual banco está sendo usado

O sistema usa **SQLite** em desenvolvimento e **PostgreSQL** em produção (Railway).

---

## 🔧 SQLite (Desenvolvimento Local)

### Localização do arquivo
```
Plataforma de concurso/database.sqlite
```

### Opção 1: Usar DB Browser for SQLite (Recomendado)

1. **Baixar**: https://sqlitebrowser.org/
2. **Instalar** o DB Browser for SQLite
3. **Abrir** o arquivo `database.sqlite` na raiz do projeto
4. **Navegar** pelas tabelas:
   - `users` - Usuários cadastrados
   - `study_sessions` - Sessões de estudo
   - `goals` - Metas
   - `achievements` - Conquistas
   - `streak_freezes` - Proteções de sequência
   - `streak_recoveries` - Recuperações de sequência
   - `milestones` - Marcos de progresso
   - `user_settings` - Configurações do usuário

### Opção 2: Via linha de comando

```bash
# Instalar sqlite3 (se não tiver)
# Windows: via chocolatey ou baixar de https://www.sqlite.org/download.html
# Linux/Mac: já vem instalado

# Acessar o banco
cd "c:\Users\HTDOCS\Desktop\Plataforma de concurso"
sqlite3 database.sqlite

# Comandos úteis:
.tables                    # Listar todas as tabelas
.schema users              # Ver estrutura da tabela users
SELECT * FROM users;       # Ver todos os usuários
SELECT * FROM study_sessions;  # Ver todas as sessões
.quit                      # Sair
```

### Exemplos de queries úteis

```sql
-- Ver todos os usuários
SELECT id, name, email, created_at FROM users;

-- Ver sessões de estudo de um usuário específico
SELECT * FROM study_sessions WHERE user_id = 1 ORDER BY date DESC;

-- Ver total de minutos estudados por usuário
SELECT 
  u.name,
  u.email,
  SUM(s.minutes) as total_minutos,
  ROUND(SUM(s.minutes) / 60.0, 2) as total_horas
FROM users u
LEFT JOIN study_sessions s ON u.id = s.user_id
GROUP BY u.id, u.name, u.email;

-- Ver metas de um usuário
SELECT * FROM goals WHERE user_id = 1 ORDER BY date DESC;
```

---

## 🐘 PostgreSQL (Produção - Railway)

### Opção 1: Via Railway Dashboard

1. Acesse https://railway.app
2. Entre no seu projeto
3. Vá em **PostgreSQL** (ou o serviço do banco)
4. Clique em **Data** → **Query**
5. Execute queries SQL diretamente

### Opção 2: Via Supabase Dashboard (se estiver usando Supabase)

1. Acesse https://supabase.com
2. Entre no seu projeto
3. Vá em **SQL Editor**
4. Execute queries SQL

### Opção 3: Via cliente PostgreSQL (psql, DBeaver, pgAdmin)

#### Obter a string de conexão:

1. No **Railway**:
   - Vá no serviço PostgreSQL
   - Clique em **Variables**
   - Copie o valor de `DATABASE_URL`

2. A string será algo como:
   ```
   postgresql://user:password@host:port/database
   ```

#### Usar DBeaver (Recomendado - Interface Gráfica)

1. **Baixar**: https://dbeaver.io/download/
2. **Instalar** DBeaver
3. **Criar nova conexão**:
   - Tipo: PostgreSQL
   - Host: (extrair da DATABASE_URL)
   - Port: (extrair da DATABASE_URL, geralmente 5432)
   - Database: (extrair da DATABASE_URL)
   - Username: (extrair da DATABASE_URL)
   - Password: (extrair da DATABASE_URL)
4. **Testar conexão** e conectar
5. **Navegar** pelas tabelas

#### Usar psql (Linha de comando)

```bash
# Instalar PostgreSQL client (se não tiver)
# Windows: https://www.postgresql.org/download/windows/
# Linux: sudo apt-get install postgresql-client
# Mac: brew install postgresql

# Conectar usando a DATABASE_URL
psql "postgresql://user:password@host:port/database"

# Ou conectar separadamente
psql -h host -p port -U user -d database
```

### Exemplos de queries úteis (PostgreSQL)

```sql
-- Ver todos os usuários
SELECT id, name, email, created_at FROM users ORDER BY created_at DESC;

-- Ver sessões de estudo de um usuário específico
SELECT 
  s.*,
  u.name as user_name,
  u.email
FROM study_sessions s
JOIN users u ON s.user_id = u.id
WHERE u.email = 'recruta132senhor@gmail.com'
ORDER BY s.date DESC;

-- Ver total de minutos estudados por usuário
SELECT 
  u.name,
  u.email,
  SUM(s.minutes) as total_minutos,
  ROUND(SUM(s.minutes) / 60.0, 2) as total_horas,
  COUNT(s.id) as total_sessoes
FROM users u
LEFT JOIN study_sessions s ON u.id = s.user_id
GROUP BY u.id, u.name, u.email
ORDER BY total_minutos DESC;

-- Ver metas de um usuário
SELECT 
  g.*,
  u.name as user_name
FROM goals g
JOIN users u ON g.user_id = u.id
WHERE u.email = 'recruta132senhor@gmail.com'
ORDER BY g.date DESC;

-- Ver streak de todos os usuários
SELECT 
  u.name,
  u.email,
  COUNT(DISTINCT s.date) as dias_estudados
FROM users u
LEFT JOIN study_sessions s ON u.id = s.user_id
GROUP BY u.id, u.name, u.email
ORDER BY dias_estudados DESC;
```

---

## 🔍 Queries Úteis para Debug

### Encontrar usuário específico
```sql
-- SQLite
SELECT * FROM users WHERE email = 'recruta132senhor@gmail.com';

-- PostgreSQL
SELECT * FROM users WHERE email = 'recruta132senhor@gmail.com';
```

### Ver sessões de hoje
```sql
-- SQLite
SELECT * FROM study_sessions WHERE date = date('now');

-- PostgreSQL
SELECT * FROM study_sessions WHERE date = CURRENT_DATE;
```

### Corrigir tempo de um usuário manualmente
```sql
-- SQLite
UPDATE study_sessions 
SET minutes = 64, hours = 1.07
WHERE user_id = (SELECT id FROM users WHERE email = 'recruta132senhor@gmail.com')
AND date = (SELECT MAX(date) FROM study_sessions WHERE user_id = (SELECT id FROM users WHERE email = 'recruta132senhor@gmail.com'));

-- PostgreSQL
UPDATE study_sessions 
SET minutes = 64, hours = 1.07
WHERE user_id = (SELECT id FROM users WHERE email = 'recruta132senhor@gmail.com')
AND date = (SELECT MAX(date) FROM study_sessions WHERE user_id = (SELECT id FROM users WHERE email = 'recruta132senhor@gmail.com'));
```

### Deletar sessões duplicadas
```sql
-- SQLite - Manter apenas a mais recente
DELETE FROM study_sessions 
WHERE id NOT IN (
  SELECT MAX(id) 
  FROM study_sessions 
  WHERE user_id = (SELECT id FROM users WHERE email = 'recruta132senhor@gmail.com')
  GROUP BY date
);

-- PostgreSQL - Manter apenas a mais recente
DELETE FROM study_sessions 
WHERE id NOT IN (
  SELECT MAX(id) 
  FROM study_sessions 
  WHERE user_id = (SELECT id FROM users WHERE email = 'recruta132senhor@gmail.com')
  GROUP BY date
);
```

---

## ⚠️ Cuidados Importantes

1. **Backup antes de modificar**: Sempre faça backup antes de executar UPDATE ou DELETE
2. **Produção**: Tenha cuidado ao modificar dados em produção
3. **Senhas**: As senhas estão hasheadas (bcrypt), não é possível ver a senha original
4. **Testes**: Teste queries em desenvolvimento antes de usar em produção

---

## 🛠️ Ferramentas Recomendadas

### Para SQLite:
- **DB Browser for SQLite**: https://sqlitebrowser.org/ (Interface gráfica)
- **sqlite3**: Linha de comando (já vem no Linux/Mac)

### Para PostgreSQL:
- **DBeaver**: https://dbeaver.io/ (Interface gráfica, suporta vários bancos)
- **pgAdmin**: https://www.pgadmin.org/ (Interface gráfica oficial)
- **psql**: Linha de comando (vem com PostgreSQL)

---

## 📝 Verificar qual banco está sendo usado

No código, verifique a variável de ambiente:

```bash
# Se DATABASE_URL estiver definida, usa PostgreSQL
# Se não, usa SQLite local
```

No Railway, a variável `DATABASE_URL` é configurada automaticamente quando você adiciona um serviço PostgreSQL.
