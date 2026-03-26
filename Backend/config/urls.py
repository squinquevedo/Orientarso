from django.contrib import admin
from django.urls import path, include
from Backend.modelo import views

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # ✅ APIs REST para React (Lo único que necesitamos ahora)
    path('api/csrf/', views.api_csrf, name='api_csrf'),
    path('api/login/', views.api_login, name='api_login'),
    path('api/registro/', views.api_registro, name='api_registro'),
    path('api/logout/', views.api_logout, name='api_logout'),
    path('api/user/', views.api_user, name='api_user'),
    path('api/preguntas/', views.api_preguntas, name='api_preguntas'),
    path('api/areas/', views.api_areas, name='api_areas'),
    path('api/test/', views.api_test, name='api_test'),
    
    # DRF
    path('api-auth/', include('rest_framework.urls')),
    
]
