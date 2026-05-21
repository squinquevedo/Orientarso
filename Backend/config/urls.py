from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
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
    path('api/user/foto-perfil/', views.api_user_profile_photo, name='api_user_profile_photo'),
    path('api/preguntas/', views.api_preguntas, name='api_preguntas'),
    path('api/areas/', views.api_areas, name='api_areas'),
    path('api/universidades-reporte/', views.api_university_report_data, name='api_university_report_data'),
    path('api/test/', views.api_test, name='api_test'),
    path('api/simular-error/<int:code>/', views.api_simular_error, name='api_simular_error'),
    path('api/admin/summary/', views.api_admin_summary, name='api_admin_summary'),
    path('api/admin/users/<int:user_id>/', views.api_admin_user_detail, name='api_admin_user_detail'),
    path('api/admin/carreras/', views.api_admin_career_create, name='api_admin_career_create'),
    path('api/admin/carreras/cargar-base/preview/', views.api_admin_career_bulk_preview, name='api_admin_career_bulk_preview'),
    path('api/admin/carreras/cargar-base/', views.api_admin_career_bulk_upload, name='api_admin_career_bulk_upload'),
    path('api/admin/carreras/vinculacion/preview/', views.api_admin_university_career_link_preview, name='api_admin_university_career_link_preview'),
    path('api/admin/beneficios-carrera/preview/', views.api_admin_university_benefit_preview, name='api_admin_university_benefit_preview'),
    path('api/admin/convenios/preview/', views.api_admin_university_agreement_preview, name='api_admin_university_agreement_preview'),
    path('api/admin/carreras/<int:career_id>/', views.api_admin_career_detail, name='api_admin_career_detail'),
    path('api/admin/entidades-apoyo/', views.api_admin_entity_create, name='api_admin_entity_create'),
    path('api/admin/entidades-apoyo/<int:entity_id>/', views.api_admin_entity_detail, name='api_admin_entity_detail'),
    path('api/admin/universidades/', views.api_admin_university_create, name='api_admin_university_create'),
    path('api/admin/universidades/<int:university_id>/', views.api_admin_university_detail, name='api_admin_university_detail'),
    
    # DRF
    path('api-auth/', include('rest_framework.urls')),
    
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
