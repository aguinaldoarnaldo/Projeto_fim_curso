import os, django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from apis.models import AnoLectivo, Matricula, Aluno, Turma

def global_sync_states():
    print("Iniciando sincronização global de estados...")
    
    # 1. Obter todos os anos
    todos_anos = AnoLectivo.objects.all()
    
    for ano in todos_anos:
        is_active = (ano.status == 'Activo')
        print(f"Processando {ano.nome} (Status: {ano.status})...")
        
        target_status_m = 'Ativa' if is_active else 'Concluida'
        target_status_a = 'Activo' if is_active else 'Concluido'
        
        # Sincronizar Turmas e Matrículas
        Turma.objects.filter(ano_lectivo=ano).update(status=target_status_m)
        Matricula.objects.filter(ano_lectivo=ano).update(status=target_status_m)
        
        # Sincronizar Alunos desse ano
        ids_alunos = Matricula.objects.filter(ano_lectivo=ano).values_list('id_aluno_id', flat=True).distinct()
        Aluno.objects.filter(id_aluno__in=ids_alunos).update(status_aluno=target_status_a)
        
        print(f"  - Registros de {ano.nome} -> {target_status_a}")

    # 2. Segurança Final: Alunos que não têm nenhuma matrícula ATIVA em anos ATIVOS 
    # devem ser forçados a 'Concluido' (Estado Global)
    active_year_ids = AnoLectivo.objects.filter(status='Activo').values_list('id_ano', flat=True)
    
    # Alunos com matrícula ATIVA no momento
    alunos_com_matricula_ativa = Matricula.objects.filter(
        ano_lectivo_id__in=active_year_ids,
        status='Ativa'
    ).values_list('id_aluno_id', flat=True).distinct()
    
    # Alunos que NÃO estão no grupo acima mas estão marcados como 'Activo'
    alunos_erroneamente_ativos = Aluno.objects.filter(
        status_aluno='Activo'
    ).exclude(id_aluno__in=alunos_com_matricula_ativa)
    
    count_extra = alunos_erroneamente_ativos.count()
    alunos_erroneamente_ativos.update(status_aluno='Concluido')
    
    print(f"Limpeza de segurança: {count_extra} alunos marcados como 'Concluido' por não terem matrícula ativa no ano vigente.")
    print("Sincronização concluída com sucesso!")

if __name__ == "__main__":
    global_sync_states()
