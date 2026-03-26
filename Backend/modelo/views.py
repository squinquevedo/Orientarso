from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.middleware.csrf import get_token
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import connection, transaction
from django.utils import timezone
import json

# ==================== APIs REST (React) ====================

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def api_login(request):
    'Endpoint de login para React'
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
            return Response({
                'error': 'Usuario no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)

        authenticated = authenticate(request, username=user.username, password=password)

        if authenticated is not None:
            login(request, authenticated)
            return Response({
                'message': 'Login exitoso',
                'username': authenticated.username,
                'email': authenticated.email,
                'first_name': authenticated.first_name,
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Contraseña incorrecta'
            }, status=status.HTTP_401_UNAUTHORIZED)

    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def api_registro(request):
    'Endpoint de registro para React'
    try:
        data = json.loads(request.body)

        tipo_documento = (data.get('tipo_documento') or '').strip()
        numero_documento = (data.get('numero_documento') or '').strip()
        nombre_completo = (data.get('nombre_completo') or '').strip()
        email = (data.get('email') or '').strip().lower()
        password1 = (data.get('password1') or '').strip()
        password2 = (data.get('password2') or '').strip()

        # Validaciones
        if not all([tipo_documento, numero_documento, nombre_completo, email, password1, password2]):
            return Response({
                'error': 'Todos los campos son requeridos'
            }, status=status.HTTP_400_BAD_REQUEST)

        if password1 != password2:
            return Response({
                'error': 'Las contraseñas no coinciden'
            }, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username__iexact=email).exists() or User.objects.filter(email__iexact=email).exists():
            return Response({
                'error': 'El email ya está registrado'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Crear usuario
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password1,
            first_name=nombre_completo
        )

        return Response({
            'message': 'Usuario registrado exitosamente',
            'username': user.username,
            'email': user.email,
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_logout(request):
    'Endpoint de logout para React'
    logout(request)
    return Response({
        'message': 'Logout exitoso'
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_user(request):
    'Obtener datos del usuario autenticado'
    user = request.user
    return Response({
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'is_authenticated': user.is_authenticated,
    }, status=status.HTTP_200_OK)


@ensure_csrf_cookie
@api_view(['GET'])
@permission_classes([AllowAny])
@authentication_classes([])
def api_csrf(request):
    'Emitir cookie CSRF para el frontend'
    return Response({
        'csrfToken': get_token(request)
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_preguntas(request):
    'Listado de preguntas para la prueba vocacional'
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                'SELECT id, pregunta, valor, id_area FROM tb_preguntas ORDER BY id'
            )
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
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_areas(request):
    'Listado de areas para la prueba vocacional'
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                'SELECT id, nom_area FROM tb_area ORDER BY id'
            )
            rows = cursor.fetchall()

        areas = [
            {
                'id': row[0],
                'nom_area': row[1],
            }
            for row in rows
        ]

        return Response(areas, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_test(request):
    'Registrar un intento de prueba y guardar respuestas'
    try:
        data = request.data or {}
        respuestas = data.get('respuestas') or []

        if not isinstance(respuestas, list):
            return Response({
                'error': 'Formato de respuestas invalido'
            }, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            with connection.cursor() as cursor:
                cursor.execute(
                    'SELECT COUNT(*) FROM tb_test WHERE id_auth_user = %s',
                    [request.user.id]
                )
                count = cursor.fetchone()[0] or 0
                intento = count + 1

                cursor.execute('SELECT MAX(id) FROM tb_test')
                max_id = cursor.fetchone()[0] or 0
                test_id = max_id + 1

                cursor.execute(
                    'INSERT INTO tb_test (id, id_auth_user, fecha_registro, intento) VALUES (%s, %s, %s, %s)',
                    [test_id, request.user.id, timezone.now(), intento]
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
                        valores_con_id
                    )

        return Response({
            'id_test': test_id,
            'intento': intento,
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
