# Sistema de Gestão Acadêmica (SGM)

Um sistema completo e moderno para gestão de instituições de ensino, desenvolvido com **Django (Backend)** e **React (Frontend)**. O sistema oferece uma solução robusta para administração escolar, desde a inscrição de alunos até a gestão financeira e pedagógica.

## 🚀 Funcionalidades Principais

*   **🎓 Acadêmico:** Gestão de alunos, turmas, salas, cursos e disciplinas.
*   **📊 Dashboard:** Visão analítica com KPIs em tempo real e gráficos de desempenho.
*   **🔐 Segurança:** Autenticação via JWT, controle de permissões granular por cargo (Admin, Secretaria, Professor).
*   **💰 Financeiro:** Controle de faturas e pagamentos (em desenvolvimento).
*   **📚 Biblioteca:** Gestão de acervo e categorias de livros.

---

## 🛠️ Requisitos de Sistema

Antes de começar, certifique-se de ter instalado:
*   **Python 3.10 ou superior**
*   **Node.js 18 ou superior** (com npm ou yarn)
*   **PostgreSQL 14 ou superior** (O sistema utiliza PostgreSQL como banco de dados padrão)

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
   # Linux/Mac:
   source .venv/bin/activate
   ```
3. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```
4. **Configuração do Banco de Dados:**
   - Crie um banco de dados no PostgreSQL chamado `gestao_escolar`.
   - Copie o arquivo `.env.example` para `.env` e ajuste as credenciais (DB_USER, DB_PASSWORD).
5. Execute as migrações:
   ```bash
   python manage.py migrate
   ```
6. (Opcional) Crie um administrador:
   ```bash
   python manage.py createsuperuser
   ```
7. Inicie o servidor:
   ```bash
   python manage.py runserver 
   ```

### 3. Configurar o Frontend (React)
1. Navegue até a pasta: `cd ../frontend`
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o ambiente de desenvolvimento:
   ```bash
   npm run dev
   ```

O sistema estará disponível em `http://localhost:5173`.

---

## ❓ Solução de Problemas Comuns

### Erro na instalação do `psycopg2`
No Windows, se houver erro ao instalar o `psycopg2`, instale a versão binária:
```bash
pip install psycopg2-binary
```

### Erro de Conexão com o Banco de Dados
*   Verifique se o serviço do PostgreSQL está rodando.
*   Certifique-se de que o banco `gestao_escolar` foi criado.
*   Valide as credenciais no arquivo `backend/.env`.

### Erro no `npm install`
*   Tente rodar `npm cache clean --force` e delete a pasta `node_modules` antes de tentar novamente.
*   Certifique-se de estar usando a versão do Node recomendada (18+).

### Erro de HTTPS/HTTP (Redirecionamento Infinito ou Conexão Recusada)
Se o sistema tentar redirecionar para `https://localhost` automaticamente:
*   Certifique-se de que `DEBUG=True` está definido no seu arquivo `backend/.env`.
*   Se o `DEBUG` for `False`, o Django ativa proteções de segurança que exigem HTTPS. Para rodar localmente sem certificados SSL, o modo de depuração **deve** estar ativado.

### Acesso via outro PC na mesma rede (IP Local)
Se você estiver tentando acessar o sistema de outro computador usando o IP (ex: `http://192.168.1.5:5173`):
1.  No `backend/.env`, adicione o IP ao `ALLOWED_HOSTS` e `ALLOWED_ORIGINS`.
2.  No `frontend/src/services/api.js`, mude a `baseURL` para o IP do computador que está rodando o backend.

### Erro no `makemigrations` ou `migrate`
Se ao rodar os comandos de banco de dados você receber erros:
*   **"No module named '...'":** Certifique-se de que a `.venv` está ativa e que rodou `pip install -r requirements.txt`.
*   **Erro de Conexão (Connection Refused):** O PostgreSQL **deve** estar rodando e o banco `gestao_escolar` deve ter sido criado antes do comando.
*   **Erro de "apps" ou "models":** Verifique se não há erros de sintaxe nos seus arquivos Python.
*   **Inconsistência de Migrações:** Se as migrações estiverem travadas, tente rodar `python manage.py migrate --fake-initial` ou verifique se o banco de dados já não possui as tabelas criadas por um script SQL anterior.

---

### Como gerar a `SECRET_KEY`?
A `SECRET_KEY` é usada pelo Django para criptografia. Para desenvolvimento local, você pode usar qualquer texto longo e aleatório. Caso queira gerar uma chave profissional e segura, rode o seguinte comando no terminal (dentro da pasta `backend` com a `.venv` ativa):

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```
Basta copiar o código gerado e colar no seu arquivo `.env`.

---

## 📂 Estrutura do Projeto

*   `/backend`: API REST desenvolvida em Django.
*   `/frontend`: Interface SPA desenvolvida em React + Vite.
*   `/Docs`: Documentação técnica e manuais de requisitos.

---
Desenvolvido por **Aguinaldo Arnaldo**.
