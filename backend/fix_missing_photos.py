import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

print("Iniciando script de sincronização...")
from apis.models import Aluno, Candidato
from django.core.files.base import ContentFile

print(f"Total de Alunos: {Aluno.objects.count()}")
print(f"Total de Candidatos: {Candidato.objects.count()}")

def sync_photos():
    students_without_photo = Aluno.objects.filter(img_path='') | Aluno.objects.filter(img_path__isnull=True)
    count = 0
    
    for aluno in students_without_photo:
        # Tentar encontrar o candidato pelo BI
        candidato = Candidato.objects.filter(numero_bi=aluno.numero_bi).first()
        
        if candidato and candidato.foto_passe:
            print(f"Sincronizando foto para o aluno: {aluno.nome_completo}")
            try:
                content = candidato.foto_passe.read()
                filename = os.path.basename(candidato.foto_passe.name)
                aluno.img_path.save(filename, ContentFile(content), save=True)
                count += 1
            except Exception as e:
                print(f"Erro ao copiar foto para {aluno.nome_completo}: {e}")
                
    print(f"Concluído! {count} fotos sincronizadas.")

if __name__ == "__main__":
    sync_photos()
