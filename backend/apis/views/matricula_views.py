from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from apis.models import Matricula
from apis.serializers.matricula_serializers import MatriculaSerializer

class MatriculaViewSet(viewsets.ModelViewSet):
    """ViewSet para Matricula"""
    queryset = Matricula.objects.select_related(
        'id_aluno', 
        'id_turma', 
        'id_turma__id_curso', 
        'id_turma__id_sala', 
        'id_turma__id_classe', 
        'id_turma__id_periodo'
    ).all()
    serializer_class = MatriculaSerializer
    permission_classes = [AllowAny] # For dev ease, typically IsAuthenticated
    
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['id_aluno__nome_completo', 'id_matricula']
    ordering_fields = ['data_matricula', 'id_aluno__nome_completo']
    ordering = ['-data_matricula']
