# 📊 Onde Ficam as Horas de Estudo no Banco

## 🗄️ Tabela: `study_sessions`

As horas de estudo são armazenadas na tabela **`study_sessions`**.

---

## 📋 Estrutura da Tabela

```sql
CREATE TABLE study_sessions (
  id              INTEGER PRIMARY KEY,      -- ID único da sessão
  user_id         INTEGER NOT NULL,        -- ID do usuário (FK para users)
  date            DATE NOT NULL,           -- Data da sessão (YYYY-MM-DD)
  minutes         INTEGER DEFAULT 0,        -- Minutos estudados (PRINCIPAL)
  hours           DECIMAL(4,2) DEFAULT 0,  -- Horas estudadas (calculado)
  subject         TEXT,                    -- Matéria/Tema (opcional)
  notes           TEXT,                    -- Notas (opcional)
  created_at      TIMESTAMP                -- Quando foi criado
);
```

---

## 🔑 Campos Importantes

### `minutes` (PRINCIPAL)
- **Tipo**: `INTEGER`
- **Descrição**: Minutos estudados na sessão
- **Exemplo**: `45` (45 minutos), `120` (2 horas)
- **Uso**: Este é o campo principal usado para cálculos

### `hours` (CALCULADO)
- **Tipo**: `DECIMAL(4,2)`
- **Descrição**: Horas estudadas (calculado a partir de `minutes`)
- **Exemplo**: `0.75` (45 minutos), `2.00` (2 horas)
- **Uso**: Apenas para exibição, calculado como `minutes / 60`

### `date`
- **Tipo**: `DATE`
- **Descrição**: Data da sessão (formato: YYYY-MM-DD)
- **Exemplo**: `2026-01-16`
- **Uso**: Agrupa sessões por dia

### `user_id`
- **Tipo**: `INTEGER`
- **Descrição**: ID do usuário que estudou
- **Uso**: Liga a sessão ao usuário

---

## 🔍 Como Ver os Dados

### Ver todas as sessões de um usuário

```sql
SELECT 
  id,
  date,
  minutes,
  hours,
  subject,
  created_at
FROM study_sessions
WHERE user_id = 1  -- Substitua pelo ID do usuário
ORDER BY date DESC;
```

### Ver sessões de hoje

```sql
SELECT * FROM study_sessions
WHERE user_id = 1
AND date = CURRENT_DATE;
```

### Ver total de minutos por dia

```sql
SELECT 
  date,
  SUM(minutes) as total_minutos,
  ROUND(SUM(minutes) / 60.0, 2) as total_horas
FROM study_sessions
WHERE user_id = 1
GROUP BY date
ORDER BY date DESC;
```

### Ver total geral de um usuário

```sql
SELECT 
  u.name,
  u.email,
  SUM(s.minutes) as total_minutos,
  ROUND(SUM(s.minutes) / 60.0, 2) as total_horas,
  COUNT(s.id) as total_sessoes
FROM users u
LEFT JOIN study_sessions s ON u.id = s.user_id
WHERE u.email = 'recruta132senhor@gmail.com'
GROUP BY u.id, u.name, u.email;
```

### Ver sessões de um usuário específico (por email)

```sql
SELECT 
  s.id,
  s.date,
  s.minutes,
  s.hours,
  s.subject,
  s.notes,
  s.created_at
FROM study_sessions s
JOIN users u ON s.user_id = u.id
WHERE u.email = 'recruta132senhor@gmail.com'
ORDER BY s.date DESC, s.created_at DESC;
```

---

## 📊 Exemplo de Dados

### Como os dados ficam armazenados:

| id | user_id | date       | minutes | hours | subject           | created_at          |
|----|---------|------------|---------|-------|-------------------|---------------------|
| 1  | 1       | 2026-01-16 | 45      | 0.75  | Pomodoro          | 2026-01-16 10:30:00 |
| 2  | 1       | 2026-01-16 | 30      | 0.50  | Direito Civil     | 2026-01-16 14:20:00 |
| 3  | 1       | 2026-01-15 | 60      | 1.00  | Matemática        | 2026-01-15 09:15:00 |

**Total do dia 2026-01-16**: 75 minutos (1.25 horas)

---

## 🔧 Como os Dados são Inseridos

### Quando o timer Pomodoro completa:

```javascript
// Código em: server/routes/sessions.js
await sessionsService.create({
  date: '2026-01-16',      // Data de hoje
  minutes: 45,              // Minutos estudados
  subject: 'Pomodoro'       // Matéria
});
```

### O que acontece no banco:

1. **Se já existe sessão para aquele dia**:
   - Soma os minutos novos aos existentes
   - Atualiza a sessão existente

2. **Se não existe sessão**:
   - Cria nova linha na tabela
   - Insere `minutes` e calcula `hours`

---

## 📍 Localização no Banco

### SQLite (Desenvolvimento):
- **Arquivo**: `database.sqlite` (na raiz do projeto)
- **Tabela**: `study_sessions`

### PostgreSQL (Produção - Railway):
- **Database**: `railway` (ou nome configurado)
- **Schema**: `public`
- **Tabela**: `study_sessions`

---

## 🔍 Queries Úteis para Debug

### Ver todas as sessões (últimas 20)
```sql
SELECT * FROM study_sessions
ORDER BY created_at DESC
LIMIT 20;
```

### Ver sessões duplicadas (mesmo dia, mesmo usuário)
```sql
SELECT 
  user_id,
  date,
  COUNT(*) as quantidade
FROM study_sessions
GROUP BY user_id, date
HAVING COUNT(*) > 1;
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

### Corrigir horas de um usuário (exemplo: 64 minutos)
```sql
-- Atualizar a sessão mais recente
UPDATE study_sessions
SET minutes = 64, hours = 1.07
WHERE user_id = (SELECT id FROM users WHERE email = 'recruta132senhor@gmail.com')
AND date = (SELECT MAX(date) FROM study_sessions 
            WHERE user_id = (SELECT id FROM users WHERE email = 'recruta132senhor@gmail.com'));
```

---

## ⚠️ Importante

1. **Campo principal**: `minutes` - sempre use este para cálculos
2. **Campo calculado**: `hours` - apenas para exibição (`minutes / 60`)
3. **Agrupamento**: Sessões do mesmo dia são somadas automaticamente
4. **Data**: Sempre no formato `YYYY-MM-DD` (ex: `2026-01-16`)

---

## 🎯 Resumo

✅ **Tabela**: `study_sessions`  
✅ **Campo principal**: `minutes` (INTEGER)  
✅ **Campo calculado**: `hours` (DECIMAL)  
✅ **Agrupamento**: Por `user_id` + `date`  
✅ **Localização**: Banco PostgreSQL no Railway (produção) ou SQLite local (dev)

---

**Agora você sabe exatamente onde encontrar as horas de estudo! 🚀**
