# 🔧 Corrigir Tempo do Usuário Recruta132

## 📋 Informações
- **Email**: recruta132senhor@gmail.com
- **Tempo correto**: 64 minutos (1:04 horas)

## 🚀 Como Corrigir

### Opção 1: Via Script (Recomendado)

1. **No Railway (Produção)**:
   - Vá em **Settings** → **Variables**
   - Adicione uma variável temporária: `RUN_FIX_SCRIPT=true`
   - No terminal do Railway, execute:
   ```bash
   node server/fix-user-time.js
   ```
   - Remova a variável `RUN_FIX_SCRIPT` depois

### Opção 2: Via SQL Direto (PostgreSQL)

Se você tiver acesso ao banco PostgreSQL (Supabase ou Railway):

```sql
-- Encontrar o usuário
SELECT id, email, name FROM users WHERE email = 'recruta132senhor@gmail.com';

-- Supondo que o ID seja X, atualizar ou criar sessão para hoje
-- Primeiro, verificar sessões existentes
SELECT id, date, minutes, hours FROM study_sessions 
WHERE user_id = (SELECT id FROM users WHERE email = 'recruta132senhor@gmail.com')
ORDER BY date DESC;

-- Se houver múltiplas sessões, deletar as antigas e manter apenas a mais recente
-- (Ajuste o ID conforme necessário)

-- Atualizar a sessão mais recente para 64 minutos
UPDATE study_sessions 
SET minutes = 64, hours = 1.07
WHERE user_id = (SELECT id FROM users WHERE email = 'recruta132senhor@gmail.com')
AND date = (SELECT MAX(date) FROM study_sessions WHERE user_id = (SELECT id FROM users WHERE email = 'recruta132senhor@gmail.com'));

-- OU criar nova sessão se não existir
INSERT INTO study_sessions (user_id, date, minutes, hours)
SELECT id, CURRENT_DATE, 64, 1.07
FROM users
WHERE email = 'recruta132senhor@gmail.com'
ON CONFLICT DO NOTHING;
```

### Opção 3: Via API (Temporária)

Criar uma rota temporária de admin para fazer a correção.

---

## ✅ Mudanças Aplicadas

- ✅ Timer "Foco Máximo" alterado de 45 para **3 minutos** (temporário para teste)
- ✅ Script de correção criado em `server/fix-user-time.js`

---

**Nota**: O script precisa ser executado no ambiente de produção (Railway) onde o usuário está cadastrado.
