from django.utils import timezone
from apis.models import Notificacao, AnoLectivo, AgendamentoBackup
import datetime

class NotificationService:
    """Serviço para gerenciar a criação automática de notificações."""

    @staticmethod
    def check_and_create_notifications():
        """
        Verifica datas importantes e agendamentos para criar notificações.
        Este método deve ser chamado periodicamente ou em pontos de entrada frequentes.
        """
        now = timezone.now()
        today = now.date()

        # 1. Verificar Datas de Inscrição e Matrícula
        active_year = AnoLectivo.get_active_year()
        if active_year:
            # Notificação de Início de Inscrições
            if active_year.inicio_inscricoes == today:
                NotificationService._create_unique_notification(
                    titulo="Inscrições Abertas",
                    mensagem=f"As inscrições para o ano letivo {active_year.nome} começaram hoje!",
                    tipo="success",
                    link="/inscritos"
                )
            
            # Notificação de Fim de Inscrições
            if active_year.fim_inscricoes == today:
                NotificationService._create_unique_notification(
                    titulo="Último dia de Inscrições",
                    mensagem=f"Atenção: Hoje é o último dia para inscrições do ano {active_year.nome}.",
                    tipo="warning",
                    link="/inscritos"
                )

            # Notificação de Exame de Admissão
            if active_year.data_exame_admissao == today:
                NotificationService._create_unique_notification(
                    titulo="Dia de Exame",
                    mensagem=f"Os exames de admissão para {active_year.nome} estão agendados para hoje.",
                    tipo="info",
                    link="/inscritos"
                )

        # 2. Verificar Agendamentos de Backup
        # Procurar agendamentos para agora ou passados que ainda não foram notificados
        agendamentos = AgendamentoBackup.objects.filter(
            data_hora__lte=now,
            notificado=False
        )

        for agendamento in agendamentos:
            NotificationService._create_unique_notification(
                titulo="Backup Agendado",
                mensagem=f"É hora de realizar o backup agendado: {agendamento.descricao or 'Backup do Sistema'}",
                tipo="info",
                link="/configuracoes"
            )
            agendamento.notificado = True
            agendamento.save()

    @staticmethod
    def _create_unique_notification(titulo, mensagem, tipo="info", link=None):
        """Evita criar notificações duplicadas para o mesmo evento no mesmo dia."""
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        exists = Notificacao.objects.filter(
            titulo=titulo,
            data_criacao__gte=today_start
        ).exists()

        if not exists:
            Notificacao.objects.create(
                titulo=titulo,
                mensagem=mensagem,
                tipo=tipo,
                link=link
            )
