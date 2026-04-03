import os
import django
import sys

# Corrige caminho do projeto (adiciona backend ao sys.path)
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

# Configura o ambiente Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apis.models import (
    Aluno, Encarregado, AlunoEncarregado,
    AnoLectivo, Turma, VagaCurso,
    Nota, FaltaAluno,
    Fatura, Pagamento,
    Inscricao, Matricula,
    Historico, HistoricoLogin,
    Candidato, RupeCandidato, ExameAdmissao, ListaEspera,
    Notificacao, HistoricoEscolar
)

# Modelos que SERÃO apagados (Transactional Data)
# Manteremos: Sala, Curso, AreaFormacao, Classe, Periodo, Departamento, Seccao, Disciplina, Funcionario, Usuario, Cargo.

models_to_clear = [
    # 1. Alunos e Matrículas (Dados de Estudantes)
    Nota, 
    FaltaAluno, 
    Matricula, 
    Inscricao, 
    HistoricoEscolar,
    AlunoEncarregado, 
    Encarregado,
    Aluno, # Cascade apaga muita coisa, mas listamos os principais
    
    # 2. Candidatura (Processos de Inscrição Online/Exames)
    ListaEspera, 
    ExameAdmissao, 
    RupeCandidato, 
    Candidato,
    
    # 3. Académico Ano-Específico
    Turma, 
    VagaCurso, 
    AnoLectivo, # Root dos anos letivos, apagar resetar o ciclo
    
    # 4. Financeiro
    Pagamento, 
    Fatura,
    
    # 5. Logs e Alertas
    Notificacao, 
    HistoricoLogin, 
    Historico
]

print("⚠️  AVISO CRÍTICO: Iniciando a limpeza total de dados transacionais.")
print("--- Preservando Infraestrutura: Salas, Cursos, Funcionários, Estrutura Académica. ---")
print("-" * 50)

summary = []

try:
    for model in models_to_clear:
        try:
            name = model._meta.verbose_name_plural
            count = model.objects.count()
            if count > 0:
                print(f"Buscando {count} registo(s) de {name}...")
                # Usar delete() que respeita os hooks e sinais se necessário
                deleted_count, _ = model.objects.all().delete()
                print(f"   ↳ {deleted_count} itens removidos.")
                summary.append(f"{name}: {deleted_count}")
            else:
                print(f"Tabela {name} já está vazia. OK.")
        except Exception as inner_e:
            print(f"Erro ao limpar {model.__name__}: {str(inner_e)}")

    print("-" * 50)
    print("✅ LIMPEZA CONCLUÍDA COM SUCESSO!")
    print(f"Resumo: {', '.join(summary) if summary else 'Nenhum dado encontrado para remover.'}")
    print("-" * 50)
    print("Módulos mantidos intactos:")
    print("• Salas de Aula")
    print("• Cursos e Áreas de Formação")
    print("• Departamentos e Seções")
    print("• Classes e Períodos")
    print("• Funcionários e Cargos")
    print("• Disciplinas")
    print("-" * 50)

except Exception as e:
    print(f"❌ OCORREU UM ERRO FATAL: {str(e)}")
    sys.exit(1)
