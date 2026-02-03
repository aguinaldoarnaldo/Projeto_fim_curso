/**
 * Definição de permissões e papéis do sistema
 */

export const PERMISSIONS = {
    // Dashboard
    VIEW_DASHBOARD: 'view_dashboard',

    // Alunos
    VIEW_ALUNOS: 'view_alunos',
    CREATE_ALUNO: 'create_aluno',
    EDIT_ALUNO: 'edit_aluno',
    DELETE_ALUNO: 'delete_aluno',

    // Inscritos (Candidatos)
    VIEW_INSCRITOS: 'view_inscritos',
    MANAGE_INSCRITOS: 'manage_inscritos', // Aprovar, rejeitar

    // Matrículas
    VIEW_MATRICULAS: 'view_matriculas',
    CREATE_MATRICULA: 'create_matricula',
    EDIT_MATRICULA: 'edit_matricula',

    // Acadêmico (Turmas, Salas, Cursos)
    VIEW_TURMAS: 'view_turmas',
    MANAGE_TURMAS: 'manage_turmas',
    VIEW_SALAS: 'view_salas',
    MANAGE_SALAS: 'manage_salas',
    VIEW_CURSOS: 'view_cursos',
    MANAGE_CURSOS: 'manage_cursos',

    // Avaliações & Notas
    MANAGE_NOTAS: 'manage_notas',
    MANAGE_DISCIPLINAS: 'manage_disciplinas',
    MANAGE_FALTAS: 'manage_faltas',

    // Financeiro
    VIEW_FINANCEIRO: 'view_financeiro',
    MANAGE_PAGAMENTOS: 'manage_pagamentos',

    // Biblioteca & Documentos
    MANAGE_BIBLIOTECA: 'manage_biblioteca',
    MANAGE_DOCUMENTOS: 'manage_documentos',

    // Administração
    VIEW_CONFIGURACOES: 'view_configuracoes',
    VIEW_RELATORIOS: 'view_relatorios',
    MANAGE_USUARIOS: 'manage_usuarios',
};

export const ROLES = {
    ADMIN: ['administrador', 'admin', 'diretor', 'diretor geral', 'diretor adjunto', 'coord', 'coordenador'],
    SECRETARIA: ['secretário', 'secretaria', 'secretario'],
    PROFESSOR: ['professor', 'docente'],
    ALUNO: ['aluno'],
    ENCARREGADO: ['encarregado']
};

export const ROLE_PERMISSIONS = {
    ADMIN: Object.values(PERMISSIONS),
    SECRETARIA: [
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.VIEW_ALUNOS, PERMISSIONS.CREATE_ALUNO, PERMISSIONS.EDIT_ALUNO,
        PERMISSIONS.VIEW_INSCRITOS, PERMISSIONS.MANAGE_INSCRITOS,
        PERMISSIONS.VIEW_MATRICULAS, PERMISSIONS.CREATE_MATRICULA, PERMISSIONS.EDIT_MATRICULA,
        PERMISSIONS.VIEW_TURMAS, 
        PERMISSIONS.VIEW_SALAS,
        PERMISSIONS.VIEW_CURSOS,
        PERMISSIONS.VIEW_RELATORIOS,
        PERMISSIONS.VIEW_CONFIGURACOES,
        PERMISSIONS.MANAGE_DOCUMENTOS
    ],
    PROFESSOR: [
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.VIEW_TURMAS,
        PERMISSIONS.VIEW_ALUNOS,
        PERMISSIONS.MANAGE_NOTAS,
        PERMISSIONS.MANAGE_FALTAS
    ],
    ALUNO: [
        PERMISSIONS.VIEW_DASHBOARD
    ],
    ENCARREGADO: [
        PERMISSIONS.VIEW_DASHBOARD
    ]
};

export const PERMISSIONS_PT = {
    [PERMISSIONS.VIEW_DASHBOARD]: 'Ver Dashboard',
    [PERMISSIONS.VIEW_ALUNOS]: 'Ver Alunos',
    [PERMISSIONS.CREATE_ALUNO]: 'Criar Aluno',
    [PERMISSIONS.EDIT_ALUNO]: 'Editar Aluno',
    [PERMISSIONS.DELETE_ALUNO]: 'Deletar Aluno',
    [PERMISSIONS.VIEW_INSCRITOS]: 'Ver Inscritos/Candidatos',
    [PERMISSIONS.MANAGE_INSCRITOS]: 'Gerir Inscritos (Aprovar/Rejeitar)',
    [PERMISSIONS.VIEW_MATRICULAS]: 'Ver Matrículas',
    [PERMISSIONS.CREATE_MATRICULA]: 'Criar Matrícula (Matricular)',
    [PERMISSIONS.EDIT_MATRICULA]: 'Editar Matrícula',
    [PERMISSIONS.VIEW_TURMAS]: 'Ver Turmas',
    [PERMISSIONS.MANAGE_TURMAS]: 'Gerir Turmas',
    [PERMISSIONS.VIEW_SALAS]: 'Ver Salas',
    [PERMISSIONS.MANAGE_SALAS]: 'Gerir Salas',
    [PERMISSIONS.VIEW_CURSOS]: 'Ver Cursos',
    [PERMISSIONS.MANAGE_CURSOS]: 'Gerir Cursos',
    [PERMISSIONS.MANAGE_NOTAS]: 'Lançar/Gerir Notas',
    [PERMISSIONS.MANAGE_DISCIPLINAS]: 'Gerir Disciplinas',
    [PERMISSIONS.MANAGE_FALTAS]: 'Registrar Faltas',
    [PERMISSIONS.VIEW_FINANCEIRO]: 'Ver área Financeira',
    [PERMISSIONS.MANAGE_PAGAMENTOS]: 'Gerir Pagamentos/Faturas',
    [PERMISSIONS.MANAGE_BIBLIOTECA]: 'Gerir Biblioteca',
    [PERMISSIONS.MANAGE_DOCUMENTOS]: 'Gerir Documentos',
    [PERMISSIONS.VIEW_CONFIGURACOES]: 'Acessar Configurações',
    [PERMISSIONS.VIEW_RELATORIOS]: 'Acessar Relatórios',
    [PERMISSIONS.MANAGE_USUARIOS]: 'Gerir Usuários/Acessos',
};

export const PERMISSION_GROUPS = [
    {
        name: 'Painel Geral',
        permissions: [PERMISSIONS.VIEW_DASHBOARD, PERMISSIONS.VIEW_RELATORIOS]
    },
    {
        name: 'Secretaria & Alunos',
        permissions: [
            PERMISSIONS.VIEW_ALUNOS,
            PERMISSIONS.CREATE_ALUNO,
            PERMISSIONS.EDIT_ALUNO,
            PERMISSIONS.DELETE_ALUNO,
            PERMISSIONS.VIEW_INSCRITOS,
            PERMISSIONS.MANAGE_INSCRITOS,
            PERMISSIONS.VIEW_MATRICULAS,
            PERMISSIONS.CREATE_MATRICULA,
            PERMISSIONS.EDIT_MATRICULA
        ]
    },
    {
        name: 'Gestão Académica',
        permissions: [
            PERMISSIONS.VIEW_TURMAS,
            PERMISSIONS.MANAGE_TURMAS,
            PERMISSIONS.VIEW_SALAS,
            PERMISSIONS.MANAGE_SALAS,
            PERMISSIONS.VIEW_CURSOS,
            PERMISSIONS.MANAGE_CURSOS,
            PERMISSIONS.MANAGE_DISCIPLINAS,
            PERMISSIONS.MANAGE_NOTAS,
            PERMISSIONS.MANAGE_FALTAS
        ]
    },

    {
        name: 'Configurações de Administrador',
        permissions: [
            PERMISSIONS.VIEW_CONFIGURACOES,
            PERMISSIONS.MANAGE_USUARIOS
        ]
    }
];

/**
 * Verifica se um papel tem determinada permissão
 */
/**
 * Verifica se um usuário tem determinada permissão
 * @param {Object} user - Objeto do usuário (contendo cargo_nome e permissoes_adicionais)
 * @param {string} permission - Permissão a verificar
 * @returns {boolean}
 */
export const hasPermission = (user, permission) => {
    if (!user) return false;

    // 1. Verificar se é Superadmin (ADMIN Role)
    const userRole = user.cargo_nome || user.cargo || user.role || user.papel || '';
    const normalizedRole = userRole.toLowerCase();
    
    // Explicit superuser check (most reliable)
    if (user.is_superuser || user.papel === 'Admin' || normalizedRole === 'admin') return true;
    
    let roleKey = null;
    for (const [key, aliases] of Object.entries(ROLES)) {
        if (aliases.some(alias => normalizedRole.includes(alias))) {
            roleKey = key;
            break;
        }
    }

    if (roleKey === 'ADMIN') return true;
    
    // Check for explicit superuser flag if available from backend
    if (user.is_superuser) return true;

    // 2. Verificar permissões adicionais (Granular) - PRIORIDADE
    // Se o usuário tem permissões explícitas definidas, estas devem ser a fonte de verdade
    const extraPermissions = user.permissoes_adicionais || user.permissoes || [];
    
    // Se o array de permissões extras não estiver vazio, usamos exclusivamente ele
    // Isso permite que o Admin limite um usuário que tem um cargo forte
    if (extraPermissions.length > 0) {
        return extraPermissions.includes(permission);
    }

    // 3. Fallback: Verificar permissões do Cargo apenas se não houver permissões granulares
    const rolePermissions = roleKey ? (ROLE_PERMISSIONS[roleKey] || []) : [];
    if (rolePermissions.includes(permission)) return true;

    return false;
};
