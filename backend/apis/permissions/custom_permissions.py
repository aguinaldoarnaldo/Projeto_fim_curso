from rest_framework import permissions

class IsSuperAdmin(permissions.BasePermission):
    """Permissão para desenvolvedores/superadministradores"""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_superuser)

class IsFuncionario(permissions.BasePermission):
    """Permissão para qualquer funcionário ativo"""
    def has_permission(self, request, view):
        auth_data = getattr(request, 'auth_payload', None)
        if not auth_data:
            return False
        return auth_data.get('user_type') == 'funcionario'

class IsDirecao(permissions.BasePermission):
    """Diretores e Administradores (Aprovação de documentos)"""
    def has_permission(self, request, view):
        auth_data = getattr(request, 'auth_payload', None)
        if not auth_data or auth_data.get('user_type') != 'funcionario':
            return False
        
        cargo = auth_data.get('cargo', '').lower()
        return cargo in ['diretor', 'administrador', 'diretor geral', 'diretor adjunto']

class IsSecretario(permissions.BasePermission):
    """Secretaria (Gestão de processos e pagamentos)"""
    def has_permission(self, request, view):
        auth_data = getattr(request, 'auth_payload', None)
        if not auth_data or auth_data.get('user_type') != 'funcionario':
            return False
        
        cargo = auth_data.get('cargo', '').lower()
        return cargo in ['secretário', 'secretaria', 'secretario']

class IsProfessor(permissions.BasePermission):
    """Professores (Lançamento de notas e faltas)"""
    def has_permission(self, request, view):
        auth_data = getattr(request, 'auth_payload', None)
        if not auth_data or auth_data.get('user_type') != 'funcionario':
            return False
        
        cargo = auth_data.get('cargo', '').lower()
        return cargo in ['professor', 'docente']

class IsAluno(permissions.BasePermission):
    """Alunos (Consulta de notas e solicitação)"""
    def has_permission(self, request, view):
        auth_data = getattr(request, 'auth_payload', None)
        return bool(auth_data and auth_data.get('user_type') == 'aluno')

class IsEncarregado(permissions.BasePermission):
    """Encarregados (Consulta de educandos)"""
    def has_permission(self, request, view):
        auth_data = getattr(request, 'auth_payload', None)
        return bool(auth_data and auth_data.get('user_type') == 'encarregado')

class IsOwnerOrReadOnly(permissions.BasePermission):
    """Permite apenas ao dono do objeto editá-lo"""
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        auth_data = getattr(request, 'auth_payload', None)
        if not auth_data:
            return False
            
        user_id = auth_data.get('user_id')
        user_type = auth_data.get('user_type')
        
        # Lógica depende do modelo, exemplo para Aluno
        if user_type == 'aluno' and hasattr(obj, 'id_aluno'):
            return obj.id_aluno == user_id
        
        if user_type == 'funcionario' and hasattr(obj, 'id_funcionario'):
            return obj.id_funcionario == user_id
            
        return False
