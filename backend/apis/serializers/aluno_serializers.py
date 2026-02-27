from rest_framework import serializers
from apis.models import Aluno, AlunoEncarregado, Matricula


class AlunoSerializer(serializers.ModelSerializer):
    """Serializer para Aluno"""
    turma_codigo = serializers.CharField(source='id_turma.codigo_turma', read_only=True)
    
    class Meta:
        model = Aluno
        fields = [
            'id_aluno', 'numero_bi', 'nome_completo', 'email', 'numero_matricula',
            'telefone', 'provincia_residencia', 'municipio_residencia',
            'bairro_residencia', 'numero_casa', 'senha_hash', 'genero', 'data_nascimento',
            'status_aluno', 'modo_user', 'id_turma', 'turma_codigo',
            'img_path', 'is_online', 'criado_em', 'atualizado_em'
        ]
        read_only_fields = ['id_aluno', 'criado_em', 'atualizado_em']
        extra_kwargs = {
            'senha_hash': {'write_only': True}
        }


class AlunoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagem de Alunos"""
    turma_codigo = serializers.CharField(source='id_turma.codigo_turma', read_only=True)
    sala_numero = serializers.IntegerField(source='id_turma.id_sala.numero_sala', read_only=True)
    curso_nome = serializers.CharField(source='id_turma.id_curso.nome_curso', read_only=True)
    classe_nivel = serializers.IntegerField(source='id_turma.id_classe.nivel', read_only=True)
    periodo_nome = serializers.CharField(source='id_turma.id_periodo.periodo', read_only=True)
    img_path = serializers.SerializerMethodField()
    encarregado_principal = serializers.SerializerMethodField()
    sugerido_tipo_matricula = serializers.SerializerMethodField()
    from .historico_serializers import HistoricoEscolarSerializer
    historico_escolar = HistoricoEscolarSerializer(many=True, read_only=True)
    ano_lectivo = serializers.SerializerMethodField()
    ano_lectivo_ativo = serializers.SerializerMethodField()
    matriculas_detalhes = serializers.SerializerMethodField()
    
    class Meta:
        model = Aluno
        fields = [
            'id_aluno', 'nome_completo', 'numero_matricula',
            'email', 'turma_codigo', 'status_aluno', 'genero',
            'sala_numero', 'curso_nome', 'classe_nivel', 'periodo_nome',
            'numero_bi', 'telefone', 'img_path', 
            'municipio_residencia', 'provincia_residencia',
            'data_nascimento', 'criado_em', 'encarregado_principal',
            'sugerido_tipo_matricula', 'historico_escolar', 
            'matriculas_detalhes', 'ano_lectivo', 'ano_lectivo_ativo'
        ]

    def get_matriculas_detalhes(self, obj):
        matriculas = Matricula.objects.filter(id_aluno=obj).order_by('-ano_lectivo__nome', '-data_matricula')
        return MatriculaHistorySerializer(matriculas, many=True).data

    def get_ano_lectivo(self, obj):
        return obj.id_turma.ano_lectivo.nome if obj.id_turma and obj.id_turma.ano_lectivo else (obj.id_turma.ano if obj.id_turma else "N/A")

    def get_ano_lectivo_ativo(self, obj):
        return obj.id_turma.ano_lectivo.activo if obj.id_turma and obj.id_turma.ano_lectivo else False

    def get_img_path(self, obj):
        if obj.img_path:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.img_path.url)
            return obj.img_path.url
        
        # Fallback para foto do candidato
        from apis.models import Candidato
        candidato = Candidato.objects.filter(numero_bi=obj.numero_bi).first()
        if candidato and candidato.foto_passe:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(candidato.foto_passe.url)
            return candidato.foto_passe.url
        return None

    def get_encarregado_principal(self, obj):
        # Return first guardian name found
        first = obj.alunoencarregado_set.first()
        if first:            
            return first.id_encarregado.nome_completo
        return 'N/A'

    def get_sugerido_tipo_matricula(self, obj):
        from apis.services.academic_service import AcademicService
        return AcademicService.determinar_tipo_matricula(obj.id_aluno)


class MatriculaHistorySerializer(serializers.ModelSerializer):
    """Serializer simplificado para o histórico de matrículas do aluno"""
    ano_lectivo_nome = serializers.CharField(source='ano_lectivo.nome', read_only=True)
    turma_codigo = serializers.CharField(source='id_turma.codigo_turma', read_only=True)
    classe_nome = serializers.SerializerMethodField()
    curso_nome = serializers.CharField(source='id_turma.id_curso.nome_curso', read_only=True)
    periodo_nome = serializers.CharField(source='id_turma.id_periodo.periodo', read_only=True)
    sala_numero = serializers.CharField(source='id_turma.id_sala.numero_sala', read_only=True)
    
    class Meta:
        model = Matricula
        fields = [
            'id_matricula', 'ano_lectivo_nome', 'turma_codigo', 
            'classe_nome', 'curso_nome', 'periodo_nome', 'sala_numero',
            'tipo', 'status', 'data_matricula'
        ]

    def get_classe_nome(self, obj):
        if obj.id_turma and obj.id_turma.id_classe:
            return obj.id_turma.id_classe.descricao or f"{obj.id_turma.id_classe.nivel}ª Classe"
        return "N/A"


class AlunoDetailSerializer(serializers.ModelSerializer):
    """Serializer detalhado para Aluno com encarregados"""
    from .usuario_serializers import EncarregadoListSerializer
    from .historico_serializers import HistoricoEscolarSerializer
    
    turma_codigo = serializers.CharField(source='id_turma.codigo_turma', read_only=True)
    img_path = serializers.SerializerMethodField()
    ano_lectivo_ativo = serializers.SerializerMethodField()
    encarregados = serializers.SerializerMethodField()
    historico_escolar = HistoricoEscolarSerializer(many=True, read_only=True)
    matriculas_detalhes = serializers.SerializerMethodField()
    
    class Meta:
        model = Aluno
        fields = [
            'id_aluno', 'numero_bi', 'nome_completo', 'email', 'numero_matricula',
            'telefone', 'provincia_residencia', 'municipio_residencia',
            'bairro_residencia', 'numero_casa', 'genero', 'data_nascimento', 'status_aluno',
            'modo_user', 'id_turma', 'turma_codigo', 'img_path', 'is_online',
            'encarregados', 'historico_escolar', 'matriculas_detalhes', 
            'criado_em', 'atualizado_em', 'ano_lectivo_ativo'
        ]

    def get_matriculas_detalhes(self, obj):
        matriculas = Matricula.objects.filter(id_aluno=obj).order_by('-ano_lectivo__nome', '-data_matricula')
        return MatriculaHistorySerializer(matriculas, many=True).data

    def get_ano_lectivo_ativo(self, obj):
        return obj.id_turma.ano_lectivo.activo if obj.id_turma and obj.id_turma.ano_lectivo else False
    
    def get_img_path(self, obj):
        if obj.img_path:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.img_path.url)
            return obj.img_path.url
        from apis.models import Candidato
        candidato = Candidato.objects.filter(numero_bi=obj.numero_bi).first()
        if candidato and candidato.foto_passe:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(candidato.foto_passe.url)
            return candidato.foto_passe.url
        return None

    def get_encarregados(self, obj):
        aluno_encarregados = AlunoEncarregado.objects.filter(id_aluno=obj).select_related('id_encarregado')
        data = []
        for ae in aluno_encarregados:
            e = ae.id_encarregado
            data.append({
                'id_encarregado': e.id_encarregado,
                'nome_completo': e.nome_completo,
                'email': e.email,
                'telefone': e.telefone,
                'grau_parentesco': ae.grau_parentesco
            })
        return data


class AlunoEncarregadoSerializer(serializers.ModelSerializer):
    """Serializer para AlunoEncarregado"""
    aluno_nome = serializers.CharField(source='id_aluno.nome_completo', read_only=True)
    encarregado_nome = serializers.CharField(source='id_encarregado.nome_completo', read_only=True)
    
    class Meta:
        model = AlunoEncarregado
        fields = [
            'id_aluno_encarregado', 'id_aluno', 'aluno_nome',
            'id_encarregado', 'encarregado_nome', 'grau_parentesco'
        ]
        read_only_fields = ['id_aluno_encarregado']
