from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.shortcuts import render, redirect
from django.contrib import messages
from django.views import View
from django.views.generic import TemplateView
from django.contrib.auth.decorators import login_required
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

        if password1 != password2:
            messages.error(request, "Las contraseñas no coinciden")
            return render(request, self.template_name)

        if User.objects.filter(username=username).exists():
            messages.error(request, "El usuario ya existe")
            return render(request, self.template_name)

        if User.objects.filter(email=email).exists():
            messages.error(request, "El correo ya está registrado")
            return render(request, self.template_name)

        user = User.objects.create_user(
            username=username,
            first_name=first_name,
            email=email,
            password=password1
        )

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
        return render(request, self.template_name)

    def post(self, request):
        email = request.POST.get('username')
        password = request.POST.get('password')

        try:
            user_obj = User.objects.get(email=email)
        except User.DoesNotExist:
            messages.error(request, "El correo no está registrado")
            return render(request, self.template_name)

        user = authenticate(username=user_obj.username, password=password)

        if user is not None:
            login(request, user)
            return redirect('home')
        else:
            messages.error(request, "Contraseña incorrecta")
            return render(request, self.template_name)


# ==========================
# HOME
# ==========================
@login_required
def home(request):
    return render(request, 'home.html')


# ==========================
# LOGOUT
# ==========================
# ==========================
# LOGOUT
# ==========================
from django.contrib.auth import logout

def cerrar_sesion(request):
    logout(request)
    return redirect('login')


from django.views.generic import TemplateView

class PaginaInicioView(TemplateView):
    template_name = 'inicio.html'
