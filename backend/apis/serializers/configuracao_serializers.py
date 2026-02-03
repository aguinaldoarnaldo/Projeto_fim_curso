from rest_framework import serializers
from apis.models import Configuracao

class ConfiguracaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Configuracao
        fields = ['id_config', 'candidaturas_abertas', 'mensagem_candidaturas_fechadas']
        read_only_fields = ['id_config']
