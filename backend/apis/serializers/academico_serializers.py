from rest_framework import serializers
from apis.models import (
    Sala, Classe, Departamento, Seccao, AreaFormacao,
    Curso, Periodo, Turma, AnoLectivo, VagaCurso
)


class AnoLectivoSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnoLectivo
        fields = [
            'id_ano', 'nome', 'data_inicio', 'data_fim', 'status', 'activo',
            'inicio_inscricoes', 'fim_inscricoes', 'inicio_matriculas', 'fim_matriculas',
            'data_exame_admissao', 'data_teste_diagnostico',
            'hora_fechamento', 'fecho_automatico_inscricoes'
        ]



class SalaSerializer(serializers.ModelSerializer):
    """Serializer para Sala"""
    total_alunos = serializers.SerializerMethodField()
    ocupacao_detalhada = serializers.SerializerMethodField()
    
    class Meta:
        model = Sala
        fields = ['id_sala', 'numero_sala', 'capacidade_alunos', 'bloco', 'total_alunos', 'ocupacao_detalhada', 'criado_em', 'atualizado_em']
        read_only_fields = ['id_sala', 'criado_em', 'atualizado_em']
        
    def get_total_alunos(self, obj):
        # Counts students linked to turmas in this room (Total Headcount) for the active/specific year
        from apis.models import Aluno, AnoLectivo
        
        # 1. Tentar obter ano do contexto (query params)
        request = self.context.get('request')
        ano_id = request.query_params.get('ano_lectivo') if request else None
        
        if ano_id:
            return Aluno.objects.filter(id_turma__id_sala=obj, id_turma__ano_lectivo_id=ano_id, status_aluno__in=['Ativo', 'Activo']).count()
        
        # 2. Fallback para o ano activo
        active_year = AnoLectivo.get_active_year()
        if active_year:
            return Aluno.objects.filter(id_turma__id_sala=obj, id_turma__ano_lectivo=active_year, status_aluno__in=['Ativo', 'Activo']).count()
            
        return 0

    def get_ocupacao_detalhada(self, obj):
        from apis.models import Aluno, AnoLectivo
        from django.db.models import Count

        # 1. Tentar obter ano do contexto
        request = self.context.get('request')
        ano_id = request.query_params.get('ano_lectivo') if request else None
        
        base_query = Aluno.objects.filter(id_turma__id_sala=obj, status_aluno__in=['Ativo', 'Activo'])
        
        if ano_id:
            base_query = base_query.filter(id_turma__ano_lectivo_id=ano_id)
        else:
            active_year = AnoLectivo.get_active_year()
            if active_year:
                base_query = base_query.filter(id_turma__ano_lectivo=active_year)
            else:
                return {}
        
        # Group active students by Periodo (Morning, Afternoon, etc.)
        stats = base_query.values('id_turma__id_periodo__periodo').annotate(total=Count('id_aluno'))
        
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
    vagas_totais = serializers.SerializerMethodField()
    vagas_disponiveis = serializers.SerializerMethodField()
    
    class Meta:
        model = Curso
        fields = [
            'id_curso', 'nome_curso', 'id_area_formacao', 'area_formacao_nome', 
            'duracao', 'id_responsavel', 'responsavel_nome', 'total_turmas',
            'vagas_totais', 'vagas_disponiveis'
        ]

    def get_area_formacao_nome(self, obj):
        return obj.id_area_formacao.nome_area if obj.id_area_formacao else "N/A"

    def get_responsavel_nome(self, obj):
        return obj.id_responsavel.nome_completo if obj.id_responsavel else "Sem Coordenador"

    def get_total_turmas(self, obj):
        from apis.models import Turma
        return Turma.objects.filter(id_curso=obj).count()

    def get_vagas_totais(self, obj):
        from apis.models import VagaCurso, AnoLectivo
        active_year = AnoLectivo.get_active_year()
        if active_year:
            vaga_reg = VagaCurso.objects.filter(id_curso=obj, ano_lectivo=active_year).first()
            if vaga_reg:
                return vaga_reg.vagas
        return 0

    def get_vagas_disponiveis(self, obj):
        from apis.models import AnoLectivo, VagaCurso
        from apis.models.matriculas import Matricula
        active_year = AnoLectivo.get_active_year()
        if not active_year:
            return 0
        
        # Obter vagas totais para este ano
        vaga_reg = VagaCurso.objects.filter(id_curso=obj, ano_lectivo=active_year).first()
        vagas_totais = vaga_reg.vagas if vaga_reg else 0
        
        # Contar matrículas ativas (vagas definitivamente ocupadas)
        status_ativos = ['Ativa', 'Concluida']
        matriculados = Matricula.objects.filter(
            id_turma__id_curso=obj,
            ano_lectivo=active_year,
            status__in=status_ativos
        ).count()
        
        disponiveis = vagas_totais - matriculados
        return max(0, disponiveis)


class PeriodoSerializer(serializers.ModelSerializer):
    """Serializer para Periodo"""
    responsavel_nome = serializers.CharField(source='id_responsavel.nome_completo', read_only=True)
    
    class Meta:
        model = Periodo
        fields = ['id_periodo', 'periodo', 'id_responsavel', 'responsavel_nome']
        read_only_fields = ['id_periodo']


class TurmaSerializer(serializers.ModelSerializer):
    """Serializer para Turma"""
    ano_lectivo_ativo = serializers.SerializerMethodField()
    sala_numero = serializers.IntegerField(source='id_sala.numero_sala', read_only=True)
    curso_nome = serializers.CharField(source='id_curso.nome_curso', read_only=True)
    classe_nivel = serializers.IntegerField(source='id_classe.nivel', read_only=True)
    classe_nome = serializers.CharField(source='id_classe.__str__', read_only=True)
    periodo_nome = serializers.CharField(source='id_periodo.periodo', read_only=True)
    responsavel_nome = serializers.CharField(source='id_responsavel.nome_completo', read_only=True)
    ano_lectivo_nome = serializers.CharField(source='ano_lectivo.nome', read_only=True)
    sala_capacidade = serializers.IntegerField(source='id_sala.capacidade_alunos', read_only=True)
    capacidade = serializers.IntegerField(required=False, default=55)
    total_alunos = serializers.SerializerMethodField()
    
    class Meta:
        model = Turma
        fields = [
            'id_turma', 'codigo_turma', 'id_sala', 'sala_numero', 'sala_capacidade',
            'id_curso', 'curso_nome', 'id_classe', 'classe_nivel', 'classe_nome',
            'id_periodo', 'periodo_nome', 'ano', 'ano_lectivo', 'ano_lectivo_nome', 'status', 'id_responsavel',
            'responsavel_nome', 'total_alunos', 'capacidade', 'criado_em', 'atualizado_em', 'ano_lectivo_ativo'
        ]
        read_only_fields = ['id_turma', 'codigo_turma', 'criado_em', 'atualizado_em']
        
    def get_ano_lectivo_ativo(self, obj):
        return obj.ano_lectivo.activo if obj.ano_lectivo else False
        
    def get_total_alunos(self, obj):
        from apis.models import Aluno
        return Aluno.objects.filter(id_turma=obj, status_aluno__in=['Ativo', 'Activo']).count()

    def validate(self, data):
        """Validação personalizada para Turmas"""
        id_sala = data.get('id_sala')
        capacidade = data.get('capacidade')

        # Se for um UPDATE (PATCH/PUT), buscar valores existentes se não enviados
        if self.instance:
            id_sala = id_sala or self.instance.id_sala
            capacidade = capacidade if capacidade is not None else self.instance.capacidade

        if id_sala and capacidade:
            if capacidade > id_sala.capacidade_alunos:
                raise serializers.ValidationError({
                    'capacidade': f"Lotação Excessiva: A Sala {id_sala.numero_sala} só suporta {id_sala.capacidade_alunos} alunos, mas está a tentar definir uma capacidade de {capacidade}. Por favor, reduza a lotação da turma ou selecione uma sala maior."
                })
        
        return data


class TurmaListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagem de Turmas"""
    ano_lectivo_ativo = serializers.SerializerMethodField()
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
            'total_alunos', 'responsavel_nome', 'capacidade', 'ano_lectivo_ativo'
        ]
        
    def get_ano_lectivo_ativo(self, obj):
        return obj.ano_lectivo.activo if obj.ano_lectivo else False
        
    def get_total_alunos(self, obj):
        from apis.models import Aluno
        return Aluno.objects.filter(id_turma=obj, status_aluno__in=['Ativo', 'Activo']).count()


class VagaCursoSerializer(serializers.ModelSerializer):
    """Serializer para Gestão de Vagas por Curso"""
    curso_nome = serializers.CharField(source='id_curso.nome_curso', read_only=True)
    ano_lectivo_nome = serializers.CharField(source='ano_lectivo.nome', read_only=True)
    ano_lectivo_status = serializers.CharField(source='ano_lectivo.status', read_only=True)
    vagas_preenchidas = serializers.SerializerMethodField()
    vagas_disponiveis = serializers.SerializerMethodField()

    class Meta:
        model = VagaCurso
        fields = [
            'id', 'id_curso', 'curso_nome', 'ano_lectivo', 'ano_lectivo_nome', 'ano_lectivo_status',
            'vagas', 'vagas_preenchidas', 'vagas_disponiveis'
        ]
        read_only_fields = ['id']

    def get_vagas_preenchidas(self, obj):
        from apis.models.matriculas import Matricula
        # Contamos as matrículas ativas para este curso e ano lectivo
        # Matriculas que NÃO contam como ocupadas: Desistente, Transferido
        status_ativos = ['Ativa', 'Concluida']
        return Matricula.objects.filter(
            id_turma__id_curso=obj.id_curso,
            ano_lectivo=obj.ano_lectivo,
            status__in=status_ativos
        ).count()

    def get_vagas_disponiveis(self, obj):
        preenchidas = self.get_vagas_preenchidas(obj)
        return max(0, obj.vagas - preenchidas)
