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
        Sobrescreve para retornar o usuário Django se existir,
        mas também podemos garantir que o perfil existe
        """
        try:
            user = super().get_user(validated_token)
            return user
        except Exception:
            # Se for um login direto sem usuário Django (via profiles)
            # Retornamos um objeto anônimo com as flags necessárias ou o próprio profile
            return None
