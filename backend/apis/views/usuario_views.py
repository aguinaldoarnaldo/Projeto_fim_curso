from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from apis.models import Funcionario, Encarregado, Cargo, CargoFuncionario
from apis.serializers import (
    FuncionarioSerializer, FuncionarioListSerializer,
    EncarregadoSerializer, EncarregadoListSerializer,
    CargoSerializer, CargoFuncionarioSerializer
)


class CargoViewSet(viewsets.ModelViewSet):
    """ViewSet para Cargo"""
    queryset = Cargo.objects.all()
    serializer_class = CargoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['nome_cargo']
    ordering_fields = ['nome_cargo', 'criado_em']
    ordering = ['nome_cargo']


class FuncionarioViewSet(viewsets.ModelViewSet):
    """ViewSet para Funcionario"""
    queryset = Funcionario.objects.select_related('id_cargo').all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status_funcionario', 'id_cargo', 'genero']
    search_fields = ['nome_completo', 'email', 'codigo_identificacao']
    ordering_fields = ['nome_completo', 'data_admissao', 'criado_em']
    ordering = ['nome_completo']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return FuncionarioListSerializer
        return FuncionarioSerializer
    
    @action(detail=False, methods=['get'])
    def ativos(self, request):
        """Retorna apenas funcionários ativos"""
        funcionarios = self.queryset.filter(status_funcionario='Activo')
        serializer = FuncionarioListSerializer(funcionarios, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def online(self, request):
        """Retorna funcionários online"""
        funcionarios = self.queryset.filter(is_online=True)
        serializer = FuncionarioListSerializer(funcionarios, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def historico_cargos(self, request, pk=None):
        """Retorna histórico de cargos do funcionário"""
        funcionario = self.get_object()
        historico = CargoFuncionario.objects.filter(
            id_funcionario=funcionario
        ).select_related('id_cargo').order_by('-data_inicio')
        serializer = CargoFuncionarioSerializer(historico, many=True)
        return Response(serializer.data)


class EncarregadoViewSet(viewsets.ModelViewSet):
    """ViewSet para Encarregado"""
    queryset = Encarregado.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['nome_completo', 'email']
    ordering_fields = ['nome_completo', 'criado_em']
    ordering = ['nome_completo']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return EncarregadoListSerializer
        return EncarregadoSerializer
    
    @action(detail=True, methods=['get'])
    def educandos(self, request, pk=None):
        """Retorna alunos vinculados ao encarregado"""
        from apis.models import AlunoEncarregado
        from apis.serializers import AlunoListSerializer
        
        encarregado = self.get_object()
        vinculos = AlunoEncarregado.objects.filter(
            id_encarregado=encarregado
        ).select_related('id_aluno')
        alunos = [v.id_aluno for v in vinculos]
        serializer = AlunoListSerializer(alunos, many=True)
        return Response(serializer.data)


class CargoFuncionarioViewSet(viewsets.ModelViewSet):
    """ViewSet para CargoFuncionario"""
    queryset = CargoFuncionario.objects.select_related(
        'id_cargo', 'id_funcionario'
    ).all()
    serializer_class = CargoFuncionarioSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['id_funcionario', 'id_cargo']
    ordering_fields = ['data_inicio', 'data_fim']
    ordering = ['-data_inicio']
