from rest_framework import serializers
from apis.models import Inscricao, Matricula, Historico, HistoricoLogin


class InscricaoSerializer(serializers.ModelSerializer):
    """Serializer para Inscricao"""
    
    class Meta:
        model = Inscricao
        fields = [
            'id_inscricao', 'data_inscricao', 'nome_candidato',
            'documento_candidato', 'resultado_avaliacao'
        ]
        read_only_fields = ['id_inscricao', 'data_inscricao']


class MatriculaSerializer(serializers.ModelSerializer):
    """Serializer para Matricula"""
    aluno_nome = serializers.CharField(source='id_aluno.nome_completo', read_only=True)
    turma_codigo = serializers.CharField(source='id_turma.codigo_turma', read_only=True)
    
    class Meta:
        model = Matricula
        fields = [
            'id_matricula', 'id_aluno', 'aluno_nome', 'id_turma',
            'turma_codigo', 'data_matricula', 'ativo'
        ]
        read_only_fields = ['id_matricula', 'data_matricula']


class HistoricoSerializer(serializers.ModelSerializer):
    """Serializer para Historico"""
    funcionario_nome = serializers.CharField(source='id_funcionario.nome_completo', read_only=True)
    aluno_nome = serializers.CharField(source='id_aluno.nome_completo', read_only=True)
    
    class Meta:
        model = Historico
        fields = [
            'id_historico', 'id_funcionario', 'funcionario_nome',
            'id_aluno', 'aluno_nome', 'tipo_accao', 'dados_anteriores',
            'dados_novos', 'data_hora'
        ]
        read_only_fields = ['id_historico', 'data_hora']


class HistoricoLoginSerializer(serializers.ModelSerializer):
    """Serializer para HistoricoLogin"""
    funcionario_nome = serializers.CharField(source='id_funcionario.nome_completo', read_only=True)
    aluno_nome = serializers.CharField(source='id_aluno.nome_completo', read_only=True)
    encarregado_nome = serializers.CharField(source='id_encarregado.nome_completo', read_only=True)
    
    class Meta:
        model = HistoricoLogin
        fields = [
            'id_historico_login', 'id_funcionario', 'funcionario_nome',
            'id_aluno', 'aluno_nome', 'id_encarregado', 'encarregado_nome',
            'ip_usuario', 'dispositivo', 'navegador', 'hora_entrada', 'hora_saida'
        ]
        read_only_fields = ['id_historico_login', 'hora_entrada']
