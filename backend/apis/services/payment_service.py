import random
import string
from datetime import datetime
from django.utils import timezone

class RUPEService:
    """
    Serviço para gestão de Referências Únicas de Pagamento ao Estado (RUPE).
    Este serviço está preparado para ser integrado com uma API externa.
    """
    
    @staticmethod
    def gerar_referencia_rupe(fatura):
        """
        Simula a geração de uma RUPE chamando uma API externa.
        Aqui será implementada a chamada (Request) para o serviço do governo/banco.
        """
        # TODO: Implementar chamada real via requests à API de Pagamentos
        
        # Simulação de Referência (ex: 9 digitos + check digit)
        prefix = "2026" # Ano atual
        suffix = ''.join(random.choices(string.digits, k=10))
        referencia = f"{prefix}{suffix}"
        
        # Guardar na fatura
        fatura.referencia_pagamento = referencia
        fatura.data_emissao_referencia = timezone.now()
        fatura.save()
        
        return referencia

    @staticmethod
    def consultar_status_pagamento(fatura):
        """
        Consulta se a RUPE já foi paga no sistema externo.
        """
        if not fatura.referencia_pagamento:
            return False
            
        # TODO: Implementar consulta real à API
        # print(f"Consultando status da RUPE {fatura.referencia_pagamento}...")
        
        return False # Retorna o estado atual (Pendente por padrão)
