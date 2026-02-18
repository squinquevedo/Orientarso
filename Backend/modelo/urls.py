from django.urls import path
from .views import (
    LoginUsuarioView,
    RegistroView,
    home,
    cerrar_sesion,
    PaginaInicioView
)

urlpatterns = [
    path('', PaginaInicioView.as_view(), name='inicio'),
    path('login/', LoginUsuarioView.as_view(), name='login'),
    path('registro/', RegistroView.as_view(), name='registro'),
    path('home/', home, name='home'),
    path('logout/', cerrar_sesion, name='logout'),
]
