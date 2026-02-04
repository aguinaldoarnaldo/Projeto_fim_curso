# 🏫 Sistema de Gestão de Matrícula e Académica

Este é um sistema moderno e robusto para a gestão completa de instituições de ensino, focado na automação de matrículas, controlo de alunos, turmas e acompanhamento pedagógico. O projeto utiliza uma arquitetura desacoplada com **React** no frontend e **Django** no backend.

---

## 🚀 Como Colocar o Projeto a Rodar

Siga os passos abaixo para configurar o ambiente de desenvolvimento.

### 1. Pré-requisitos
Antes de começar, certifique-se de ter instalado:
* **Node.js** (v18 ou superior)
* **Python** (v3.10 ou superior)
* **Git**
* **PostgreSQL** (ou outro banco de dados de sua preferência configurado no Django)

---

### 2. Configuração do Backend (Django)

1. **Aceda à pasta do backend:**
   ```bash
   cd backend
   ```

2. **Crie um ambiente virtual:**
   ```bash
   python -m venv venv
   ```

3. **Ative o ambiente virtual:**
   * **Windows:** `venv\Scripts\activate`
   * **Linux/Mac:** `source venv/bin/activate`

4. **Instale as dependências:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Configure as Migrações e a Base de Dados:**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

6. **Inicie o servidor de desenvolvimento:**
   ```bash
   python manage.py runserver
   ```
   *O servidor estará disponível em: `http://127.0.0.1:8000`*

---

### 3. Configuração do Frontend (React + Vite)

1. **Abra um novo terminal e aceda à pasta do frontend:**
   ```bash
   cd frontend
   ```

2. **Instale as dependências do Node:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento do Vite:**
   ```bash
   npm run dev
   ```
   *O sistema estará disponível em: `http://localhost:5173`*

---

## 🛠️ Stack Tecnológica

### **Frontend**
* **React 19** + **Vite**: Interface rápida e reativa.
* **Lucide React**: Biblioteca de ícones moderna.
* **Recharts**: Visualização de dados dinâmica.
* **CSS Vanilla**: Design premium personalizado e totalmente responsivo.

### **Backend**
* **Django 5**: Framework robusto para lógica de negócio.
* **Django Rest Framework (DRF)**: APIs REST eficientes.
* **PostgreSQL**: Base de dados relacional estável.
* **SimpleJWT**: Autenticação segura por tokens.

---

## 📊 Funcionalidades Principais

* **Dashboard Inteligente:** Monitorização em tempo real e estatísticas.
* **Gestão de Matrículas:** Fluxo completo de inscrição com anexos.
* **Avaliação Automática:** Sistema de aprovação de candidatos baseado em critérios.
* **Controlo de Turmas e Salas:** Gestão física e lógica da instituição.
* **Segurança:** Controlo de permissões por utilizador.

---
