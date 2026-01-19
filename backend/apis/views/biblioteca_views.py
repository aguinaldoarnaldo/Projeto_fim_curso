from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from apis.models import Categoria, Livro
from apis.serializers import (
    CategoriaSerializer, LivroSerializer, LivroListSerializer
)


class CategoriaViewSet(viewsets.ModelViewSet):
    """ViewSet para Categoria"""
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['nome_categoria']
    ordering = ['nome_categoria']


class LivroViewSet(viewsets.ModelViewSet):
    """ViewSet para Livro"""
    queryset = Livro.objects.select_related(
        'id_categoria', 'id_responsavel'
    ).all()
    # permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    #filterset_fields = ['id_categoria']
    search_fields = ['titulo', 'editora']
    ordering_fields = ['titulo', 'data_upload']
    ordering = ['titulo']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return LivroListSerializer
        return LivroSerializer
