from rest_framework import serializers
from django.contrib.auth.models import User
from apis.models import Cargo, Funcionario, Encarregado, CargoFuncionario, Usuario


class UsuarioSerializer(serializers.ModelSerializer):
    """Serializer para Auth User do Django e Profile"""
    nome_completo = serializers.SerializerMethodField()
    papel = serializers.SerializerMethodField()
    cargo = serializers.PrimaryKeyRelatedField(
        queryset=Cargo.objects.all(), 
        required=False, 
        allow_null=True, 
        write_only=True
    )
    img_path = serializers.ImageField(source='profile.img_path', read_only=True)
    permissoes = serializers.JSONField(source='profile.permissoes', read_only=True)
    is_online = serializers.BooleanField(source='profile.is_online', read_only=True)
    cargo_nome = serializers.SerializerMethodField()
    id_usuario = serializers.IntegerField(source='id', read_only=True)
    senha_hash = serializers.CharField(write_only=True, required=False) # Para compatibilidade com frontend

    class Meta:
        model = User
        fields = [
            'id_usuario', 'id', 'username', 'email', 'first_name', 'last_name',
            'nome_completo', 'is_active', 'is_superuser', 'is_staff', 
            'papel', 'cargo', 'cargo_nome', 'senha_hash', 'date_joined', 'img_path', 'permissoes', 'is_online'
        ]
        read_only_fields = ['id_usuario', 'id', 'date_joined']
        extra_kwargs = {
            'username': {'required': False, 'allow_blank': True},
            'email': {'required': True, 'allow_blank': False}
        }

    def get_nome_completo(self, obj):
        full = obj.get_full_name()
        return full if full else obj.username

    def validate_email(self, value):
        if not value:
            raise serializers.ValidationError("O email é obrigatório.")
            
        # Check if email exists in Usuario table (since it has independent unique constraint)
        # We need to handle Update vs Create scenarios
        usuario_qs = Usuario.objects.filter(email=value)
        
        if self.instance:
            # Updating existing user - exclude current user's profile
            if hasattr(self.instance, 'profile'):
                usuario_qs = usuario_qs.exclude(pk=self.instance.profile.pk)
        
        if usuario_qs.exists():
            raise serializers.ValidationError("Este endereço de email já está sendo usado por outro usuário. Por favor, utilize um email diferente.")
            
        return value

    def get_papel(self, obj):
        if obj.is_superuser:
            return 'Admin'
        
        # Tentar obter do perfil Usuario (profile)
        if hasattr(obj, 'profile') and obj.profile.papel:
            return obj.profile.papel
            
        if obj.is_staff:
            return 'Equipe'
        return 'Comum'
        
    def get_cargo_nome(self, obj):
        if hasattr(obj, 'profile') and obj.profile.cargo:
            return obj.profile.cargo.nome_cargo
        return None
    
    def to_internal_value(self, data):
        """Tratar strings 'null'/'undefined' vindas de FormData"""
        if hasattr(data, 'getlist'): # QueryDict (FormData)
            data = data.dict()
        
        # Copiar para permitir modificação se necessário
        if isinstance(data, dict):
            data = data.copy()
            for key in ['cargo', 'papel']:
                if key in data and (data[key] == 'null' or data[key] == 'undefined' or data[key] == ''):
                    data[key] = None
            
            # Tratar permissões se vierem como string JSON (comum em FormData)
            if 'permissoes' in data and isinstance(data['permissoes'], str):
                import json
                try:
                    data['permissoes'] = json.loads(data['permissoes'])
                except:
                    pass
                    
        return super().to_internal_value(data)
    
    def create(self, validated_data):
        senha = validated_data.pop('senha_hash', None)
        cargo = validated_data.pop('cargo', None)
        papel = self.initial_data.get('papel', 'Comum') 
        
        nome_completo = self.initial_data.get('nome_completo', '')
        
        names = nome_completo.split(' ', 1)
        if len(names) > 0:
            validated_data['first_name'] = names[0]
        if len(names) > 1:
            validated_data['last_name'] = names[1]
            
        if 'username' not in validated_data and 'email' in validated_data:
            validated_data['username'] = validated_data['email']

        if papel == 'Admin':
            validated_data['is_superuser'] = True
            validated_data['is_staff'] = True
        else:
            validated_data['is_superuser'] = False

        user = super().create(validated_data)
        
        if senha:
            user.set_password(senha)
            user.save()
            
        # Obter permissões do validated_data (processado pelo source ou manualmente)
        # Se source='profile.permissoes' estiver funcionando, ele não estará no root do validated_data.
        # Mas como usamos source, o DRF tenta mapear. Vamos pegar de onde ele estiver.
        permissoes = self.initial_data.get('permissoes', [])
        if isinstance(permissoes, str):
             import json
             try: permissoes = json.loads(permissoes)
             except: permissoes = []
             
        img_path = self.initial_data.get('img_path', None)
        
        Usuario.objects.create(
            user=user,
            email=user.email,
            nome_completo=user.get_full_name(),
            cargo=cargo,
            papel=papel,
            permissoes=permissoes,
            img_path=img_path
        )
            
        return user

    def update(self, instance, validated_data):
        senha = validated_data.pop('senha_hash', None)
        cargo = validated_data.pop('cargo', None)
        papel = self.initial_data.get('papel', None)
        
        nome_completo = self.initial_data.get('nome_completo', None)
        
        if nome_completo is not None:
            names = nome_completo.split(' ', 1)
            if len(names) > 0:
                instance.first_name = names[0]
            if len(names) > 1:
                instance.last_name = names[1]
            else:
                instance.last_name = ''

        if papel:
            if papel == 'Admin':
                instance.is_superuser = True
                instance.is_staff = True
            else:
                instance.is_superuser = False

        if senha:
            instance.set_password(senha)
            
        instance.save()
        
        # Update Profile
        profile, created = Usuario.objects.get_or_create(user=instance)
        
        if cargo is not None:
             profile.cargo = cargo
        
        if papel:
             profile.papel = papel
             
        # Tentar pegar permissões do root (devido ao tratamento em to_internal_value)
        # Se vier como string JSON no initial_data, o to_internal_value já deve ter colocado no local certo,
        # mas por segurança, verificamos ambos.
        permissoes = self.initial_data.get('permissoes')
        if permissoes is not None:
             if isinstance(permissoes, str):
                 import json
                 try: permissoes = json.loads(permissoes)
                 except: pass
             profile.permissoes = permissoes
             
        img_path = self.initial_data.get('img_path', None)
        if img_path:
             profile.img_path = img_path
             
        if nome_completo:
            profile.nome_completo = nome_completo
            
        profile.save()
        
        return instance
        
    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Add cargo ID manually to response if needed specifically
        if hasattr(instance, 'profile') and instance.profile.cargo:
            ret['cargo'] = instance.profile.cargo.id_cargo
        return ret


class CargoSerializer(serializers.ModelSerializer):
    """Serializer para Cargo"""
    
    class Meta:
        model = Cargo
        fields = ['id_cargo', 'nome_cargo', 'criado_em', 'atualizado_em']
        read_only_fields = ['id_cargo', 'criado_em', 'atualizado_em']


class FuncionarioSerializer(serializers.ModelSerializer):
    """Serializer para Funcionario"""
    cargo_nome = serializers.SerializerMethodField()
    
    class Meta:
        model = Funcionario
        fields = [
            'id_funcionario', 'numero_bi', 'codigo_identificacao', 'nome_completo',
            'id_cargo', 'cargo_nome', 'genero', 'email', 'telefone',
            'provincia_residencia', 'municipio_residencia', 'bairro_residencia',
            'senha_hash', 'status_funcionario', 'descricao', 'data_admissao',
            'is_online', 'img_path', 'permissoes_adicionais', 'criado_em', 'atualizado_em'
        ]
        read_only_fields = ['id_funcionario', 'criado_em', 'atualizado_em', 'codigo_identificacao']
        extra_kwargs = {
            'senha_hash': {'write_only': True, 'required': False},
            'genero': {'required': False},
            'telefone': {'required': False},
            'provincia_residencia': {'required': False},
            'municipio_residencia': {'required': False},
            'bairro_residencia': {'required': False},
            'descricao': {'required': False},
            'data_admissao': {'required': False},
            'status_funcionario': {'required': False},
            'numero_bi': {'required': False, 'allow_blank': True, 'allow_null': True},
            'email': {'required': False, 'allow_blank': True, 'allow_null': True},
            'permissoes_adicionais': {'required': False},
        }

    def validate_numero_bi(self, value):
        if not value:
            return None
        return value

    def validate_email(self, value):
        if not value:
            return None
        return value

    def get_cargo_nome(self, obj):
        return obj.id_cargo.nome_cargo if obj.id_cargo else None


class FuncionarioListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagem de Funcionarios"""
    cargo_nome = serializers.SerializerMethodField()
    
    class Meta:
        model = Funcionario
        fields = [
            'id_funcionario', 'codigo_identificacao', 'nome_completo',
            'cargo_nome', 'email', 'status_funcionario', 'is_online', 'permissoes_adicionais'
        ]

    def get_cargo_nome(self, obj):
        return obj.id_cargo.nome_cargo if obj.id_cargo else None


class EncarregadoSerializer(serializers.ModelSerializer):
    """Serializer para Encarregado"""
    
    class Meta:
        model = Encarregado
        fields = [
            'id_encarregado', 'nome_completo', 'email', 'telefone',
            'provincia_residencia', 'municipio_residencia', 'bairro_residencia',
            'numero_casa', 'senha_hash', 'img_path', 'is_online',
            'criado_em', 'atualizado_em'
        ]
        read_only_fields = ['id_encarregado', 'criado_em', 'atualizado_em']
        extra_kwargs = {
            'senha_hash': {'write_only': True, 'required': False}
        }


class EncarregadoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagem de Encarregados"""
    
    class Meta:
        model = Encarregado
        fields = ['id_encarregado', 'nome_completo', 'email', 'telefone']


class CargoFuncionarioSerializer(serializers.ModelSerializer):
    """Serializer para CargoFuncionario"""
    cargo_nome = serializers.CharField(source='id_cargo.nome_cargo', read_only=True)
    funcionario_nome = serializers.CharField(source='id_funcionario.nome_completo', read_only=True)
    
    class Meta:
        model = CargoFuncionario
        fields = [
            'id_cargo_funcionario', 'id_cargo', 'cargo_nome',
            'id_funcionario', 'funcionario_nome', 'data_inicio', 'data_fim'
        ]
        read_only_fields = ['id_cargo_funcionario']
