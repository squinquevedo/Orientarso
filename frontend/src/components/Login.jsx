import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';
import logoOrientarso from '../assets/logo.orientarso-removebg-preview.png';

const API_BASE = 'http://localhost:8000';

function Login({ showHeader = true }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

      navigate('/home');
    } catch (error) {
      setMessages([
        {
          text: error.response?.data?.error || 'Error al iniciar sesión',
          type: 'danger',
        },
      ]);
    } finally {
      setLoading(false);
    }
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
            <Link to="/registro">Registrarse</Link>
            <a href="#forgot-password">¿Olvidaste tu contraseña?</a>
          </div>
        </form>
        </div>
      </div>
    </>
  );
}

export default Login;
