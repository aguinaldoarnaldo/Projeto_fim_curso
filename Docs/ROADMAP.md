# 🚀 Roteiro de Finalização: Sistema de Gestão de Matrículas

Este documento contém a lista de tarefas pendentes para terminar o projeto até ao final do mês. 
**Status Atual:** 🟢 Fase Final (Polimento e Entrega)

---

## 📋 Lista de Tarefas (To-Do)

### 1. Limpeza e Organização (Backend & Frontend)
- [x] **Organizar Scripts Backend:** Mover ficheiros de teste/debug do diretório raiz para `backend/scripts/`.
- [x] **Limpeza de Ficheiros Temporários:** Eliminar logs e ficheiros `.txt` desnecessários no raiz do backend.
- [x] **Refatoração do Frontend:** Dividir o ficheiro `Inscritos.jsx` (+1500 linhas) em componentes menores (Modais, Tabelas).
- [x] **Remover Páginas Mortas:** Eliminar ou desativar rotas e links para páginas não implementadas (ex: Ajuda, Biblioteca).

### 2. Branding Dinâmico e Configurações
- [x] **Integração de Logo/Nome:** Garantir que o nome da escola e o logotipo definidos nas "Configurações" aparecem em todos os cabeçalhos.
- [x] **Configuração Geral:** Vincular o estado de "Candidaturas Abertas" à visibilidade do formulário público.

### 3. Funcionalidades Críticas de Matrícula
- [x] **Geração de PDF (Ficha de Matrícula):** Criar a funcionalidade de exportar a ficha oficial do aluno em PDF após a matrícula.
- [x] **Comprovativo de Inscrição:** Gerar recibo/comprovativo para o candidato imprimir após se inscrever online.
- [x] **Indicador de Vagas:** Adicionar um aviso visual no momento da matrícula se a turma estiver quase cheia (ex: "38/40 vagas").

### 4. Estabilidade e Segurança
- [x] **Validação de Documentos:** Impedir a finalização da matrícula se os documentos obrigatórios (BI/Certificado) não estiverem presentes. (Implementado via Model & Serializer)
- [x] **Teste de Fluxo Ponta-a-Ponta:** Simular desde a inscrição online até à alocação na turma para garantir que não há erros de ID. (Validado com script de stress test)
- [x] **Revisão de Permissões:** Testar se cada cargo (Secretário, Admin, Diretor) vê apenas o que deve.

### 5. Finalização e Entrega
- [x] **Ficheiro README.md:** Atualizar com instruções claras de instalação.
- [x] **Guia de Utilizador:** Criar um pequeno manual de instruções (opcional).
- [x] **Preparação para Produção:** Configurar variáveis de ambiente e segurança final. (.env e Security Headers configurados)

---

## ✅ Concluído (Log de Progresso)

- [x] **Sistema de Backup:** Implementado e funcional (Base de dados + Media).
- [x] **Gestão de Utilizadores:** Sistema de cargos e permissões granular.
- [x] **Dashboard Real-time:** Gráficos e estatísticas baseados em dados reais.
- [x] **Fluxo de Candidatura:** Candidato -> Avaliação -> Matrícula.
- [x] **Gestão de Anos Lectivos:** Ativação/Desativação de períodos escolares.
- [x] **Atualização de Estados:** Novos estados para Matrícula e Aluno implementados.

---
*Este documento deve ser atualizado pelo assistente sempre que uma tarefa for concluída.*
