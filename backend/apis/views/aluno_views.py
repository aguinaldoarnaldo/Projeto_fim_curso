from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from apis.models import Aluno, AlunoEncarregado
from apis.serializers import (
    AlunoSerializer, AlunoListSerializer, AlunoDetailSerializer,
    AlunoEncarregadoSerializer
)


class AlunoViewSet(viewsets.ModelViewSet):
    """ViewSet para Aluno"""
    queryset = Aluno.objects.select_related('id_turma').all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    #filterset_fields = ['status_aluno', 'id_turma', 'genero']
    search_fields = ['nome_completo', 'email', 'numero_matricula']
    ordering_fields = ['nome_completo', 'numero_matricula', 'criado_em']
    ordering = ['nome_completo']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return AlunoDetailSerializer
        elif self.action == 'list':
            return AlunoListSerializer
        return AlunoSerializer
    
    @action(detail=False, methods=['get'])
    def ativos(self, request):
        """Retorna apenas alunos ativos"""
        alunos = self.queryset.filter(status_aluno='Activo')
        serializer = AlunoListSerializer(alunos, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def notas(self, request, pk=None):
        """Retorna notas do aluno"""
        from apis.models import Nota
        from apis.serializers import NotaListSerializer
        
        aluno = self.get_object()
        notas = Nota.objects.filter(id_aluno=aluno).select_related(
            'id_disciplina', 'id_professor'
        ).order_by('-data_lancamento')
        serializer = NotaListSerializer(notas, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def faltas(self, request, pk=None):
        """Retorna faltas do aluno"""
        from apis.models import FaltaAluno
        from apis.serializers import FaltaAlunoListSerializer
        
        aluno = self.get_object()
        faltas = FaltaAluno.objects.filter(id_aluno=aluno).select_related(
            'id_disciplina', 'id_turma'
        ).order_by('-data_falta')
        serializer = FaltaAlunoListSerializer(faltas, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def boletim(self, request, pk=None):
        """Retorna boletim completo do aluno"""
        from apis.models import Nota
        from django.db.models import Avg, Count
        
        aluno = self.get_object()
        
        # Notas agrupadas por disciplina
        notas_por_disciplina = Nota.objects.filter(
            id_aluno=aluno
        ).values(
            'id_disciplina__nome'
        ).annotate(
            media=Avg('valor'),
            total_avaliacoes=Count('id_nota')
        )
        
        # Faltas totais
        from apis.models import FaltaAluno
        total_faltas = FaltaAluno.objects.filter(id_aluno=aluno).count()
        faltas_justificadas = FaltaAluno.objects.filter(
            id_aluno=aluno, justificada=True
        ).count()
        
        return Response({
            'aluno': AlunoDetailSerializer(aluno).data,
            'notas_por_disciplina': list(notas_por_disciplina),
            'total_faltas': total_faltas,
            'faltas_justificadas': faltas_justificadas,
            'faltas_injustificadas': total_faltas - faltas_justificadas
        })
    
    @action(detail=True, methods=['get'])
    def encarregados(self, request, pk=None):
        """Retorna encarregados do aluno"""
        from apis.serializers import EncarregadoListSerializer
        
        aluno = self.get_object()
        vinculos = AlunoEncarregado.objects.filter(
            id_aluno=aluno
        ).select_related('id_encarregado')
        encarregados = [v.id_encarregado for v in vinculos]
        serializer = EncarregadoListSerializer(encarregados, many=True)
        return Response(serializer.data)


class AlunoEncarregadoViewSet(viewsets.ModelViewSet):
    """ViewSet para AlunoEncarregado"""
    queryset = AlunoEncarregado.objects.select_related(
        'id_aluno', 'id_encarregado'
    ).all()
    serializer_class = AlunoEncarregadoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    #filterset_fields = ['id_aluno', 'id_encarregado']
