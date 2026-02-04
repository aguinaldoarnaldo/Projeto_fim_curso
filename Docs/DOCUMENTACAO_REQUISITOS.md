# Documento de Levantamento de Requisitos e Validação de Processos
**Projeto:** Sistema de Gestão Escolar (Fim de Curso)  
**Data:** 20 de Janeiro de 2026  
**Status:** Rascunho para Validação com a Instituição

---

## 1. Introdução
Este documento visa descrever os processos atuais implementados no software e levantar questões críticas para validação junto à direção da escola. O objetivo é garantir que o sistema reflete a realidade operacional da instituição.

---

## 2. Processos de Negócio (Fluxos de Trabalho)

### 2.1. Gestão do Ano Lectivo e Planeamento
**Dúvida Atual:** Quem inicia o ano e o que precisa estar pronto antes das matrículas?

**Fluxo Sugerido (Padrão):**
1.  **Abertura do Ano:** O Director Pedagógico/Administrativo cria o "Ano Lectivo 2025/2026" no sistema.
2.  **Planeamento de Turmas:** Antes de qualquer aluno chegar, a secretaria define a "Oferta Formativa":
    *   Quais cursos abrem?
    *   Quantas turmas de 10ª classe vamos ter? (Ex: A, B, C)
    *   Quais salas estão disponíveis?
    *   Quais turnos (Manhã/Tarde/Noite)?
    *   *Nota:* No sistema atual, criamos a Turma (Ex: "10ª A - Informática - Sala 1") antes de matricular.

**Perguntas para a Instituição:**
*   [ ] O planeamento das turmas (criar as turmas vazias) é feito antes do período de matrículas iniciar?
*   [ ] Ou as turmas são criadas dinamicamente conforme chegam os alunos? (Raro em escolas formais)
*   [ ] Quem tem permissão para "Abrir o Ano Lectivo"? Apenas o Director?

### 2.2. Processo de Candidatura vs. Matrícula
**Dúvida Atual:** A diferença entre se candidatar e se matricular.

**Fluxo Implementado:**
1.  **Candidatura:** O aluno submete dados básicos, escolhe cursos de preferência e paga uma taxa (RUPE). Faz um exame de admissão.
2.  **Selecção:** A escola lança as notas do exame. Alunos com nota >= 10 mudam para estado "Aprovado".
3.  **Matrícula (O Passo Crítico):** O aluno aprovado confirma a inscrição.

**Perguntas para a Instituição:**
*   [ ] Todos os alunos passam por exame de admissão ou apenas novos?
*   [ ] Alunos antigos (que passaram de ano) precisam fazer "Rematrícula" ou é automático?

### 2.3. Alocação de Turma, Sala e Turno
**Dúvida Atual:** Colocamos o aluno na turma logo no momento da matrícula (balcão)?

**Cenário A (Alocação Imediata - Implementado Atualmente):**
*   O funcionário pergunta: "Qual curso e turno queres?"
*   O sistema mostra: "Temos vaga na Turma A (Manhã) e Turma B (Tarde)".
*   O aluno escolhe, paga, e sai já com o papel a dizer "Sala 5, Turma A".
*   *Vantagem:* O aluno já sabe onde estudar.
*   *Risco:* Se a turma encher, o funcionário tem de gerir isso na hora.

**Cenário B (Alocação Posterior):**
*   O aluno apenas se matricula na "10ª Classe - Curso de Informática".
*   O sistema coloca-o numa "Lista de Espera" ou "Pool Geral".
*   Posteriormente, o Director Pedagógico distribui os alunos pelas turmas (A, B, C) para equilibrar números.
*   *Vantagem:* Melhor organização pedagógica.
*   *Desvantagem:* O aluno não sabe a turma na hora.

**Pergunta Crítica:**
*   [ ] Na vossa escola, o funcionário da secretaria decide a turma do aluno no momento do atendimento (Cenário A) ou isso é feito depois por um chefe (Cenário B)?

---

## 3. Dados Necessários na Matrícula
O sistema atual captura os seguintes dados. Precisamos validar se faltam campos obrigatórios por lei ou norma interna.

### 3.1. Dados do Aluno
*   Nome Completo
*   Data de Nascimento
*   Género
*   Número do BI (Validar se aceitam Cédula para menores?)
*   Telefone & Email (Obrigatório?)
*   Endereço (Município/Bairro)
*   Fotografia

### 3.2. Dados Académicos
*   Curso Escolhido
*   Classe (10ª, 11ª, 12ª, 13ª)
*   **Turma Específica** (O ponto de dúvida acima)
*   Ano Lectivo

### 3.3. Dados do Encarregado de Educação
*   Nome Completo
*   Telefone Principal
*   Grau de Parentesco (Pai, Mãe, Tio...)

**Perguntas para a Instituição:**
*   [ ] A recolha do NIF (Número de Identificação Fiscal) é obrigatória para emissão de faturas? (Atualmente não temos campo NIF explícito no Aluno, usamos BI).
*   [ ] É necessário guardar cópia digitalizada do BI e Certificado de Habilitações no sistema?
*   [ ] Existe algum dado de saúde (alergias, deficiências) que é obrigatório registar?

---

## 4. Próximos Passos Sugeridos
1.  **Imprimir este documento** e agendar uma reunião com o Director Pedagógico e o Chefe de Secretaria.
2.  **Simular uma matrícula** com eles usando o software atual para ver se "sentem falta" de algum passo.
3.  **Ajustar o software** (mudar para Cenário B de alocação, se necessário) baseado nas respostas.

---     

*Documento gerado pela Equipa de Desenvolvimento.*
