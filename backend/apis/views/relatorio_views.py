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
    def relatorio_turmas(self, request):
        """Relatório geral de turmas, opcionalmente filtrado por ano"""
        ano_id = request.query_params.get('ano_id')
        turmas = Turma.objects.select_related('id_curso', 'id_classe', 'id_periodo', 'id_sala', 'ano_lectivo').all().order_by('ano_lectivo', 'codigo_turma')
        
        if ano_id and ano_id != 'all':
            turmas = turmas.filter(ano_lectivo_id=ano_id)
            
        # Adicionar contagem de alunos para cada turma
        for turma in turmas:
            turma.total_alunos = Aluno.objects.filter(id_turma=turma).count()
            
        from django.utils import timezone
        context = {
            'turmas': turmas,
            'total': turmas.count(),
            'ano_filtrado': AnoLectivo.objects.filter(id_ano=ano_id).first() if (ano_id and ano_id != 'all') else None,
            'data_impressao': timezone.now().strftime('%d/%m/%Y %H:%M'),
            'hoje': timezone.now(),
            'escola_nome': 'Complexo Escolar Politécnico'
        }
        
        response = self._render_pdf('pdf/turmas_resumo.html', context)
        if response:
            response['Content-Disposition'] = 'attachment; filename="relatorio_turmas.pdf"'
            return response
        return Response({'erro': 'Erro ao gerar PDF'}, status=500)

    @action(detail=False, methods=['get'])
    def alunos_por_turma(self, request):
        """Gera PDF da lista nominal de uma turma específica"""
        turma_id = request.query_params.get('turma_id')
        if not turma_id:
            return Response({'erro': 'turma_id é obrigatório'}, status=400)
            
        try:
            turma = Turma.objects.select_related('id_curso', 'id_classe', 'id_periodo', 'id_sala', 'ano_lectivo').get(id_turma=turma_id)
            alunos = Aluno.objects.filter(id_turma=turma).order_by('nome_completo')
            
            from django.utils import timezone
            context = {
                'turma': turma,
                'alunos': alunos,
                'data_impressao': timezone.now().strftime('%d/%m/%Y %H:%M'),
                'hoje': timezone.now(),
                'escola_nome': 'Complexo Escolar Politécnico'
            }
            
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
            'hoje': timezone.now(),
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
        candidatos = Candidato.objects.select_related('curso_primeira_opcao', 'ano_lectivo').all().order_by('nome_completo')
        
        if ano_lectivo_id and ano_lectivo_id != 'all' and ano_lectivo_id != '':
            candidatos = candidatos.filter(ano_lectivo_id=ano_lectivo_id)
            
        from django.utils import timezone
        context = {
            'candidatos': candidatos,
            'total': candidatos.count(),
            'ano_filtrado': AnoLectivo.objects.filter(id_ano=ano_lectivo_id).first() if (ano_lectivo_id and ano_lectivo_id != 'all' and ano_lectivo_id != '') else None,
            'data_impressao': timezone.now().strftime('%d/%m/%Y %H:%M'),
            'hoje': timezone.now(),
            'escola_nome': 'Complexo Escolar Politécnico'
        }
        
        response = self._render_pdf('pdf/inscritos_resumo.html', context)
        if response:
            response['Content-Disposition'] = 'attachment; filename="relatorio_inscritos.pdf"'
            return response
        return Response({'erro': 'Erro ao gerar PDF'}, status=500)

    @action(detail=False, methods=['get'])
    def relatorio_ano_lectivo(self, request):
        """Relatório geral de Anos Lectivos"""
        anos = AnoLectivo.objects.all().order_by('-data_inicio')
        
        from django.utils import timezone
        context = {
            'anos': anos,
            'total': anos.count(),
            'data_impressao': timezone.now().strftime('%d/%m/%Y %H:%M'),
            'hoje': timezone.now(),
            'escola_nome': 'Complexo Escolar Politécnico'
        }
        
        response = self._render_pdf('pdf/anos_lectivos_resumo.html', context)
        if response:
            response['Content-Disposition'] = 'attachment; filename="relatorio_anos_lectivos.pdf"'
            return response
        return Response({'erro': 'Erro ao gerar PDF'}, status=500)

    @action(detail=False, methods=['get'])
    def relatorio_vagas(self, request):
        """Relatório de vagas por curso e ano lectivo"""
        from apis.models import VagaCurso, AnoLectivo, Matricula
        from django.db.models import Count, Q
        
        ano_id = request.query_params.get('ano_id')
        vagas_qs = VagaCurso.objects.select_related('id_curso', 'ano_lectivo').all().order_by('ano_lectivo', 'id_curso__nome_curso')
        
        if ano_id and ano_id != 'all' and ano_id != '':
            vagas_qs = vagas_qs.filter(ano_lectivo_id=ano_id)
            
        report_data = []
        total_vagas = 0
        total_preenchidas = 0
        
        status_ativos = ['Ativa', 'Concluida']
        
        for v in vagas_qs:
            preenchidas = Matricula.objects.filter(
                id_turma__id_curso=v.id_curso,
                ano_lectivo=v.ano_lectivo,
                status__in=status_ativos
            ).count()
            
            report_data.append({
                'curso_nome': v.id_curso.nome_curso,
                'ano_lectivo_nome': v.ano_lectivo.nome,
                'vagas': v.vagas,
                'vagas_preenchidas': preenchidas,
                'vagas_disponiveis': max(0, v.vagas - preenchidas)
            })
            
            total_vagas += v.vagas
            total_preenchidas += preenchidas
            
        from django.utils import timezone
        context = {
            'vagas': report_data,
            'totais': {
                'vagas': total_vagas,
                'preenchidas': total_preenchidas,
                'disponiveis': max(0, total_vagas - total_preenchidas)
            },
            'ano_filtrado': AnoLectivo.objects.filter(id_ano=ano_id).first() if (ano_id and ano_id != 'all' and ano_id != '') else None,
            'hoje': timezone.now(),
            'escola_nome': 'Complexo Escolar Politécnico'
        }
        
        response = self._render_pdf('pdf/vagas_resumo.html', context)
        if response:
            response['Content-Disposition'] = 'attachment; filename="relatorio_vagas.pdf"'
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
        
        
        from django.utils import timezone
        context = {
            'salas': salas_data,
            'data_impressao': timezone.now().strftime('%d/%m/%Y %H:%M'),
            'hoje': timezone.now(),
            'escola_nome': 'Complexo Escolar Politécnico'
        }
        
        response = self._render_pdf('pdf/ocupacao_salas.html', context)
        if response:
            response['Content-Disposition'] = 'attachment; filename="ocupacao_salas.pdf"'
            return response
        return Response({'erro': 'Erro ao gerar PDF'}, status=500)
