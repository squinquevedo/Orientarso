import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

function Registro() {
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
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
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

    try {
      const response = await axios.post('http://localhost:8000/api/registro/', formData);

      setMessages([
        {
          text: 'Registro exitoso. Redirigiendo...',
          type: 'success',
        },
      ]);

      setTimeout(() => {
        navigate('/login');
      }, 2000);
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

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ width: '450px' }}>
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
          </div>

          <div className="d-grid gap-2">
            <button type="submit" className="btn btn-success" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrar'}
            </button>
            <Link to="/login" className="btn btn-secondary">
              Regresar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Registro;