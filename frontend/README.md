# Frontend - Sistema Gestão de Matricula (SGM)

Uma Single Page Application (SPA) moderna construída com **React 18** e **Vite**.

## 🚀 Como Iniciar

### 1. Pré-requisitos
- **Node.js:** Versão 18.0 ou superior recomendada.
- **Backend:** O backend deve estar rodando para que o login e as funcionalidades funcionem.

### 2. Instalação
```bash
npm install
```

### 3. Execução (Desenvolvimento)
```bash
npm run dev
```
O sistema estará disponível em `http://localhost:5173`.

---

## 🔗 Conexão com a API
O frontend está configurado para se conectar à API em `http://127.0.0.1:8000/api/v1/` (padrão do Django local).
Se precisar alterar o endereço da API, edite o arquivo:
`src/services/api.js`

---

## 📂 Estrutura de Pastas
- `/src/components`: Componentes visuais reutilizáveis.
- `/src/pages`: Telas principais do sistema.
- `/src/services`: Configurações de chamada de API (Axios).
- `/src/context`: Gerenciamento de estado (Autenticação, Preferências).
- `/src/routes`: Definição das rotas e proteções de acesso.

---

## 🛠️ Tecnologias
- **React 18**
- **Vite** (Build tool rápida)
- **Axios** (Requisições HTTP)
- **Lucide React** (Ícones)
- **Recharts** (Gráficos)
- **CSS Modules** (Estilização isolada)

---

## 📦 Build para Produção
```bash
npm run build
```
Os arquivos otimizados serão gerados na pasta `dist/`.
