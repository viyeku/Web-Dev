from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0006_order_unit_price_product_price_validator'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='is_deleted',
            field=models.BooleanField(default=False),
        ),
    ]
