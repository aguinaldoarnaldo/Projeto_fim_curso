from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken


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
    Endpoint de login unificado para Funcionários, Alunos e Encarregados.
    Utiliza AuthService para abstrair a complexidade de múltiplos tipos de usuários.
    """
    from apis.services.auth_service import AuthService

    email = request.data.get('email')
    senha = request.data.get('senha')
    tipo_usuario = request.data.get('tipo_usuario', 'funcionario')
    
    if not email or not senha:
        return Response(
            {'error': 'Email e senha são obrigatórios'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # 1. Autenticar Usuário
        user_obj, user_data = AuthService.authenticate_user(email, senha, tipo_usuario)
        
        # 2. Gerar Tokens
        tokens = AuthService.generate_tokens(user_data)
        
        # 3. Registrar Log de Atividade
        AuthService.log_login_activity(user_obj, tipo_usuario, request)
        
        # 4. Preparar Resposta (Remover campos internos sensíveis)
        response_user = user_data.copy()
        if 'profile_id' in response_user:
            response_user['id'] = response_user.pop('profile_id')
            
        # Adicionar URL completa da foto se existir (o Service retorna o objeto ImageField)
        if 'foto_obj' in response_user:
            foto_obj = response_user.pop('foto_obj')
            response_user['foto'] = request.build_absolute_uri(foto_obj.url) if foto_obj else None

        return Response({
            'access': tokens['access'],
            'refresh': tokens['refresh'],
            'user': response_user
        }, status=status.HTTP_200_OK)

    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        # Logar erro real no servidor se necessário
        print(f"Erro Crítico no Login: {str(e)}")
        return Response({'error': 'Erro interno ao processar login.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def logout_view(request):
    """
    Endpoint de logout.
    """
    from apis.services.auth_service import AuthService
    
    try:
        user_id = request.data.get('user_id')
        user_type = request.data.get('user_type', 'funcionario')
        
        AuthService.logout_user(user_id, user_type)
        
        return Response({'message': 'Logout realizado com sucesso'}, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': f'Erro no logout: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def me_view(request):
    """
    Retorna informações do perfil do usuário autenticado.
    """
    from rest_framework_simplejwt.authentication import JWTAuthentication
    from apis.services.auth_service import AuthService
    
    try:
        # Autenticar token manualmente (pois a rota é AllowAny para lidar com erros graciosamente)
        jwt_auth = JWTAuthentication()
        user_auth_tuple = jwt_auth.authenticate(request)
        
        if user_auth_tuple is None:
            return Response({'error': 'Token inválido ou não fornecido'}, status=status.HTTP_401_UNAUTHORIZED)
            
        token = user_auth_tuple[1]
        user_id = token.payload.get('user_id')
        user_type = token.payload.get('user_type')
        
        # Recuperar perfil via Serviço
        user_data = AuthService.get_user_profile(user_id, user_type)
        
        # Processar URL da foto
        if 'foto_obj' in user_data:
            foto_obj = user_data.pop('foto_obj')
            user_data['foto'] = request.build_absolute_uri(foto_obj.url) if foto_obj else None
            
        return Response({'user': user_data}, status=status.HTTP_200_OK)
        
    except (Usuario.DoesNotExist, Funcionario.DoesNotExist, Aluno.DoesNotExist, Encarregado.DoesNotExist):
        return Response({'error': 'Usuário não encontrado.'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': f'Erro ao obter perfil: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT', 'PATCH'])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser])
def update_profile_view(request):
    """
    Endpoint para atualização de perfil do usuário logado via AuthService.
    """
    from rest_framework_simplejwt.tokens import AccessToken
    from apis.services.auth_service import AuthService

    try:
        # 1. Extrair ID e Tipo do Token (Manualmente para suportar todos os tipos)
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Bearer '):
             return Response({'error': 'Token não fornecido ou formato inválido'}, status=status.HTTP_401_UNAUTHORIZED)
             
        token_str = auth_header.split(' ')[1]
        token = AccessToken(token_str)
        user_id = token.payload.get('user_id')
        user_type = token.payload.get('user_type')
        
        # 2. Delegar atualização para o Serviço
        user = AuthService.update_user_profile(user_id, user_type, request.data, request.FILES)
        
        # 3. Preparar resposta com dados atualizados
        # Reutiliza lógica de formatação do serviço se possível, ou constrói resposta simples
        # Aqui vamos construir uma resposta simples para manter compatibilidade com frontend
        
        foto_url = request.build_absolute_uri(user.img_path.url) if user.img_path else None
        
        user_resp = {
            'nome': user.nome_completo,
            'nome_completo': user.nome_completo,
            'email': user.email,
            'username': user.email,
            'foto': foto_url
        }
        
        if hasattr(user, 'bairro_residencia'):
            user_resp['endereco'] = user.bairro_residencia or (user.municipio_residencia if hasattr(user, 'municipio_residencia') else '')
        if hasattr(user, 'telefone') and user_type != 'encarregado':
            user_resp['telefone'] = user.telefone
            
        return Response({
            'message': 'Perfil atualizado com sucesso!',
            'user': user_resp
        }, status=status.HTTP_200_OK)

    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': f'Erro interno ao atualizar: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def define_password_view(request):
    """
    Redefine senha usando token de recuperação.
    """
    from apis.utils.auth_utils import decode_password_token
    from apis.services.auth_service import AuthService
    
    token = request.data.get('token')
    password = request.data.get('password')
    
    if not token or not password:
        return Response({'error': 'Token e senha são obrigatórios'}, status=status.HTTP_400_BAD_REQUEST)
        
    payload = decode_password_token(token)
    
    if not payload:
        return Response({'error': 'Token inválido ou expirado'}, status=status.HTTP_400_BAD_REQUEST)
        
    user_id = payload['user_id']
    user_type = payload['user_type']
    
    try:
        success = AuthService.update_password_via_token(user_id, user_type, password)
        if success:
             return Response({'message': 'Senha definida com sucesso!'}, status=status.HTTP_200_OK)
        else:
             return Response({'error': 'Falha ao atualizar senha.'}, status=status.HTTP_400_BAD_REQUEST)

    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': 'Erro interno.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
