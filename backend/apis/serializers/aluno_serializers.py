from rest_framework import serializers
from apis.models import Aluno, AlunoEncarregado


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
    encarregado_principal = serializers.SerializerMethodField()
    sugerido_tipo_matricula = serializers.SerializerMethodField()
    from .historico_serializers import HistoricoEscolarSerializer
    historico_escolar = HistoricoEscolarSerializer(many=True, read_only=True)
    
    class Meta:
        model = Aluno
        fields = [
            'id_aluno', 'nome_completo', 'numero_matricula',
            'email', 'turma_codigo', 'status_aluno', 'genero',
            'sala_numero', 'curso_nome', 'classe_nivel', 'periodo_nome',
            'numero_bi', 'telefone', 'img_path', 
            'municipio_residencia', 'provincia_residencia',
            'data_nascimento', 'criado_em', 'encarregado_principal',
            'sugerido_tipo_matricula', 'historico_escolar'
        ]

    def get_encarregado_principal(self, obj):
        # Return first guardian name found
        first = obj.alunoencarregado_set.first()
        if first:            
            return first.id_encarregado.nome_completo
        return 'N/A'

    def get_sugerido_tipo_matricula(self, obj):
        from apis.services.academic_service import AcademicService
        return AcademicService.determinar_tipo_matricula(obj.id_aluno)


class AlunoDetailSerializer(serializers.ModelSerializer):
    """Serializer detalhado para Aluno com encarregados"""
    from .usuario_serializers import EncarregadoListSerializer
    from .historico_serializers import HistoricoEscolarSerializer
    
    turma_codigo = serializers.CharField(source='id_turma.codigo_turma', read_only=True)
    encarregados = serializers.SerializerMethodField()
    historico_escolar = HistoricoEscolarSerializer(many=True, read_only=True)
    
    class Meta:
        model = Aluno
        fields = [
            'id_aluno', 'numero_bi', 'nome_completo', 'email', 'numero_matricula',
            'telefone', 'provincia_residencia', 'municipio_residencia',
            'bairro_residencia', 'numero_casa', 'genero', 'data_nascimento', 'status_aluno',
            'modo_user', 'id_turma', 'turma_codigo', 'img_path', 'is_online',
            'encarregados', 'historico_escolar', 'criado_em', 'atualizado_em'
        ]
    
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
