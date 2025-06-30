from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count
from .models import TipoProducto, Producto, FechaProducto
import datetime

@admin.register(TipoProducto)
class TipoProductoAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'descripcion', 'productos_count', 'url_link']
    search_fields = ['nombre', 'descripcion']
    readonly_fields = ['productos_count']
    
    def productos_count(self, obj):
        return obj.producto_set.count()
    productos_count.short_description = 'Productos'
    
    def url_link(self, obj):
        return format_html('<a href="{}" target="_blank">Ver URL</a>', obj.url)
    url_link.short_description = 'URL'

class FechaProductoInline(admin.TabularInline):
    model = FechaProducto
    extra = 0
    readonly_fields = ['fecha_creacion']
    ordering = ['-fecha', '-hora']

@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ['nombre_archivo', 'tipo_producto', 'variable', 'ultima_fecha', 'imagen_preview', 'url_link']
    list_filter = ['tipo_producto', 'variable', 'fechas__fecha']
    search_fields = ['nombre_archivo', 'tipo_producto__nombre', 'variable']
    inlines = [FechaProductoInline]
    readonly_fields = ['imagen_preview', 'ultima_fecha']
    
    fieldsets = (
        ('Información General', {
            'fields': ('tipo_producto', 'nombre_archivo', 'variable')
        }),
        ('Imagen', {
            'fields': ('url_imagen', 'foto', 'imagen_preview')
        }),
        ('Estadísticas', {
            'fields': ('ultima_fecha',),
            'classes': ('collapse',)
        })
    )
    
    def imagen_preview(self, obj):
        if obj.url_imagen:
            return format_html(
                '<img src="{}" style="max-width: 200px; max-height: 200px;" />',
                obj.url_imagen
            )
        return "Sin imagen"
    imagen_preview.short_description = 'Vista previa'
    
    def url_link(self, obj):
        return format_html('<a href="{}" target="_blank">Ver imagen</a>', obj.url_imagen)
    url_link.short_description = 'URL'
    
    def ultima_fecha(self, obj):
        ultima = obj.fechas.first()
        if ultima:
            return f"{ultima.fecha} {ultima.hora}"
        return "Sin fechas"
    ultima_fecha.short_description = 'Última actualización'

@admin.register(FechaProducto)
class FechaProductoAdmin(admin.ModelAdmin):
    list_display = ['producto', 'fecha', 'hora', 'tipo_producto', 'fecha_creacion']
    list_filter = ['fecha', 'producto__tipo_producto', 'producto__variable']
    search_fields = ['producto__nombre_archivo', 'producto__tipo_producto__nombre']
    date_hierarchy = 'fecha'
    
    def tipo_producto(self, obj):
        return obj.producto.tipo_producto.nombre
    tipo_producto.short_description = 'Tipo'
    
    # Filtros personalizados para fechas
    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        
        # Estadísticas para el dashboard
        hoy = datetime.date.today()
        hace_30_dias = hoy - datetime.timedelta(days=30)
        
        stats = {
            'total_productos': Producto.objects.count(),
            'productos_hoy': FechaProducto.objects.filter(fecha=hoy).count(),
            'productos_mes': FechaProducto.objects.filter(fecha__gte=hace_30_dias).count(),
            'tipos_activos': TipoProducto.objects.annotate(
                productos_count=Count('producto__fechas')
            ).filter(productos_count__gt=0).count()
        }
        
        extra_context['stats'] = stats
        return super().changelist_view(request, extra_context)

# Personalizar el admin principal
class WeatherAdminSite(admin.AdminSite):
    site_header = "OHMC - Productos Meteorológicos"
    site_title = "OHMC Admin"
    index_title = "Panel de Control - Productos Meteorológicos"
    
    def index(self, request, extra_context=None):
        extra_context = extra_context or {}
        
        # Dashboard con estadísticas
        hoy = datetime.date.today()
        hace_7_dias = hoy - datetime.timedelta(days=7)
        hace_30_dias = hoy - datetime.timedelta(days=30)
        
        stats = {
            'total_productos': Producto.objects.count(),
            'total_tipos': TipoProducto.objects.count(),
            'productos_semana': FechaProducto.objects.filter(fecha__gte=hace_7_dias).count(),
            'productos_mes': FechaProducto.objects.filter(fecha__gte=hace_30_dias).count(),
            'ultimo_wrf': FechaProducto.objects.filter(
                producto__tipo_producto__nombre='wrf_cba'
            ).first(),
            'ultimo_aire': FechaProducto.objects.filter(
                producto__tipo_producto__nombre='MedicionAire'
            ).first(),
        }
        
        extra_context['dashboard_stats'] = stats
        return super().index(request, extra_context)
