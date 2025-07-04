from django.urls import path
from . import views

urlpatterns = [
    path('tipos/', views.TipoProductoListView.as_view(), name='tipos-list'),
    path('productos/', views.ProductoListView.as_view(), name='productos-list'),
    path('productos/<int:pk>/', views.ProductoDetailView.as_view(), name='producto-detail'),
    path('ultimos/', views.ultimos_productos, name='ultimos-productos'),
    path('productos/fecha-hora/', views.productos_por_fecha_hora, name='productos-fecha-hora'),
    path('estadisticas/', views.estadisticas, name='estadisticas'),
    
    # Nuevos endpoints para consultar disponibilidad
    path('fechas-disponibles/', views.fechas_disponibles, name='fechas-disponibles'),
    path('horas-disponibles/', views.horas_disponibles, name='horas-disponibles'),
    path('variables-disponibles/', views.variables_disponibles, name='variables-disponibles'),
]
