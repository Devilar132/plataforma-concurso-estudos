# 🔧 Corrigir Erro "Missing script: start"

## ❌ Problema

O Railway está dando erro: `Missing script: "start"`

Isso significa que o Railway não está encontrando o `package.json` do servidor.

## ✅ Solução

### 1. Verificar Start Command no Railway

No Railway:

1. Vá em **Settings** → **Deploy**
2. Verifique o campo **"Start Command"**:
   - Deve ser: `node index.js` ✅
   - Ou: `npm start` (se o Root Directory estiver correto)
3. Se estiver diferente, **altere para**: `node index.js`
4. **Salve**

### 2. Verificar Root Directory (NOVAMENTE)

1. Vá em **Settings** → **Source**
2. **Root Directory** deve ser: `server` ✅
3. Se não estiver, **altere para**: `server`
4. **Salve**

### 3. Verificar Build Command

1. Vá em **Settings** → **Build**
2. **Custom Build Command**: Deixe **VAZIO** ou `npm install`
3. **Salve**

---

## 🔄 Após Corrigir

1. O Railway vai fazer **redeploy automático**
2. Ou vá em **Deployments** → **"..."** → **Redeploy**
3. O servidor deve iniciar agora!

---

## ✅ Checklist

- [ ] Root Directory: `server`
- [ ] Start Command: `node index.js` (ou `npm start` se Root Directory estiver correto)
- [ ] Build Command: vazio ou `npm install`

---

**O `nixpacks.toml` já foi atualizado para usar `node index.js` diretamente! 🚀**
