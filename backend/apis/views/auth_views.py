from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.hashers import check_password
from apis.models import Funcionario, Aluno, Encarregado, HistoricoLogin


def get_client_ip(request):
    """Obtém o IP do cliente"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def get_user_agent_info(request):
    """Extrai informações do User-Agent"""
    user_agent = request.META.get('HTTP_USER_AGENT', '')
    # Simplificado - pode usar biblioteca como user-agents para parsing mais detalhado
    return {
        'dispositivo': user_agent[:150] if user_agent else 'Desconhecido',
        'navegador': user_agent[:150] if user_agent else 'Desconhecido'
    }


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Endpoint de login para Funcionários, Alunos e Encarregados
    
    Body:
    {
        "email": "usuario@exemplo.com",
        "senha": "senha123",
        "tipo_usuario": "funcionario" | "aluno" | "encarregado"
    }
    """
    email = request.data.get('email')
    senha = request.data.get('senha')
    tipo_usuario = request.data.get('tipo_usuario', 'funcionario')
    
    if not email or not senha:
        return Response(
            {'error': 'Email e senha são obrigatórios'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = None
    user_data = {}
    
    try:
        # Buscar usuário baseado no tipo
        if tipo_usuario == 'funcionario':
            user = Funcionario.objects.get(email=email)
            if check_password(senha, user.senha_hash):
                user_data = {
                    'id': user.id_funcionario,
                    'tipo': 'funcionario',
                    'nome': user.nome_completo,
                    'email': user.email,
                    'cargo': user.id_cargo.nome_cargo if user.id_cargo else None,
                    'status': user.status_funcionario
                }
                # Atualizar status online
                user.is_online = True
                user.save()
            else:
                return Response(
                    {'error': 'Senha incorreta'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
                
        elif tipo_usuario == 'aluno':
            user = Aluno.objects.get(email=email)
            if check_password(senha, user.senha_hash):
                user_data = {
                    'id': user.id_aluno,
                    'tipo': 'aluno',
                    'nome': user.nome_completo,
                    'email': user.email,
                    'numero_matricula': user.numero_matricula,
                    'turma': user.id_turma.codigo_turma if user.id_turma else None,
                    'status': user.status_aluno
                }
                # Atualizar status online
                user.is_online = True
                user.save()
            else:
                return Response(
                    {'error': 'Senha incorreta'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
                
        elif tipo_usuario == 'encarregado':
            user = Encarregado.objects.get(email=email)
            if check_password(senha, user.senha_hash):
                user_data = {
                    'id': user.id_encarregado,
                    'tipo': 'encarregado',
                    'nome': user.nome_completo,
                    'email': user.email
                }
                # Atualizar status online
                user.is_online = True
                user.save()
            else:
                return Response(
                    {'error': 'Senha incorreta'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
        else:
            return Response(
                {'error': 'Tipo de usuário inválido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Gerar tokens JWT
        refresh = RefreshToken()
        refresh['user_id'] = user_data['id']
        refresh['user_type'] = user_data['tipo']
        
        # Adicionar claims também ao token de acesso
        access_token = refresh.access_token
        access_token['user_id'] = user_data['id']
        access_token['user_type'] = user_data['tipo']
        
        # Registrar histórico de login
        user_agent_info = get_user_agent_info(request)
        historico_data = {
            'ip_usuario': get_client_ip(request),
            'dispositivo': user_agent_info['dispositivo'],
            'navegador': user_agent_info['navegador']
        }
        
        if tipo_usuario == 'funcionario':
            historico_data['id_funcionario'] = user
        elif tipo_usuario == 'aluno':
            historico_data['id_aluno'] = user
        elif tipo_usuario == 'encarregado':
            historico_data['id_encarregado'] = user
        
        HistoricoLogin.objects.create(**historico_data)
        
        return Response({
            'access': str(access_token),
            'refresh': str(refresh),
            'user': user_data
        }, status=status.HTTP_200_OK)
        
    except (Funcionario.DoesNotExist, Aluno.DoesNotExist, Encarregado.DoesNotExist):
        return Response(
            {'error': 'Usuário não encontrado'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Erro no login: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def logout_view(request):
    """
    Endpoint de logout
    
    Body:
    {
        "user_id": 1,
        "user_type": "funcionario" | "aluno" | "encarregado"
    }
    """
    user_id = request.data.get('user_id')
    user_type = request.data.get('user_type')
    
    try:
        # Atualizar status online
        if user_type == 'funcionario':
            user = Funcionario.objects.get(id_funcionario=user_id)
            user.is_online = False
            user.save()
        elif user_type == 'aluno':
            user = Aluno.objects.get(id_aluno=user_id)
            user.is_online = False
            user.save()
        elif user_type == 'encarregado':
            user = Encarregado.objects.get(id_encarregado=user_id)
            user.is_online = False
            user.save()
        
        # Atualizar histórico de login (hora de saída)
        from django.utils import timezone
        historico = HistoricoLogin.objects.filter(
            **{f'id_{user_type}': user},
            hora_saida__isnull=True
        ).order_by('-hora_entrada').first()
        
        if historico:
            historico.hora_saida = timezone.now()
            historico.save()
        
        return Response(
            {'message': 'Logout realizado com sucesso'},
            status=status.HTTP_200_OK
        )
        
    except Exception as e:
        return Response(
            {'error': f'Erro no logout: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def me_view(request):
    """
    Retorna informações do usuário autenticado baseado no Token JWT
    """
    from rest_framework_simplejwt.authentication import JWTAuthentication
    from rest_framework.exceptions import AuthenticationFailed
    
    try:
        # Autenticar manualmente o token
        jwt_auth = JWTAuthentication()
        user_auth_tuple = jwt_auth.authenticate(request)
        
        if user_auth_tuple is None:
            return Response(
                {'error': 'Token inválido ou não fornecido'},
                status=status.HTTP_401_UNAUTHORIZED
            )
            
        # O user retornado pelo JWTAuthentication já é o objeto do modelo (AuthUser ou Custom)
        # Mas como não usamos o Auth User padrão do Django para tudo, precisamos verificar
        # o payload do token para saber quem é (aluno, funcionario, etc)
        
        # O payload está no segundo elemento da tupla (token)
        token = user_auth_tuple[1]
        user_id = token.payload.get('user_id')
        user_type = token.payload.get('user_type')
        
        user_data = {}
        
        if user_type == 'funcionario':
            user = Funcionario.objects.get(id_funcionario=user_id)
            user_data = {
                'id': user.id_funcionario,
                'tipo': 'funcionario',
                'nome': user.nome_completo,
                'email': user.email,
                'cargo': user.id_cargo.nome_cargo if user.id_cargo else None,
                'status': user.status_funcionario,
                'is_online': True
            }
        elif user_type == 'aluno':
            user = Aluno.objects.get(id_aluno=user_id)
            user_data = {
                'id': user.id_aluno,
                'tipo': 'aluno',
                'nome': user.nome_completo,
                'email': user.email,
                'numero_matricula': user.numero_matricula,
                'turma': user.id_turma.codigo_turma if user.id_turma else None,
                'status': user.status_aluno,
                'is_online': True
            }
        elif user_type == 'encarregado':
            user = Encarregado.objects.get(id_encarregado=user_id)
            user_data = {
                'id': user.id_encarregado,
                'tipo': 'encarregado',
                'nome': user.nome_completo,
                'email': user.email,
                'is_online': True
            }
            
        return Response({
            'user': user_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Erro ao obter dados do usuário: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['PUT', 'PATCH'])
def update_profile_view(request):
    """
    Endpoint para atualização de perfil do usuário logado
    """
    from rest_framework_simplejwt.authentication import JWTAuthentication
    
    # 1. Identificar usuário via Token
    try:
        jwt_auth = JWTAuthentication()
        user_auth_tuple = jwt_auth.authenticate(request)
        
        if user_auth_tuple is None:
            return Response({'error': 'Token não fornecido'}, status=status.HTTP_401_UNAUTHORIZED)
            
        token = user_auth_tuple[1]
        user_id = token.payload.get('user_id')
        user_type = token.payload.get('user_type')
        
    except Exception as e:
        return Response({'error': 'Token inválido'}, status=status.HTTP_401_UNAUTHORIZED)

    # 2. Obter instância do usuário
    user = None
    try:
        if user_type == 'funcionario':
            user = Funcionario.objects.get(id_funcionario=user_id)
        elif user_type == 'aluno':
            user = Aluno.objects.get(id_aluno=user_id)
        elif user_type == 'encarregado':
            user = Encarregado.objects.get(id_encarregado=user_id)
        else:
            return Response({'error': 'Tipo de usuário desconhecido'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception:
        return Response({'error': 'Usuário não encontrado'}, status=status.HTTP_404_NOT_FOUND)

    # 3. Atualizar dados
    data = request.data
    
    # Atualizar Senha
    senha_atual = data.get('currentPassword')
    nova_senha = data.get('newPassword')
    
    if nova_senha:
        # Se o usuário está tentando mudar a senha
        if not senha_atual:
            return Response({'error': 'Para definir nova senha, a senha atual é obrigatória.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar senha atual
        if not check_password(senha_atual, user.senha_hash):
            return Response({'error': 'A senha atual está incorreta.'}, status=status.HTTP_400_BAD_REQUEST)
            
        # A senha será hasheada no método .save() do modelo
        user.senha_hash = nova_senha 

    # Atualizar Outros campos
    if 'nome' in data and data['nome']:
        user.nome_completo = data['nome']
    
    # Endereço -> mapear para bairro_residencia (simplificação)
    if 'endereco' in data:
        user.bairro_residencia = data['endereco']
        
    # Telefone
    if 'telefone' in data:
        if user_type != 'encarregado':
            user.telefone = data['telefone']

    try:
        user.save()
        
        # Retornar dados atualizados (estrutura similar ao me_view)
        user_resp = {
            'nome': user.nome_completo,
            'email': user.email,
        }
        
        if hasattr(user, 'bairro_residencia'):
            user_resp['endereco'] = user.bairro_residencia
        if hasattr(user, 'telefone') and user_type != 'encarregado':
            user_resp['telefone'] = user.telefone
            
        return Response({
            'message': 'Perfil atualizado com sucesso!',
            'user': user_resp
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': f'Erro ao salvar: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def define_password_view(request):
    """
    Endpoint para definir senha através do link enviado por email
    Body: { "token": "...", "password": "..." }
    """
    token = request.data.get('token')
    password = request.data.get('password')
    
    if not token or not password:
        return Response({'error': 'Token e senha são obrigatórios'}, status=status.HTTP_400_BAD_REQUEST)
        
    from apis.utils.auth_utils import decode_password_token
    payload = decode_password_token(token)
    
    if not payload:
        return Response({'error': 'Token inválido ou expirado'}, status=status.HTTP_400_BAD_REQUEST)
        
    user_id = payload['user_id']
    user_type = payload['user_type']
    
    try:
        user = None
        if user_type == 'funcionario':
            user = Funcionario.objects.get(id_funcionario=user_id)
        elif user_type == 'encarregado':
            user = Encarregado.objects.get(id_encarregado=user_id)
        elif user_type == 'aluno':
            user = Aluno.objects.get(id_aluno=user_id)
            
        if user:
            # A senha será hasheada pelo método save() do modelo (se lógica customizada existir)
            # Mas wait, Funcionario.save() calls make_password ONLY if it doesn't start with pbkdf2...
            # If we send plain text "123456", it triggers make_password.
            user.senha_hash = password 
            user.save()
            return Response({'message': 'Senha definida com sucesso!'}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Usuário não encontrado'}, status=status.HTTP_404_NOT_FOUND)
            
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
