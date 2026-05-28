import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../config/api';
import logoOrientarso from '../assets/logo.orientarso-removebg-preview.png';
import './Auth.css';

const verificationRequests = new Map();

function VerificarEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('verificando');
  const navigate = useNavigate();
  const verificationStarted = useRef(false);

  const goToLogin = () => {
    localStorage.setItem('orientarso:open-login', String(Date.now()));
    navigate('/?login=1', { replace: true });
  };

  const goBackHome = () => {
    localStorage.setItem('orientarso:verification-error-back', String(Date.now()));
    navigate('/', { replace: true });
  };

  useEffect(() => {
    if (verificationStarted.current) {
      return;
    }
    verificationStarted.current = true;

    if (!token) {
      setStatus('error');
      return;
    }

    let verificationRequest = verificationRequests.get(token);
    if (!verificationRequest) {
      verificationRequest = axios.get(`${API_BASE}/api/verificar-email/?token=${token}`, { withCredentials: true });
      verificationRequests.set(token, verificationRequest);
    }

    verificationRequest
      .then(() => {
        setStatus('exito');
      })
      .catch(() => {
        setStatus('error');
      });
  }, [token]);

  return (
    <>
      <header className="auth-header">
        <Link to="/" className="auth-logo-link" aria-label="Ir al inicio">
          <img src={logoOrientarso} alt="Orientarso" className="auth-logo" />
        </Link>
      </header>
      <div className="auth-container">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          {status === 'verificando' && (
            <>
              <h3 className="auth-title">Verificando correo...</h3>
              <p>Por favor espera mientras verificamos tu cuenta.</p>
            </>
          )}

          {status === 'exito' && (
            <>
              <h3 className="auth-title" style={{ color: '#166534' }}>Verificacion exitosa</h3>
              <div className="alert alert-success">Te has verificado con exito.</div>
              <div className="d-grid gap-2">
                <button type="button" className="btn btn-primary verification-login-btn" onClick={goToLogin}>
                  Iniciar sesion
                </button>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <h3 className="auth-title" style={{ color: '#991b1b' }}>Error de verificacion</h3>
              <div className="alert alert-danger">No se pudo verificar, intentalo mas tarde.</div>
              <div className="d-grid gap-2">
                <button type="button" className="btn btn-secondary" onClick={goBackHome}>
                  Regresar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default VerificarEmail;
