import json
import csv
from pathlib import Path
from io import BytesIO, StringIO

from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.db import connection, transaction
from django.middleware.csrf import get_token
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Perfil


ADMIN_EMAIL = 'admin@orientarso.com'


def dictfetchall(cursor):
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def parse_json_request(request):
    if request.data:
        return request.data
    body = request.body.decode('utf-8') if request.body else '{}'
    return json.loads(body or '{}')


def normalize_bool(value):
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in ['1', 'true', 'si', 'sí', 'yes', 'activo', 'activa']
    return bool(value)


def ensure_careers_active_column(cursor):
    cursor.execute("SHOW COLUMNS FROM carreras LIKE 'activa'")
    if cursor.fetchone():
        return
    cursor.execute('ALTER TABLE carreras ADD COLUMN activa TINYINT(1) NOT NULL DEFAULT 1')


def get_or_create_profile(user, tipo_documento='CC'):
    profile, _ = Perfil.objects.get_or_create(
        user=user,
        defaults={
            'tipo_documento': tipo_documento or 'CC',
            'rol': Perfil.ROL_ADMIN if (user.email or '').lower() == ADMIN_EMAIL else Perfil.ROL_ESTUDIANTE,
        },
    )

    expected_role = Perfil.ROL_ADMIN if (user.email or '').lower() == ADMIN_EMAIL else profile.rol
    updated_fields = []

    if not profile.tipo_documento:
        profile.tipo_documento = tipo_documento or 'CC'
        updated_fields.append('tipo_documento')

    if profile.rol != expected_role:
        profile.rol = expected_role
        updated_fields.append('rol')

    if updated_fields:
        profile.save(update_fields=updated_fields)

    return profile


def build_user_payload(user, profile=None):
    profile = profile or get_or_create_profile(user)
    is_admin = profile.rol == Perfil.ROL_ADMIN or (user.email or '').lower() == ADMIN_EMAIL
    foto_perfil_url = ''
    if profile.foto_perfil:
        foto_perfil_url = f'{settings.MEDIA_URL}{profile.foto_perfil}'
    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'tipo_documento': profile.tipo_documento,
        'foto_perfil': profile.foto_perfil,
        'foto_perfil_url': foto_perfil_url,
        'rol': Perfil.ROL_ADMIN if is_admin else profile.rol,
        'is_admin': is_admin,
        'is_authenticated': user.is_authenticated,
        'is_active': user.is_active,
    }


def ensure_admin_user(request):
    profile = get_or_create_profile(request.user)
    is_admin = profile.rol == Perfil.ROL_ADMIN or (request.user.email or '').lower() == ADMIN_EMAIL
    if not is_admin:
        return None, Response(
            {'error': 'No tienes permisos para acceder a este recurso'},
            status=status.HTTP_403_FORBIDDEN,
        )
    return profile, None


def serialize_university_rows():
    with connection.cursor() as cursor:
        cursor.execute(
            '''
            SELECT
                u.id,
                u.nombre,
                u.tipo,
                u.localidad,
                u.direccion,
                u.sitio_web
            FROM universidades u
            ORDER BY u.nombre
            '''
        )
        universities = dictfetchall(cursor)

        cursor.execute(
            '''
            SELECT
                cu.id,
                cu.id_universidad,
                cu.id_carrera,
                c.Nom_carrera AS nombre_carrera,
                c.ID_area AS id_area,
                cu.modalidad,
                cu.duracion_semestres,
                cu.valor_semestre,
                cu.jornada,
                cu.activa
            FROM carrera_universidad cu
            INNER JOIN carreras c ON c.ID = cu.id_carrera
            ORDER BY cu.id_universidad, c.Nom_carrera
            '''
        )
        carreras = dictfetchall(cursor)

        cursor.execute(
            '''
            SELECT
                b.id,
                b.id_universidad,
                b.id_carrera,
                c.Nom_carrera AS nombre_carrera,
                b.tipo_beneficio,
                b.descripcion,
                b.porcentaje_descuento
            FROM beneficios_carrera b
            INNER JOIN carreras c ON c.ID = b.id_carrera
            ORDER BY b.id_universidad, c.Nom_carrera, b.tipo_beneficio
            '''
        )
        beneficios = dictfetchall(cursor)

        cursor.execute(
            '''
            SELECT
                cv.id,
                cv.id_universidad,
                cv.id_carrera,
                c.Nom_carrera AS nombre_carrera,
                cv.id_entidad,
                e.nombre AS nombre_entidad,
                cv.nombre_convenio,
                cv.descripcion,
                cv.fecha_inicio,
                cv.fecha_fin,
                cv.vigente
            FROM convenios cv
            INNER JOIN carreras c ON c.ID = cv.id_carrera
            INNER JOIN entidades_apoyo e ON e.id = cv.id_entidad
            ORDER BY cv.id_universidad, cv.nombre_convenio
            '''
        )
        convenios = dictfetchall(cursor)

    by_university = {row['id']: row for row in universities}
    for university in universities:
        university['carreras'] = []
        university['beneficios_carrera'] = []
        university['convenios'] = []
        university['entidades_apoyo'] = []
        university['tiene_convenios'] = False
        university['tiene_beneficios_carrera'] = False
        university['tiene_entidades_apoyo'] = False

    for carrera in carreras:
        carrera['activa'] = bool(carrera['activa'])
        by_university[carrera['id_universidad']]['carreras'].append(carrera)

    for beneficio in beneficios:
        by_university[beneficio['id_universidad']]['beneficios_carrera'].append(beneficio)
        by_university[beneficio['id_universidad']]['tiene_beneficios_carrera'] = True

    entity_seen = {}
    for convenio in convenios:
        convenio['vigente'] = bool(convenio['vigente'])
        if convenio['fecha_inicio'] is not None:
            convenio['fecha_inicio'] = convenio['fecha_inicio'].isoformat()
        if convenio['fecha_fin'] is not None:
            convenio['fecha_fin'] = convenio['fecha_fin'].isoformat()

        university = by_university[convenio['id_universidad']]
        university['convenios'].append(convenio)
        university['tiene_convenios'] = True
        university['tiene_entidades_apoyo'] = True

        entity_seen.setdefault(university['id'], set())
        entity_key = convenio['id_entidad']
        if entity_key not in entity_seen[university['id']]:
            university['entidades_apoyo'].append({
                'id': convenio['id_entidad'],
                'nombre': convenio['nombre_entidad'],
            })
            entity_seen[university['id']].add(entity_key)

    return universities


def fetch_catalog_data():
    with connection.cursor() as cursor:
        ensure_careers_active_column(cursor)
        cursor.execute('SELECT id, nom_area FROM tb_area ORDER BY nom_area')
        areas = dictfetchall(cursor)

        cursor.execute(
            '''
            SELECT
                c.ID AS id,
                c.Nom_carrera AS nombre,
                c.ID_area AS id_area,
                a.nom_area AS area,
                c.activa
            FROM carreras c
            LEFT JOIN tb_area a ON a.id = c.ID_area
            ORDER BY c.Nom_carrera
            '''
        )
        carreras = dictfetchall(cursor)
        for carrera in carreras:
            carrera['activa'] = bool(carrera['activa'])

        cursor.execute(
            '''
            SELECT
                id,
                nombre,
                tipo,
                descripcion,
                contacto,
                sitio_web
            FROM entidades_apoyo
            ORDER BY nombre
            '''
        )
        entidades = dictfetchall(cursor)

    return {
        'areas': areas,
        'carreras_catalogo': carreras,
        'entidades_catalogo': entidades,
    }


def sync_university_relations(cursor, university_id, payload):
    carreras = payload.get('carreras') or []
    beneficios = payload.get('beneficios_carrera') or []
    convenios = payload.get('convenios') or []

    cursor.execute('DELETE FROM beneficios_carrera WHERE id_universidad = %s', [university_id])
    cursor.execute('DELETE FROM convenios WHERE id_universidad = %s', [university_id])
    cursor.execute('DELETE FROM carrera_universidad WHERE id_universidad = %s', [university_id])

    for carrera in carreras:
        id_carrera = carrera.get('id_carrera')
        if not id_carrera:
            continue
        cursor.execute(
            '''
            INSERT INTO carrera_universidad (
                id_carrera,
                id_universidad,
                modalidad,
                duracion_semestres,
                valor_semestre,
                jornada,
                activa
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            ''',
            [
                id_carrera,
                university_id,
                (carrera.get('modalidad') or '').strip() or None,
                carrera.get('duracion_semestres') or None,
                carrera.get('valor_semestre') or None,
                (carrera.get('jornada') or '').strip() or None,
                1 if normalize_bool(carrera.get('activa', True)) else 0,
            ],
        )

    for beneficio in beneficios:
        id_carrera = beneficio.get('id_carrera')
        tipo_beneficio = (beneficio.get('tipo_beneficio') or '').strip()
        if not id_carrera or not tipo_beneficio:
            continue
        cursor.execute(
            '''
            INSERT INTO beneficios_carrera (
                id_carrera,
                id_universidad,
                tipo_beneficio,
                descripcion,
                porcentaje_descuento
            ) VALUES (%s, %s, %s, %s, %s)
            ''',
            [
                id_carrera,
                university_id,
                tipo_beneficio,
                (beneficio.get('descripcion') or '').strip() or None,
                (beneficio.get('porcentaje_descuento') or '').strip() or None,
            ],
        )

    for convenio in convenios:
        id_carrera = convenio.get('id_carrera')
        id_entidad = convenio.get('id_entidad')
        nombre_convenio = (convenio.get('nombre_convenio') or '').strip()
        if not id_carrera or not id_entidad or not nombre_convenio:
            continue
        cursor.execute(
            '''
            INSERT INTO convenios (
                id_carrera,
                id_universidad,
                id_entidad,
                nombre_convenio,
                descripcion,
                fecha_inicio,
                fecha_fin,
                vigente
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ''',
            [
                id_carrera,
                university_id,
                id_entidad,
                nombre_convenio,
                (convenio.get('descripcion') or '').strip() or None,
                convenio.get('fecha_inicio') or None,
                convenio.get('fecha_fin') or None,
                1 if normalize_bool(convenio.get('vigente', True)) else 0,
            ],
        )


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def api_login(request):
    try:
        data = json.loads(request.body)
        identifier = (data.get('username') or '').strip()
        password = (data.get('password') or '').strip()

        user = None
        if '@' in identifier:
            user = User.objects.filter(email__iexact=identifier).first()
        if user is None:
            user = User.objects.filter(username__iexact=identifier).first()

        if user is None:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        authenticated = authenticate(request, username=user.username, password=password)
        if authenticated is None:
            return Response({'error': 'Contrasena incorrecta'}, status=status.HTTP_401_UNAUTHORIZED)

        login(request, authenticated)
        profile = get_or_create_profile(authenticated)
        payload = build_user_payload(authenticated, profile)
        payload['message'] = 'Login exitoso'
        return Response(payload, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def api_registro(request):
    try:
        data = json.loads(request.body)

        tipo_documento = (data.get('tipo_documento') or '').strip()
        numero_documento = (data.get('numero_documento') or '').strip()
        nombre_completo = (data.get('nombre_completo') or '').strip()
        email = (data.get('email') or '').strip().lower()
        password1 = (data.get('password1') or '').strip()
        password2 = (data.get('password2') or '').strip()

        if not all([tipo_documento, numero_documento, nombre_completo, email, password1, password2]):
            return Response({'error': 'Todos los campos son requeridos'}, status=status.HTTP_400_BAD_REQUEST)

        if password1 != password2:
            return Response({'error': 'Las contraseñas no coinciden'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username__iexact=numero_documento).exists():
            return Response({'error': 'El numero de documento ya esta registrado'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email__iexact=email).exists():
            return Response({'error': 'El email ya está registrado'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            user = User.objects.create_user(
                username=numero_documento,
                email=email,
                password=password1,
                first_name=nombre_completo,
            )
            profile = get_or_create_profile(user, tipo_documento=tipo_documento)
            profile.tipo_documento = tipo_documento
            if (user.email or '').lower() != ADMIN_EMAIL:
                profile.rol = Perfil.ROL_ESTUDIANTE
            profile.save(update_fields=['tipo_documento', 'rol'])

        return Response(
            {
                'message': 'Usuario registrado exitosamente',
                'username': user.username,
                'email': user.email,
                'rol': profile.rol,
            },
            status=status.HTTP_201_CREATED,
        )
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_logout(request):
    logout(request)
    return Response({'message': 'Logout exitoso'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_user(request):
    payload = build_user_payload(request.user)
    if payload.get('foto_perfil_url'):
        payload['foto_perfil_url'] = request.build_absolute_uri(payload['foto_perfil_url'])
    return Response(payload, status=status.HTTP_200_OK)


@csrf_exempt
@api_view(['POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def api_user_profile_photo(request):
    profile = get_or_create_profile(request.user)

    if request.method == 'DELETE':
        if profile.foto_perfil:
            old_path = settings.MEDIA_ROOT / profile.foto_perfil
            if old_path.exists():
                old_path.unlink()
        profile.foto_perfil = ''
        profile.save(update_fields=['foto_perfil'])
        return Response({'foto_perfil_url': ''}, status=status.HTTP_200_OK)

    uploaded_file = request.FILES.get('foto') or request.FILES.get('file')
    if not uploaded_file:
        return Response({'error': 'No se envio ninguna foto'}, status=status.HTTP_400_BAD_REQUEST)

    if uploaded_file.size > 1024 * 1024:
        return Response({'error': 'La foto debe pesar maximo 1 MB'}, status=status.HTTP_400_BAD_REQUEST)

    content_type = (uploaded_file.content_type or '').lower()
    if content_type and not content_type.startswith('image/'):
        return Response({'error': 'El archivo debe ser una imagen'}, status=status.HTTP_400_BAD_REQUEST)

    photo_dir = settings.MEDIA_ROOT / 'user_photos'
    photo_dir.mkdir(parents=True, exist_ok=True)

    relative_path = Path('user_photos') / f'user_{request.user.id}.webp'
    absolute_path = settings.MEDIA_ROOT / relative_path

    if profile.foto_perfil and profile.foto_perfil != relative_path.as_posix():
        old_path = settings.MEDIA_ROOT / profile.foto_perfil
        if old_path.exists():
            old_path.unlink()

    with absolute_path.open('wb') as destination:
        for chunk in uploaded_file.chunks():
            destination.write(chunk)

    profile.foto_perfil = relative_path.as_posix()
    profile.save(update_fields=['foto_perfil'])

    return Response(
        {
            'foto_perfil': profile.foto_perfil,
            'foto_perfil_url': request.build_absolute_uri(f'{settings.MEDIA_URL}{profile.foto_perfil}'),
        },
        status=status.HTTP_200_OK,
    )


@ensure_csrf_cookie
@api_view(['GET'])
@permission_classes([AllowAny])
@authentication_classes([])
def api_csrf(request):
    return Response({'csrfToken': get_token(request)}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_preguntas(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT id, pregunta, valor, id_area FROM tb_preguntas ORDER BY id')
            rows = cursor.fetchall()

        preguntas = [
            {
                'id': row[0],
                'pregunta': row[1],
                'valor': row[2],
                'id_area': row[3],
            }
            for row in rows
        ]
        return Response(preguntas, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_areas(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT id, nom_area FROM tb_area ORDER BY id')
            rows = cursor.fetchall()

        areas = [{'id': row[0], 'nom_area': row[1]} for row in rows]
        return Response(areas, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_university_report_data(request):
    try:
        return Response(
            {
                'universities': serialize_university_rows(),
                **fetch_catalog_data(),
            },
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_test(request):
    try:
        data = request.data or {}
        respuestas = data.get('respuestas') or []

        if not isinstance(respuestas, list):
            return Response({'error': 'Formato de respuestas invalido'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            with connection.cursor() as cursor:
                cursor.execute('SELECT COUNT(*) FROM tb_test WHERE id_auth_user = %s', [request.user.id])
                count = cursor.fetchone()[0] or 0
                intento = count + 1

                cursor.execute('SELECT MAX(id) FROM tb_test')
                max_id = cursor.fetchone()[0] or 0
                test_id = max_id + 1

                cursor.execute(
                    'INSERT INTO tb_test (id, id_auth_user, fecha_registro, intento) VALUES (%s, %s, %s, %s)',
                    [test_id, request.user.id, timezone.now(), intento],
                )

                valores = []
                for item in respuestas:
                    try:
                        id_pregunta = int(item.get('id_pregunta'))
                        respuesta = float(item.get('respuesta'))
                    except (TypeError, ValueError):
                        continue
                    valores.append((test_id, id_pregunta, respuesta))

                if valores:
                    cursor.execute('SELECT MAX(id) FROM tb_respuesta')
                    max_resp_id = cursor.fetchone()[0] or 0
                    valores_con_id = []
                    for idx, (id_test_val, id_pregunta_val, respuesta_val) in enumerate(valores, start=1):
                        valores_con_id.append((max_resp_id + idx, id_test_val, id_pregunta_val, respuesta_val))
                    cursor.executemany(
                        'INSERT INTO tb_respuesta (id, id_test, id_pregunta, respuesta) VALUES (%s, %s, %s, %s)',
                        valores_con_id,
                    )

        return Response({'id_test': test_id, 'intento': intento}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_admin_summary(request):
    _, error_response = ensure_admin_user(request)
    if error_response:
        return error_response

    return Response(
        {
            'users': [build_user_payload(user) for user in User.objects.order_by('id')],
            'universities': serialize_university_rows(),
            **fetch_catalog_data(),
        },
        status=status.HTTP_200_OK,
    )


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def api_admin_user_detail(request, user_id):
    _, error_response = ensure_admin_user(request)
    if error_response:
        return error_response

    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        if user.id == request.user.id:
            return Response({'error': 'No puedes eliminar tu propio usuario admin'}, status=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            with connection.cursor() as cursor:
                cursor.execute('DELETE FROM django_admin_log WHERE user_id = %s', [user.id])
                cursor.execute('DELETE FROM auth_user_groups WHERE user_id = %s', [user.id])
                cursor.execute('DELETE FROM auth_user_user_permissions WHERE user_id = %s', [user.id])
                cursor.execute('DELETE FROM usuarios_perfil WHERE user_id = %s', [user.id])
                cursor.execute(
                    '''
                    DELETE FROM tb_respuesta
                    WHERE id_test IN (
                        SELECT id FROM tb_test WHERE id_auth_user = %s
                    )
                    ''',
                    [user.id],
                )
                cursor.execute('DELETE FROM tb_test WHERE id_auth_user = %s', [user.id])
            user.delete()
        return Response({'message': 'Usuario eliminado'}, status=status.HTTP_200_OK)

    data = parse_json_request(request)
    email = (data.get('email') or user.email).strip().lower()
    if not email:
        return Response({'error': 'El email es obligatorio'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.exclude(pk=user.id).filter(email__iexact=email).exists():
        return Response({'error': 'Ya existe otro usuario con ese email'}, status=status.HTTP_400_BAD_REQUEST)

    username = (data.get('username') or user.username).strip()
    if not username:
        return Response({'error': 'El numero de documento es obligatorio'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.exclude(pk=user.id).filter(username__iexact=username).exists():
        return Response({'error': 'Ya existe otro usuario con ese numero de documento'}, status=status.HTTP_400_BAD_REQUEST)

    rol = (data.get('rol') or Perfil.ROL_ESTUDIANTE).strip().lower()
    if email == ADMIN_EMAIL:
        rol = Perfil.ROL_ADMIN
    elif rol not in [Perfil.ROL_ADMIN, Perfil.ROL_ESTUDIANTE]:
        rol = Perfil.ROL_ESTUDIANTE

    user.email = email
    user.username = username
    user.first_name = (data.get('first_name') or user.first_name).strip()
    if 'is_active' in data:
        user.is_active = normalize_bool(data.get('is_active'))
    user.save()

    profile = get_or_create_profile(user, tipo_documento=(data.get('tipo_documento') or 'CC').strip())
    profile.tipo_documento = (data.get('tipo_documento') or profile.tipo_documento or 'CC').strip()
    profile.rol = rol
    profile.save(update_fields=['tipo_documento', 'rol'])

    return Response(build_user_payload(user, profile), status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_admin_career_create(request):
    _, error_response = ensure_admin_user(request)
    if error_response:
        return error_response

    data = parse_json_request(request)
    nombre = (data.get('nombre') or '').strip()
    id_area = data.get('id_area')
    activa = normalize_bool(data.get('activa', True))
    if not nombre or not id_area:
        return Response({'error': 'Nombre e area son obligatorios'}, status=status.HTTP_400_BAD_REQUEST)

    with connection.cursor() as cursor:
        ensure_careers_active_column(cursor)
        cursor.execute(
            'INSERT INTO carreras (Nom_carrera, ID_area, activa) VALUES (%s, %s, %s)',
            [nombre, id_area, 1 if activa else 0],
        )
        career_id = cursor.lastrowid

    return Response({'id': career_id, 'nombre': nombre, 'id_area': id_area, 'activa': activa}, status=status.HTTP_201_CREATED)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def api_admin_career_detail(request, career_id):
    _, error_response = ensure_admin_user(request)
    if error_response:
        return error_response

    with connection.cursor() as cursor:
        ensure_careers_active_column(cursor)
        if request.method == 'DELETE':
            cursor.execute('UPDATE carreras SET activa = 0 WHERE ID = %s', [career_id])
            cursor.execute('UPDATE carrera_universidad SET activa = 0 WHERE id_carrera = %s', [career_id])
            return Response({'message': 'Carrera desactivada'}, status=status.HTTP_200_OK)

        data = parse_json_request(request)
        nombre = (data.get('nombre') or '').strip()
        id_area = data.get('id_area')
        activa = normalize_bool(data.get('activa', True))
        if not nombre or not id_area:
            return Response({'error': 'Nombre e area son obligatorios'}, status=status.HTTP_400_BAD_REQUEST)

        cursor.execute(
            'UPDATE carreras SET Nom_carrera = %s, ID_area = %s, activa = %s WHERE ID = %s',
            [nombre, id_area, 1 if activa else 0, career_id],
        )

    return Response({'id': career_id, 'nombre': nombre, 'id_area': id_area, 'activa': activa}, status=status.HTTP_200_OK)


def parse_career_bulk_file(uploaded_file):
    filename = (uploaded_file.name or '').lower()
    if filename.endswith('.csv'):
        content = uploaded_file.read().decode('utf-8-sig')
        return list(csv.DictReader(StringIO(content)))

    if filename.endswith('.xlsx'):
        from openpyxl import load_workbook

        workbook = load_workbook(BytesIO(uploaded_file.read()), read_only=True, data_only=True)
        sheet = workbook.active
        rows = list(sheet.iter_rows(values_only=True))
        if not rows:
            return []
        headers = [str(cell or '').strip().lower() for cell in rows[0]]
        return [
            {headers[index]: value for index, value in enumerate(row) if index < len(headers)}
            for row in rows[1:]
        ]

    raise ValueError('El archivo debe ser CSV o XLSX')


def get_normalized_value(normalized_row, *keys):
    for key in keys:
        value = normalized_row.get(key)
        if value not in [None, '']:
            return value
    return ''


def build_catalog_lookup(cursor):
    cursor.execute('SELECT ID AS id, Nom_carrera AS nombre FROM carreras')
    careers = dictfetchall(cursor)
    cursor.execute('SELECT id, nombre FROM entidades_apoyo')
    entities = dictfetchall(cursor)
    return {
        'career_by_id': {str(item['id']): item for item in careers},
        'career_by_name': {str(item['nombre']).strip().lower(): item for item in careers},
        'entity_by_id': {str(item['id']): item for item in entities},
        'entity_by_name': {str(item['nombre']).strip().lower(): item for item in entities},
    }


def find_catalog_item(normalized, by_id, by_name, id_keys, name_keys):
    item_id = get_normalized_value(normalized, *id_keys)
    item_name = str(get_normalized_value(normalized, *name_keys)).strip()
    if item_id not in [None, '']:
        item = by_id.get(str(item_id).strip())
        if item:
            return item
    if item_name:
        return by_name.get(item_name.lower())
    return None


def normalize_date_cell(value):
    if not value:
        return ''
    if hasattr(value, 'date') and callable(value.date):
        return value.date().isoformat()
    if hasattr(value, 'isoformat') and callable(value.isoformat):
        return value.isoformat()
    return str(value).strip()


def parse_career_catalog_rows(rows):
    parsed_rows = []
    rejected_rows = []

    with connection.cursor() as cursor:
        ensure_careers_active_column(cursor)
        cursor.execute('SELECT id, nom_area FROM tb_area')
        areas = dictfetchall(cursor)
        cursor.execute('SELECT ID AS id, LOWER(Nom_carrera) AS nombre FROM carreras')
        existing_careers = dictfetchall(cursor)

    area_by_id = {str(row['id']): row for row in areas}
    area_by_name = {str(row['nom_area']).strip().lower(): row for row in areas}
    existing_by_name = {row['nombre']: row['id'] for row in existing_careers}

    def append_rejected(normalized_row, observation):
        rejected_rows.append(
            {
                'nombre': str(get_normalized_value(normalized_row, 'nombre', 'carrera')).strip(),
                'area': str(get_normalized_value(normalized_row, 'area', 'área', 'id_area', 'area_id')).strip(),
                'estado': str(get_normalized_value(normalized_row, 'estado', 'activa')).strip() or 'activa',
                'observacion': observation,
            }
        )

    for row in rows:
        normalized = {str(key).strip().lower(): value for key, value in row.items() if key}
        nombre = str(get_normalized_value(normalized, 'nombre', 'carrera')).strip()
        id_area = get_normalized_value(normalized, 'id_area', 'area_id')
        area_name = str(get_normalized_value(normalized, 'area', 'área')).strip().lower()
        area = None

        if id_area not in [None, '']:
            area = area_by_id.get(str(id_area).strip())
        if not area and area_name:
            area = area_by_name.get(area_name)

        missing_fields = []
        if not nombre:
            missing_fields.append('nombre')
        if not area:
            missing_fields.append('area')
        if missing_fields:
            append_rejected(normalized, f"Campos obligatorios faltantes o invalidos: {', '.join(missing_fields)}.")
            continue

        action = 'actualizar' if nombre.lower() in existing_by_name else 'crear'
        parsed_rows.append(
            {
                'nombre': nombre,
                'id_area': area['id'],
                'area': area['nom_area'],
                'activa': normalize_bool(get_normalized_value(normalized, 'estado', 'activa') or True),
                'accion': action,
            }
        )

    return parsed_rows, rejected_rows


def save_career_catalog_rows(rows):
    created = 0
    updated = 0

    with connection.cursor() as cursor:
        ensure_careers_active_column(cursor)
        for row in rows:
            nombre = (row.get('nombre') or row.get('carrera') or '').strip()
            id_area = row.get('id_area') or row.get('area_id')
            activa = normalize_bool(row.get('activa', row.get('estado', True)))
            if not nombre or not id_area:
                continue

            cursor.execute('SELECT ID FROM carreras WHERE LOWER(Nom_carrera) = LOWER(%s)', [nombre])
            existing = cursor.fetchone()
            if existing:
                cursor.execute(
                    'UPDATE carreras SET ID_area = %s, activa = %s WHERE ID = %s',
                    [id_area, 1 if activa else 0, existing[0]],
                )
                updated += 1
            else:
                cursor.execute(
                    'INSERT INTO carreras (Nom_carrera, ID_area, activa) VALUES (%s, %s, %s)',
                    [nombre, id_area, 1 if activa else 0],
                )
                created += 1

    return created, updated


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_admin_university_career_link_preview(request):
    _, error_response = ensure_admin_user(request)
    if error_response:
        return error_response

    uploaded_file = request.FILES.get('archivo') or request.FILES.get('file')
    if not uploaded_file:
        return Response({'error': 'Debes seleccionar un archivo CSV o XLSX'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        rows = parse_career_bulk_file(uploaded_file)
    except ValueError as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    with connection.cursor() as cursor:
        cursor.execute('SELECT ID AS id, Nom_carrera AS nombre FROM carreras')
        careers = dictfetchall(cursor)

    career_by_id = {str(item['id']): item for item in careers}
    career_by_name = {str(item['nombre']).strip().lower(): item for item in careers}
    parsed_rows = []
    rejected_rows = []

    def append_rejected(normalized_row, observation):
        rejected_rows.append(
            {
                'carrera': str(get_normalized_value(normalized_row, 'carrera', 'nombre', 'id_carrera', 'id carrera', 'career_id')).strip(),
                'modalidad': str(get_normalized_value(normalized_row, 'modalidad')).strip(),
                'duracion_semestres': str(get_normalized_value(normalized_row, 'duracion_semestres', 'duracion semestres', 'duracion')).strip(),
                'valor_semestre': str(get_normalized_value(normalized_row, 'valor_semestre', 'valor semestre', 'valor')).strip(),
                'jornada': str(get_normalized_value(normalized_row, 'jornada')).strip(),
                'estado': str(get_normalized_value(normalized_row, 'estado', 'activa')).strip() or 'activa',
                'observacion': observation,
            }
        )

    for row in rows:
        normalized = {str(key).strip().lower(): value for key, value in row.items() if key}
        id_carrera = normalized.get('id_carrera') or normalized.get('id carrera') or normalized.get('career_id')
        career_name = str(normalized.get('carrera') or normalized.get('nombre') or '').strip()
        career = None

        if id_carrera not in [None, '']:
            career = career_by_id.get(str(id_carrera).strip())
        if not career and career_name:
            career = career_by_name.get(career_name.lower())

        if not career:
            append_rejected(
                normalized,
                'Carrera no encontrada. Por favor vincule la carrera en la BD.',
            )
            continue

        modalidad = str(get_normalized_value(normalized, 'modalidad')).strip()
        duracion_semestres = str(get_normalized_value(normalized, 'duracion_semestres', 'duracion semestres', 'duracion')).strip()
        valor_semestre = str(get_normalized_value(normalized, 'valor_semestre', 'valor semestre', 'valor')).strip()
        jornada = str(get_normalized_value(normalized, 'jornada')).strip()
        missing_fields = []
        if not modalidad:
            missing_fields.append('modalidad')
        if not duracion_semestres:
            missing_fields.append('duracion_semestres')
        if not valor_semestre:
            missing_fields.append('valor_semestre')
        if not jornada:
            missing_fields.append('jornada')
        if missing_fields:
            append_rejected(normalized, f"Campos obligatorios faltantes: {', '.join(missing_fields)}.")
            continue

        parsed_rows.append(
            {
                'id_carrera': career['id'],
                'carrera': career['nombre'],
                'modalidad': modalidad,
                'duracion_semestres': duracion_semestres,
                'valor_semestre': valor_semestre,
                'jornada': jornada,
                'activa': normalize_bool(normalized.get('estado', normalized.get('activa', True))),
            }
        )

    return Response(
        {
            'rows': parsed_rows,
            'rejected_rows': rejected_rows,
            'loaded': len(parsed_rows),
            'rejected': len(rejected_rows),
            'skipped': len(rejected_rows),
        },
        status=status.HTTP_200_OK,
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_admin_university_benefit_preview(request):
    _, error_response = ensure_admin_user(request)
    if error_response:
        return error_response

    uploaded_file = request.FILES.get('archivo') or request.FILES.get('file')
    if not uploaded_file:
        return Response({'error': 'Debes seleccionar un archivo CSV o XLSX'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        rows = parse_career_bulk_file(uploaded_file)
    except ValueError as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    with connection.cursor() as cursor:
        catalogs = build_catalog_lookup(cursor)

    parsed_rows = []
    rejected_rows = []

    def append_rejected(normalized_row, observation):
        rejected_rows.append(
            {
                'carrera': str(get_normalized_value(normalized_row, 'carrera', 'nombre_carrera', 'id_carrera', 'id carrera')).strip(),
                'tipo_beneficio': str(get_normalized_value(normalized_row, 'tipo_beneficio', 'tipo beneficio', 'beneficio')).strip(),
                'porcentaje_descuento': str(get_normalized_value(normalized_row, 'porcentaje_descuento', 'porcentaje descuento', 'porcentaje')).strip(),
                'descripcion': str(get_normalized_value(normalized_row, 'descripcion', 'descripción')).strip(),
                'observacion': observation,
            }
        )

    for row in rows:
        normalized = {str(key).strip().lower(): value for key, value in row.items() if key}
        career = find_catalog_item(
            normalized,
            catalogs['career_by_id'],
            catalogs['career_by_name'],
            ['id_carrera', 'id carrera', 'career_id'],
            ['carrera', 'nombre_carrera', 'nombre'],
        )
        tipo_beneficio = str(get_normalized_value(normalized, 'tipo_beneficio', 'tipo beneficio', 'beneficio')).strip()

        if not career:
            append_rejected(normalized, 'Carrera no encontrada. Por favor vincule la carrera en la BD.')
            continue
        if not tipo_beneficio:
            append_rejected(normalized, 'Campo obligatorio faltante: tipo_beneficio.')
            continue

        parsed_rows.append(
            {
                'id_carrera': career['id'],
                'carrera': career['nombre'],
                'tipo_beneficio': tipo_beneficio,
                'porcentaje_descuento': str(get_normalized_value(normalized, 'porcentaje_descuento', 'porcentaje descuento', 'porcentaje')).strip(),
                'descripcion': str(get_normalized_value(normalized, 'descripcion', 'descripción')).strip(),
            }
        )

    return Response(
        {
            'rows': parsed_rows,
            'rejected_rows': rejected_rows,
            'loaded': len(parsed_rows),
            'rejected': len(rejected_rows),
            'skipped': len(rejected_rows),
        },
        status=status.HTTP_200_OK,
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_admin_university_agreement_preview(request):
    _, error_response = ensure_admin_user(request)
    if error_response:
        return error_response

    uploaded_file = request.FILES.get('archivo') or request.FILES.get('file')
    if not uploaded_file:
        return Response({'error': 'Debes seleccionar un archivo CSV o XLSX'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        rows = parse_career_bulk_file(uploaded_file)
    except ValueError as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    with connection.cursor() as cursor:
        catalogs = build_catalog_lookup(cursor)

    parsed_rows = []
    rejected_rows = []

    def append_rejected(normalized_row, observation):
        rejected_rows.append(
            {
                'carrera': str(get_normalized_value(normalized_row, 'carrera', 'nombre_carrera', 'id_carrera', 'id carrera')).strip(),
                'entidad': str(get_normalized_value(normalized_row, 'entidad', 'entidad_apoyo', 'id_entidad', 'id entidad')).strip(),
                'nombre_convenio': str(get_normalized_value(normalized_row, 'nombre_convenio', 'nombre convenio', 'convenio')).strip(),
                'fecha_inicio': normalize_date_cell(get_normalized_value(normalized_row, 'fecha_inicio', 'fecha inicio')),
                'fecha_fin': normalize_date_cell(get_normalized_value(normalized_row, 'fecha_fin', 'fecha fin')),
                'vigente': str(get_normalized_value(normalized_row, 'vigente', 'estado')).strip() or 'vigente',
                'descripcion': str(get_normalized_value(normalized_row, 'descripcion', 'descripción')).strip(),
                'observacion': observation,
            }
        )

    for row in rows:
        normalized = {str(key).strip().lower(): value for key, value in row.items() if key}
        career = find_catalog_item(
            normalized,
            catalogs['career_by_id'],
            catalogs['career_by_name'],
            ['id_carrera', 'id carrera', 'career_id'],
            ['carrera', 'nombre_carrera', 'nombre_carrera'],
        )
        entity = find_catalog_item(
            normalized,
            catalogs['entity_by_id'],
            catalogs['entity_by_name'],
            ['id_entidad', 'id entidad', 'entity_id'],
            ['entidad', 'entidad_apoyo', 'nombre_entidad'],
        )
        nombre_convenio = str(get_normalized_value(normalized, 'nombre_convenio', 'nombre convenio', 'convenio')).strip()

        missing_fields = []
        if not career:
            missing_fields.append('carrera no encontrada')
        if not entity:
            missing_fields.append('entidad no encontrada')
        if not nombre_convenio:
            missing_fields.append('nombre_convenio')
        if missing_fields:
            append_rejected(normalized, f"Campos invalidos o faltantes: {', '.join(missing_fields)}.")
            continue

        parsed_rows.append(
            {
                'id_carrera': career['id'],
                'carrera': career['nombre'],
                'id_entidad': entity['id'],
                'entidad': entity['nombre'],
                'nombre_convenio': nombre_convenio,
                'fecha_inicio': normalize_date_cell(get_normalized_value(normalized, 'fecha_inicio', 'fecha inicio')),
                'fecha_fin': normalize_date_cell(get_normalized_value(normalized, 'fecha_fin', 'fecha fin')),
                'vigente': normalize_bool(get_normalized_value(normalized, 'vigente', 'estado') or True),
                'descripcion': str(get_normalized_value(normalized, 'descripcion', 'descripción')).strip(),
            }
        )

    return Response(
        {
            'rows': parsed_rows,
            'rejected_rows': rejected_rows,
            'loaded': len(parsed_rows),
            'rejected': len(rejected_rows),
            'skipped': len(rejected_rows),
        },
        status=status.HTTP_200_OK,
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_admin_career_bulk_preview(request):
    _, error_response = ensure_admin_user(request)
    if error_response:
        return error_response

    uploaded_file = request.FILES.get('archivo') or request.FILES.get('file')
    if not uploaded_file:
        return Response({'error': 'Debes seleccionar un archivo CSV o XLSX'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        rows = parse_career_bulk_file(uploaded_file)
    except ValueError as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    parsed_rows, rejected_rows = parse_career_catalog_rows(rows)
    return Response(
        {
            'rows': parsed_rows,
            'rejected_rows': rejected_rows,
            'loaded': len(parsed_rows),
            'rejected': len(rejected_rows),
            'skipped': len(rejected_rows),
        },
        status=status.HTTP_200_OK,
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_admin_career_bulk_upload(request):
    _, error_response = ensure_admin_user(request)
    if error_response:
        return error_response

    preview_rows = request.data.get('rows') if hasattr(request, 'data') else None
    if preview_rows is not None:
        created, updated = save_career_catalog_rows(preview_rows)
        return Response(
            {'message': 'Cargue finalizado', 'created': created, 'updated': updated, 'skipped': 0},
            status=status.HTTP_200_OK,
        )

    uploaded_file = request.FILES.get('archivo') or request.FILES.get('file')
    if not uploaded_file:
        return Response({'error': 'Debes seleccionar un archivo CSV o XLSX'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        rows = parse_career_bulk_file(uploaded_file)
    except ValueError as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    created = 0
    updated = 0
    skipped = 0

    with connection.cursor() as cursor:
        ensure_careers_active_column(cursor)
        cursor.execute('SELECT id, LOWER(nom_area) AS area FROM tb_area')
        area_by_name = {row['area']: row['id'] for row in dictfetchall(cursor)}

        for row in rows:
            normalized = {str(key).strip().lower(): value for key, value in row.items() if key}
            nombre = str(normalized.get('nombre') or normalized.get('carrera') or '').strip()
            id_area = normalized.get('id_area') or normalized.get('area_id')
            area_name = str(normalized.get('area') or normalized.get('área') or '').strip().lower()
            activa = normalize_bool(normalized.get('estado', normalized.get('activa', True)))

            if not id_area and area_name:
                id_area = area_by_name.get(area_name)

            if not nombre or not id_area:
                skipped += 1
                continue

            cursor.execute('SELECT ID FROM carreras WHERE LOWER(Nom_carrera) = LOWER(%s)', [nombre])
            existing = cursor.fetchone()
            if existing:
                cursor.execute(
                    'UPDATE carreras SET ID_area = %s, activa = %s WHERE ID = %s',
                    [id_area, 1 if activa else 0, existing[0]],
                )
                updated += 1
            else:
                cursor.execute(
                    'INSERT INTO carreras (Nom_carrera, ID_area, activa) VALUES (%s, %s, %s)',
                    [nombre, id_area, 1 if activa else 0],
                )
                created += 1

    return Response(
        {'message': 'Cargue finalizado', 'created': created, 'updated': updated, 'skipped': skipped},
        status=status.HTTP_200_OK,
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_admin_entity_create(request):
    _, error_response = ensure_admin_user(request)
    if error_response:
        return error_response

    data = parse_json_request(request)
    nombre = (data.get('nombre') or '').strip()
    if not nombre:
        return Response({'error': 'El nombre es obligatorio'}, status=status.HTTP_400_BAD_REQUEST)

    values = [
        nombre,
        (data.get('tipo') or '').strip() or None,
        (data.get('descripcion') or '').strip() or None,
        (data.get('contacto') or '').strip() or None,
        (data.get('sitio_web') or '').strip() or None,
    ]
    with connection.cursor() as cursor:
        cursor.execute(
            '''
            INSERT INTO entidades_apoyo (nombre, tipo, descripcion, contacto, sitio_web)
            VALUES (%s, %s, %s, %s, %s)
            ''',
            values,
        )
        entity_id = cursor.lastrowid

    return Response({'id': entity_id, **data}, status=status.HTTP_201_CREATED)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def api_admin_entity_detail(request, entity_id):
    _, error_response = ensure_admin_user(request)
    if error_response:
        return error_response

    with connection.cursor() as cursor:
        if request.method == 'DELETE':
            cursor.execute('DELETE FROM convenios WHERE id_entidad = %s', [entity_id])
            cursor.execute('DELETE FROM entidades_apoyo WHERE id = %s', [entity_id])
            return Response({'message': 'Entidad eliminada'}, status=status.HTTP_200_OK)

        data = parse_json_request(request)
        nombre = (data.get('nombre') or '').strip()
        if not nombre:
            return Response({'error': 'El nombre es obligatorio'}, status=status.HTTP_400_BAD_REQUEST)

        cursor.execute(
            '''
            UPDATE entidades_apoyo
            SET nombre = %s, tipo = %s, descripcion = %s, contacto = %s, sitio_web = %s
            WHERE id = %s
            ''',
            [
                nombre,
                (data.get('tipo') or '').strip() or None,
                (data.get('descripcion') or '').strip() or None,
                (data.get('contacto') or '').strip() or None,
                (data.get('sitio_web') or '').strip() or None,
                entity_id,
            ],
        )

    return Response({'id': entity_id, **data}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_admin_university_create(request):
    _, error_response = ensure_admin_user(request)
    if error_response:
        return error_response

    data = parse_json_request(request)
    nombre = (data.get('nombre') or '').strip()
    tipo = (data.get('tipo') or '').strip()
    if not nombre or not tipo:
        return Response({'error': 'Nombre y tipo de universidad son obligatorios'}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        with connection.cursor() as cursor:
            cursor.execute(
                '''
                INSERT INTO universidades (nombre, tipo, localidad, direccion, sitio_web)
                VALUES (%s, %s, %s, %s, %s)
                ''',
                [
                    nombre,
                    tipo,
                    (data.get('localidad') or '').strip() or None,
                    (data.get('direccion') or '').strip() or None,
                    (data.get('sitio_web') or '').strip() or None,
                ],
            )
            university_id = cursor.lastrowid
            sync_university_relations(cursor, university_id, data)

    university = next((item for item in serialize_university_rows() if item['id'] == university_id), None)
    return Response(university or {'id': university_id}, status=status.HTTP_201_CREATED)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def api_admin_university_detail(request, university_id):
    _, error_response = ensure_admin_user(request)
    if error_response:
        return error_response

    with transaction.atomic():
        with connection.cursor() as cursor:
            if request.method == 'DELETE':
                cursor.execute('DELETE FROM beneficios_carrera WHERE id_universidad = %s', [university_id])
                cursor.execute('DELETE FROM convenios WHERE id_universidad = %s', [university_id])
                cursor.execute('DELETE FROM carrera_universidad WHERE id_universidad = %s', [university_id])
                cursor.execute('DELETE FROM universidades WHERE id = %s', [university_id])
                return Response({'message': 'Universidad eliminada'}, status=status.HTTP_200_OK)

            data = parse_json_request(request)
            nombre = (data.get('nombre') or '').strip()
            tipo = (data.get('tipo') or '').strip()
            if not nombre or not tipo:
                return Response({'error': 'Nombre y tipo de universidad son obligatorios'}, status=status.HTTP_400_BAD_REQUEST)

            cursor.execute(
                '''
                UPDATE universidades
                SET nombre = %s, tipo = %s, localidad = %s, direccion = %s, sitio_web = %s
                WHERE id = %s
                ''',
                [
                    nombre,
                    tipo,
                    (data.get('localidad') or '').strip() or None,
                    (data.get('direccion') or '').strip() or None,
                    (data.get('sitio_web') or '').strip() or None,
                    university_id,
                ],
            )
            sync_university_relations(cursor, university_id, data)

    university = next((item for item in serialize_university_rows() if item['id'] == university_id), None)
    return Response(university or {'id': university_id}, status=status.HTTP_200_OK)
