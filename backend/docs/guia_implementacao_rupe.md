# Guia Técnico: Implementação do RUPE Passo-a-Passo

Este guia detalha **o que fazer** e **onde colocar** cada peça do código para integrar a API do RUPE.

## Passo 1: Configuração das Credenciais
**Onde:** `backend/.env`
**O que fazer:** Adicionar as variáveis de ambiente fornecidas pela AGT/Governo.
```env
RUPE_API_URL=https://api.governo.ao/v1/rupe
RUPE_API_TOKEN=seu_token_aqui
RUPE_ORG_ID=identificador_da_escola
```

**Onde:** `backend/core/settings.py`
**O que fazer:** Ler estas variáveis para uso no Django.
```python
RUPE_CONFIG = {
    'URL': os.getenv('RUPE_API_URL'),
    'TOKEN': os.getenv('RUPE_API_TOKEN'),
    'ORG_ID': os.getenv('RUPE_ORG_ID'),
}
```

## Passo 2: Lógica de Comunicação (Service)
**Onde:** `backend/apis/services/payment_service.py`
**O que fazer:** Substituir a simulação por chamadas reais usando a biblioteca `requests`.
- Implementar `POST` para gerar o código.
- Implementar `GET` para consultar o estado.
- Guardar o JSON da resposta para auditoria.

## Passo 3: Gatilho de Geração (Views)
**Onde:** `backend/apis/views/candidatura_views.py`
**O que fazer:** 
1. No método `perform_create` do `CandidaturaViewSet`, chamar o serviço de geração de RUPE.
2. Criar uma `@action` chamada `actualizar_status_pagamento` para permitir consulta manual pelo admin.

## Passo 4: Verificação Automática (Management Command)
**Onde:** `backend/apis/management/commands/verificar_pagamentos.py`
**O que fazer:** Criar um script que percorre todos os RUPEs com status `PENDENTE` e chama a API para ver se já foram pagos.
```python
# Exemplo de comando
python manage.py verificar_pagamentos
```

## Passo 5: Exibição no Frontend
**Onde:** `frontend/src/pages/Inscricoes/DetalhesCandidato.jsx` (ou similar)
**O que fazer:**
1. Buscar os dados do RUPE via API.
2. Mostrar um card com o **Código RUP**, **Valor** e **Data de Expiração**.
3. Adicionar um botão de "Copiar Código".
4. Adicionar um botão "Já paguei: Verificar agora" que chama a API do Step 3.

## Passo 6: Regras de Negócio e Segurança
- **Expiração**: Bloquear a impressão da ficha de exame se o RUPE estiver expirado ou não pago.
- **Logs**: Registar sempre no histórico de auditoria quando um pagamento é confirmado.
