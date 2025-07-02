from celery import shared_task
from django.utils import timezone
from django.core.files.base import ContentFile
from datetime import datetime, timedelta, date
import requests
import json
from .models import TipoProducto, Producto, FechaProducto
import logging
from urllib.parse import urlparse
import os

logger = logging.getLogger(__name__)

def download_and_save_image(producto, url):
    """Descargar imagen desde URL y guardarla en el modelo"""
    try:
        logger.info(f"Descargando imagen: {url}")
        response = requests.get(url, timeout=30, stream=True)
        
        if response.status_code == 200:
            # Obtener nombre del archivo desde la URL
            parsed_url = urlparse(url)
            filename = os.path.basename(parsed_url.path)
            
            # Si no hay extensión, usar .png por defecto
            if not filename or '.' not in filename:
                filename = f"{producto.nombre_archivo}.png"
            
            # Guardar imagen en el campo foto
            producto.foto.save(
                filename,
                ContentFile(response.content),
                save=True
            )
            logger.info(f"✅ Imagen guardada: {filename}")
            return True
        else:
            logger.warning(f"⚠️ Error HTTP {response.status_code} para {url}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Error descargando {url}: {str(e)}")
        return False

@shared_task
def sync_wrf_data():
    """Sincronizar datos WRF y descargar imágenes"""
    try:
        # Crear o obtener tipo de producto
        tipo_wrf, created = TipoProducto.objects.get_or_create(
            nombre='wrf_cba',
            defaults={
                'descripcion': 'Productos horarios generados por el modelo WRF para Córdoba',
                'url': 'https://yaku.ohmc.ar/public/wrf/img/CBA/'
            }
        )
        
        # Variables principales para empezar
        variables = ['t2', 'ppn', 'wspd10', 'rh2', 'ppnaccum']
        
        # Obtener datos de la última semana
        hoy = date.today()
        productos_creados = 0
        imagenes_descargadas = 0
        
        for dias_atras in range(7):  # Última semana
            fecha_actual = hoy - timedelta(days=dias_atras)
            
            # Solo procesar días con corridas (6 y 18 UTC)
            for hora_corrida in ['06', '18']:
                for variable in variables:
                    # Generar URLs para horas principales
                    for hora_pronostico in [0, 6, 12, 18]:
                        hora_str = f"{hora_pronostico:02d}"
                        
                        # Estructura correcta de URL
                        url = f"https://yaku.ohmc.ar/public/wrf/img/CBA/{fecha_actual.year}_{fecha_actual.month:02d}/{fecha_actual.day:02d}_{hora_corrida}/{variable}/{variable}-{fecha_actual.strftime('%Y-%m-%d')}_{hora_corrida}+{hora_str}.png"
                        
                        nombre_archivo = f"{variable}-{fecha_actual.strftime('%Y-%m-%d')}_{hora_corrida}+{hora_str}.png"
                        
                        # Crear o actualizar producto
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
                        
                        # Descargar imagen si no existe
                        if not producto.foto:
                            if download_and_save_image(producto, url):
                                imagenes_descargadas += 1
                        
                        # Crear fecha de producto
                        try:
                            hora_total = int(hora_corrida) + hora_pronostico
                            
                            if hora_total >= 24:
                                fecha_pronostico = fecha_actual + timedelta(days=1)
                                hora_final = hora_total - 24
                            else:
                                fecha_pronostico = fecha_actual
                                hora_final = hora_total
                            
                            hora_obj = datetime.strptime(f"{hora_final:02d}:00", "%H:%M").time()
                            
                            FechaProducto.objects.get_or_create(
                                fecha=fecha_pronostico,
                                hora=hora_obj,
                                producto=producto
                            )
                        except Exception as e:
                            logger.warning(f"Error creando fecha para {nombre_archivo}: {str(e)}")
                            continue
        
        logger.info(f"Sincronización WRF completada: {productos_creados} productos nuevos, {imagenes_descargadas} imágenes descargadas")
        return f"WRF sync completed: {productos_creados} new products, {imagenes_descargadas} images downloaded"
        
    except Exception as e:
        logger.error(f"Error en sincronización WRF: {str(e)}")
        raise

@shared_task
def sync_medicion_aire():
    """Sincronizar datos de medición de aire y descargar imágenes"""
    try:
        tipo_aire, created = TipoProducto.objects.get_or_create(
            nombre='MedicionAire',
            defaults={
                'descripcion': 'Visualizaciones diarias de gases de efecto invernadero',
                'url': 'https://yaku.ohmc.ar/public/MedicionAire/'
            }
        )
        
        archivos = ['CH4_webvisualizer_v4.png', 'CO2_webvisualizer_v4.png']
        hoy = date.today()
        productos_creados = 0
        imagenes_descargadas = 0
        
        for dias_atras in range(7):  # Última semana
            fecha_actual = hoy - timedelta(days=dias_atras)
            
            for archivo in archivos:
                url = f"https://yaku.ohmc.ar/public/MedicionAire/{fecha_actual.month:02d}/{fecha_actual.day:02d}/{archivo}"
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
                
                # Descargar imagen si no existe
                if not producto.foto:
                    if download_and_save_image(producto, url):
                        imagenes_descargadas += 1
                
                # Crear fecha
                FechaProducto.objects.get_or_create(
                    fecha=fecha_actual,
                    hora=datetime.strptime("10:30", "%H:%M").time(),
                    producto=producto
                )
        
        logger.info(f"Sincronización MedicionAire completada: {productos_creados} productos nuevos, {imagenes_descargadas} imágenes descargadas")
        return f"MedicionAire sync completed: {productos_creados} new products, {imagenes_descargadas} images downloaded"
        
    except Exception as e:
        logger.error(f"Error en sincronización MedicionAire: {str(e)}")
        raise

@shared_task
def sync_fwi_data():
    """Sincronizar datos FWI y descargar imagen"""
    try:
        tipo_fwi, created = TipoProducto.objects.get_or_create(
            nombre='FWI',
            defaults={
                'descripcion': 'Índice meteorológico de peligro de incendio',
                'url': 'https://yaku.ohmc.ar/public/FWI/'
            }
        )
        
        url = "https://yaku.ohmc.ar/public/FWI/FWI.png"
        
        producto, created = Producto.objects.get_or_create(
            tipo_producto=tipo_fwi,
            nombre_archivo='FWI.png',
            defaults={'url_imagen': url}
        )
        
        if not created:
            producto.url_imagen = url
            producto.save()
        
        # Descargar imagen si no existe
        imagenes_descargadas = 0
        if not producto.foto:
            if download_and_save_image(producto, url):
                imagenes_descargadas = 1
        
        # Crear fecha de hoy
        FechaProducto.objects.get_or_create(
            fecha=date.today(),
            hora=datetime.strptime("11:00", "%H:%M").time(),
            producto=producto
        )
        
        logger.info(f"Sincronización FWI completada: {imagenes_descargadas} imágenes descargadas")
        return f"FWI sync completed: {imagenes_descargadas} images downloaded"
        
    except Exception as e:
        logger.error(f"Error en sincronización FWI: {str(e)}")
        raise

@shared_task
def sync_rutas_caminera():
    """Sincronizar datos de rutas caminera y descargar imagen"""
    try:
        tipo_rutas, created = TipoProducto.objects.get_or_create(
            nombre='rutas_caminera',
            defaults={
                'descripcion': 'Animación de ráfagas de viento sobre rutas provinciales',
                'url': 'https://yaku.ohmc.ar/public/rutas_caminera/'
            }
        )
        
        url = "https://yaku.ohmc.ar/public/rutas_caminera/rafagas_rutas.gif"
        
        producto, created = Producto.objects.get_or_create(
            tipo_producto=tipo_rutas,
            nombre_archivo='rafagas_rutas.gif',
            defaults={'url_imagen': url}
        )
        
        if not created:
            producto.url_imagen = url
            producto.save()
        
        # Descargar imagen si no existe
        imagenes_descargadas = 0
        if not producto.foto:
            if download_and_save_image(producto, url):
                imagenes_descargadas = 1
        
        FechaProducto.objects.get_or_create(
            fecha=date.today(),
            hora=datetime.strptime("11:00", "%H:%M").time(),
            producto=producto
        )
        
        logger.info(f"Sincronización rutas_caminera completada: {imagenes_descargadas} imágenes descargadas")
        return f"Rutas caminera sync completed: {imagenes_descargadas} images downloaded"
        
    except Exception as e:
        logger.error(f"Error en sincronización rutas_caminera: {str(e)}")
        raise

@shared_task
def download_missing_images():
    """Descargar imágenes faltantes para productos existentes"""
    try:
        productos_sin_imagen = Producto.objects.filter(foto__isnull=True).exclude(foto='')
        total_descargadas = 0
        
        logger.info(f"Encontrados {productos_sin_imagen.count()} productos sin imagen")
        
        for producto in productos_sin_imagen:
            if download_and_save_image(producto, producto.url_imagen):
                total_descargadas += 1
        
        logger.info(f"Descarga de imágenes faltantes completada: {total_descargadas} imágenes descargadas")
        return f"Downloaded {total_descargadas} missing images"
        
    except Exception as e:
        logger.error(f"Error descargando imágenes faltantes: {str(e)}")
        raise

@shared_task
def sync_all_data():
    """Ejecutar todas las sincronizaciones"""
    results = []
    
    try:
        results.append(sync_wrf_data())
        results.append(sync_medicion_aire())
        results.append(sync_fwi_data())
        results.append(sync_rutas_caminera())
        results.append(download_missing_images())
        
        logger.info("Todas las sincronizaciones completadas")
        return results
        
    except Exception as e:
        logger.error(f"Error en sincronización general: {str(e)}")
        raise
