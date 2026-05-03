from django.db import models
from django.contrib.auth.models import User

# Perfil asociado al usuario de Django
class Perfil(models.Model):
    ROL_ESTUDIANTE = 'estudiante'
    ROL_ADMIN = 'admin'
    ROL_CHOICES = [
        (ROL_ESTUDIANTE, 'Estudiante'),
        (ROL_ADMIN, 'Admin'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    tipo_documento = models.CharField(max_length=10)
    rol = models.CharField(max_length=20, choices=ROL_CHOICES, default=ROL_ESTUDIANTE)

    def __str__(self):
        return self.user.username


