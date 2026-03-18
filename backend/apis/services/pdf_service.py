import os
from io import BytesIO
from django.conf import settings
from django.template.loader import get_template
from xhtml2pdf import pisa
from django.utils import timezone
from pathlib import Path

class PDFService:
    """
    Serviço para geração de documentos PDF a partir de templates HTML
    """
    
    @staticmethod
    def render_to_pdf(template_src, context_dict={}):
        """
        Renderiza um template HTML para um arquivo binário PDF em memória
        """
        template = get_template(template_src)
        html = template.render(context_dict)
        result = BytesIO()
        
        # Função para resolver caminhos de recursos (imagens, css) no PDF
        def link_callback(uri, rel):
            """
            Converte URIs de arquivos estáticos/mídia em caminhos absolutos do sistema
            """
            sUrl = settings.STATIC_URL
            sRoot = settings.STATIC_ROOT
            mUrl = settings.MEDIA_URL
            mRoot = settings.MEDIA_ROOT

            # Normalização de URIs e URLs de configuração
            sUrl_norm = sUrl if sUrl.startswith('/') else '/' + sUrl
            mUrl_norm = mUrl if mUrl.startswith('/') else '/' + mUrl
            uri_norm = uri if uri.startswith('/') else '/' + uri
            
            # Caminho final padrão
            path = uri

            # Prioridade 1: Media Files
            if uri_norm.startswith(mUrl_norm):
                relative = uri_norm[len(mUrl_norm):].lstrip('/')
                path = os.path.join(mRoot, relative)
            
            # Prioridade 2: Static Files
            elif uri_norm.startswith(sUrl_norm):
                relative = uri_norm[len(sUrl_norm):].lstrip('/')
                path = os.path.join(sRoot, relative)
                
                # Fallback para desenvolvimento (look in STATICFILES_DIRS)
                if not os.path.isfile(path) and settings.DEBUG:
                    for static_dir in settings.STATICFILES_DIRS:
                        possible_path = os.path.join(str(static_dir), relative)
                        if os.path.isfile(possible_path):
                            path = possible_path
                            break

            # Normalização de barras (essencial para Windows)
            path = os.path.normpath(path)
            
            # Se o arquivo não existir localmente, retorna o URI original 
            # (o xhtml2pdf tentará buscar via HTTP, o que pode causar deadlock no runserver)
            if not os.path.isfile(path):
                print(f"⚠️ [PDFService] Recurso não encontrado localmente: {path}")
                return uri 
                
            return path

        pdf = pisa.pisaDocument(BytesIO(html.encode("UTF-8")), result, link_callback=link_callback)
        
        if not pdf.err:
            return result.getvalue()
        return None

    @staticmethod
    def save_pdf(pdf_content, filename, sub_dir='documentos'):
        """
        Salva o conteúdo binário do PDF no diretório de mídia
        """
        dir_path = os.path.join(settings.MEDIA_ROOT, sub_dir)
        if not os.path.exists(dir_path):
            os.makedirs(dir_path)
            
        file_path = os.path.join(dir_path, filename)
        with open(file_path, 'wb') as f:
            f.write(pdf_content)
            
        # Retorna o caminho relativo para salvar no banco de dados
        return os.path.join(sub_dir, filename)
