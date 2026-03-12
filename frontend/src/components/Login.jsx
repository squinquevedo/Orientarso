import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

function Login() {
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
      const response = await axios.post('http://localhost:8000/api/login/', {
        username,
        password,
      });

      // Guardar token y username
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('username', username);

      // Redirigir a home
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
    <div className="auth-container">
      <div className="auth-card">
        <h3 className="auth-title">Iniciar sesión</h3>

        {messages.map((msg, index) => (
          <div key={index} className={`alert alert-${msg.type}`}>
            {msg.text}
          </div>
        ))}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <input
              type="email"
              className="form-control"
              placeholder="Correo electrónico"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
  );
}

export default Login;