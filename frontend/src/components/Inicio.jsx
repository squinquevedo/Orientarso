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
  const [activeCard, setActiveCard] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const paletteColors = ['#264653', '#2A9D8F', '#E9C46A', '#F4A261', '#E76F51'];

  const openModal = (card) => {
    setIsClosing(false);
    setActiveCard(card);
  };
  const closeModal = () => {
    setIsClosing(true);
    window.setTimeout(() => {
      setActiveCard(null);
      setIsClosing(false);
    }, 240);
  };
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
          <div className="palette-card single-vision-card">
            <div className="palette">
              <div className="color" style={{ background: paletteColors[0] }}>
                <span className="palette-label">Mision</span>
              </div>
              <div className="color" style={{ background: paletteColors[1] }}>
                <span className="palette-label">Vision</span>
              </div>
              <div
                className="color color-image"
                style={{ backgroundImage: `url("${imgAutoconocimiento}")` }}
                role="button"
                tabIndex={0}
                aria-label="Ver Autoconocimiento"
                onClick={() => openModal({ type: 'image', title: 'Autoconocimiento', image: imgAutoconocimiento })}
                onKeyDown={(e) => { if (e.key === 'Enter') openModal({ type: 'image', title: 'Autoconocimiento', image: imgAutoconocimiento }); }}
              />
              <div
                className="color color-image"
                style={{ backgroundImage: `url("${imgResultados}")` }}
                role="button"
                tabIndex={0}
                aria-label="Ver Resultados Inteligentes"
                onClick={() => openModal({ type: 'image', title: 'Resultados Inteligentes', image: imgResultados })}
                onKeyDown={(e) => { if (e.key === 'Enter') openModal({ type: 'image', title: 'Resultados Inteligentes', image: imgResultados }); }}
              />
              <div
                className="color color-image"
                style={{ backgroundImage: `url("${imgExplora}")` }}
                role="button"
                tabIndex={0}
                aria-label="Ver Explora Carreras"
                onClick={() => openModal({ type: 'image', title: 'Explora Carreras', image: imgExplora })}
                onKeyDown={(e) => { if (e.key === 'Enter') openModal({ type: 'image', title: 'Explora Carreras', image: imgExplora }); }}
              />
            </div>
            <div className="palette-stats">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path d="M4 7.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5S5.5 9.83 5.5 9 4.83 7.5 4 7.5zm10 0c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm-5 0c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5S9.83 7.5 9 7.5z"></path>
              </svg>
            </div>
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

      {activeCard && (
        <div
          className={`zoom-overlay ${isClosing ? 'closing' : 'open'}`}
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
        >
          <div className={`zoom-content ${isClosing ? 'closing' : 'open'}`} onClick={(e) => e.stopPropagation()}>
            <button className="zoom-close" onClick={closeModal} aria-label="Cerrar">x</button>
            {activeCard.type === 'image' ? (
              <img className="zoom-image" src={activeCard.image} alt={activeCard.title} />
            ) : (
              <div className="zoom-palette">
                <div className="zoom-title">{activeCard.title}</div>
                <div className="palette">
                  {paletteColors.map((color) => (
                    <div key={color} className="color" style={{ background: color }}>
                      <span>{color.replace('#', '')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isLoginOpen && (
        <div className="modal-overlay login-modal" onClick={closeLogin}>
          <div className="modal-content login-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeLogin} aria-label="Cerrar">x</button>
            <Login showHeader={false} />
          </div>
        </div>
      )}

      {isSignupOpen && (
        <div className="modal-overlay signup-modal" onClick={closeSignup}>
          <div className="modal-content signup-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeSignup} aria-label="Cerrar">x</button>
            <Registro showHeader={false} />
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
