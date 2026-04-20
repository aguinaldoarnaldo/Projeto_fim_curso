import os
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile

def process_image(image_field, max_width=800, max_height=800, quality=85):
    """
    Redimensiona e comprime uma imagem para otimizar o carregamento.
    Converte para WebP se possível para máxima eficiência.
    """
    if not image_field:
        return

    # Abrir a imagem usando Pillow
    img = Image.open(image_field)
    
    # Converter para RGB se necessário (ex: de RGBA para JPEG/WebP)
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
    
    # Redimensionamento proporcional (mantém o aspect ratio)
    img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
    
    # Salvar a imagem processada em um buffer
    output_buffer = BytesIO()
    
    # Salvar como WebP para melhor compressão, ou manter o formato original se preferir
    img.save(output_buffer, format='WEBP', quality=quality, optimize=True)
    output_buffer.seek(0)
    
    # Atualizar o campo de imagem com o novo conteúdo otimizado
    # Alterar a extensão para .webp
    current_name = os.path.basename(image_field.name)
    name_without_ext = os.path.splitext(current_name)[0]
    new_name = f"{name_without_ext}.webp"
    
    # Substituir o arquivo anterior pelo novo
    image_field.save(new_name, ContentFile(output_buffer.read()), save=False)
