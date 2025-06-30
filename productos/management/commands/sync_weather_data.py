from django.core.management.base import BaseCommand
from productos.tasks import sync_all_data

class Command(BaseCommand):
    help = 'Sincronizar todos los datos meteorológicos'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--type',
            type=str,
            help='Tipo específico a sincronizar (wrf, aire, fwi, rutas)',
        )
    
    def handle(self, *args, **options):
        tipo = options.get('type')
        
        if tipo == 'wrf':
            from productos.tasks import sync_wrf_data
            result = sync_wrf_data()
            self.stdout.write(self.style.SUCCESS(f'WRF sync: {result}'))
        elif tipo == 'aire':
            from productos.tasks import sync_medicion_aire
            result = sync_medicion_aire()
            self.stdout.write(self.style.SUCCESS(f'MedicionAire sync: {result}'))
        elif tipo == 'fwi':
            from productos.tasks import sync_fwi_data
            result = sync_fwi_data()
            self.stdout.write(self.style.SUCCESS(f'FWI sync: {result}'))
        elif tipo == 'rutas':
            from productos.tasks import sync_rutas_caminera
            result = sync_rutas_caminera()
            self.stdout.write(self.style.SUCCESS(f'Rutas sync: {result}'))
        else:
            result = sync_all_data()
            self.stdout.write(self.style.SUCCESS(f'All sync completed: {result}'))
