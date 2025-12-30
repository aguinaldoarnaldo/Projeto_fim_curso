from rest_framework import serializers
from apis.models import Documento, SolicitacaoDocumento


class DocumentoSerializer(serializers.ModelSerializer):
    """Serializer para Documento"""
    aluno_nome = serializers.CharField(source='id_aluno.nome_completo', read_only=True)
    criado_por_nome = serializers.CharField(source='criado_por.nome_completo', read_only=True)
    
    class Meta:
        model = Documento
        fields = [
            'id_documento', 'id_aluno', 'aluno_nome', 'tipo_documento',
            'caminho_pdf', 'imagem_carimbo', 'uuid_documento',
            'criado_por', 'criado_por_nome', 'data_emissao'
        ]
        read_only_fields = ['id_documento', 'uuid_documento', 'data_emissao']


class DocumentoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagem de Documentos"""
    aluno_nome = serializers.CharField(source='id_aluno.nome_completo', read_only=True)
    
    class Meta:
        model = Documento
        fields = ['id_documento', 'tipo_documento', 'aluno_nome', 'uuid_documento', 'data_emissao']


class SolicitacaoDocumentoSerializer(serializers.ModelSerializer):
    """Serializer para SolicitacaoDocumento"""
    aluno_nome = serializers.CharField(source='id_aluno.nome_completo', read_only=True)
    encarregado_nome = serializers.CharField(source='id_encarregado.nome_completo', read_only=True)
    funcionario_nome = serializers.CharField(source='id_funcionario.nome_completo', read_only=True)
    
    class Meta:
        model = SolicitacaoDocumento
        fields = [
            'id_solicitacao', 'id_aluno', 'aluno_nome', 'id_encarregado', 'encarregado_nome',
            'id_funcionario', 'funcionario_nome', 'tipo_documento', 'status_solicitacao',
            'caminho_arquivo', 'uuid_documento', 'data_solicitacao', 'data_aprovacao'
        ]
        read_only_fields = ['id_solicitacao', 'data_solicitacao', 'data_aprovacao']


class SolicitacaoDocumentoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagem de Solicitações"""
    aluno_nome = serializers.CharField(source='id_aluno.nome_completo', read_only=True)
    
    class Meta:
        model = SolicitacaoDocumento
        fields = [
            'id_solicitacao', 'tipo_documento', 'aluno_nome',
            'status_solicitacao', 'data_solicitacao'
        ]


class SolicitacaoDocumentoAprovarSerializer(serializers.Serializer):
    """Serializer para aprovar solicitação"""
    id_funcionario = serializers.IntegerField()
    observacao = serializers.CharField(required=False, allow_blank=True)


class SolicitacaoDocumentoRejeitarSerializer(serializers.Serializer):
    """Serializer para rejeitar solicitação"""
    id_funcionario = serializers.IntegerField()
    motivo = serializers.CharField(required=True)
