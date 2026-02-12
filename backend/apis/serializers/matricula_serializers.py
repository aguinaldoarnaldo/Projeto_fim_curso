from rest_framework import serializers
from django.db import transaction
from apis.models import Matricula, Aluno, Candidato

class MatriculaSerializer(serializers.ModelSerializer):
    """Serializer para Matricula"""
    aluno_nome = serializers.CharField(source='id_aluno.nome_completo', read_only=True)
    aluno_foto = serializers.SerializerMethodField()
    
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
    encarregado_bi = serializers.SerializerMethodField()
    encarregado_profissao = serializers.SerializerMethodField()

    # Aluno address and personal fields
    nacionalidade = serializers.CharField(source='id_aluno.nacionalidade', read_only=True, default='Angolana')
    naturalidade = serializers.CharField(source='id_aluno.naturalidade', read_only=True, default='')
    deficiencia = serializers.CharField(source='id_aluno.deficiencia', read_only=True, default='Não')
    provincia_residencia = serializers.CharField(source='id_aluno.provincia_residencia', read_only=True, default='')
    municipio_residencia = serializers.CharField(source='id_aluno.municipio_residencia', read_only=True, default='')
    bairro_residencia = serializers.CharField(source='id_aluno.bairro_residencia', read_only=True, default='')
    numero_casa = serializers.CharField(source='id_aluno.numero_casa', read_only=True, default='')

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
            'encarregado_bi', 'encarregado_profissao',
            'nacionalidade', 'naturalidade', 'deficiencia',
            'provincia_residencia', 'municipio_residencia', 'bairro_residencia', 'numero_casa',
            'id_turma', 'turma_codigo', 
            'ano_lectivo', 'ano_lectivo_nome',
            'classe_nome',
            'curso_nome',
            'sala_numero',
            'periodo_nome',
            'data_matricula', 'ativo',
            'tipo', 'status', 'doc_bi', 'doc_certificado'
        ]
        read_only_fields = ['id_matricula', 'data_matricula']
        extra_kwargs = {
            'id_aluno': {'required': False}
        }
    
    # ... create method ...

    def get_aluno_foto(self, obj):
        if obj.id_aluno and obj.id_aluno.img_path:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.id_aluno.img_path.url)
            return obj.id_aluno.img_path.url
        
        # Fallback para foto do candidato
        if obj.id_aluno:
            candidato = Candidato.objects.filter(numero_bi=obj.id_aluno.numero_bi).first()
            if candidato and candidato.foto_passe:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(candidato.foto_passe.url)
                return candidato.foto_passe.url
        return None

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
        if rel and rel.id_encarregado and rel.id_encarregado.telefone:
            tels = rel.id_encarregado.telefone
            if isinstance(tels, list) and len(tels) > 0:
                return tels[0]
            return str(tels)
        return 'N/A'

    def get_encarregado_parentesco(self, obj):
        rel = self._get_encarregado_relation(obj)
        return rel.grau_parentesco if rel else 'N/A'

    def get_encarregado_bi(self, obj):
        rel = self._get_encarregado_relation(obj)
        return rel.id_encarregado.numero_bi if rel and rel.id_encarregado else ''

    def get_encarregado_profissao(self, obj):
        rel = self._get_encarregado_relation(obj)
        return rel.id_encarregado.profissao if rel and rel.id_encarregado else ''

    def validate(self, attrs):
        """
        Validar presença obrigatória de documentos (BI e Certificado).
        Regra:
        1. Se enviados no request -> OK.
        2. Se não enviados:
           a) Se for matricula via Candidato: verificar se o Candidato tem os docs.
           b) Se for matricula via Aluno já existente: verificar se tem matriculas anteriores com docs.
        """
        doc_bi = attrs.get('doc_bi')
        doc_certificado = attrs.get('doc_certificado')
        
        # Se ambos enviados, ok
        if doc_bi and doc_certificado:
            return attrs

        # Verificar contexto (Candidato ou Aluno)
        candidato_id = attrs.get('id_candidato') or (self.initial_data.get('id_candidato'))
        aluno = attrs.get('id_aluno')

        has_bi = bool(doc_bi)
        has_cert = bool(doc_certificado)

        # Caso 1: Via Candidato
        if candidato_id:
            try:
                candidato = Candidato.objects.get(pk=candidato_id)
                if not has_bi and candidato.comprovativo_bi:
                    has_bi = True
                if not has_cert and candidato.certificado:
                    has_cert = True
            except Candidato.DoesNotExist:
                pass
        
        # Caso 2: Via Aluno (Histórico)
        elif aluno:
            # Buscar último registro com docs
            last_mat = Matricula.objects.filter(id_aluno=aluno).exclude(
                doc_bi='', doc_certificado=''
            ).order_by('-data_matricula').first()
            
            if last_mat:
                if not has_bi and last_mat.doc_bi:
                    has_bi = True
                if not has_cert and last_mat.doc_certificado:
                    has_cert = True
        
        # Validação Final
        errors = {}
        if not has_bi:
            errors['doc_bi'] = "O documento de identificação (BI) é obrigatório."
        
        if not has_cert:
            errors['doc_certificado'] = "O certificado de habilitações é obrigatório."
            
        if errors:
            raise serializers.ValidationError(errors)
            
        return attrs

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
                        # criar aluno com TODOS os dados
                        aluno = Aluno.objects.create(
                            nome_completo=candidato.nome_completo,
                            numero_bi=candidato.numero_bi,
                            email=candidato.email,
                            telefone=candidato.telefone,
                            genero=candidato.genero,
                            data_nascimento=candidato.data_nascimento,
                            provincia_residencia=candidato.residencia, # Ajuste conforme lógica de endereço
                            municipio_residencia=candidato.municipio_escola,
                            bairro_residencia=candidato.residencia,
                            nacionalidade=candidato.nacionalidade,
                            escola_anterior=candidato.escola_proveniencia,
                            img_path=candidato.foto_passe,
                            id_turma=validated_data.get('id_turma'),
                            status_aluno='Activo'
                        )
                        
                        # Criar Encarregado e Vínculo
                        from apis.models import Encarregado, AlunoEncarregado
                        
                        enc = Encarregado.objects.create(
                            nome_completo=candidato.nome_encarregado,
                            telefone=[candidato.telefone_encarregado], # Store as list/JSON
                            email=candidato.email_encarregado,
                            # Adicionar BI do encarregado se houver campo no modelo Encarregado (se nao houver, adicionar como observação ou criar campo)
                            # Assumindo que Encarregado não tem campo BI explícito no modelo atual mostrado (tem numero_casa, etc)
                            # Se tiver BI no modelo Encarregado, adicione aqui.
                        )
                        
                        AlunoEncarregado.objects.create(
                            id_aluno=aluno,
                            id_encarregado=enc,
                            grau_parentesco=candidato.parentesco_encarregado,
                            principal=True
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
