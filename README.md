# Sistema de Gestão de Matrícula (SGM) 🎓

Um ecossistema completo e moderno para a gestão do ciclo de vida do aluno, desde a candidatura online até a efetivação da matrícula e alocação acadêmica. Desenvolvido com **Django REST Framework (Backend)** e **React (Frontend)**.

## 🚀 O Projeto

O SGM foi desenhado para modernizar secretarias escolares, oferecendo um portal público para candidatos e um painel administrativo robusto para a gestão de vagas, turmas e indicadores em tempo real.

### 🌟 Diferenciais
*   **� Foco em Matrículas:** Fluxo otimizado para converter inscritos em alunos matriculados de forma automática.
*   **📊 Dashboards Inteligentes:** Gráficos dinâmicos (Recharts) comparando vagas totais, ocupação por curso, gênero e fluxo de crescimento.
*   **⚡ Navegação Premium:** Interface React rápida, responsiva e com micro-animações para uma experiência de usuário superior.
*   **� Segurança Robusta:** Controle de acesso baseado em permissões (RBAC) e auditoria de ações.

---

## 🛠️ Tecnologias Utilizadas

**Frontend:**
*   React.js + Vite (SPA)
*   Lucide React (Ícones)
*   Recharts (Visualização de Dados)
*   Context API (Gestão de Estado)

**Backend:**
*   Python 3.10+
*   Django & Django REST Framework (API)
*   PostgreSQL (Banco de Dados)
*   JWT (Autenticação)

---

## 📦 Guia de Instalação

### 1. Clonar o Repositório
```bash
git clone <url-do-repositorio>
cd Projeto_fim_curso
```

### 2. Configurar o Backend (Django)
1. Navegue até a pasta: `cd backend`
2. Crie e ative o ambiente virtual:
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   ```
3. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```
4. **Configuração do Banco de Dados:**
   - Crie um banco de dados no PostgreSQL chamado `gestao_escolar`.
   - Configure o arquivo `.env` (use o `.env.example` como base).
5. Execute as migrações e inicie:
   ```bash
   python manage.py migrate
   python manage.py runserver 
   ```

### 3. Configurar o Frontend (React)
1. Navegue até a pasta: `cd ../frontend`
2. Instale e inicie:
   ```bash
   npm install
   npm run dev
   ```

---

## 📂 Documentação e Documentos Técnicos

O projeto possui uma pasta `/Docs` com documentos detalhados para consulta:
*   [Diagrama de Caso de Uso (Frontend)](file:///c:/Users/Aguinaldo Arnaldo/Documents/Meus_projetos/Projeto_fim_curso/Docs/diagrama_caso_uso_frontend.md)
*   [Requisitos de Negócio](file:///c:/Users/Aguinaldo Arnaldo/Documents/Meus_projetos/Projeto_fim_curso/Docs/DOCUMENTACAO_REQUISITOS.md)
*   [Lista de Funcionalidades](file:///c:/Users/Aguinaldo Arnaldo/Documents/Meus_projetos/Projeto_fim_curso/Docs/LISTA_FUNCIONALIDADES_FRONTEND.md)

---

## ❓ Soluções de Problemas Comuns

### O sistema redireciona para HTTPS localmente?
Certifique-se de que `DEBUG=True` está no seu `.env`. Se for `False`, o Django força navegação segura.

### Erro de Conexão com o Banco?
Verifique se o serviço do PostgreSQL está ativo no Windows e se as credenciais do DB coincidem com o `.env`.
---

## 👨‍� Desenvolvedor
**Aguinaldo Arnaldo** - *Projeto Final de Curso*
