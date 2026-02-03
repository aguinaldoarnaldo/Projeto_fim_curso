from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from apis.models import Notificacao
from apis.serializers.notificacao import NotificacaoSerializer

class NotificacaoViewSet(viewsets.ModelViewSet):
    queryset = Notificacao.objects.all().order_by('-data_criacao')
    serializer_class = NotificacaoSerializer
    
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
