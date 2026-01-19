from rest_framework import serializers
from apis.models import Cargo, Funcionario, Encarregado, CargoFuncionario


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
            'is_online', 'img_path', 'criado_em', 'atualizado_em'
        ]
        read_only_fields = ['id_funcionario', 'criado_em', 'atualizado_em']
        extra_kwargs = {
            'senha_hash': {'write_only': True}
        }

    def get_cargo_nome(self, obj):
        return obj.id_cargo.nome_cargo if obj.id_cargo else None


class FuncionarioListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagem de Funcionarios"""
    cargo_nome = serializers.SerializerMethodField()
    
    class Meta:
        model = Funcionario
        fields = [
            'id_funcionario', 'codigo_identificacao', 'nome_completo',
            'cargo_nome', 'email', 'status_funcionario', 'is_online'
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
            'senha_hash': {'write_only': True}
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
