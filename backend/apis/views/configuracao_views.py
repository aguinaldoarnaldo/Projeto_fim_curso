from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
from apis.models import Configuracao
from apis.serializers.configuracao_serializers import ConfiguracaoSerializer
from apis.permissions.custom_permissions import HasAdditionalPermission
from apis.mixins import AuditMixin

class ConfiguracaoViewSet(AuditMixin, viewsets.GenericViewSet):
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
        
        # Lógica de fechamento automático baseada no Ano Lectivo
        from apis.models import AnoLectivo
        active_year = AnoLectivo.get_active_year()
        
        if active_year and active_year.fecho_automatico_inscricoes:
            if config.candidaturas_abertas and not active_year.is_inscricoes_abertas:
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
            instance = serializer.save()
            self._log_audit_action('update', instance, serializer)
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
