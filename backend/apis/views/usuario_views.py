from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.permissions import IsAuthenticated, AllowAny
from apis.permissions.custom_permissions import HasAdditionalPermission

from apis.models import Funcionario, Encarregado, Cargo, CargoFuncionario, Usuario
from django.contrib.auth.models import User
from apis.serializers import (
    FuncionarioSerializer, FuncionarioListSerializer,
    EncarregadoSerializer, EncarregadoListSerializer,
    CargoSerializer, CargoFuncionarioSerializer, UsuarioSerializer
)
from apis.mixins import AuditMixin


class UsuarioViewSet(AuditMixin, viewsets.ModelViewSet):
    """ViewSet para gestão de Usuários do Django (Login)"""
    queryset = User.objects.all().order_by('username')
    serializer_class = UsuarioSerializer
    permission_classes = [IsAuthenticated, HasAdditionalPermission]
    permission_map = {
        'list': 'manage_usuarios',
        'retrieve': 'manage_usuarios',
        'create': 'manage_usuarios',
        'update': 'manage_usuarios',
        'partial_update': 'manage_usuarios',
        'destroy': 'manage_usuarios',
    }
    
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['username', 'first_name', 'last_name', 'email']
    ordering_fields = ['username', 'date_joined']

    def perform_create(self, serializer):
        from django.utils.crypto import get_random_string
        password = self.request.data.get('senha_hash')
        if not password:
            password = get_random_string(length=12)
        instance = serializer.save(senha_hash=password)
        self._log_audit_action('create', instance, serializer)

class CargoViewSet(AuditMixin, viewsets.ModelViewSet):
    """ViewSet para Cargo"""
    queryset = Cargo.objects.all()
    serializer_class = CargoSerializer
    permission_classes = [IsAuthenticated, HasAdditionalPermission]
    permission_map = {
        # 'list': 'view_configuracoes',
        # 'retrieve': 'view_configuracoes',
        'create': 'manage_configuracoes',
        'update': 'manage_configuracoes',
        'destroy': 'manage_configuracoes',
    }
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['nome_cargo']
    ordering_fields = ['nome_cargo', 'criado_em']
    ordering = ['nome_cargo']

class FuncionarioViewSet(AuditMixin, viewsets.ModelViewSet):
    """ViewSet para Funcionario"""
    queryset = Funcionario.objects.select_related('id_cargo').all()
    permission_classes = [IsAuthenticated, HasAdditionalPermission]
    permission_map = {
        'list': 'manage_usuarios',
        'create': 'manage_usuarios',
        'retrieve': 'manage_usuarios',
        'update': 'manage_usuarios',
        'partial_update': 'manage_usuarios',
        'destroy': 'manage_usuarios',
        'historico_cargos': 'manage_usuarios',
        'ativos': 'view_dashboard',
        'online': 'view_dashboard'
    }

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['nome_completo', 'email', 'codigo_identificacao']
    ordering_fields = ['nome_completo', 'data_admissao', 'criado_em']
    ordering = ['nome_completo']

    def perform_create(self, serializer):
        from apis.utils.auth_utils import generate_password_token, send_password_definition_email
        from django.utils.crypto import get_random_string
        password = self.request.data.get('senha_hash')
        is_invite = not password
        if is_invite:
            password = get_random_string(length=32)
            
        import datetime
        year = datetime.datetime.now().year
        code = f"FUNC{year}{get_random_string(length=4, allowed_chars='0123456789')}"
        instance = serializer.save(senha_hash=password, codigo_identificacao=code)
        self._log_audit_action('create', instance, serializer)
        
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
        funcionarios = self.queryset.filter(status_funcionario='Activo')
        serializer = FuncionarioListSerializer(funcionarios, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def online(self, request):
        funcionarios = self.queryset.filter(is_online=True)
        serializer = FuncionarioListSerializer(funcionarios, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def historico_cargos(self, request, pk=None):
        funcionario = self.get_object()
        historico = CargoFuncionario.objects.filter(id_funcionario=funcionario).select_related('id_cargo').order_by('-data_inicio')
        serializer = CargoFuncionarioSerializer(historico, many=True)
        return Response(serializer.data)

class EncarregadoViewSet(AuditMixin, viewsets.ModelViewSet):
    """ViewSet para Encarregado"""
    queryset = Encarregado.objects.all()
    permission_classes = [IsAuthenticated, HasAdditionalPermission]
    permission_map = {
        'list': 'view_alunos',
        'retrieve': 'view_alunos',
        'create': 'create_aluno',
        'update': 'edit_aluno',
        'destroy': 'delete_aluno',
    }
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['nome_completo', 'email']
    ordering_fields = ['nome_completo', 'criado_em']
    ordering = ['nome_completo']
    
    def perform_create(self, serializer):
        from apis.utils.auth_utils import generate_password_token, send_password_definition_email
        from django.utils.crypto import get_random_string
        password = self.request.data.get('senha_hash')
        is_invite = not password
        if is_invite:
            password = get_random_string(length=32)
        instance = serializer.save(senha_hash=password)
        self._log_audit_action('create', instance, serializer)
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
        from apis.models import AlunoEncarregado
        from apis.serializers import AlunoListSerializer
        encarregado = self.get_object()
        vinculos = AlunoEncarregado.objects.filter(id_encarregado=encarregado).select_related('id_aluno')
        alunos = [v.id_aluno for v in vinculos]
        serializer = AlunoListSerializer(alunos, many=True)
        return Response(serializer.data)

class CargoFuncionarioViewSet(AuditMixin, viewsets.ModelViewSet):
    """ViewSet para CargoFuncionario"""
    queryset = CargoFuncionario.objects.select_related('id_cargo', 'id_funcionario').all()
    serializer_class = CargoFuncionarioSerializer
    permission_classes = [IsAuthenticated, HasAdditionalPermission]
    permission_map = {'list': 'manage_usuarios'}
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    ordering_fields = ['data_inicio', 'data_fim']
    ordering = ['-data_inicio']
