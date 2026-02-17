/**
 * Utilitário de Debug para Permissões
 * Use este arquivo para diagnosticar problemas com permissões
 */

export const debugUserPermissions = (user) => {
    console.group('🔍 DEBUG: Permissões do Usuário');
    console.log('📋 Objeto User Completo:', user);
    console.log('👤 Nome:', user?.nome || user?.nome_completo);
    console.log('📧 Email:', user?.email);
    console.log('🎭 Papel:', user?.papel);
    console.log('💼 Cargo:', user?.cargo || user?.cargo_nome);
    console.log('🔐 is_superuser:', user?.is_superuser);
    console.log('📜 Permissões Array:', user?.permissoes);
    console.log('📊 Tipo de Permissões:', typeof user?.permissoes);
    console.log('📏 Quantidade de Permissões:', Array.isArray(user?.permissoes) ? user.permissoes.length : 'N/A');
    
    if (Array.isArray(user?.permissoes)) {
        console.log('✅ Permissões Ativas:', user.permissoes);
    } else if (typeof user?.permissoes === 'string') {
        console.warn('⚠️ Permissões em formato STRING (deveria ser array):', user.permissoes);
        try {
            const parsed = JSON.parse(user.permissoes);
            console.log('🔄 Permissões após parse:', parsed);
        } catch (e) {
            console.error('❌ Erro ao fazer parse das permissões:', e);
        }
    } else {
        console.warn('⚠️ Permissões em formato desconhecido:', user?.permissoes);
    }
    
    console.groupEnd();
};

export const debugPermissionCheck = (user, permission, result) => {
    console.group(`🔍 DEBUG: Verificação de Permissão "${permission}"`);
    console.log('👤 Usuário:', user?.nome || user?.nome_completo);
    console.log('🎭 Papel:', user?.papel);
    console.log('🔐 is_superuser:', user?.is_superuser);
    console.log('📜 Permissões do usuário:', user?.permissoes);
    console.log('🎯 Permissão solicitada:', permission);
    console.log('✅ Resultado:', result ? 'PERMITIDO' : 'NEGADO');
    
    if (!result && user?.is_superuser) {
        console.warn('⚠️ ATENÇÃO: Usuário é superuser mas permissão foi negada!');
    }
    
    if (!result && Array.isArray(user?.permissoes) && user.permissoes.length === 0) {
        console.warn('⚠️ ATENÇÃO: Lista de permissões está vazia!');
    }
    
    console.groupEnd();
};
