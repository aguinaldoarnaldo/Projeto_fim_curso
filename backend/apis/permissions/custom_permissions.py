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
        return auth_data.get('user_type') in ['funcionario', 'usuario']

class IsDirecao(permissions.BasePermission):
    """Diretores e Administradores (Aprovação de documentos)"""
    def has_permission(self, request, view):
        auth_data = getattr(request, 'auth_payload', None)
        if not auth_data or auth_data.get('user_type') not in ['funcionario', 'usuario']:
            return False
        
        cargo = auth_data.get('cargo', '').lower()
        return cargo in ['diretor', 'administrador', 'diretor geral', 'diretor adjunto']

class IsSecretario(permissions.BasePermission):
    """Secretaria (Gestão de processos e pagamentos)"""
    def has_permission(self, request, view):
        auth_data = getattr(request, 'auth_payload', None)
        if not auth_data or auth_data.get('user_type') not in ['funcionario', 'usuario']:
            return False
        
        cargo = auth_data.get('cargo', '').lower()
        return cargo in ['secretário', 'secretaria', 'secretario']

class IsProfessor(permissions.BasePermission):
    """Professores (Lançamento de notas e faltas)"""
    def has_permission(self, request, view):
        auth_data = getattr(request, 'auth_payload', None)
        if not auth_data or auth_data.get('user_type') not in ['funcionario', 'usuario']:
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

class HasAdditionalPermission(permissions.BasePermission):
    """
    Verifica se o usuário tem uma permissão específica listada em 'permissoes_adicionais'.
    A view deve definir um mapeamento `permission_required` = {'action': 'permission_string'}.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser:
            return True

        # Verificar se a view define permissões por ação
        permission_map = getattr(view, 'permission_map', {})
        
        # Se for um ViewSet, view.action está definido (list, create, update, etc)
        action = getattr(view, 'action', None)
        
        if not action or action not in permission_map:
            # Se não houver permissão específica mapeada, esta classe não bloqueia
            # (Deixa para as outras classes de permissão)
            return True
        
        required_permission = permission_map[action]
        
        # Verificar permissoes (vêm do perfil Usuario ou Funcionario)
        user_perms = getattr(request.user, 'permissoes', []) or getattr(request.user, 'permissoes_adicionais', [])
        
        # Compatibilidade: Se o campo for string (JSON mal formatado), tentar parsear
        if isinstance(user_perms, str):
            import json
            try:
                user_perms = json.loads(user_perms)
            except:
                user_perms = []
                
        # 1. Prioridade: Verificar permissões explícitas (Granular)
        # Se o usuário tem uma lista de permissões definida, ela é a fonte de verdade.
        if user_perms:
            return required_permission in user_perms
            
        # 2. Fallback: Verificar permissões do CARGO apenas se não houver permissões granulares
        # Replicando a lógica de Permissões por Cargo do Frontend
        
        # Tentar obter cargo do payload de autenticação ou do objeto usuário
        auth_data = getattr(request, 'auth_payload', {})
        role = auth_data.get('cargo', '')
        
        if not role and hasattr(request.user, 'id_cargo') and request.user.id_cargo:
             role = request.user.id_cargo.nome_cargo

        if not role:
             # Tentar papel do Usuario
             role = getattr(request.user, 'papel', '')

        role = role.lower()
        
        # Mapeamento de Papéis (Backend Mirror)
        # ADMIN
        if any(r in role for r in ['administrador', 'admin', 'diretor', 'coord']) or role == 'admin':
            return True # Admin tem acesso a tudo por padrão ou mapeado explicitamente
            
        # SECRETARIA
        if any(r in role for r in ['secretário', 'secretaria', 'secretario']):
            SECRETARIA_PERMISSIONS = [
                'view_dashboard', 
                'view_alunos', 'create_aluno', 'edit_aluno',
                'view_inscritos', 'manage_inscritos',
                'view_matriculas', 'create_matricula', 'edit_matricula',
                'view_turmas', 'view_salas', 'view_cursos',
                'view_relatorios', 'view_configuracoes'
            ]
            return required_permission in SECRETARIA_PERMISSIONS

        # PROFESSOR
        if any(r in role for r in ['professor', 'docente']):
             PROFESSOR_PERMISSIONS = ['view_dashboard', 'view_turmas', 'view_alunos', 'view_notas', 'view_faltas']
             return required_permission in PROFESSOR_PERMISSIONS

        return False
