from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.hashers import check_password
from rest_framework_simplejwt.tokens import RefreshToken
from apis.models import Usuario, Funcionario, Aluno, Encarregado, HistoricoLogin

class AuthService:
    """
    Serviço Centralizado de Autenticação e Gestão de Sessão.
    Isola a lógica complexa de múltiplos tipos de usuários (Polimorfismo).
    """

    @staticmethod
    def authenticate_user(email, password, user_type='funcionario'):
        """
        Autentica um usuário baseado no tipo e credenciais.
        Retorna uma tupla (user_obj, user_data_dict) ou lança exceção.
        """
        user = None
        user_data = {}
        
        # 1. Autenticação para Funcionários e Usuários Administrativos
        if user_type in ['funcionario', 'usuario']:
            # Tenta encontrar o perfil de Usuário
            try:
                user_profile = Usuario.objects.get(email=email)
            except Usuario.DoesNotExist:
                # Fallback: Tenta encontrar Auth User nativo e criar perfil (Migration on-the-fly)
                try:
                    django_user = User.objects.get(email=email)
                    user_profile, _ = Usuario.objects.get_or_create(
                        user=django_user,
                        defaults={
                            'email': django_user.email,
                            'nome_completo': django_user.get_full_name() or django_user.username,
                            'papel': 'Admin' if django_user.is_superuser else 'Comum',
                            'is_superuser': django_user.is_superuser
                        }
                    )
                except User.DoesNotExist:
                    # Tenta fallback via username
                    try:
                        django_user = User.objects.get(username=email)
                        user_profile, _ = Usuario.objects.get_or_create(
                            user=django_user,
                            defaults={
                                'email': django_user.email,
                                'nome_completo': django_user.get_full_name() or django_user.username,
                                'papel': 'Admin' if django_user.is_superuser else 'Comum',
                                'is_superuser': django_user.is_superuser
                            }
                        )
                    except User.DoesNotExist:
                        raise ValueError('Credenciais inválidas.')

            user = user_profile
            
            # Validação da Senha
            password_valid = False
            if user.user:
                password_valid = user.user.check_password(password)
            else:
                password_valid = check_password(password, user.senha_hash)

            if not password_valid:
                raise ValueError('Senha incorreta.')

            # Determinar tipo real (Funcionário vs Usuário Simples)
            real_type = 'usuario'
            if hasattr(user, 'funcionario_perfil') and user.funcionario_perfil:
                real_type = 'funcionario'
            
            # ID para o Token (Auth User se possível)
            auth_user_id = user.user.id if user.user else user.id_usuario

            # Lógica de Permissões Consistente
            perms = user.permissoes or []
            if not perms and real_type == 'funcionario' and hasattr(user, 'funcionario_perfil'):
                perms = user.funcionario_perfil.permissoes_adicionais or []

            user_data = {
                'id': auth_user_id,
                'profile_id': user.id_usuario,
                'tipo': real_type,
                'nome': user.nome_completo,
                'nome_completo': user.nome_completo,
                'email': user.email,
                'username': user.email,
                'cargo': user.cargo.nome_cargo if user.cargo else None,
                'status': 'Activo' if user.is_active else 'Inactivo',
                'papel': 'Admin' if (user.is_superuser or (user.user and user.user.is_superuser)) else user.papel,
                'role': 'Admin' if (user.is_superuser or (user.user and user.user.is_superuser)) else user.papel,
                'permissoes': perms,
                'is_superuser': user.is_superuser or (user.user and user.user.is_superuser),
                'foto_obj': user.img_path
            }

        # 2. Autenticação para Alunos
        elif user_type == 'aluno':
            try:
                user = Aluno.objects.get(email=email)
            except Aluno.DoesNotExist:
                raise ValueError('Aluno não encontrado.')
                
            if not check_password(password, user.senha_hash):
                raise ValueError('Senha incorreta.')
                
            user_data = {
                'id': user.id_aluno,
                'tipo': 'aluno',
                'nome': user.nome_completo,
                'email': user.email,
                'numero_matricula': user.numero_matricula,
                'turma': user.id_turma.codigo_turma if user.id_turma else None,
                'status': user.status_aluno,
                'foto_obj': user.img_path
            }

        # 3. Autenticação para Encarregados
        elif user_type == 'encarregado':
            try:
                user = Encarregado.objects.get(email=email)
            except Encarregado.DoesNotExist:
                raise ValueError('Encarregado não encontrado.')
                
            if not check_password(password, user.senha_hash):
                raise ValueError('Senha incorreta.')
                
            user_data = {
                'id': user.id_encarregado,
                'tipo': 'encarregado',
                'nome': user.nome_completo,
                'email': user.email,
                'foto_obj': user.img_path
            }
            
        else:
            raise ValueError('Tipo de usuário inválido.')

        return user, user_data

    @staticmethod
    def generate_tokens(user_data):
        """Gera par de tokens (Access + Refresh) com claims customizadas."""
        refresh = RefreshToken()
        
        # Claims padrão
        refresh['user_id'] = user_data['id']
        refresh['user_type'] = user_data['tipo']
        
        # Copia claims para o access token também
        access_token = refresh.access_token
        access_token['user_id'] = user_data['id']
        access_token['user_type'] = user_data['tipo']
        
        return {
            'refresh': str(refresh),
            'access': str(access_token)
        }

    @staticmethod
    def log_login_activity(user, user_type, request):
        """Registra o login no histórico."""
        try:
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            ip = x_forwarded_for.split(',')[0] if x_forwarded_for else request.META.get('REMOTE_ADDR')
            
            user_agent = request.META.get('HTTP_USER_AGENT', '')[:150]
            
            historico_data = {
                'ip_usuario': ip,
                'dispositivo': user_agent,
                'navegador': user_agent
            }
            
            if user_type in ['funcionario', 'usuario']:
                # Se for funcionário, o objeto user passado deve ser a instância de Usuario
                if isinstance(user, Usuario):
                    historico_data['id_usuario'] = user 
                elif hasattr(user, 'usuario'): # Se passou instância Funcionario
                    historico_data['id_usuario'] = user.usuario
            elif user_type == 'aluno':
                historico_data['id_aluno'] = user
            elif user_type == 'encarregado':
                historico_data['id_encarregado'] = user
            
            HistoricoLogin.objects.create(**historico_data)
            
            # Atualiza status online usando update() para bypassar validações do modelo
            # (evita bloquear alunos com estado final ao fazer login)
            user.__class__.objects.filter(pk=user.pk).update(is_online=True)
            
        except Exception as e:
            print(f"Erro ao registrar log de login: {e}")

    @staticmethod
    def get_user_profile(user_id, user_type):
        """
        Recupera o perfil completo do usuário autenticado para a rota /me/
        """
        user_data = {}
        
        if user_type == 'funcionario':
            # Busca via Auth User ID
            user = Funcionario.objects.get(usuario__user__id=user_id)
            
            # Permissões com fallback
            perms = user.permissoes_adicionais or []
            if user.usuario and user.usuario.permissoes:
                perms = user.usuario.permissoes
                
            # Determinar se é SuperUsuário
            is_super = (user.usuario.is_superuser if user.usuario else False) or (user.usuario and user.usuario.user and user.usuario.user.is_superuser)
            
            user_data = {
                'id': user_id, 
                'tipo': 'funcionario',
                'nome': user.nome_completo,
                'nome_completo': user.nome_completo,
                'username': user.email,
                'email': user.email,
                'telefone': user.telefone,
                'endereco': f"{user.municipio_residencia or ''}, {user.bairro_residencia or ''}".strip(', '),
                'cargo': user.id_cargo.nome_cargo if user.id_cargo else None,
                'status': user.status_funcionario,
                'is_active': user.status_funcionario == 'Activo',
                'is_superuser': is_super,
                'papel': 'Admin' if is_super else (user.usuario.papel if user.usuario else 'Comum'),
                'role': 'Admin' if is_super else (user.usuario.papel if user.usuario else 'Comum'),
                'permissoes': perms,
                'foto_obj': user.img_path if user.img_path else (user.usuario.img_path if user.usuario else None)
            }
            
        elif user_type == 'usuario':
            user = Usuario.objects.get(user__id=user_id)
            is_super = user.is_superuser or (user.user and user.user.is_superuser)
            user_data = {
                'id': user_id,
                'tipo': 'usuario',
                'nome': user.nome_completo,
                'nome_completo': user.nome_completo,
                'username': user.email,
                'email': user.email,
                'telefone': user.telefone,
                'endereco': user.bairro_residencia or '',
                'cargo': user.cargo.nome_cargo if user.cargo else None,
                'status': 'Activo' if user.is_active else 'Inactivo',
                'is_active': user.is_active,
                'papel': 'Admin' if is_super else user.papel,
                'role': 'Admin' if is_super else user.papel,
                'permissoes': user.permissoes,
                'is_superuser': is_super,
                'foto_obj': user.img_path
            }
                
        elif user_type == 'aluno':
            user = Aluno.objects.get(id_aluno=user_id)
            user_data = {
                'id': user.id_aluno,
                'tipo': 'aluno',
                'nome': user.nome_completo,
                'email': user.email,
                'telefone': user.telefone,
                'endereco': f"{user.municipio_residencia or ''}, {user.bairro_residencia or ''}, {user.numero_casa or ''}".strip(', '),
                'numero_matricula': user.numero_matricula,
                'turma': user.id_turma.codigo_turma if user.id_turma else None,
                'status': user.status_aluno,
                'is_online': True,
                'foto_obj': user.img_path
            }
            
        elif user_type == 'encarregado':
            user = Encarregado.objects.get(id_encarregado=user_id)
            tel_str = user.telefone[0] if isinstance(user.telefone, list) and len(user.telefone) > 0 else (user.telefone if isinstance(user.telefone, str) else '')
            user_data = {
                'id': user.id_encarregado,
                'tipo': 'encarregado',
                'nome': user.nome_completo,
                'email': user.email,
                'telefone': tel_str,
                'endereco': f"{user.provincia_residencia or ''}, {user.municipio_residencia or ''}".strip(', '),
                'foto_obj': user.img_path,
                'is_online': True
            }
            
        return user_data

    @staticmethod
    def update_user_profile(user_id, user_type, data, files):
        """
        Atualiza o perfil do usuário (senha, foto, dados básicos).
        """
        user = None
        
        # 1. Recuperar Usuário
        if user_type == 'funcionario':
            # Funcionários usam Auth User ID no token -> Buscar via usuario__user__id
            try:
                user = Funcionario.objects.get(usuario__user__id=user_id)
            except Funcionario.DoesNotExist:
                 # Fallback: tentar ID direto se token for velho
                 try:
                    user = Funcionario.objects.get(id_funcionario=user_id)
                 except:   
                    raise ValueError('Funcionário não encontrado.')
                    
        elif user_type == 'usuario':
            try:
                user = Usuario.objects.get(user__id=user_id) # Token tem Auth ID
            except Usuario.DoesNotExist:
                 try:
                     user = Usuario.objects.get(id_usuario=user_id)
                 except:
                    raise ValueError('Usuário não encontrado.')
                    
        elif user_type == 'aluno':
            try:
                user = Aluno.objects.get(id_aluno=user_id)
            except Aluno.DoesNotExist:
                raise ValueError('Aluno não encontrado.')
                
        elif user_type == 'encarregado':
            try:
                user = Encarregado.objects.get(id_encarregado=user_id)
            except Encarregado.DoesNotExist:
                raise ValueError('Encarregado não encontrado.')
        
        else:
            raise ValueError('Tipo de usuário desconhecido.')

        # 2. Atualizar Senha
        nova_senha = data.get('newPassword') or data.get('new_password')
        senha_atual = data.get('currentPassword') or data.get('current_password')
        
        if nova_senha:
            if not senha_atual:
                raise ValueError('Senha atual é obrigatória para definir nova senha.')
            
            # Verificar senha atual - Prioridade para Auth User se existir
            senha_valida = False
            if hasattr(user, 'user') and user.user:
                 senha_valida = user.user.check_password(senha_atual)
            elif hasattr(user, 'usuario') and user.usuario and user.usuario.user:
                 senha_valida = user.usuario.user.check_password(senha_atual)
            else:
                 senha_valida = check_password(senha_atual, user.senha_hash)
                 
            if not senha_valida:
                raise ValueError('A senha atual está incorreta.')
                
            # Definir nova senha em todos os elos da cadeia
            from django.contrib.auth.hashers import make_password
            hashed_password = make_password(nova_senha)
            
            # 1. Update Django Auth User (Base de autenticação)
            auth_user = None
            if hasattr(user, 'user') and user.user:
                 auth_user = user.user
            elif hasattr(user, 'usuario') and user.usuario and user.usuario.user:
                 auth_user = user.usuario.user
            
            if auth_user:
                auth_user.set_password(nova_senha)
                auth_user.save()
            
            # 2. Update Perfil de Usuário do Sistema
            if hasattr(user, 'usuario') and user.usuario:
                 user.usuario.senha_hash = hashed_password
                 user.usuario.save()
            elif isinstance(user, Usuario):
                 user.senha_hash = hashed_password
            
            # 3. Update Perfil de funcionário/aluno/encarregado
            user.senha_hash = hashed_password

        # 3. Atualizar Dados Básicos
        if 'nome' in data and data['nome']:
            user.nome_completo = data['nome']
            
        if 'email' in data and data['email']:
            user.email = data['email']
            # Sincronizar Auth User se existir
            if hasattr(user, 'user') and user.user:
                if user.user.email != data['email']:
                    user.user.email = data['email']
                    user.user.username = data['email']
                    user.user.save()

        # Endereço e Telefone (Adaptação para campos diferentes)
        if 'endereco' in data:
            if hasattr(user, 'bairro_residencia'): 
                 user.bairro_residencia = data['endereco']
            elif hasattr(user, 'provincia_residencia'): # Encarregado
                 user.municipio_residencia = data['endereco']

        if 'telefone' in data:
            if hasattr(user, 'telefone'):
                 # Encarregado é lista
                 if isinstance(user.telefone, list):
                      user.telefone = [data['telefone']]
                 else:
                      user.telefone = data['telefone']
            
            # Se for funcionário, também atualizar o perfil de usuário se vinculado
            if user_type == 'funcionario' and hasattr(user, 'usuario') and user.usuario:
                 user.usuario.telefone = data.get('telefone')
                 if 'endereco' in data:
                      user.usuario.bairro_residencia = data.get('endereco')
                 user.usuario.save()

        # 4. Atualizar Foto
        file_obj = files.get('foto') or files.get('img_path')
        if file_obj:
            user.img_path = file_obj
            # Sincronizar com o perfil de usuário se existir
            if hasattr(user, 'usuario') and user.usuario:
                 user.usuario.img_path = file_obj
                 user.usuario.save()
            elif hasattr(user, 'funcionario_perfil') and user.funcionario_perfil:
                 user.funcionario_perfil.img_path = file_obj
                 user.funcionario_perfil.save()

        # 5. Salvar alterações
        user.save()

        return user

    @staticmethod
    def logout_user(user_id, user_type):
        """
        Realiza logout do usuário (atualiza status e histórico).
        """
        from datetime import datetime
        from django.utils import timezone
        
        user = None
        try:
            if user_type == 'funcionario' or user_type == 'usuario':
                # No logout, o frontend manda o ID do perfil geralmente, ou ID do auth user.
                # Precisamos ser flexíveis.
                try:
                    user = Usuario.objects.get(id_usuario=user_id)
                except Usuario.DoesNotExist:
                     # Se enviou Auth ID
                     user = Usuario.objects.get(user__id=user_id)
            elif user_type == 'aluno':
                user = Aluno.objects.get(id_aluno=user_id)
            elif user_type == 'encarregado':
                user = Encarregado.objects.get(id_encarregado=user_id)
        except:
             # Se não achar o usuário, não faz nada (pode já ter sido deletado)
             return
            
        if user:
            # usa update() direto para bypassar validações do modelo
            # (evita bloquear alunos com estado final ao fazer logout)
            user.__class__.objects.filter(pk=user.pk).update(is_online=False)
            
            # Registrar saída no histórico
            historico = None
            if user_type in ['funcionario', 'usuario']:
                 historico = HistoricoLogin.objects.filter(id_usuario=user, hora_saida__isnull=True).order_by('-hora_entrada').first()
            elif user_type == 'aluno':
                 historico = HistoricoLogin.objects.filter(id_aluno=user, hora_saida__isnull=True).order_by('-hora_entrada').first()
            elif user_type == 'encarregado':
                 historico = HistoricoLogin.objects.filter(id_encarregado=user, hora_saida__isnull=True).order_by('-hora_entrada').first()

            if historico:
                historico.hora_saida = timezone.now()
                historico.save()

    @staticmethod
    def update_password_via_token(user_id, user_type, new_password):
        """
        Define nova senha usando token de recuperação (sem checar senha antiga).
        """
        user = None
        if user_type == 'funcionario':
             # Tenta achar funcionario
             try:
                user = Funcionario.objects.get(id_funcionario=user_id)
             except Funcionario.DoesNotExist:
                 # Pode ser usuario admin puro
                 try:
                    user = Usuario.objects.get(id_usuario=user_id)
                 except: 
                    pass
        elif user_type == 'usuario':
            user = Usuario.objects.get(id_usuario=user_id)
        elif user_type == 'aluno':
            user = Aluno.objects.get(id_aluno=user_id)
        elif user_type == 'encarregado':
            user = Encarregado.objects.get(id_encarregado=user_id)
            
        if not user:
            raise ValueError('Usuário não encontrado.')
            
        # Atualizar senha
        from django.contrib.auth.hashers import make_password as _make_password
        hashed_password = _make_password(new_password)
        
        # Se tiver Auth User
        if hasattr(user, 'user') and user.user:
             user.user.set_password(new_password)
             user.user.save()
        
        # Usa update() direto para bypassar validações do modelo
        # (necessário para alunos com estado final poderem recuperar senha)
        user.__class__.objects.filter(pk=user.pk).update(senha_hash=hashed_password)
        return True
