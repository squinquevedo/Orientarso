import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Dashboard.css';
import iconHome from '../assets/house-door-fill.svg';
import iconAccount from '../assets/person-circle.svg';
import iconMoon from '../assets/moon-fill.svg';
import iconSun from '../assets/brightness-high-fill.svg';
import iconFlecha from '../assets/flecha.svg';
import iconGuardar from '../assets/guardar.svg';
import iconSalir from '../assets/salir.svg';
import heroVideo from '../assets/Video_Orientación_Vocacional_Sin_Texto.mp4';
import iconEncuesta from '../assets/encuesta-128x128.png';
import iconAnalisis from '../assets/análisis-128x128.png';
import iconEducacion from '../assets/educación-128x128.png';
import javerianaImg from '../assets/javeriana.png';
import bosqueImg from '../assets/Universidad El Bosque.jpeg';
import tadeoImg from '../assets/Universidad Jorge Tadeo Lozano.jpg';
import nacionalImg from '../assets/Universidad Nacional de Colombia.jpg';
import pilotoImg from '../assets/Universidad Piloto de Colombia.jpg';
import { API_BASE } from '../config/api';
import ProfilePhotoModal from './ProfilePhotoModal';

const OPCIONES = [
  { label: 'De acuerdo', value: 25 },
  { label: 'A veces', value: 15 },
  { label: 'Muy poco', value: 5 },
  { label: 'Desacuerdo', value: 0 },
];
const MAX_OPTION = Math.max(...OPCIONES.map((o) => o.value));

const REPORT_FIELDS = [
  { id: 'universidad', label: 'Universidad' },
  { id: 'carrera_vinculada', label: 'Carreras vinculadas a la universidad' },
  { id: 'carrera_normal', label: 'Carreras normales' },
  { id: 'valor_semestre', label: 'Valor del semestre' },
  { id: 'duracion', label: 'Duracion' },
  { id: 'tipo_universidad', label: 'Tipo de universidad' },
  { id: 'convenio', label: 'Convenios - nombre del convenio' },
  { id: 'beneficio', label: 'Beneficios - nombre del beneficio' },
  { id: 'localidad', label: 'Localidad' },
  { id: 'direccion', label: 'Direccion' },
];

function refreshImageUrl(url) {
  if (!url) return '';
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${Date.now()}`;
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return '';
}

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
  const [fotoPerfil, setFotoPerfil] = useState('');
  const [modoOscuro, setModoOscuro] = useState(false);
  const [preguntas, setPreguntas] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [cargandoPreguntas, setCargandoPreguntas] = useState(false);
  const [errorPreguntas, setErrorPreguntas] = useState('');
  const [areasMap, setAreasMap] = useState({});
  const [guardandoTest, setGuardandoTest] = useState(false);
  const [errorTest, setErrorTest] = useState('');
  const [testCompleted, setTestCompleted] = useState(false);
  const [reportData, setReportData] = useState({ universities: [], carreras_catalogo: [] });
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [includedReportFields, setIncludedReportFields] = useState([]);
  const [draggedReportField, setDraggedReportField] = useState(null);
  const navigate = useNavigate();

  const loadReportData = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/universidades-reporte/`, {
        withCredentials: true,
      });
      setReportData({
        universities: response.data?.universities || [],
        carreras_catalogo: response.data?.carreras_catalogo || [],
      });
      return response.data || {};
    } catch (error) {
      setReportData({ universities: [], carreras_catalogo: [] });
      return {};
    }
  }, []);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    const localRole = localStorage.getItem('userRole');
    const localIsAdmin = localStorage.getItem('isAdmin') === 'true';
    if (localRole === 'admin' || localIsAdmin) {
      navigate('/dashboard_admin', { replace: true });
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
        const response = await axios.get(`${API_BASE}/api/user/`, {
          withCredentials: true
        });
        if (response?.data?.is_admin) {
          localStorage.setItem('userRole', response.data.rol || 'admin');
          localStorage.setItem('isAdmin', 'true');
          navigate('/dashboard_admin', { replace: true });
          return;
        }
        const nombre = response?.data?.first_name;
        if (nombre) {
          localStorage.setItem('fullName', nombre);
          setUsername(nombre);
        }
        setFotoPerfil(response?.data?.foto_perfil_url || '');
      } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem('fullName');
          localStorage.removeItem('username');
          localStorage.removeItem('token');
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('userRole');
          localStorage.removeItem('isAdmin');
          sessionStorage.clear();
          navigate('/login', { replace: true });
        }
      }
    };

    cargarNombre();
  }, [navigate]);

  const saveProfilePhoto = async (photoFile) => {
    const formData = new FormData();
    formData.append('foto', photoFile);
    await axios.get(`${API_BASE}/api/csrf/`, { withCredentials: true });
    const csrfToken = getCookie('csrftoken');

    const response = await axios.post(`${API_BASE}/api/user/foto-perfil/`, formData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'multipart/form-data',
        'X-CSRFToken': csrfToken,
      },
    });

    setFotoPerfil(refreshImageUrl(response?.data?.foto_perfil_url || ''));
  };

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuthenticated) return;

    loadReportData();
  }, []);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuthenticated || vistaActual !== 'prueba') return;

    const cargarPreguntas = async () => {
      setCargandoPreguntas(true);
      setErrorPreguntas('');
      try {
        const response = await axios.get(`${API_BASE}/api/preguntas/`, {
          withCredentials: true,
        });
        setPreguntas(Array.isArray(response.data) ? response.data : []);
        setRespuestas({});
      } catch (error) {
        setErrorPreguntas(error.response?.data?.error || 'Error al cargar preguntas');
        setPreguntas([]);
      } finally {
        setCargandoPreguntas(false);
      }
    };

    const cargarAreas = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/areas/`, {
          withCredentials: true,
        });
        const map = {};
        (Array.isArray(response.data) ? response.data : []).forEach((area) => {
          map[String(area.id)] = area.nom_area;
        });
        setAreasMap(map);
      } catch (error) {
        setAreasMap({});
      }
    };

    cargarPreguntas();
    cargarAreas();
  }, [vistaActual]);

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE}/api/logout/`, {}, { withCredentials: true });
    } catch (error) {
      // Si falla el backend igual limpiamos el cliente
    } finally {
      localStorage.removeItem('fullName');
      localStorage.removeItem('username');
      localStorage.removeItem('token');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userRole');
      localStorage.removeItem('isAdmin');
      sessionStorage.clear();
      navigate('/', { replace: true });
    }
  };

  const maxPorArea = useMemo(() => {
    const mapa = {};
    preguntas.forEach((pregunta) => {
      const areaKey = String(pregunta.id_area ?? 'sin_area');
      const maxPregunta = Number(pregunta.valor) || MAX_OPTION;
      mapa[areaKey] = (mapa[areaKey] || 0) + maxPregunta;
    });
    return mapa;
  }, [preguntas]);

  const puntajePorArea = useMemo(() => {
    const mapa = {};
    preguntas.forEach((pregunta) => {
      const areaKey = String(pregunta.id_area ?? 'sin_area');
      const maxPregunta = Number(pregunta.valor) || MAX_OPTION;
      const respuesta = Number(respuestas[pregunta.id]) || 0;
      const valorNormalizado = (respuesta / MAX_OPTION) * maxPregunta;
      mapa[areaKey] = (mapa[areaKey] || 0) + valorNormalizado;
    });
    return mapa;
  }, [preguntas, respuestas]);

  const resultados = useMemo(() => {
    return Object.keys(maxPorArea)
      .map((areaKey) => {
        const max = maxPorArea[areaKey] || 0;
        const score = puntajePorArea[areaKey] || 0;
        const pct = max ? Math.round((score / max) * 100) : 0;
        return { areaKey, score, max, pct };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [maxPorArea, puntajePorArea]);

  const affinityByArea = useMemo(() => {
    return resultados.reduce((acc, resultado) => {
      acc[String(resultado.areaKey)] = resultado.pct;
      return acc;
    }, {});
  }, [resultados]);

  const topResultAreaKey = resultados[0]?.areaKey ? String(resultados[0].areaKey) : '';

  const recommendedCareers = useMemo(() => {
    if (!testCompleted || !topResultAreaKey) return [];
    return (reportData.carreras_catalogo || [])
      .filter((career) => career.activa !== false)
      .filter((career) => String(career.id_area) === topResultAreaKey)
      .map((career) => ({
        ...career,
        affinity: affinityByArea[String(career.id_area)] || 0,
        areaName: areasMap[String(career.id_area)] || career.area || `Area ${career.id_area}`,
      }))
      .sort((a, b) => b.affinity - a.affinity || String(a.nombre).localeCompare(String(b.nombre)));
  }, [affinityByArea, areasMap, reportData.carreras_catalogo, testCompleted, topResultAreaKey]);

  const reportRows = useMemo(() => {
    if (!testCompleted) return [];
    const rows = [];

    recommendedCareers.forEach((normalCareer) => {
      let foundUniversityLink = false;

      (reportData.universities || []).forEach((university) => {
        (university.carreras || [])
          .filter((linkedCareer) => String(linkedCareer.id_carrera) === String(normalCareer.id))
          .forEach((linkedCareer) => {
            foundUniversityLink = true;
            const benefits = (university.beneficios_carrera || []).filter(
              (benefit) => String(benefit.id_carrera) === String(normalCareer.id)
            );
            const agreements = (university.convenios || []).filter(
              (agreement) => String(agreement.id_carrera) === String(normalCareer.id)
            );
            rows.push({
              universidad: university.nombre || '',
              carrera_vinculada: linkedCareer.nombre_carrera || normalCareer.nombre || '',
              carrera_normal: normalCareer.nombre || '',
              valor_semestre: linkedCareer.valor_semestre || '',
              duracion: linkedCareer.duracion_semestres ? `${linkedCareer.duracion_semestres} semestres` : '',
              tipo_universidad: university.tipo || '',
              convenio: agreements.map((agreement) => agreement.nombre_convenio).filter(Boolean).join(', '),
              beneficio: benefits.map((benefit) => benefit.tipo_beneficio).filter(Boolean).join(', '),
              localidad: university.localidad || '',
              direccion: university.direccion || '',
              affinity: normalCareer.affinity || 0,
            });
          });
      });

      if (!foundUniversityLink) {
        rows.push({
          universidad: '',
          carrera_vinculada: '',
          carrera_normal: normalCareer.nombre || '',
          valor_semestre: '',
          duracion: '',
          tipo_universidad: '',
          convenio: '',
          beneficio: '',
          localidad: '',
          direccion: '',
          affinity: normalCareer.affinity || 0,
        });
      }
    });

    return rows.sort((a, b) => b.affinity - a.affinity);
  }, [recommendedCareers, reportData.universities, testCompleted]);

  const allUniversityReportRows = useMemo(() => {
    const rows = [];

    (reportData.universities || []).forEach((university) => {
      const linkedCareers = university.carreras || [];

      if (linkedCareers.length === 0) {
        rows.push({
          universidad: university.nombre || '',
          carrera_vinculada: '',
          carrera_normal: '',
          valor_semestre: '',
          duracion: '',
          tipo_universidad: university.tipo || '',
          convenio: '',
          beneficio: '',
          localidad: university.localidad || '',
          direccion: university.direccion || '',
          affinity: 0,
        });
        return;
      }

      linkedCareers.forEach((linkedCareer) => {
        const benefits = (university.beneficios_carrera || []).filter(
          (benefit) => String(benefit.id_carrera) === String(linkedCareer.id_carrera)
        );
        const agreements = (university.convenios || []).filter(
          (agreement) => String(agreement.id_carrera) === String(linkedCareer.id_carrera)
        );

        rows.push({
          universidad: university.nombre || '',
          carrera_vinculada: linkedCareer.nombre_carrera || '',
          carrera_normal: linkedCareer.nombre_carrera || '',
          valor_semestre: linkedCareer.valor_semestre || '',
          duracion: linkedCareer.duracion_semestres ? `${linkedCareer.duracion_semestres} semestres` : '',
          tipo_universidad: university.tipo || '',
          convenio: agreements.map((agreement) => agreement.nombre_convenio).filter(Boolean).join(', '),
          beneficio: benefits.map((benefit) => benefit.tipo_beneficio).filter(Boolean).join(', '),
          localidad: university.localidad || '',
          direccion: university.direccion || '',
          affinity: 0,
        });
      });
    });

    return rows;
  }, [reportData.universities]);

  const enviarTest = async () => {
    if (Object.keys(respuestas).length < preguntas.length) {
      setErrorTest('Responde todas las preguntas antes de ver tus resultados.');
      return;
    }
    setGuardandoTest(true);
    setErrorTest('');
    try {
      await axios.get(`${API_BASE}/api/csrf/`, { withCredentials: true });
      const csrfToken = getCookie('csrftoken');
      const payload = {
        respuestas: Object.keys(respuestas).map((id_pregunta) => ({
          id_pregunta: Number(id_pregunta),
          respuesta: Number(respuestas[id_pregunta]) || 0,
        })),
      };
      await axios.post(
        `${API_BASE}/api/test/`,
        payload,
        {
          withCredentials: true,
          headers: {
            'X-CSRFToken': csrfToken,
          },
        }
      );
      await loadReportData();
      setTestCompleted(true);
      setVistaActual('resultados');
    } catch (error) {
      setErrorTest(error.response?.data?.error || 'Error al guardar el intento');
    } finally {
      setGuardandoTest(false);
    }
  };

  const availableReportFields = REPORT_FIELDS.filter(
    (field) => !includedReportFields.includes(field.id)
  );

  const addReportField = (fieldId) => {
    setIncludedReportFields((prev) => (prev.includes(fieldId) ? prev : [...prev, fieldId]));
  };

  const removeReportField = (fieldId) => {
    setIncludedReportFields((prev) => prev.filter((id) => id !== fieldId));
  };

  const handleReportDrop = (event) => {
    event.preventDefault();
    if (draggedReportField) {
      addReportField(draggedReportField);
      setDraggedReportField(null);
    }
  };

  const downloadReportPdf = () => {
    if (includedReportFields.length === 0) return;
    const selectedFields = includedReportFields
      .map((fieldId) => REPORT_FIELDS.find((field) => field.id === fieldId))
      .filter(Boolean);
    const rows = reportRows.length > 0
      ? reportRows
      : allUniversityReportRows.length > 0
        ? allUniversityReportRows
        : recommendedCareers.map((career) => ({
          carrera_normal: career.nombre,
          carrera_vinculada: '',
          universidad: '',
          valor_semestre: '',
          duracion: '',
          tipo_universidad: '',
          convenio: '',
          beneficio: '',
          localidad: '',
          direccion: '',
        }));

    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    doc.setFontSize(16);
    doc.text('Reporte de recomendaciones vocacionales', 40, 40);
    doc.setFontSize(10);
    doc.text(`Generado para: ${username}`, 40, 58);

    autoTable(doc, {
      startY: 78,
      head: [selectedFields.map((field) => field.label)],
      body: rows.map((row) => selectedFields.map((field) => row[field.id] || '-')),
      styles: { fontSize: 8, cellPadding: 5, overflow: 'linebreak' },
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    });

    doc.save('reporte_recomendaciones.pdf');
    setReportModalOpen(false);
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
              <button className="btn btn-primary btn-icon">
                <img src={iconGuardar} alt="" />
                Guardar cambios
              </button>
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
            {cargandoPreguntas && (
              <div className="prueba-loading">Cargando preguntas...</div>
            )}
            {errorPreguntas && (
              <div className="prueba-error">{errorPreguntas}</div>
            )}
            {!cargandoPreguntas && !errorPreguntas && preguntas.length === 0 && (
              <div className="prueba-empty">No hay preguntas disponibles.</div>
            )}
            {preguntas.map((pregunta, index) => (
              <div key={pregunta.id} className="prueba-card">
                <h3>Pregunta {index + 1}</h3>
                <p>{pregunta.pregunta}</p>
                <div className="opciones">
                  {OPCIONES.map((opcion) => {
                    const active = respuestas[pregunta.id] === opcion.value;
                    return (
                      <button
                        key={opcion.value}
                        type="button"
                        className={`btn-opcion ${active ? 'active' : ''}`}
                        onClick={() =>
                          setRespuestas((prev) => ({
                            ...prev,
                            [pregunta.id]: opcion.value,
                          }))
                        }
                      >
                        {opcion.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {errorTest && <div className="prueba-error">{errorTest}</div>}
            <button
              className="btn btn-primary"
              onClick={enviarTest}
              disabled={preguntas.length === 0 || Object.keys(respuestas).length < preguntas.length || guardandoTest}
            >
              {guardandoTest ? 'Guardando...' : 'Ver resultados'}
            </button>
          </div>
        );

      case 'resultados':
        return (
          <div className="resultados-container">
            <h2>Tus Resultados</h2>
            <div className="resultado-card">
              <h3>Areas de mayor afinidad</h3>
              {resultados.length === 0 && (
                <div className="resultado-empty">Aun no hay resultados para mostrar.</div>
              )}
              {resultados.map((resultado) => (
                <div key={resultado.areaKey} className="barra-progreso">
                  <div
                    className="barra-fill"
                    style={{ width: `${resultado.pct}%` }}
                  >
                    {areasMap[resultado.areaKey] || `Area ${resultado.areaKey}`} - {resultado.pct}% ({Math.round(resultado.score)}/{Math.round(resultado.max)})
                  </div>
                </div>
              ))}
            </div>
            {testCompleted && (
              <div className="recomendaciones">
                <div className="recomendaciones-header">
                  <h3>Carreras recomendadas</h3>
                  <button className="btn btn-primary" type="button" onClick={() => setReportModalOpen(true)}>
                    Descargar reporte
                  </button>
                </div>
                {recommendedCareers.length === 0 ? (
                  <div className="resultado-empty">No hay carreras activas para recomendar.</div>
                ) : (
                  <ul>
                    {recommendedCareers.map((career) => (
                      <li key={career.id}>
                        <strong>{career.nombre}</strong>
                        <span>{career.areaName} - {career.affinity}% afinidad</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
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
              <video
                className="hero-video"
                src={heroVideo}
                autoPlay
                muted
                loop
                playsInline
              />
              <div className="hero-overlay" aria-hidden="true" />
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

  const renderReportModal = () => {
    if (!reportModalOpen) return null;

    return (
      <div className="report-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="report-modal-title">
        <div className="report-modal-content">
          <div className="report-modal-header">
            <div>
              <h3 id="report-modal-title">Descargar reporte</h3>
              <p>Arrastra las opciones que quieres mostrar en el PDF.</p>
            </div>
            <button className="report-modal-close" type="button" onClick={() => setReportModalOpen(false)}>
              x
            </button>
          </div>

          <div className="report-builder-grid">
            <section className="report-option-box">
              <h4>Opciones de reporte:</h4>
              <div className="report-chip-list">
                {availableReportFields.map((field) => (
                  <button
                    key={field.id}
                    type="button"
                    className="report-chip"
                    draggable
                    onDragStart={() => setDraggedReportField(field.id)}
                    onClick={() => addReportField(field.id)}
                  >
                    {field.label}
                  </button>
                ))}
                {availableReportFields.length === 0 && (
                  <div className="resultado-empty">Todas las opciones fueron incluidas.</div>
                )}
              </div>
            </section>

            <section
              className="report-option-box report-drop-zone"
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleReportDrop}
            >
              <h4>Opciones incluidas en el reporte:</h4>
              <div className="report-chip-list included">
                {includedReportFields.map((fieldId) => {
                  const field = REPORT_FIELDS.find((item) => item.id === fieldId);
                  if (!field) return null;
                  return (
                    <button
                      key={field.id}
                      type="button"
                      className="report-chip included"
                      onClick={() => removeReportField(field.id)}
                      title="Quitar opcion"
                    >
                      {field.label}
                    </button>
                  );
                })}
                {includedReportFields.length === 0 && (
                  <div className="report-drop-empty">Arrastra aqui las opciones del reporte.</div>
                )}
              </div>
            </section>
          </div>

          <div className="report-modal-actions">
            <button className="btn btn-secondary" type="button" onClick={() => setReportModalOpen(false)}>
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              type="button"
              onClick={downloadReportPdf}
              disabled={includedReportFields.length === 0}
            >
              Descargar reporte
            </button>
          </div>
        </div>
      </div>
    );
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
          <img src={iconFlecha} alt="" className="sidebar-arrow-icon" />
        </button>
        <button
          className="sidebar-user"
          onClick={() => setFotoModalAbierto(true)}
          aria-label="Ver foto de perfil"
        >
          <span className="user-avatar">
            {fotoPerfil ? (
              <img src={fotoPerfil} alt="Foto de perfil" />
            ) : (
              <img src={iconAccount} alt="" className="user-avatar-placeholder" />
            )}
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
          <img src={iconSalir} alt="" className="menu-icon-img" />
          <span className="sidebar-label">Cerrar sesion</span>
        </button>
      </aside>
      {fotoModalAbierto && (
        <ProfilePhotoModal
          currentPhoto={fotoPerfil}
          placeholderIcon={iconAccount}
          onClose={() => setFotoModalAbierto(false)}
          onSave={saveProfilePhoto}
        />
      )}
      <main className="main-content">
        {renderContent()}
      </main>
      {renderReportModal()}
    </div>
  );
}

export default Dashboard;
