from rest_framework import serializers
from apis.models import HistoricoEscolar

class HistoricoEscolarSerializer(serializers.ModelSerializer):
    class Meta:
        model = HistoricoEscolar
        fields = '__all__'
        read_only_fields = ['id_historico', 'criado_em']

    def validate_media_final(self, value):
        if value and (value < 0 or value > 20):
            raise serializers.ValidationError("A média deve estar entre 0 e 20.")
        return value
