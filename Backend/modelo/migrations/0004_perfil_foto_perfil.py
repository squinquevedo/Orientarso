from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('modelo', '0003_perfil_rol'),
    ]

    operations = [
        migrations.AddField(
            model_name='perfil',
            name='foto_perfil',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
    ]
