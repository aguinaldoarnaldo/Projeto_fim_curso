from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db import transaction

from apis.models import Matricula
from apis.serializers.matricula_serializers import MatriculaSerializer

from apis.permissions.custom_permissions import HasAdditionalPermission

class MatriculaViewSet(viewsets.ModelViewSet):
    """ViewSet para Matricula"""
    queryset = Matricula.objects.select_related(
        'id_aluno', 
        'id_turma', 
        'id_turma__id_curso', 
        'id_turma__id_sala', 
        'id_turma__id_classe', 
        'id_turma__id_periodo'
    ).prefetch_related(
        'id_aluno__alunoencarregado_set',
        'id_aluno__alunoencarregado_set__id_encarregado'
    ).all()
    serializer_class = MatriculaSerializer
    permission_classes = [IsAuthenticated, HasAdditionalPermission]
    
    # Mapeamento de permissões por ação
    permission_map = {
        # 'list': 'view_matriculas',
        # 'retrieve': 'view_matriculas',
        'create': 'create_matricula',
        'update': 'edit_matricula',
        'partial_update': 'edit_matricula',
        'destroy': 'delete_matricula',
        'matricular_novo_aluno': 'create_matricula',
        'permutar': 'change_matricula',
    }

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['id_aluno__nome_completo', 'id_matricula']
    ordering_fields = ['data_matricula', 'id_aluno__nome_completo']
    ordering = ['-data_matricula']

    @action(detail=False, methods=['post'])
    def matricular_novo_aluno(self, request):
        """
        Matrícula direta para alunos novos (transferidos ou sem candidatura prévia).
        Recebe dados completos do aluno + turma + histórico escolar.
        """
        from apis.models import Aluno, Turma, Encarregado, AlunoEncarregado, Matricula, HistoricoEscolar, AnoLectivo, Candidato
        
        data = request.data
        
        # Validações Básicas
        required_fields = ['nome_completo', 'numero_bi', 'turma_id']
        for field in required_fields:
            if not data.get(field):
                return Response({'erro': f'Campo obrigatório ausente: {field}'}, status=400)

        turma_id = data.get('turma_id')
        try:
           turma = Turma.objects.get(pk=turma_id)
        except Turma.DoesNotExist:
            return Response({'erro': 'Turma não encontrada'}, status=404)
        
        # Verificar se a turma tem ano_lectivo ou buscar o ativo
        ano_lectivo = turma.ano_lectivo
        if not ano_lectivo:
            # Buscar ano letivo ativo
            ano_lectivo = AnoLectivo.objects.filter(activo=True).first()
            if not ano_lectivo:
                return Response({'erro': 'Nenhum Ano Lectivo ativo encontrado. Configure um Ano Lectivo primeiro.'}, status=400)
            
        try:
            with transaction.atomic():
                # 1. Encarregado (se houver dados)
                encarregado = None
                nome_enc = data.get('nome_encarregado')
                tel_enc = data.get('telefone_encarregado')
                
                if nome_enc:
                    # Tentar encontrar por telefone
                    if tel_enc:
                        encarregado = Encarregado.objects.filter(telefone__contains=tel_enc).first()
                    
                    if not encarregado:
                        encarregado = Encarregado.objects.create(
                            nome_completo=nome_enc,
                            numero_bi=data.get('numero_bi_encarregado'),
                            profissao=data.get('profissao_encarregado'),
                            telefone=[tel_enc] if tel_enc else [],
                            senha_hash='123456', 
                            is_online=False
                        )

                # 2. Aluno
                candidato_id = data.get('candidato_id')
                candidato = None
                if candidato_id:
                    candidato = Candidato.objects.filter(pk=candidato_id).first()

                id_aluno = data.get('id_aluno')
                aluno = None
                if id_aluno:
                    aluno = Aluno.objects.filter(id_aluno=id_aluno).first()
                
                if not aluno:
                    # Verificar se já existe por BI 
                    aluno_exists = Aluno.objects.filter(numero_bi=data.get('numero_bi')).first()
                    if aluno_exists:
                        return Response({'erro': 'Já existe um aluno com este Número de BI.'}, status=400)
                    
                    import datetime
                    year = datetime.datetime.now().year
                    last = Aluno.objects.order_by('-numero_matricula').first()
                    new_num = (last.numero_matricula + 1) if last and last.numero_matricula else int(f"{year}0001")
                    
                    foto = request.FILES.get('novo_aluno_foto')
                    
                    aluno = Aluno.objects.create(
                        nome_completo=data.get('nome_completo'),
                        data_nascimento=data.get('data_nascimento'),
                        genero=data.get('genero'),
                        numero_bi=data.get('numero_bi'),
                        nacionalidade=data.get('nacionalidade', 'Angolana'),
                        naturalidade=data.get('naturalidade'),
                        deficiencia=data.get('deficiencia', 'Não'),
                        email=data.get('email'),
                        telefone=data.get('telefone', '000000000'),
                        provincia_residencia=data.get('provincia'),
                        municipio_residencia=data.get('municipio'),
                        bairro_residencia=data.get('bairro'),
                        numero_casa=data.get('numero_casa'),
                        numero_matricula=new_num,
                        senha_hash='123456',
                        status_aluno='Activo',
                        id_turma=turma,
                        img_path=foto if foto else None
                    )

                    # Se não veio foto nova, mas tem do candidato, vamos copiar FISICAMENTE
                    if not foto and candidato and candidato.foto_passe:
                        try:
                            from django.core.files.base import ContentFile
                            import os
                            content = candidato.foto_passe.read()
                            filename = os.path.basename(candidato.foto_passe.name)
                            aluno.img_path.save(filename, ContentFile(content), save=True)
                        except Exception as e:
                            print(f"Erro ao copiar foto do candidato: {e}")
                else:
                    # Atualizar dados do aluno existente se necessário (ex: mudança de morada, telefone)
                    aluno.id_turma = turma
                    aluno.nome_completo = data.get('nome_completo', aluno.nome_completo)
                    aluno.status_aluno = 'Activo'
                    
                    # Campos de Endereço/Contato
                    if data.get('nacionalidade'): aluno.nacionalidade = data.get('nacionalidade')
                    if data.get('naturalidade'): aluno.naturalidade = data.get('naturalidade')
                    if data.get('deficiencia'): aluno.deficiencia = data.get('deficiencia')
                    if data.get('email'): aluno.email = data.get('email')
                    if data.get('telefone'): aluno.telefone = data.get('telefone')
                    if data.get('provincia'): aluno.provincia_residencia = data.get('provincia')
                    if data.get('municipio'): aluno.municipio_residencia = data.get('municipio')
                    if data.get('bairro'): aluno.bairro_residencia = data.get('bairro')
                    if data.get('numero_casa'): aluno.numero_casa = data.get('numero_casa')
                    
                    # Foto
                    foto_nova = request.FILES.get('novo_aluno_foto')
                    if foto_nova:
                        aluno.img_path = foto_nova
                    elif candidato and candidato.foto_passe and not aluno.img_path:
                        try:
                            from django.core.files.base import ContentFile
                            import os
                            content = candidato.foto_passe.read()
                            filename = os.path.basename(candidato.foto_passe.name)
                            aluno.img_path.save(filename, ContentFile(content), save=False)
                        except Exception:
                            pass

                    aluno.save()
                
                # 3. Vínculo Encarregado
                if encarregado:
                    AlunoEncarregado.objects.create(
                        id_aluno=aluno,
                        id_encarregado=encarregado,
                        grau_parentesco=data.get('parentesco_encarregado')
                    )
                    
                # 4. Matrícula
                Matricula.objects.create(
                     id_aluno=aluno,
                     id_turma=turma,
                     ano_lectivo=ano_lectivo,  # Usar a variável que foi validada
                     ativo=True,
                     tipo=data.get('tipo', 'Novo'),
                     status='Ativo',
                     doc_bi=request.FILES.get('doc_bi'),
                     doc_certificado=request.FILES.get('doc_certificado')
                )
                
                # 4.1 Atualizar Status do Candidato (se originário de uma inscrição)
                candidato_id = data.get('candidato_id')
                if candidato_id:
                    Candidato.objects.filter(pk=candidato_id).update(status='Matriculado')

                # 5. Histórico Escolar (se houver)
                historico_list = data.get('historico_escolar', [])
                if historico_list and isinstance(historico_list, list):
                    for item in historico_list:
                        HistoricoEscolar.objects.create(
                            aluno=aluno,
                            escola_origem=item.get('escola'),
                            ano_lectivo=item.get('ano'),
                            classe=item.get('classe'),
                            turma_origem=item.get('turma_antiga'),
                            numero_processo_origem=item.get('num_processo'),
                            media_final=item.get('media') if item.get('media') else None,
                            observacoes=item.get('obs')
                        )
                
                return Response({
                    'mensagem': 'Aluno matriculado com sucesso!',
                    'aluno_id': aluno.id_aluno,
                    'matricula': aluno.numero_matricula
                }, status=201)

        except Exception as e:
            # import traceback
            # traceback.print_exc()
            return Response({'erro': f'Erro ao processar matrícula: {str(e)}'}, status=500)

    @action(detail=False, methods=['get'])
    def sugerir_tipo(self, request):
        """
        Sugere o tipo de matrícula com base no histórico do aluno.
        Query Params: aluno_id
        """
        aluno_id = request.query_params.get('aluno_id')
        if not aluno_id:
            return Response({'erro': 'aluno_id é obrigatório'}, status=400)
            
        from apis.services.academic_service import AcademicService
        tipo = AcademicService.determinar_tipo_matricula(aluno_id)
        
        return Response({'tipo_sugerido': tipo})

    @action(detail=False, methods=['post'])
    def permutar(self, request):
        """
        Permuta (troca) de turmas entre dois alunos matriculados.
        Payload: { 'matricula_id_1': INT, 'matricula_id_2': INT }
        """
        id1 = request.data.get('matricula_id_1')
        id2 = request.data.get('matricula_id_2')

        if not id1 or not id2:
            return Response({'erro': 'IDs das matriculas (matricula_id_1, matricula_id_2) são obrigatórios.'}, status=400)
        
        if id1 == id2:
            return Response({'erro': 'Não é possível permutar a mesma matrícula.'}, status=400)

        from apis.models import Matricula

        try:
            with transaction.atomic():
                try:
                    mat1 = Matricula.objects.select_related('id_turma', 'id_aluno').get(pk=id1)
                except Matricula.DoesNotExist:
                     return Response({'erro': f'Matrícula {id1} não encontrada.'}, status=404)

                try:
                    mat2 = Matricula.objects.select_related('id_turma', 'id_aluno').get(pk=id2)
                except Matricula.DoesNotExist:
                     return Response({'erro': f'Matrícula {id2} não encontrada.'}, status=404)
                
                # Armazenar turmas para a troca
                turma1 = mat1.id_turma
                turma2 = mat2.id_turma
                
                # Validar se ambas têm turma (para evitar erros se uma for pendente sem turma - regra de negócio opcional)
                if not turma1 or not turma2:
                     return Response({'erro': 'Ambas as matrículas devem ter turmas atribuídas para permutar.'}, status=400)

                if turma1 == turma2:
                    return Response({'erro': 'Os alunos já estão na mesma turma. Permuta desnecessária.'}, status=400)

                # Realizar a troca na Matrícula
                mat1.id_turma = turma2
                mat2.id_turma = turma1
                
                mat1.save()
                mat2.save()
                
                # Atualizar também o registo do Aluno (pois Aluno tem id_turma redundancy)
                aluno1 = mat1.id_aluno
                aluno2 = mat2.id_aluno
                
                aluno1.id_turma = turma2
                aluno2.id_turma = turma1
                aluno1.save()
                aluno2.save()
                
                # Log (Print for now, could be AuditModel)
                print(f"Permuta efetuada: {aluno1.nome_completo} (agora na {turma2}) <-> {aluno2.nome_completo} (agora na {turma1})")

                return Response({
                    'mensagem': 'Permuta realizada com sucesso!',
                    'troca': f"{aluno1.nome_completo} trocou com {aluno2.nome_completo}"
                })

        except Exception as e:
            return Response({'erro': f'Erro ao realizar permuta: {str(e)}'}, status=500)
