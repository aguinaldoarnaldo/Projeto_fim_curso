from rest_framework import serializers
from apis.models import Candidato, ExameAdmissao, RupeCandidato, Curso

class CandidatoSerializer(serializers.ModelSerializer):
    curso1_nome = serializers.CharField(source='curso_primeira_opcao.nome_curso', read_only=True)
    curso2_nome = serializers.CharField(source='curso_segunda_opcao.nome_curso', read_only=True)
    nota_exame = serializers.SerializerMethodField()
    
    class Meta:
        model = Candidato
        fields = '__all__'
        read_only_fields = ['numero_inscricao', 'status', 'criado_em', 'atualizado_em']

    def get_nota_exame(self, obj):
        if hasattr(obj, 'exame'):
            return obj.exame.nota
        return None

class CandidatoCreateSerializer(serializers.ModelSerializer):
    """Serializer para inscricao publica"""
    class Meta:
        model = Candidato
        fields = [
            'id_candidato', 'numero_inscricao', # Return ID and number after creation
            'nome_completo', 'genero', 'data_nascimento', 'numero_bi', 
            'nacionalidade', 'residencia', 'telefone', 'email',
            'escola_proveniencia', 'municipio_escola', 'ano_conclusao', 'media_final',
            'curso_primeira_opcao', 'curso_segunda_opcao', 'turno_preferencial',
            'nome_encarregado', 'parentesco_encarregado', 'telefone_encarregado',
            'foto_passe', 'comprovativo_bi', 'certificado'
        ]
        read_only_fields = ['id_candidato', 'numero_inscricao']

class RupeCandidatoSerializer(serializers.ModelSerializer):
    class Meta:
        model = RupeCandidato
        fields = '__all__'
