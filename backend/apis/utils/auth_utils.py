import jwt
from django.conf import settings
from django.core.mail import send_mail
from datetime import datetime, timedelta

def generate_password_token(user_id, user_type):
    """Gera um token JWT temporário para definição de senha"""
    payload = {
        'user_id': user_id,
        'user_type': user_type,
        'action': 'set_password',
        'exp': datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

def decode_password_token(token):
    """Decodifica e valida o token de definição de senha"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        if payload.get('action') != 'set_password':
            return None
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def send_password_definition_email(user, token, request=None):
    """Envia email com link para definir a senha"""
    # URL do Frontend (ajuste conforme ambiente)
    base_url = "http://localhost:5173" 
    link = f"{base_url}/definir-senha?token={token}"
    
    subject = "Recuperação de Senha - SGMatrícula"
    message = f"""
    Olá {user.nome_completo},
    
    Recebemos um pedido para redefinir a sua senha no Sistema de Gestão de Matrículas (SGMatrícula).
    Para prosseguir, clique no link abaixo:
    
    {link}
    
    Se não solicitou esta alteração, por favor ignore este e-mail.
    Este link é válido por 24 horas.
    
    Atenciosamente,
    Suporte Técnico SGMatrícula
    """
    
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@school.com',
            [user.email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Erro ao enviar email: {e}")
        return False

def get_user_agent_info(request):
    """Extrai informações amigáveis do User-Agent (Navegador e SO)"""
    ua_string = request.META.get('HTTP_USER_AGENT', '').lower()
    
    # Detecção simples de Navegador
    navegador = 'Desconhecido'
    if 'edg' in ua_string: navegador = 'Edge'
    elif 'chrome' in ua_string and 'safari' in ua_string: navegador = 'Chrome'
    elif 'firefox' in ua_string: navegador = 'Firefox'
    elif 'safari' in ua_string and 'chrome' not in ua_string: navegador = 'Safari'
    elif 'opera' in ua_string or 'opr' in ua_string: navegador = 'Opera'
    
    # Detecção simples de Dispositivo/SO
    dispositivo = 'Outro'
    if 'windows' in ua_string: dispositivo = 'Windows'
    elif 'android' in ua_string: dispositivo = 'Android'
    elif 'iphone' in ua_string or 'ipad' in ua_string: dispositivo = 'iOS'
    elif 'macintosh' in ua_string: dispositivo = 'macOS'
    elif 'linux' in ua_string: dispositivo = 'Linux'
    
    return {
        'dispositivo': dispositivo,
        'navegador': navegador
    }
