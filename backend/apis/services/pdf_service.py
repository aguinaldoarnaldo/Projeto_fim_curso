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
            sUrl = settings.STATIC_URL # Could be 'static/' or '/static/'
            sRoot = settings.STATIC_ROOT # Path object
            mUrl = settings.MEDIA_URL # 'media/' or '/media/'
            mRoot = settings.MEDIA_ROOT # Path object

            # Helper to strip leading slash if present in uri but not in prefix
            # Convert uri to properly formatted relative path matching settings logic
            
            # Normalize sUrl and mUrl to have leading slash
            sUrl_norm = sUrl if sUrl.startswith('/') else '/' + sUrl
            mUrl_norm = mUrl if mUrl.startswith('/') else '/' + mUrl
            
            # Normalize uri to have leading slash
            uri_norm = uri if uri.startswith('/') else '/' + uri
            
            path = uri
            
            # Check Media
            if uri_norm.startswith(mUrl_norm):
                # Remove prefix
                relative = uri_norm[len(mUrl_norm):]
                path = os.path.join(mRoot, relative)
            
            # Check Static
            elif uri_norm.startswith(sUrl_norm):
                 relative = uri_norm[len(sUrl_norm):]
                 path = os.path.join(sRoot, relative)
                 
                 # Fallback for dev: if file not found in STATIC_ROOT, look in STATICFILES_DIRS
                 if not os.path.isfile(path) and settings.DEBUG:
                     for static_dir in settings.STATICFILES_DIRS:
                         possible_path = os.path.join(str(static_dir), relative) # Ensure str
                         if os.path.isfile(possible_path):
                             path = possible_path
                             break

            # Normalize path for OS (Windows backslashes)
            path = os.path.normpath(path)
            
            # Verifica se o arquivo existe e é acessível
            if not os.path.isfile(path):
                # Se não for arquivo local, xhtml2pdf tentará buscar via rede
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
