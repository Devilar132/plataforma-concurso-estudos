# 📚 Plataforma de Acompanhamento de Estudos

Plataforma completa para estudantes (especialmente concurseiros) acompanharem suas metas diárias de estudo, horas estudadas, sequências (streaks) e progresso.

## ✨ Funcionalidades

- ✅ **Gestão de Metas Diárias**: Crie e acompanhe suas metas de estudo
- ✅ **Registro de Horas**: Pomodoro timer integrado e registro manual
- ✅ **Sequências (Streaks)**: Acompanhe dias consecutivos de estudo
- ✅ **Recuperação de Streak**: Sistema de "freeze" e recuperação de dias perdidos
- ✅ **Milestones**: Conquistas por horas estudadas e dias consecutivos
- ✅ **Meta Diária de Horas**: Configure sua meta personalizada (em minutos/horas)
- ✅ **Estatísticas Visuais**: Gráficos e relatórios de progresso
- ✅ **Notificações**: Push notifications para manter você engajado
- ✅ **Onboarding**: Tour interativo para novos usuários

## 🚀 Tecnologias

- **Frontend**: React, CSS3, React Router, Axios, Recharts
- **Backend**: Node.js, Express, SQLite (dev) / PostgreSQL (prod)
- **Autenticação**: JWT
- **Banco de Dados**: SQLite (desenvolvimento) ou PostgreSQL (produção)

## 📦 Instalação

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn

### Passos

1. **Clone o repositório**:
```bash
git clone https://github.com/SEU_USUARIO/plataforma-concurso-estudos.git
cd plataforma-concurso-estudos
```

2. **Instale as dependências**:
```bash
# Instalar dependências do root e do client
npm run install-all
```

3. **Configure variáveis de ambiente**:

Crie um arquivo `.env` na raiz do projeto:
```env
PORT=5000
JWT_SECRET=seu_jwt_secret_aqui
NODE_ENV=development
```

4. **Inicie o servidor**:
```bash
npm run server
```

5. **Em outro terminal, inicie o frontend**:
```bash
npm run client
```

6. **Acesse**: `http://localhost:3000`

## 🌐 Deploy

Veja o guia completo em [GUIA_HOSPEDAGEM_GRATUITA.md](./GUIA_HOSPEDAGEM_GRATUITA.md)

### Opção Rápida (Render):
1. Crie conta no [Render](https://render.com)
2. Conecte seu repositório GitHub
3. Deploy automático!

### Opção Recomendada (Vercel + Railway + Supabase):
- Frontend: [Vercel](https://vercel.com)
- Backend: [Railway](https://railway.app)
- Banco: [Supabase](https://supabase.com)

## 📁 Estrutura do Projeto

```
plataforma-concurso-estudos/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── services/      # Serviços de API
│   │   └── utils/         # Utilitários
│   └── package.json
├── server/                 # Backend Express
│   ├── routes/            # Rotas da API
│   ├── controllers/       # Controladores
│   ├── services/          # Lógica de negócio
│   ├── database/          # Configuração do banco
│   └── index.js           # Entry point
└── package.json
```

## 🔐 Variáveis de Ambiente

### Backend
- `PORT`: Porta do servidor (padrão: 5000)
- `JWT_SECRET`: Chave secreta para JWT
- `DATABASE_URL`: Connection string do PostgreSQL (opcional, usa SQLite se não definido)
- `NODE_ENV`: Ambiente (development/production)

### Frontend
- `REACT_APP_API_URL`: URL da API backend (padrão: http://localhost:5000/api)

## 📝 Scripts Disponíveis

- `npm run dev`: Inicia frontend e backend simultaneamente
- `npm run server`: Inicia apenas o backend
- `npm run client`: Inicia apenas o frontend
- `npm run build`: Build do frontend para produção
- `npm run install-all`: Instala dependências do root e client

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

## 👨‍💻 Autor

Desenvolvido com foco em retenção, engajamento e criação de hábitos de estudo.

---

**Feito com ❤️ para ajudar estudantes a manterem a consistência nos estudos!**
