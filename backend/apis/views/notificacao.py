from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from ..models import Notificacao
from ..serializers.notificacao import NotificacaoSerializer

class NotificacaoViewSet(viewsets.ModelViewSet):
    queryset = Notificacao.objects.all().order_by('-data_criacao')
    serializer_class = NotificacaoSerializer

    def list(self, request, *args, **kwargs):
        # Acionar verificação automática antes de retornar a lista
        try:
            from ..services.notification_service import NotificationService
            NotificationService.check_and_create_notifications()
        except Exception as e:
            print(f"Erro ao verificar notificações automáticas: {e}")
            
        return super().list(request, *args, **kwargs)
    
    @action(detail=True, methods=['post'])
    def marcar_como_lida(self, request, pk=None):
        notificacao = self.get_object()
        notificacao.lida = True
        notificacao.save()
        return Response({'status': 'notificacao marcada como lida'})

    @action(detail=False, methods=['post'])
    def marcar_todas_como_lida(self, request):
        Notificacao.objects.filter(lida=False).update(lida=True)
        return Response({'status': 'todas notificacoes marcadas como lida'})

    @action(detail=False, methods=['delete'])
    def eliminar_todas(self, request):
        Notificacao.objects.all().delete()
        return Response({'status': 'todas notificacoes eliminadas'})
