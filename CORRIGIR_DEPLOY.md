# 🔧 Corrigir Erro de Deploy no Railway

## ❌ Problema
O Railway está dando erro porque o `package-lock.json` não está sincronizado com o `package.json`.

## ✅ Solução

### 1. Fazer Commit do package-lock.json

Execute estes comandos no PowerShell:

```powershell
# Navegar para a pasta do projeto
cd "c:\Users\HTDOCS\Desktop\Plataforma de concurso"

# Adicionar o package-lock.json do servidor
git add server/package-lock.json

# Adicionar também os arquivos de configuração do Railway
git add server/nixpacks.toml railway.json

# Fazer commit
git commit -m "fix: adicionar package-lock.json do servidor e configurações do Railway"

# Fazer push
git push origin main
```

### 2. Aguardar Redeploy Automático

O Railway vai detectar o novo commit e fazer redeploy automaticamente.

### 3. Se Ainda Der Erro

No Railway, vá em **"Settings"** do serviço e configure:

- **Build Command**: `npm install` (ao invés de `npm ci`)
- Ou deixe vazio para usar o padrão

---

**Pronto!** O deploy deve funcionar agora! 🚀
