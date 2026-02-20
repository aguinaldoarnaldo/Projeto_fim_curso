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
        
        # 1. Obter as permissões (vêm do perfil Usuario ou Funcionario)
        user_perms = []
        
        # Se o user já for uma instância de Usuario (do apis.models)
        if hasattr(request.user, 'permissoes'):
            user_perms = request.user.permissoes
        # Se for uma instância de Funcionario
        elif hasattr(request.user, 'permissoes_adicionais'):
            user_perms = request.user.permissoes_adicionais
        # Se for um User nativo do Django com perfil associado
        elif hasattr(request.user, 'profile'):
            profile = request.user.profile
            user_perms = profile.permissoes if hasattr(profile, 'permissoes') else []
            if not user_perms and hasattr(profile, 'funcionario_perfil'):
                user_perms = profile.funcionario_perfil.permissoes_adicionais or []
        
        # Compatibilidade: Se o campo for string (JSON mal formatado), tentar parsear
        if isinstance(user_perms, str):
            import json
            try:
                user_perms = json.loads(user_perms)
            except:
                user_perms = []
                
        # 2. Prioridade: Verificar permissões explícitas (Granular)
        # Se o campo existir E TIVER ITENS, ele é o controle exclusivo de acessos.
        if isinstance(user_perms, list) and len(user_perms) > 0:
            # Se 'NO_ACCESS' estiver na lista, bloqueio total manual
            if 'NO_ACCESS' in user_perms:
                return False
                
            if required_permission in user_perms:
                return True
            
            # Se a lista tem itens mas não contém a permissão, negamos o acesso.
            # Isso impede o fallback automático para permissões genéricas de cargo.
            return False
            
        # 3. Fallback: Verificar permissões do CARGO/ROLE (Se a lista for vazia [] ou None)
            
        # 2. Fallback: Verificar permissões do CARGO/ROLE
        # Tentar obter do perfil Usuario ou Payload
        auth_data = getattr(request, 'auth_payload', {})
        role = auth_data.get('cargo', '')
        
        if not role and profile:
             role = profile.papel or ''
             if not role and profile.cargo:
                 role = profile.cargo.nome_cargo

        if not role:
             return False

        role = role.lower()
        
        # Mapeamento de Papéis (Backend Mirror)
        # ADMIN
        if any(r in role for r in ['administrador', 'admin', 'diretor', 'coord']):
            return True 
            
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

        # COMUM
        if 'comum' in role:
             COMUM_PERMISSIONS = ['view_dashboard']
             return required_permission in COMUM_PERMISSIONS

        return False

class IsActiveYearOrReadOnly(permissions.BasePermission):
    """
    Bloqueia alterações (POST, PUT, DELETE) se o Ano Lectivo associado estiver encerrado.
    Permite apenas leitura (GET, HEAD, OPTIONS).
    """
    message = "Ano letivo encerrado. Alterações não permitidas."

    def has_permission(self, request, view):
        # 1. Se for método seguro, permite
        if request.method in permissions.SAFE_METHODS:
            return True

        if request.user and request.user.is_superuser:
             # Superadmin pode bypassar (opcional, mas o request falava que ADMIN tinha que reabrir, não bypassar direto)
             # Mas o admin precisa poder CRIAR o ano letivo.
             pass

        # 2. Se for POST (Criação), precisamos verificar se há um ano ativo
        if request.method == 'POST':
            from apis.models import AnoLectivo
            # Tenta pegar 'ano_lectivo' do body
            ano_id = request.data.get('ano_lectivo')
            
            if ano_id:
                try:
                    # Se for um número (ID), buscar por PK
                    if str(ano_id).isdigit():
                        ano = AnoLectivo.objects.get(pk=ano_id)
                    else:
                        # Se for texto (ex: "2026/2027"), buscar por nome
                        ano = AnoLectivo.objects.filter(nome=ano_id).first()
                    
                    if ano and ano.status != 'Activo':
                        return False
                except (AnoLectivo.DoesNotExist, ValueError):
                    pass 
            else:
                 # Se não especificou ano, assume o ano ativo
                 active_year = AnoLectivo.get_active_year()
                 if active_year and active_year.status != 'Activo':
                      # Isso teoricamente nunca acontece se active_year retorna filter(activo=True)
                      # Mas se retornar None (sem ano ativo), pode ser um problema.
                      pass
            
        return True

    def has_object_permission(self, request, view, obj):
        # 1. Se for método seguro, permite
        if request.method in permissions.SAFE_METHODS:
            return True

        # 2. Verifica se o objeto tem relação com 'ano_lectivo'
        # Hierarquia de verificação:
        # A. Directo (ano_lectivo)
        # B. Via Turma (id_turma.ano_lectivo ou turma.ano_lectivo)
        # C. Via Matricula (matricula.ano_lectivo)
        
        ano = getattr(obj, 'ano_lectivo', None)
        
        # Se não tem direto, tenta via id_turma
        if not ano and hasattr(obj, 'id_turma') and obj.id_turma:
             ano = getattr(obj.id_turma, 'ano_lectivo', None)

        # Se não tem, tenta via turma (alguns models usam 'turma' em vez de 'id_turma')
        if not ano and hasattr(obj, 'turma') and obj.turma:
             ano = getattr(obj.turma, 'ano_lectivo', None)

        # Se não tem, tenta via matricula
        if not ano and hasattr(obj, 'matricula') and obj.matricula:
             ano = getattr(obj.matricula, 'ano_lectivo', None)
             
        # Se encontrou um ano associado, verifica se está activo
        if ano:
            if ano.status != 'Activo':
                return False # 403 Forbidden
        
        return True
