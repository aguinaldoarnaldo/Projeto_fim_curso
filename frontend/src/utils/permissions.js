/**
 * Definição de permissões e papéis do sistema
 */

export const PERMISSIONS = {
    // Dashboard
    VIEW_DASHBOARD: 'view_dashboard',
    VIEW_RELATORIOS: 'view_relatorios',

    // Usuários & Acessos
    MANAGE_USUARIOS: 'manage_usuarios',
    VIEW_CONFIGURACOES: 'view_configuracoes',
    MANAGE_CONFIGURACOES: 'manage_configuracoes',
    MANAGE_BACKUP: 'manage_backup',

    // Alunos
    VIEW_ALUNOS: 'view_alunos',
    CREATE_ALUNO: 'create_aluno',
    EDIT_ALUNO: 'edit_aluno',
    DELETE_ALUNO: 'delete_aluno',

    // Inscritos (Candidatos)
    VIEW_INSCRITOS: 'view_inscritos',
    MANAGE_INSCRITOS: 'manage_inscritos', 

    // Lista de Espera
    VIEW_LISTA_ESPERA: 'view_lista_espera',
    MANAGE_LISTA_ESPERA: 'manage_lista_espera',

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
    MANAGE_DISCIPLINAS: 'manage_disciplinas',

    // Avaliações & Notas
    VIEW_NOTAS: 'view_notas',
    MANAGE_NOTAS: 'manage_notas',
    VIEW_FALTAS: 'view_faltas',
    MANAGE_FALTAS: 'manage_faltas',

    // Financeiro (RUPE)
    VIEW_FINANCEIRO: 'view_financeiro',
    MANAGE_FINANCEIRO: 'manage_financeiro',
    CREATE_PAGAMENTO: 'create_pagamento',
    DELETE_FINANCEIRO: 'delete_financeiro',
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
        PERMISSIONS.VIEW_FINANCEIRO,
        PERMISSIONS.CREATE_PAGAMENTO
    ],
    PROFESSOR: [
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.VIEW_TURMAS,
        PERMISSIONS.VIEW_ALUNOS,
        PERMISSIONS.VIEW_NOTAS,
        PERMISSIONS.MANAGE_NOTAS,
        PERMISSIONS.VIEW_FALTAS,
        PERMISSIONS.MANAGE_FALTAS
    ],
    ALUNO: [
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.VIEW_NOTAS,
        PERMISSIONS.VIEW_FALTAS
    ],
    ENCARREGADO: [
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.VIEW_ALUNOS,
        PERMISSIONS.VIEW_NOTAS,
        PERMISSIONS.VIEW_FALTAS
    ],
    COMUM: [
        PERMISSIONS.VIEW_DASHBOARD
    ]
};

export const PERMISSIONS_PT = {
    // 1. Painel Principal
    [PERMISSIONS.VIEW_DASHBOARD]: 'Ver Dashboard',
    [PERMISSIONS.VIEW_RELATORIOS]: 'Ver Relatórios',

    // 2. Secretaria Académica
    [PERMISSIONS.VIEW_INSCRITOS]: 'Ver Candidatos',
    [PERMISSIONS.MANAGE_INSCRITOS]: 'Gerir Candidatos',
    [PERMISSIONS.VIEW_ALUNOS]: 'Ver Lista de Alunos',
    [PERMISSIONS.CREATE_ALUNO]: 'Criar Novo Aluno',
    [PERMISSIONS.EDIT_ALUNO]: 'Editar Dados do Aluno',
    [PERMISSIONS.DELETE_ALUNO]: 'Eliminar Aluno',
    [PERMISSIONS.VIEW_MATRICULAS]: 'Ver Matrículas',
    [PERMISSIONS.CREATE_MATRICULA]: 'Realizar Matrícula',
    [PERMISSIONS.EDIT_MATRICULA]: 'Editar Matrícula',
    [PERMISSIONS.VIEW_LISTA_ESPERA]: 'Ver Lista de Espera',
    [PERMISSIONS.MANAGE_LISTA_ESPERA]: 'Gerir Lista de Espera',

    // 3. Gestão Pedagógica
    [PERMISSIONS.VIEW_TURMAS]: 'Ver Turmas',
    [PERMISSIONS.MANAGE_TURMAS]: 'Criar/Editar Turmas',
    [PERMISSIONS.VIEW_SALAS]: 'Ver Salas',
    [PERMISSIONS.MANAGE_SALAS]: 'Gerir Salas',
    [PERMISSIONS.VIEW_CURSOS]: 'Ver Cursos',
    [PERMISSIONS.MANAGE_CURSOS]: 'Gerir Cursos',
    [PERMISSIONS.MANAGE_DISCIPLINAS]: 'Gerir Disciplinas',
    [PERMISSIONS.VIEW_NOTAS]: 'Consultar Notas',
    [PERMISSIONS.MANAGE_NOTAS]: 'Lançar Notas',
    [PERMISSIONS.VIEW_FALTAS]: 'Consultar Faltas',
    [PERMISSIONS.MANAGE_FALTAS]: 'Lançar Faltas',

    // 4. Financeiro
    [PERMISSIONS.VIEW_FINANCEIRO]: 'Ver Financeiro / Faturas',
    [PERMISSIONS.MANAGE_FINANCEIRO]: 'Gerir Faturas',
    [PERMISSIONS.CREATE_PAGAMENTO]: 'Registrar Pagamentos',
    [PERMISSIONS.DELETE_FINANCEIRO]: 'Eliminar Registros Financeiros',

    // 5. Administração
    [PERMISSIONS.VIEW_CONFIGURACOES]: 'Ver Configurações',
    [PERMISSIONS.MANAGE_CONFIGURACOES]: 'Gerir Ano Lectivo e Configurações',
    [PERMISSIONS.MANAGE_USUARIOS]: 'Gerir Usuários e Acessos',
    [PERMISSIONS.MANAGE_BACKUP]: 'Gerir Backups e Manutenção',
};

export const PERMISSION_GROUPS = [
    {
        name: '1. Painel Principal',
        permissions: [
            PERMISSIONS.VIEW_DASHBOARD, 
            PERMISSIONS.VIEW_RELATORIOS
        ]
    },
    {
        name: '2. Secretaria Académica',
        permissions: [
            PERMISSIONS.VIEW_INSCRITOS,
            PERMISSIONS.MANAGE_INSCRITOS,
            PERMISSIONS.VIEW_LISTA_ESPERA,
            PERMISSIONS.MANAGE_LISTA_ESPERA,
            PERMISSIONS.VIEW_ALUNOS,
            PERMISSIONS.CREATE_ALUNO,
            PERMISSIONS.EDIT_ALUNO,
            PERMISSIONS.DELETE_ALUNO,
            PERMISSIONS.VIEW_MATRICULAS,
            PERMISSIONS.CREATE_MATRICULA,
            PERMISSIONS.EDIT_MATRICULA,
        ]
    },
    {
        name: '3. Gestão Pedagógica',
        permissions: [
            PERMISSIONS.VIEW_TURMAS,
            PERMISSIONS.MANAGE_TURMAS,
            PERMISSIONS.VIEW_SALAS,
            PERMISSIONS.MANAGE_SALAS,
            PERMISSIONS.VIEW_CURSOS,
            PERMISSIONS.MANAGE_CURSOS,
            PERMISSIONS.MANAGE_DISCIPLINAS,
            PERMISSIONS.VIEW_NOTAS,
            PERMISSIONS.MANAGE_NOTAS,
            PERMISSIONS.VIEW_FALTAS,
            PERMISSIONS.MANAGE_FALTAS
        ]
    },
    {
        name: '4. Financeiro (RUPE)',
        permissions: [
            PERMISSIONS.VIEW_FINANCEIRO,
            PERMISSIONS.MANAGE_FINANCEIRO,
            PERMISSIONS.CREATE_PAGAMENTO,
            PERMISSIONS.DELETE_FINANCEIRO
        ]
    },
    {
        name: '5. Administração e Sistema',
        permissions: [
            PERMISSIONS.VIEW_CONFIGURACOES,
            PERMISSIONS.MANAGE_CONFIGURACOES,
            PERMISSIONS.MANAGE_USUARIOS,
            PERMISSIONS.MANAGE_BACKUP
        ]
    }
];

/**
 * Verifica se um usuário tem determinada permissão
 * @param {Object} user - Objeto do usuário
 * @param {string} permission - Permissão a verificar
 * @returns {boolean}
 */
export const hasPermission = (user, permission) => {
    const DEBUG = process.env.NODE_ENV === 'development';
    
    if (DEBUG) console.log('🔍 [hasPermission] Iniciando verificação para:', permission);
    
    // 1. Se não houver usuário, nega acesso imediatamente
    if (!user) {
        if (DEBUG) console.log('❌ [hasPermission] Usuário não existe');
        return false;
    }

    // 2. SUPERUSER (Override Total)
    // Superusuários do sistema não podem ser restringidos
    if (user.is_superuser === true) {
        if (DEBUG) console.log('✅ [hasPermission] Usuário é SUPERUSER - acesso garantido');
        return true;
    }
    
    // 3. GESTÃO INDIVIDUAL (Permissões Explícitas) - PRIORIDADE MÁXIMA
    // Se o usuário tem uma lista personalizada (mesmo vazia), ela manda em tudo.
    let listPerms = null;
    if (user.permissoes && Array.isArray(user.permissoes)) {
        listPerms = user.permissoes;
    } else if (user.permissoes_adicionais && Array.isArray(user.permissoes_adicionais)) {
        listPerms = user.permissoes_adicionais;
    }

    // Se a lista existe E TEM ITENS (não vazia), ela é a VERDADE ABSOLUTA (True/False)
    // Se for vazia ([]), assume que não há overrides e deixa cair para o papel
    if (listPerms !== null && listPerms.length > 0) {
        if (DEBUG) console.log('🎯 [hasPermission] Usando modo de permissões explícitas:', listPerms);
        
        // Se 'NO_ACCESS' estiver na lista, significa que ele foi bloqueado de tudo intencionalmente
        if (listPerms.includes('NO_ACCESS')) {
            if (DEBUG) console.log('🚫 [hasPermission] NO_ACCESS detectado - bloqueio total');
            return false;
        }
        
        const hasExplicitPermission = listPerms.includes(permission);
        if (DEBUG) console.log(`${hasExplicitPermission ? '✅' : '❌'} [hasPermission] Permissão "${permission}" ${hasExplicitPermission ? 'encontrada' : 'NÃO encontrada'} na lista explícita`);
        return hasExplicitPermission;
    }

    // 4. FALLBACK PELO PAPEL / ADMIN (Apenas se não houver lista personalizada/campo estiver null)
    // Se for Admin (no dropdown) e não tiver lista de exceção, tem acesso total
    if (user.papel === 'Admin') {
        if (DEBUG) console.log('✅ [hasPermission] Papel é Admin - acesso garantido');
        return true;
    }
    
    // Verificação de segurança via nome do cargo
    if (user.cargo_nome && typeof user.cargo_nome === 'string') {
        const cNome = user.cargo_nome.toLowerCase();
        // Apenas cargos de alta hierarquia recebem override automático
        if (cNome.includes('admin') || cNome.includes('diretor geral') || (cNome === 'diretor' && user.papel === 'Admin')) {
            if (DEBUG) console.log('✅ [hasPermission] Cargo de alta hierarquia detectado - acesso garantido');
            return true;
        }
    }

    // 5. PAPÉIS PADRÃO (Legado / Fallback para quando não se quer gerir individualmente)
    // Se chegamos aqui, o usuário NÃO tem lista de permissões configurada no DB (campo NULL)
    let roleKey = null;
    const userRole = user.cargo_nome || user.cargo || user.papel || '';
    const normalizedRole = String(userRole).toLowerCase();

    if (normalizedRole.includes('secret')) roleKey = 'SECRETARIA';
    else if (normalizedRole.includes('prof') || normalizedRole.includes('docente')) roleKey = 'PROFESSOR';
    else if (normalizedRole.includes('aluno')) roleKey = 'ALUNO';
    else if (normalizedRole.includes('encarregado')) roleKey = 'ENCARREGADO';
    else if (normalizedRole.includes('comum')) roleKey = 'COMUM';

    if (roleKey) {
        if (DEBUG) console.log('🎭 [hasPermission] Role identificado via fallback:', roleKey);
        const allowedPermissions = ROLE_PERMISSIONS[roleKey] || [];
        const hasRolePermission = allowedPermissions.includes(permission);
        return hasRolePermission;
    }

    // 6. BLOQUEIO PADRÃO
    if (DEBUG) console.log('❌ [hasPermission] Bloqueio final - acesso negado');
    return false;
};
