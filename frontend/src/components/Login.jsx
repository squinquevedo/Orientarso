import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';
import logoOrientarso from '../assets/logo.orientarso-removebg-preview.png';
import { API_BASE } from '../config/api';
import { useAuthRedirect } from '../utils/useAuthRedirect';

function Login({ showHeader = true, onRegisterClick }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();
  useAuthRedirect();

  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotMessages, setForgotMessages] = useState([]);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState(false);

  const passwordRules = {
    length: newPassword.length >= 8 && newPassword.length <= 16,
    uppercase: /[A-Z]/.test(newPassword),
    special: /[^a-zA-Z0-9]/.test(newPassword),
  };
  const passwordOk = passwordRules.length && passwordRules.uppercase && passwordRules.special;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessages([]);

    try {
      const response = await axios.post(
        `${API_BASE}/api/login/`,
        { username, password },
        { withCredentials: true }
      );

      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('username', response.data.username || username);
      localStorage.setItem('fullName', response.data.first_name || '');
      localStorage.setItem('userRole', response.data.rol || 'estudiante');
      localStorage.setItem('isAdmin', response.data.is_admin ? 'true' : 'false');
      localStorage.setItem('orientarso:login-success', String(Date.now()));

      navigate(response.data.is_admin ? '/dashboard_admin' : '/home', { replace: true });
    } catch (error) {
      const data = error.response?.data || {};
      const errorMessage = error.response
        ? data.error || 'Error al iniciar sesion'
        : 'No se pudo conectar con el servidor. Verifica que Django este corriendo en el puerto 8000.';
      setMessages([
        {
          text: errorMessage,
          type: 'danger',
        },
      ]);
      if (data.requires_verification && data.email) {
        setUnverifiedEmail(data.email);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setSending(true);
    try {
      await axios.post(
        `${API_BASE}/api/verificar-email/`,
        { email: unverifiedEmail },
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
      setSending(false);
    }
  };

  const handleForgotRequest = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMessages([]);
    try {
      await axios.post(
        `${API_BASE}/api/password-reset/request/`,
        { email: forgotEmail },
        { withCredentials: true }
      );
      setForgotMessages([{ text: 'Codigo enviado. Revisa tu correo.', type: 'success' }]);
      setForgotStep(2);
    } catch (err) {
      setForgotMessages([{ text: err.response?.data?.error || 'Error al enviar el codigo', type: 'danger' }]);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotVerifyCode = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMessages([]);
    try {
      const res = await axios.post(
        `${API_BASE}/api/password-reset/verify/`,
        { email: forgotEmail, code: forgotCode },
        { withCredentials: true }
      );
      setForgotMessages([{ text: res.data.message, type: 'success' }]);
      setCodeVerified(true);
      setForgotStep(3);
    } catch (err) {
      const data = err.response?.data || {};
      setForgotMessages([{ text: data.error || 'Codigo invalido', type: 'danger' }]);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotResetPassword = async (e) => {
    e.preventDefault();
    setForgotMessages([]);
    if (newPassword !== confirmPassword) {
      setForgotMessages([{ text: 'Las contrasenas no coinciden', type: 'danger' }]);
      return;
    }
    if (!passwordOk) {
      setForgotMessages([{ text: 'La contrasena debe tener entre 8 y 16 caracteres, incluir una mayuscula y un caracter especial.', type: 'danger' }]);
      return;
    }
    setForgotLoading(true);
    try {
      await axios.post(
        `${API_BASE}/api/password-reset/verify/`,
        { email: forgotEmail, code: forgotCode, new_password: newPassword },
        { withCredentials: true }
      );
      setForgotSuccess(true);
    } catch (err) {
      setForgotError(true);
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgot = () => {
    setShowForgot(false);
    setForgotStep(1);
    setForgotEmail('');
    setForgotCode('');
    setNewPassword('');
    setConfirmPassword('');
    setCodeVerified(false);
    setForgotMessages([]);
    setForgotSuccess(false);
    setForgotError(false);
  };

  const goToHome = () => {
    closeForgot();
    navigate('/');
  };

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
          <h3 className="auth-title">Iniciar sesión</h3>

        {messages.map((msg, index) => (
          <div key={index} className={`alert alert-${msg.type}`}>
            {msg.text}
          </div>
        ))}

        {unverifiedEmail && (
          <div className="d-grid gap-2 mb-3">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleResendVerification}
              disabled={sending}
              style={{ fontSize: '0.85rem', background: '#166534', borderColor: '#166534' }}
            >
              {sending ? 'Enviando...' : 'Reenviar correo de verificacion'}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="mb-3">
            <input
              type="email"
              className="form-control"
              placeholder="Correo electrónico"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="off"
              required
            />
          </div>

          <div className="mb-3">
            <input
              type="password"
              className="form-control"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          <div className="d-grid">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Cargando...' : 'Ingresar'}
            </button>
          </div>

          <div className="auth-links">
            {onRegisterClick ? (
              <button type="button" className="auth-link-button" onClick={onRegisterClick}>
                Registrarse
              </button>
            ) : (
              <Link to="/registro">Registrarse</Link>
            )}
            <button type="button" className="auth-link-button" onClick={() => setShowForgot(true)}>
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </form>
        </div>
      </div>

      {showForgot && (
        <div className="forgot-overlay" onClick={closeForgot}>
          <div className="forgot-modal" onClick={(e) => e.stopPropagation()}>
            <button className="forgot-close" onClick={closeForgot}>&times;</button>

            {forgotSuccess ? (
              <>
                <h3 className="auth-title" style={{ color: '#166534' }}>Se cambió con éxito</h3>
                <div className="d-grid gap-2">
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={() => { closeForgot(); navigate('/login'); }}
                  >
                    Iniciar sesión
                  </button>
                </div>
              </>
            ) : forgotError ? (
              <>
                <h3 className="auth-title" style={{ color: '#991b1b' }}>Error</h3>
                <div className="alert alert-danger">Lo sentimos, inténtalo más tarde</div>
                <div className="d-grid gap-2">
                  <button type="button" className="btn btn-secondary" onClick={goToHome}>
                    Regresar
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="auth-title">
                  {forgotStep === 1 && 'Recuperar contraseña'}
                  {forgotStep === 2 && 'Ingresa el codigo'}
                  {forgotStep === 3 && 'Nueva contraseña'}
                </h3>

                {forgotMessages.map((msg, index) => (
                  <div key={index} className={`alert alert-${msg.type}`}>
                    {msg.text}
                  </div>
                ))}

                {forgotStep === 1 && (
                  <form onSubmit={handleForgotRequest}>
                    <div className="mb-3">
                      <input
                        type="email"
                        className="form-control"
                        placeholder="Correo electrónico"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="d-grid">
                      <button type="submit" className="btn btn-primary" disabled={forgotLoading}>
                        {forgotLoading ? 'Enviando...' : 'Enviar codigo'}
                      </button>
                    </div>
                  </form>
                )}

                {forgotStep === 2 && (
                  <form onSubmit={handleForgotVerifyCode}>
                    <p style={{ marginBottom: '1rem', color: '#4b5563', fontSize: '0.9rem', textAlign: 'center' }}>
                      Ingresa el codigo de 6 digitos enviado a <strong>{forgotEmail}</strong>
                    </p>
                    <div className="mb-3">
                      <input
                        type="text"
                        className="form-control text-center"
                        placeholder="000000"
                        value={forgotCode}
                        onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength={6}
                        inputMode="numeric"
                        autoComplete="off"
                        required
                        style={{ fontSize: '1.5rem', letterSpacing: '8px', textAlign: 'center' }}
                      />
                    </div>
                    <div className="d-grid">
                      <button type="submit" className="btn btn-primary" disabled={forgotLoading || forgotCode.length < 6}>
                        {forgotLoading ? 'Verificando...' : 'Verificar codigo'}
                      </button>
                    </div>
                  </form>
                )}

                {forgotStep === 3 && (
                  <form onSubmit={handleForgotResetPassword}>
                    <div className="mb-3">
                      <input
                        type="password"
                        className="form-control"
                        placeholder="Nueva contraseña"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                      {newPassword && (
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
                        placeholder="Confirmar contraseña"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                      {confirmPassword && newPassword !== confirmPassword && (
                        <p className="password-mismatch">Contraseñas no coinciden</p>
                      )}
                    </div>
                    <div className="d-grid">
                      <button type="submit" className="btn btn-primary" disabled={forgotLoading}>
                        {forgotLoading ? 'Restableciendo...' : 'Cambiar contraseña'}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default Login;
