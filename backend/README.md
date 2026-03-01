# Backend - Sistema Gestão de Matricula (SGM)

A espinha dorsal da aplicação, responsável por processar as requisições, interagir com o banco de dados e garantir a integridade das informações.

## 🛠 Tecnologias Principais

- **Django 5.0+**
- **Django REST Framework (DRF)**: Construção da API RESTful.
- **Django Unfold**: Interface administrativa moderna e customizada (Dashboard Verde).
- **PostgreSQL**: Banco de dados relacional robusto.
- **Simple JWT**: Autenticação baseada em tokens.

## 🚀 Como Iniciar

### 1. Preparação do Ambiente
```bash
python -m venv .venv
# Ativação
.venv\Scripts\activate     # Windows
source .venv/bin/activate  # Linux/Mac
```

### 2. Instalar Dependências
```bash
pip install -r requirements.txt
```

### 3. Configuração do Banco de Dados (PostgreSQL)
1. Certifique-se de que o PostgreSQL está instalado e rodando.
2. Crie um banco de dados chamado `gestao_escolar`.
3. Crie o arquivo `.env` na raiz da pasta `backend/` seguindo o modelo abaixo:

```env
SECRET_KEY=sua-chave-secreta
DEBUG=True
DB_NAME=gestao_escolar
DB_USER=seu-usuario-postgres
DB_PASSWORD=sua-senha-postgres
DB_HOST=localhost
DB_PORT=5432
```

> [!IMPORTANT]
> **Atenção:** Mantenha `DEBUG=True` para desenvolvimento local. Se for `False`, o Django forçará o uso de **HTTPS (SSL)**, o que impedirá o funcionamento via `localhost` (HTTP).

*Dica: Você pode copiar o arquivo `.env.example` e renomeá-lo para `.env`.*

**Nota sobre a `SECRET_KEY`:** Para desenvolvimento local, você pode colocar qualquer texto aleatório. Para gerar uma chave segura, rode no terminal:  
`python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`

### 4. Migrações e Dados Iniciais
```bash
python manage.py makemigrations apis
python manage.py migrate
```

### 5. Criar Superusuário (Acesso ao Admin)
```bash
python manage.py createsuperuser
```

### 6. Rodar Servidor
```bash
python manage.py runserver
```
A API estará disponível em `http://127.0.0.1:8000/api/v1/`.

## 📑 Principais Endpoints

- `GET /api/v1/dashboard/`: Estatísticas gerais.
- `GET /api/v1/turmas/`: Listagem e gestão de turmas.
- `POST /api/v1/auth/login/`: Obtenção de token JWT.
- `GET /api/v1/auth/me/`: Dados do usuário logado.

## 🔒 Segurança e Permissões

- **JWT Authentication:** Todos os endpoints protegidos exigem o header `Authorization: Bearer <seu_token>`.
- **CORS:** Configurado para permitir requisições do frontend (padrão: port 5173).

## 🧪 Comandos Úteis
```bash
python manage.py check          # Verifica erros de configuração
python manage.py test apis      # Executa testes unitários
python manage.py shell          # Abre o console interativo do Django
```
