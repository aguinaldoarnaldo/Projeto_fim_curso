from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q

from apis.models import Historico, HistoricoLogin


from apis.permissions.custom_permissions import HasAdditionalPermission


class AuditoriaViewSet(viewsets.ViewSet):
    """ViewSet para visualizar logs de auditoria e sessões de login"""
    permission_classes = [IsAuthenticated, HasAdditionalPermission]
    permission_map = {
        'actividades': 'view_logs',
        'logins': 'view_logs',
        'resumo': 'view_logs'
    }

    @action(detail=False, methods=['get'])
    def actividades(self, request):
        """
        Lista as acções registadas no sistema (Historico).
        Filtra por data_inicio, data_fim, usuario_id e tipo_accao.
        """
        qs = Historico.objects.select_related(
            'id_usuario', 'id_funcionario', 'id_aluno'
        ).order_by('-data_hora')

        # Filtros opcionais
        data_inicio = request.query_params.get('data_inicio')
        data_fim = request.query_params.get('data_fim')
        tipo = request.query_params.get('tipo')
        busca = request.query_params.get('busca')

        if data_inicio:
            qs = qs.filter(data_hora__date__gte=data_inicio)
        if data_fim:
            qs = qs.filter(data_hora__date__lte=data_fim)
        if busca:
            qs = qs.filter(
                Q(tipo_accao__icontains=busca) |
                Q(id_usuario__nome_completo__icontains=busca) |
                Q(id_funcionario__nome_completo__icontains=busca) |
                Q(id_aluno__nome_completo__icontains=busca)
            )

        # Paginação simples
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        total = qs.count()
        
        start = (page - 1) * page_size
        end = start + page_size

        items = []
        for h in qs[start:end]:
            # Resolve nome do executor da acção
            actor_name = 'Sistema'
            if h.id_funcionario_id:
                actor_name = h.id_funcionario.nome_completo if h.id_funcionario else 'Funcionário'
            elif h.id_usuario_id:
                actor_name = h.id_usuario.nome_completo if h.id_usuario else 'Usuário'
            elif h.id_aluno_id:
                actor_name = h.id_aluno.nome_completo if h.id_aluno else 'Aluno'

            items.append({
                'id': h.id_historico,
                'tipo_accao': h.tipo_accao,
                'actor': actor_name,
                'data_hora': h.data_hora.strftime('%d/%m/%Y %H:%M:%S') if h.data_hora else '',
                'dados_anteriores': h.dados_anteriores,
                'dados_novos': h.dados_novos,
            })

        return Response({
            'count': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size if total > 0 else 1,
            'results': items
        })

    @action(detail=False, methods=['get'])
    def logins(self, request):
        """
        Lista o histórico de sessões de login.
        Filtra por data_inicio, data_fim e busca por nome.
        """
        qs = HistoricoLogin.objects.select_related(
            'id_usuario', 'id_funcionario', 'id_aluno', 'id_encarregado'
        ).order_by('-hora_entrada')

        data_inicio = request.query_params.get('data_inicio')
        data_fim = request.query_params.get('data_fim')
        busca = request.query_params.get('busca')
        
        if data_inicio:
            qs = qs.filter(hora_entrada__date__gte=data_inicio)
        if data_fim:
            qs = qs.filter(hora_entrada__date__lte=data_fim)

        if busca:
            qs = qs.filter(
                Q(id_usuario__nome_completo__icontains=busca) |
                Q(id_funcionario__nome_completo__icontains=busca) |
                Q(id_aluno__nome_completo__icontains=busca) |
                Q(id_encarregado__nome_completo__icontains=busca) |
                Q(ip_usuario__icontains=busca)
            )

        # Paginação simples
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        total = qs.count()
        
        start = (page - 1) * page_size
        end = start + page_size

        items = []
        for h in qs[start:end]:
            # Resolver nome e tipo do utilizador
            user_name = 'Desconhecido'
            user_type = 'sistema'
            if h.id_funcionario_id and h.id_funcionario:
                user_name = h.id_funcionario.nome_completo
                user_type = 'Funcionário'
            elif h.id_usuario_id and h.id_usuario:
                user_name = h.id_usuario.nome_completo
                user_type = 'Usuário'
            elif h.id_aluno_id and h.id_aluno:
                user_name = h.id_aluno.nome_completo
                user_type = 'Aluno'
            elif h.id_encarregado_id and h.id_encarregado:
                user_name = h.id_encarregado.nome_completo
                user_type = 'Encarregado'

            # Os campos já foram filtrados no QuerySet

            duracao = None
            if h.hora_saida and h.hora_entrada:
                diff = h.hora_saida - h.hora_entrada
                mins = int(diff.total_seconds() // 60)
                duracao = f"{mins} min"

            items.append({
                'id': h.id_historico_login,
                'utilizador': user_name,
                'tipo_utilizador': user_type,
                'ip': h.ip_usuario or '—',
                'dispositivo': h.dispositivo or '—',
                'entrada': h.hora_entrada.strftime('%d/%m/%Y %H:%M:%S') if h.hora_entrada else '—',
                'saida': h.hora_saida.strftime('%d/%m/%Y %H:%M:%S') if h.hora_saida else '—',
                'duracao': duracao or ('Activo' if not h.hora_saida else '< 1 min'),
                'sessao_activa': h.hora_saida is None,
            })

        return Response({
            'count': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size if total > 0 else 1,
            'results': items
        })

    @action(detail=False, methods=['get'])
    def resumo(self, request):
        """Resumo estatístico para o painel de logs"""
        from django.utils import timezone
        from datetime import timedelta
        from django.db.models import Count

        hoje = timezone.now().date()
        semana_atras = hoje - timedelta(days=7)

        total_accoes = Historico.objects.count()
        accoes_hoje = Historico.objects.filter(data_hora__date=hoje).count()
        total_logins = HistoricoLogin.objects.count()
        logins_hoje = HistoricoLogin.objects.filter(hora_entrada__date=hoje).count()
        sessoes_activas = HistoricoLogin.objects.filter(hora_saida__isnull=True).count()

        # Top 5 acções mais frequentes
        top_accoes = list(
            Historico.objects.values('tipo_accao')
            .annotate(total=Count('id_historico'))
            .order_by('-total')[:5]
        )

        return Response({
            'total_accoes': total_accoes,
            'accoes_hoje': accoes_hoje,
            'total_logins': total_logins,
            'logins_hoje': logins_hoje,
            'sessoes_activas': sessoes_activas,
            'top_accoes': top_accoes,
        })
