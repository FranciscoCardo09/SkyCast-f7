from rest_framework import generics, filters
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from datetime import datetime, date
from .models import TipoProducto, Producto, FechaProducto
from .serializers import (
    TipoProductoSerializer, 
    ProductoSerializer, 
    ProductoListSerializer,
    FechaProductoSerializer
)

class TipoProductoListView(generics.ListAPIView):
    queryset = TipoProducto.objects.all()
    serializer_class = TipoProductoSerializer

class ProductoListView(generics.ListAPIView):
    queryset = Producto.objects.select_related('tipo_producto').prefetch_related('fechas')
    serializer_class = ProductoListSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ['tipo_producto__nombre', 'variable']
    search_fields = ['nombre_archivo', 'tipo_producto__nombre']
    ordering_fields = ['fechas__fecha', 'fechas__hora']
    ordering = ['-fechas__fecha', '-fechas__hora']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtro por tipo
        tipo = self.request.query_params.get('tipo', None)
        if tipo:
            queryset = queryset.filter(tipo_producto__nombre=tipo)
        
        # Filtro por fecha
        fecha = self.request.query_params.get('fecha', None)
        if fecha:
            try:
                fecha_obj = datetime.strptime(fecha, '%Y-%m-%d').date()
                queryset = queryset.filter(fechas__fecha=fecha_obj)
            except ValueError:
                pass
        
        # Filtro por variable (para WRF)
        variable = self.request.query_params.get('variable', None)
        if variable:
            queryset = queryset.filter(variable=variable)
            
        return queryset.distinct()

class ProductoDetailView(generics.RetrieveAPIView):
    queryset = Producto.objects.select_related('tipo_producto').prefetch_related('fechas')
    serializer_class = ProductoSerializer

@api_view(['GET'])
def ultimos_productos(request):
    """Endpoint para obtener los últimos productos de cada tipo"""
    tipos = TipoProducto.objects.all()
    resultados = []
    
    for tipo in tipos:
        ultimo_producto = Producto.objects.filter(
            tipo_producto=tipo
        ).prefetch_related('fechas').first()
        
        if ultimo_producto:
            serializer = ProductoSerializer(ultimo_producto)
            resultados.append(serializer.data)
    
    return Response(resultados)

@api_view(['GET'])
def productos_por_fecha_hora(request):
    """Endpoint específico para WRF con filtros de fecha y hora"""
    fecha = request.query_params.get('fecha')
    hora = request.query_params.get('hora')
    variable = request.query_params.get('variable')
    
    if not fecha or not hora:
        return Response({'error': 'Se requieren parámetros fecha y hora'}, status=400)
    
    try:
        fecha_obj = datetime.strptime(fecha, '%Y-%m-%d').date()
        hora_obj = datetime.strptime(hora, '%H:%M').time()
    except ValueError:
        return Response({'error': 'Formato de fecha u hora inválido'}, status=400)
    
    queryset = Producto.objects.filter(
        fechas__fecha=fecha_obj,
        fechas__hora=hora_obj,
        tipo_producto__nombre='wrf_cba'
    )
    
    if variable:
        queryset = queryset.filter(variable=variable)
    
    serializer = ProductoListSerializer(queryset, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def estadisticas(request):
    """Endpoint con estadísticas generales"""
    from django.db.models import Count
    from datetime import timedelta
    
    hoy = date.today()
    hace_30_dias = hoy - timedelta(days=30)
    
    stats = {
        'total_productos': Producto.objects.count(),
        'total_tipos': TipoProducto.objects.count(),
        'productos_ultimo_mes': FechaProducto.objects.filter(
            fecha__gte=hace_30_dias
        ).count(),
        'productos_por_tipo': list(
            TipoProducto.objects.annotate(
                count=Count('producto')
            ).values('nombre', 'count')
        ),
        'variables_wrf': list(
            Producto.objects.filter(
                tipo_producto__nombre='wrf_cba'
            ).values_list('variable', flat=True).distinct()
        )
    }
    
    return Response(stats)
