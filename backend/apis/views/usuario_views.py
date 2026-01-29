from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
# from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from apis.models import Funcionario, Encarregado, Cargo, CargoFuncionario
from apis.serializers import (
    FuncionarioSerializer, FuncionarioListSerializer,
    EncarregadoSerializer, EncarregadoListSerializer,
    CargoSerializer, CargoFuncionarioSerializer
)


from rest_framework.permissions import IsAuthenticated, AllowAny

class CargoViewSet(viewsets.ModelViewSet):
    """ViewSet para Cargo"""
    queryset = Cargo.objects.all()
    serializer_class = CargoSerializer
    permission_classes = [AllowAny]
    authentication_classes = []
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['nome_cargo']
    ordering_fields = ['nome_cargo', 'criado_em']
    ordering = ['nome_cargo']


class FuncionarioViewSet(viewsets.ModelViewSet):
    """ViewSet para Funcionario"""
    queryset = Funcionario.objects.select_related('id_cargo').all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    #filterset_fields = ['status_funcionario', 'id_cargo', 'genero']
    search_fields = ['nome_completo', 'email', 'codigo_identificacao']
    ordering_fields = ['nome_completo', 'data_admissao', 'criado_em']
    ordering = ['nome_completo']

    def create(self, request, *args, **kwargs):
        print(f"Dados recebidos no CREATE Funcionario: {request.data}")
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print(f"ERRO DE VALIDAÇÃO FUNCIONARIO: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def perform_create(self, serializer):
        from apis.utils.auth_utils import generate_password_token, send_password_definition_email
        from django.utils.crypto import get_random_string
        
        # Verificar se senha foi fornecida
        password = self.request.data.get('senha_hash')
        is_invite = False
        
        if not password:
            # Gerar senha temporária aleatória
            password = get_random_string(length=32)
            is_invite = True
            
        # Gerar código de identificação único
        import datetime
        year = datetime.datetime.now().year
        # Tenta gerar um código único (loop simples para evitar colisão, embora raro com 6 chars)
        code = f"FUNC{year}{get_random_string(length=4, allowed_chars='0123456789')}"
        
        instance = serializer.save(senha_hash=password, codigo_identificacao=code)
        
        if is_invite and instance.email:
            try:
                token = generate_password_token(instance.id_funcionario, 'funcionario')
                send_password_definition_email(instance, token)
            except Exception as e:
                print(f"Erro ao enviar convite: {e}")

    
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
    
    def perform_create(self, serializer):
        from apis.utils.auth_utils import generate_password_token, send_password_definition_email
        from django.utils.crypto import get_random_string
        
        # Verificar se senha foi fornecida
        password = self.request.data.get('senha_hash')
        is_invite = False
        
        if not password:
            # Gerar senha temporária
            password = get_random_string(length=32)
            is_invite = True
            
        instance = serializer.save(senha_hash=password)
        
        if is_invite and instance.email:
            try:
                token = generate_password_token(instance.id_encarregado, 'encarregado')
                send_password_definition_email(instance, token)
            except Exception as e:
                print(f"Erro ao enviar convite: {e}")

    
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
    #filterset_fields = ['id_funcionario', 'id_cargo']
    ordering_fields = ['data_inicio', 'data_fim']
    ordering = ['-data_inicio']
