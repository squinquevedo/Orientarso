from django.db import models
from django.contrib.auth.models import User

# Perfil asociado al usuario de Django
class Perfil(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    tipo_documento = models.CharField(max_length=10)

    def __str__(self):
        return self.user.username


