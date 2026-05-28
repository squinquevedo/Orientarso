import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';
import logoOrientarso from '../assets/logo.orientarso-removebg-preview.png';
import { API_BASE } from '../config/api';

const DOCUMENT_LIMITS = {
  CC: 10,
  TI: 11,
  CE: 7,
  PAS: 9,
};

function Registro({ showHeader = true, onBack, onRegistered }) {
  const [formData, setFormData] = useState({
    tipo_documento: '',
    numero_documento: '',
    nombre_completo: '',
    email: '',
    password1: '',
    password2: '',
  });
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const navigate = useNavigate();

  const passwordRules = {
    length: formData.password1.length >= 8 && formData.password1.length <= 16,
    uppercase: /[A-Z]/.test(formData.password1),
    special: /[^a-zA-Z0-9]/.test(formData.password1),
  };
  const passwordOk = passwordRules.length && passwordRules.uppercase && passwordRules.special;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'tipo_documento') {
      const limit = DOCUMENT_LIMITS[value] || 20;
      setFormData((prev) => ({
        ...prev,
        tipo_documento: value,
        numero_documento: prev.numero_documento.slice(0, limit),
      }));
      return;
    }

    if (name === 'numero_documento') {
      const limit = DOCUMENT_LIMITS[formData.tipo_documento] || 20;
      const numericValue = value.replace(/\D/g, '').slice(0, limit);
      setFormData((prev) => ({
        ...prev,
        numero_documento: numericValue,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessages([]);

    if (formData.password1 !== formData.password2) {
      setMessages([
        {
          text: 'Las contraseñas no coinciden',
          type: 'danger',
        },
      ]);
      setLoading(false);
      return;
    }

    if (!passwordOk) {
      setMessages([
        {
          text: 'La contrasena debe tener entre 8 y 16 caracteres, incluir una mayuscula y un caracter especial.',
          type: 'danger',
        },
      ]);
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(`${API_BASE}/api/registro/`, formData, { withCredentials: true });

      const requiresVerification = res.data?.requires_verification;

      if (requiresVerification) {
        setRegisteredEmail(formData.email);
        setMessages([
          {
            text: 'Te enviamos un correo de verificacion. Tu cuenta se creara solo cuando abras el enlace.',
            type: 'success',
          },
        ]);
      } else {
        setMessages([
          {
            text: 'Registro exitoso. Redirigiendo...',
            type: 'success',
          },
        ]);
        setTimeout(() => {
          if (onRegistered) {
            onRegistered();
          } else {
            navigate('/login');
          }
        }, 1200);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Error al registrarse';
      setMessages([
        {
          text: errorMsg,
          type: 'danger',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setLoading(true);
    try {
      await axios.post(
        `${API_BASE}/api/verificar-email/`,
        { email: registeredEmail },
        { withCredentials: true }
      );
      setMessages([
        {
          text: 'Correo de verificacion reenviado. Revisa tu bandeja de entrada.',
          type: 'success',
        },
      ]);
    } catch (err) {
      setMessages([
        {
          text: err.response?.data?.error || 'Error al reenviar el correo',
          type: 'danger',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (registeredEmail) {
    return (
      <>
        {showHeader && (
          <header className="auth-header">
            <Link to="/" className="auth-logo-link" aria-label="Ir al inicio">
              <img src={logoOrientarso} alt="Orientarso" className="auth-logo" />
            </Link>
          </header>
        )}
        <div className="auth-container">
          <div className="auth-card" style={{ textAlign: 'center' }}>
            <h3 className="auth-title" style={{ color: '#166534' }}>¡Registro exitoso!</h3>
            <div className="alert alert-success">
              Te hemos enviado un correo de verificacion a <strong>{registeredEmail}</strong>.
            </div>
            <p style={{ marginBottom: '1.5rem', color: '#4b5563' }}>
              Revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
              Si no lo encuentras, revisa la carpeta de spam.
            </p>
            <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '1.5rem' }}>
              En modo desarrollo, el correo se guarda en la carpeta <strong>Backend/emails_sent/</strong>
              y tambien aparece en la consola del servidor Django.
            </p>
            <div className="d-grid gap-2">
              <button className="btn btn-primary" onClick={handleResendVerification} disabled={loading}>
                {loading ? 'Enviando...' : 'Reenviar correo'}
              </button>
              {onRegistered ? (
                <button type="button" className="btn btn-success" onClick={onRegistered}>
                  Ir a iniciar sesion
                </button>
              ) : (
                <Link to="/login" className="btn btn-success" style={{ textDecoration: 'none' }}>
                  Ir a iniciar sesion
                </Link>
              )}
              {onBack ? (
                <button type="button" className="btn btn-secondary" onClick={onBack}>
                  Regresar
                </button>
              ) : (
                <Link to="/" className="btn btn-secondary">
                  Volver al inicio
                </Link>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {showHeader && (
        <header className="auth-header">
          <Link to="/" className="auth-logo-link" aria-label="Ir al inicio">
            <img src={logoOrientarso} alt="Orientarso" className="auth-logo" />
          </Link>
        </header>
      )}
      <div className="auth-container">
        <div className="auth-card">
        <h3 className="auth-title">Registro de Usuario</h3>

        {messages.map((msg, index) => (
          <div key={index} className={`alert alert-${msg.type}`}>
            {msg.text}
          </div>
        ))}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <select
              className="form-control"
              name="tipo_documento"
              value={formData.tipo_documento}
              onChange={handleChange}
              required
            >
              <option value="">Tipo de Documento</option>
              <option value="CC">Cédula de Ciudadanía</option>
              <option value="TI">Tarjeta de Identidad</option>
              <option value="CE">Cédula de Extranjería</option>
              <option value="PAS">Pasaporte</option>
            </select>
          </div>

          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              name="numero_documento"
              placeholder="Número de Documento"
              value={formData.numero_documento}
              onChange={handleChange}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={DOCUMENT_LIMITS[formData.tipo_documento] || 20}
              required
            />
          </div>

          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              name="nombre_completo"
              placeholder="Nombre Completo"
              value={formData.nombre_completo}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <input
              type="email"
              className="form-control"
              name="email"
              placeholder="Correo Electrónico"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <input
              type="password"
              className="form-control"
              name="password1"
              placeholder="Crear Contraseña"
              value={formData.password1}
              onChange={handleChange}
              required
            />
            {formData.password1 && (
              <ul className="password-checklist">
                <li className={passwordRules.length ? 'valid' : ''}>
                  {passwordRules.length ? '✓' : '○'} 8 a 16 caracteres
                </li>
                <li className={passwordRules.uppercase ? 'valid' : ''}>
                  {passwordRules.uppercase ? '✓' : '○'} 1 mayúscula
                </li>
                <li className={passwordRules.special ? 'valid' : ''}>
                  {passwordRules.special ? '✓' : '○'} 1 carácter especial
                </li>
              </ul>
            )}
          </div>

          <div className="mb-3">
            <input
              type="password"
              className="form-control"
              name="password2"
              placeholder="Confirmar Contraseña"
              value={formData.password2}
              onChange={handleChange}
              required
            />
            {formData.password2 && formData.password1 !== formData.password2 && (
              <p className="password-mismatch">Contraseñas no coinciden</p>
            )}
          </div>

          <div className="d-grid gap-2">
            <button type="submit" className="btn btn-success" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrar'}
            </button>
            {onBack ? (
              <button type="button" className="btn btn-secondary" onClick={onBack}>
                Regresar
              </button>
            ) : (
              <Link to="/" className="btn btn-secondary">
                Regresar
              </Link>
            )}
          </div>
        </form>
        </div>
      </div>
    </>
  );
}

export default Registro;
