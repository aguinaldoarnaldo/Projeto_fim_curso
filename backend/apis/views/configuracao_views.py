from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
from apis.models import Configuracao
from apis.serializers.configuracao_serializers import ConfiguracaoSerializer
from apis.permissions.custom_permissions import HasAdditionalPermission

class ConfiguracaoViewSet(viewsets.GenericViewSet):
    """
    ViewSet Singleton para Configuração do Sistema
    """
    queryset = Configuracao.objects.all()
    serializer_class = ConfiguracaoSerializer
    
    permission_map = {
        'update_config': 'view_configuracoes'
    }

    # Permitir leitura pública para que o frontend (página de login/candidatura) saiba se está aberto
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'get_config']:
            return [AllowAny()]
        return [IsAuthenticated(), HasAdditionalPermission()]

    def list(self, request):
        """Retorna a configuração singleton"""
        config = Configuracao.get_solo()
        
        # Lógica de fechamento automático
        from django.utils import timezone
        if config.candidaturas_abertas and config.fechamento_automatico and config.data_fim_candidatura:
            if timezone.now() > config.data_fim_candidatura:
                config.candidaturas_abertas = False
                config.save()
        
        serializer = self.get_serializer(config)
        return Response(serializer.data)

    @action(detail=False, methods=['patch', 'put'])
    def update_config(self, request):
        """Atualiza a configuração singleton"""
        config = Configuracao.get_solo()
        serializer = self.get_serializer(config, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
