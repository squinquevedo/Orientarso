import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

const universidadesData = [
  {
    id: 1,
    nombre: 'Universidad de Panama',
    carreras: ['Ingenieria', 'Medicina', 'Derecho', 'Arquitectura'],
    ubicacion: 'Ciudad de Panama',
    imagen: 'https://images.unsplash.com/photo-1562774053-701939374585?w=400'
  },
  {
    id: 2,
    nombre: 'Universidad Tecnologica de Panama',
    carreras: ['Ingenieria Sistemas', 'Ingenieria Industrial', 'Electronica'],
    ubicacion: 'Ciudad de Panama',
    imagen: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400'
  },
  {
    id: 3,
    nombre: 'Universidad Latina de Panama',
    carreras: ['Comunicacion', 'Psicologia', 'Negocios', 'Turismo'],
    ubicacion: 'Ciudad de Panama',
    imagen: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400'
  }
];

function Dashboard() {
  const [username, setUsername] = useState('Invitado');
  const [vistaActual, setVistaActual] = useState('inicio');
  const navigate = useNavigate();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuthenticated) {
      navigate('/', { replace: true });
      return;
    }
    const user = localStorage.getItem('username');
    if (user) {
      setUsername(user);
    }
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:8000/api/logout/', {}, { withCredentials: true });
    } catch (error) {
      // Si falla el backend igual limpiamos el cliente
    } finally {
      localStorage.removeItem('username');
      localStorage.removeItem('token');
      localStorage.removeItem('isAuthenticated');
      sessionStorage.clear();
      navigate('/', { replace: true });
    }
  };

  const renderContent = () => {
    switch (vistaActual) {
      case 'configuracion':
        return (
          <div className="configuracion-container">
            <h2>Configuracion</h2>
            <div className="config-card">
              <h3>Perfil</h3>
              <div className="form-group">
                <label>Nombre de usuario:</label>
                <input type="text" value={username} readOnly className="form-control" />
              </div>
              <div className="form-group">
                <label>Correo electronico:</label>
                <input type="email" placeholder="correo@ejemplo.com" className="form-control" />
              </div>
              <button className="btn btn-primary">Guardar cambios</button>
            </div>
            <div className="config-card">
              <h3>Cambiar contraseña</h3>
              <div className="form-group">
                <label>Contraseña actual:</label>
                <input type="password" className="form-control" />
              </div>
              <div className="form-group">
                <label>Nueva contraseña:</label>
                <input type="password" className="form-control" />
              </div>
              <div className="form-group">
                <label>Confirmar contraseña:</label>
                <input type="password" className="form-control" />
              </div>
              <button className="btn btn-primary">Actualizar contraseña</button>
            </div>
          </div>
        );
      
      case 'prueba':
        return (
          <div className="prueba-container">
            <h2>Prueba Vocacional</h2>
            <p>Responde las siguientes preguntas para descubrir tu carrera ideal.</p>
            <div className="prueba-card">
              <h3>Pregunta 1</h3>
              <p>¿Qué actividad te gusta mas?</p>
              <div className="opciones">
                <button className="btn-opcion">Resolver problemas matematicos</button>
                <button className="btn-opcion">Ayudar a otras personas</button>
                <button className="btn-opcion">Crear artistico</button>
                <button className="btn-opcion">Trabajar con tecnologia</button>
              </div>
            </div>
            <div className="prueba-card">
              <h3>Pregunta 2</h3>
              <p>¿En qué entorno te gustaría trabajar?</p>
              <div className="opciones">
                <button className="btn-opcion">Oficina</button>
                <button className="btn-opcion">Hospital</button>
                <button className="btn-opcion">Laboratorio</button>
                <button className="btn-opcion">Al aire libre</button>
              </div>
            </div>
            <button className="btn btn-primary">Enviar Respuestas</button>
          </div>
        );
      
      case 'resultados':
        return (
          <div className="resultados-container">
            <h2>Tus Resultados</h2>
            <div className="resultado-card">
              <h3>Areas de Mayor Afinidad</h3>
              <div className="barra-progreso">
                <div className="barra-fill" style={{width: '85%'}}>Tecnologia - 85%</div>
              </div>
              <div className="barra-progreso">
                <div className="barra-fill" style={{width: '70%'}}>Ciencias - 70%</div>
              </div>
              <div className="barra-progreso">
                <div className="barra-fill" style={{width: '55%'}}>Artes - 55%</div>
              </div>
            </div>
            <div className="recomendaciones">
              <h3>Carreras Recomendadas</h3>
              <ul>
                <li>Ingenieria en Sistemas</li>
                <li>Ciencias de la Computacion</li>
                <li>Ingenieria de Software</li>
              </ul>
            </div>
          </div>
        );
      
      case 'universidades':
        return (
          <div className="universidades-container">
            <h2>Universidades</h2>
            <div className="universidades-grid">
              {universidadesData.map((uni) => (
                <div key={uni.id} className="uni-card">
                  <img src={uni.imagen} alt={uni.nombre} className="uni-imagen" />
                  <div className="uni-info">
                    <h3>{uni.nombre}</h3>
                    <p className="uni-ubicacion">{uni.ubicacion}</p>
                    <h4>Carreras disponibles:</h4>
                    <ul className="uni-carreras">
                      {uni.carreras.map((carrera, index) => (
                        <li key={index}>{carrera}</li>
                      ))}
                    </ul>
                    <button className="btn btn-secondary">Mas Informacion</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      default:
        return (
          <div className="inicio-container">
            <div className="hero-section">
              <img 
                src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200" 
                alt="Hero" 
                className="hero-image" 
              />
              <div className="hero-text">
                <h1>Descubre tu futuro profesional</h1>
                <p>Encuentra la carrera ideal para ti mediante nuestra prueba vocacional</p>
              </div>
            </div>
            <div className="menu-opciones">
              <div className="menu-card" onClick={() => setVistaActual('prueba')}>
                <div className="menu-icon">📝</div>
                <h3>Hacer la Prueba</h3>
                <p>Descubre tu area vocacional ideal</p>
              </div>
              <div className="menu-card" onClick={() => setVistaActual('resultados')}>
                <div className="menu-icon">📊</div>
                <h3>Ver Resultados</h3>
                <p>Consulta tus resultados anteriores</p>
              </div>
              <div className="menu-card" onClick={() => setVistaActual('universidades')}>
                <div className="menu-icon">🎓</div>
                <h3>Universidades</h3>
                <p>Explora las universidades disponibles</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="dashboard">
      <nav className="sidebar">
        <div className="logo">
          <h2>Orientacion</h2>
        </div>
        <ul className="nav-menu">
          <li 
            className={vistaActual === 'inicio' ? 'active' : ''}
            onClick={() => setVistaActual('inicio')}
          >
            Home
          </li>
          <li 
            className={vistaActual === 'configuracion' ? 'active' : ''}
            onClick={() => setVistaActual('configuracion')}
          >
            Configuracion
          </li>
        </ul>
        <button className="btn-logout" onClick={handleLogout}>
          Cerrar sesion
        </button>
      </nav>
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}

export default Dashboard;
