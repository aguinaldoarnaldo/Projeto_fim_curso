from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from apis.permissions.custom_permissions import IsDirecao, IsSecretario, IsFuncionario, IsAluno, IsEncarregado
from apis.services.document_service import DocumentService

from apis.models import Documento, SolicitacaoDocumento
from apis.serializers import (
    DocumentoSerializer, DocumentoListSerializer,
    SolicitacaoDocumentoSerializer, SolicitacaoDocumentoListSerializer,
    SolicitacaoDocumentoAprovarSerializer, SolicitacaoDocumentoRejeitarSerializer
)


class DocumentoViewSet(viewsets.ModelViewSet):
    """ViewSet para Documento"""
    queryset = Documento.objects.select_related(
        'id_aluno', 'criado_por'
    ).all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['id_aluno', 'tipo_documento']
    search_fields = ['tipo_documento', 'uuid_documento']
    ordering_fields = ['data_emissao']
    ordering = ['-data_emissao']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return DocumentoListSerializer
        return DocumentoSerializer
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download do documento PDF"""
        documento = self.get_object()
        # Implementar lógica de download do PDF
        return Response({
            'message': 'Endpoint para download de documento',
            'caminho_pdf': documento.caminho_pdf,
            'uuid': str(documento.uuid_documento)
        })


class SolicitacaoDocumentoViewSet(viewsets.ModelViewSet):
    """ViewSet para SolicitacaoDocumento"""
    queryset = SolicitacaoDocumento.objects.select_related(
        'id_aluno', 'id_encarregado', 'id_funcionario'
    ).all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status_solicitacao', 'tipo_documento', 'id_aluno']
    search_fields = ['tipo_documento']
    ordering_fields = ['data_solicitacao']
    ordering = ['-data_solicitacao']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return SolicitacaoDocumentoListSerializer
        elif self.action == 'aprovar':
            return SolicitacaoDocumentoAprovarSerializer
        elif self.action == 'rejeitar':
            return SolicitacaoDocumentoRejeitarSerializer
        return SolicitacaoDocumentoSerializer
    
    @action(detail=False, methods=['get'])
    def minhas(self, request):
        """Retorna solicitações do usuário autenticado"""
        # Implementar lógica baseada no tipo de usuário (aluno/encarregado)
        return Response({'message': 'Endpoint para minhas solicitações'})
    
    @action(detail=False, methods=['get'])
    def pendentes(self, request):
        """Retorna solicitações pendentes"""
        solicitacoes = self.queryset.filter(status_solicitacao='pendente')
        serializer = SolicitacaoDocumentoListSerializer(solicitacoes, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsDirecao])
    def aprovar(self, request, pk=None):
        """Aprovar solicitação de documento usando DocumentService"""
        serializer = SolicitacaoDocumentoAprovarSerializer(data=request.data)
        
        if serializer.is_valid():
            funcionario_id = serializer.validated_data['id_funcionario']
            try:
                solicitacao = DocumentService.aprovar_solicitacao(pk, funcionario_id)
                return Response({
                    'message': 'Solicitação aprovada com sucesso via DocumentService',
                    'solicitacao': SolicitacaoDocumentoSerializer(solicitacao).data
                }, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], permission_classes=[IsDirecao])
    def rejeitar(self, request, pk=None):
        """Rejeitar solicitação de documento usando DocumentService"""
        serializer = SolicitacaoDocumentoRejeitarSerializer(data=request.data)
        
        if serializer.is_valid():
            funcionario_id = serializer.validated_data['id_funcionario']
            motivo = serializer.validated_data['motivo']
            try:
                solicitacao = DocumentService.rejeitar_solicitacao(pk, funcionario_id, motivo)
                return Response({
                    'message': 'Solicitação rejeitada',
                    'motivo': motivo
                }, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
