# 🗄️ Guia de Migração para PostgreSQL

## Por que migrar?

SQLite é excelente para desenvolvimento, mas **não escala** para produção:
- ❌ Não suporta múltiplos usuários simultâneos
- ❌ Sem transações adequadas
- ❌ Sem backup automático
- ❌ Limitações de concorrência

PostgreSQL resolve todos esses problemas e é a escolha padrão para SaaS.

---

## 📋 Pré-requisitos

1. PostgreSQL instalado (versão 12+)
2. Node.js com `pg` instalado: `npm install pg`
3. Backup do banco SQLite atual (opcional, mas recomendado)

---

## 🚀 Passo a Passo

### 1. Instalar PostgreSQL

**Windows:**
- Baixe do site oficial: https://www.postgresql.org/download/windows/
- Ou use Chocolatey: `choco install postgresql`

**Linux:**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

### 2. Criar Banco de Dados

```bash
# Conectar ao PostgreSQL
psql -U postgres

# Criar banco de dados
CREATE DATABASE estudos_db;

# Criar usuário (opcional)
CREATE USER estudos_user WITH PASSWORD 'sua_senha_segura';
GRANT ALL PRIVILEGES ON DATABASE estudos_db TO estudos_user;

# Sair
\q
```

### 3. Configurar Variáveis de Ambiente

Crie/edite `.env` na raiz do projeto:

```env
# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=estudos_db
DB_USER=postgres
DB_PASSWORD=sua_senha

# Manter SQLite como fallback (opcional)
USE_POSTGRES=true
```

### 4. Criar Schema

```bash
# Conectar ao banco
psql -U postgres -d estudos_db

# Executar schema
\i server/database/postgres-schema.sql
```

Ou via Node.js:

```bash
node -e "require('./server/database/postgres').query(require('fs').readFileSync('./server/database/postgres-schema.sql', 'utf8'))"
```

### 5. Migrar Dados

```bash
node server/database/migrate-to-postgres.js
```

Este script:
- ✅ Lê todos os dados do SQLite
- ✅ Insere no PostgreSQL
- ✅ Mantém IDs originais
- ✅ Ajusta sequências
- ✅ Não duplica dados (usa ON CONFLICT)

### 6. Atualizar Código

O código já está preparado! Basta:

1. **Instalar dependência:**
```bash
npm install pg
```

2. **Atualizar `server/database.js`** para usar PostgreSQL quando `USE_POSTGRES=true`:

```javascript
const USE_POSTGRES = process.env.USE_POSTGRES === 'true';

if (USE_POSTGRES) {
  module.exports = require('./database/postgres');
} else {
  module.exports = require('./database/sqlite'); // Manter compatibilidade
}
```

### 7. Testar

```bash
npm run server
```

Verifique:
- ✅ Conexão estabelecida
- ✅ Dados aparecem corretamente
- ✅ Criação/edição de metas funciona
- ✅ Estatísticas calculam corretamente

---

## 🔄 Migração Gradual (Recomendado)

Para não quebrar o sistema atual:

1. **Fase 1:** Criar PostgreSQL em paralelo
2. **Fase 2:** Migrar dados
3. **Fase 3:** Testar com PostgreSQL
4. **Fase 4:** Ativar PostgreSQL em produção
5. **Fase 5:** Manter SQLite como backup por 1 semana
6. **Fase 6:** Remover SQLite

---

## 📊 Comparação

| Aspecto | SQLite | PostgreSQL |
|---------|--------|------------|
| Usuários simultâneos | 1 | Ilimitado |
| Transações ACID | Básico | Completo |
| Backup | Manual | Automático |
| Escalabilidade | Baixa | Alta |
| Produção | ❌ Não recomendado | ✅ Recomendado |

---

## 🆘 Troubleshooting

### Erro: "relation does not exist"
- Execute o schema SQL primeiro
- Verifique se está conectado ao banco correto

### Erro: "password authentication failed"
- Verifique usuário e senha no `.env`
- Confirme permissões do usuário PostgreSQL

### Erro: "too many connections"
- Aumente `max` no pool de conexões
- Verifique conexões abertas: `SELECT * FROM pg_stat_activity;`

---

## ✅ Checklist Pós-Migração

- [ ] Todos os dados migrados
- [ ] Aplicação funcionando
- [ ] Testes passando
- [ ] Backup configurado
- [ ] Monitoramento ativo
- [ ] Documentação atualizada

---

**Migração concluída? Parabéns! Seu sistema agora está pronto para escalar! 🚀**
