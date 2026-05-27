# Importa el módulo admin de Django para acceder a la interfaz de administración.
# Importa settings para acceder a configuraciones como DEBUG y MEDIA_URL.
# Importa static para servir archivos multimedia en desarrollo.
# Importa path e include para definir rutas URL.
# Importa las vistas desde la app modelo para conectar las URLs con las funciones de vista.
from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include
from Backend.modelo import views

# urlpatterns: Lista de patrones de URL que conectan rutas con vistas.
urlpatterns = [
    # Conecta la ruta 'admin/' con la interfaz de administración de Django.
    path('admin/', admin.site.urls),
    
    # ✅ APIs REST para React (Lo único que necesitamos ahora)
    # Conecta la ruta 'api/csrf/' con la vista api_csrf para obtener el token CSRF.
    # Conecta la ruta 'api/login/' con la vista api_login para autenticar usuarios.
    # Conecta la ruta 'api/registro/' con la vista api_registro para registrar nuevos usuarios.
    # Conecta la ruta 'api/logout/' con la vista api_logout para cerrar sesión.
    # Conecta la ruta 'api/user/' con la vista api_user para obtener datos del usuario actual..
    # Conecta la ruta 'api/user/foto-perfil/' con la vista api_user_profile_photo para gestionar fotos de perfil.
    # Conecta la ruta 'api/preguntas/' con la vista api_preguntas para obtener preguntas del test.
    # Conecta la ruta 'api/areas/' con la vista api_areas para obtener áreas de estudio.
    # Conecta la ruta 'api/universidades-reporte/' con la vista api_university_report_data para datos de reporte.
    # Conecta la ruta 'api/test/' con la vista api_test para procesar el test de orientación.
    # Conecta la ruta 'api/admin/summary/' con la vista api_admin_summary para resumen administrativo.
    # Conecta la ruta 'api/admin/users/<int:user_id>/' con la vista api_admin_user_detail para detalles de usuario.
    # Conecta la ruta 'api/admin/carreras/' con la vista api_admin_career_create para crear carreras
    # Conecta la ruta 'api/admin/carreras/cargar-base/preview/' con la vista api_admin_career_bulk_preview para previsualizar carga masiva.
    # Conecta la ruta 'api/admin/carreras/cargar-base/' con la vista api_admin_career_bulk_upload para carga masiva de carreras.
    # Conecta la ruta 'api/admin/beneficios-carrera/preview/' con la vista api_admin_university_benefit_preview para previsualizar beneficios.
    # Conecta la ruta 'api/admin/convenios/preview/' con la vista api_admin_university_agreement_preview para previsualizar convenios.
    # Conecta la ruta 'api/admin/carreras/<int:career_id>/' con la vista api_admin_career_detail para detalles de carrera.
    # Conecta la ruta 'api/admin/entidades-apoyo/' con la vista api_admin_entity_create para crear entidades de apoyo.
    # Conecta la ruta 'api/admin/entidades-apoyo/<int:entity_id>/' con la vista api_admin_entity_detail para detalles de entidad.
    # Conecta la ruta 'api/admin/universidades/' con la vista api_admin_university_create para crear universidades.
    # Conecta la ruta 'api/admin/universidades/<int:university_id>/' con la vista api_admin_university_detail para detalles de universidad.
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
    
    # DRF: Incluye las URLs de autenticación de Django REST Framework.
    path('api-auth/', include('rest_framework.urls')),
    
]

# Si DEBUG está activado en settings, añade rutas para servir archivos multimedia en desarrollo, conectando MEDIA_URL con MEDIA_ROOT.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
