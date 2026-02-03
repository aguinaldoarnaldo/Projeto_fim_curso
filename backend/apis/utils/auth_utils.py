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
    
    subject = "Definição de Senha - Sistema de Gestão Escolar"
    message = f"""
    Olá {user.nome_completo},
    
    Você foi cadastrado no Sistema de Gestão Escolar.
    Para acessar sua conta, clique no link abaixo e defina sua senha:
    
    {link}
    
    Este link expira em 24 horas.
    
    Atenciosamente,
    Administração
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
