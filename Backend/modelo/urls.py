from django.urls import path
from .views import (
    LoginUsuarioView,
    RegistroView,
    home,
    cerrar_sesion,
    PaginaInicioView
)

urlpatterns = [
    # Página de inicio
    path('', PaginaInicioView.as_view(), name='inicio'),

    # Login y registro
    path('login/', LoginUsuarioView.as_view(), name='login'),
    path('registro/', RegistroView.as_view(), name='registro'),

    # Home protegido (solo usuarios autenticados)
    path('home/', home, name='home'),

    # Logout
    path('logout/', cerrar_sesion, name='logout'),
]
