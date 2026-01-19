from rest_framework import serializers
from apis.models import Categoria, Livro


class CategoriaSerializer(serializers.ModelSerializer):
    """Serializer para Categoria"""
    
    class Meta:
        model = Categoria
        fields = ['id_categoria', 'nome_categoria']
        read_only_fields = ['id_categoria']


class LivroSerializer(serializers.ModelSerializer):
    """Serializer para Livro"""
    categoria_nome = serializers.CharField(source='id_categoria.nome_categoria', read_only=True)
    responsavel_nome = serializers.CharField(source='id_responsavel.nome_completo', read_only=True)
    
    class Meta:
        model = Livro
        fields = [
            'id_livro', 'titulo', 'editora', 'id_responsavel', 'responsavel_nome',
            'caminho_arquivo', 'id_categoria', 'categoria_nome', 'data_upload'
        ]
        read_only_fields = ['id_livro', 'data_upload']


class LivroListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagem de Livros"""
    categoria_nome = serializers.CharField(source='id_categoria.nome_categoria', read_only=True)
    
    class Meta:
        model = Livro
        fields = ['id_livro', 'titulo', 'editora', 'categoria_nome', 'data_upload','caminho_arquivo']
