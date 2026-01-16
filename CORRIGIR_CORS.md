# 🔧 Corrigir Erro de CORS

## ❌ Problema
Erro: `Access-Control-Allow-Origin header has a value 'http://localhost:3000'`

O backend está retornando a origem errada no CORS.

## ✅ Solução

### 1. Adicionar FRONTEND_URL no Railway

No Railway:

1. Vá em **Settings** → **Variables**
2. Adicione ou verifique:
   - **Name**: `FRONTEND_URL`
   - **Value**: `https://plataforma-concurso-estudos.vercel.app`
3. **Salve**

### 2. Forçar Redeploy

1. No Railway, vá em **Deployments**
2. Clique nos **"..."** do último deploy
3. Selecione **"Redeploy"**

---

## ✅ O que foi feito no código:

- Adicionada URL do Vercel diretamente no código como fallback
- CORS agora aceita: `https://plataforma-concurso-estudos.vercel.app`

---

**Após adicionar `FRONTEND_URL` no Railway e fazer redeploy, o CORS deve funcionar! 🚀**
