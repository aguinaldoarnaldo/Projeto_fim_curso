# Diagrama de Caso de Uso Completo - Frontend SGM (React)

Este diagrama representa a totalidade das funcionalidades implementadas na interface do sistema, organizadas por módulos e permissões de acesso.

## 1. Atores e Responsabilidades
*   **Candidato:** Interage com o portal externo para ingresso.
*   **Funcionário (Secretaria):** Gere o ciclo de vida do aluno e operações acadêmicas.
*   **Administrador:** Superintende o sistema, herda permissões de secretaria e controla infraestrutura/regras.

## 2. Diagrama de Caso de Uso Exhaustivo (Mermaid)

```mermaid
useCaseDiagram
    actor "Candidato" as C
    actor "Funcionário (Secretaria)" as S
    actor "Administrador" as A

    package "Módulo 1: Portal do Candidato (Público)" {
        usecase "Realizar Inscrição Online" as UC155
        usecase "Consultar Estado da Candidatura" as UC2
        usecase "Gerar RUP para Pagamento" as UC3
        usecase "Autenticar-se no Portal" as UC4
        usecase "Redefinir Senha de Acesso" as UC5
    }

    package "Módulo 2: Gestão de Candidaturas (Inscritos)" {
        usecase "Visualizar Lista de Inscritos" as UC6
        usecase "Validar Documentos e Aprovar Candidato" as UC7
        usecase "Agendar Exame de Admissão" as UC8
        usecase "Lançar Resultados de Exames" as UC9
        usecase "Imprimir Pautas e Listas de Chamada" as UC10
        usecase "Gerir Lista de Espera (Chamamento)" as UC11
    }

    package "Módulo 3: Secretaria e Matrículas" {
        usecase "Efetivar Matrícula (Converter Inscrito em Aluno)" as UC12
        usecase "Gerir Cadastro de Alunos (Fichas)" as UC13
        usecase "Emitir Provas de Matrícula (PDF)" as UC14
        usecase "Anular ou Editar Matrícula" as UC15
        usecase "Consultar Histórico do Aluno" as UC16
    }

    package "Módulo 4: Gestão Académica e Estrutura" {
        usecase "Gerir Cursos e Currículos" as UC17
        usecase "Gerir Classes e Disciplinas" as UC18
        usecase "Gerir Salas e Capacidades" as UC19
        usecase "Gerir Turmas e Horários" as UC20
        usecase "Alocar Alunos em Turmas Específicas" as UC21
        usecase "Controlar Vagas por Curso e Turno" as UC22
    }

    package "Módulo 5: Analítico e Inteligência de Dados" {
        usecase "Monitorar Dashboard em Tempo Real" as UC23
        usecase "Visualizar Gráficos de Fluxo e Ocupação" as UC24
        usecase "Gerar Relatórios de Estatística Geral" as UC25
        usecase "Exportar Mapas de Aproveitamento" as UC26
    }

    package "Módulo 6: Administração e Configurações" {
        usecase "Gerir Anos Lectivos (Abertura/Fecho)" as UC27
        usecase "Administrar Usuários e Cargos" as UC28
        usecase "Configurar Permissões de Acesso" as UC29
        usecase "Executar e Agendar Backups" as UC30
        usecase "Gerir Perfil e Preferências" as UC31
    }

    %% Relações do Candidato
    C --> UC1
    C --> UC2
    C --> UC3
    C --> UC4
    C --> UC5

    %% Relações da Secretaria
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
    S --> UC20
    S --> UC21
    S --> UC23
    S --> UC24
    S --> UC31

    %% Relações do Administrador
    A --|> S
    A --> UC17
    A --> UC18
    A --> UC19
    A --> UC22
    A --> UC25
    A --> UC26
    A --> UC27
    A --> UC28
    A --> UC29
    A --> UC30
```

## 3. Matriz de Cobertura de Funcionalidades

| Módulo Frontend | Funcionalidades Cobertas (Casos de Uso) |
| :--- | :--- |
| **Acesso e Segurança** | Autenticação, Redefinição de Senha, Gestão de Usuários, Cargos e Permissões. |
| **Portal Público** | Inscrição, Consulta de Status, Geração de RUP. |
| **Gestão de Candidatos** | Listagem, Validação, Agendamento, Notas de Exame, Pautas de Exame, Lista de Espera. |
| **Matrículas e Alunos** | Conversão de Candidato, Ficha de Aluno, Edição de Matrícula, Comprovativos PDF. |
| **Estrutura Escolar** | Cursos, Classes, Salas, Turmas, Disciplinas, Gestão Dinâmica de Vagas. |
| **BI e Dashboards** | Dashboard de Vagas, Fluxo de Matrícula, Gráficos de Gênero, Relatórios Estatísticos. |
| **Manutenção** | Gestão de Anos Lectivos (Ciclo de Vida), Backup e Recuperação de Dados. |

---
*Este documento reflete a versão final do sistema de gestão escolar.*
