from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework import exceptions
from apis.models import Funcionario, Aluno, Encarregado

class SchoolJWTAuthentication(JWTAuthentication):
    """
    Autenticação JWT customizada que injeta os dados do perfil no request
    """
    def authenticate(self, request):
        header = self.get_header(request)
        if header is None:
            return None

        raw_token = self.get_raw_token(header)
        if raw_token is None:
            return None

        validated_token = self.get_validated_token(raw_token)
        
        # Injetar o payload no request para as permissões
        request.auth_payload = validated_token
        
        # No Django REST, request.user é obrigatório para muitas funcionalidades
        # Vamos tentar associar a um usuário real do Django se existir, 
        # ou retornar o objeto do perfil
        user_id = validated_token.get('user_id')
        user_type = validated_token.get('user_type')
        
        user = self.get_user(validated_token)
        
        # Adicionar informações extras ao request
        request.user_type = user_type
        request.profile_id = user_id
        
        return user, validated_token

    def get_user(self, validated_token):
        """
        Retorna o usuário baseado no tipo e ID do token (Funcionario, Aluno ou Encarregado)
        """
        try:
            user_type = validated_token.get('user_type')
            user_id = validated_token.get('user_id')
            
            if not user_type or not user_id:
               # Se não tiver tipo/id customizado, tenta o padrão Django User (caso use admin etc)
               return super().get_user(validated_token)

            user = None
            if user_type == 'funcionario':
                user = Funcionario.objects.get(id_funcionario=user_id)
            elif user_type == 'aluno':
                user = Aluno.objects.get(id_aluno=user_id)
            elif user_type == 'encarregado':
                user = Encarregado.objects.get(id_encarregado=user_id)
            
            if not user:
                 raise exceptions.AuthenticationFailed('Usuário não encontrado', code='user_not_found')
            
            # Adicionar is_authenticated ao objeto para o DRF (Permission classes usam isso)
            user.is_authenticated = True
            return user
            
        except (Funcionario.DoesNotExist, Aluno.DoesNotExist, Encarregado.DoesNotExist):
            raise exceptions.AuthenticationFailed('Usuário não encontrado', code='user_not_found')
        except Exception as e:
            # Fallback for standard Django users
            try:
                return super().get_user(validated_token)
            except:
                raise exceptions.AuthenticationFailed('Token inválido', code='invalid_token')
