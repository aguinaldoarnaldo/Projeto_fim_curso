from rest_framework.pagination import PageNumberPagination

class LargeResultsSetPagination(PageNumberPagination):
    """
    Paginação que permite sobrescrever o tamanho da página via query param 'page_size'.
    Útil para tabelas com filtros e ordenação no frontend que precisam de todos os dados.
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 5000
