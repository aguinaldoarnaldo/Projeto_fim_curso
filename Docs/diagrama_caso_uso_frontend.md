# Diagrama de Caso de Uso Completo - Frontend SGM (React)

Este diagrama representa a totalidade das funcionalidades implementadas na interface do sistema, com casos de uso detalhados e específicos por acção.

## 1. Atores e Responsabilidades
*   **Candidato:** Interage com o portal externo de forma **pública e anónima**, sem necessidade de autenticação.
*   **Funcionário (Secretaria):** Gere o ciclo de vida do candidato e do aluno, e operações académicas. Requer autenticação no sistema.
*   **Administrador:** Superintende o sistema, herda todas as permissões da secretaria e controla infraestrutura/regras globais. Requer autenticação no sistema.

> **Nota:** O Candidato é um actor **externo e não autenticado**. A autenticação (login e recuperação de senha) aplica-se **apenas** aos utilizadores internos (Funcionários e Administradores).

## 2. Diagrama de Caso de Uso Exhaustivo (Mermaid)

```mermaid
useCaseDiagram
    actor "Candidato (Público)" as C
    actor "Funcionário (Secretaria)" as S
    actor "Administrador" as A

    package "Módulo 1: Portal do Candidato (Acesso Público — Sem Login)" {
        usecase "Preencher e Submeter Formulário de Inscrição" as UC1
        usecase "Consultar Estado da Candidatura por BI ou Nº Inscrição" as UC2
        usecase "Gerar Referência RUP para Pagamento" as UC3
        usecase "Confirmar Pagamento do RUP" as UC4
        usecase "Descarregar Comprovativo de Inscrição em PDF" as UC5
    }

    package "Módulo 2: Acesso Interno ao Sistema" {
        usecase "Iniciar Sessão no Sistema (Login)" as UC6
        usecase "Solicitar Recuperação de Senha por Email" as UC7
        usecase "Definir Nova Senha via Link de Recuperação" as UC8
        usecase "Editar Dados do Perfil Pessoal" as UC9
    }

    package "Módulo 3: Gestão de Candidaturas (Inscritos)" {
        usecase "Listar Todos os Candidatos Inscritos" as UC10
        usecase "Pesquisar Candidato por Nome, BI ou Nº Inscrição" as UC11
        usecase "Visualizar Ficha Detalhada do Candidato" as UC12
        usecase "Editar Dados do Candidato" as UC13
        usecase "Filtrar Candidatos por Status, Ano ou Curso" as UC14
        usecase "Lançar Nota de Exame do Candidato" as UC15
        usecase "Distribuir Candidatos por Salas de Exame" as UC16
        usecase "Imprimir Lista de Chamada por Sala e Data" as UC17
        usecase "Adicionar Candidato à Lista de Espera" as UC18
        usecase "Chamar Candidato da Lista de Espera para Vaga" as UC19
        usecase "Remover Candidato da Lista de Espera" as UC20
        usecase "Matricular Candidato Aprovado (Converter em Aluno)" as UC21
    }

    package "Módulo 4: Alunos e Matrículas" {
        usecase "Listar Todos os Alunos Matriculados" as UC22
        usecase "Pesquisar Aluno por Nome ou Número de Matrícula" as UC23
        usecase "Visualizar Ficha Completa do Aluno" as UC24
        usecase "Editar Dados Pessoais do Aluno" as UC25
        usecase "Alterar Status do Aluno (Activo, Inactivo, Transferido)" as UC26
        usecase "Emitir Comprovativo de Matrícula em PDF" as UC27
        usecase "Anular Matrícula do Aluno" as UC28
        usecase "Consultar Histórico de Matrículas do Aluno" as UC29
    }

    package "Módulo 5: Turmas" {
        usecase "Listar Todas as Turmas" as UC30
        usecase "Criar Nova Turma" as UC31
        usecase "Editar Dados da Turma" as UC32
        usecase "Eliminar Turma" as UC33
        usecase "Alocar Aluno a uma Turma" as UC34
        usecase "Transferir Aluno entre Turmas" as UC35
    }

    package "Módulo 6: Cursos" {
        usecase "Listar Todos os Cursos" as UC36
        usecase "Criar Novo Curso" as UC37
        usecase "Editar Dados do Curso" as UC38
        usecase "Eliminar Curso" as UC39
    }

    package "Módulo 7: Salas" {
        usecase "Listar Todas as Salas" as UC40
        usecase "Criar Nova Sala" as UC41
        usecase "Editar Dados da Sala (Capacidade, Bloco)" as UC42
        usecase "Eliminar Sala" as UC43
    }

    package "Módulo 8: Vagas e Capacidade" {
        usecase "Visualizar Ocupação de Vagas por Curso" as UC44
        usecase "Definir Número de Vagas por Curso e Turno" as UC45
        usecase "Actualizar Vagas Disponíveis Manualmente" as UC46
    }

    package "Módulo 9: Dashboard e Relatórios" {
        usecase "Visualizar KPIs no Dashboard em Tempo Real" as UC47
        usecase "Consultar Totais de Alunos por Status" as UC48
        usecase "Consultar Totais de Turmas Activas e Concluídas" as UC49
        usecase "Visualizar Agenda de Eventos Académicos" as UC50
        usecase "Gerar Relatório Geral de Estatísticas" as UC51
        usecase "Exportar Mapa de Aproveitamento" as UC52
    }

    package "Módulo 10: Administração do Sistema" {
        usecase "Listar Todos os Utilizadores do Sistema" as UC53
        usecase "Criar Novo Utilizador (Funcionário ou Admin)" as UC54
        usecase "Editar Dados do Utilizador" as UC55
        usecase "Desactivar ou Reactivar Utilizador" as UC56
        usecase "Atribuir Cargo e Permissões ao Utilizador" as UC57
        usecase "Criar Novo Ano Lectivo" as UC58
        usecase "Definir Ano Lectivo como Activo" as UC59
        usecase "Fechar Ano Lectivo" as UC60
        usecase "Configurar Datas do Cronograma Académico" as UC61
        usecase "Abrir ou Fechar Portal de Candidaturas" as UC62
        usecase "Criar Backup da Base de Dados" as UC63
        usecase "Restaurar Backup da Base de Dados" as UC64
        usecase "Configurar Dados e Logo da Escola" as UC65
    }

    %% ── Candidato (Público, sem login) ──────────────────────────
    C --> UC1
    C --> UC2
    C --> UC3
    C --> UC4
    C --> UC5

    %% ── Funcionário (autenticado) ────────────────────────────────
    S --> UC6
    S --> UC7
    S --> UC8
    S --> UC9
    S --> UC10
    S --> UC11
    S --> UC12
    S --> UC13
    S --> UC14
    S --> UC15
    S --> UC16
    S --> UC17
    S --> UC18
    S --> UC19
    S --> UC20
    S --> UC21
    S --> UC22
    S --> UC23
    S --> UC24
    S --> UC25
    S --> UC26
    S --> UC27
    S --> UC28
    S --> UC29
    S --> UC30
    S --> UC34
    S --> UC35
    S --> UC44
    S --> UC47
    S --> UC48
    S --> UC49
    S --> UC50

    %% ── Administrador (herda Secretaria + privilégios extra) ─────
    A --|> S
    A --> UC31
    A --> UC32
    A --> UC33
    A --> UC36
    A --> UC37
    A --> UC38
    A --> UC39
    A --> UC40
    A --> UC41
    A --> UC42
    A --> UC43
    A --> UC45
    A --> UC46
    A --> UC51
    A --> UC52
    A --> UC53
    A --> UC54
    A --> UC55
    A --> UC56
    A --> UC57
    A --> UC58
    A --> UC59
    A --> UC60
    A --> UC61
    A --> UC62
    A --> UC63
    A --> UC64
    A --> UC65
```

## 3. Separação Clara de Acesso

| Actor | Autenticação? | Scope de Acção |
| :--- | :---: | :--- |
| **Candidato** | ❌ Não — acesso público e anónimo | Inscrição, consulta de estado, geração de RUP, pagamento, comprovativo |
| **Funcionário** | ✅ Sim — login obrigatório | Candidatos, alunos, matrículas, alocar alunos em turmas, dashboard, relatórios |
| **Administrador** | ✅ Sim — login obrigatório | Tudo do Funcionário + criar/editar/eliminar turmas, cursos, salas, anos lectivos, utilizadores, permissões, backups, configurações |

## 4. Matriz de Cobertura de Funcionalidades

| Módulo Frontend | Casos de Uso Detalhados |
| :--- | :--- |
| **Portal Público (Candidato)** | Submeter inscrição, consultar estado por BI/Nº, gerar RUP, confirmar pagamento, descarregar comprovativo PDF |
| **Acesso Interno** | Iniciar sessão, recuperar senha por email, definir nova senha, editar perfil pessoal |


| **Gestão de Candidatos** | Listar, pesquisar, visualizar ficha, editar, filtrar, lançar nota, distribuir por salas, imprimir lista de chamada, lista de espera (adicionar, chamar, remover), matricular |


| **Alunos e Matrículas** | Listar, pesquisar, visualizar ficha, editar dados, alterar status, emitir comprovativo PDF, anular matrícula, historial |


| **Turmas** | Listar, criar, editar, eliminar, alocar aluno, transferir aluno entre turmas |


| **Cursos** | Listar, criar, editar, eliminar |

| **Salas** | Listar, criar, editar (capacidade, bloco), eliminar |

| **Vagas** | Visualizar ocupação, definir vagas por curso/turno, actualizar manualmente |

| **Dashboard e Relatórios** | KPIs em tempo real, totais por status de aluno/turma, agenda académica, relatórios, exportar mapas |

| **Administração** | Utilizadores (listar, criar, editar, desactivar, atribuir cargo), anos lectivos (criar, activar, fechar, cronograma), portal (abrir/fechar), backups (criar, restaurar), configurações da escola |

---
*Este documento reflete a versão final do sistema de gestão escolar.*
