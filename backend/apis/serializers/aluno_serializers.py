from rest_framework import serializers
from ..models import Aluno, AlunoEncarregado, Matricula


class AlunoSerializer(serializers.ModelSerializer):
    """Serializer para Aluno"""
    turma_codigo = serializers.CharField(source='id_turma.codigo_turma', read_only=True)
    
    numero_matricula = serializers.SerializerMethodField()
    
    class Meta:
        model = Aluno
        fields = [
            'id_aluno', 'numero_bi', 'nome_completo', 'email', 'numero_matricula',
            'telefone', 'provincia_residencia', 'municipio_residencia',
            'bairro_residencia', 'numero_casa', 'senha_hash', 'genero', 'data_nascimento',
            'nacionalidade', 'naturalidade', 'deficiencia',
            'status_aluno', 'modo_user', 'id_turma', 'turma_codigo',
            'img_path', 'is_online', 'criado_em', 'atualizado_em'
        ]
        read_only_fields = ['id_aluno', 'criado_em', 'atualizado_em']
        extra_kwargs = {
            'senha_hash': {'write_only': True, 'required': False},
            'email': {'required': False, 'allow_blank': True, 'allow_null': True},
            'telefone': {'required': False, 'allow_blank': True},
            'naturalidade': {'required': False, 'allow_blank': True, 'allow_null': True},
            'nacionalidade': {'required': False, 'allow_blank': True},
            'deficiencia': {'required': False},
            'id_turma': {'required': False, 'allow_null': True},
            'provincia_residencia': {'required': False, 'allow_blank': True, 'allow_null': True},
            'municipio_residencia': {'required': False, 'allow_blank': True, 'allow_null': True},
            'bairro_residencia': {'required': False, 'allow_blank': True, 'allow_null': True},
            'numero_casa': {'required': False, 'allow_blank': True, 'allow_null': True},
        }
    
    def get_numero_matricula(self, obj):
        last_mat = obj.matricula_set.order_by('-data_matricula', '-id_matricula').first()
        return last_mat.numero_matricula if last_mat else None


class AlunoListSerializer(serializers.ModelSerializer):
    """
    Serializer para listagem de Alunos.
    Inclui todos os campos necessários para a tabela E para o modal de detalhes.
    O único campo excluído é sugerido_tipo_matricula (muito lento na lista grande).
    """
    turma_codigo = serializers.SerializerMethodField()
    sala_numero = serializers.SerializerMethodField()
    curso_nome = serializers.SerializerMethodField()
    classe_nivel = serializers.SerializerMethodField()
    periodo_nome = serializers.SerializerMethodField()
    numero_matricula = serializers.SerializerMethodField()
    ano_lectivo = serializers.SerializerMethodField()
    ano_lectivo_ativo = serializers.SerializerMethodField()
    img_path = serializers.SerializerMethodField()
    encarregado_principal = serializers.SerializerMethodField()
    matriculas_detalhes = serializers.SerializerMethodField()
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
            'bairro_residencia', 'numero_casa',
            'data_nascimento', 'nacionalidade', 'naturalidade', 'deficiencia',
            'criado_em', 'encarregado_principal', 'matriculas_detalhes', 'historico_escolar',
            'ano_lectivo', 'ano_lectivo_ativo',
        ]

    def _get_latest_matricula(self, obj):
        # Usar dados pré-carregados pelo ViewSet para evitar N+1
        if hasattr(obj, 'prefetched_matriculas'):
            return obj.prefetched_matriculas[0] if obj.prefetched_matriculas else None
            
        if not hasattr(obj, '_latest_matricula'):
            # Fallback caso não tenha sido feito prefetch (ex: num retrieve isolado)
            obj._latest_matricula = obj.matricula_set.order_by('-data_matricula', '-id_matricula').first()
        return obj._latest_matricula

    def get_numero_matricula(self, obj):
        mat = self._get_latest_matricula(obj)
        return mat.numero_matricula if mat else None
    
    def get_turma_codigo(self, obj):
        mat = self._get_latest_matricula(obj)
        if mat and mat.id_turma:
            return mat.id_turma.codigo_turma
        return obj.id_turma.codigo_turma if obj.id_turma else None

    def get_sala_numero(self, obj):
        mat = self._get_latest_matricula(obj)
        if mat and mat.id_turma and mat.id_turma.id_sala:
            return mat.id_turma.id_sala.numero_sala
        return obj.id_turma.id_sala.numero_sala if obj.id_turma and obj.id_turma.id_sala else None

    def get_curso_nome(self, obj):
        mat = self._get_latest_matricula(obj)
        if mat and mat.id_turma and mat.id_turma.id_curso:
            return mat.id_turma.id_curso.nome_curso
        return obj.id_turma.id_curso.nome_curso if obj.id_turma and obj.id_turma.id_curso else None

    def get_classe_nivel(self, obj):
        mat = self._get_latest_matricula(obj)
        if mat and mat.id_turma and mat.id_turma.id_classe:
            return mat.id_turma.id_classe.nivel
        return obj.id_turma.id_classe.nivel if obj.id_turma and obj.id_turma.id_classe else None

    def get_periodo_nome(self, obj):
        mat = self._get_latest_matricula(obj)
        if mat and mat.id_turma and mat.id_turma.id_periodo:
            return mat.id_turma.id_periodo.periodo
        return obj.id_turma.id_periodo.periodo if obj.id_turma and obj.id_turma.id_periodo else None

    def get_ano_lectivo(self, obj):
        mat = self._get_latest_matricula(obj)
        if mat and mat.ano_lectivo:
            return mat.ano_lectivo.nome
        if obj.id_turma and obj.id_turma.ano_lectivo:
            return obj.id_turma.ano_lectivo.nome
        return 'N/A'

    def get_ano_lectivo_ativo(self, obj):
        mat = self._get_latest_matricula(obj)
        if mat and mat.ano_lectivo:
            return mat.ano_lectivo.activo
        if obj.id_turma and obj.id_turma.ano_lectivo:
            return obj.id_turma.ano_lectivo.activo
        return None

    def get_img_path(self, obj):
        if obj.img_path:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.img_path.url)
            return obj.img_path.url
        return None

    def get_encarregado_principal(self, obj):
        # Usar dados pré-carregados
        if hasattr(obj, 'prefetched_encarregados'):
            first = obj.prefetched_encarregados[0] if obj.prefetched_encarregados else None
        else:
            first = obj.alunoencarregado_set.select_related('id_encarregado').first()

        if first and first.id_encarregado:
            e = first.id_encarregado
            # Handle phone list vs string
            telefone = e.telefone
            tel_str = ''
            if isinstance(telefone, list):
                tel_str = telefone[0] if telefone else ''
            elif isinstance(telefone, str):
                tel_str = telefone
                
            return {
                'id_encarregado': e.id_encarregado,
                'nome_completo': e.nome_completo,
                'telefone': tel_str,
                'email': e.email or '',
                'numero_bi': e.numero_bi or '',
                'profissao': e.profissao or '',
                'grau_parentesco': first.grau_parentesco or '',
            }
        return None

    def get_matriculas_detalhes(self, obj):
        if hasattr(obj, 'prefetched_matriculas'):
            matriculas = obj.prefetched_matriculas
        else:
            matriculas = list(obj.matricula_set.all().select_related('ano_lectivo', 'id_turma'))

        return MatriculaHistorySerializer(matriculas[:5], many=True).data # Limitar a 5 na lista por segurança




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
            'tipo', 'status', 'data_matricula', 'numero_matricula'
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
    numero_matricula = serializers.SerializerMethodField()
    
    class Meta:
        model = Aluno
        fields = [
            'id_aluno', 'numero_bi', 'nome_completo', 'email', 'numero_matricula',
            'telefone', 'provincia_residencia', 'municipio_residencia',
            'bairro_residencia', 'numero_casa', 'genero', 'data_nascimento', 'status_aluno',
            'nacionalidade', 'naturalidade', 'deficiencia',
            'modo_user', 'id_turma', 'turma_codigo', 'img_path', 'is_online',
            'encarregados', 'historico_escolar', 'matriculas_detalhes', 
            'criado_em', 'atualizado_em', 'ano_lectivo_ativo'
        ]

    def get_numero_matricula(self, obj):
        last_mat = obj.matricula_set.order_by('-data_matricula', '-id_matricula').first()
        return last_mat.numero_matricula if last_mat else None

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
        from ..models import Candidato
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
            # Handle phone list vs string
            telefone = e.telefone
            tel_str = ''
            if isinstance(telefone, list):
                tel_str = telefone[0] if telefone else ''
            elif isinstance(telefone, str):
                tel_str = telefone

            data.append({
                'id_encarregado': e.id_encarregado,
                'nome_completo': e.nome_completo,
                'email': e.email or '',
                'telefone': tel_str,
                'numero_bi': e.numero_bi or '',
                'profissao': e.profissao or '',
                'grau_parentesco': ae.grau_parentesco or ''
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
