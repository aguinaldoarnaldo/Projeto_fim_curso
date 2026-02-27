"""
AuditMixin — mixin reutilizável para registar acções CRUD no modelo Historico.

Uso: adicionar AuditMixin antes de viewsets.ModelViewSet na definição da classe.
    class TurmaViewSet(AuditMixin, viewsets.ModelViewSet):
        ...
"""

# Mapeamento de rótulos legíveis para cada acção
ACTION_LABELS = {
    'create': 'Criou',
    'update': 'Actualizou',
    'partial_update': 'Actualizou',
    'destroy': 'Eliminou',
}


def _get_actor(request):
    """
    Resolve o utilizador autenticado a partir do request.
    O custom authentication backend define request.user_type como
    'funcionario', 'usuario', 'aluno' ou 'encarregado'.
    Retorna (id_funcionario, id_usuario, id_aluno) — apenas um terá valor.
    """
    user = getattr(request, 'user', None)
    user_type = getattr(request, 'user_type', None)

    id_funcionario = None
    id_usuario = None
    id_aluno = None

    if user is None or not getattr(user, 'is_authenticated', False):
        return id_funcionario, id_usuario, id_aluno

    if user_type == 'funcionario':
        id_funcionario = user
    elif user_type == 'usuario':
        id_usuario = user
    elif user_type == 'aluno':
        id_aluno = user
    else:
        # Tentativa de fallback por tipo de instância
        from apis.models import Funcionario, Usuario, Aluno
        if isinstance(user, Funcionario):
            id_funcionario = user
        elif isinstance(user, Usuario):
            id_usuario = user
        elif isinstance(user, Aluno):
            id_aluno = user

    return id_funcionario, id_usuario, id_aluno


def _model_label(instance):
    """Retorna nome legível do modelo."""
    return instance.__class__.__name__


def _safe_str(instance):
    """Representação textual segura do objecto."""
    try:
        return str(instance)
    except Exception:
        return repr(instance)


def _log_action(request, action_key, instance, dados_anteriores=None, dados_novos=None):
    """Grava uma linha no Historico."""
    try:
        from apis.models import Historico

        id_func, id_usuario, id_aluno = _get_actor(request)

        label = ACTION_LABELS.get(action_key, action_key)
        model_name = _model_label(instance)
        str_repr = _safe_str(instance)

        tipo_accao = f"{label} {model_name}: {str_repr}"[:255]

        Historico.objects.create(
            id_funcionario=id_func,
            id_usuario=id_usuario,
            id_aluno=id_aluno,
            tipo_accao=tipo_accao,
            dados_anteriores=dados_anteriores,
            dados_novos=dados_novos,
        )
    except Exception as e:
        # Nunca deixar que um erro no log quebre a operação principal
        import logging
        logging.getLogger(__name__).warning(f"[AuditMixin] Erro ao registar log: {e}")


class AuditMixin:
    """
    Mixin para ViewSets (ModelViewSet) que regista automaticamente
    acções de criação, actualização e eliminação no modelo Historico.
    """

    def _log_audit_action(self, action_key, instance, serializer=None):
        """Helper para registar a acção actual."""
        dados_anteriores = None
        dados_novos = None

        if action_key == 'create':
            if serializer:
                 try:
                     dados_novos = {k: str(v) for k, v in serializer.validated_data.items() if k != 'senha_hash'}
                 except: pass
        elif action_key in ['update', 'partial_update']:
            if serializer:
                try:
                    # Captura o que mudou (pelo validated_data)
                    dados_novos = {k: str(v) for k, v in serializer.validated_data.items() if k != 'senha_hash'}
                    # Para simplificar, não tentamos buscar o estado anterior exacto de cada campo aqui, 
                    # a menos que queiramos complicar o mixin.
                except: pass
        elif action_key == 'destroy':
            dados_anteriores = {'id': str(instance.pk), 'repr': _safe_str(instance)}

        _log_action(
            self.request,
            action_key,
            instance,
            dados_anteriores=dados_anteriores,
            dados_novos=dados_novos,
        )

    def perform_create(self, serializer):
        instance = serializer.save()
        self._log_audit_action('create', instance, serializer)
        return instance

    def perform_update(self, serializer):
        instance = serializer.save()
        self._log_audit_action(self.action, instance, serializer)
        return instance

    def perform_destroy(self, instance):
        self._log_audit_action('destroy', instance)
        instance.delete()
