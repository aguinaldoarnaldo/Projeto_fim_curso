from rest_framework import serializers
from apis.models import Configuracao

class ConfiguracaoSerializer(serializers.ModelSerializer):
    proximo_fechamento = serializers.SerializerMethodField()

    class Meta:
        model = Configuracao
        fields = [
            'id_config', 'candidaturas_abertas', 'mensagem_candidaturas_fechadas', 
            'data_fim_candidatura', 'fechamento_automatico', 'nome_escola', 'logo',
            'proximo_fechamento'
        ]
        read_only_fields = ['id_config']

    def get_proximo_fechamento(self, obj):
        from apis.models import AnoLectivo
        from django.utils import timezone
        import datetime
        
        active_year = AnoLectivo.get_active_year()
        if active_year and active_year.fim_inscricoes:
             return timezone.make_aware(
                datetime.datetime.combine(active_year.fim_inscricoes, active_year.hora_fechamento)
            )
        return obj.data_fim_candidatura
