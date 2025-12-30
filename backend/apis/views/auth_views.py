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
            'access': str(refresh.access_token),
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
def me_view(request):
    """
    Retorna informações do usuário autenticado
    """
    # Extrair informações do token JWT
    # Implementação simplificada - ajustar conforme necessidade
    return Response({
        'message': 'Endpoint /me/ - implementar extração de dados do token JWT'
    })
