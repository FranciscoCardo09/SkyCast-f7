# Generated migration for productos app

from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='TipoProducto',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(max_length=100, unique=True)),
                ('descripcion', models.TextField()),
                ('url', models.URLField()),
            ],
            options={
                'verbose_name': 'Tipo de Producto',
                'verbose_name_plural': 'Tipos de Productos',
            },
        ),
        migrations.CreateModel(
            name='Producto',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('foto', models.ImageField(blank=True, null=True, upload_to='productos/')),
                ('url_imagen', models.URLField(max_length=500)),
                ('variable', models.CharField(blank=True, max_length=50, null=True)),
                ('nombre_archivo', models.CharField(max_length=200)),
                ('tipo_producto', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='productos.tipoproducto')),
            ],
            options={
                'verbose_name': 'Producto',
                'verbose_name_plural': 'Productos',
            },
        ),
        migrations.CreateModel(
            name='FechaProducto',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('fecha', models.DateField()),
                ('hora', models.TimeField()),
                ('fecha_creacion', models.DateTimeField(default=django.utils.timezone.now)),
                ('producto', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='fechas', to='productos.producto')),
            ],
            options={
                'verbose_name': 'Fecha de Producto',
                'verbose_name_plural': 'Fechas de Productos',
                'ordering': ['-fecha', '-hora'],
            },
        ),
        migrations.AddConstraint(
            model_name='fechaproducto',
            constraint=models.UniqueConstraint(fields=('fecha', 'hora', 'producto'), name='unique_fecha_hora_producto'),
        ),
    ]
