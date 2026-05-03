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
    path('api/admin/summary/', views.api_admin_summary, name='api_admin_summary'),
    path('api/admin/users/<int:user_id>/', views.api_admin_user_detail, name='api_admin_user_detail'),
    path('api/admin/carreras/', views.api_admin_career_create, name='api_admin_career_create'),
    path('api/admin/carreras/<int:career_id>/', views.api_admin_career_detail, name='api_admin_career_detail'),
    path('api/admin/entidades-apoyo/', views.api_admin_entity_create, name='api_admin_entity_create'),
    path('api/admin/entidades-apoyo/<int:entity_id>/', views.api_admin_entity_detail, name='api_admin_entity_detail'),
    path('api/admin/universidades/', views.api_admin_university_create, name='api_admin_university_create'),
    path('api/admin/universidades/<int:university_id>/', views.api_admin_university_detail, name='api_admin_university_detail'),
    
    # DRF
    path('api-auth/', include('rest_framework.urls')),
    
]
