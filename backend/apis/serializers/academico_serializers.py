from rest_framework import serializers
from apis.models import (
    Sala, Classe, Departamento, Seccao, AreaFormacao,
    Curso, Periodo, Turma, AnoLectivo
)


class AnoLectivoSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnoLectivo
        fields = ['id_ano', 'nome', 'data_inicio', 'data_fim', 'activo']



class SalaSerializer(serializers.ModelSerializer):
    """Serializer para Sala"""
    total_alunos = serializers.SerializerMethodField()
    ocupacao_detalhada = serializers.SerializerMethodField()
    
    class Meta:
        model = Sala
        fields = ['id_sala', 'numero_sala', 'capacidade_alunos', 'bloco', 'total_alunos', 'ocupacao_detalhada', 'criado_em', 'atualizado_em']
        read_only_fields = ['id_sala', 'criado_em', 'atualizado_em']
        
    def get_total_alunos(self, obj):
        # Counts students linked to turmas in this room (Total Headcount)
        from apis.models import Aluno
        return Aluno.objects.filter(id_turma__id_sala=obj, status_aluno='Activo').count()

    def get_ocupacao_detalhada(self, obj):
        from apis.models import Aluno
        from django.db.models import Count
        
        # Group active students by Periodo (Morning, Afternoon, etc.)
        stats = Aluno.objects.filter(
            id_turma__id_sala=obj, 
            status_aluno='Activo'
        ).values('id_turma__id_periodo__periodo').annotate(total=Count('id_aluno'))
        
        # Convert to dictionary { 'Manhã': 30, 'Tarde': 20 }
        return {item['id_turma__id_periodo__periodo'] or 'Sem Turno': item['total'] for item in stats}


class ClasseSerializer(serializers.ModelSerializer):
    """Serializer para Classe"""
    
    class Meta:
        model = Classe
        fields = ['id_classe', 'nivel', 'descricao', 'nome_classe']
        read_only_fields = ['id_classe']

    nome_classe = serializers.CharField(source='__str__', read_only=True)


class DepartamentoSerializer(serializers.ModelSerializer):
    """Serializer para Departamento"""
    chefe_nome = serializers.CharField(source='chefe_id_funcionario.nome_completo', read_only=True)
    
    class Meta:
        model = Departamento
        fields = ['id_departamento', 'nome_departamento', 'chefe_id_funcionario', 'chefe_nome']
        read_only_fields = ['id_departamento']


class SeccaoSerializer(serializers.ModelSerializer):
    """Serializer para Seccao"""
    departamento_nome = serializers.CharField(source='id_departamento.nome_departamento', read_only=True)
    
    class Meta:
        model = Seccao
        fields = ['id_seccao', 'nome_seccao', 'id_departamento', 'departamento_nome']
        read_only_fields = ['id_seccao']


class AreaFormacaoSerializer(serializers.ModelSerializer):
    """Serializer para AreaFormacao"""
    responsavel_nome = serializers.CharField(source='id_responsavel.nome_completo', read_only=True)
    
    class Meta:
        model = AreaFormacao
        fields = ['id_area_formacao', 'nome_area', 'id_responsavel', 'responsavel_nome', 'criado_em', 'atualizado_em']
        read_only_fields = ['id_area_formacao', 'criado_em', 'atualizado_em']


class CursoSerializer(serializers.ModelSerializer):
    """Serializer para Curso"""
    area_formacao_nome = serializers.CharField(source='id_area_formacao.nome_area', read_only=True)
    responsavel_nome = serializers.CharField(source='id_responsavel.nome_completo', read_only=True)
    
    class Meta:
        model = Curso
        fields = [
            'id_curso', 'nome_curso', 'id_area_formacao', 'area_formacao_nome',
            'duracao', 'id_responsavel', 'responsavel_nome',
            'criado_em', 'atualizado_em'
        ]
        read_only_fields = ['id_curso', 'criado_em', 'atualizado_em']


class CursoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagem de Cursos"""
    area_formacao_nome = serializers.SerializerMethodField()
    responsavel_nome = serializers.SerializerMethodField()
    total_turmas = serializers.SerializerMethodField()
    
    class Meta:
        model = Curso
        fields = ['id_curso', 'nome_curso', 'id_area_formacao', 'area_formacao_nome', 'duracao', 'id_responsavel', 'responsavel_nome', 'total_turmas']

    def get_area_formacao_nome(self, obj):
        return obj.id_area_formacao.nome_area if obj.id_area_formacao else "N/A"

    def get_responsavel_nome(self, obj):
        return obj.id_responsavel.nome_completo if obj.id_responsavel else "Sem Coordenador"

    def get_total_turmas(self, obj):
        from apis.models import Turma
        return Turma.objects.filter(id_curso=obj).count()


class PeriodoSerializer(serializers.ModelSerializer):
    """Serializer para Periodo"""
    responsavel_nome = serializers.CharField(source='id_responsavel.nome_completo', read_only=True)
    
    class Meta:
        model = Periodo
        fields = ['id_periodo', 'periodo', 'id_responsavel', 'responsavel_nome']
        read_only_fields = ['id_periodo']


class TurmaSerializer(serializers.ModelSerializer):
    """Serializer para Turma"""
    sala_numero = serializers.IntegerField(source='id_sala.numero_sala', read_only=True)
    curso_nome = serializers.CharField(source='id_curso.nome_curso', read_only=True)
    classe_nivel = serializers.IntegerField(source='id_classe.nivel', read_only=True)
    classe_nome = serializers.CharField(source='id_classe.__str__', read_only=True)
    periodo_nome = serializers.CharField(source='id_periodo.periodo', read_only=True)
    responsavel_nome = serializers.CharField(source='id_responsavel.nome_completo', read_only=True)
    ano_lectivo_nome = serializers.CharField(source='ano_lectivo.nome', read_only=True)
    sala_capacidade = serializers.IntegerField(source='id_sala.capacidade_alunos', read_only=True)
    total_alunos = serializers.SerializerMethodField()
    
    class Meta:
        model = Turma
        fields = [
            'id_turma', 'codigo_turma', 'id_sala', 'sala_numero', 'sala_capacidade',
            'id_curso', 'curso_nome', 'id_classe', 'classe_nivel', 'classe_nome',
            'id_periodo', 'periodo_nome', 'ano', 'ano_lectivo', 'ano_lectivo_nome', 'status', 'id_responsavel',
            'responsavel_nome', 'total_alunos', 'criado_em', 'atualizado_em'
        ]
        read_only_fields = ['id_turma', 'codigo_turma', 'criado_em', 'atualizado_em']
        
    def get_total_alunos(self, obj):
        from apis.models import Aluno
        return Aluno.objects.filter(id_turma=obj, status_aluno='Activo').count()


class TurmaListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagem de Turmas"""
    sala_numero = serializers.IntegerField(source='id_sala.numero_sala', read_only=True)
    curso_nome = serializers.CharField(source='id_curso.nome_curso', read_only=True)
    classe_nivel = serializers.IntegerField(source='id_classe.nivel', read_only=True)
    classe_nome = serializers.CharField(source='id_classe.__str__', read_only=True)
    periodo_nome = serializers.CharField(source='id_periodo.periodo', read_only=True)
    responsavel_nome = serializers.CharField(source='id_responsavel.nome_completo', read_only=True)
    ano_lectivo_nome = serializers.CharField(source='ano_lectivo.nome', read_only=True)
    sala_capacidade = serializers.IntegerField(source='id_sala.capacidade_alunos', read_only=True)
    total_alunos = serializers.SerializerMethodField()
    
    class Meta:
        model = Turma
        fields = [
            'id_turma', 'codigo_turma', 'id_sala', 'sala_numero', 'sala_capacidade',
            'id_curso', 'curso_nome', 'id_classe', 'classe_nivel', 'classe_nome',
            'id_periodo', 'periodo_nome', 'status', 'ano', 'ano_lectivo', 'ano_lectivo_nome',
            'total_alunos', 'responsavel_nome'
        ]
        
    def get_total_alunos(self, obj):
        from apis.models import Aluno
        return Aluno.objects.filter(id_turma=obj, status_aluno='Activo').count()
