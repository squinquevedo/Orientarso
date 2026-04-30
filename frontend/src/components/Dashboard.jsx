import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';
import logoOrientarso from '../assets/logo.orientarso-removebg-preview.png';
import iconHome from '../assets/house-door-fill.svg';
import iconAccount from '../assets/person-circle.svg';
import iconMoon from '../assets/moon-fill.svg';
import iconSun from '../assets/brightness-high-fill.svg';
import heroBanner from '../assets/areasimg.jpg';
import iconEncuesta from '../assets/encuesta-128x128.png';
import iconAnalisis from '../assets/análisis-128x128.png';
import iconEducacion from '../assets/educación-128x128.png';
import javerianaImg from '../assets/javeriana.png';
import bosqueImg from '../assets/Universidad El Bosque.jpeg';
import tadeoImg from '../assets/Universidad Jorge Tadeo Lozano.jpg';
import nacionalImg from '../assets/Universidad Nacional de Colombia.jpg';
import pilotoImg from '../assets/Universidad Piloto de Colombia.jpg';

const universidadesData = [
  {
    id: 'javeriana',
    nombre: 'Pontificia Universidad Javeriana',
    ubicacion: 'Cra. 7 No. 40-62, Bogota',
    resumen: 'Universidad reconocida en Bogota con opciones fuertes en negocios, tecnologia y expresion artistica.',
    imagen: javerianaImg,
    enlace: 'https://www.javeriana.edu.co/carrera-administracion-de-empresas',
    areas: ['Administracion', 'Artes'],
    programas: ['Administracion de Empresas', 'Artes Visuales']
  },
  {
    id: 'tadeo',
    nombre: 'Universidad Jorge Tadeo Lozano',
    ubicacion: 'Cra. 4 No. 22-61, Bogota',
    resumen: 'Destaca por su propuesta en administracion, ingenieria y artes con una mirada creativa y actual.',
    imagen: tadeoImg,
    enlace: 'https://www.utadeo.edu.co/es/facultad/ciencias-economicas-y-administrativas/programa/bogota/administracion-de-empresas',
    areas: ['Administracion', 'Tecnologia', 'Artes'],
    programas: ['Administracion de Empresas', 'Ingenieria de Sistemas', 'Artes Plasticas']
  },
  {
    id: 'bosque',
    nombre: 'Universidad El Bosque',
    ubicacion: 'Av. Cra. 9 No. 131 A-02, Bogota',
    resumen: 'Ofrece una formacion integral con alternativas en gestion, sistemas y procesos creativos.',
    imagen: bosqueImg,
    enlace: 'https://www.unbosque.edu.co/ciencias-economicas-y-administrativas/carrera/administracion-de-empresas',
    areas: ['Administracion', 'Tecnologia', 'Artes'],
    programas: ['Administracion de Empresas', 'Ingenieria de Sistemas', 'Artes Plasticas']
  },
  {
    id: 'nacional',
    nombre: 'Universidad Nacional de Colombia',
    ubicacion: 'Ciudad Universitaria, Bogota',
    resumen: 'Referente academico nacional con programas destacados en tecnologia y artes dentro de Bogota.',
    imagen: nacionalImg,
    enlace: 'https://ingenieria.bogota.unal.edu.co/es/formacion/pregrado/ingenieria-de-sistemas-y-computacion',
    areas: ['Tecnologia', 'Artes'],
    programas: ['Ingenieria de Sistemas y Computacion', 'Facultad de Artes']
  },
  {
    id: 'piloto',
    nombre: 'Universidad Piloto de Colombia',
    ubicacion: 'Cra. 9 No. 45A-44, Bogota',
    resumen: 'Una opcion enfocada en tecnologia para quienes buscan formacion en sistemas y proyectos digitales.',
    imagen: pilotoImg,
    enlace: 'https://www.unipiloto.edu.co/programas/pregrado/ingenieria-de-sistemas/',
    areas: ['Tecnologia'],
    programas: ['Ingenieria de Sistemas']
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

    const fullName = localStorage.getItem('fullName');
    const user = localStorage.getItem('username');
    if (fullName) {
      setUsername(fullName);
    } else if (user) {
      setUsername(user);
    }

    const cargarNombre = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/user/', {
          withCredentials: true
        });
        const nombre = response?.data?.first_name;
        if (nombre) {
          localStorage.setItem('fullName', nombre);
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
      localStorage.removeItem('fullName');
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
              <h3>Cambiar contrasena</h3>
              <div className="form-group">
                <label>Contrasena actual:</label>
                <input type="password" className="form-control" />
              </div>
              <div className="form-group">
                <label>Nueva contrasena:</label>
                <input type="password" className="form-control" />
              </div>
              <div className="form-group">
                <label>Confirmar contrasena:</label>
                <input type="password" className="form-control" />
              </div>
              <button className="btn btn-primary">Actualizar contrasena</button>
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
              <p>Que actividad te gusta mas?</p>
              <div className="opciones">
                <button className="btn-opcion">Resolver problemas matematicos</button>
                <button className="btn-opcion">Ayudar a otras personas</button>
                <button className="btn-opcion">Crear contenido artistico</button>
                <button className="btn-opcion">Trabajar con tecnologia</button>
              </div>
            </div>
            <div className="prueba-card">
              <h3>Pregunta 2</h3>
              <p>En que entorno te gustaria trabajar?</p>
              <div className="opciones">
                <button className="btn-opcion">Oficina</button>
                <button className="btn-opcion">Hospital</button>
                <button className="btn-opcion">Laboratorio</button>
                <button className="btn-opcion">Al aire libre</button>
              </div>
            </div>
            <button className="btn btn-primary">Enviar respuestas</button>
          </div>
        );

      case 'resultados':
        return (
          <div className="resultados-container">
            <h2>Tus Resultados</h2>
            <div className="resultado-card">
              <h3>Areas de mayor afinidad</h3>
              <div className="barra-progreso">
                <div className="barra-fill" style={{ width: '85%' }}>Tecnologia - 85%</div>
              </div>
              <div className="barra-progreso">
                <div className="barra-fill" style={{ width: '70%' }}>Ciencias - 70%</div>
              </div>
              <div className="barra-progreso">
                <div className="barra-fill" style={{ width: '55%' }}>Artes - 55%</div>
              </div>
            </div>
            <div className="recomendaciones">
              <h3>Carreras recomendadas</h3>
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
            <section className="universidades-hero">
              <div className="universidades-hero-copy">
                <div className="universidades-hero-badge">Tu futuro comienza aqui</div>
                <p className="universidades-hero-quote">
                  Encuentra universidades que conecten con tus intereses, tus talentos y el
                  proyecto profesional que quieres construir.
                </p>
                <p className="universidades-hero-subtext">
                  Revisa opciones en Bogota, compara programas y elige con mas claridad el lugar
                  donde quieres empezar tu camino universitario.
                </p>
              </div>
            </section>
            <section className="universidades-area">
              <div className="universidades-area-header">
                <h3>Universidades en Bogota</h3>
                <p>
                  Aqui cada universidad aparece una sola vez. En cada tarjeta puedes ver las
                  areas y programas con los que se relaciona dentro de tu busqueda.
                </p>
              </div>
              <div className="universidades-grid">
                {universidadesData.map((uni) => (
                  <article key={uni.id} className="uni-card">
                    <img src={uni.imagen} alt={uni.nombre} className="uni-imagen" />
                    <div className="uni-info">
                      <div className="uni-tags">
                        {uni.areas.map((area) => (
                          <span key={area} className="uni-programa-tag">{area}</span>
                        ))}
                      </div>
                      <h3>{uni.nombre}</h3>
                      <p className="uni-resumen">{uni.resumen}</p>
                      <div className="uni-program-list">
                        {uni.programas.map((programa) => (
                          <span key={programa} className="uni-program-chip">{programa}</span>
                        ))}
                      </div>
                      <p className="uni-ubicacion">{uni.ubicacion}</p>
                      <a
                        className="uni-link-btn"
                        href={uni.enlace}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Ver mas informacion
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        );

      default:
        return (
          <div className="inicio-container">
            <div className="hero-section">
              <img
                src={heroBanner}
                alt="Imagen principal del dashboard"
                className="hero-image"
              />
            </div>
            <section className="intro-section">
              <div className="intro-badge">Tu siguiente decision importa</div>
              <h2>Elegir una carrera no tiene que hacerse a ciegas</h2>
              <p>
                La prueba vocacional profesional te ayuda a descubrir que areas conectan mejor
                con tu personalidad, tus habilidades y la forma en que imaginas tu futuro.
              </p>
              <p>
                En lugar de elegir por presion, dudas o impulso, puedes tomar una decision mas
                clara, mas segura y mucho mas alineada contigo.
              </p>
              <div className="intro-highlight">
                Conocerte mejor hoy puede acercarte a una carrera que realmente disfrutes manana.
              </div>
            </section>
            <div className="menu-opciones">
              <div className="menu-card" onClick={() => setVistaActual('prueba')}>
                <div className="menu-card-glow" />
                <div className="menu-icon" aria-hidden="true">
                  <span>Explora</span>
                  <img src={iconEncuesta} alt="" className="menu-icon-badge" />
                </div>
                <h3>Hacer la Prueba</h3>
                <p>Descubre tu area vocacional ideal con una guia clara y personalizada.</p>
                <span className="menu-link">Comenzar ahora</span>
              </div>
              <div className="menu-card" onClick={() => setVistaActual('resultados')}>
                <div className="menu-card-glow" />
                <div className="menu-icon" aria-hidden="true">
                  <span>Analiza</span>
                  <img src={iconAnalisis} alt="" className="menu-icon-badge" />
                </div>
                <h3>Ver Resultados</h3>
                <p>Consulta tus avances y entiende mejor lo que tus respuestas revelan.</p>
                <span className="menu-link">Ver mi perfil</span>
              </div>
              <div className="menu-card" onClick={() => setVistaActual('universidades')}>
                <div className="menu-card-glow" />
                <div className="menu-icon" aria-hidden="true">
                  <span>Conecta</span>
                  <img src={iconEducacion} alt="" className="menu-icon-badge" />
                </div>
                <h3>Universidades</h3>
                <p>Explora opciones academicas para acercarte a la carrera que imaginas.</p>
                <span className="menu-link">Descubrir opciones</span>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`dashboard ${modoOscuro ? 'dark' : 'light'} ${menuAbierto ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
      <aside
        id="dashboard-sidebar"
        className={`dashboard-sidebar ${menuAbierto ? 'open' : ''}`}
        aria-label="Navegacion principal"
      >
        <button
          className="sidebar-expand-toggle"
          onClick={() => setMenuAbierto((prev) => !prev)}
          aria-expanded={menuAbierto}
          aria-controls="dashboard-sidebar"
          aria-label={menuAbierto ? 'Contraer menu lateral' : 'Expandir menu lateral'}
        >
          <span>{'>'}</span>
        </button>
        <button
          className="sidebar-brand"
          onClick={() => setVistaActual('inicio')}
          aria-label="Ir al inicio del dashboard"
        >
          <img src={logoOrientarso} alt="Orientarso" />
          <span className="sidebar-label">Orientarso</span>
        </button>
        <button
          className="sidebar-user"
          onClick={() => setFotoModalAbierto(true)}
          aria-label="Ver foto de perfil"
        >
          <span className="user-avatar">
            <img src={fotoPerfil} alt="Foto de perfil" />
          </span>
          <span className="user-name sidebar-label">{username}</span>
        </button>
        <nav className="sidebar-nav" aria-label="Opciones del dashboard">
          <button
            className={`sidebar-item ${vistaActual === 'inicio' ? 'active' : ''}`}
            onClick={() => setVistaActual('inicio')}
          >
            <img src={iconHome} alt="" className="menu-icon-img" />
            <span className="sidebar-label">Home</span>
          </button>
          <button
            className={`sidebar-item ${vistaActual === 'configuracion' ? 'active' : ''}`}
            onClick={() => setVistaActual('configuracion')}
          >
            <img src={iconAccount} alt="" className="menu-icon-img" />
            <span className="sidebar-label">Mi cuenta</span>
          </button>
          <button
            className={`sidebar-item ${vistaActual === 'prueba' ? 'active' : ''}`}
            onClick={() => setVistaActual('prueba')}
          >
            <img src={iconEncuesta} alt="" className="menu-icon-img" />
            <span className="sidebar-label">Prueba vocacional</span>
          </button>
          <button
            className={`sidebar-item ${vistaActual === 'resultados' ? 'active' : ''}`}
            onClick={() => setVistaActual('resultados')}
          >
            <img src={iconAnalisis} alt="" className="menu-icon-img" />
            <span className="sidebar-label">Resultados</span>
          </button>
          <button
            className={`sidebar-item ${vistaActual === 'universidades' ? 'active' : ''}`}
            onClick={() => setVistaActual('universidades')}
          >
            <img src={iconEducacion} alt="" className="menu-icon-img" />
            <span className="sidebar-label">Universidades</span>
          </button>
          <button
            className="sidebar-item"
            onClick={() => setModoOscuro((prev) => !prev)}
          >
            <img
              src={modoOscuro ? iconSun : iconMoon}
              alt=""
              className="menu-icon-img"
            />
            <span className="sidebar-label">{modoOscuro ? 'Modo claro' : 'Modo oscuro'}</span>
          </button>
        </nav>
        <button className="sidebar-item logout" onClick={handleLogout}>
          <span className="sidebar-symbol" aria-hidden="true">{'<'}</span>
          <span className="sidebar-label">Cerrar sesion</span>
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
