# Plano de Testes - Sistema de Gestão Académica (SGM)

Este documento descreve o plano de testes para validação das funcionalidades do sistema, garantindo que todos os módulos operem conforme os requisitos estabelecidos.

---

## 1. Objetivos do Teste
- Validar a integridade dos dados em todo o fluxo académico.
- Garantir que as restrições de permissão (RBAC) estão a ser aplicadas correctamente.
- Verificar a usabilidade e a resposta visual do sistema (loaders, feedbacks).
- Assegurar a geração correcta de documentos em PDF (Comprovativos, Fichas).

## 2. Ambiente de Teste
- **Frontend**: React (Vite)
- **Backend**: Django / Python
- **Base de Dados**: PostgreSQL / SQLite (conforme ambiente)
- **Navegadores**: Chrome, Firefox, Edge (Versões actualizadas)

---

## 3. Módulos e Funcionalidades (Checklist)

### 3.1. Autenticação e Acesso
- [ ] **Login**: Testar com credenciais válidas e inválidas.
- [ ] **Recuperação de Senha**: Verificar envio de e-mail e fluxo de redefinição.
- [ ] **Permissões**: Tentar aceder a rotas restritas via URL sem a permissão devida (ex: `/configuracoes` com perfil de utilizador comum).
- [ ] **Logout**: Garantir que a sessão é limpa no `sessionStorage` e o utilizador é redireccionado.

### 3.2. Secretaria Académica (Candidatos e Alunos)
- [ ] **Candidatura**: Realizar uma inscrição completa e verificar se o número de inscrição é gerado.
- [ ] **Filtros**: Testar a pesquisa por Nome, BI e Estado na lista de inscritos.
- [ ] **Edição**: Alterar dados de um aluno existente e confirmar a persistência no banco de dados.
- [ ] **Documentação**: Abrir e validar o PDF do comprovativo de candidatura.

### 3.3. Processo de Matrícula
- [ ] **Nova Matrícula**: Realizar o fluxo completo (Seleção de Candidato Aprovado -> Escolha de Turma -> Confirmação).
- [ ] **Validações de Regras**:
    - [ ] Tentar matricular sem selecionar turma.
    - [ ] Tentar matricular em turma sem vagas (testar o indicador de ocupação).
- [ ] **Conversão**: Verificar se o candidato aprovado desaparece da lista de inscritos e aparece na lista de alunos após a matrícula.

### 3.4. Gestão Pedagógica
- [ ] **Cursos e Salas**: Adicionar, editar e visualizar registos.
- [ ] **Turmas**:
    - [ ] Criar turma e associar a uma sala.
    - [ ] Verificar se a capacidade total da sala respeita o limite de alunos na turma.
- [ ] **Vagas**: Validar a atualização do gráfico/lista de vagas por curso após novas matrículas.

### 3.5. Dashboard e Relatórios
- [ ] **Dashboard**: Verificar se os contadores (Total Alunos, Turmas, etc.) batem com a realidade dos dados.
- [ ] **Relatórios**: Gerar relatórios de estatísticas e verificar a precisão dos dados apresentados.

---

## 4. Fluxo Crítico Ponta-a-Ponta (E2E)

Este é o fluxo principal que deve ser verificado sem erros:
1. **Inscrição**: Candidato submete formulário em `/candidatura`.
2. **Aprovação**: Admin aprova o candidato na lista de **Inscritos**.
3. **Matrícula**: Secretaria realiza a matrícula do candidato aprovado numa **Turma**.
4. **Verificação**: Confirmar que o aluno agora possui uma **Ficha de Matrícula** e está listado em `/alunos`.

---

## 5. Critérios de Aceitação
- O sistema não deve apresentar erros de "página em branco" (Crises de Runtime).
- Todas as operações de Criação (POST) e Edição (PUT/PATCH) devem exibir mensagens de sucesso/erro claras.
- Documentos PDF não devem conter campos "undefined" ou erros de formatação.
- Tempos de resposta em listagens longas devem ser mitigados por paginação ou esqueletos de carregamento.

---

## 6. Como Reportar Erros
Ao encontrar um problema, documente-o com:
1. **Título**: Breve descrição (ex: "Erro ao baixar PDF de matrícula").
2. **Passos para Reproduzir**: O que clicou e onde estava.
3. **Comportamento Esperado** vs **Comportamento Obtido**.
4. **Captura de Ecrã**: (Sempre que possível).

---
*Plano gerado em: 23/03/2026*
