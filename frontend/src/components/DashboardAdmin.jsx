import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';
import logoOrientarso from '../assets/logo.orientarso-removebg-preview.png';
import iconHome from '../assets/house-door-fill.svg';
import iconAccount from '../assets/person-circle.svg';
import iconMoon from '../assets/moon-fill.svg';
import iconSun from '../assets/brightness-high-fill.svg';
import iconEditar from '../assets/editar.svg';
import iconDesplegable from '../assets/desplegable.svg';
import iconActivar from '../assets/activar y desabilitar.svg';
import iconGuardar from '../assets/guardar.svg';
import { API_BASE } from '../config/api';

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return '';
}

function createCareerLink() {
  return {
    id_carrera: '',
    modalidad: '',
    duracion_semestres: '',
    valor_semestre: '',
    jornada: '',
    activa: true,
  };
}

function createBenefit() {
  return {
    id_carrera: '',
    tipo_beneficio: '',
    descripcion: '',
    porcentaje_descuento: '',
  };
}

function createAgreement() {
  return {
    id_carrera: '',
    id_entidad: '',
    nombre_convenio: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: '',
    vigente: true,
  };
}

function createUniversity() {
  return {
    nombre: '',
    tipo: '',
    localidad: '',
    direccion: '',
    sitio_web: '',
    carreras: [createCareerLink()],
    beneficios_carrera: [],
    convenios: [],
    entidades_apoyo: [],
    tiene_convenios: false,
    tiene_beneficios_carrera: false,
    tiene_entidades_apoyo: false,
  };
}

function DashboardAdmin() {
  const [username, setUsername] = useState('Administrador');
  const [vistaActual, setVistaActual] = useState('usuarios');
  const [menuAbierto, setMenuAbierto] = useState(true);
  const [modoOscuro, setModoOscuro] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [users, setUsers] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [careersCatalog, setCareersCatalog] = useState([]);
  const [entitiesCatalog, setEntitiesCatalog] = useState([]);
  const [newCareer, setNewCareer] = useState({ nombre: '', id_area: '', activa: true });
  const [careerSearch, setCareerSearch] = useState('');
  const [careerAreaFilters, setCareerAreaFilters] = useState([]);
  const [careerStatusFilters, setCareerStatusFilters] = useState([]);
  const [careerLimit, setCareerLimit] = useState(10);
  const [expandedCareerId, setExpandedCareerId] = useState(null);
  const [editingCareer, setEditingCareer] = useState(null);
  const [showNewCareerForm, setShowNewCareerForm] = useState(false);
  const [newEntity, setNewEntity] = useState({
    nombre: '',
    tipo: '',
    descripcion: '',
    contacto: '',
    sitio_web: '',
  });
  const [newUniversity, setNewUniversity] = useState(createUniversity());
  const timeoutRef = useRef(null);
  const navigate = useNavigate();

  const clearFlash = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
  };

  const showMessage = (text, kind = 'success') => {
    clearFlash();
    setMensaje(kind === 'success' ? text : '');
    setError(kind === 'error' ? text : '');
    timeoutRef.current = window.setTimeout(() => {
      setMensaje('');
      setError('');
    }, 3500);
  };

  const fetchCsrf = async () => {
    await axios.get(`${API_BASE}/api/csrf/`, { withCredentials: true });
    return getCookie('csrftoken');
  };

  const loadAdminData = async () => {
    setCargando(true);
    setError('');
    try {
      const userResponse = await axios.get(`${API_BASE}/api/user/`, { withCredentials: true });
      if (!userResponse.data?.is_admin) {
        localStorage.setItem('userRole', userResponse.data?.rol || 'estudiante');
        localStorage.setItem('isAdmin', 'false');
        navigate('/home', { replace: true });
        return;
      }

      localStorage.setItem('userRole', 'admin');
      localStorage.setItem('isAdmin', 'true');
      setUsername(userResponse.data.first_name || userResponse.data.email || 'Administrador');

      const summaryResponse = await axios.get(`${API_BASE}/api/admin/summary/`, {
        withCredentials: true,
      });

      setUsers(summaryResponse.data.users || []);
      setUniversities(summaryResponse.data.universities || []);
      setAreas(summaryResponse.data.areas || []);
      setCareersCatalog(summaryResponse.data.carreras_catalogo || []);
      setEntitiesCatalog(summaryResponse.data.entidades_catalogo || []);
    } catch (requestError) {
      if (requestError.response?.status === 403) {
        navigate('/home', { replace: true });
        return;
      }
      if (requestError.response?.status === 401) {
        navigate('/login', { replace: true });
        return;
      }
      setError(requestError.response?.data?.error || 'No fue posible cargar el panel admin');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuthenticated) {
      navigate('/', { replace: true });
      return;
    }
    loadAdminData();
    return () => clearFlash();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE}/api/logout/`, {}, { withCredentials: true });
    } catch (logoutError) {
      // Ignore backend logout errors and clear client state anyway.
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

  const saveUser = async (user) => {
    setGuardando(true);
    try {
      const csrfToken = await fetchCsrf();
      await axios.put(`${API_BASE}/api/admin/users/${user.id}/`, user, {
        withCredentials: true,
        headers: { 'X-CSRFToken': csrfToken },
      });
      await loadAdminData();
      showMessage('Usuario actualizado');
    } catch (requestError) {
      showMessage(requestError.response?.data?.error || 'No se pudo actualizar el usuario', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Eliminar el usuario ${user.email}?`)) return;
    setGuardando(true);
    try {
      const csrfToken = await fetchCsrf();
      await axios.delete(`${API_BASE}/api/admin/users/${user.id}/`, {
        withCredentials: true,
        headers: { 'X-CSRFToken': csrfToken },
      });
      await loadAdminData();
      showMessage('Usuario eliminado');
    } catch (requestError) {
      showMessage(requestError.response?.data?.error || 'No se pudo eliminar el usuario', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const saveCareer = async (career) => {
    setGuardando(true);
    try {
      const csrfToken = await fetchCsrf();
      if (career.id) {
        await axios.put(`${API_BASE}/api/admin/carreras/${career.id}/`, career, {
          withCredentials: true,
          headers: { 'X-CSRFToken': csrfToken },
        });
      } else {
        await axios.post(`${API_BASE}/api/admin/carreras/`, newCareer, {
          withCredentials: true,
          headers: { 'X-CSRFToken': csrfToken },
        });
        setNewCareer({ nombre: '', id_area: '', activa: true });
        setShowNewCareerForm(false);
      }
      await loadAdminData();
      showMessage('Carrera guardada');
      return true;
    } catch (requestError) {
      showMessage(requestError.response?.data?.error || 'No se pudo guardar la carrera', 'error');
      return false;
    } finally {
      setGuardando(false);
    }
  };

  const deleteCareer = async (careerId) => {
    if (!window.confirm('Eliminar esta carrera del catalogo y sus relaciones?')) return;
    setGuardando(true);
    try {
      const csrfToken = await fetchCsrf();
      await axios.delete(`${API_BASE}/api/admin/carreras/${careerId}/`, {
        withCredentials: true,
        headers: { 'X-CSRFToken': csrfToken },
      });
      await loadAdminData();
      showMessage('Carrera desactivada');
    } catch (requestError) {
      showMessage(requestError.response?.data?.error || 'No se pudo eliminar la carrera', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const saveEntity = async (entity) => {
    setGuardando(true);
    try {
      const csrfToken = await fetchCsrf();
      if (entity.id) {
        await axios.put(`${API_BASE}/api/admin/entidades-apoyo/${entity.id}/`, entity, {
          withCredentials: true,
          headers: { 'X-CSRFToken': csrfToken },
        });
      } else {
        await axios.post(`${API_BASE}/api/admin/entidades-apoyo/`, newEntity, {
          withCredentials: true,
          headers: { 'X-CSRFToken': csrfToken },
        });
        setNewEntity({ nombre: '', tipo: '', descripcion: '', contacto: '', sitio_web: '' });
      }
      await loadAdminData();
      showMessage('Entidad guardada');
    } catch (requestError) {
      showMessage(requestError.response?.data?.error || 'No se pudo guardar la entidad', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const deleteEntity = async (entityId) => {
    if (!window.confirm('Eliminar esta entidad de apoyo?')) return;
    setGuardando(true);
    try {
      const csrfToken = await fetchCsrf();
      await axios.delete(`${API_BASE}/api/admin/entidades-apoyo/${entityId}/`, {
        withCredentials: true,
        headers: { 'X-CSRFToken': csrfToken },
      });
      await loadAdminData();
      showMessage('Entidad eliminada');
    } catch (requestError) {
      showMessage(requestError.response?.data?.error || 'No se pudo eliminar la entidad', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const saveUniversity = async (university, resetForm = false) => {
    setGuardando(true);
    try {
      const csrfToken = await fetchCsrf();
      if (university.id) {
        await axios.put(`${API_BASE}/api/admin/universidades/${university.id}/`, university, {
          withCredentials: true,
          headers: { 'X-CSRFToken': csrfToken },
        });
      } else {
        await axios.post(`${API_BASE}/api/admin/universidades/`, university, {
          withCredentials: true,
          headers: { 'X-CSRFToken': csrfToken },
        });
        if (resetForm) {
          setNewUniversity(createUniversity());
        }
      }
      await loadAdminData();
      showMessage('Universidad guardada');
    } catch (requestError) {
      showMessage(requestError.response?.data?.error || 'No se pudo guardar la universidad', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const deleteUniversity = async (universityId) => {
    if (!window.confirm('Eliminar esta universidad y todas sus relaciones?')) return;
    setGuardando(true);
    try {
      const csrfToken = await fetchCsrf();
      await axios.delete(`${API_BASE}/api/admin/universidades/${universityId}/`, {
        withCredentials: true,
        headers: { 'X-CSRFToken': csrfToken },
      });
      await loadAdminData();
      showMessage('Universidad eliminada');
    } catch (requestError) {
      showMessage(requestError.response?.data?.error || 'No se pudo eliminar la universidad', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const updateUserField = (index, field, value) => {
    setUsers((prev) => prev.map((user, i) => (i === index ? { ...user, [field]: value } : user)));
  };

  const updateCatalogField = (setter, index, field, value) => {
    setter((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const getAreaName = (idArea) => {
    const area = areas.find((item) => String(item.id) === String(idArea));
    return area?.nom_area || 'Sin area';
  };

  const openCareerEditor = (career) => {
    setEditingCareer({ ...career });
  };

  const updateEditingCareer = (field, value) => {
    setEditingCareer((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const toggleFilterValue = (setter, value) => {
    setter((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  };

  const submitCareerEditor = async () => {
    if (!editingCareer) return;
    const saved = await saveCareer(editingCareer);
    if (saved) {
      setEditingCareer(null);
    }
  };

  const normalizedText = (value) =>
    String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

  const filteredCareers = careersCatalog.filter((career) => {
    const keyword = normalizedText(careerSearch);
    const areaName = getAreaName(career.id_area);
    const matchesKeyword =
      !keyword ||
      normalizedText(career.nombre).includes(keyword) ||
      normalizedText(areaName).includes(keyword) ||
      normalizedText(career.activa ? 'activa' : 'inactiva').includes(keyword);
    const matchesArea =
      careerAreaFilters.length === 0 || careerAreaFilters.includes(String(career.id_area));
    const matchesStatus =
      careerStatusFilters.length === 0 ||
      (careerStatusFilters.includes('activas') && Boolean(career.activa)) ||
      (careerStatusFilters.includes('inactivas') && !Boolean(career.activa));
    return matchesKeyword && matchesArea && matchesStatus;
  });
  const visibleCareers = filteredCareers.slice(0, careerLimit);

  const handleBulkCareerUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setGuardando(true);
    try {
      const csrfToken = await fetchCsrf();
      const formData = new FormData();
      formData.append('archivo', file);
      const response = await axios.post(`${API_BASE}/api/admin/carreras/cargar-base/`, formData, {
        withCredentials: true,
        headers: { 'X-CSRFToken': csrfToken },
      });
      await loadAdminData();
      const { created = 0, updated = 0, skipped = 0 } = response.data || {};
      showMessage(`Cargue finalizado: ${created} creadas, ${updated} actualizadas, ${skipped} omitidas`);
    } catch (requestError) {
      showMessage(requestError.response?.data?.error || 'No se pudo cargar la base de carreras', 'error');
    } finally {
      event.target.value = '';
      setGuardando(false);
    }
  };

  const updateUniversityField = (setter, field, value, index = null) => {
    if (index === null) {
      setter((prev) => ({ ...prev, [field]: value }));
      return;
    }
    setter((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const updateNestedUniversityField = (setter, collection, itemIndex, field, value, universityIndex = null) => {
    if (universityIndex === null) {
      setter((prev) => ({
        ...prev,
        [collection]: prev[collection].map((item, i) => (i === itemIndex ? { ...item, [field]: value } : item)),
      }));
      return;
    }

    setter((prev) =>
      prev.map((university, i) =>
        i === universityIndex
          ? {
              ...university,
              [collection]: university[collection].map((item, nestedIndex) =>
                nestedIndex === itemIndex ? { ...item, [field]: value } : item
              ),
            }
          : university
      )
    );
  };

  const addNestedUniversityItem = (setter, collection, templateFactory, universityIndex = null) => {
    if (universityIndex === null) {
      setter((prev) => ({ ...prev, [collection]: [...prev[collection], templateFactory()] }));
      return;
    }
    setter((prev) =>
      prev.map((university, i) =>
        i === universityIndex
          ? { ...university, [collection]: [...university[collection], templateFactory()] }
          : university
      )
    );
  };

  const removeNestedUniversityItem = (setter, collection, itemIndex, universityIndex = null) => {
    if (universityIndex === null) {
      setter((prev) => ({
        ...prev,
        [collection]: prev[collection].filter((_, i) => i !== itemIndex),
      }));
      return;
    }
    setter((prev) =>
      prev.map((university, i) =>
        i === universityIndex
          ? {
              ...university,
              [collection]: university[collection].filter((_, nestedIndex) => nestedIndex !== itemIndex),
            }
          : university
      )
    );
  };

  const renderFlash = () => (
    <>
      {mensaje && <div className="admin-alert success">{mensaje}</div>}
      {error && <div className="admin-alert error">{error}</div>}
    </>
  );

  const renderUserSection = () => (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2>Usuarios</h2>
        <p>Aqui puedes revisar todos los usuarios, cambiar su rol y eliminarlos.</p>
      </div>
      <div className="admin-table-card">
        <div className="admin-table-scroll">
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Numero</th>
                <th>Email</th>
                <th>Tipo documento</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user.id}>
                  <td>
                    <input
                      className="admin-input admin-table-input"
                      value={user.first_name || ''}
                      onChange={(e) => updateUserField(index, 'first_name', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="admin-input admin-table-input"
                      value={user.username || ''}
                      onChange={(e) => updateUserField(index, 'username', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="admin-input admin-table-input"
                      type="email"
                      value={user.email || ''}
                      onChange={(e) => updateUserField(index, 'email', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="admin-input admin-table-input"
                      value={user.tipo_documento || ''}
                      onChange={(e) => updateUserField(index, 'tipo_documento', e.target.value)}
                    />
                  </td>
                  <td>
                    <select
                      className="admin-input admin-table-input"
                      value={user.rol || 'estudiante'}
                      onChange={(e) => updateUserField(index, 'rol', e.target.value)}
                    >
                      <option value="estudiante">estudiante</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td>
                    <span className={`admin-badge ${user.rol === 'admin' ? 'admin' : ''}`}>
                      {user.rol || 'estudiante'}
                    </span>
                  </td>
                  <td>
                    <div className="admin-table-actions">
                      <button className="btn btn-primary" disabled={guardando} onClick={() => saveUser(user)}>
                        Guardar
                      </button>
                      <button className="btn btn-danger" disabled={guardando} onClick={() => deleteUser(user)}>
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td className="admin-empty-cell" colSpan="7">
                    No hay usuarios registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderCareersSection = () => (
    <section className="admin-section careers-module">
      <div className="admin-section-header">
        <h2>Carreras</h2>
        <p>Administra el catalogo global de carreras, consulta por palabras clave y filtra por area.</p>
      </div>

      <div className="careers-toolbar">
        <div className="careers-search-row">
          <label className="careers-search-box">
            <span>Buscar carrera</span>
            <input
              className="admin-input"
              value={careerSearch}
              onChange={(e) => setCareerSearch(e.target.value)}
              placeholder="Busca por nombre, area o estado"
            />
          </label>
          <div className="careers-filter-box">
            <span>Filtar</span>
            <details className="careers-filter-menu">
              <summary>
                {careerAreaFilters.length + careerStatusFilters.length > 0
                  ? `${careerAreaFilters.length + careerStatusFilters.length} seleccionados`
                  : 'Todas las carreras'}
              </summary>
              <div className="careers-filter-options">
                <strong>Estado</strong>
                <label>
                  <input
                    type="checkbox"
                    checked={careerStatusFilters.includes('activas')}
                    onChange={() => toggleFilterValue(setCareerStatusFilters, 'activas')}
                  />
                  Carreras activas
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={careerStatusFilters.includes('inactivas')}
                    onChange={() => toggleFilterValue(setCareerStatusFilters, 'inactivas')}
                  />
                  Carreras inactivas
                </label>
                <strong>Areas</strong>
                {areas.map((area) => (
                  <label key={area.id}>
                    <input
                      type="checkbox"
                      checked={careerAreaFilters.includes(String(area.id))}
                      onChange={() => toggleFilterValue(setCareerAreaFilters, String(area.id))}
                    />
                    {area.nom_area}
                  </label>
                ))}
              </div>
            </details>
          </div>
        </div>

        <div className="careers-action-row">
          <button className="btn btn-primary" type="button" onClick={() => setShowNewCareerForm((prev) => !prev)}>
            Agregar nueva carrera
          </button>
          <label className="btn btn-secondary careers-upload-btn">
            Cargar base
            <input type="file" accept=".csv,.xlsx" onChange={handleBulkCareerUpload} disabled={guardando} />
          </label>
          <label className="careers-limit-control">
            <span>Mostrar</span>
            <select
              className="admin-input"
              value={careerLimit}
              onChange={(e) => {
                setCareerLimit(Number(e.target.value));
                setExpandedCareerId(null);
              }}
            >
              <option value={10}>10 registros</option>
              <option value={50}>50 registros</option>
              <option value={100}>100 registros</option>
              <option value={250}>250 registros</option>
              <option value={500}>500 registros</option>
            </select>
            <span className="careers-limit-count">
              {Math.min(careerLimit, filteredCareers.length)} de {filteredCareers.length}
            </span>
          </label>
        </div>
      </div>

      {showNewCareerForm && (
        <article className="admin-card career-new-card">
          <h3>Nueva carrera</h3>
          <div className="admin-form-grid">
            <label>
              Nombre
              <input
                className="admin-input"
                value={newCareer.nombre}
                onChange={(e) => setNewCareer((prev) => ({ ...prev, nombre: e.target.value }))}
              />
            </label>
            <label>
              Area
              <select
                className="admin-input"
                value={newCareer.id_area}
                onChange={(e) => setNewCareer((prev) => ({ ...prev, id_area: e.target.value }))}
              >
                <option value="">Selecciona un area</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>{area.nom_area}</option>
                ))}
              </select>
            </label>
            <label className="career-switch-field">
              <span>Estado de carrera</span>
              <input
                className="career-switch-input"
                type="checkbox"
                checked={Boolean(newCareer.activa)}
                onChange={(e) => setNewCareer((prev) => ({ ...prev, activa: e.target.checked }))}
              />
              <span className="career-switch" aria-hidden="true">
                <span className="career-switch-thumb">
                  <img src={iconActivar} alt="" />
                </span>
              </span>
              <strong>{newCareer.activa ? 'Activa' : 'Inactiva'}</strong>
            </label>
          </div>
          <div className="admin-card-actions">
            <button className="btn btn-primary" disabled={guardando} onClick={() => saveCareer(newCareer)}>
              Guardar carrera
            </button>
          </div>
        </article>
      )}

      <div className="careers-table-card">
        <table className="careers-table">
          <thead>
            <tr>
              <th>Carrera</th>
              <th>Area</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visibleCareers.map((career) => {
              const isExpanded = expandedCareerId === career.id;
              return (
                <React.Fragment key={career.id}>
                  <tr>
                    <td className="career-name-cell">{career.nombre}</td>
                    <td>{getAreaName(career.id_area)}</td>
                    <td>
                      <span className={`admin-badge ${career.activa ? 'active' : ''}`}>
                        {career.activa ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td>
                      <div className="career-row-actions">
                        <button
                          className={`career-icon-btn career-dropdown-btn ${isExpanded ? 'open' : ''}`}
                          type="button"
                          onClick={() => setExpandedCareerId(isExpanded ? null : career.id)}
                          aria-expanded={isExpanded}
                          aria-label={`${isExpanded ? 'Cerrar' : 'Abrir'} detalle de ${career.nombre}`}
                          title="Ver detalle"
                        >
                          <img src={iconDesplegable} alt="" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="career-detail-row">
                      <td colSpan="4">
                        <div className="career-detail-panel">
                          <div className="career-detail-header">
                            <div className="career-detail-summary">
                              <strong>Informacion completa</strong>
                              <span>ID: {career.id}</span>
                              <span>Area: {getAreaName(career.id_area)}</span>
                              <span>Estado: {career.activa ? 'Activa' : 'Inactiva'}</span>
                            </div>
                            <button
                              className="career-icon-btn"
                              type="button"
                              onClick={() => openCareerEditor(career)}
                              aria-label={`Editar ${career.nombre}`}
                              title="Editar carrera"
                            >
                              <img src={iconEditar} alt="" />
                            </button>
                          </div>
                          <div className="career-readonly-grid">
                            <div className="career-readonly-field">
                              <span>Nombre</span>
                              <strong>{career.nombre || 'Sin nombre'}</strong>
                            </div>
                            <div className="career-readonly-field">
                              <span>Area</span>
                              <strong>{getAreaName(career.id_area)}</strong>
                            </div>
                            <div className="career-readonly-field">
                              <span>Estado de carrera</span>
                              <strong>{career.activa ? 'Activa' : 'Inactiva'}</strong>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {filteredCareers.length === 0 && (
              <tr>
                <td className="admin-empty-cell" colSpan="4">
                  No se encuentran resultados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingCareer && (
        <div className="admin-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="career-edit-title">
          <div className="admin-modal-content career-edit-modal">
            <div className="admin-modal-header">
              <div>
                <h3 id="career-edit-title">Editar carrera</h3>
                <p>Actualiza los campos permitidos del catalogo.</p>
              </div>
              <button
                className="admin-modal-close"
                type="button"
                onClick={() => setEditingCareer(null)}
                aria-label="Cerrar modal"
              >
                x
              </button>
            </div>

            <div className="admin-form-grid">
              <label>
                Nombre
                <input
                  className="admin-input"
                  value={editingCareer.nombre || ''}
                  onChange={(e) => updateEditingCareer('nombre', e.target.value)}
                />
              </label>
              <label>
                Area
                <select
                  className="admin-input"
                  value={editingCareer.id_area || ''}
                  onChange={(e) => updateEditingCareer('id_area', e.target.value)}
                >
                  <option value="">Selecciona un area</option>
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>{area.nom_area}</option>
                  ))}
                </select>
              </label>
              <label className="career-switch-field">
                <span>Estado de carrera</span>
                <input
                  className="career-switch-input"
                  type="checkbox"
                  checked={Boolean(editingCareer.activa)}
                  onChange={(e) => updateEditingCareer('activa', e.target.checked)}
                />
                <span className="career-switch" aria-hidden="true">
                  <span className="career-switch-thumb">
                    <img src={iconActivar} alt="" />
                  </span>
                </span>
                <strong>{editingCareer.activa ? 'Activa' : 'Inactiva'}</strong>
              </label>
            </div>

            <div className="admin-modal-actions">
              <button className="btn btn-primary btn-icon" type="button" disabled={guardando} onClick={submitCareerEditor}>
                <img src={iconGuardar} alt="" />
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );

  const renderSupportEntitiesSection = () => (
    <div className="admin-catalogs">
      <section className="admin-section">
        <div className="admin-section-header">
          <h2>Entidades de apoyo</h2>
          <p>Desde aqui puedes crear, editar o eliminar las entidades que participan en convenios.</p>
        </div>
        <div className="admin-grid compact">
          <article className="admin-card">
            <h3>Nueva entidad</h3>
            <div className="admin-form-grid">
              <label>
                Nombre
                <input
                  className="admin-input"
                  value={newEntity.nombre}
                  onChange={(e) => setNewEntity((prev) => ({ ...prev, nombre: e.target.value }))}
                />
              </label>
              <label>
                Tipo
                <input
                  className="admin-input"
                  value={newEntity.tipo}
                  onChange={(e) => setNewEntity((prev) => ({ ...prev, tipo: e.target.value }))}
                />
              </label>
              <label className="admin-field-wide">
                Descripcion
                <textarea
                  className="admin-input admin-textarea"
                  value={newEntity.descripcion}
                  onChange={(e) => setNewEntity((prev) => ({ ...prev, descripcion: e.target.value }))}
                />
              </label>
              <label>
                Contacto
                <input
                  className="admin-input"
                  value={newEntity.contacto}
                  onChange={(e) => setNewEntity((prev) => ({ ...prev, contacto: e.target.value }))}
                />
              </label>
              <label>
                Sitio web
                <input
                  className="admin-input"
                  value={newEntity.sitio_web}
                  onChange={(e) => setNewEntity((prev) => ({ ...prev, sitio_web: e.target.value }))}
                />
              </label>
            </div>
            <div className="admin-card-actions">
              <button className="btn btn-primary" disabled={guardando} onClick={() => saveEntity(newEntity)}>
                Agregar entidad
              </button>
            </div>
          </article>
          {entitiesCatalog.map((entity, index) => (
            <article key={entity.id} className="admin-card">
              <div className="admin-form-grid">
                <label>
                  Nombre
                  <input
                    className="admin-input"
                    value={entity.nombre || ''}
                    onChange={(e) => updateCatalogField(setEntitiesCatalog, index, 'nombre', e.target.value)}
                  />
                </label>
                <label>
                  Tipo
                  <input
                    className="admin-input"
                    value={entity.tipo || ''}
                    onChange={(e) => updateCatalogField(setEntitiesCatalog, index, 'tipo', e.target.value)}
                  />
                </label>
                <label className="admin-field-wide">
                  Descripcion
                  <textarea
                    className="admin-input admin-textarea"
                    value={entity.descripcion || ''}
                    onChange={(e) => updateCatalogField(setEntitiesCatalog, index, 'descripcion', e.target.value)}
                  />
                </label>
                <label>
                  Contacto
                  <input
                    className="admin-input"
                    value={entity.contacto || ''}
                    onChange={(e) => updateCatalogField(setEntitiesCatalog, index, 'contacto', e.target.value)}
                  />
                </label>
                <label>
                  Sitio web
                  <input
                    className="admin-input"
                    value={entity.sitio_web || ''}
                    onChange={(e) => updateCatalogField(setEntitiesCatalog, index, 'sitio_web', e.target.value)}
                  />
                </label>
              </div>
              <div className="admin-card-actions">
                <button className="btn btn-primary" disabled={guardando} onClick={() => saveEntity(entity)}>
                  Guardar
                </button>
                <button className="btn btn-danger" disabled={guardando} onClick={() => deleteEntity(entity.id)}>
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );

  const renderUniversityForm = (university, setTarget, index = null, isNew = false) => (
    <article className="admin-card admin-university-card">
      <div className="admin-card-header">
        <h3>{isNew ? 'Nueva universidad' : university.nombre}</h3>
        {!isNew && (
          <div className="admin-badge-row">
            <span className={`admin-badge ${university.tiene_convenios ? 'active' : ''}`}>Convenios</span>
            <span className={`admin-badge ${university.tiene_beneficios_carrera ? 'active' : ''}`}>Beneficios</span>
            <span className={`admin-badge ${university.tiene_entidades_apoyo ? 'active' : ''}`}>Entidades</span>
          </div>
        )}
      </div>

      <div className="admin-form-grid">
        <label>
          Nombre
          <input
            className="admin-input"
            value={university.nombre || ''}
            onChange={(e) => updateUniversityField(setTarget, 'nombre', e.target.value, index)}
          />
        </label>
        <label>
          Tipo
          <input
            className="admin-input"
            value={university.tipo || ''}
            onChange={(e) => updateUniversityField(setTarget, 'tipo', e.target.value, index)}
          />
        </label>
        <label>
          Localidad
          <input
            className="admin-input"
            value={university.localidad || ''}
            onChange={(e) => updateUniversityField(setTarget, 'localidad', e.target.value, index)}
          />
        </label>
        <label>
          Direccion
          <input
            className="admin-input"
            value={university.direccion || ''}
            onChange={(e) => updateUniversityField(setTarget, 'direccion', e.target.value, index)}
          />
        </label>
        <label className="admin-field-wide">
          Sitio web
          <input
            className="admin-input"
            value={university.sitio_web || ''}
            onChange={(e) => updateUniversityField(setTarget, 'sitio_web', e.target.value, index)}
          />
        </label>
      </div>

      <div className="admin-nested-section">
        <div className="admin-nested-header">
          <h4>Carreras vinculadas</h4>
          <button className="btn btn-secondary" type="button" onClick={() => addNestedUniversityItem(setTarget, 'carreras', createCareerLink, index)}>
            Agregar carrera
          </button>
        </div>
        {university.carreras.map((career, careerIndex) => (
          <div key={`${university.id || 'new'}-career-${careerIndex}`} className="admin-nested-card">
            <div className="admin-form-grid">
              <label>
                Carrera
                <select
                  className="admin-input"
                  value={career.id_carrera || ''}
                  onChange={(e) => updateNestedUniversityField(setTarget, 'carreras', careerIndex, 'id_carrera', e.target.value, index)}
                >
                  <option value="">Selecciona una carrera</option>
                  {careersCatalog.map((item) => (
                    <option key={item.id} value={item.id}>{item.nombre}</option>
                  ))}
                </select>
              </label>
              <label>
                Modalidad
                <input
                  className="admin-input"
                  value={career.modalidad || ''}
                  onChange={(e) => updateNestedUniversityField(setTarget, 'carreras', careerIndex, 'modalidad', e.target.value, index)}
                />
              </label>
              <label>
                Duracion semestres
                <input
                  className="admin-input"
                  value={career.duracion_semestres || ''}
                  onChange={(e) => updateNestedUniversityField(setTarget, 'carreras', careerIndex, 'duracion_semestres', e.target.value, index)}
                />
              </label>
              <label>
                Valor semestre
                <input
                  className="admin-input"
                  value={career.valor_semestre || ''}
                  onChange={(e) => updateNestedUniversityField(setTarget, 'carreras', careerIndex, 'valor_semestre', e.target.value, index)}
                />
              </label>
              <label>
                Jornada
                <input
                  className="admin-input"
                  value={career.jornada || ''}
                  onChange={(e) => updateNestedUniversityField(setTarget, 'carreras', careerIndex, 'jornada', e.target.value, index)}
                />
              </label>
              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  checked={Boolean(career.activa)}
                  onChange={(e) => updateNestedUniversityField(setTarget, 'carreras', careerIndex, 'activa', e.target.checked, index)}
                />
                Carrera activa
              </label>
            </div>
            <button className="btn btn-danger" type="button" onClick={() => removeNestedUniversityItem(setTarget, 'carreras', careerIndex, index)}>
              Eliminar carrera
            </button>
          </div>
        ))}
      </div>

      <div className="admin-nested-section">
        <div className="admin-nested-header">
          <h4>Beneficios por carrera</h4>
          <button className="btn btn-secondary" type="button" onClick={() => addNestedUniversityItem(setTarget, 'beneficios_carrera', createBenefit, index)}>
            Agregar beneficio
          </button>
        </div>
        {university.beneficios_carrera.map((benefit, benefitIndex) => (
          <div key={`${university.id || 'new'}-benefit-${benefitIndex}`} className="admin-nested-card">
            <div className="admin-form-grid">
              <label>
                Carrera
                <select
                  className="admin-input"
                  value={benefit.id_carrera || ''}
                  onChange={(e) => updateNestedUniversityField(setTarget, 'beneficios_carrera', benefitIndex, 'id_carrera', e.target.value, index)}
                >
                  <option value="">Selecciona una carrera</option>
                  {careersCatalog.map((item) => (
                    <option key={item.id} value={item.id}>{item.nombre}</option>
                  ))}
                </select>
              </label>
              <label>
                Tipo beneficio
                <input
                  className="admin-input"
                  value={benefit.tipo_beneficio || ''}
                  onChange={(e) => updateNestedUniversityField(setTarget, 'beneficios_carrera', benefitIndex, 'tipo_beneficio', e.target.value, index)}
                />
              </label>
              <label>
                Porcentaje descuento
                <input
                  className="admin-input"
                  value={benefit.porcentaje_descuento || ''}
                  onChange={(e) => updateNestedUniversityField(setTarget, 'beneficios_carrera', benefitIndex, 'porcentaje_descuento', e.target.value, index)}
                />
              </label>
              <label className="admin-field-wide">
                Descripcion
                <textarea
                  className="admin-input admin-textarea"
                  value={benefit.descripcion || ''}
                  onChange={(e) => updateNestedUniversityField(setTarget, 'beneficios_carrera', benefitIndex, 'descripcion', e.target.value, index)}
                />
              </label>
            </div>
            <button className="btn btn-danger" type="button" onClick={() => removeNestedUniversityItem(setTarget, 'beneficios_carrera', benefitIndex, index)}>
              Eliminar beneficio
            </button>
          </div>
        ))}
      </div>

      <div className="admin-nested-section">
        <div className="admin-nested-header">
          <h4>Convenios y entidades de apoyo</h4>
          <button className="btn btn-secondary" type="button" onClick={() => addNestedUniversityItem(setTarget, 'convenios', createAgreement, index)}>
            Agregar convenio
          </button>
        </div>
        {university.convenios.map((agreement, agreementIndex) => (
          <div key={`${university.id || 'new'}-agreement-${agreementIndex}`} className="admin-nested-card">
            <div className="admin-form-grid">
              <label>
                Carrera
                <select
                  className="admin-input"
                  value={agreement.id_carrera || ''}
                  onChange={(e) => updateNestedUniversityField(setTarget, 'convenios', agreementIndex, 'id_carrera', e.target.value, index)}
                >
                  <option value="">Selecciona una carrera</option>
                  {careersCatalog.map((item) => (
                    <option key={item.id} value={item.id}>{item.nombre}</option>
                  ))}
                </select>
              </label>
              <label>
                Entidad apoyo
                <select
                  className="admin-input"
                  value={agreement.id_entidad || ''}
                  onChange={(e) => updateNestedUniversityField(setTarget, 'convenios', agreementIndex, 'id_entidad', e.target.value, index)}
                >
                  <option value="">Selecciona una entidad</option>
                  {entitiesCatalog.map((entity) => (
                    <option key={entity.id} value={entity.id}>{entity.nombre}</option>
                  ))}
                </select>
              </label>
              <label>
                Nombre convenio
                <input
                  className="admin-input"
                  value={agreement.nombre_convenio || ''}
                  onChange={(e) => updateNestedUniversityField(setTarget, 'convenios', agreementIndex, 'nombre_convenio', e.target.value, index)}
                />
              </label>
              <label>
                Fecha inicio
                <input
                  type="date"
                  className="admin-input"
                  value={agreement.fecha_inicio || ''}
                  onChange={(e) => updateNestedUniversityField(setTarget, 'convenios', agreementIndex, 'fecha_inicio', e.target.value, index)}
                />
              </label>
              <label>
                Fecha fin
                <input
                  type="date"
                  className="admin-input"
                  value={agreement.fecha_fin || ''}
                  onChange={(e) => updateNestedUniversityField(setTarget, 'convenios', agreementIndex, 'fecha_fin', e.target.value, index)}
                />
              </label>
              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  checked={Boolean(agreement.vigente)}
                  onChange={(e) => updateNestedUniversityField(setTarget, 'convenios', agreementIndex, 'vigente', e.target.checked, index)}
                />
                Convenio vigente
              </label>
              <label className="admin-field-wide">
                Descripcion
                <textarea
                  className="admin-input admin-textarea"
                  value={agreement.descripcion || ''}
                  onChange={(e) => updateNestedUniversityField(setTarget, 'convenios', agreementIndex, 'descripcion', e.target.value, index)}
                />
              </label>
            </div>
            <button className="btn btn-danger" type="button" onClick={() => removeNestedUniversityItem(setTarget, 'convenios', agreementIndex, index)}>
              Eliminar convenio
            </button>
          </div>
        ))}
      </div>

      <div className="admin-card-actions">
        <button className="btn btn-primary" disabled={guardando} onClick={() => saveUniversity(university, isNew)}>
          {isNew ? 'Crear universidad' : 'Guardar cambios'}
        </button>
        {!isNew && (
          <button className="btn btn-danger" disabled={guardando} onClick={() => deleteUniversity(university.id)}>
            Eliminar universidad
          </button>
        )}
      </div>
    </article>
  );

  const renderUniversitiesSection = () => (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2>Universidades</h2>
        <p>
          Aqui puedes crear nuevas universidades, vincular carreras, beneficios, convenios y las entidades de apoyo que participan.
        </p>
      </div>

      {renderSupportEntitiesSection()}

      <div className="admin-grid">
        {renderUniversityForm(newUniversity, setNewUniversity, null, true)}
        {universities.map((university, index) => renderUniversityForm(university, setUniversities, index, false))}
      </div>
    </div>
  );

  const renderContent = () => {
    if (cargando) {
      return <div className="admin-loading">Cargando Dashboard_admin...</div>;
    }

    return (
      <>
        {renderFlash()}
        {vistaActual === 'usuarios' && renderUserSection()}
        {vistaActual === 'carreras' && renderCareersSection()}
        {vistaActual === 'universidades' && renderUniversitiesSection()}
      </>
    );
  };

  return (
    <div className={`dashboard admin-dashboard ${modoOscuro ? 'dark' : 'light'} ${menuAbierto ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
      <aside
        id="dashboard-sidebar-admin"
        className={`dashboard-sidebar ${menuAbierto ? 'open' : ''}`}
        aria-label="Navegacion de administrador"
      >
        <button
          className="sidebar-expand-toggle"
          onClick={() => setMenuAbierto((prev) => !prev)}
          aria-expanded={menuAbierto}
          aria-controls="dashboard-sidebar-admin"
          aria-label={menuAbierto ? 'Contraer menu lateral' : 'Expandir menu lateral'}
        >
          <span>{'>'}</span>
        </button>
        <button
          className="sidebar-brand"
          onClick={() => setVistaActual('usuarios')}
          aria-label="Ir al dashboard admin"
        >
          <img src={logoOrientarso} alt="Orientarso" />
          <span className="sidebar-label">Orientarso</span>
        </button>
        <div className="sidebar-user">
          <div className="user-avatar user-avatar-static">
            <img src={logoOrientarso} alt="Administrador" />
          </div>
          <div>
            <div className="user-name sidebar-label">{username}</div>
            <div className="admin-sidebar-label sidebar-label">Dashboard admin</div>
          </div>
        </div>
        <nav className="sidebar-nav" aria-label="Opciones admin">
          <button
            className={`sidebar-item ${vistaActual === 'usuarios' ? 'active' : ''}`}
            onClick={() => setVistaActual('usuarios')}
          >
            <img src={iconAccount} alt="" className="menu-icon-img" />
            <span className="sidebar-label">Usuarios</span>
          </button>
          <button
            className={`sidebar-item ${vistaActual === 'carreras' ? 'active' : ''}`}
            onClick={() => setVistaActual('carreras')}
          >
            <img src={iconHome} alt="" className="menu-icon-img" />
            <span className="sidebar-label">Carreras</span>
          </button>
          <button
            className={`sidebar-item ${vistaActual === 'universidades' ? 'active' : ''}`}
            onClick={() => setVistaActual('universidades')}
          >
            <img src={iconHome} alt="" className="menu-icon-img" />
            <span className="sidebar-label">Universidades</span>
          </button>
          <button className="sidebar-item" onClick={() => setModoOscuro((prev) => !prev)}>
            <img src={modoOscuro ? iconSun : iconMoon} alt="" className="menu-icon-img" />
            <span className="sidebar-label">{modoOscuro ? 'Modo claro' : 'Modo oscuro'}</span>
          </button>
        </nav>
        <button className="sidebar-item logout" onClick={handleLogout}>
          <span className="sidebar-symbol" aria-hidden="true">{'<'}</span>
          <span className="sidebar-label">Cerrar sesion</span>
        </button>
      </aside>

      <main className="main-content admin-main-content">
        {renderContent()}
      </main>
    </div>
  );
}

export default DashboardAdmin;
