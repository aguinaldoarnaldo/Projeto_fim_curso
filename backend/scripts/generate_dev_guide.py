import os
import django
import sys
from datetime import datetime

# Configurar ambiente Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.utils import timezone
from apis.services.pdf_service import PDFService

def generate_guide():
    print("Iniciando geração do Guia do Desenvolvedor...")
    
    context = {
        'hoje': timezone.now(),
        'site_url': 'http://localhost:8000',
    }
    
    template_name = 'pdf/guia_dev.html'
    
    # Renderizar PDF
    pdf_content = PDFService.render_to_pdf(template_name, context)
    
    if pdf_content:
        filename = "Guia_do_Desenvolvedor.pdf"
        # Usar o sub_dir 'documentos' como definido no PDFService
        relative_path = PDFService.save_pdf(pdf_content, filename, sub_dir='documentos')
        full_path = os.path.join('media', relative_path)
        
        print(f"Sucesso! Guia gerado em: {full_path}")
        return full_path
    else:
        print("Erro ao gerar o PDF.")
        return None

if __name__ == "__main__":
    generate_guide()
