from django.db import migrations, models


def seed_roles(apps, schema_editor):
    Perfil = apps.get_model('modelo', 'Perfil')
    User = apps.get_model('auth', 'User')

    existing_profile_user_ids = set(Perfil.objects.values_list('user_id', flat=True))

    for user in User.objects.all():
        rol = 'admin' if (user.email or '').lower() == 'admin@orientarso.com' else 'estudiante'
        if user.id in existing_profile_user_ids:
            Perfil.objects.filter(user_id=user.id).update(rol=rol)
            continue
        Perfil.objects.create(
            user_id=user.id,
            tipo_documento='CC',
            rol=rol,
        )


class Migration(migrations.Migration):

    dependencies = [
        ('modelo', '0002_alter_perfil_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='perfil',
            name='rol',
            field=models.CharField(
                choices=[('estudiante', 'Estudiante'), ('admin', 'Admin')],
                default='estudiante',
                max_length=20,
            ),
        ),
        migrations.RunPython(seed_roles, migrations.RunPython.noop),
    ]
