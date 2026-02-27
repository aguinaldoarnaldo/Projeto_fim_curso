import os
import zipfile
import datetime
import subprocess
from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import FileResponse
from apis.permissions.custom_permissions import HasAdditionalPermission

class BackupViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated, HasAdditionalPermission]
    permission_map = {
        'create_backup': 'view_configuracoes',
        'list_backups': 'view_configuracoes',
        'download_backup': 'view_configuracoes',
        'delete_backup': 'view_configuracoes',
        'restore_backup': 'view_configuracoes',
        'upload_and_restore_backup': 'manage_backup'
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
        backup_filename = f"backup_{timestamp}.zip"
        backup_path = os.path.join(self.BACKUP_DIR, backup_filename)
        
        db_backup_filename = f"db_{timestamp}.sql"
        db_backup_path = os.path.join(self.BACKUP_DIR, db_backup_filename)

        try:
            # 1. Database Backup (PostgreSQL)
            db_config = settings.DATABASES['default']
            os.environ['PGPASSWORD'] = db_config['PASSWORD']
            
            pg_dump_path = self._get_pg_dump_path()
            
            dump_cmd = [
                pg_dump_path,
                '-h', db_config['HOST'],
                '-p', str(db_config['PORT']),
                '-U', db_config['USER'],
                '-F', 'p',
                '-f', db_backup_path,
                db_config['NAME']
            ]
            
            result = subprocess.run(
                dump_cmd, 
                check=True, 
                capture_output=True, 
                text=True,
                shell=os.name == 'nt'
            )

            # 2. Zip everything (DB dump + Media folder)
            with zipfile.ZipFile(backup_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                # Add DB dump
                zipf.write(db_backup_path, arcname=db_backup_filename)
                
                # Add Media folder
                media_root = settings.MEDIA_ROOT
                if os.path.exists(media_root):
                    for root, dirs, files in os.walk(media_root):
                        for file in files:
                            file_path = os.path.join(root, file)
                            arcname = os.path.join('media', os.path.relpath(file_path, media_root))
                            zipf.write(file_path, arcname=arcname)

            # Cleanup temporary SQL file
            if os.path.exists(db_backup_path):
                os.remove(db_backup_path)

            return Response({
                'message': 'Backup criado com sucesso!',
                'filename': backup_filename,
                'timestamp': timestamp,
                'size': f"{os.path.getsize(backup_path) / (1024*1024):.2f} MB"
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            if 'PGPASSWORD' in os.environ:
                del os.environ['PGPASSWORD']

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
        filename = request.query_params.get('filename')
        if not filename:
            return Response({'error': 'Filename is required'}, status=400)
            
        file_path = os.path.join(self.BACKUP_DIR, filename)
        if not os.path.exists(file_path):
            return Response({'error': 'File not found'}, status=404)
            
        return FileResponse(open(file_path, 'rb'), as_attachment=True, filename=filename)

    @action(detail=False, methods=['delete'])
    def delete_backup(self, request):
        filename = request.query_params.get('filename')
        if not filename:
             return Response({'error': 'Filename is required'}, status=400)
             
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

            # 2. Descompactar
            with zipfile.ZipFile(backup_path, 'r') as zipf:
                zipf.extractall(temp_dir)

            # 3. Localizar dump SQL
            sql_files = [f for f in os.listdir(temp_dir) if f.endswith('.sql')]
            if not sql_files:
                return Response({'error': 'Dump SQL não encontrado no backup'}, status=400)
            
            sql_path = os.path.join(temp_dir, sql_files[0])

            # 4. Restaurar Base de Dados via psql
            db_config = settings.DATABASES['default']
            os.environ['PGPASSWORD'] = db_config['PASSWORD']
            
            psql_path = self._get_psql_path()
            
            # Comando para restaurar (assume dump em formato plain text conforme create_backup)
            # -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" limpa a base atual
            cleanup_cmd = [
                psql_path,
                '-h', db_config['HOST'],
                '-p', str(db_config['PORT']),
                '-U', db_config['USER'],
                '-d', db_config['NAME'],
                '-c', 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'
            ]
            
            subprocess.run(cleanup_cmd, check=True, shell=os.name == 'nt')

            restore_cmd = [
                psql_path,
                '-h', db_config['HOST'],
                '-p', str(db_config['PORT']),
                '-U', db_config['USER'],
                '-d', db_config['NAME'],
                '-f', sql_path
            ]
            
            subprocess.run(restore_cmd, check=True, capture_output=True, shell=os.name == 'nt')

            # 4.5 Executar migrações para garantir que o BD restaurado seja compatível com o código actual
            migrate_cmd = [sys.executable, os.path.join(settings.BASE_DIR, 'manage.py'), 'migrate']
            subprocess.run(migrate_cmd, check=True, capture_output=True, shell=os.name == 'nt')

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
            if 'PGPASSWORD' in os.environ:
                del os.environ['PGPASSWORD']

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

            # 3. Descompactar
            with zipfile.ZipFile(temp_path, 'r') as zipf:
                zipf.extractall(temp_restore_dir)

            # 4. Localizar dump SQL
            sql_files = [f for f in os.listdir(temp_restore_dir) if f.endswith('.sql')]
            if not sql_files:
                return Response({'error': 'Dump SQL não encontrado no backup enviado'}, status=400)
            
            sql_path = os.path.join(temp_restore_dir, sql_files[0])

            # 5. Restaurar Base de Dados via psql
            db_config = settings.DATABASES['default']
            os.environ['PGPASSWORD'] = db_config['PASSWORD']
            psql_path = self._get_psql_path()
            
            # Limpar schema public (Isso é destrutivo, mas necessário para restauração completa)
            cleanup_cmd = [
                psql_path,
                '-h', db_config['HOST'],
                '-p', str(db_config['PORT']),
                '-U', db_config['USER'],
                '-d', db_config['NAME'],
                '-c', 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'
            ]
            subprocess.run(cleanup_cmd, check=True, shell=os.name == 'nt')

            # Restaurar dump SQL
            restore_cmd = [
                psql_path,
                '-h', db_config['HOST'],
                '-p', str(db_config['PORT']),
                '-U', db_config['USER'],
                '-d', db_config['NAME'],
                '-f', sql_path
            ]
            subprocess.run(restore_cmd, check=True, capture_output=True, shell=os.name == 'nt')

            # 5.5 Executar migrações para garantir que o BD restaurado seja compatível com o código actual
            migrate_cmd = [sys.executable, os.path.join(settings.BASE_DIR, 'manage.py'), 'migrate']
            subprocess.run(migrate_cmd, check=True, capture_output=True, shell=os.name == 'nt')

            # 6. Restaurar ficheiros de Media
            media_temp_src = os.path.join(temp_restore_dir, 'media')
            if os.path.exists(media_temp_src):
                if os.path.exists(settings.MEDIA_ROOT):
                    shutil.rmtree(settings.MEDIA_ROOT)
                shutil.copytree(media_temp_src, settings.MEDIA_ROOT)

            return Response({'message': 'Backup carregado e restaurado com sucesso! O sistema foi redefinido.'})

        except subprocess.CalledProcessError as e:
            error_msg = e.stderr.decode() if e.stderr else str(e)
            return Response({'error': f'Erro na restauração SQL: {error_msg}'}, status=500)
        except Exception as e:
            return Response({'error': str(e)}, status=500)
        finally:
            # Limpeza
            if os.path.exists(temp_path):
                os.remove(temp_path)
            if os.path.exists(temp_restore_dir):
                shutil.rmtree(temp_restore_dir)
            if 'PGPASSWORD' in os.environ:
                del os.environ['PGPASSWORD']
