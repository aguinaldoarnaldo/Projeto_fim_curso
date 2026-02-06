# Relatório de Erros e Soluções

Este arquivo documenta os erros encontrados durante a implementação das funcionalidades de PDF e download, e as respectivas soluções aplicadas.

## 1. Backend: Erro de Sintaxe em `matricula_views.py`

**Erro Reportado:**
```python
SyntaxError: expected 'except' or 'finally' block
```
**Localização:** `backend/apis/views/matricula_views.py`, linhas ~317.
**Causa:** Um bloco `try` foi aberto para gerir a transação da permuta, mas o bloco `except` estava ausente antes do fechamento do método ou retorno.
**Solução:** Adicionado o bloco `except Exception as e:` para capturar erros e retornar uma resposta 500 adequada.

## 2. Frontend: Estrutura JSX Inválida em `Candidatura.jsx`

**Erro Reportado:**
```javascript
Adjacent JSX elements must be wrapped in an enclosing tag. Did you want a JSX fragment <>...</>?
```
**Localização:** `frontend/src/pages/Public/Candidatura/Candidatura.jsx`.
**Causa:**
1. Havia uma tag `</div>` de fechamento extra que encerrava o componente prematuramente.
2. O bloco de código do botão "Baixar Comprovativo" foi duplicado acidentalmente.
**Solução:**
- Removidas as tags duplicadas.
- Corrigida a hierarquia de `divs` para garantir que o componente retornasse apenas um elemento raiz (ou fragmento) corretamente aninhado.

## 3. Erro no Download de PDF (Static Files)

**Erro Reportado:**
Falha ao baixar o arquivo ("Erro ao baixar documento") ou PDF vazio/corrompido em ambiente de desenvolvimento.
**Causa:**
O `link_callback` no `pdf_service.py` não estava conseguindo localizar corretamente os arquivos estáticos (CSS/Imagens) quando rodando localmente sem o `collectstatic` completo ou com caminhos relativos complexos.
**Solução:**
Atualizado o `apis/services/pdf_service.py` para:
- Normalizar caminhos com/sem barra inicial.
- Verificar explicitamente `STATICFILES_DIRS` em modo `DEBUG` para encontrar arquivos de fonte.
- Melhorar a detecção de pastas `media` vs `static`.

## Status Atual
Todos os erros acima foram corrigidos no código. O sistema deve permitir:
1. Inscrição online e download do comprovativo (Candidato).
2. Download da ficha de matrícula pelo administrador.
3. Indicador visual de vagas na turma ao matricular.
