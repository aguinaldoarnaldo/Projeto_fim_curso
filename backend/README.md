# Backend - Sistema Gestão de Matricula (SGM)

A espinha dorsal da aplicação, responsável por processar as requisições, interagir com o banco de dados e garantir a integridade das informações.

## 🛠 Tecnologias Principais

- **Django 5.0+**
- **Django REST Framework (DRF)**: Construção da API RESTful.
- **PostgreSQL**: Banco de dados relacional robusto para garantira a integridade dos dados.
- **Simple JWT**: Autenticação baseada em tokens.

## 📑 Principais Funcionalidades da API

### `apis/models/academico.py` - Gestão Acadêmica

##### **Turma Model (`c824c`)**
Recentemente atualizado para incluir controle de capacidade explícito.
- `id_turma` (PK)
- `codigo_turma` (Unique)
- `ano` (Legado, ex: 2024/2025)
- `capacidade` (Novo campo: Inteiro, default=55) - Permite definir o número máximo de alunos para a turma.
- `id_sala` (FK) -> Sala.capacidade_alunos (Fallback se a turma não tiver capacidade definida).
- `status` ('Ativa', 'Concluída')

##### **Aluno Model**
- Dados pessoais completos (Pai, Mãe, Telefone, Email).
- Histórico acadêmico e status atual.

##### **Matrícula Model**
- Vincula um Aluno a uma Turma em um Ano Lectivo específico.
- Valida capacidade da turma antes de matricular.

### `apis/views/academico_views.py` - Controladores da API

##### **Dashboard ViewSets (`/dashboard`)**
- Estatísticas em tempo real agregadas.
- Contagem por gênero, curso e ano.
- KPIs de monitoramento de turmas ativas vs. concluídas.

##### **TurmaViewSet (`/turmas`)**
- Operações CRUD completas.
- Endpoint customizado `/turmas/{id}/estatisticas/` para ver distribuição de alunos.
- Validação de Ano Lectivo ativo ao criar/editar turmas.

##### **Auth ViewSets (`/auth`)**
- `/auth/login/`: Autenticação e retorno de tokens Access/Refresh.
- `/auth/me/`: Endpoint protegido para carregar perfil do usuário e permissões.

## 🚀 Como Iniciar

1. **Configurar Ambiente Virtual:**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # Linux/Mac
   .venv\Scripts\activate     # Windows
   ```

2. **Instalar Dependências:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Migrar Banco de Dados:**
   ```bash
   python manage.py makemigrations apis
   python manage.py migrate
   ```

4. **Criar Superusuário (Opcional):**
   ```bash
   python manage.py createsuperuser
   ```

5. **Rodar Servidor:**
   ```bash
   python manage.py runserver
   ```
   A API estará disponível em `http://127.0.0.1:8000/api/`.

## 🔒 Segurança e Permissões

- **IsAuthenticated:** A maioria dos endpoints exige token JWT válido no header `Authorization: Bearer <token>`.
- **HasAdditionalPermission:** Classe personalizada para validar permissões granulares (`view_turmas`, `manage_notas`) definidas no perfil do usuário.
- **CORS:** Configurado para aceitar requisições de `http://localhost:5173` (Frontend).

## 🧪 Testes

Comandos úteis para verificar a saúde do projeto:
```bash
python manage.py check          # Verifica integridade dos modelos
python manage.py test apis      # Roda a suíte de testes
```
