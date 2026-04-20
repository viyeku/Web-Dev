from django.db import migrations, models
import django.core.validators


def fill_order_unit_price(apps, schema_editor):
    Order = apps.get_model('api', 'Order')

    for order in Order.objects.select_related('product'):
        order.unit_price = order.product.price
        order.save(update_fields=['unit_price'])


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_cart_favorite_cartitem'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='unit_price',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AlterField(
            model_name='product',
            name='price',
            field=models.DecimalField(decimal_places=2, max_digits=10, validators=[django.core.validators.MinValueValidator(0)]),
        ),
        migrations.RunPython(fill_order_unit_price, migrations.RunPython.noop),
    ]
