from django.shortcuts import render
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib import admin
from apis.dashboard import dashboard_callback

@staff_member_required
def custom_dashboard_view(request):
    print("DEBUG: custom_dashboard_view acessada!")
    
    # Obtem o contexto padrão do admin
    context = admin.site.each_context(request)
    
    # IMPORTANTE: Calcular a app_list para evitar a mensagem "Você não tem permissão..."
    # Isso simula o comportamento da index original do admin
    app_list = admin.site.get_app_list(request)
    
    context.update({
        'title': 'Dashboard Académico',
        'subtitle': 'Visão Geral',
        'app_list': app_list,
        'has_permission': True,
    })
    
    # Popula os dados do dashboard (KPIs e Gráficos)
    context = dashboard_callback(request, context)
    
    return render(request, 'admin/index.html', context)
