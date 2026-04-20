import os
import django
from django.core.mail import send_mail
from django.conf import settings

# Configurar ambiente Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

def test_email():
    print("--- Testando envio de e-mail ---")
    print(f"Host: {settings.EMAIL_HOST}")
    print(f"Port: {settings.EMAIL_PORT}")
    print(f"User: {settings.EMAIL_HOST_USER}")
    print(f"TLS: {settings.EMAIL_USE_TLS}")
    
    try:
        sent = send_mail(
            'Teste de Conexão SGM',
            'Se você está lendo isso, o SMTP do SGM está funcionando!',
            settings.DEFAULT_FROM_EMAIL,
            [settings.EMAIL_HOST_USER], # Envia para si mesmo para testar
            fail_silently=False,
        )
        if sent:
            print("\n✅ SUCESSO! O e-mail foi enviado.")
        else:
            print("\n❌ FALHA: O e-mail não foi enviado (mas não gerou erro).")
    except Exception as e:
        print(f"\n❌ ERRO CRÍTICO: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_email()
