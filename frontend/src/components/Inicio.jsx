import React from 'react';
import { Link } from 'react-router-dom';
import './Inicio.css';

function Inicio() {
  return (
    <>
      <header className="header">
        <Link to="/login" className="header-link">Iniciar sesión</Link>
      </header>

      <div className="content">
        <h1>Bienvenido a Nuestra Empresa</h1>
        <p>Aquí va la información de la empresa, sus servicios, misión, visión, etc.</p>
        <Link to="/registro" className="registro-link">Regístrate</Link>
        <br /><br />
        <Link to="/home" style={{ color: '#007bff', textDecoration: 'underline' }}>
          Ver módulo de orientación sin login
        </Link>
      </div>
    </>
  );
}

export default Inicio;