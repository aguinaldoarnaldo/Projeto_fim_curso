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
        'delete_backup': 'view_configuracoes'
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
