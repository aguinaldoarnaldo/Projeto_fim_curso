from rest_framework import serializers
from apis.models import Candidato, ExameAdmissao, RupeCandidato, Curso, ListaEspera

class CandidatoSerializer(serializers.ModelSerializer):
    curso1_nome = serializers.CharField(source='curso_primeira_opcao.nome_curso', read_only=True)
    curso2_nome = serializers.CharField(source='curso_segunda_opcao.nome_curso', read_only=True)
    ano_lectivo_nome = serializers.CharField(source='ano_lectivo.nome', read_only=True)
    nota_exame = serializers.SerializerMethodField()
    exame_data = serializers.SerializerMethodField()
    exame_sala = serializers.SerializerMethodField()
    rupe_historico = serializers.SerializerMethodField()
    
    
    class Meta:
        model = Candidato
        fields = '__all__'
        read_only_fields = ['id_candidato', 'numero_inscricao', 'criado_em', 'atualizado_em']

    def update(self, instance, validated_data):
        # Handle nota_exame manually from initial_data since it's a MethodField (read-only) by default
        if 'nota_exame' in self.initial_data:
            nota = self.initial_data['nota_exame']
            if nota is not None and nota != "":
                try:
                    from apis.models import ExameAdmissao
                    exame, _ = ExameAdmissao.objects.get_or_create(candidato=instance)
                    exame.nota = nota
                    exame.realizado = True
                    exame.save()
                except Exception as e:
                    print(f"Error updating exam grade: {e}")

        return super().update(instance, validated_data)

    
    def get_nota_exame(self, obj):
        if hasattr(obj, 'exame'):
            return obj.exame.nota
        return None

    def get_exame_data(self, obj):
        # Ocultar data do exame se as candidaturas ainda estiverem abertas (prazo não atingido)
        from apis.models import Configuracao
        from django.utils import timezone
        config = Configuracao.get_solo()
        
        if config.data_fim_candidatura and timezone.now() < config.data_fim_candidatura:
            return None

        if hasattr(obj, 'exame'):
            return obj.exame.data_exame
        return None
    
    # Adicionar info do RUPE
    rupe_info = serializers.SerializerMethodField()
    def get_rupe_info(self, obj):
        rupe = obj.rupes.last() # assumindo related_name='rupes' ou padrao
        # Se nao tiver related_name, usar RupeCandidato.objects.filter... mas é menos eficiente
        # Vamos usar o reverse lookup padrao se existir, ou filter
        from apis.models import RupeCandidato
        rupe = RupeCandidato.objects.filter(candidato=obj).last()
        if rupe:
            return {
                'referencia': rupe.referencia,
                'status': rupe.status,
                'valor': rupe.valor
            }
        return None

    def get_exame_sala(self, obj):
        # Ocultar sala do exame se as candidaturas ainda estiverem abertas
        from apis.models import Configuracao
        from django.utils import timezone
        config = Configuracao.get_solo()
        
        if config.data_fim_candidatura and timezone.now() < config.data_fim_candidatura:
            return "Disponível após o fim das inscrições"

        if hasattr(obj, 'exame') and obj.exame.sala:
            return f"Sala {obj.exame.sala.numero_sala} ({obj.exame.sala.bloco or 'Bloco A'})"
        return None

    def get_rupe_historico(self, obj):
        rupes = obj.rupes.all().order_by('-criado_em')
        return RupeCandidatoSerializer(rupes, many=True).data

class CandidatoCreateSerializer(serializers.ModelSerializer):
    """Serializer para inscricao publica"""
    class Meta:
        model = Candidato
        fields = [
            'id_candidato', 'numero_inscricao', # Return ID and number after creation
            'nome_completo', 'genero', 'data_nascimento', 'numero_bi', 
            'nacionalidade', 'naturalidade', 'deficiencia', 'provincia', 'municipio', 'residencia', 'telefone', 'email',
            'tipo_escola', 'escola_proveniencia', 'municipio_escola', 'ano_conclusao', 'media_final',
            'curso_primeira_opcao', 'curso_segunda_opcao',
            'nome_encarregado', 'parentesco_encarregado', 'telefone_encarregado', 
            'telefone_alternativo_encarregado', 'email_encarregado', 'numero_bi_encarregado',
            'profissao_encarregado', 'residencia_encarregado',
            'ano_lectivo',
            'foto_passe', 'comprovativo_bi', 'certificado'
        ]
        read_only_fields = ['id_candidato', 'numero_inscricao']

class RupeCandidatoSerializer(serializers.ModelSerializer):
    is_expired = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = RupeCandidato
        fields = ['id_rupe', 'referencia', 'valor', 'status', 'data_pagamento', 'criado_em', 'is_expired']

class ListaEsperaSerializer(serializers.ModelSerializer):
    candidato_nome = serializers.CharField(source='candidato.nome_completo', read_only=True)
    candidato_numero = serializers.CharField(source='candidato.numero_inscricao', read_only=True)
    curso1 = serializers.CharField(source='candidato.curso_primeira_opcao.nome_curso', read_only=True)
    media = serializers.DecimalField(source='candidato.media_final', max_digits=4, decimal_places=2, read_only=True)
    
    class Meta:
        model = ListaEspera
        fields = '__all__'
