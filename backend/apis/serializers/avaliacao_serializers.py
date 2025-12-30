from rest_framework import serializers
from apis.models import (
    TipoDisciplina, Disciplina, DisciplinaCurso,
    ProfessorDisciplina, Nota, FaltaAluno
)


class TipoDisciplinaSerializer(serializers.ModelSerializer):
    """Serializer para TipoDisciplina"""
    
    class Meta:
        model = TipoDisciplina
        fields = ['id_tipo_disciplina', 'nome_tipo', 'sigla']
        read_only_fields = ['id_tipo_disciplina']


class DisciplinaSerializer(serializers.ModelSerializer):
    """Serializer para Disciplina"""
    tipo_nome = serializers.CharField(source='id_tipo_disciplina.nome_tipo', read_only=True)
    coordenador_nome = serializers.CharField(source='id_coordenador.nome_completo', read_only=True)
    
    class Meta:
        model = Disciplina
        fields = [
            'id_disciplina', 'nome', 'id_tipo_disciplina', 'tipo_nome',
            'carga_horaria', 'id_coordenador', 'coordenador_nome',
            'criado_em', 'atualizado_em'
        ]
        read_only_fields = ['id_disciplina', 'criado_em', 'atualizado_em']


class DisciplinaListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagem de Disciplinas"""
    tipo_nome = serializers.CharField(source='id_tipo_disciplina.nome_tipo', read_only=True)
    
    class Meta:
        model = Disciplina
        fields = ['id_disciplina', 'nome', 'tipo_nome', 'carga_horaria']


class DisciplinaCursoSerializer(serializers.ModelSerializer):
    """Serializer para DisciplinaCurso"""
    curso_nome = serializers.CharField(source='id_curso.nome_curso', read_only=True)
    disciplina_nome = serializers.CharField(source='id_disciplina.nome', read_only=True)
    
    class Meta:
        model = DisciplinaCurso
        fields = [
            'id_disciplina_curso', 'id_curso', 'curso_nome',
            'id_disciplina', 'disciplina_nome'
        ]
        read_only_fields = ['id_disciplina_curso']


class ProfessorDisciplinaSerializer(serializers.ModelSerializer):
    """Serializer para ProfessorDisciplina"""
    professor_nome = serializers.CharField(source='id_funcionario.nome_completo', read_only=True)
    disciplina_nome = serializers.CharField(source='id_disciplina.nome', read_only=True)
    turma_codigo = serializers.CharField(source='id_turma.codigo_turma', read_only=True)
    
    class Meta:
        model = ProfessorDisciplina
        fields = [
            'id_professor_disciplina', 'id_funcionario', 'professor_nome',
            'id_disciplina', 'disciplina_nome', 'id_turma', 'turma_codigo'
        ]
        read_only_fields = ['id_professor_disciplina']


class NotaSerializer(serializers.ModelSerializer):
    """Serializer para Nota"""
    aluno_nome = serializers.CharField(source='id_aluno.nome_completo', read_only=True)
    disciplina_nome = serializers.CharField(source='id_disciplina.nome', read_only=True)
    professor_nome = serializers.CharField(source='id_professor.nome_completo', read_only=True)
    turma_codigo = serializers.CharField(source='id_turma.codigo_turma', read_only=True)
    
    class Meta:
        model = Nota
        fields = [
            'id_nota', 'id_aluno', 'aluno_nome', 'id_disciplina', 'disciplina_nome',
            'id_professor', 'professor_nome', 'id_turma', 'turma_codigo',
            'tipo_avaliacao', 'valor', 'data_lancamento'
        ]
        read_only_fields = ['id_nota', 'data_lancamento']


class NotaListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagem de Notas"""
    aluno_nome = serializers.CharField(source='id_aluno.nome_completo', read_only=True)
    disciplina_nome = serializers.CharField(source='id_disciplina.nome', read_only=True)
    
    class Meta:
        model = Nota
        fields = ['id_nota', 'aluno_nome', 'disciplina_nome', 'tipo_avaliacao', 'valor', 'data_lancamento']


class NotaLancamentoLoteSerializer(serializers.Serializer):
    """Serializer para lançamento de notas em lote"""
    id_turma = serializers.IntegerField()
    id_disciplina = serializers.IntegerField()
    id_professor = serializers.IntegerField()
    tipo_avaliacao = serializers.ChoiceField(choices=Nota.TIPO_AVALIACAO_CHOICES)
    notas = serializers.ListField(
        child=serializers.DictField(child=serializers.DecimalField(max_digits=5, decimal_places=2))
    )


class FaltaAlunoSerializer(serializers.ModelSerializer):
    """Serializer para FaltaAluno"""
    aluno_nome = serializers.CharField(source='id_aluno.nome_completo', read_only=True)
    disciplina_nome = serializers.CharField(source='id_disciplina.nome', read_only=True)
    turma_codigo = serializers.CharField(source='id_turma.codigo_turma', read_only=True)
    
    class Meta:
        model = FaltaAluno
        fields = [
            'id_falta', 'id_aluno', 'aluno_nome', 'id_disciplina', 'disciplina_nome',
            'id_turma', 'turma_codigo', 'data_falta', 'justificada', 'observacao'
        ]
        read_only_fields = ['id_falta']


class FaltaAlunoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagem de Faltas"""
    aluno_nome = serializers.CharField(source='id_aluno.nome_completo', read_only=True)
    disciplina_nome = serializers.CharField(source='id_disciplina.nome', read_only=True)
    
    class Meta:
        model = FaltaAluno
        fields = ['id_falta', 'aluno_nome', 'disciplina_nome', 'data_falta', 'justificada']
