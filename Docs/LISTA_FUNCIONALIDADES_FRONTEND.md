# Lista de Funcionalidades e Permissões do Frontend

Este documento lista todas as funcionalidades disponíveis na interface do usuário (Frontend) e as permissões necessárias para acessá-las. Use estas chaves de permissão ao configurar cargos ou usuários no painel administrativo.

## 1. Painel Principal (Dashboard)
| Funcionalidade | Código da Permissão | Descrição |
| :--- | :--- | :--- |
| **Ver Dashboard** | `view_dashboard` | Visualizar estatísticas gerais, contagem de alunos e atalhos na tela inicial. |
| **Ver Relatórios** | `view_relatorios` | Acessar a página de relatórios estatísticos e gerenciais. |

## 2. Secretaria Académica
Funcionalidades relacionadas à gestão dos estudantes e processos de entrada.

### Gestão de Candidatos (Inscritos / Lista de Espera)
| Funcionalidade | Código da Permissão | Descrição |
| :--- | :--- | :--- |
| **Ver Candidatos** | `view_inscritos` | Acessar a lista de pré-inscritos e lista de espera. |
| **Gerir Candidatos** | `manage_inscritos` | Aprovar candidaturas, rejeitar, chamar da lista de espera e adicionar novos candidatos manualmente. |

### Gestão de Alunos (Fichas)
| Funcionalidade | Código da Permissão | Descrição |
| :--- | :--- | :--- |
| **Ver Lista de Alunos** | `view_alunos` | Acessar a listagem completa de alunos cadastrados. |
| **Criar Novo Aluno** | `create_aluno` | Cadastrar manualmente um novo aluno no sistema. |
| **Editar Dados do Aluno** | `edit_aluno` | Alterar informações pessoais, documentos e contactos de um aluno existente. |
| **Eliminar Aluno** | `delete_aluno` | (Apenas Admin) Remover um registo de aluno do sistema. |

### Processo de Matrícula
| Funcionalidade | Código da Permissão | Descrição |
| :--- | :--- | :--- |
| **Ver Matrículas** | `view_matriculas` | Visualizar histórico de matrículas e confirmações. |
| **Realizar Matrícula** | `create_matricula` | Efectuar novas matrículas e confirmar processos de inscrição. |
| **Editar Matrícula** | `edit_matricula` | Alterar dados de uma matrícula, mudar turma ou anular. |
| **Gerir Documentos** | `manage_documentos` | Emitir e gerir documentos (Fichas, Declarações) associados à matrícula. |

## 3. Gestão Pedagógica
Configuração e gestão da estrutura escolar e avaliações.

### Estrutura Escolar
| Funcionalidade | Código da Permissão | Descrição |
| :--- | :--- | :--- |
| **Ver Turmas** | `view_turmas` | Acessar a lista de turmas e ver distribuição de alunos. |
| **Criar/Editar Turmas** | `manage_turmas` | Criar novas turmas, definir capacidade, associar salas e coordenadores. |
| **Ver Salas** | `view_salas` | Visualizar lista de salas de aula. |
| **Gerir Salas** | `manage_salas` | Adicionar ou editar salas e suas capacidades. |
| **Ver Cursos** | `view_cursos` | Visualizar os cursos oferecidos pela instituição. |
| **Gerir Cursos** | `manage_cursos` | Adicionar novos cursos, definir currículos e coordenadores de curso. |
| **Gerir Disciplinas** | `manage_disciplinas` | Configurar disciplinas curriculares por curso e classe. |


## 4. Administração e Sistema
Configurações globais e controle de acesso.

### Configurações Gerais
| Funcionalidade | Código da Permissão | Descrição |
| :--- | :--- | :--- |
| **Acessar Configurações** | `view_configuracoes` | Acessar o painel de configurações gerais (Identidade visual, Anos Lectivos). |
| **Backups e Manutenção** | `view_configuracoes` | (Requer acesso às configurações) Gerar e restaurar backups do sistema. |

### Gestão de Usuários
| Funcionalidade | Código da Permissão | Descrição |
| :--- | :--- | :--- |
| **Gerir Usuários** | `manage_usuarios` | Criar contas de acesso, criar cargos e atribuir permissões específicas. |

