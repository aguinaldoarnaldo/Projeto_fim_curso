from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from apis.permissions.custom_permissions import HasAdditionalPermission

from apis.models import Fatura, Pagamento
from apis.serializers import (
    FaturaSerializer, FaturaListSerializer,
    PagamentoSerializer, PagamentoListSerializer
)
from apis.mixins import AuditMixin


class FaturaViewSet(AuditMixin, viewsets.ModelViewSet):
    """ViewSet para Fatura"""
    queryset = Fatura.objects.select_related('id_aluno').all()
    permission_classes = [IsAuthenticated, HasAdditionalPermission]
    
    # Mapeamento de permissões por ação
    permission_map = {
        'list': 'view_financeiro',
        'retrieve': 'view_financeiro',
        'create': 'manage_financeiro',
        'update': 'manage_financeiro',
        'partial_update': 'manage_financeiro',
        'destroy': 'delete_financeiro',
    }
    
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    #filterset_fields = ['status', 'id_aluno']
    ordering_fields = ['data_vencimento', 'total', 'criado_em']
    ordering = ['-criado_em']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return FaturaListSerializer
        return FaturaSerializer


class PagamentoViewSet(AuditMixin, viewsets.ModelViewSet):
    """ViewSet para Pagamento"""
    queryset = Pagamento.objects.select_related(
        'id_fatura', 'id_recebedor'
    ).all()
    permission_classes = [IsAuthenticated, HasAdditionalPermission]

    # Mapeamento de permissões por ação
    permission_map = {
        'list': 'view_financeiro',
        'retrieve': 'view_financeiro',
        'create': 'create_pagamento',
        'update': 'manage_financeiro',
        'partial_update': 'manage_financeiro',
        'destroy': 'delete_financeiro',
    }

    filter_backends = [DjangoFilterBackend, OrderingFilter]
    #filterset_fields = ['id_fatura', 'metodo_pagamento']
    ordering_fields = ['criado_em', 'valor_pago']
    ordering = ['-criado_em']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return PagamentoListSerializer
        return PagamentoSerializer
