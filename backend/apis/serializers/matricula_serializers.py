from rest_framework import serializers
from apis.models import Matricula

class MatriculaSerializer(serializers.ModelSerializer):
    """Serializer para Matricula"""
    aluno_nome = serializers.CharField(source='id_aluno.nome_completo', read_only=True)
    aluno_foto = serializers.ImageField(source='id_aluno.foto', read_only=True)
    
    # Safe fields using methods to handle null Turma
    turma_codigo = serializers.SerializerMethodField()
    ano_lectivo = serializers.SerializerMethodField()
    classe_nome = serializers.SerializerMethodField()
    curso_nome = serializers.SerializerMethodField()
    sala_numero = serializers.SerializerMethodField()
    periodo_nome = serializers.SerializerMethodField()
    
    class Meta:
        model = Matricula
        fields = [
            'id_matricula', 
            'id_aluno', 'aluno_nome', 'aluno_foto',
            'id_turma', 'turma_codigo', 
            'ano_lectivo',
            'classe_nome',
            'curso_nome',
            'sala_numero',
            'periodo_nome',
            'data_matricula', 'ativo'
        ]
        read_only_fields = ['id_matricula', 'data_matricula']

    def get_turma_codigo(self, obj):
        return obj.id_turma.codigo_turma if obj.id_turma else "Sem Turma"

    def get_ano_lectivo(self, obj):
        return obj.id_turma.ano if obj.id_turma else "N/A"

    def get_classe_nome(self, obj):
        # Accessing nested: id_turma -> id_classe -> descricao
        if obj.id_turma and obj.id_turma.id_classe:
            return obj.id_turma.id_classe.descricao or f"{obj.id_turma.id_classe.nivel}ª Classe"
        return "N/A"

    def get_curso_nome(self, obj):
        return obj.id_turma.id_curso.nome_curso if obj.id_turma and obj.id_turma.id_curso else "N/A"

    def get_sala_numero(self, obj):
        return str(obj.id_turma.id_sala.numero_sala) if obj.id_turma and obj.id_turma.id_sala else "N/A"

    def get_periodo_nome(self, obj):
        return obj.id_turma.id_periodo.periodo if obj.id_turma and obj.id_turma.id_periodo else "N/A"
