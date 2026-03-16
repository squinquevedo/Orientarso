import React, { useState } from 'react';
import './Inicio.css';
import heroVideo from '../assets/Video_Generado_con_Orientación.mp4';
import logoOrientarso from '../assets/logo.orientarso-removebg-preview.png';
import gridIcon from '../assets/grid-3x2-gap-fill.svg';
import imgAutoconocimiento from '../assets/Gemini_Generated_Image_o3b6wo3b6wo3b6wo.png';
import imgResultados from '../assets/unnamed (1).jpg';
import imgExplora from '../assets/unnamed.jpg';
import Login from './Login';
import Registro from './Registro';

function Inicio() {
  const [modalImage, setModalImage] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const openModal = (image) => setModalImage(image);
  const closeModal = () => setModalImage(null);
  const openLogin = () => setIsLoginOpen(true);
  const closeLogin = () => setIsLoginOpen(false);
  const openSignup = () => setIsSignupOpen(true);
  const closeSignup = () => setIsSignupOpen(false);
  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      <header>
        <nav className="navbar">
          <div className="nav-left">
            <div className={`dropdown ${isMenuOpen ? 'open' : ''}`}>
              <button
                className="dropdown-toggle"
                type="button"
                aria-label="Abrir menú"
                aria-expanded={isMenuOpen}
                onClick={toggleMenu}
              >
                <img src={gridIcon} alt="" className="dropdown-icon" />
              </button>
              {isMenuOpen && (
                <div className="dropdown-menu">
                  <a href="#" onClick={closeMenu}>Contacto</a>
                  <a href="#areas-vocacionales" onClick={closeMenu}>Áreas Vocacionales</a>
                </div>
              )}
            </div>
            <img src={logoOrientarso} alt="Orientarso" className="logo-image" />
          </div>
          <ul className="menu">
            <li className="nav-actions">
              <button type="button" className="nav-btn nav-btn-outline" onClick={openLogin}>Login</button>
              <button type="button" className="nav-btn nav-btn-solid" onClick={openSignup}>Signup</button>
            </li>
          </ul>
        </nav>
      </header>

      <section className="hero">
        <video className="hero-video" autoPlay loop muted playsInline>
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="hero-text">
          <h2>Descubre tu futuro profesional</h2>
          <p>
            Realiza nuestro test de orientación vocacional y encuentra la carrera
            que mejor se adapta a tus habilidades, intereses y personalidad.
          </p>
          <a href="#" className="btn">Realizar Test</a>
        </div>
      </section>

      <section className="benefits">
        <h2>¿Por qué usar Orientarso?</h2>
        <div className="cards">
          <div
            className="card"
            role="button"
            tabIndex={0}
            onClick={() => openModal(imgAutoconocimiento)}
            onKeyDown={(e) => { if (e.key === 'Enter') openModal(imgAutoconocimiento); }}
          >
            <img
              className="card-image"
              src={imgAutoconocimiento}
              alt="Autoconocimiento"
            />
          </div>
          <div
            className="card"
            role="button"
            tabIndex={0}
            onClick={() => openModal(imgResultados)}
            onKeyDown={(e) => { if (e.key === 'Enter') openModal(imgResultados); }}
          >
            <img
              className="card-image"
              src={imgResultados}
              alt="Resultados Inteligentes"
            />
          </div>
          <div
            className="card"
            role="button"
            tabIndex={0}
            onClick={() => openModal(imgExplora)}
            onKeyDown={(e) => { if (e.key === 'Enter') openModal(imgExplora); }}
          >
            <img
              className="card-image"
              src={imgExplora}
              alt="Explora Carreras"
            />
          </div>
        </div>
      </section>

      <section className="areas" id="areas-vocacionales">
        <h2>Áreas Vocacionales</h2>
        <div className="areas-container">
          <div className="area">Tecnología</div>
          <div className="area">Arte y Diseño</div>
          <div className="area">Negocios</div>
        </div>
      </section>

      {modalImage && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal} aria-label="Cerrar">x</button>
            <img className="modal-image" src={modalImage} alt="Imagen ampliada" />
          </div>
        </div>
      )}

      {isLoginOpen && (
        <div className="modal-overlay login-modal" onClick={closeLogin}>
          <div className="modal-content login-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeLogin} aria-label="Cerrar">x</button>
            <Login />
          </div>
        </div>
      )}

      {isSignupOpen && (
        <div className="modal-overlay signup-modal" onClick={closeSignup}>
          <div className="modal-content signup-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeSignup} aria-label="Cerrar">x</button>
            <Registro />
          </div>
        </div>
      )}

      <footer>
        <p>© 2026 Orientarso | Plataforma de Orientación Vocacional</p>
      </footer>
    </>
  );
}

export default Inicio;
