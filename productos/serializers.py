from rest_framework import serializers
from .models import TipoProducto, Producto, FechaProducto

class TipoProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoProducto
        fields = '__all__'

class FechaProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = FechaProducto
        fields = ['fecha', 'hora', 'fecha_creacion']

class ProductoSerializer(serializers.ModelSerializer):
    tipo_producto = TipoProductoSerializer(read_only=True)
    fechas = FechaProductoSerializer(many=True, read_only=True)
    ultima_fecha = serializers.SerializerMethodField()
    
    class Meta:
        model = Producto
        fields = ['id', 'url_imagen', 'tipo_producto', 'variable', 
                 'nombre_archivo', 'fechas', 'ultima_fecha']
    
    def get_ultima_fecha(self, obj):
        ultima = obj.fechas.first()
        if ultima:
            return {
                'fecha': ultima.fecha,
                'hora': ultima.hora,
                'fecha_creacion': ultima.fecha_creacion
            }
        return None

class ProductoListSerializer(serializers.ModelSerializer):
    tipo_producto_nombre = serializers.CharField(source='tipo_producto.nombre', read_only=True)
    ultima_fecha = serializers.SerializerMethodField()
    
    class Meta:
        model = Producto
        fields = ['id', 'url_imagen', 'tipo_producto_nombre', 'variable', 
                 'nombre_archivo', 'ultima_fecha']
    
    def get_ultima_fecha(self, obj):
        ultima = obj.fechas.first()
        if ultima:
            return f"{ultima.fecha} {ultima.hora}"
        return None
