# Lista de Permissões do Frontend (Client-Side)

Esta lista contém todas as chaves de permissão que o frontend verifica para habilitar ou desabilitar funcionalidades, menus e botões.
Para que um usuário tenha acesso a uma funcionalidade, o backend deve enviar essas strings no array `permissoes` (ou `permissoes_adicionais`) no objeto do usuário durante o login ou atualização de sessão.

## 1. Painel Geral
| Permissão | Descrição | Funcionalidades |
| :--- | :--- | :--- |
| `view_dashboard` | Ver Dashboard | Acesso à tela inicial com gráficos e resumos. |
| `view_relatorios` | Acessar Relatórios | Acesso à página de relatórios e exportação de dados. |

## 2. Secretaria & Alunos
| Permissão | Descrição | Funcionalidades |
| :--- | :--- | :--- |
| `view_alunos` | Ver Alunos | Listagem de todos os alunos registrados. |
| `create_aluno` | Criar Aluno | Botão "Novo Aluno" no formulário de cadastro. |
| `edit_aluno` | Editar Aluno | Botão de "Editar" na lista ou perfil de alunos. |
| `delete_aluno` | Deletar Aluno | Botão de "Excluir" (geralmente restrito). |
| `view_inscritos` | Ver Inscritos | Acesso à lista de candidatos/inscrições pendentes. |
| `manage_inscritos` | Gerir Inscritos | Botões de Aprovar/Rejeitar inscrição. |
| `view_matriculas` | Ver Matrículas | Acesso à gestão de matrículas ativas. |
| `create_matricula` | Criar Matrícula | Botão "Nova Matrícula" / Confirmar Matrícula. |
| `edit_matricula` | Editar Matrícula | Alterar dados de uma matrícula existente. |

## 3. Gestão Académica
| Permissão | Descrição | Funcionalidades |
| :--- | :--- | :--- |
| `view_turmas` | Ver Turmas | Acesso à lista de turmas e seus detalhes. |
| `manage_turmas` | Gerir Turmas | Botões "Nova Turma", "Editar Turma", Alterar Capacidade. |
| `view_salas` | Ver Salas | Acesso à lista de salas de aula. |
| `manage_salas` | Gerir Salas | Adicionar/Editar/Excluir salas. |
| `view_cursos` | Ver Cursos | Acesso à lista de cursos e áreas de formação. |
| `manage_cursos` | Gerir Cursos | Adicionar/Editar/Excluir cursos e disciplinas. |
| `manage_disciplinas` | Gerir Disciplinas | Configuração de disciplinas por curso/classe. |
| `manage_notas` | Lançar Notas | Acesso ao lançamento de notas e pautas. |
| `manage_faltas` | Registrar Faltas | Acesso ao diário de classe e registro de faltas. |

## 4. Financeiro & Administrativo
| Permissão | Descrição | Funcionalidades |
| :--- | :--- | :--- |
| `view_financeiro` | Ver Financeiro | Dashboard financeiro e lista de pagamentos. |
| `manage_pagamentos` | Gerir Pagamentos | Registrar pagamentos, emitir faturas/recibos. |
| `manage_biblioteca` | Gerir Biblioteca | Gestão de livros e empréstimos. |
| `manage_documentos` | Gerir Documentos | Emissão de declarações, certificados, etc. |
| `view_configuracoes`| Acessar Configurações| Acesso ao menu de configurações do sistema. |
| `manage_usuarios` | Gerir Usuários | Criar/Editar usuários do sistema e atribuir permissões. |

---

### Notas de Implementação
- **Superadmin:** Usuários com `is_superuser=true`, papel `Admin` ou cargo `Administrador` têm acesso total (bypass) a todas as permissões acima no frontend.
- **Permissões Granulares:** Se um usuário não for Admin, o sistema verificará se a string da permissão existe no array `user.permissoes` retornado pela API `/auth/me`.
