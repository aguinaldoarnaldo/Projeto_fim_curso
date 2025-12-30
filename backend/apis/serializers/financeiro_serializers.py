from rest_framework import serializers
from apis.models import Fatura, Pagamento


class FaturaSerializer(serializers.ModelSerializer):
    """Serializer para Fatura"""
    aluno_nome = serializers.CharField(source='id_aluno.nome_completo', read_only=True)
    
    class Meta:
        model = Fatura
        fields = [
            'id_fatura', 'id_aluno', 'aluno_nome', 'descricao', 'total',
            'status', 'data_vencimento', 'data_pagamento',
            'criado_em', 'atualizado_em'
        ]
        read_only_fields = ['id_fatura', 'criado_em', 'atualizado_em']


class FaturaListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagem de Faturas"""
    aluno_nome = serializers.CharField(source='id_aluno.nome_completo', read_only=True)
    
    class Meta:
        model = Fatura
        fields = ['id_fatura', 'aluno_nome', 'descricao', 'total', 'status', 'data_vencimento']


class PagamentoSerializer(serializers.ModelSerializer):
    """Serializer para Pagamento"""
    fatura_descricao = serializers.CharField(source='id_fatura.descricao', read_only=True)
    recebedor_nome = serializers.CharField(source='id_recebedor.nome_completo', read_only=True)
    
    class Meta:
        model = Pagamento
        fields = [
            'id_pagamento', 'id_fatura', 'fatura_descricao', 'valor_pago',
            'metodo_pagamento', 'comprovante_path', 'id_recebedor',
            'recebedor_nome', 'criado_em', 'atualizado_em'
        ]
        read_only_fields = ['id_pagamento', 'criado_em', 'atualizado_em']


class PagamentoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagem de Pagamentos"""
    fatura_descricao = serializers.CharField(source='id_fatura.descricao', read_only=True)
    
    class Meta:
        model = Pagamento
        fields = ['id_pagamento', 'fatura_descricao', 'valor_pago', 'metodo_pagamento', 'criado_em']
