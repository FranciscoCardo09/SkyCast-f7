from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count, Q
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import TipoProducto, Producto, FechaProducto
import datetime

# Admin personalizado con dashboard mejorado
class WeatherAdminSite(admin.AdminSite):
    site_header = "🌤️ OHMC - Observatorio Hidrometeorológico"
    site_title = "OHMC Admin"
    index_title = "Panel de Control Meteorológico"
    
    def index(self, request, extra_context=None):
        extra_context = extra_context or {}
        
        # Estadísticas del dashboard
        hoy = datetime.date.today()
        hace_7_dias = hoy - datetime.timedelta(days=7)
        hace_30_dias = hoy - datetime.timedelta(days=30)
        
        # Estadísticas generales
        stats = {
            'total_productos': Producto.objects.count(),
            'total_tipos': TipoProducto.objects.count(),
            'productos_hoy': FechaProducto.objects.filter(fecha=hoy).count(),
            'productos_semana': FechaProducto.objects.filter(fecha__gte=hace_7_dias).count(),
            'productos_mes': FechaProducto.objects.filter(fecha__gte=hace_30_dias).count(),
        }
        
        # Últimas actualizaciones por tipo
        ultimas_actualizaciones = []
        for tipo in TipoProducto.objects.all():
            ultima = FechaProducto.objects.filter(
                producto__tipo_producto=tipo
            ).first()
            if ultima:
                ultimas_actualizaciones.append({
                    'tipo': tipo.nombre,
                    'fecha': ultima.fecha,
                    'hora': ultima.hora,
                    'producto': ultima.producto.nombre_archivo
                })
        
        # Productos más recientes
        productos_recientes = FechaProducto.objects.select_related(
            'producto__tipo_producto'
        ).order_by('-fecha_creacion')[:10]
        
        extra_context.update({
            'dashboard_stats': stats,
            'ultimas_actualizaciones': ultimas_actualizaciones,
            'productos_recientes': productos_recientes,
        })
        
        return super().index(request, extra_context)

# Crear instancia del admin personalizado
admin_site = WeatherAdminSite(name='weather_admin')

@admin.register(TipoProducto, site=admin_site)
class TipoProductoAdmin(admin.ModelAdmin):
    list_display = ['nombre_con_icono', 'descripcion_corta', 'productos_count', 'ultima_actualizacion', 'url_link']
    search_fields = ['nombre', 'descripcion']
    readonly_fields = ['productos_count', 'ultima_actualizacion']
    
    fieldsets = (
        ('📊 Información General', {
            'fields': ('nombre', 'descripcion', 'url')
        }),
        ('📈 Estadísticas', {
            'fields': ('productos_count', 'ultima_actualizacion'),
            'classes': ('collapse',)
        })
    )
    
    def nombre_con_icono(self, obj):
        iconos = {
            'wrf_cba': '🌡️',
            'MedicionAire': '🌬️',
            'FWI': '🔥',
            'rutas_caminera': '🛣️'
        }
        icono = iconos.get(obj.nombre, '📊')
        return format_html('{} <strong>{}</strong>', icono, obj.nombre)
    nombre_con_icono.short_description = 'Tipo de Producto'
    
    def descripcion_corta(self, obj):
        return obj.descripcion[:100] + '...' if len(obj.descripcion) > 100 else obj.descripcion
    descripcion_corta.short_description = 'Descripción'
    
    def productos_count(self, obj):
        count = obj.producto_set.count()
        return format_html(
            '<span style="background: #e3f2fd; padding: 4px 8px; border-radius: 12px; color: #1976d2;">{} productos</span>',
            count
        )
    productos_count.short_description = 'Total Productos'
    
    def ultima_actualizacion(self, obj):
        ultima = FechaProducto.objects.filter(
            producto__tipo_producto=obj
        ).first()
        if ultima:
            return format_html(
                '<span style="color: #4caf50;">📅 {} 🕐 {}</span>',
                ultima.fecha, ultima.hora
            )
        return format_html('<span style="color: #f44336;">Sin datos</span>')
    ultima_actualizacion.short_description = 'Última Actualización'
    
    def url_link(self, obj):
        return format_html(
            '<a href="{}" target="_blank" style="background: #4caf50; color: white; padding: 4px 8px; border-radius: 4px; text-decoration: none;">🔗 Ver URL</a>',
            obj.url
        )
    url_link.short_description = 'Enlace'

class FechaProductoInline(admin.TabularInline):
    model = FechaProducto
    extra = 0
    readonly_fields = ['fecha_creacion', 'tiempo_transcurrido']
    ordering = ['-fecha', '-hora']
    max_num = 10
    
    def tiempo_transcurrido(self, obj):
        if obj.fecha_creacion:
            delta = datetime.datetime.now(datetime.timezone.utc) - obj.fecha_creacion
            if delta.days > 0:
                return f"Hace {delta.days} días"
            elif delta.seconds > 3600:
                return f"Hace {delta.seconds // 3600} horas"
            else:
                return f"Hace {delta.seconds // 60} minutos"
        return "-"
    tiempo_transcurrido.short_description = 'Hace'

@admin.register(Producto, site=admin_site)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ['nombre_archivo_con_icono', 'tipo_producto_badge', 'variable_badge', 'ultima_fecha', 'imagen_preview_small', 'acciones']
    list_filter = ['tipo_producto', 'variable', 'fechas__fecha']
    search_fields = ['nombre_archivo', 'tipo_producto__nombre', 'variable']
    inlines = [FechaProductoInline]
    readonly_fields = ['imagen_preview', 'ultima_fecha', 'total_fechas']
    list_per_page = 25
    
    fieldsets = (
        ('📄 Información del Producto', {
            'fields': ('tipo_producto', 'nombre_archivo', 'variable')
        }),
        ('🖼️ Imagen', {
            'fields': ('url_imagen', 'foto', 'imagen_preview')
        }),
        ('📊 Estadísticas', {
            'fields': ('ultima_fecha', 'total_fechas'),
            'classes': ('collapse',)
        })
    )
    
    def nombre_archivo_con_icono(self, obj):
        return format_html('📄 <strong>{}</strong>', obj.nombre_archivo)
    nombre_archivo_con_icono.short_description = 'Archivo'
    
    def tipo_producto_badge(self, obj):
        colores = {
            'wrf_cba': '#ff9800',
            'MedicionAire': '#2196f3',
            'FWI': '#f44336',
            'rutas_caminera': '#4caf50'
        }
        color = colores.get(obj.tipo_producto.nombre, '#9e9e9e')
        return format_html(
            '<span style="background: {}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px;">{}</span>',
            color, obj.tipo_producto.nombre
        )
    tipo_producto_badge.short_description = 'Tipo'
    
    def variable_badge(self, obj):
        if obj.variable:
            return format_html(
                '<span style="background: #e1f5fe; color: #0277bd; padding: 2px 6px; border-radius: 8px; font-size: 10px;">{}</span>',
                obj.variable
            )
        return '-'
    variable_badge.short_description = 'Variable'
    
    def imagen_preview_small(self, obj):
        if obj.url_imagen:
            return format_html(
                '<img src="{}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;" />',
                obj.url_imagen
            )
        return "📷"
    imagen_preview_small.short_description = 'Vista Previa'
    
    def imagen_preview(self, obj):
        if obj.url_imagen:
            return format_html(
                '<div style="text-align: center;"><img src="{}" style="max-width: 400px; max-height: 400px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" /></div>',
                obj.url_imagen
            )
        return "Sin imagen disponible"
    imagen_preview.short_description = 'Vista Previa Completa'
    
    def ultima_fecha(self, obj):
        ultima = obj.fechas.first()
        if ultima:
            return format_html(
                '<div style="text-align: center;"><span style="background: #e8f5e8; color: #2e7d32; padding: 4px 8px; border-radius: 8px;">📅 {} 🕐 {}</span></div>',
                ultima.fecha, ultima.hora
            )
        return format_html('<span style="color: #f44336;">Sin fechas</span>')
    ultima_fecha.short_description = 'Última Actualización'
    
    def total_fechas(self, obj):
        count = obj.fechas.count()
        return format_html(
            '<span style="background: #fff3e0; color: #f57c00; padding: 4px 8px; border-radius: 8px;">{} registros</span>',
            count
        )
    total_fechas.short_description = 'Total de Fechas'
    
    def acciones(self, obj):
        return format_html(
            '<a href="{}" target="_blank" style="background: #1976d2; color: white; padding: 4px 8px; border-radius: 4px; text-decoration: none; margin-right: 4px;">🔗 Ver</a>'
            '<a href="{}" style="background: #388e3c; color: white; padding: 4px 8px; border-radius: 4px; text-decoration: none;">✏️ Editar</a>',
            obj.url_imagen,
            reverse('admin:productos_producto_change', args=[obj.pk])
        )
    acciones.short_description = 'Acciones'

@admin.register(FechaProducto, site=admin_site)
class FechaProductoAdmin(admin.ModelAdmin):
    list_display = ['producto_info', 'fecha_badge', 'hora_badge', 'tipo_producto_info', 'tiempo_transcurrido']
    list_filter = ['fecha', 'producto__tipo_producto', 'producto__variable']
    search_fields = ['producto__nombre_archivo', 'producto__tipo_producto__nombre']
    date_hierarchy = 'fecha'
    list_per_page = 50
    
    def producto_info(self, obj):
        return format_html(
            '<div><strong>📄 {}</strong><br><small style="color: #666;">{}</small></div>',
            obj.producto.nombre_archivo[:50],
            obj.producto.variable or 'Sin variable'
        )
    producto_info.short_description = 'Producto'
    
    def fecha_badge(self, obj):
        hoy = datetime.date.today()
        if obj.fecha == hoy:
            color = '#4caf50'
            texto = 'HOY'
        elif obj.fecha == hoy - datetime.timedelta(days=1):
            color = '#ff9800'
            texto = 'AYER'
        else:
            color = '#2196f3'
            texto = str(obj.fecha)
        
        return format_html(
            '<span style="background: {}; color: white; padding: 4px 8px; border-radius: 8px; font-size: 11px;">{}</span>',
            color, texto
        )
    fecha_badge.short_description = 'Fecha'
    
    def hora_badge(self, obj):
        return format_html(
            '<span style="background: #e3f2fd; color: #1976d2; padding: 4px 8px; border-radius: 8px; font-family: monospace;">🕐 {}</span>',
            obj.hora
        )
    hora_badge.short_description = 'Hora'
    
    def tipo_producto_info(self, obj):
        return obj.producto.tipo_producto.nombre
    tipo_producto_info.short_description = 'Tipo'
    
    def tiempo_transcurrido(self, obj):
        if obj.fecha_creacion:
            delta = datetime.datetime.now(datetime.timezone.utc) - obj.fecha_creacion
            if delta.days > 0:
                return format_html(
                    '<span style="color: #666;">Hace {} días</span>',
                    delta.days
                )
            elif delta.seconds > 3600:
                return format_html(
                    '<span style="color: #666;">Hace {} horas</span>',
                    delta.seconds // 3600
                )
            else:
                return format_html(
                    '<span style="color: #4caf50;">Hace {} min</span>',
                    delta.seconds // 60
                )
        return "-"
    tiempo_transcurrido.short_description = 'Creado'

# Registrar modelos en el admin por defecto también
admin.site.register(TipoProducto, TipoProductoAdmin)
admin.site.register(Producto, ProductoAdmin)
admin.site.register(FechaProducto, FechaProductoAdmin)
