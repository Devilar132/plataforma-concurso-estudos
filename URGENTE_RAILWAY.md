# 🚨 URGENTE - Configurar Root Directory no Railway

## ⚠️ O PROBLEMA

O Railway está tentando fazer `npm ci` na **RAIZ do projeto** (`/`), mas deveria estar trabalhando apenas no diretório `server`.

## ✅ SOLUÇÃO IMEDIATA

### **FAÇA ISSO AGORA NO RAILWAY:**

1. **Acesse**: [railway.app](https://railway.app)
2. **Clique no serviço**: `plataforma-concurso-backend`
3. **Vá em**: **Settings** → **Source** (primeira opção no menu lateral)
4. **VERIFIQUE o campo "Root Directory"**:
   - ❌ Se estiver vazio ou `/` → **ALTERE para `server`**
   - ✅ Deve mostrar: `server`
5. **SALVE** as alterações

### **IMPORTANTE:**

- O **Root Directory** é a configuração MAIS IMPORTANTE
- Sem isso, o Railway sempre vai tentar fazer `npm ci` na raiz
- Com `server` configurado, o Railway vai trabalhar apenas no diretório `server`

---

## 📸 Como Verificar

Após configurar, você deve ver:

```
Settings → Source
Root Directory: server
```

**NÃO deve estar:**
- `Root Directory: /` ❌
- `Root Directory: (vazio)` ❌

---

## 🔄 Após Configurar

1. O Railway vai fazer **redeploy automático**
2. Ou vá em **Deployments** → **"..."** → **Redeploy**
3. O deploy deve funcionar agora!

---

**Esta é a configuração CRÍTICA que resolve o problema! 🚀**
