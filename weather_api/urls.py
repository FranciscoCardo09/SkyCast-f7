from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('productos.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Personalizar el admin
admin.site.site_header = "OHMC - Productos Meteorológicos"
admin.site.site_title = "OHMC Admin"
admin.site.index_title = "Gestión de Productos Meteorológicos"
