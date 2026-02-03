import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';

export const usePermission = () => {
    const { user } = useAuth();
    
    // Assumindo que o cargo está em user.cargo ou user.tipo se não for funcionário
    // Funcionário: user.cargo (ex: 'Secretária')
    // Aluno/Encarregado: user.tipo (ex: 'aluno')
    
    const role = user?.cargo || user?.tipo;
    
    const checkPermission = (permission) => {
        // Agora hasPermission aceita o objeto user completo para verificar cargo e permissoes_adicionais
        return hasPermission(user, permission);
    };

    return {
        hasPermission: checkPermission,
        role
    };
};
