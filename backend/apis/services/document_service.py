import uuid
from datetime import timedelta
from django.utils import timezone
from django.conf import settings
from apis.models import SolicitacaoDocumento, Fatura, Funcionario
from apis.services.pdf_service import PDFService

class DocumentService:
    """
    Serviço para gestão de documentos e solicitações
    """
    
    @staticmethod
    def criar_solicitacao(aluno_id, tipo_documento, encarregado_id=None):
        """
        Cria uma nova solicitação e gera uma fatura automática (RUPE)
        """
        solicitacao = SolicitacaoDocumento.objects.create(
            id_aluno_id=aluno_id,
            id_encarregado_id=encarregado_id,
            tipo_documento=tipo_documento,
            status_solicitacao='pendente'
        )
        
        # Gerar fatura automática
        fatura = Fatura.objects.create(
            id_aluno_id=aluno_id,
            descricao=f"Taxa de Emissão: {tipo_documento}",
            total=2500.00, # Valor base exemplo
            data_vencimento=timezone.now().date() + timedelta(days=5),
            status='pendente'
        )
        
        return solicitacao, fatura

    @staticmethod
    def aprovar_solicitacao(solicitacao_id, funcionario_id):
        """
        Aprova uma solicitação, muda status e gera o arquivo físico PDF
        """
        from apis.models import Documento
        
        solicitacao = SolicitacaoDocumento.objects.select_related(
            'id_aluno', 'id_aluno__id_turma', 'id_aluno__id_turma__id_curso'
        ).get(id_solicitacao=solicitacao_id)
        
        funcionario = Funcionario.objects.get(id_funcionario=funcionario_id)
        
        # 1. Atualizar status da solicitação
        solicitacao.status_solicitacao = 'aprovado'
        solicitacao.data_aprovacao = timezone.now()
        solicitacao.id_funcionario = funcionario
        doc_uuid = uuid.uuid4()
        solicitacao.uuid_documento = doc_uuid
        
        # 2. Gerar PDF usando PDFService
        context = {
            'aluno': solicitacao.id_aluno,
            'solicitacao': solicitacao,
            'hoje': timezone.now(),
            'site_url': 'http://localhost:8000' # Poderia vir do settings
        }
        
        # Selecionar template baseado no tipo
        template_name = 'pdf/declaracao_matricula.html' # Default ou baseado em logic
        if 'Matricula' in solicitacao.tipo_documento:
            template_name = 'pdf/declaracao_matricula.html'
            
        pdf_content = PDFService.render_to_pdf(template_name, context)
        
        if pdf_content:
            filename = f"documento_{doc_uuid}.pdf"
            relative_path = PDFService.save_pdf(pdf_content, filename)
            solicitacao.caminho_arquivo = relative_path
            
            # 3. Criar registro oficial na tabela de Documentos
            Documento.objects.create(
                id_aluno=solicitacao.id_aluno,
                tipo_documento=solicitacao.tipo_documento,
                caminho_pdf=relative_path,
                uuid_documento=doc_uuid,
                criado_por=funcionario
            )
            
        solicitacao.save()
        return solicitacao

    @staticmethod
    def rejeitar_solicitacao(solicitacao_id, funcionario_id, motivo):
        """
        Rejeita uma solicitação com justificativa
        """
        solicitacao = SolicitacaoDocumento.objects.get(id_solicitacao=solicitacao_id)
        solicitacao.status_solicitacao = 'rejeitado'
        solicitacao.id_funcionario_id = funcionario_id
        # Adicionar campo de motivo no model se necessário futuramente
        solicitacao.save()
        
        return solicitacao

    @staticmethod
    def validar_pagamento_rupe(fatura_id, funcionario_id):
        """
        Valida o pagamento de uma fatura e libera o processo do documento
        """
        fatura = Fatura.objects.get(id_fatura=fatura_id)
        fatura.status = 'paga'
        fatura.data_pagamento = timezone.now().date()
        fatura.save()
        
        # Buscar solicitação vinculada (lógica simplificada via descrição)
        solicitacao = SolicitacaoDocumento.objects.filter(
            id_aluno=fatura.id_aluno,
            status_solicitacao='pendente'
        ).first()
        
        if solicitacao:
            solicitacao.status_solicitacao = 'pago'
            solicitacao.save()
            
        return fatura
