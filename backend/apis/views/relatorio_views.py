import os
from django.conf import settings
from django.template.loader import render_to_string
from django.http import HttpResponse
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from xhtml2pdf import pisa
from io import BytesIO

from apis.models import (
    Aluno, Turma, Pagamento, Candidato, AnoLectivo
)
from django.db.models import Sum, Count

class RelatorioViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def _render_pdf(self, template_path, context):
        html = render_to_string(template_path, context)
        result = BytesIO()
        pdf = pisa.pisaDocument(BytesIO(html.encode("UTF-8")), result)
        if not pdf.err:
            return HttpResponse(result.getvalue(), content_type='application/pdf')
        return None

    @action(detail=False, methods=['get'])
    def data_dashboard(self, request):
        """Retorna dados gerais para serem exibidos na página de relatórios"""
        total_alunos = Aluno.objects.count()
        total_candidatos = Candidato.objects.count()
        total_pagamentos = Pagamento.objects.aggregate(total=Sum('valor_pago'))['total'] or 0
        
        return Response({
            'total_alunos': total_alunos,
            'total_candidatos': total_candidatos,
            'total_financeiro': float(total_pagamentos),
            'relatorios_disponiveis': 5
        })

    @action(detail=False, methods=['get'])
    def alunos_por_turma(self, request):
        """Gera PDF da lista nominal de uma turma específica"""
        turma_id = request.query_params.get('turma_id')
        if not turma_id:
            return Response({'erro': 'turma_id é obrigatório'}, status=400)
            
        try:
            turma = Turma.objects.select_related('id_curso', 'id_classe', 'id_periodo', 'id_sala').get(id_turma=turma_id)
            alunos = Aluno.objects.filter(id_turma=turma).order_by('nome_completo')
            
            from django.utils import timezone
            context = {
                'turma': turma,
                'alunos': alunos,
                'data_impressao': timezone.now().strftime('%d/%m/%Y %H:%M'),
                'escola_nome': 'Complexo Escolar Politécnico - Projecto Fim de Curso'
            }
            
            # TODO: Create templates/pdf/lista_alunos_turma.html
            response = self._render_pdf('pdf/lista_alunos_turma.html', context)
            if response:
                response['Content-Disposition'] = f'attachment; filename="lista_alunos_{turma.codigo_turma}.pdf"'
                return response
            return Response({'erro': 'Erro ao gerar PDF'}, status=500)
        except Turma.DoesNotExist:
            return Response({'erro': 'Turma não encontrada'}, status=404)

    @action(detail=False, methods=['get'])
    def financeiro_resumo(self, request):
        """Gera PDF de resumo financeiro por período"""
        from apis.models import Pagamento
        # Acesso correto: Pagamento -> Fatura -> Aluno
        pagamentos = Pagamento.objects.select_related('id_fatura__id_aluno').order_by('-criado_em')[:50]
        total = Pagamento.objects.aggregate(total=Sum('valor_pago'))['total'] or 0
        
        from django.utils import timezone
        context = {
            'pagamentos': pagamentos,
            'total_geral': total,
            'data_impressao': timezone.now().strftime('%d/%m/%Y %H:%M'),
            'escola_nome': 'Complexo Escolar Politécnico'
        }
        
        response = self._render_pdf('pdf/financeiro_resumo.html', context)
        if response:
            response['Content-Disposition'] = 'attachment; filename="resumo_financeiro.pdf"'
            return response
        return Response({'erro': 'Erro ao gerar PDF'}, status=500)

    @action(detail=False, methods=['get'])
    def inscritos_por_ano(self, request):
        """Relatório de inscritos (candidatos)"""
        ano_lectivo_id = request.query_params.get('ano_id')
        candidatos = Candidato.objects.all().order_by('nome_completo')
        if ano_lectivo_id:
            candidatos = candidatos.filter(ano_lectivo_id=ano_lectivo_id)
            
        from django.utils import timezone
        context = {
            'candidatos': candidatos,
            'total': candidatos.count(),
            'data_impressao': timezone.now().strftime('%d/%m/%Y %H:%M'),
            'escola_nome': 'Complexo Escolar Politécnico'
        }
        
        response = self._render_pdf('pdf/inscritos_resumo.html', context)
        if response:
            response['Content-Disposition'] = 'attachment; filename="relatorio_inscritos.pdf"'
            return response
        return Response({'erro': 'Erro ao gerar PDF'}, status=500)

    @action(detail=False, methods=['get'])
    def stats_ocupacao(self, request):
        """Relatório de ocupação de salas com contagem de alunos"""
        from apis.models import Sala, Aluno
        from django.db.models import Count, Q
        
        # Busca todas as salas e anota com o total de alunos ativos
        # Aluno -> Turma -> Sala
        salas_data = Sala.objects.all().order_by('bloco', 'numero_sala')
        
        # Para cada sala, calculamos o total de alunos ativos
        # Isso evita problemas com SerializerMethodField no template HTML raw
        for sala in salas_data:
            sala.total_alunos_count = Aluno.objects.filter(id_turma__id_sala=sala, status_aluno='Activo').count()
            if sala.capacidade_alunos > 0:
                sala.percentagem = round((sala.total_alunos_count / sala.capacidade_alunos) * 100, 1)
            else:
                sala.percentagem = 0
        
        context = {
            'salas': salas_data,
            'data_impressao': timezone.now().strftime('%d/%m/%Y %H:%M'),
            'escola_nome': 'Complexo Escolar Politécnico'
        }
        
        response = self._render_pdf('pdf/ocupacao_salas.html', context)
        if response:
            response['Content-Disposition'] = 'attachment; filename="ocupacao_salas.pdf"'
            return response
        return Response({'erro': 'Erro ao gerar PDF'}, status=500)
