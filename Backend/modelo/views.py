import json

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
        return value.strip().lower() in ['1', 'true', 'si', 'yes']
    return bool(value)


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
    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'tipo_documento': profile.tipo_documento,
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
        cursor.execute('SELECT id, nom_area FROM tb_area ORDER BY nom_area')
        areas = dictfetchall(cursor)

        cursor.execute('SELECT ID AS id, Nom_carrera AS nombre, ID_area AS id_area FROM carreras ORDER BY Nom_carrera')
        carreras = dictfetchall(cursor)

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
    return Response(build_user_payload(request.user), status=status.HTTP_200_OK)


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
    if not nombre or not id_area:
        return Response({'error': 'Nombre e area son obligatorios'}, status=status.HTTP_400_BAD_REQUEST)

    with connection.cursor() as cursor:
        cursor.execute(
            'INSERT INTO carreras (Nom_carrera, ID_area) VALUES (%s, %s)',
            [nombre, id_area],
        )
        career_id = cursor.lastrowid

    return Response({'id': career_id, 'nombre': nombre, 'id_area': id_area}, status=status.HTTP_201_CREATED)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def api_admin_career_detail(request, career_id):
    _, error_response = ensure_admin_user(request)
    if error_response:
        return error_response

    with connection.cursor() as cursor:
        if request.method == 'DELETE':
            cursor.execute('DELETE FROM beneficios_carrera WHERE id_carrera = %s', [career_id])
            cursor.execute('DELETE FROM convenios WHERE id_carrera = %s', [career_id])
            cursor.execute('DELETE FROM carrera_universidad WHERE id_carrera = %s', [career_id])
            cursor.execute('DELETE FROM carreras WHERE ID = %s', [career_id])
            return Response({'message': 'Carrera eliminada'}, status=status.HTTP_200_OK)

        data = parse_json_request(request)
        nombre = (data.get('nombre') or '').strip()
        id_area = data.get('id_area')
        if not nombre or not id_area:
            return Response({'error': 'Nombre e area son obligatorios'}, status=status.HTTP_400_BAD_REQUEST)

        cursor.execute(
            'UPDATE carreras SET Nom_carrera = %s, ID_area = %s WHERE ID = %s',
            [nombre, id_area, career_id],
        )

    return Response({'id': career_id, 'nombre': nombre, 'id_area': id_area}, status=status.HTTP_200_OK)


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
