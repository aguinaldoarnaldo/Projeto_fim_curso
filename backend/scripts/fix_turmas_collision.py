import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.models.academico import Turma, AnoLectivo
from django.db.models import Count

def find_and_fix_collisions():
    active_year = AnoLectivo.get_active_year()
    if not active_year:
        print("No active year.")
        return

    # Achar combinações sala/turno que têm mais de 1 turma
    conflitos = Turma.objects.filter(ano_lectivo=active_year, id_sala__isnull=False).values('id_sala', 'id_periodo').annotate(total=Count('id_turma')).filter(total__gt=1)

    if not conflitos:
        print("Nenhum conflito encontrado!")
        return

    print(f"Foram encontrados {len(conflitos)} conflitos Sala/Turno. Resolvendo...\n")

    for conflito_group in conflitos:
        id_sala = conflito_group['id_sala']
        id_periodo = conflito_group['id_periodo']

        # Pegar as turmas em conflito
        turmas_em_conflito = list(Turma.objects.filter(
            id_sala=id_sala,
            id_periodo=id_periodo,
            ano_lectivo=active_year
        ).order_by('id_turma')) # Mantém a mais antiga (primeira) com a sala

        turma_principal = turmas_em_conflito[0]
        turmas_excesso = turmas_em_conflito[1:]

        print(f"[{turma_principal.id_sala.numero_sala} - {turma_principal.id_periodo.periodo}] Conflito ({len(turmas_em_conflito)} turmas): Mantendo a sala para '{turma_principal.codigo_turma}'")
        
        for t in turmas_excesso:
            old_sala = t.id_sala.numero_sala
            t.id_sala = None
            # Update ignoring custom save that validates, para não dar o erro q acabamos de criar.
            Turma.objects.filter(pk=t.pk).update(id_sala=None)
            print(f"  -> Retirada a sala da turma '{t.codigo_turma}' (Antes: Sala {old_sala})")

if __name__ == '__main__':
    find_and_fix_collisions()
    print("\nConcluído!")
