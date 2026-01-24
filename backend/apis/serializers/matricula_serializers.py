from rest_framework import serializers
from django.db import transaction
from apis.models import Matricula, Aluno, Candidato

class MatriculaSerializer(serializers.ModelSerializer):
    """Serializer para Matricula"""
    aluno_nome = serializers.CharField(source='id_aluno.nome_completo', read_only=True)
    aluno_foto = serializers.ImageField(source='id_aluno.img_path', read_only=True)
    
    # Campo opcional para matricular via candidato
    id_candidato = serializers.IntegerField(write_only=True, required=False)
    
    # Detail fields
    bi = serializers.SerializerMethodField()
    genero = serializers.SerializerMethodField()
    data_nascimento = serializers.SerializerMethodField()
    telefone = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    endereco = serializers.SerializerMethodField()
    
    # Encarregado details - Assuming first one found
    encarregado_nome = serializers.SerializerMethodField()
    encarregado_telefone = serializers.SerializerMethodField()
    encarregado_parentesco = serializers.SerializerMethodField()

    # Safe fields using methods to handle null Turma
    turma_codigo = serializers.SerializerMethodField()
    ano_lectivo_nome = serializers.SerializerMethodField()
    classe_nome = serializers.SerializerMethodField()
    curso_nome = serializers.SerializerMethodField()
    sala_numero = serializers.SerializerMethodField()
    periodo_nome = serializers.SerializerMethodField()

    class Meta:
        model = Matricula
        fields = [
            'id_matricula', 
            'id_aluno', 'aluno_nome', 'aluno_foto',
            'id_candidato', # Campo write-only
            'bi', 'genero', 'data_nascimento', 'telefone', 'email', 'endereco',
            'encarregado_nome', 'encarregado_telefone', 'encarregado_parentesco',
            'id_turma', 'turma_codigo', 
            'ano_lectivo', 'ano_lectivo_nome',
            'classe_nome',
            'curso_nome',
            'sala_numero',
            'periodo_nome',
            'data_matricula', 'ativo'
        ]
        read_only_fields = ['id_matricula', 'data_matricula']
        extra_kwargs = {
            'id_aluno': {'required': False}
        }
    
    # ... create method ...

    def get_bi(self, obj):
        return obj.id_aluno.numero_bi if obj.id_aluno else 'N/A'

    def get_genero(self, obj):
        return obj.id_aluno.get_genero_display() if obj.id_aluno and obj.id_aluno.genero else 'N/A'
    
    def get_data_nascimento(self, obj):
        # Checking if data_nascimento exists on Aluno
        return obj.id_aluno.data_nascimento if obj.id_aluno and hasattr(obj.id_aluno, 'data_nascimento') else 'N/A'

    def get_telefone(self, obj):
        return obj.id_aluno.telefone if obj.id_aluno else 'N/A'

    def get_email(self, obj):
        return obj.id_aluno.email if obj.id_aluno else 'N/A'

    def get_endereco(self, obj):
        if not obj.id_aluno: return 'N/A'
        return f"{obj.id_aluno.municipio_residencia or ''} {obj.id_aluno.bairro_residencia or ''}".strip() or 'N/A'

    def _get_encarregado_relation(self, obj):
        if not hasattr(self, '_encarregado_cache'):
            self._encarregado_cache = {}
        if obj.id_matricula not in self._encarregado_cache:
            if obj.id_aluno:
                rel = obj.id_aluno.alunoencarregado_set.first() 
                self._encarregado_cache[obj.id_matricula] = rel
            else:
                 self._encarregado_cache[obj.id_matricula] = None
        return self._encarregado_cache[obj.id_matricula]

    def get_encarregado_nome(self, obj):
        rel = self._get_encarregado_relation(obj)
        return rel.id_encarregado.nome_completo if rel and rel.id_encarregado else 'N/A'

    def get_encarregado_telefone(self, obj):
        rel = self._get_encarregado_relation(obj)
        return rel.id_encarregado.telefone if rel and rel.id_encarregado else 'N/A'

    def get_encarregado_parentesco(self, obj):
        rel = self._get_encarregado_relation(obj)
        return rel.grau_parentesco if rel else 'N/A'

    def create(self, validated_data):
        candidato_id = validated_data.pop('id_candidato', None)
        aluno = validated_data.get('id_aluno')

        if candidato_id and not aluno:
            try:
                candidato = Candidato.objects.get(pk=candidato_id)
                existing_aluno = Aluno.objects.filter(numero_bi=candidato.numero_bi).first()
                if not existing_aluno and candidato.email:
                     existing_aluno = Aluno.objects.filter(email=candidato.email).first()

                if existing_aluno:
                    aluno = existing_aluno
                else:
                    with transaction.atomic():
                        aluno = Aluno.objects.create(
                            nome_completo=candidato.nome_completo,
                            numero_bi=candidato.numero_bi,
                            email=candidato.email,
                            telefone=candidato.telefone,
                            genero=candidato.genero,
                            bairro_residencia=candidato.residencia,
                            municipio_residencia=candidato.municipio_escola,
                            id_turma=validated_data.get('id_turma'),
                            status_aluno='Activo'
                        )
                        candidato.status = 'Matriculado'
                        candidato.save()
            except Candidato.DoesNotExist:
                raise serializers.ValidationError({"id_candidato": "Candidato não encontrado."})

        if not aluno:
            raise serializers.ValidationError({"id_aluno": "É necessário informar um aluno ou um candidato válido."})

        validated_data['id_aluno'] = aluno
        return super().create(validated_data)

    def get_turma_codigo(self, obj):
        return obj.id_turma.codigo_turma if obj.id_turma else "Sem Turma"

    def get_ano_lectivo_nome(self, obj):
        if obj.ano_lectivo:
            return obj.ano_lectivo.nome
        return obj.id_turma.ano_lectivo.nome if obj.id_turma and obj.id_turma.ano_lectivo else (obj.id_turma.ano if obj.id_turma else "N/A")

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
