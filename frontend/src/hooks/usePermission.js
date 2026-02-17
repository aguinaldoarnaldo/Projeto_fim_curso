import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';

export const usePermission = () => {
    const { user } = useAuth();
    
    // Assumindo que o cargo está em user.cargo ou user.tipo se não for funcionário
    // Funcionário: user.cargo (ex: 'Secretária')
    // Aluno/Encarregado: user.tipo (ex: 'aluno')
    
    const role = user?.cargo || user?.tipo;
    
    const checkPermission = (permission) => {
        // DEBUG: Log completo do usuário e da verificação
        if (process.env.NODE_ENV === 'development') {
            console.log('🔍 [usePermission] Verificando permissão:', permission);
            console.log('👤 [usePermission] Usuário:', user);
            console.log('📜 [usePermission] Permissões do usuário:', user?.permissoes);
            console.log('🎭 [usePermission] Papel:', user?.papel);
            console.log('🔐 [usePermission] is_superuser:', user?.is_superuser);
        }
        
        const result = hasPermission(user, permission);
        
        if (process.env.NODE_ENV === 'development') {
            console.log(`${result ? '✅' : '❌'} [usePermission] Resultado para "${permission}":`, result);
        }
        
        return result;
    };

    return {
        hasPermission: checkPermission,
        role
    };
};
