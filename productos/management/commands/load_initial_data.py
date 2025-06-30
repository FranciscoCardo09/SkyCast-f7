from django.core.management.base import BaseCommand
from productos.models import TipoProducto, Producto, FechaProducto
from datetime import datetime, date, timedelta
import requests
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Cargar datos iniciales y sincronizar datos del último mes'
    
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🚀 Iniciando carga de datos iniciales...'))
        
        # 1. Crear tipos de productos
        self.create_tipos_productos()
        
        # 2. Cargar datos del último mes
        self.load_wrf_data()
        self.load_medicion_aire_data()
        self.load_fwi_data()
        self.load_rutas_data()
        
        self.stdout.write(self.style.SUCCESS('✅ Carga de datos completada!'))
    
    def create_tipos_productos(self):
        """Crear los tipos de productos iniciales"""
        self.stdout.write('📊 Creando tipos de productos...')
        
        tipos = [
            {
                'nombre': 'wrf_cba',
                'descripcion': 'Productos horarios generados por el modelo WRF para Córdoba, con actualizaciones diarias y dos corridas por día.',
                'url': 'https://yaku.ohmc.ar/public/wrf/img/CBA/'
            },
            {
                'nombre': 'MedicionAire',
                'descripcion': 'Visualizaciones diarias de gases de efecto invernadero (CO₂ y CH₄) medidos por el analizador Picarro en el OHMC.',
                'url': 'https://yaku.ohmc.ar/public/MedicionAire/'
            },
            {
                'nombre': 'FWI',
                'descripcion': 'Índice meteorológico de peligro de incendio (Fire Weather Index).',
                'url': 'https://yaku.ohmc.ar/public/FWI/'
            },
            {
                'nombre': 'rutas_caminera',
                'descripcion': 'Animación de ráfagas de viento sobre rutas provinciales para apoyo vial.',
                'url': 'https://yaku.ohmc.ar/public/rutas_caminera/'
            }
        ]
        
        for tipo_data in tipos:
            tipo, created = TipoProducto.objects.get_or_create(
                nombre=tipo_data['nombre'],
                defaults={
                    'descripcion': tipo_data['descripcion'],
                    'url': tipo_data['url']
                }
            )
            if created:
                self.stdout.write(f'  ✅ Creado: {tipo.nombre}')
            else:
                self.stdout.write(f'  ℹ️ Ya existe: {tipo.nombre}')
    
    def load_wrf_data(self):
        """Cargar datos WRF del último mes"""
        self.stdout.write('🌡️ Cargando datos WRF...')
        
        tipo_wrf = TipoProducto.objects.get(nombre='wrf_cba')
        
        # Variables disponibles según las imágenes
        variables = [
            'cl', 'ctt', 'dbz_altura', 'hail', 'max_dbz', 'mcape',
            'ppn', 'ppnaccum', 'rh2', 'riesgos_vientos', 'snow',
            't2', 'wdir10', 'wspd10', 'wspd_altura'
        ]
        
        # Cargar datos del último mes
        hoy = date.today()
        
        for dias_atras in range(30):  # Último mes
            fecha_actual = hoy - timedelta(days=dias_atras)
            
            # Solo procesar días con corridas (6 y 18 UTC)
            for hora_corrida in ['06', '18']:
                for variable in variables:
                    # Generar URLs para las próximas 24 horas de pronóstico
                    for hora_pronostico in range(0, 25, 3):  # Cada 3 horas
                        hora_str = f"{hora_pronostico:02d}"
                        
                        # Estructura de URL basada en las imágenes
                        url = f"https://yaku.ohmc.ar/public/wrf/img/CBA/{fecha_actual.year}_{fecha_actual.month:02d}/{fecha_actual.day:02d}_{hora_corrida}/{variable}/{variable}-{fecha_actual.strftime('%Y-%m-%d')}_{hora_corrida}+{hora_str}.png"
                        
                        nombre_archivo = f"{variable}-{fecha_actual.strftime('%Y-%m-%d')}_{hora_corrida}+{hora_str}.png"
                        
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
                        
                        # Crear fecha de producto
                        try:
                            hora_obj = datetime.strptime(f"{hora_corrida}:{hora_str}", "%H:%M").time()
                            FechaProducto.objects.get_or_create(
                                fecha=fecha_actual,
                                hora=hora_obj,
                                producto=producto
                            )
                        except Exception as e:
                            continue
        
        count = Producto.objects.filter(tipo_producto=tipo_wrf).count()
        self.stdout.write(f'  ✅ WRF: {count} productos creados')
    
    def load_medicion_aire_data(self):
        """Cargar datos de medición de aire del último mes"""
        self.stdout.write('🌬️ Cargando datos de medición de aire...')
        
        tipo_aire = TipoProducto.objects.get(nombre='MedicionAire')
        archivos = ['CH4_webvisualizer_v4.png', 'CO2_webvisualizer_v4.png']
        hoy = date.today()
        
        for dias_atras in range(30):  # Último mes
            fecha_actual = hoy - timedelta(days=dias_atras)
            
            for archivo in archivos:
                url = f"https://yaku.ohmc.ar/public/MedicionAire/{fecha_actual.month:02d}/{fecha_actual.day:02d}/{archivo}"
                
                producto, created = Producto.objects.get_or_create(
                    tipo_producto=tipo_aire,
                    nombre_archivo=archivo,
                    defaults={'url_imagen': url}
                )
                
                if not created:
                    producto.url_imagen = url
                    producto.save()
                
                # Crear fecha (aproximadamente a las 10:30)
                FechaProducto.objects.get_or_create(
                    fecha=fecha_actual,
                    hora=datetime.strptime("10:30", "%H:%M").time(),
                    producto=producto
                )
        
        count = Producto.objects.filter(tipo_producto=tipo_aire).count()
        self.stdout.write(f'  ✅ MedicionAire: {count} productos creados')
    
    def load_fwi_data(self):
        """Cargar datos FWI"""
        self.stdout.write('🔥 Cargando datos FWI...')
        
        tipo_fwi = TipoProducto.objects.get(nombre='FWI')
        url = "https://yaku.ohmc.ar/public/FWI/FWI.png"
        
        producto, created = Producto.objects.get_or_create(
            tipo_producto=tipo_fwi,
            nombre_archivo='FWI.png',
            defaults={'url_imagen': url}
        )
        
        if not created:
            producto.url_imagen = url
            producto.save()
        
        # Crear fecha de hoy
        FechaProducto.objects.get_or_create(
            fecha=date.today(),
            hora=datetime.strptime("11:00", "%H:%M").time(),
            producto=producto
        )
        
        self.stdout.write('  ✅ FWI: 1 producto creado')
    
    def load_rutas_data(self):
        """Cargar datos de rutas caminera"""
        self.stdout.write('🛣️ Cargando datos de rutas...')
        
        tipo_rutas = TipoProducto.objects.get(nombre='rutas_caminera')
        url = "https://yaku.ohmc.ar/public/rutas_caminera/rafagas_rutas.gif"
        
        producto, created = Producto.objects.get_or_create(
            tipo_producto=tipo_rutas,
            nombre_archivo='rafagas_rutas.gif',
            defaults={'url_imagen': url}
        )
        
        if not created:
            producto.url_imagen = url
            producto.save()
        
        FechaProducto.objects.get_or_create(
            fecha=date.today(),
            hora=datetime.strptime("11:00", "%H:%M").time(),
            producto=producto
        )
        
        self.stdout.write('  ✅ Rutas: 1 producto creado')
