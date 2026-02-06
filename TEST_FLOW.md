# TESTE DE FLUXO PONTA-A-PONTA (E2E)

Este documento descreve os passos para verificar manualmente o funcionamento completo do sistema, desde a candidatura até a matricula.

## 1. Candidatura Online (Perfil: Público/Candidato)
1. Acesse `/candidatura`.
2. Preencha o formulário:
   - **Dados Pessoais**: Use um BI único (ex: `000TESTE2026`).
   - **Documentos**: Anexe PDFs válidos para BI e Certificado.
   - **Cursos**: Selecione Informática como 1ª opção.
3. Submeta o formulário.
4. **Verifique**:
   - Se gerou o número de inscrição.
   - Se o botão "Baixar Comprovativo" aparece e gera um PDF com os dados corretos.

## 2. Aprovação e Exame (Perfil: Admin/Secretaria)
1. Acesse o Painel Administrativo.
2. Vá para **Processo de Admissão > Inscritos**.
3. Localize o candidato `000TESTE2026`.
4. Ação: Marcar Exame (se aplicável) ou Aprovar diretamente.
   - Se marcar exame: Lance uma nota > 10.
5. Altere o estado para **Aprovado**.

## 3. Matrícula e Validação (Perfil: Secretaria)
1. Vá para a página de **Matrículas**.
2. Clique em **Nova Matrícula**.
3. Em "Selecionar Aluno", escolha a aba "Candidatos Aprovados".
4. Selecione o candidato `000TESTE2026`.
5. **Teste de Validação**:
   - Tente submeter *sem* selecionar turma. (Deve falhar)
   - O sistema deve carregar automaticamente os documentos do candidato.
6. Selecione uma Turma válida (verifique o Indicador de Vagas).
7. Clique em **Confirmar Matrícula**.
8. **Verifique**:
   - Mensagem de Sucesso.
   - O candidato desaparece da lista de "Aprovados" e aparece na lista de "Alunos".

## 4. Pós-Matrícula
1. Na lista de Matrículas, clique no aluno recém-criado.
2. Clique em **Baixar Ficha**.
3. Verifique se o PDF contém:
   - Dados do aluno.
   - Turma correta.
   - Sem foto de perfil (layout ajustado).
