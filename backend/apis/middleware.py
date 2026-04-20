import datetime
from django.utils import timezone
from .models.auditoria import HistoricoLogin
from .models.usuarios import Usuario, Funcionario, Encarregado
from .models.alunos import Aluno

class SessionActivityMiddleware:
    """
    Middleware para controlar a atividade do usuário e expiração de sessões.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Verifica se o usuário está autenticado (DRF injeta o user no request)
        if hasattr(request, 'user') and request.user.is_authenticated:
            self.update_activity(request, request.user)
            
        return response

    def update_activity(self, request, user):
        now = timezone.now()
        filters = {'estado': 'activa'}
        
        # Mapeia o objeto user para o campo correto no HistoricoLogin
        if isinstance(user, Usuario):
            filters['id_usuario'] = user
        elif isinstance(user, Funcionario):
            filters['id_funcionario'] = user
        elif isinstance(user, Aluno):
            filters['id_aluno'] = user
        elif isinstance(user, Encarregado):
            filters['id_encarregado'] = user
        else:
            # Caso seja um usuário nativo do Django sem perfil vinculado
            if hasattr(user, 'id'):
                # Tenta buscar perfil de Usuario vinculado
                perfil = Usuario.objects.filter(user=user).first()
                if perfil:
                    filters['id_usuario'] = perfil
                else:
                    return
            else:
                return

        # Busca a sessão ativa mais recente
        sessao = HistoricoLogin.objects.filter(**filters).order_by('-hora_entrada').first()
        
        if sessao:
            # A sessão só expira nos logs se houver inatividade superior ao tempo do Token (4 horas)
            if now - sessao.last_activity > datetime.timedelta(hours=4):
                sessao.estado = 'expirada'
                sessao.hora_saida = now
                sessao.save()
                self._update_online_status(user, False)
            else:
                # Atualiza a última atividade para manter a sessão "Ativa"
                HistoricoLogin.objects.filter(pk=sessao.pk).update(last_activity=now)
                self._update_online_status(user, True)
        # Removida criação automática de sessões. 
        # Sessões devem ser criadas apenas via log_login_activity no momento do login.


    def _update_online_status(self, user, status):
        """Atualiza o campo is_online de forma eficiente"""
        if hasattr(user, 'is_online'):
            # Só atualiza se o estado for diferente para evitar queries desnecessárias
            if getattr(user, 'is_online') != status:
                user.__class__.objects.filter(pk=user.pk).update(is_online=status)
