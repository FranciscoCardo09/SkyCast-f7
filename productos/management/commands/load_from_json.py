from django.core.management.base import BaseCommand
from productos.models import TipoProducto, Producto, FechaProducto
from datetime import datetime, date, timedelta
import json
import os
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Cargar datos desde el JSON de estructura OHMC'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Número de días hacia atrás para generar datos (default: 30)',
        )
        parser.add_argument(
            '--json-file',
            type=str,
            default='ohmc_data_structure.json',
            help='Archivo JSON con la estructura de datos (default: ohmc_data_structure.json)',
        )
        parser.add_argument(
            '--start-date',
            type=str,
            help='Fecha de inicio en formato YYYY-MM-DD (default: basado en ultima_actualizacion del JSON)',
        )
    
    def handle(self, *args, **options):
        days = options['days']
        json_file = options['json_file']
        start_date_str = options.get('start_date')
        
        # Cargar JSON
        json_path = os.path.join(os.getcwd(), json_file)
        if not os.path.exists(json_path):
            self.stdout.write(self.style.ERROR(f'❌ Archivo JSON no encontrado: {json_path}'))
            return
        
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        self.stdout.write(self.style.SUCCESS(f'📄 JSON cargado desde: {json_file}'))
        self.stdout.write(self.style.SUCCESS(f'🔄 Generando datos para {days} días...'))
        
        # 1. Crear tipos de productos
        self.create_tipos_productos(data)
        
        # 2. Cargar datos según el JSON
        total_productos = 0
        
        for proyecto_name, proyecto_data in data['proyectos'].items():
            self.stdout.write(f'\n📊 Procesando {proyecto_name}...')
            
            if proyecto_name == 'wrf_cba':
                productos_creados = self.load_wrf_data(proyecto_data, days, start_date_str)
            elif proyecto_name == 'MedicionAire':
                productos_creados = self.load_medicion_aire_data(proyecto_data, days, start_date_str)
            elif proyecto_name in ['FWI', 'rutas_caminera']:
                productos_creados = self.load_static_data(proyecto_name, proyecto_data)
            else:
                productos_creados = 0
            
            total_productos += productos_creados
            self.stdout.write(self.style.SUCCESS(f'  ✅ {productos_creados} productos creados'))
        
        # 3. Mostrar resumen
        self.show_summary()
        
        self.stdout.write(self.style.SUCCESS(f'\n🎉 ¡Carga completada! Total: {total_productos} productos'))
    
    def create_tipos_productos(self, data):
        """Crear tipos de productos desde el JSON"""
        self.stdout.write('📋 Creando tipos de productos...')
        
        for proyecto_name, proyecto_data in data['proyectos'].items():
            tipo, created = TipoProducto.objects.get_or_create(
                nombre=proyecto_name,
                defaults={
                    'descripcion': proyecto_data['descripcion'],
                    'url': proyecto_data['url_base']
                }
            )
            
            if created:
                self.stdout.write(f'  ✅ Creado: {tipo.nombre}')
            else:
                # Actualizar descripción si cambió
                tipo.descripcion = proyecto_data['descripcion']
                tipo.url = proyecto_data['url_base']
                tipo.save()
                self.stdout.write(f'  🔄 Actualizado: {tipo.nombre}')
    
    def load_wrf_data(self, proyecto_data, days, start_date_str):
        """Cargar datos WRF basado en el JSON"""
        # Determinar fecha de inicio
        if start_date_str:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        else:
            # Usar ultima_actualizacion del JSON
            ultima_actualizacion = datetime.fromisoformat(
                proyecto_data['ultima_actualizacion'].replace('Z', '+00:00')
            ).date()
            start_date = ultima_actualizacion
        
        self.stdout.write(f'  📅 Generando desde: {start_date} ({days} días hacia atrás)')
        
        tipo_wrf = TipoProducto.objects.get(nombre='wrf_cba')
        variables = list(proyecto_data['variables_disponibles'].keys())
        productos_creados = 0
        
        # Corridas típicas del WRF (06 y 18 UTC)
        corridas = ['06', '18']
        
        # Horas de pronóstico típicas (cada 3 horas hasta 24h)
        horas_pronostico = list(range(0, 25, 3))  # 0, 3, 6, 9, 12, 15, 18, 21, 24
        
        for dias_atras in range(days):
            fecha_actual = start_date - timedelta(days=dias_atras)
            
            for hora_corrida in corridas:
                for variable in variables:
                    for hora_offset in horas_pronostico:
                        # Generar URL según la estructura del JSON
                        # CBA/YYYY_MM/DD_HH/{variable}/{variable}-YYYY-MM-DD_HH+HH.png
                        url = (f"{proyecto_data['url_base']}"
                              f"{fecha_actual.year}_{fecha_actual.month:02d}/"
                              f"{fecha_actual.day:02d}_{hora_corrida}/"
                              f"{variable}/"
                              f"{variable}-{fecha_actual.strftime('%Y-%m-%d')}_{hora_corrida}+{hora_offset:02d}.png")
                        
                        nombre_archivo = f"{variable}-{fecha_actual.strftime('%Y-%m-%d')}_{hora_corrida}+{hora_offset:02d}.png"
                        
                        # Crear producto
                        producto, created = Producto.objects.get_or_create(
                            tipo_producto=tipo_wrf,
                            variable=variable,
                            nombre_archivo=nombre_archivo,
                            defaults={'url_imagen': url}
                        )
                        
                        if not created:
                            producto.url_imagen = url
                            producto.save()
                        else:
                            productos_creados += 1
                        
                        # Calcular fecha y hora del pronóstico
                        hora_total = int(hora_corrida) + hora_offset
                        
                        if hora_total >= 24:
                            fecha_pronostico = fecha_actual + timedelta(days=1)
                            hora_final = hora_total - 24
                        else:
                            fecha_pronostico = fecha_actual
                            hora_final = hora_total
                        
                        hora_obj = datetime.strptime(f"{hora_final:02d}:00", "%H:%M").time()
                        
                        # Crear fecha de producto
                        FechaProducto.objects.get_or_create(
                            fecha=fecha_pronostico,
                            hora=hora_obj,
                            producto=producto
                        )
        
        return productos_creados
    
    def load_medicion_aire_data(self, proyecto_data, days, start_date_str):
        """Cargar datos de MedicionAire basado en el JSON"""
        # Determinar fecha de inicio
        if start_date_str:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        else:
            ultima_actualizacion = datetime.fromisoformat(
                proyecto_data['ultima_actualizacion'].replace('Z', '+00:00')
            ).date()
            start_date = ultima_actualizacion
        
        tipo_aire = TipoProducto.objects.get(nombre='MedicionAire')
        archivos = proyecto_data['archivos']
        productos_creados = 0
        
        for dias_atras in range(days):
            fecha_actual = start_date - timedelta(days=dias_atras)
            
            for archivo in archivos:
                # Generar URL según la estructura del JSON: MM/DD/archivo.png
                url = (f"{proyecto_data['url_base']}"
                      f"{fecha_actual.month:02d}/"
                      f"{fecha_actual.day:02d}/"
                      f"{archivo}")
                
                nombre_archivo_con_fecha = f"{fecha_actual.strftime('%Y-%m-%d')}_{archivo}"
                
                producto, created = Producto.objects.get_or_create(
                    tipo_producto=tipo_aire,
                    nombre_archivo=nombre_archivo_con_fecha,
                    defaults={'url_imagen': url}
                )
                
                if not created:
                    producto.url_imagen = url
                    producto.save()
                else:
                    productos_creados += 1
                
                # Crear fecha (hora típica de actualización: 10:30)
                FechaProducto.objects.get_or_create(
                    fecha=fecha_actual,
                    hora=datetime.strptime("10:30", "%H:%M").time(),
                    producto=producto
                )
        
        return productos_creados
    
    def load_static_data(self, proyecto_name, proyecto_data):
        """Cargar datos estáticos (FWI, rutas_caminera)"""
        tipo = TipoProducto.objects.get(nombre=proyecto_name)
        productos_creados = 0
        
        for archivo in proyecto_data['archivos']:
            url = f"{proyecto_data['url_base']}{archivo}"
            
            producto, created = Producto.objects.get_or_create(
                tipo_producto=tipo,
                nombre_archivo=archivo,
                defaults={'url_imagen': url}
            )
            
            if not created:
                producto.url_imagen = url
                producto.save()
            else:
                productos_creados += 1
            
            # Usar fecha de última actualización del JSON
            ultima_actualizacion = datetime.fromisoformat(
                proyecto_data['ultima_actualizacion'].replace('Z', '+00:00')
            )
            
            FechaProducto.objects.get_or_create(
                fecha=ultima_actualizacion.date(),
                hora=ultima_actualizacion.time(),
                producto=producto
            )
        
        return productos_creados
    
    def show_summary(self):
        """Mostrar resumen de datos cargados"""
        self.stdout.write('\n📊 RESUMEN DE DATOS CARGADOS:')
        self.stdout.write('=' * 50)
        
        for tipo in TipoProducto.objects.all():
            count = tipo.producto_set.count()
            self.stdout.write(f'  - {tipo.nombre}: {count} productos')
            
            # Mostrar variables únicas para WRF
            if tipo.nombre == 'wrf_cba':
                variables = tipo.producto_set.values_list('variable', flat=True).distinct()
                self.stdout.write(f'    Variables: {", ".join(sorted(variables))}')
        
        # Mostrar fechas disponibles
        fechas_unicas = FechaProducto.objects.values_list('fecha', flat=True).distinct().order_by('-fecha')[:10]
        self.stdout.write(f'\n📅 Fechas con datos (últimas 10):')
        for fecha in fechas_unicas:
            count = FechaProducto.objects.filter(fecha=fecha).count()
            self.stdout.write(f'  - {fecha}: {count} registros')
        
        # Total de productos y fechas
        total_productos = Producto.objects.count()
        total_fechas = FechaProducto.objects.count()
        self.stdout.write(f'\n📈 TOTALES:')
        self.stdout.write(f'  - Productos: {total_productos}')
        self.stdout.write(f'  - Registros de fechas: {total_fechas}')
