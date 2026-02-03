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
    permissoes = serializers.JSONField(source='profile.permissoes', required=False)
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

    def get_papel(self, obj):
        if obj.is_superuser:
            return 'Admin'
        # Check profile logic or other permission logic if needed
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
                    
        return super().to_internal_value(data)
    
    def create(self, validated_data):
        senha = validated_data.pop('senha_hash', None)
        cargo = validated_data.pop('cargo', None)
        papel = self.initial_data.get('papel', 'Comum') # Get papel from raw input
        
        nome_completo = self.initial_data.get('nome_completo', '')
        
        # Split nome to first/last
        names = nome_completo.split(' ', 1)
        if len(names) > 0:
            validated_data['first_name'] = names[0]
        if len(names) > 1:
            validated_data['last_name'] = names[1]
            
        # Default username to email if not provided
        if 'username' not in validated_data and 'email' in validated_data:
            validated_data['username'] = validated_data['email']

        # Handle Admin Status based on 'papel'
        if papel == 'Admin':
            validated_data['is_superuser'] = True
            validated_data['is_staff'] = True
        else:
            validated_data['is_superuser'] = False
            # validated_data['is_staff'] = False # Keep default or specific logic

        user = super().create(validated_data)
        
        if senha:
            user.set_password(senha)
            user.save()
            
        permissoes = self.initial_data.get('permissoes', [])
        # Create Profile (Usuario model)
        Usuario.objects.create(
            user=user,
            email=user.email,
            nome_completo=user.get_full_name(),
            cargo=cargo,
            papel=papel, # Store legacy papel field too
            permissoes=permissoes
        )
            
        return user

    def update(self, instance, validated_data):
        senha = validated_data.pop('senha_hash', None)
        cargo = validated_data.pop('cargo', None)
        papel = self.initial_data.get('papel', None) # Get papel from raw input
        
        nome_completo = self.initial_data.get('nome_completo', None)
        
        if nome_completo is not None:
            names = nome_completo.split(' ', 1)
            if len(names) > 0:
                instance.first_name = names[0]
            if len(names) > 1:
                instance.last_name = names[1]
            else:
                instance.last_name = ''

        # Handle Role update
        if papel:
            if papel == 'Admin':
                instance.is_superuser = True
                instance.is_staff = True
            else:
                instance.is_superuser = False
                instance.is_staff = False

        # Prevent nested write errors by popping 'profile' if it exists (due to permissoes field)
        validated_data.pop('profile', None)

        user = super().update(instance, validated_data)
        
        if senha:
            user.set_password(senha)
            user.save()
            
        permissoes = self.initial_data.get('permissoes', None)
        # Update Profile
        profile, created = Usuario.objects.get_or_create(user=user)
        if cargo:
            profile.cargo = cargo
        if papel:
            profile.papel = papel # Keep synced
        if permissoes is not None:
             profile.permissoes = permissoes
        # Sync basic fields to profile for fallback usage
        profile.nome_completo = user.get_full_name()
        profile.email = user.email
        profile.save()
        
        return user
        
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
