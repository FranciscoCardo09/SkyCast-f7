from django.core.management.base import BaseCommand
from productos.models import TipoProducto, Producto, FechaProducto
from datetime import datetime, date, timedelta
import requests
from bs4 import BeautifulSoup
import re
import logging
from urllib.parse import urljoin, urlparse
import time

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Descubrir automáticamente todos los datos disponibles en el servidor OHMC'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Número de días hacia atrás para explorar (default: 30)',
        )
        parser.add_argument(
            '--year',
            type=int,
            default=2025,
            help='Año a explorar (default: 2025)',
        )
        parser.add_argument(
            '--month',
            type=int,
            default=6,
            help='Mes a explorar (default: 6)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Solo mostrar lo que se encontraría, sin guardar en BD',
        )
    
    def handle(self, *args, **options):
        days = options['days']
        year = options['year']
        month = options['month']
        dry_run = options['dry_run']
        
        self.stdout.write(self.style.SUCCESS(f'🔍 Explorando servidor OHMC para {year}-{month:02d} ({days} días)...'))
        if dry_run:
            self.stdout.write(self.style.WARNING('🧪 MODO DRY-RUN: Solo exploración, sin guardar datos'))
        
        # 1. Crear tipos de productos si no existen
        if not dry_run:
            self.create_tipos_productos()
        
        # 2. Explorar WRF
        self.discover_wrf_data(year, month, days, dry_run)
        
        # 3. Explorar MedicionAire
        self.discover_medicion_aire_data(year, month, days, dry_run)
        
        # 4. Explorar FWI y Rutas (archivos estáticos)
        if not dry_run:
            self.discover_static_data()
        
        # 5. Mostrar resumen
        if not dry_run:
            self.show_summary()
        
        self.stdout.write(self.style.SUCCESS('✅ Exploración completada!'))
    
    def get_directory_listing(self, url, timeout=10):
        """Obtener listado de directorios desde una URL"""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            response = requests.get(url, headers=headers, timeout=timeout)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Buscar enlaces que no sean ".." (directorio padre)
                links = []
                for link in soup.find_all('a'):
                    href = link.get('href')
                    if href and href != '../' and not href.startswith('?'):
                        links.append(href.rstrip('/'))
                
                return links
            else:
                self.stdout.write(self.style.WARNING(f'    ⚠️ HTTP {response.status_code}: {url}'))
                return []
                
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'    ❌ Error: {str(e)[:50]}...'))
            return []
    
    def discover_wrf_data(self, year, month, days, dry_run):
        """Descubrir datos WRF explorando la estructura de directorios"""
        self.stdout.write(f'🌡️ Explorando datos WRF para {year}-{month:02d}...')
        
        base_url = f"https://yaku.ohmc.ar/public/wrf/img/CBA/{year}_{month:02d}/"
        
        # Obtener listado de días disponibles
        dias_disponibles = self.get_directory_listing(base_url)
        self.stdout.write(f'  📅 Días encontrados: {len(dias_disponibles)}')
        
        total_productos = 0
        total_archivos = 0
        
        for dia_corrida in dias_disponibles:
            # Formato esperado: "DD_HH" (ej: "24_06")
            if not re.match(r'\d{2}_\d{2}', dia_corrida):
                continue
            
            dia, hora_corrida = dia_corrida.split('_')
            fecha_corrida = date(year, month, int(dia))
            
            # Solo procesar si está dentro del rango de días solicitado
            dias_diferencia = (date.today() - fecha_corrida).days
            if dias_diferencia > days:
                continue
            
            self.stdout.write(f'  📅 Explorando {fecha_corrida} corrida {hora_corrida}:00 UTC...')
            
            # Explorar variables disponibles para esta corrida
            corrida_url = f"{base_url}{dia_corrida}/"
            variables_disponibles = self.get_directory_listing(corrida_url)
            
            self.stdout.write(f'    📊 Variables encontradas: {len(variables_disponibles)}')
            
            for variable in variables_disponibles:
                variable_url = f"{corrida_url}{variable}/"
                archivos_disponibles = self.get_directory_listing(variable_url)
                
                self.stdout.write(f'      🔸 {variable}: {len(archivos_disponibles)} archivos')
                
                for archivo in archivos_disponibles:
                    if archivo.endswith('.png'):
                        # Extraer información del nombre del archivo
                        # Formato: variable-YYYY-MM-DD_HH+HH.png
                        match = re.match(r'(.+)-(\d{4}-\d{2}-\d{2})_(\d{2})\+(\d{2})\.png', archivo)
                        
                        if match:
                            var_name, fecha_str, hora_inicio, hora_offset = match.groups()
                            
                            # Calcular fecha y hora del pronóstico
                            fecha_archivo = datetime.strptime(fecha_str, '%Y-%m-%d').date()
                            hora_total = int(hora_inicio) + int(hora_offset)
                            
                            if hora_total >= 24:
                                fecha_pronostico = fecha_archivo + timedelta(days=1)
                                hora_final = hora_total - 24
                            else:
                                fecha_pronostico = fecha_archivo
                                hora_final = hora_total
                            
                            hora_pronostico = datetime.strptime(f"{hora_final:02d}:00", "%H:%M").time()
                            
                            url_completa = f"{variable_url}{archivo}"
                            
                            if not dry_run:
                                # Crear producto
                                tipo_wrf = TipoProducto.objects.get(nombre='wrf_cba')
                                
                                producto, created = Producto.objects.get_or_create(
                                    tipo_producto=tipo_wrf,
                                    variable=variable,
                                    nombre_archivo=archivo,
                                    defaults={'url_imagen': url_completa}
                                )
                                
                                if not created:
                                    producto.url_imagen = url_completa
                                    producto.save()
                                
                                # Crear fecha de producto
                                FechaProducto.objects.get_or_create(
                                    fecha=fecha_pronostico,
                                    hora=hora_pronostico,
                                    producto=producto
                                )
                                
                                if created:
                                    total_productos += 1
                            
                            total_archivos += 1
                            
                            if dry_run:
                                self.stdout.write(f'        📄 {archivo} -> {fecha_pronostico} {hora_pronostico}')
                
                # Pequeña pausa para no sobrecargar el servidor
                time.sleep(0.1)
        
        self.stdout.write(self.style.SUCCESS(f'  ✅ WRF: {total_archivos} archivos encontrados'))
        if not dry_run:
            self.stdout.write(self.style.SUCCESS(f'  💾 {total_productos} productos nuevos guardados'))
    
    def discover_medicion_aire_data(self, year, month, days, dry_run):
        """Descubrir datos de MedicionAire"""
        self.stdout.write(f'🌬️ Explorando datos MedicionAire para {year}-{month:02d}...')
        
        base_url = f"https://yaku.ohmc.ar/public/MedicionAire/{month:02d}/"
        
        # Obtener días disponibles
        dias_disponibles = self.get_directory_listing(base_url)
        self.stdout.write(f'  📅 Días encontrados: {len(dias_disponibles)}')
        
        archivos_esperados = ['CH4_webvisualizer_v4.png', 'CO2_webvisualizer_v4.png']
        total_productos = 0
        total_archivos = 0
        
        for dia in dias_disponibles:
            if not dia.isdigit():
                continue
            
            fecha_actual = date(year, month, int(dia))
            
            # Solo procesar si está dentro del rango
            dias_diferencia = (date.today() - fecha_actual).days
            if dias_diferencia > days:
                continue
            
            self.stdout.write(f'  📅 Explorando {fecha_actual}...')
            
            dia_url = f"{base_url}{dia}/"
            archivos_disponibles = self.get_directory_listing(dia_url)
            
            for archivo in archivos_esperados:
                if archivo in archivos_disponibles:
                    url_completa = f"{dia_url}{archivo}"
                    nombre_archivo_con_fecha = f"{fecha_actual.strftime('%Y-%m-%d')}_{archivo}"
                    
                    if not dry_run:
                        tipo_aire = TipoProducto.objects.get(nombre='MedicionAire')
                        
                        producto, created = Producto.objects.get_or_create(
                            tipo_producto=tipo_aire,
                            nombre_archivo=nombre_archivo_con_fecha,
                            defaults={'url_imagen': url_completa}
                        )
                        
                        if not created:
                            producto.url_imagen = url_completa
                            producto.save()
                        
                        FechaProducto.objects.get_or_create(
                            fecha=fecha_actual,
                            hora=datetime.strptime("10:30", "%H:%M").time(),
                            producto=producto
                        )
                        
                        if created:
                            total_productos += 1
                    
                    total_archivos += 1
                    
                    if dry_run:
                        self.stdout.write(f'    📄 {archivo} -> {fecha_actual}')
        
        self.stdout.write(self.style.SUCCESS(f'  ✅ MedicionAire: {total_archivos} archivos encontrados'))
        if not dry_run:
            self.stdout.write(self.style.SUCCESS(f'  💾 {total_productos} productos nuevos guardados'))
    
    def discover_static_data(self):
        """Descubrir datos estáticos (FWI y Rutas)"""
        self.stdout.write('🔥 Explorando datos estáticos...')
        
        # FWI
        fwi_url = "https://yaku.ohmc.ar/public/FWI/FWI.png"
        tipo_fwi = TipoProducto.objects.get(nombre='FWI')
        
        producto_fwi, created = Producto.objects.get_or_create(
            tipo_producto=tipo_fwi,
            nombre_archivo='FWI.png',
            defaults={'url_imagen': fwi_url}
        )
        
        if not created:
            producto_fwi.url_imagen = fwi_url
            producto_fwi.save()
        
        FechaProducto.objects.get_or_create(
            fecha=date.today(),
            hora=datetime.strptime("11:00", "%H:%M").time(),
            producto=producto_fwi
        )
        
        # Rutas caminera
        rutas_url = "https://yaku.ohmc.ar/public/rutas_caminera/rafagas_rutas.gif"
        tipo_rutas = TipoProducto.objects.get(nombre='rutas_caminera')
        
        producto_rutas, created = Producto.objects.get_or_create(
            tipo_producto=tipo_rutas,
            nombre_archivo='rafagas_rutas.gif',
            defaults={'url_imagen': rutas_url}
        )
        
        if not created:
            producto_rutas.url_imagen = rutas_url
            producto_rutas.save()
        
        FechaProducto.objects.get_or_create(
            fecha=date.today(),
            hora=datetime.strptime("11:00", "%H:%M").time(),
            producto=producto_rutas
        )
        
        self.stdout.write(self.style.SUCCESS('  ✅ Datos estáticos procesados'))
    
    def create_tipos_productos(self):
        """Crear tipos de productos si no existen"""
        tipos = [
            {
                'nombre': 'wrf_cba',
                'descripcion': 'Productos horarios generados por el modelo WRF para Córdoba',
                'url': 'https://yaku.ohmc.ar/public/wrf/img/CBA/'
            },
            {
                'nombre': 'MedicionAire',
                'descripcion': 'Visualizaciones diarias de gases de efecto invernadero',
                'url': 'https://yaku.ohmc.ar/public/MedicionAire/'
            },
            {
                'nombre': 'FWI',
                'descripcion': 'Índice meteorológico de peligro de incendio',
                'url': 'https://yaku.ohmc.ar/public/FWI/'
            },
            {
                'nombre': 'rutas_caminera',
                'descripcion': 'Animación de ráfagas de viento sobre rutas provinciales',
                'url': 'https://yaku.ohmc.ar/public/rutas_caminera/'
            }
        ]
        
        for tipo_data in tipos:
            TipoProducto.objects.get_or_create(
                nombre=tipo_data['nombre'],
                defaults={
                    'descripcion': tipo_data['descripcion'],
                    'url': tipo_data['url']
                }
            )
    
    def show_summary(self):
        """Mostrar resumen de datos descubiertos"""
        self.stdout.write('\n📊 RESUMEN DE DATOS DESCUBIERTOS:')
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
        
        # Estadísticas por fecha y variable (WRF)
        self.stdout.write(f'\n🌡️ Datos WRF por fecha:')
        wrf_fechas = FechaProducto.objects.filter(
            producto__tipo_producto__nombre='wrf_cba'
        ).values_list('fecha', flat=True).distinct().order_by('-fecha')[:5]
        
        for fecha in wrf_fechas:
            variables_count = FechaProducto.objects.filter(
                producto__tipo_producto__nombre='wrf_cba',
                fecha=fecha
            ).values_list('producto__variable', flat=True).distinct().count()
            
            horas_count = FechaProducto.objects.filter(
                producto__tipo_producto__nombre='wrf_cba',
                fecha=fecha
            ).values_list('hora', flat=True).distinct().count()
            
            self.stdout.write(f'  - {fecha}: {variables_count} variables, {horas_count} horas')
