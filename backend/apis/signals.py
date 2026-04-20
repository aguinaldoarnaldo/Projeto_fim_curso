from django.contrib.auth.signals import user_logged_in, user_logged_out
from django.dispatch import receiver
from django.utils import timezone
from .models.auditoria import HistoricoLogin
from .models.usuarios import Usuario, Funcionario, Encarregado
from .models.alunos import Aluno

@receiver(user_logged_in)
def on_user_logged_in(sender, request, user, **kwargs):
    """
    Registo de login ultra-robusto.
    """
    try:
        # 1. Determinar IP e User Agent
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        ip = x_forwarded_for.split(',')[0] if x_forwarded_for else request.META.get('REMOTE_ADDR')
        ua = request.META.get('HTTP_USER_AGENT', '')[:150]

        # 2. Preparar dados
        log_data = {
            'ip_usuario': ip,
            'dispositivo': ua,
            'navegador': ua,
            'estado': 'activa'
        }

        # 3. Identificação Dinâmica (Funciona com qualquer modelo)
        # Se o objeto tiver o atributo, nós usamos.
        if hasattr(user, 'id_usuario'):
            log_data['id_usuario'] = user
        elif hasattr(user, 'id_funcionario'):
            log_data['id_funcionario'] = user
        elif hasattr(user, 'id_aluno'):
            log_data['id_aluno'] = user
        elif hasattr(user, 'id_encarregado'):
            log_data['id_encarregado'] = user
        elif hasattr(user, 'profile'):
            log_data['id_usuario'] = user.profile

        # 4. Criar o registo (Forçar gravação)
        HistoricoLogin.objects.create(**log_data)
        
        # 5. Atualizar status online
        if hasattr(user, 'is_online'):
            user.__class__.objects.filter(pk=user.pk).update(is_online=True)

    except Exception as e:
        # Se tudo falhar, tentamos pelo menos um log anónimo para não perder a entrada
        try:
            HistoricoLogin.objects.create(estado='activa', ip_usuario='0.0.0.0', dispositivo='Erro no Signal')
        except:
            pass
        print(f"Erro ao registar login: {e}")

@receiver(user_logged_out)
def on_user_logged_out(sender, request, user, **kwargs):
    """
    Ao fazer logout, marca a sessão como encerrada.
    """
    if not user:
        return

    now = timezone.now()
    filters = {'estado': 'activa'}

    if isinstance(user, Usuario):
        filters['id_usuario'] = user
    elif isinstance(user, Funcionario):
        filters['id_funcionario'] = user
    elif isinstance(user, Aluno):
        filters['id_aluno'] = user
    elif isinstance(user, Encarregado):
        filters['id_encarregado'] = user

    # Atualizar todas as sessões ativas deste usuário para encerradas
    HistoricoLogin.objects.filter(**filters).update(
        estado='encerrada',
        hora_saida=now
    )

    # Marcar como offline
    if hasattr(user, 'is_online'):
        user.__class__.objects.filter(pk=user.pk).update(is_online=False)
