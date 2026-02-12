# Sistema Gestão de Matricula (SGM)

Um sistema completo e moderno para gestão de escolas, desenvolvido com Django (Backend) e React (Frontend).
O projeto visa facilitar a administração escolar, desde a inscrição de alunos até a gestão de turmas, notas e pagamentos.

## 🚀 Funcionalidades Principais

### 🎓 Acadêmico
- **Gestão de Alunos:** Matrículas, histórico, documentos e perfis detalhados.
- **Turmas e Salat:** Criação e gestão de turmas com controle de capacidade em tempo real.
- **Cursos e Classes:** Estrutura curricular flexível.
- **Inscrições Online:** Portal público para novos candidatos.

### 📊 Dashboard Interativo
- Visão geral com gráficos e KPIs em tempo real.
- Monitoramento de matrículas vs. inscrições.
- Distribuição por gênero e cursos mais populares.
- Atalhos rápidos para as principais funções.

### 🔐 Segurança e Acesso
- **Autenticação Segura:** Login com JWT (JSON Web Tokens).
- **Controle de Permissões Granular:**
  - Sistema de permissões baseado em funções (Admin, Secretaria, Professor, Aluno).
  - Rotas protegidas no frontend que verificam permissões antes de carregar a página.
  - Proteção contra redirecionamentos indevidos durante o carregamento da sessão.

## 🛠 Tecnologia

### Backend (API)
- **Framework:** Django & Django REST Framework (DRF)
- **Banco de Dados:** PostgreSQL
- **Autenticação:** SimpleJWT
- **Destaques:** 
  - Serializers otimizados.
  - ViewSets para CRUD padrão.
  - Lógica de negócios encapsulada nos Models.

### Frontend (SPA)
- **Framework:** React.js (Vite)
- **Estilização:** CSS Modules e Variáveis CSS (Design System Premium).
- **Bibliotecas:** 
  - `recharts` (Gráficos)
  - `lucide-react` (Ícones Modernos)
  - `axios` (Comunicação API)
  - `react-router-dom` (Navegação)

## 📂 Estrutura do Projeto

```bash
/
├── backend/            # Aplicação Django (API)
│   ├── apis/          # Apps e endpoints da API
│   ├── core/          # Configurações do projeto Django
│   └── manage.py
│
├── frontend/           # Aplicação React (Interface)
│   ├── src/
│   │   ├── components/ # Componentes reutilizáveis (Sidebar, Modal, etc)
│   │   ├── pages/      # Telas do sistema
│   │   ├── services/   # Configuração do Axios
│   │   └── context/    # Gestão de Estado Global (Auth, Config)
│   └── vite.config.js
│
└── docs/               # Documentação adicional (Requisitos, Permissões, Roadmap)
```

## 🚀 Como Rodar o Projeto

### Pré-requisitos
- Python 3.10+
- Node.js 18+

### 1. Configurar o Backend
```bash
cd backend
python -m venv .venv
# Ativar venv (Windows: .venv\Scripts\activate | Linux: source .venv/bin/activate)
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 2. Configurar o Frontend
```bash
cd frontend
npm install
npm run dev
```

O sistema estará acessível em `http://localhost:5173`.
