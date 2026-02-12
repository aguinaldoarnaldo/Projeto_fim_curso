# Frontend - Sistema Gestão de Matricula (SGM)

Uma Single Page Application (SPA) moderna e responsiva construída com React e Vite.
O frontend consome a API Django para oferecer uma interface rica, com dashboard interativo, formulários complexos e gestão completa da vida acadêmica.

## 🚀 Principais Features

- **Componentes Reutilizáveis:** `Sidebar` (Menu Lateral), `Modal` (Diálogos), `Card`, `Button`.
- **Routes & Auth:** Sistema de rotas protegidas (`PermissionRoute`) com validação de token JWT e redirecionamento inteligente.
- **Dashboard:** Gráficos interativos (`AreaChart`, `PieChart`) e Widgets (Calendário).
- **Gestão de Turmas em Tempo Real:** Atualização automática da lista e capacidade ao salvar.

## 📂 Estrutura de Diretórios

```bash
/src
├── assets/          # Imagens, logos e styles globais (index.css)
├── components/      # Componentes UI (Sidebar.jsx, FilterModal.jsx)
│   ├── Common/      # Modais, Loaders, Botões genéricos
│   ├── Dashboard/   # Widgets específicos da home
│   └── Layout/      # Estrutura base das páginas
│
├── context/         # AuthContext (Login), DataCache (Performance)
├── hooks/           # usePermission, useDataCache
├── pages/           # Telas (Alunos, Turmas, Configurações)
├── routes/          # Definição das rotas e guards de permissão
├── services/        # Configuração do Axios (api.js)
└── utils/           # Constantes, helpers de data e permissões
```

## 🛠 Tecnologias e Bibliotecas

- **React 18:** Componentes funcionais e Hooks (`useState`, `useEffect`, `useContext`).
- **React Router Dom:** Navegação client-side sem recarregar a página.
- **Axios:** Cliente HTTP para requisições à API Django.
- **Recharts:** Biblioteca poderosa para visualização de dados.
- **Lucide React:** Ícones vetoriais modernos e leves (`Users`, `Layers`, `DoorOpen`).
- **CSS Modules:** Estilização local para evitar conflitos (`Turmas.css`, `Dashboard.css`).

## 🔐 Sistema de Permissões

O frontend implementa um controle de acesso robusto através do hook `usePermission` e do componente `PermissionRoute`.
As permissões são verificadas contra o objeto do usuário logado:
1. **Admin/Superuser:** Acesso total.
2. **Permissões Granulares:** Verifica se a string (ex: `view_turmas`) existe na lista de permissões do usuário.
3. **Cargos:** Verifica permissões baseadas no cargo (Secretaria, Professor).

Consulte `docs/frontend_permissions_list.md` na raiz do projeto para a lista completa.

## 🎨 Design System

O projeto utiliza um sistema de design consistente com variáveis CSS para cores e espaçamentos:
- **Cores Primárias:** Azul (`#3b82f6` - Tailwind Blue-500) e Roxo (`#8b5cf6` - Indigo-500).
- **Tipografia:** Fonte 'Inter' para legibilidade e modernidade.
- **Layout:** Flexbox e Grid para responsividade.
- **Modais:** Portais React para renderização correta sobre o conteúdo.

## 🚀 Como Iniciar

1. **Instalar Dependências:**
   ```bash
   npm install
   ```

2. **Rodar Ambiente de Desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse em `http://localhost:5173`.

## 📦 Build para Produção

Para gerar os arquivos estáticos otimizados:
```bash
npm run build
```
Os arquivos serão gerados na pasta `dist/`.
