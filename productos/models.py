from django.db import models
from django.utils import timezone

class TipoProducto(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField()
    url = models.URLField()
    
    class Meta:
        verbose_name = "Tipo de Producto"
        verbose_name_plural = "Tipos de Productos"
    
    def __str__(self):
        return self.nombre

class Producto(models.Model):
    foto = models.ImageField(upload_to='productos/', null=True, blank=True)
    url_imagen = models.URLField(max_length=500)
    tipo_producto = models.ForeignKey(TipoProducto, on_delete=models.CASCADE)
    variable = models.CharField(max_length=50, null=True, blank=True)  # Para WRF
    nombre_archivo = models.CharField(max_length=200)
    
    class Meta:
        verbose_name = "Producto"
        verbose_name_plural = "Productos"
    
    def __str__(self):
        return f"{self.tipo_producto.nombre} - {self.nombre_archivo}"

class FechaProducto(models.Model):
    fecha = models.DateField()
    hora = models.TimeField()
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='fechas')
    fecha_creacion = models.DateTimeField(default=timezone.now)
    
    class Meta:
        verbose_name = "Fecha de Producto"
        verbose_name_plural = "Fechas de Productos"
        unique_together = ['fecha', 'hora', 'producto']
        ordering = ['-fecha', '-hora']
    
    def __str__(self):
        return f"{self.producto} - {self.fecha} {self.hora}"
