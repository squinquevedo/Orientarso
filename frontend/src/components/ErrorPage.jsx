import React from "react";
import "./ErrorPage.css";
import logoOrientarso from "../assets/logo.orientarso.jpeg";
import error404 from "../assets/errors/error404.svg";
import error408 from "../assets/errors/error408.svg";
import error500 from "../assets/errors/error500.svg";
import error503 from "../assets/errors/error503.svg";

const ErrorPage = ({ code }) => {
  const images = {
    404: error404,
    408: error408,
    500: error500,
    503: error503,
  };

  const messages = {
    404: "Página no encontrada",
    408: "Tiempo de espera agotado",
    500: "Error interno del servidor",
    503: "Servicio no disponible",
  };

  return (
    <div className="error-container">
      {/* Header institucional */}
      <header className="error-header">
        <img src={logoOrientarso} alt="Logo Orientarso" className="logo-orientarso" />
      </header>

      {/* Imagen del error */}
      <img src={images[code]} alt={`Error ${code}`} className="error-image" />

      <h2>Error {code}</h2>
      <p>{messages[code]}</p>
    </div>
  );
};

export default ErrorPage;
