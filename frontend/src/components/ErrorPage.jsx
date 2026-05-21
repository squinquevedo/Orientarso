import React from 'react';
import { Link, useParams } from 'react-router-dom';
import './ErrorPage.css';

import error404 from '../assets/error 404.png';
import error408 from '../assets/error 408.png';
import error500 from '../assets/error 500.png';
import error503 from '../assets/error 503.png';

const ERROR_CONTENT = {
  404: {
    title: 'Pagina no encontrada',
    message: 'La ruta que intentas abrir no existe o fue movida.',
    image: error404,
  },
  408: {
    title: 'Tiempo de espera agotado',
    message: 'La solicitud tardo demasiado en responder.',
    image: error408,
  },
  500: {
    title: 'Error interno',
    message: 'Ocurrio un problema inesperado en el servidor.',
    image: error500,
  },
  503: {
    title: 'Servicio no disponible',
    message: 'El servicio no esta disponible temporalmente.',
    image: error503,
  },
};

function ErrorPage({ code }) {
  const params = useParams();
  const errorCode = String(code || params.code || '404');
  const content = ERROR_CONTENT[errorCode] || ERROR_CONTENT[404];

  return (
    <main className="error-page">
      <section className="error-page__content" aria-labelledby="error-title">
        <img className="error-page__image" src={content.image} alt={`Error ${errorCode}`} />
        <div className="error-page__text">
          <span className="error-page__code">{errorCode}</span>
          <h1 id="error-title">{content.title}</h1>
          <p>{content.message}</p>
          <Link className="error-page__button" to="/">
            Volver al inicio
          </Link>
        </div>
      </section>
    </main>
  );
}

export default ErrorPage;
