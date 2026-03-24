import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';
import logoOrientarso from '../assets/logo.orientarso-removebg-preview.png';
import iconHome from '../assets/house-door-fill.svg';
import iconAccount from '../assets/person-circle.svg';
import iconMoon from '../assets/moon-fill.svg';
import iconSun from '../assets/brightness-high-fill.svg';

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
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [fotoModalAbierto, setFotoModalAbierto] = useState(false);
  const [fotoPerfil, setFotoPerfil] = useState(
    'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=800'
  );
  const [modoOscuro, setModoOscuro] = useState(false);
  const fileInputRef = useRef(null);
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

    const cargarNombre = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/user/', {
          withCredentials: true
        });
        const nombre = response?.data?.first_name;
        if (nombre) {
          setUsername(nombre);
        }
      } catch (error) {
        // Si falla la consulta, se mantiene el valor local
      }
    };

    cargarNombre();
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
                <label>Nombre:</label>
                <input type="text" value={username} readOnly className="form-control" />
              </div>
              <div className="form-group">
                <label>Primer nombre:</label>
                <input type="text" value={username} readOnly className="form-control" />
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
    <div className={`dashboard ${modoOscuro ? 'dark' : 'light'}`}>
      <header className="dashboard-header">
        <div className="header-left">
          <button
            className="dashboard-sidebar-toggle"
            onClick={() => setMenuAbierto((prev) => !prev)}
            aria-expanded={menuAbierto}
            aria-controls="dashboard-sidebar"
            aria-label="Abrir menu lateral"
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>
          <button
            className="header-logo"
            onClick={() => {
              setVistaActual('inicio');
              setMenuAbierto(false);
            }}
            aria-label="Ir al inicio del dashboard"
          >
            <img src={logoOrientarso} alt="Orientarso" />
          </button>
        </div>
        <div className="header-actions" />
      </header>
      <div
        className={`dashboard-overlay ${menuAbierto ? 'open' : ''}`}
        onClick={() => setMenuAbierto(false)}
        aria-hidden={!menuAbierto}
      />
      <aside
        id="dashboard-sidebar"
        className={`dashboard-sidebar ${menuAbierto ? 'open' : ''}`}
        aria-hidden={!menuAbierto}
      >
        <div className="sidebar-user">
          <button
            className="user-avatar"
            onClick={() => setFotoModalAbierto(true)}
            aria-label="Ver foto de perfil"
          >
            <img src={fotoPerfil} alt="Foto de perfil" />
          </button>
          <div className="user-name">{username}</div>
        </div>
        <div className="sidebar-divider" />
        <div className="sidebar-title">Menu</div>
        <button
          className={`sidebar-item ${vistaActual === 'inicio' ? 'active' : ''}`}
          onClick={() => {
            setVistaActual('inicio');
            setMenuAbierto(false);
          }}
        >
          <img src={iconHome} alt="" className="menu-icon-img" />
          Home
        </button>
        <button
          className={`sidebar-item ${vistaActual === 'configuracion' ? 'active' : ''}`}
          onClick={() => {
            setVistaActual('configuracion');
            setMenuAbierto(false);
          }}
        >
          <img src={iconAccount} alt="" className="menu-icon-img" />
          Mi cuenta
        </button>
        <div className="sidebar-divider" />
        <button
          className="sidebar-item"
          onClick={() => setModoOscuro((prev) => !prev)}
        >
          <img
            src={modoOscuro ? iconSun : iconMoon}
            alt=""
            className="menu-icon-img"
          />
          {modoOscuro ? 'Modo claro' : 'Modo oscuro'}
        </button>
        <div className="sidebar-divider" />
        <button className="sidebar-item logout" onClick={handleLogout}>
          Cerrar sesion
        </button>
      </aside>
      {fotoModalAbierto && (
        <div
          className="photo-modal"
          role="dialog"
          aria-modal="true"
          onClick={() => setFotoModalAbierto(false)}
        >
          <div className="photo-modal-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={fotoPerfil}
              alt="Foto de perfil completa"
              className="photo-modal-image"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="photo-file-input"
              onChange={(e) => {
                const file = e.target.files && e.target.files[0];
                if (!file) return;
                const nextUrl = URL.createObjectURL(file);
                setFotoPerfil(nextUrl);
              }}
            />
            <button
              className="btn photo-edit-btn"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
            >
              Editar foto
            </button>
          </div>
        </div>
      )}
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}

export default Dashboard;
