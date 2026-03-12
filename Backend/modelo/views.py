from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import json

# ==================== APIs REST (React) ====================

@api_view(['POST'])
@permission_classes([AllowAny])
def api_login(request):
    """Endpoint de login para React"""
    try:
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            login(request, user)
            return Response({
                'message': 'Login exitoso',
                'username': user.username,
                'email': user.email,
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Usuario o contraseña inválidos'
            }, status=status.HTTP_401_UNAUTHORIZED)
    
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def api_registro(request):
    """Endpoint de registro para React"""
    try:
        data = json.loads(request.body)
        
        tipo_documento = data.get('tipo_documento')
        numero_documento = data.get('numero_documento')
        nombre_completo = data.get('nombre_completo')
        email = data.get('email')
        password1 = data.get('password1')
        password2 = data.get('password2')
        
        # Validaciones
        if not all([tipo_documento, numero_documento, nombre_completo, email, password1, password2]):
            return Response({
                'error': 'Todos los campos son requeridos'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if password1 != password2:
            return Response({
                'error': 'Las contraseñas no coinciden'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(username=email).exists():
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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_logout(request):
    """Endpoint de logout para React"""
    logout(request)
    return Response({
        'message': 'Logout exitoso'
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_user(request):
    """Obtener datos del usuario autenticado"""
    user = request.user
    return Response({
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'is_authenticated': user.is_authenticated,
    }, status=status.HTTP_200_OK)