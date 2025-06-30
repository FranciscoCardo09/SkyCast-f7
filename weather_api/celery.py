import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'weather_api.settings')

app = Celery('weather_api')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Configurar tareas periódicas
from celery.schedules import crontab

app.conf.beat_schedule = {
    'sync-wrf-data': {
        'task': 'productos.tasks.sync_wrf_data',
        'schedule': crontab(minute=0, hour='6,18'),  # 06:00 y 18:00 UTC
    },
    'sync-medicion-aire': {
        'task': 'productos.tasks.sync_medicion_aire',
        'schedule': crontab(minute=30, hour=10),  # 10:30 UTC
    },
    'sync-fwi-data': {
        'task': 'productos.tasks.sync_fwi_data',
        'schedule': crontab(minute=0, hour=11),  # 11:00 UTC
    },
    'sync-rutas-caminera': {
        'task': 'productos.tasks.sync_rutas_caminera',
        'schedule': crontab(minute=0, hour=11),  # 11:00 UTC
    },
}
