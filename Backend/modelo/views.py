from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
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
