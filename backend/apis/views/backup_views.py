import os
import zipfile
import datetime
import subprocess
import sys
from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import FileResponse
from django.core.cache import cache
import uuid
from apis.permissions.custom_permissions import HasAdditionalPermission

class BackupViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated, HasAdditionalPermission]
    permission_map = {
        'create_backup': 'view_configuracoes',
        'list_backups': 'view_configuracoes',
        'download_backup': 'view_configuracoes',
        'delete_backup': 'view_configuracoes',
        'restore_backup': 'view_configuracoes',
        'upload_and_restore_backup': 'manage_backup',
        'get_download_token': 'view_configuracoes',
        # download_public não precisa de permissão mapeada aqui pois valida o token internamente
    }

    BACKUP_DIR = os.path.join(settings.BASE_DIR, 'backups')

    def _ensure_backup_dir(self):
        if not os.path.exists(self.BACKUP_DIR):
            os.makedirs(self.BACKUP_DIR)

    def _get_pg_dump_path(self):
        # 1. Tentar o comando simples (se estiver no PATH)
        try:
            import shutil
            path = shutil.which('pg_dump')
            if path:
                return path
        except:
            pass

        # 2. Caminhos comuns no Windows
        if os.name == 'nt':
            common_bases = [
                r"C:\Program Files\PostgreSQL",
                r"C:\Program Files (x86)\PostgreSQL",
            ]
            for base in common_bases:
                if os.path.exists(base):
                    versions = sorted(os.listdir(base), reverse=True) # Versões mais recentes primeiro
                    for v in versions:
                        full_path = os.path.join(base, v, "bin", "pg_dump.exe")
                        if os.path.exists(full_path):
                            return full_path
        
        return 'pg_dump' # Fallback ao comando simples

    @action(detail=False, methods=['post'])
    def create_backup(self, request):
        self._ensure_backup_dir()
        timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_filename = f"backup_{timestamp}" # sem .zip aqui, o make_archive adiciona
        final_zip_name = f"{backup_filename}.zip"
        backup_path = os.path.join(self.BACKUP_DIR, final_zip_name)
        
        db_backup_filename = f"db_{timestamp}.sql"
        db_backup_path = os.path.join(self.BACKUP_DIR, db_backup_filename)
        
        import shutil
        import tempfile
        
        # Criar um diretório temporário para reunir o que será zipado
        temp_dir = tempfile.mkdtemp(dir=self.BACKUP_DIR)
        
        try:
            # Parâmetros opcionais
            exclude_media = request.data.get('exclude_media', False)
            if isinstance(exclude_media, str):
                exclude_media = exclude_media.lower() == 'true'

            print(f"[{datetime.datetime.now()}] Iniciando backup: {backup_filename} (Apenas BD: {exclude_media})")
            
            # 1. Database Backup (PostgreSQL)
            db_config = settings.DATABASES['default']
            
            # Build environment with PGPASSWORD so pg_dump authenticates without prompt
            env = os.environ.copy()
            env['PGPASSWORD'] = db_config.get('PASSWORD', '')
            
            pg_dump_path = self._get_pg_dump_path()
            
            dump_cmd = [
                pg_dump_path,
                '-h', db_config.get('HOST', 'localhost'),
                '-p', str(db_config.get('PORT', 5432)),
                '-U', db_config.get('USER', 'postgres'),
                '-F', 'p',  # plain SQL text format
                '--no-owner',  # omit ownership commands (safer to restore)
                '--no-acl',    # omit privilege commands
                '-f', os.path.join(temp_dir, db_backup_filename),
                db_config.get('NAME', '')
            ]
            
            print(f"[{datetime.datetime.now()}] Executando pg_dump na BD: {db_config.get('NAME')} @ {db_config.get('HOST')}:{db_config.get('PORT')}")
            result = subprocess.run(
                dump_cmd,
                check=True,
                capture_output=True,
                text=True,
                env=env,
                shell=False  # NEVER use shell=True with a list — args would be mishandled on Windows
            )
            
            # Verify dump actually produced a file with content
            dump_file = os.path.join(temp_dir, db_backup_filename)
            if not os.path.exists(dump_file) or os.path.getsize(dump_file) == 0:
                raise Exception('pg_dump executou mas não gerou ficheiro SQL. Verifique as credenciais da BD.')
            
            print(f"[{datetime.datetime.now()}] pg_dump concluído. SQL: {os.path.getsize(dump_file) / 1024:.1f} KB")

            # 2. Copiar Media para o diretório temporário (apenas se não for exclude_media)
            if not exclude_media:
                media_root = settings.MEDIA_ROOT
                if os.path.exists(media_root):
                    print(f"[{datetime.datetime.now()}] Copiando pasta media...")
                    temp_media_path = os.path.join(temp_dir, 'media')
                    # Ignorar a própria pasta de backups se ela estiver dentro de media (não deve estar)
                    shutil.copytree(media_root, temp_media_path, dirs_exist_ok=True)
            else:
                print(f"[{datetime.datetime.now()}] Ignorando pasta media conforme solicitado.")

            # 3. Zip tudo eficientemente usando shutil.make_archive
            print(f"[{datetime.datetime.now()}] Criando arquivo ZIP...")
            # base_name sem extensão, root_dir é a pasta a ser zipada
            shutil.make_archive(
                os.path.join(self.BACKUP_DIR, backup_filename), 
                'zip', 
                temp_dir
            )

            size_mb = os.path.getsize(backup_path) / (1024*1024)
            print(f"[{datetime.datetime.now()}] Backup concluído com sucesso. Tamanho: {size_mb:.2f} MB")

            return Response({
                'message': 'Backup criado com sucesso!',
                'filename': final_zip_name,
                'timestamp': timestamp,
                'size': f"{size_mb:.2f} MB"
            }, status=status.HTTP_201_CREATED)

        except subprocess.CalledProcessError as e:
            err_detail = e.stderr if e.stderr else str(e)
            print(f"[{datetime.datetime.now()}] ERRO pg_dump: {err_detail}")
            return Response({'error': f'Erro ao executar pg_dump: {err_detail}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            print(f"[{datetime.datetime.now()}] ERRO NO BACKUP: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)

    @action(detail=False, methods=['get'])
    def list_backups(self, request):
        self._ensure_backup_dir()
        backups = []
        for file in os.listdir(self.BACKUP_DIR):
            if file.endswith('.zip'):
                file_path = os.path.join(self.BACKUP_DIR, file)
                stats = os.stat(file_path)
                backups.append({
                    'filename': file,
                    'size': f"{stats.st_size / (1024*1024):.2f} MB",
                    'created_at': datetime.datetime.fromtimestamp(stats.st_ctime).strftime('%Y-%m-%d %H:%M:%S')
                })
        
        # Sort by creation time descending
        backups.sort(key=lambda x: x['created_at'], reverse=True)
        return Response(backups)

    @action(detail=False, methods=['get'])
    def download_backup(self, request):
        # Este método agora é mantido apenas por retrocompatibilidade ou para pequenos arquivos
        # Para arquivos grandes, recomendamos usar o get_download_token + download_public
        filename = request.query_params.get('filename')
        if not filename:
            return Response({'error': 'Filename is required'}, status=400)
            
        filename = os.path.basename(filename)
        file_path = os.path.join(self.BACKUP_DIR, filename)
        
        if not os.path.exists(file_path):
            return Response({'error': 'File not found'}, status=404)
            
        return FileResponse(open(file_path, 'rb'), as_attachment=True, filename=filename)

    @action(detail=False, methods=['get'])
    def get_download_token(self, request):
        filename = request.query_params.get('filename')
        if not filename:
            return Response({'error': 'Filename is required'}, status=400)
        
        # Validar se o ficheiro existe
        filename = os.path.basename(filename)
        file_path = os.path.join(self.BACKUP_DIR, filename)
        if not os.path.exists(file_path):
            return Response({'error': 'File not found'}, status=404)
            
        # Gerar token único válido por 2 minutos
        token = str(uuid.uuid4())
        cache.set(f"download_token_{token}", filename, timeout=120)
        
        return Response({'token': token})

    @action(detail=False, methods=['get'], permission_classes=[]) # Público, mas validado por token
    def download_public(self, request):
        token = request.query_params.get('token')
        if not token:
            return Response({'error': 'Token is required'}, status=403)
            
        filename = cache.get(f"download_token_{token}")
        if not filename:
            return Response({'error': 'Token inválido ou expirado'}, status=403)
            
        # Limpar o token para ser de uso único
        cache.delete(f"download_token_{token}")
            
        file_path = os.path.join(self.BACKUP_DIR, filename)
        if not os.path.exists(file_path):
            return Response({'error': 'Ficheiro original não encontrado'}, status=404)
            
        response = FileResponse(open(file_path, 'rb'), as_attachment=True, filename=filename)
        # Forçar o browser a tratar como download directo
        response['Content-Type'] = 'application/zip'
        return response

    @action(detail=False, methods=['delete'])
    def delete_backup(self, request):
        filename = request.query_params.get('filename')
        if not filename:
             return Response({'error': 'Filename is required'}, status=400)
             
        # Segurança: Impedir Path Traversal
        filename = os.path.basename(filename)
        file_path = os.path.join(self.BACKUP_DIR, filename)
        
        if os.path.exists(file_path):
            os.remove(file_path)
            return Response({'message': 'Backup eliminado com sucesso!'})
        return Response({'error': 'Ficheiro não encontrado'}, status=404)

    def _get_psql_path(self):
        # 1. Tentar o comando simples
        try:
            import shutil
            path = shutil.which('psql')
            if path:
                return path
        except:
            pass

        # 2. Caminhos comuns no Windows (seguindo a lógica do pg_dump)
        if os.name == 'nt':
            common_bases = [
                r"C:\Program Files\PostgreSQL",
                r"C:\Program Files (x86)\PostgreSQL",
            ]
            for base in common_bases:
                if os.path.exists(base):
                    versions = sorted(os.listdir(base), reverse=True)
                    for v in versions:
                        full_path = os.path.join(base, v, "bin", "psql.exe")
                        if os.path.exists(full_path):
                            return full_path
        
        return 'psql'

    @action(detail=False, methods=['post'])
    def restore_backup(self, request):
        filename = request.data.get('filename')
        if not filename:
            return Response({'error': 'Nome do ficheiro é obrigatório'}, status=400)

        # Segurança: Impedir Path Traversal
        filename = os.path.basename(filename)
        backup_path = os.path.join(self.BACKUP_DIR, filename)
        
        if not os.path.exists(backup_path):
            return Response({'error': 'Ficheiro não encontrado'}, status=404)

        import shutil
        temp_dir = os.path.join(self.BACKUP_DIR, 'temp_restore')
        
        try:
            # 1. Limpar e criar diretório temporário
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)
            os.makedirs(temp_dir)

            # 2. Descompactar (Seguro contra Zip Slip)
            def is_within_directory(directory, target):
                abs_directory = os.path.abspath(directory)
                abs_target = os.path.abspath(target)
                prefix = os.path.commonpath([abs_directory])
                return os.path.commonpath([abs_directory, abs_target]) == prefix

            def safe_extract(tar, path=".", members=None, *, numeric_owner=False):
                for member in tar.infolist():
                    member_path = os.path.join(path, member.filename)
                    if not is_within_directory(path, member_path):
                        raise Exception("Tentativa de Zip Slip detectada!")
                tar.extractall(path, members)

            with zipfile.ZipFile(backup_path, 'r') as zipf:
                safe_extract(zipf, temp_dir)

            # 3. Localizar dump SQL
            sql_files = [f for f in os.listdir(temp_dir) if f.endswith('.sql')]
            if not sql_files:
                return Response({'error': 'Dump SQL não encontrado no backup'}, status=400)
            
            sql_path = os.path.join(temp_dir, sql_files[0])

            # 4. Restaurar Base de Dados via psql
            db_config = settings.DATABASES['default']
            env = os.environ.copy()
            env['PGPASSWORD'] = db_config.get('PASSWORD', '')
            
            psql_path = self._get_psql_path()
            
            cleanup_cmd = [
                psql_path,
                '-h', db_config.get('HOST', 'localhost'),
                '-p', str(db_config.get('PORT', 5432)),
                '-U', db_config.get('USER', 'postgres'),
                '-d', db_config.get('NAME', ''),
                '-c', 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'
            ]
            subprocess.run(cleanup_cmd, check=True, env=env, shell=False)

            restore_cmd = [
                psql_path,
                '-h', db_config.get('HOST', 'localhost'),
                '-p', str(db_config.get('PORT', 5432)),
                '-U', db_config.get('USER', 'postgres'),
                '-d', db_config.get('NAME', ''),
                '-f', sql_path
            ]
            subprocess.run(restore_cmd, check=True, capture_output=True, env=env, shell=False)

            migrate_cmd = [sys.executable, os.path.join(settings.BASE_DIR, 'manage.py'), 'migrate']
            subprocess.run(migrate_cmd, check=True, capture_output=True, shell=False)

            # 5. Restaurar Media
            media_temp_src = os.path.join(temp_dir, 'media')
            if os.path.exists(media_temp_src):
                # Remove pasta media atual e substitui
                if os.path.exists(settings.MEDIA_ROOT):
                    shutil.rmtree(settings.MEDIA_ROOT)
                shutil.copytree(media_temp_src, settings.MEDIA_ROOT)

            return Response({'message': 'Backup restaurado com sucesso! O sistema foi revertido para o estado anterior.'})

        except subprocess.CalledProcessError as e:
            error_msg = e.stderr.decode() if e.stderr else str(e)
            return Response({'error': f'Erro na restauração SQL: {error_msg}'}, status=500)
        except Exception as e:
            return Response({'error': str(e)}, status=500)
        finally:
            # Limpeza
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)
            os.environ.pop('PGPASSWORD', None)

    @action(detail=False, methods=['post'])
    def upload_and_restore_backup(self, request):
        if 'file' not in request.FILES:
            return Response({'error': 'Nenhum ficheiro enviado'}, status=status.HTTP_400_BAD_REQUEST)
        
        uploaded_file = request.FILES['file']
        if not uploaded_file.name.endswith('.zip'):
            return Response({'error': 'Apenas ficheiros .zip são permitidos'}, status=status.HTTP_400_BAD_REQUEST)

        self._ensure_backup_dir()
        timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        temp_filename = f"upload_temp_{timestamp}.zip"
        temp_path = os.path.join(self.BACKUP_DIR, temp_filename)
        
        import shutil
        temp_restore_dir = os.path.join(self.BACKUP_DIR, f'temp_restore_upload_{timestamp}')
        
        try:
            # 1. Salvar temporariamente o ficheiro enviado
            with open(temp_path, 'wb+') as destination:
                for chunk in uploaded_file.chunks():
                    destination.write(chunk)

            # 2. Criar diretório temporário para extração
            if os.path.exists(temp_restore_dir):
                shutil.rmtree(temp_restore_dir)
            os.makedirs(temp_restore_dir)

            # 3. Descompactar (Seguro contra Zip Slip)
            def is_within_directory(directory, target):
                abs_directory = os.path.abspath(directory)
                abs_target = os.path.abspath(target)
                prefix = os.path.commonpath([abs_directory])
                return os.path.commonpath([abs_directory, abs_target]) == prefix

            def safe_extract(tar, path=".", members=None, *, numeric_owner=False):
                for member in tar.infolist():
                    member_path = os.path.join(path, member.filename)
                    if not is_within_directory(path, member_path):
                        raise Exception("Tentativa de Zip Slip detectada!")
                tar.extractall(path, members)

            with zipfile.ZipFile(temp_path, 'r') as zipf:
                safe_extract(zipf, temp_restore_dir)

            # 4. Localizar dump SQL
            sql_files = [f for f in os.listdir(temp_restore_dir) if f.endswith('.sql')]
            if not sql_files:
                return Response({'error': 'Dump SQL não encontrado no backup enviado'}, status=400)
            
            sql_path = os.path.join(temp_restore_dir, sql_files[0])

            # 5. Restaurar Base de Dados via psql
            db_config = settings.DATABASES['default']
            env = os.environ.copy()
            env['PGPASSWORD'] = db_config.get('PASSWORD', '')
            psql_path = self._get_psql_path()
            
            cleanup_cmd = [
                psql_path,
                '-h', db_config.get('HOST', 'localhost'),
                '-p', str(db_config.get('PORT', 5432)),
                '-U', db_config.get('USER', 'postgres'),
                '-d', db_config.get('NAME', ''),
                '-c', 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'
            ]
            subprocess.run(cleanup_cmd, check=True, env=env, shell=False)

            restore_cmd = [
                psql_path,
                '-h', db_config.get('HOST', 'localhost'),
                '-p', str(db_config.get('PORT', 5432)),
                '-U', db_config.get('USER', 'postgres'),
                '-d', db_config.get('NAME', ''),
                '-f', sql_path
            ]
            subprocess.run(restore_cmd, check=True, capture_output=True, env=env, shell=False)

            migrate_cmd = [sys.executable, os.path.join(settings.BASE_DIR, 'manage.py'), 'migrate']
            subprocess.run(migrate_cmd, check=True, capture_output=True, shell=False)

            # 6. Restaurar ficheiros de Media
            media_temp_src = os.path.join(temp_restore_dir, 'media')
            if os.path.exists(media_temp_src):
                if os.path.exists(settings.MEDIA_ROOT):
                    shutil.rmtree(settings.MEDIA_ROOT)
                shutil.copytree(media_temp_src, settings.MEDIA_ROOT)

            return Response({'message': 'Backup carregado e restaurado com sucesso! O sistema foi redefinido.'})

        except subprocess.CalledProcessError as e:
            error_msg = e.stderr if isinstance(e.stderr, str) else (e.stderr.decode() if e.stderr else str(e))
            return Response({'error': f'Erro na restauração SQL: {error_msg}'}, status=500)
        except Exception as e:
            return Response({'error': str(e)}, status=500)
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            if os.path.exists(temp_restore_dir):
                shutil.rmtree(temp_restore_dir)
    @action(detail=False, methods=['post'])
    def clean_orphans(self, request):
        """
        Executa o script de limpeza de arquivos órfãos (arquivos no disco sem registro na BD)
        """
        import sys
        from core.settings import BASE_DIR
        import subprocess

        script_path = os.path.join(BASE_DIR, 'clean_orphan_media.py')
        
        if not os.path.exists(script_path):
            return Response({'error': 'Script de limpeza não encontrado no servidor.'}, status=404)

        try:
            # Executar o script em um processo separado
            result = subprocess.run(
                [sys.executable, script_path],
                capture_output=True,
                text=True,
                shell=False
            )
            
            if result.returncode == 0:
                return Response({'message': result.stdout or 'Limpeza concluída com sucesso!'})
            else:
                return Response({'error': f'Erro no script: {result.stderr}'}, status=500)
                
        except Exception as e:
            return Response({'error': str(e)}, status=500)
