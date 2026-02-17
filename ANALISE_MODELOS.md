# 📊 Análise de Modelos/Tabelas do Backend

## 🎯 Objetivo
Identificar modelos (tabelas) que **NÃO estão sendo usados** no sistema para limpeza do código.

---

## ✅ Modelos ATIVAMENTE USADOS (NÃO REMOVER)

### 📚 **Acadêmico** (`academico.py`)
- ✅ **AnoLectivo** - Usado em matrículas, candidaturas, configurações
- ✅ **Curso** - Usado em turmas, matrículas, candidaturas
- ✅ **Sala** - Usado em turmas
- ✅ **Turma** - Usado em matrículas, notas, faltas
- ✅ **Classe** - Usado em turmas e matrículas

### 👥 **Usuários** (`usuarios.py`)
- ✅ **Cargo** - Usado em funcionários e usuários
- ✅ **Usuario** - Sistema de autenticação
- ✅ **Funcionario** - Gestão de funcionários
- ✅ **Encarregado** - Usado em alunos e matrículas

### 🎓 **Alunos** (`alunos.py`)
- ✅ **Aluno** - Core do sistema
- ✅ **AlunoEncarregado** - Relacionamento aluno-encarregado

### 📝 **Candidaturas** (`candidatura.py`)
- ✅ **Candidato** - Sistema de inscrições
- ✅ **DocumentoCandidato** - Documentos dos candidatos
- ✅ **RUPE** - Pagamentos de candidaturas
- ✅ **ListaEspera** - Gestão de lista de espera

### 📋 **Matrículas** (`matriculas.py`)
- ✅ **Matricula** - Core do sistema
- ✅ **PermutaMatricula** - Transferências entre turmas

### ⚙️ **Configuração** (`configuracao.py`)
- ✅ **Configuracao** - Configurações globais do sistema

### 🔍 **Auditoria** (`auditoria.py`)
- ✅ **LoginActivity** - Logs de login
- ✅ **Backup** - Histórico de backups

---

## ⚠️ Modelos COM USO PARCIAL (Avaliar)

### 📊 **Avaliações** (`avaliacoes.py`)
**Status:** Implementado mas **não usado no frontend**

- ⚠️ **TipoDisciplina** - Usado apenas em `Disciplina`
- ⚠️ **Disciplina** - Usado em:
  - `academic_service.py` (importado mas não usado ativamente)
  - `academico_views.py` (endpoint `/cursos/{id}/disciplinas/`)
  - `avaliacao_views.py` (importado)
- ⚠️ **DisciplinaCurso** - Relacionamento disciplina-curso
- ⚠️ **ProfessorDisciplina** - Vinculação professor-disciplina-turma
- ⚠️ **Nota** - Usado em:
  - `academic_service.py` (cálculo de médias)
  - `aluno_views.py` (endpoint `/alunos/{id}/notas/`)
  - `avaliacao_views.py` (CRUD de notas)
- ⚠️ **FaltaAluno** - Usado em `academic_service.py`

**Análise:**
- ✅ **Backend implementado** com endpoints funcionais
- ❌ **Frontend NÃO implementado** - Não há páginas para gestão de notas/disciplinas
- 🤔 **Decisão:** Manter se planeja implementar no futuro, remover se não

---

## 🔴 Modelos NÃO USADOS (Candidatos à Remoção)

### 📚 **Biblioteca** (`biblioteca.py`)
**Status:** ❌ **NÃO USADO**

- ❌ **Categoria** - Apenas importado, sem uso real
- ❌ **Livro** - Apenas importado, sem uso real

**Evidências:**
- Tem ViewSet (`biblioteca_views.py`) mas **não está registrado nas URLs**
- Não há frontend implementado
- Não é usado em nenhum outro módulo

**Recomendação:** ✅ **REMOVER**

---

### 💰 **Financeiro** (`financeiro.py`)
**Status:** ❌ **PARCIALMENTE USADO**

- ⚠️ **Fatura** - Usado apenas em:
  - `document_service.py` (importado mas não usado ativamente)
  - `relatorio_views.py` (relatório de pagamentos)
- ⚠️ **Pagamento** - Usado apenas em `relatorio_views.py`

**Evidências:**
- Tem ViewSet (`financeiro_views.py`) mas **não está registrado nas URLs**
- Não há frontend implementado
- Apenas usado em relatórios (que também não estão no frontend)

**Recomendação:** ⚠️ **AVALIAR** - Se não planeja implementar gestão financeira, pode remover

---

### 📄 **Documentos** (`documentos.py`)
**Status:** ❌ **NÃO USADO**

- ❌ **Documento** - Não usado em lugar nenhum
- ❌ **SolicitacaoDocumento** - Usado apenas em `document_service.py` (que não é chamado)

**Evidências:**
- Não tem ViewSet
- Não está nas URLs
- Não há frontend implementado
- `document_service.py` existe mas não é usado

**Recomendação:** ✅ **REMOVER**

---

### 🔔 **Notificações** (`notificacao.py`)
**Status:** ❌ **PARCIALMENTE IMPLEMENTADO**

- ⚠️ **Notificacao** - Usado em:
  - `notificacao.py` (ViewSet existe)
  - `matriculas.py` (cria notificação quando matrícula é criada)
  - Registrado nas URLs

**Evidências:**
- ✅ Backend funcional
- ❌ Frontend não implementado (não há sistema de notificações na UI)

**Recomendação:** ⚠️ **AVALIAR** - Funcionalidade útil mas não visível para o usuário

---

### 📚 **Histórico Escolar** (`historico.py`)
**Status:** ⚠️ **USADO MAS LIMITADO**

- ⚠️ **HistoricoEscolar** - Usado em:
  - `matricula_views.py` (criação de matrícula com histórico)
  - `aluno_serializers.py` (serialização)

**Evidências:**
- ✅ Usado no backend (criação de matrículas)
- ❌ Não há CRUD dedicado
- ❌ Frontend não mostra histórico escolar

**Recomendação:** ⚠️ **MANTER** - É usado na criação de matrículas

---

## 📋 Resumo de Recomendações

### ✅ REMOVER COM SEGURANÇA:
1. **biblioteca.py** (Categoria, Livro)
2. **documentos.py** (Documento, SolicitacaoDocumento)

### ⚠️ AVALIAR (Depende dos seus planos):
3. **financeiro.py** (Fatura, Pagamento) - Se não vai implementar gestão financeira
4. **notificacao.py** (Notificacao) - Se não vai implementar sistema de notificações
5. **avaliacoes.py** (Disciplina, Nota, FaltaAluno) - Se não vai implementar gestão de notas

### ✅ MANTER:
- Todos os outros modelos estão ativamente em uso

---

## 🚀 Próximos Passos

Se decidir remover, siga esta ordem:

1. **Remover imports** dos modelos em `models/__init__.py`
2. **Remover serializers** correspondentes
3. **Remover views** correspondentes
4. **Remover registros de URLs**
5. **Deletar arquivos** de modelos
6. **Criar e aplicar migration** para remover tabelas do banco de dados

```bash
# Após remover os modelos do código
python manage.py makemigrations
python manage.py migrate
```

⚠️ **ATENÇÃO:** Faça backup do banco de dados antes de aplicar as migrations!
