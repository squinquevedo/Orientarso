from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.shortcuts import render, redirect
from django.contrib import messages
from django.views import View
from django.views.generic import TemplateView
from django.contrib.auth.decorators import login_required
from django.views.decorators.cache import never_cache
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from .models import Perfil


# ==========================
# REGISTRO
# ==========================
class RegistroView(TemplateView):
    template_name = 'registro.html'

    def get(self, request, *args, **kwargs):
        return render(request, self.template_name)

    def post(self, request, *args, **kwargs):
        username = request.POST.get('numero_documento')
        first_name = request.POST.get('nombre_completo')
        email = request.POST.get('email')
        tipo_documento = request.POST.get('tipo_documento')
        password1 = request.POST.get('password1')
        password2 = request.POST.get('password2')

        # Validar formato de email
        try:
            validate_email(email)
        except ValidationError:
            messages.error(request, "El correo no tiene un formato válido")
            return render(request, self.template_name)

        # Validar contraseñas
        if password1 != password2:
            messages.error(request, "Las contraseñas no coinciden")
            return render(request, self.template_name)

        # Validar que usuario o correo no existan
        if User.objects.filter(username=username).exists():
            messages.error(request, "El usuario ya existe")
            return render(request, self.template_name)

        if User.objects.filter(email=email).exists():
            messages.error(request, "El correo ya está registrado")
            return render(request, self.template_name)

        # Crear usuario
        user = User.objects.create_user(
            username=username,
            first_name=first_name,
            email=email,
            password=password1
        )

        # Crear perfil asociado
        Perfil.objects.create(
            user=user,
            tipo_documento=tipo_documento
        )

        messages.success(request, "Usuario registrado correctamente")
        return redirect('login')


# ==========================
# LOGIN
# ==========================
class LoginUsuarioView(View):
    template_name = 'login.html'

    def get(self, request):
        if request.user.is_authenticated:
            return redirect('home')
        return render(request, self.template_name)

    def post(self, request):
        email = request.POST.get('username')
        password = request.POST.get('password')

        # Buscar usuario por email
        try:
            user_obj = User.objects.get(email=email)
            username = user_obj.username
        except User.DoesNotExist:
            messages.error(request, "El correo no está registrado")
            return render(request, self.template_name)

        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            next_url = request.GET.get('next')
            return redirect(next_url if next_url else 'home')
        else:
            messages.error(request, "Contraseña incorrecta")
            return render(request, self.template_name)


# ==========================
# HOME
# ==========================
@login_required
@never_cache
def home(request):
    return render(request, 'home.html')


# ==========================
# LOGOUT
# ==========================
def cerrar_sesion(request):
    logout(request)
    return redirect('login')


# ==========================
# PAGINA INICIO
# ==========================
class PaginaInicioView(TemplateView):
    template_name = 'inicio.html'
