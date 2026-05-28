import secrets
from datetime import timedelta

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


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
    foto_perfil = models.CharField(max_length=255, blank=True, default='')

    def __str__(self):
        return self.user.username


class EmailVerificationToken(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    token = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        return timezone.now() > self.created_at + timedelta(minutes=3)

    @classmethod
    def generate_for_user(cls, user):
        cls.objects.filter(user=user).delete()
        token_str = secrets.token_urlsafe(48)
        obj = cls.objects.create(user=user, token=token_str)
        return obj.token


class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    used = models.BooleanField(default=False)

    def is_expired(self):
        return timezone.now() > self.created_at + timedelta(minutes=3)

    @classmethod
    def generate_for_user(cls, user):
        cls.objects.filter(user=user, used=False).delete()
        import random
        token_str = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        obj = cls.objects.create(user=user, token=token_str)
        return obj.token


