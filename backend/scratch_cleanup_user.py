from apis.models import Usuario, HistoricoLogin, Funcionario, Historico, Curso
u = Usuario.objects.filter(nome_completo__icontains='Sebast').first()
if u:
    name = u.nome_completo
    # 1. Deletar Historico (Audit logs) que apontam para este user
    Historico.objects.filter(id_usuario=u).delete()
    # 2. Deletar Logs de Login
    logs_count = HistoricoLogin.objects.filter(id_usuario=u).delete()[0]
    # 3. Tratar Funcionario vinculado
    funcs = Funcionario.objects.filter(usuario=u)
    for f in funcs:
        # Desvincular de Cursos onde é responsável
        Curso.objects.filter(id_responsavel=f).update(id_responsavel=None)
        f.delete()
    # 4. Finalmente deletar o Usuario
    u.delete()
    print(f"Eliminado utilizador '{name}' e limpas todas as dependências (Cursos, Logs, Perfis).")
else:
    print("Nenhum utilizador encontrado com esse nome.")
