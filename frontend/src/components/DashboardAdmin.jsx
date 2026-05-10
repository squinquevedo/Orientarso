import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';
import iconAccount from '../assets/person-circle.svg';
import iconMoon from '../assets/moon-fill.svg';
import iconSun from '../assets/brightness-high-fill.svg';
import iconEditar from '../assets/editar.svg';
import iconDesplegable from '../assets/desplegable.svg';
import iconFlecha from '../assets/flecha.svg';
import iconActivar from '../assets/activar y desabilitar.svg';
import iconGuardar from '../assets/guardar.svg';
import iconSalir from '../assets/salir.svg';
import iconCarreras from '../assets/carreras.svg';
import iconUniversidad from '../assets/universidad.svg';
import iconConvenios from '../assets/convenios.svg';
import { API_BASE } from '../config/api';
import ProfilePhotoModal from './ProfilePhotoModal';

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return '';
}

function refreshImageUrl(url) {
  if (!url) return '';
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${Date.now()}`;
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
  const [fotoModalAbierto, setFotoModalAbierto] = useState(false);
  const [fotoPerfil, setFotoPerfil] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userLimit, setUserLimit] = useState(10);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
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
  const [entitySearch, setEntitySearch] = useState('');
  const [entityTypeFilters, setEntityTypeFilters] = useState([]);
  const [entityLimit, setEntityLimit] = useState(10);
  const [expandedEntityId, setExpandedEntityId] = useState(null);
  const [editingEntity, setEditingEntity] = useState(null);
  const [showNewEntityForm, setShowNewEntityForm] = useState(false);
  const [universitySearch, setUniversitySearch] = useState('');
  const [universityTypeFilters, setUniversityTypeFilters] = useState([]);
  const [universityAgreementFilters, setUniversityAgreementFilters] = useState([]);
  const [universityLimit, setUniversityLimit] = useState(10);
  const [expandedUniversityId, setExpandedUniversityId] = useState(null);
  const [editingUniversity, setEditingUniversity] = useState(null);
  const [showNewUniversityForm, setShowNewUniversityForm] = useState(false);
  const [universityCareerSearch, setUniversityCareerSearch] = useState('');
  const [careerLinkModal, setCareerLinkModal] = useState(null);
  const [careerUploadPreview, setCareerUploadPreview] = useState(null);
  const [nestedRelationEditor, setNestedRelationEditor] = useState(null);
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

  const saveProfilePhoto = async (photoFile) => {
    const formData = new FormData();
    formData.append('foto', photoFile);
    const csrfToken = await fetchCsrf();

    const response = await axios.post(`${API_BASE}/api/user/foto-perfil/`, formData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'multipart/form-data',
        'X-CSRFToken': csrfToken,
      },
    });

    setFotoPerfil(refreshImageUrl(response?.data?.foto_perfil_url || ''));
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
      setFotoPerfil(userResponse.data.foto_perfil_url || '');

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

  const disableUser = async (user) => {
    if (!window.confirm(`Deshabilitar el usuario ${user.email || user.username}?`)) return;
    setGuardando(true);
    try {
      const csrfToken = await fetchCsrf();
      await axios.put(`${API_BASE}/api/admin/users/${user.id}/`, { ...user, is_active: false }, {
        withCredentials: true,
        headers: { 'X-CSRFToken': csrfToken },
      });
      await loadAdminData();
      showMessage('Usuario deshabilitado');
    } catch (requestError) {
      showMessage(requestError.response?.data?.error || 'No se pudo deshabilitar el usuario', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const submitUserEditor = async () => {
    if (!editingUser) return;
    await saveUser(editingUser);
    setEditingUser(null);
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
      if (!entity.id) {
        setShowNewEntityForm(false);
      }
      return true;
    } catch (requestError) {
      showMessage(requestError.response?.data?.error || 'No se pudo guardar la entidad', 'error');
      return false;
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
      if (resetForm) {
        setShowNewUniversityForm(false);
      }
      return true;
    } catch (requestError) {
      showMessage(requestError.response?.data?.error || 'No se pudo guardar la universidad', 'error');
      return false;
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

  const filteredUsers = users.filter((user) => {
    const keyword = normalizedText(userSearch);
    return (
      !keyword ||
      normalizedText(user.username).includes(keyword) ||
      normalizedText(user.first_name).includes(keyword) ||
      normalizedText(user.email).includes(keyword) ||
      normalizedText(user.tipo_documento).includes(keyword) ||
      normalizedText(user.rol).includes(keyword)
    );
  });
  const visibleUsers = filteredUsers.slice(0, userLimit);

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

  const convenioTypeOptions = ['financiera', 'publica', 'distrital'];
  const normalizeEntityType = (value) => normalizedText(value).replace(/\s+/g, ' ').trim();
  const filteredEntities = entitiesCatalog.filter((entity) => {
    const keyword = normalizedText(entitySearch);
    const entityType = normalizeEntityType(entity.tipo);
    const matchesKeyword =
      !keyword ||
      normalizedText(entity.nombre).includes(keyword) ||
      normalizedText(entity.tipo).includes(keyword) ||
      normalizedText(entity.descripcion).includes(keyword) ||
      normalizedText(entity.contacto).includes(keyword) ||
      normalizedText(entity.sitio_web).includes(keyword);
    const matchesType = entityTypeFilters.length === 0 || entityTypeFilters.includes(entityType);
    return matchesKeyword && matchesType;
  });
  const visibleEntities = filteredEntities.slice(0, entityLimit);

  const universityTypeOptions = [
    { value: 'publica', label: 'publica' },
    { value: 'privada', label: 'privada' },
  ];
  const universityAgreementOptions = [
    { value: 'con_convenio', label: 'quienes tienen convenio' },
    { value: 'sin_convenio', label: 'sin convenio' },
  ];
  const normalizeUniversityType = (value) => normalizedText(value).replace(/\s+/g, ' ').trim();
  const filteredUniversities = universities.filter((university) => {
    const keyword = normalizedText(universitySearch);
    const universityType = normalizeUniversityType(university.tipo);
    const hasAgreement = Boolean(university.tiene_convenios);
    const matchesKeyword =
      !keyword ||
      normalizedText(university.nombre).includes(keyword) ||
      normalizedText(university.tipo).includes(keyword) ||
      normalizedText(university.localidad).includes(keyword) ||
      normalizedText(university.direccion).includes(keyword) ||
      normalizedText(university.sitio_web).includes(keyword) ||
      normalizedText(hasAgreement ? 'con convenio' : 'sin convenio').includes(keyword);
    const matchesType =
      universityTypeFilters.length === 0 || universityTypeFilters.includes(universityType);
    const matchesAgreement =
      universityAgreementFilters.length === 0 ||
      (universityAgreementFilters.includes('con_convenio') && hasAgreement) ||
      (universityAgreementFilters.includes('sin_convenio') && !hasAgreement);
    return matchesKeyword && matchesType && matchesAgreement;
  });
  const visibleUniversities = filteredUniversities.slice(0, universityLimit);

  const openUniversityEditor = (university) => {
    setEditingUniversity({
      ...university,
      carreras: university.carreras || [],
      beneficios_carrera: university.beneficios_carrera || [],
      convenios: university.convenios || [],
      entidades_apoyo: university.entidades_apoyo || [],
    });
  };

  const openEntityEditor = (entity) => {
    setEditingEntity({ ...entity });
  };

  const updateEditingEntity = (field, value) => {
    setEditingEntity((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const submitEntityEditor = async () => {
    if (!editingEntity) return;
    const saved = await saveEntity(editingEntity);
    if (saved) {
      setEditingEntity(null);
    }
  };

  const handleBulkCareerUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setGuardando(true);
    try {
      const csrfToken = await fetchCsrf();
      const formData = new FormData();
      formData.append('archivo', file);
      const response = await axios.post(`${API_BASE}/api/admin/carreras/cargar-base/preview/`, formData, {
        withCredentials: true,
        headers: { 'X-CSRFToken': csrfToken },
      });
      const rows = response.data?.rows || [];
      const rejectedRows = response.data?.rejected_rows || [];
      setCareerUploadPreview({
        type: 'careerCatalog',
        title: 'carreras',
        fileName: file.name,
        rows,
        rejectedRows,
        columns: [
          { key: 'nombre', label: 'Carrera' },
          { key: 'area', label: 'Area' },
          { key: 'activa', label: 'Estado', render: (row) => (row.activa ? 'Activa' : 'Inactiva') },
          { key: 'accion', label: 'Accion' },
        ],
        rejectedColumns: [
          { key: 'nombre', label: 'Carrera' },
          { key: 'area', label: 'Area' },
          { key: 'estado', label: 'Estado' },
          { key: 'observacion', label: 'Observacion' },
        ],
        loaded: response.data?.loaded ?? rows.length,
        rejected: response.data?.rejected ?? rejectedRows.length,
      });
      showMessage(`Archivo revisado: ${rows.length} registros correctos, ${rejectedRows.length} rechazados`);
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
        [collection]: prev[collection].map((item, i) => (i === itemIndex ? (field === '__replace__' ? value : { ...item, [field]: value }) : item)),
      }));
      return;
    }

    setter((prev) =>
      prev.map((university, i) =>
        i === universityIndex
          ? {
              ...university,
              [collection]: university[collection].map((item, nestedIndex) =>
                nestedIndex === itemIndex ? (field === '__replace__' ? value : { ...item, [field]: value }) : item
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

  const updateUniversityCareerCollection = (setter, updater, universityIndex = null) => {
    if (universityIndex === null) {
      setter((prev) => ({ ...prev, carreras: updater(prev.carreras || []) }));
      return;
    }
    setter((prev) =>
      prev.map((university, i) =>
        i === universityIndex
          ? { ...university, carreras: updater(university.carreras || []) }
          : university
      )
    );
  };

  const setUniversitySelectedCareers = (setter, selectedIds, universityIndex = null) => {
    updateUniversityCareerCollection(
      setter,
      (currentCareers) => {
        const currentById = new Map(currentCareers.map((career) => [String(career.id_carrera), career]));
        return selectedIds.map((careerId) => currentById.get(String(careerId)) || { ...createCareerLink(), id_carrera: careerId });
      },
      universityIndex
    );
  };

  const openCareerLinkModal = (setter, universityIndex = null, currentCareers = []) => {
    const selectedIds = currentCareers.map((career) => String(career.id_carrera)).filter(Boolean);
    setCareerLinkModal({
      setter,
      universityIndex,
      mode: 'link',
      phase: 'select',
      search: '',
      selectedIds,
      rows: currentCareers.map((career) => ({ ...career })),
      errors: {},
    });
  };

  const openCareerLinkEditor = (setter, universityIndex, careerIndex, career) => {
    setCareerLinkModal({
      setter,
      universityIndex,
      careerIndex,
      mode: 'edit',
      phase: 'form',
      search: '',
      selectedIds: career.id_carrera ? [String(career.id_carrera)] : [],
      rows: [{ ...career }],
      errors: {},
    });
  };

  const updateCareerLinkModal = (updates) => {
    setCareerLinkModal((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  const toggleCareerLinkModalSelection = (careerId) => {
    setCareerLinkModal((prev) => {
      if (!prev) return prev;
      const value = String(careerId);
      const selectedIds = prev.selectedIds.includes(value)
        ? prev.selectedIds.filter((item) => item !== value)
        : [...prev.selectedIds, value];
      return { ...prev, selectedIds, errors: {} };
    });
  };

  const buildCareerLinkRows = (modalState) => {
    const currentById = new Map((modalState.rows || []).map((career) => [String(career.id_carrera), career]));
    return modalState.selectedIds.map((careerId) => currentById.get(String(careerId)) || { ...createCareerLink(), id_carrera: careerId });
  };

  const validateCareerLinkRows = (rows) => {
    const requiredFields = ['id_carrera', 'modalidad', 'duracion_semestres', 'valor_semestre', 'jornada'];
    return rows.reduce((acc, row, rowIndex) => {
      requiredFields.forEach((field) => {
        if (!String(row[field] ?? '').trim()) {
          acc[`${rowIndex}.${field}`] = true;
        }
      });
      return acc;
    }, {});
  };

  const updateCareerLinkModalRow = (rowIndex, field, value) => {
    setCareerLinkModal((prev) => {
      if (!prev) return prev;
      const rows = prev.rows.map((row, index) => (index === rowIndex ? { ...row, [field]: value } : row));
      const errors = { ...prev.errors };
      delete errors[`${rowIndex}.${field}`];
      return { ...prev, rows, errors };
    });
  };

  const removeCareerLinkModalRow = (rowIndex) => {
    setCareerLinkModal((prev) => {
      if (!prev) return prev;
      const removed = prev.rows[rowIndex];
      const rows = prev.rows.filter((_, index) => index !== rowIndex);
      const selectedIds = prev.selectedIds.filter((id) => String(id) !== String(removed?.id_carrera));
      return { ...prev, rows, selectedIds, errors: {} };
    });
  };

  const confirmCareerLinkModalRows = () => {
    if (!careerLinkModal) return;
    const errors = validateCareerLinkRows(careerLinkModal.rows || []);
    if (Object.keys(errors).length > 0) {
      updateCareerLinkModal({ errors });
      showMessage('Por favor llena todos los campos obligatorios de las carreras seleccionadas', 'error');
      return;
    }
    if (careerLinkModal.mode === 'edit') {
      const updatedCareer = careerLinkModal.rows[0];
      updateUniversityCareerCollection(
        careerLinkModal.setter,
        (currentCareers) =>
          currentCareers.map((career, index) =>
            index === careerLinkModal.careerIndex ? { ...career, ...updatedCareer } : career
          ),
        careerLinkModal.universityIndex
      );
      setCareerLinkModal(null);
      showMessage('Carrera vinculada actualizada');
      return;
    }
    setUniversitySelectedCareers(careerLinkModal.setter, careerLinkModal.rows.map((row) => row.id_carrera), careerLinkModal.universityIndex);
    mergeUniversityCareerRows(careerLinkModal.setter, careerLinkModal.rows, careerLinkModal.universityIndex);
    setCareerLinkModal(null);
    showMessage('Carreras vinculadas al formulario');
  };

  const mergeUniversityCareerRows = (setter, rows, universityIndex = null) => {
    updateUniversityCareerCollection(
      setter,
      (currentCareers) => {
        const currentById = new Map(currentCareers.map((career) => [String(career.id_carrera), career]));
        rows.forEach((row) => {
          const careerId = String(row.id_carrera || '');
          if (!careerId) return;
          currentById.set(careerId, {
            ...(currentById.get(careerId) || createCareerLink()),
            id_carrera: row.id_carrera,
            modalidad: row.modalidad || '',
            duracion_semestres: row.duracion_semestres || '',
            valor_semestre: row.valor_semestre || '',
            jornada: row.jornada || '',
            activa: Boolean(row.activa),
          });
        });
        return Array.from(currentById.values());
      },
      universityIndex
    );
  };

  const handleUniversityCareerUpload = async (event, setter, universityIndex = null) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setGuardando(true);
    try {
      const csrfToken = await fetchCsrf();
      const formData = new FormData();
      formData.append('archivo', file);
      const response = await axios.post(`${API_BASE}/api/admin/carreras/vinculacion/preview/`, formData, {
        withCredentials: true,
        headers: { 'X-CSRFToken': csrfToken },
      });
      const rows = response.data?.rows || [];
      const rejectedRows = response.data?.rejected_rows || [];
      setCareerUploadPreview({
        type: 'careers',
        title: 'carreras',
        fileName: file.name,
        rows,
        rejectedRows,
        columns: [
          { key: 'carrera', label: 'Carrera' },
          { key: 'modalidad', label: 'Modalidad' },
          { key: 'duracion_semestres', label: 'Duracion' },
          { key: 'valor_semestre', label: 'Valor' },
          { key: 'jornada', label: 'Jornada' },
          { key: 'activa', label: 'Estado', render: (row) => (row.activa ? 'Activa' : 'Inactiva') },
        ],
        rejectedColumns: [
          { key: 'carrera', label: 'Carrera' },
          { key: 'modalidad', label: 'Modalidad' },
          { key: 'duracion_semestres', label: 'Duracion' },
          { key: 'valor_semestre', label: 'Valor' },
          { key: 'jornada', label: 'Jornada' },
          { key: 'estado', label: 'Estado' },
          { key: 'observacion', label: 'Observacion' },
        ],
        loaded: response.data?.loaded ?? rows.length,
        rejected: response.data?.rejected ?? rejectedRows.length,
        setter,
        universityIndex,
      });
      showMessage(`Archivo revisado: ${rows.length} registros correctos, ${rejectedRows.length} rechazados`);
    } catch (requestError) {
      showMessage(requestError.response?.data?.error || 'No se pudo cargar la vinculacion de carreras', 'error');
    } finally {
      event.target.value = '';
      setGuardando(false);
    }
  };

  const downloadCareerLinkTemplate = () => {
    const headers = ['carrera', 'modalidad', 'duracion_semestres', 'valor_semestre', 'jornada', 'estado'];
    const exampleRows = [
      ['Actuacion', 'Presencial', '8', '4500000', 'Diurna', 'activa'],
      ['Ingenieria de Sistemas', 'Virtual', '10', '3900000', 'Nocturna', 'activa'],
    ];
    const csvRows = [headers, ...exampleRows].map((row) =>
      row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')
    );
    const blob = new Blob([csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plantilla_vinculacion_carreras.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadRejectedCareerLinkRows = () => {
    if (!careerUploadPreview?.rejectedRows?.length) return;
    const headers = (careerUploadPreview.rejectedColumns || [
      { key: 'carrera' },
      { key: 'modalidad' },
      { key: 'duracion_semestres' },
      { key: 'valor_semestre' },
      { key: 'jornada' },
      { key: 'estado' },
      { key: 'observacion' },
    ]).map((column) => column.key);
    const tableRows = careerUploadPreview.rejectedRows.map((row) =>
      headers.map((header) => String(row[header] ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'))
    );
    const htmlRows = [headers, ...tableRows]
      .map((row) => `<tr>${row.map((value) => `<td>${value}</td>`).join('')}</tr>`)
      .join('');
    const html = `<html><head><meta charset="utf-8" /></head><body><table>${htmlRows}</table></body></html>`;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${careerUploadPreview.title || 'registros'}_no_cargados.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const confirmUniversityCareerUpload = () => {
    if (!careerUploadPreview) return;
    if (careerUploadPreview.type === 'careerCatalog') {
      confirmCareerCatalogUpload();
      return;
    }
    if (careerUploadPreview.type === 'benefits') {
      mergeUniversityBenefitRows(careerUploadPreview.setter, careerUploadPreview.rows, careerUploadPreview.universityIndex);
    } else if (careerUploadPreview.type === 'agreements') {
      mergeUniversityAgreementRows(careerUploadPreview.setter, careerUploadPreview.rows, careerUploadPreview.universityIndex);
    } else {
      mergeUniversityCareerRows(
        careerUploadPreview.setter,
        careerUploadPreview.rows,
        careerUploadPreview.universityIndex
      );
    }
    showMessage(
      `Se cargaron ${careerUploadPreview.loaded} registros correctamente y se rechazaron ${careerUploadPreview.rejected}`
    );
    setCareerUploadPreview(null);
  };

  const confirmCareerCatalogUpload = async () => {
    if (!careerUploadPreview) return;
    setGuardando(true);
    try {
      const csrfToken = await fetchCsrf();
      const response = await axios.post(
        `${API_BASE}/api/admin/carreras/cargar-base/`,
        { rows: careerUploadPreview.rows },
        {
          withCredentials: true,
          headers: { 'X-CSRFToken': csrfToken },
        }
      );
      await loadAdminData();
      const { created = 0, updated = 0 } = response.data || {};
      showMessage(
        `Cargue finalizado: ${created} creadas, ${updated} actualizadas, ${careerUploadPreview.rejected} rechazadas`
      );
      setCareerUploadPreview(null);
    } catch (requestError) {
      showMessage(requestError.response?.data?.error || 'No se pudo confirmar la carga de carreras', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const downloadCsvTemplate = (headers, exampleRows, fileName) => {
    const csvRows = [headers, ...exampleRows].map((row) =>
      row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')
    );
    const blob = new Blob([csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadBenefitTemplate = () => {
    downloadCsvTemplate(
      ['carrera', 'tipo_beneficio', 'porcentaje_descuento', 'descripcion'],
      [
        ['Ingenieria de Sistemas', 'Matricula estrato', '50%', 'Descuento por convenio institucional'],
        ['Administracion de Mercadeo', 'Beca academica', '20%', 'Aplica segun promedio'],
      ],
      'plantilla_beneficios_carrera.csv'
    );
  };

  const downloadAgreementTemplate = () => {
    downloadCsvTemplate(
      ['carrera', 'entidad', 'nombre_convenio', 'fecha_inicio', 'fecha_fin', 'vigente', 'descripcion'],
      [
        ['Ingenieria de Sistemas', 'ICETEX', 'Convenio financiacion', '2026-01-01', '2026-12-31', 'vigente', 'Apoyo financiero para estudiantes'],
        ['Administracion de Mercadeo', 'Secretaria de Educacion', 'Convenio distrital', '2026-02-01', '', 'vigente', 'Beneficio sujeto a disponibilidad'],
      ],
      'plantilla_convenios.csv'
    );
  };

  const downloadCareerCatalogTemplate = () => {
    downloadCsvTemplate(
      ['nombre', 'area', 'estado'],
      [
        ['Ingenieria de Sistemas', 'Ingenieria', 'activa'],
        ['Administracion de Mercadeo', 'Administracion', 'activa'],
      ],
      'plantilla_carga_carreras.csv'
    );
  };

  const mergeUniversityBenefitRows = (setter, rows, universityIndex = null) => {
    const mergeRows = (currentBenefits) => [...(currentBenefits || []), ...rows.map((row) => ({
      id_carrera: row.id_carrera,
      tipo_beneficio: row.tipo_beneficio || '',
      porcentaje_descuento: row.porcentaje_descuento || '',
      descripcion: row.descripcion || '',
    }))];
    if (universityIndex === null) {
      setter((prev) => ({ ...prev, beneficios_carrera: mergeRows(prev.beneficios_carrera) }));
      return;
    }
    setter((prev) =>
      prev.map((university, i) =>
        i === universityIndex
          ? { ...university, beneficios_carrera: mergeRows(university.beneficios_carrera) }
          : university
      )
    );
  };

  const mergeUniversityAgreementRows = (setter, rows, universityIndex = null) => {
    const mergeRows = (currentAgreements) => [...(currentAgreements || []), ...rows.map((row) => ({
      id_carrera: row.id_carrera,
      id_entidad: row.id_entidad,
      nombre_convenio: row.nombre_convenio || '',
      fecha_inicio: row.fecha_inicio || '',
      fecha_fin: row.fecha_fin || '',
      vigente: Boolean(row.vigente),
      descripcion: row.descripcion || '',
    }))];
    if (universityIndex === null) {
      setter((prev) => ({ ...prev, convenios: mergeRows(prev.convenios) }));
      return;
    }
    setter((prev) =>
      prev.map((university, i) =>
        i === universityIndex
          ? { ...university, convenios: mergeRows(university.convenios) }
          : university
      )
    );
  };

  const handleRelationUpload = async (event, type, setter, universityIndex = null) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const config = {
      benefits: {
        endpoint: '/api/admin/beneficios-carrera/preview/',
        title: 'beneficios',
        columns: [
          { key: 'carrera', label: 'Carrera' },
          { key: 'tipo_beneficio', label: 'Tipo beneficio' },
          { key: 'porcentaje_descuento', label: 'Porcentaje' },
          { key: 'descripcion', label: 'Descripcion' },
        ],
        rejectedColumns: [
          { key: 'carrera', label: 'Carrera' },
          { key: 'tipo_beneficio', label: 'Tipo beneficio' },
          { key: 'porcentaje_descuento', label: 'Porcentaje' },
          { key: 'descripcion', label: 'Descripcion' },
          { key: 'observacion', label: 'Observacion' },
        ],
      },
      agreements: {
        endpoint: '/api/admin/convenios/preview/',
        title: 'convenios',
        columns: [
          { key: 'carrera', label: 'Carrera' },
          { key: 'entidad', label: 'Entidad' },
          { key: 'nombre_convenio', label: 'Convenio' },
          { key: 'fecha_inicio', label: 'Inicio' },
          { key: 'fecha_fin', label: 'Fin' },
          { key: 'vigente', label: 'Estado', render: (row) => (row.vigente ? 'Vigente' : 'No vigente') },
          { key: 'descripcion', label: 'Descripcion' },
        ],
        rejectedColumns: [
          { key: 'carrera', label: 'Carrera' },
          { key: 'entidad', label: 'Entidad' },
          { key: 'nombre_convenio', label: 'Convenio' },
          { key: 'fecha_inicio', label: 'Inicio' },
          { key: 'fecha_fin', label: 'Fin' },
          { key: 'vigente', label: 'Estado' },
          { key: 'descripcion', label: 'Descripcion' },
          { key: 'observacion', label: 'Observacion' },
        ],
      },
    }[type];

    setGuardando(true);
    try {
      const csrfToken = await fetchCsrf();
      const formData = new FormData();
      formData.append('archivo', file);
      const response = await axios.post(`${API_BASE}${config.endpoint}`, formData, {
        withCredentials: true,
        headers: { 'X-CSRFToken': csrfToken },
      });
      const rows = response.data?.rows || [];
      const rejectedRows = response.data?.rejected_rows || [];
      setCareerUploadPreview({
        type,
        title: config.title,
        fileName: file.name,
        rows,
        rejectedRows,
        columns: config.columns,
        rejectedColumns: config.rejectedColumns,
        loaded: response.data?.loaded ?? rows.length,
        rejected: response.data?.rejected ?? rejectedRows.length,
        setter,
        universityIndex,
      });
      showMessage(`Archivo revisado: ${rows.length} registros correctos, ${rejectedRows.length} rechazados`);
    } catch (requestError) {
      showMessage(requestError.response?.data?.error || 'No se pudo cargar el archivo', 'error');
    } finally {
      event.target.value = '';
      setGuardando(false);
    }
  };

  const openNestedRelationEditor = (type, setter, universityIndex, itemIndex, item) => {
    setNestedRelationEditor({ type, setter, universityIndex, itemIndex, item: { ...item } });
  };

  const updateNestedRelationEditor = (field, value) => {
    setNestedRelationEditor((prev) => (prev ? { ...prev, item: { ...prev.item, [field]: value } } : prev));
  };

  const saveNestedRelationEditor = () => {
    if (!nestedRelationEditor) return;
    const collection = nestedRelationEditor.type === 'benefit' ? 'beneficios_carrera' : 'convenios';
    updateNestedUniversityField(
      nestedRelationEditor.setter,
      collection,
      nestedRelationEditor.itemIndex,
      '__replace__',
      nestedRelationEditor.item,
      nestedRelationEditor.universityIndex
    );
    setNestedRelationEditor(null);
  };

  const renderFlash = () => (
    <>
      {mensaje && <div className="admin-alert success">{mensaje}</div>}
      {error && <div className="admin-alert error">{error}</div>}
    </>
  );

  const renderUserEditorModal = () => {
    if (!editingUser) return null;

    return (
      <div className="admin-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="user-edit-title">
        <div className="admin-modal-content career-edit-modal">
          <div className="admin-modal-header">
            <div>
              <h3 id="user-edit-title">Editar usuario</h3>
              <p>Actualiza los campos permitidos del usuario seleccionado.</p>
            </div>
            <button
              className="admin-modal-close"
              type="button"
              onClick={() => setEditingUser(null)}
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
                value={editingUser.first_name || ''}
                onChange={(e) => setEditingUser((prev) => ({ ...prev, first_name: e.target.value }))}
              />
            </label>
            <label>
              Cedula
              <input
                className="admin-input"
                value={editingUser.username || ''}
                onChange={(e) => setEditingUser((prev) => ({ ...prev, username: e.target.value }))}
              />
            </label>
            <label>
              Email
              <input
                className="admin-input"
                type="email"
                value={editingUser.email || ''}
                onChange={(e) => setEditingUser((prev) => ({ ...prev, email: e.target.value }))}
              />
            </label>
            <label>
              Tipo documento
              <input
                className="admin-input"
                value={editingUser.tipo_documento || ''}
                onChange={(e) => setEditingUser((prev) => ({ ...prev, tipo_documento: e.target.value }))}
              />
            </label>
            <label>
              Rol
              <select
                className="admin-input"
                value={editingUser.rol || 'estudiante'}
                onChange={(e) => setEditingUser((prev) => ({ ...prev, rol: e.target.value }))}
              >
                <option value="estudiante">estudiante</option>
                <option value="admin">admin</option>
              </select>
            </label>
            <label>
              Estado
              <select
                className="admin-input"
                value={editingUser.is_active ? 'activo' : 'inactivo'}
                onChange={(e) => setEditingUser((prev) => ({ ...prev, is_active: e.target.value === 'activo' }))}
              >
                <option value="activo">activo</option>
                <option value="inactivo">inactivo</option>
              </select>
            </label>
          </div>

          <div className="admin-modal-actions">
            <button className="btn btn-secondary" type="button" onClick={() => setEditingUser(null)}>
              Cancelar
            </button>
            <button className="btn btn-primary btn-icon" type="button" disabled={guardando} onClick={submitUserEditor}>
              <img src={iconGuardar} alt="" />
              Guardar cambios
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderUserSection = () => (
    <section className="admin-section careers-module users-module">
      <div className="admin-section-header">
        <h2>Usuarios</h2>
        <p>Aqui puedes revisar los usuarios, filtrarlos por cedula y consultar su informacion completa.</p>
      </div>

      <div className="careers-toolbar">
        <div className="careers-search-row users-search-row">
          <label className="careers-search-box">
            <span>Buscar por cedula</span>
            <input
              className="admin-input"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Escribe cedula, nombre, correo o rol"
            />
          </label>
          <label className="careers-limit-control users-limit-control">
            <span>Mostrar</span>
            <select
              className="admin-input"
              value={userLimit}
              onChange={(e) => setUserLimit(Number(e.target.value))}
            >
              <option value={10}>10 registros</option>
              <option value={50}>50 registros</option>
              <option value={100}>100 registros</option>
              <option value={250}>250 registros</option>
              <option value={500}>500 registros</option>
            </select>
            <span className="careers-limit-count">
              {Math.min(userLimit, filteredUsers.length)} de {filteredUsers.length}
            </span>
          </label>
        </div>
      </div>

      <div className="careers-table-card">
        <table className="careers-table users-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo documento</th>
              <th>Cedula</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visibleUsers.map((user) => {
              const isExpanded = expandedUserId === user.id;
              return (
                <React.Fragment key={user.id}>
                  <tr>
                    <td className="career-name-cell">{user.first_name || 'Sin nombre'}</td>
                    <td>{user.tipo_documento || 'Sin tipo'}</td>
                    <td>{user.username || 'Sin cedula'}</td>
                    <td>
                      <div className="career-row-actions">
                        <button
                          className={`career-icon-btn career-dropdown-btn ${isExpanded ? 'open' : ''}`}
                          type="button"
                          onClick={() => setExpandedUserId(isExpanded ? null : user.id)}
                          aria-expanded={isExpanded}
                          aria-label={`${isExpanded ? 'Cerrar' : 'Abrir'} detalle de ${user.first_name || user.username}`}
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
                              <span>ID: {user.id}</span>
                              <span>Nombre: {user.first_name || 'Sin nombre'}</span>
                              <span>Cedula: {user.username || 'Sin cedula'}</span>
                              <span>Tipo documento: {user.tipo_documento || 'Sin tipo'}</span>
                              <span>Email: {user.email || 'Sin email'}</span>
                              <span>Rol: {user.rol || 'estudiante'}</span>
                              <span>Estado: {user.is_active ? 'Activo' : 'Inactivo'}</span>
                            </div>
                            <div className="career-row-actions">
                              <button
                                className="career-icon-btn"
                                type="button"
                                onClick={() => setEditingUser({ ...user })}
                                aria-label={`Editar ${user.first_name || user.username}`}
                                title="Editar usuario"
                              >
                                <img src={iconEditar} alt="" />
                              </button>
                              <button
                                className="career-icon-btn danger"
                                type="button"
                                disabled={guardando || !user.is_active}
                                onClick={() => disableUser(user)}
                                aria-label={`Deshabilitar ${user.first_name || user.username}`}
                                title="Deshabilitar usuario"
                              >
                                <img src={iconActivar} alt="" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {visibleUsers.length === 0 && (
              <tr>
                <td className="admin-empty-cell" colSpan="4">
                  No hay usuarios para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
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
          <button className="btn btn-secondary" type="button" onClick={downloadCareerCatalogTemplate}>
            Descargar plantilla
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
            <button className="btn btn-primary btn-icon" disabled={guardando} onClick={() => saveCareer(newCareer)}>
              <img src={iconGuardar} alt="" />
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

  const renderConveniosSection = () => (
    <section className="admin-section careers-module convenios-module">
      <div className="admin-section-header">
        <h2>Convenios</h2>
        <p>Administra las entidades de apoyo que participan en los convenios de universidades.</p>
      </div>

      <div className="careers-toolbar">
        <div className="careers-search-row">
          <label className="careers-search-box">
            <span>Buscar convenio</span>
            <input
              className="admin-input"
              value={entitySearch}
              onChange={(e) => setEntitySearch(e.target.value)}
              placeholder="Busca por entidad, tipo, contacto o sitio web"
            />
          </label>
          <div className="careers-filter-box">
            <span>Filtrar</span>
            <details className="careers-filter-menu">
              <summary>
                {entityTypeFilters.length > 0
                  ? `${entityTypeFilters.length} seleccionados`
                  : 'Todos los convenios'}
              </summary>
              <div className="careers-filter-options">
                <strong>Tipo</strong>
                {convenioTypeOptions.map((type) => (
                  <label key={type}>
                    <input
                      type="checkbox"
                      checked={entityTypeFilters.includes(type)}
                      onChange={() => toggleFilterValue(setEntityTypeFilters, type)}
                    />
                    {type}
                  </label>
                ))}
              </div>
            </details>
          </div>
        </div>

        <div className="careers-action-row">
          <button className="btn btn-primary" type="button" onClick={() => setShowNewEntityForm((prev) => !prev)}>
            Agregar entidad
          </button>
          <label className="careers-limit-control">
            <span>Mostrar</span>
            <select
              className="admin-input"
              value={entityLimit}
              onChange={(e) => {
                setEntityLimit(Number(e.target.value));
                setExpandedEntityId(null);
              }}
            >
              <option value={10}>10 registros</option>
              <option value={50}>50 registros</option>
              <option value={100}>100 registros</option>
              <option value={250}>250 registros</option>
              <option value={500}>500 registros</option>
            </select>
            <span className="careers-limit-count">
              {Math.min(entityLimit, filteredEntities.length)} de {filteredEntities.length}
            </span>
          </label>
        </div>
      </div>

      {showNewEntityForm && (
        <article className="admin-card career-new-card">
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
              <select
                className="admin-input"
                value={newEntity.tipo}
                onChange={(e) => setNewEntity((prev) => ({ ...prev, tipo: e.target.value }))}
              >
                <option value="">Selecciona un tipo</option>
                {convenioTypeOptions.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
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
            <label className="admin-field-wide">
              Descripcion
              <textarea
                className="admin-input admin-textarea"
                value={newEntity.descripcion}
                onChange={(e) => setNewEntity((prev) => ({ ...prev, descripcion: e.target.value }))}
              />
            </label>
          </div>
          <div className="admin-card-actions">
            <button className="btn btn-primary" disabled={guardando} onClick={() => saveEntity(newEntity)}>
              Agregar entidad
            </button>
          </div>
        </article>
      )}

      <div className="careers-table-card">
        <table className="careers-table convenios-table">
          <thead>
            <tr>
              <th>Entidad</th>
              <th>Tipo</th>
              <th>Contacto</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visibleEntities.map((entity) => {
              const isExpanded = expandedEntityId === entity.id;
              return (
                <React.Fragment key={entity.id}>
                  <tr>
                    <td className="career-name-cell">{entity.nombre}</td>
                    <td>{entity.tipo || 'Sin tipo'}</td>
                    <td>{entity.contacto || 'Sin contacto'}</td>
                    <td>
                      <div className="career-row-actions">
                        <button
                          className={`career-icon-btn career-dropdown-btn ${isExpanded ? 'open' : ''}`}
                          type="button"
                          onClick={() => setExpandedEntityId(isExpanded ? null : entity.id)}
                          aria-expanded={isExpanded}
                          aria-label={`${isExpanded ? 'Cerrar' : 'Abrir'} detalle de ${entity.nombre}`}
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
                              <span>ID: {entity.id}</span>
                              <span>Tipo: {entity.tipo || 'Sin tipo'}</span>
                              <span>Contacto: {entity.contacto || 'Sin contacto'}</span>
                            </div>
                            <button
                              className="career-icon-btn"
                              type="button"
                              onClick={() => openEntityEditor(entity)}
                              aria-label={`Editar ${entity.nombre}`}
                              title="Editar entidad"
                            >
                              <img src={iconEditar} alt="" />
                            </button>
                          </div>
                          <div className="career-readonly-grid convenios-readonly-grid">
                            <div className="career-readonly-field">
                              <span>Entidad</span>
                              <strong>{entity.nombre || 'Sin nombre'}</strong>
                            </div>
                            <div className="career-readonly-field">
                              <span>Tipo</span>
                              <strong>{entity.tipo || 'Sin tipo'}</strong>
                            </div>
                            <div className="career-readonly-field">
                              <span>Contacto</span>
                              <strong>{entity.contacto || 'Sin contacto'}</strong>
                            </div>
                            <div className="career-readonly-field">
                              <span>Sitio web</span>
                              <strong>{entity.sitio_web || 'Sin sitio web'}</strong>
                            </div>
                            <div className="career-readonly-field admin-field-wide">
                              <span>Descripcion</span>
                              <strong>{entity.descripcion || 'Sin descripcion'}</strong>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {filteredEntities.length === 0 && (
              <tr>
                <td className="admin-empty-cell" colSpan="4">
                  No se encuentran resultados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingEntity && (
        <div className="admin-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="entity-edit-title">
          <div className="admin-modal-content career-edit-modal">
            <div className="admin-modal-header">
              <div>
                <h3 id="entity-edit-title">Editar entidad</h3>
                <p>Actualiza la informacion disponible para convenios.</p>
              </div>
              <button
                className="admin-modal-close"
                type="button"
                onClick={() => setEditingEntity(null)}
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
                  value={editingEntity.nombre || ''}
                  onChange={(e) => updateEditingEntity('nombre', e.target.value)}
                />
              </label>
              <label>
                Tipo
                <select
                  className="admin-input"
                  value={editingEntity.tipo || ''}
                  onChange={(e) => updateEditingEntity('tipo', e.target.value)}
                >
                  <option value="">Selecciona un tipo</option>
                  {convenioTypeOptions.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </label>
              <label>
                Contacto
                <input
                  className="admin-input"
                  value={editingEntity.contacto || ''}
                  onChange={(e) => updateEditingEntity('contacto', e.target.value)}
                />
              </label>
              <label>
                Sitio web
                <input
                  className="admin-input"
                  value={editingEntity.sitio_web || ''}
                  onChange={(e) => updateEditingEntity('sitio_web', e.target.value)}
                />
              </label>
              <label className="admin-field-wide">
                Descripcion
                <textarea
                  className="admin-input admin-textarea"
                  value={editingEntity.descripcion || ''}
                  onChange={(e) => updateEditingEntity('descripcion', e.target.value)}
                />
              </label>
            </div>

            <div className="admin-modal-actions">
              <button className="btn btn-primary btn-icon" type="button" disabled={guardando} onClick={submitEntityEditor}>
                <img src={iconGuardar} alt="" />
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );

  const renderUniversityForm = (university, setTarget, index = null, isNew = false, afterSave = null) => {
    const linkedCareers = university.carreras || [];

    return (
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
          <div className="admin-nested-actions">
            <button className="btn btn-primary" type="button" onClick={() => openCareerLinkModal(setTarget, index, linkedCareers)}>
              Vincular carreras
            </button>
            <button className="btn btn-secondary" type="button" onClick={downloadCareerLinkTemplate}>
              Descargar plantilla
            </button>
            <label className="btn btn-secondary careers-upload-btn">
              Cargar carreras
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={(event) => handleUniversityCareerUpload(event, setTarget, index)}
                disabled={guardando}
              />
            </label>
          </div>
        </div>
        {linkedCareers.length === 0 && (
          <div className="admin-empty-inline">No hay carreras vinculadas todavia.</div>
        )}
        {linkedCareers.length > 0 && (
          <div className="linked-careers-table-card">
            <table className="linked-careers-table">
              <thead>
                <tr>
                  <th>Carrera</th>
                  <th>Modalidad</th>
                  <th>Duracion</th>
                  <th>Valor semestre</th>
                  <th>Jornada</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {linkedCareers.map((career, careerIndex) => {
                  const careerName = careersCatalog.find((item) => String(item.id) === String(career.id_carrera))?.nombre || 'Carrera sin seleccionar';
                  return (
                    <tr key={`${university.id || 'new'}-career-${careerIndex}`}>
                      <td className="career-name-cell">{careerName}</td>
                      <td>{career.modalidad || '-'}</td>
                      <td>{career.duracion_semestres || '-'}{career.duracion_semestres ? ' semestres' : ''}</td>
                      <td>{career.valor_semestre || '-'}</td>
                      <td>{career.jornada || '-'}</td>
                      <td>
                        <span className={`linked-career-status ${career.activa ? 'active' : ''}`}>
                          {career.activa ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td>
                        <div className="career-row-actions">
                          <button
                            className="career-icon-btn"
                            type="button"
                            onClick={() => openCareerLinkEditor(setTarget, index, careerIndex, career)}
                            aria-label={`Editar ${careerName}`}
                            title="Editar carrera"
                          >
                            <img src={iconEditar} alt="" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="admin-nested-section">
        <div className="admin-nested-header">
          <h4>Beneficios por carrera</h4>
          <div className="admin-nested-actions">
            <button className="btn btn-primary" type="button" onClick={() => addNestedUniversityItem(setTarget, 'beneficios_carrera', createBenefit, index)}>
              Agregar beneficio
            </button>
            <button className="btn btn-secondary" type="button" onClick={downloadBenefitTemplate}>
              Descargar plantilla
            </button>
            <label className="btn btn-secondary careers-upload-btn">
              Cargar beneficios
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={(event) => handleRelationUpload(event, 'benefits', setTarget, index)}
                disabled={guardando}
              />
            </label>
          </div>
        </div>
        {university.beneficios_carrera.length === 0 && (
          <div className="admin-empty-inline">No hay beneficios vinculados todavia.</div>
        )}
        {university.beneficios_carrera.length > 0 && (
          <div className="linked-careers-table-card">
            <table className="linked-careers-table relation-table">
              <thead>
                <tr>
                  <th>Carrera</th>
                  <th>Tipo beneficio</th>
                  <th>Porcentaje</th>
                  <th>Descripcion</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {university.beneficios_carrera.map((benefit, benefitIndex) => {
                  const careerName = careersCatalog.find((item) => String(item.id) === String(benefit.id_carrera))?.nombre || 'Carrera sin seleccionar';
                  return (
                    <tr key={`${university.id || 'new'}-benefit-${benefitIndex}`}>
                      <td className="career-name-cell">{careerName}</td>
                      <td>{benefit.tipo_beneficio || '-'}</td>
                      <td>{benefit.porcentaje_descuento || '-'}</td>
                      <td>{benefit.descripcion || '-'}</td>
                      <td>
                        <div className="career-row-actions">
                          <button
                            className="career-icon-btn"
                            type="button"
                            onClick={() => openNestedRelationEditor('benefit', setTarget, index, benefitIndex, benefit)}
                            aria-label={`Editar beneficio de ${careerName}`}
                            title="Editar beneficio"
                          >
                            <img src={iconEditar} alt="" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="admin-nested-section">
        <div className="admin-nested-header">
          <h4>Convenios y entidades de apoyo</h4>
          <div className="admin-nested-actions">
            <button className="btn btn-primary" type="button" onClick={() => addNestedUniversityItem(setTarget, 'convenios', createAgreement, index)}>
              Agregar convenio
            </button>
            <button className="btn btn-secondary" type="button" onClick={downloadAgreementTemplate}>
              Descargar plantilla
            </button>
            <label className="btn btn-secondary careers-upload-btn">
              Cargar convenios
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={(event) => handleRelationUpload(event, 'agreements', setTarget, index)}
                disabled={guardando}
              />
            </label>
          </div>
        </div>
        {university.convenios.length === 0 && (
          <div className="admin-empty-inline">No hay convenios vinculados todavia.</div>
        )}
        {university.convenios.length > 0 && (
          <div className="linked-careers-table-card">
            <table className="linked-careers-table agreement-table">
              <thead>
                <tr>
                  <th>Carrera</th>
                  <th>Entidad</th>
                  <th>Convenio</th>
                  <th>Inicio</th>
                  <th>Fin</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {university.convenios.map((agreement, agreementIndex) => {
                  const careerName = careersCatalog.find((item) => String(item.id) === String(agreement.id_carrera))?.nombre || 'Carrera sin seleccionar';
                  const entityName = entitiesCatalog.find((entity) => String(entity.id) === String(agreement.id_entidad))?.nombre || agreement.nombre_entidad || 'Entidad sin seleccionar';
                  return (
                    <tr key={`${university.id || 'new'}-agreement-${agreementIndex}`}>
                      <td className="career-name-cell">{careerName}</td>
                      <td>{entityName}</td>
                      <td>{agreement.nombre_convenio || '-'}</td>
                      <td>{agreement.fecha_inicio || '-'}</td>
                      <td>{agreement.fecha_fin || '-'}</td>
                      <td>
                        <span className={`linked-career-status ${agreement.vigente ? 'active' : ''}`}>
                          {agreement.vigente ? 'Vigente' : 'No vigente'}
                        </span>
                      </td>
                      <td>
                        <div className="career-row-actions">
                          <button
                            className="career-icon-btn"
                            type="button"
                            onClick={() => openNestedRelationEditor('agreement', setTarget, index, agreementIndex, agreement)}
                            aria-label={`Editar convenio ${agreement.nombre_convenio || ''}`}
                            title="Editar convenio"
                          >
                            <img src={iconEditar} alt="" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="admin-card-actions">
        <button
        className="btn btn-primary btn-icon"
        disabled={guardando}
        onClick={async () => {
          const saved = await saveUniversity(university, isNew);
          if (saved && afterSave) {
            afterSave();
          }
        }}
      >
          <img src={iconGuardar} alt="" />
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
  };

  const renderUniversitiesSection = () => (
    <section className="admin-section careers-module universities-module">
      <div className="admin-section-header">
        <h2>Universidades</h2>
        <p>
          Aqui puedes crear nuevas universidades, vincular carreras, beneficios y convenios.
        </p>
      </div>

      <div className="careers-toolbar">
        <div className="careers-search-row">
          <label className="careers-search-box">
            <span>Buscar universidad</span>
            <input
              className="admin-input"
              value={universitySearch}
              onChange={(e) => setUniversitySearch(e.target.value)}
              placeholder="Busca por nombre, tipo, localidad o convenio"
            />
          </label>
          <div className="careers-filter-box">
            <span>Filtrar</span>
            <details className="careers-filter-menu">
              <summary>
                {universityTypeFilters.length + universityAgreementFilters.length > 0
                  ? `${universityTypeFilters.length + universityAgreementFilters.length} seleccionados`
                  : 'Todas las universidades'}
              </summary>
              <div className="careers-filter-options">
                <strong>Tipo de universidad</strong>
                {universityTypeOptions.map((type) => (
                  <label key={type.value}>
                    <input
                      type="checkbox"
                      checked={universityTypeFilters.includes(type.value)}
                      onChange={() => toggleFilterValue(setUniversityTypeFilters, type.value)}
                    />
                    {type.label}
                  </label>
                ))}
                <strong>Convenios</strong>
                {universityAgreementOptions.map((option) => (
                  <label key={option.value}>
                    <input
                      type="checkbox"
                      checked={universityAgreementFilters.includes(option.value)}
                      onChange={() => toggleFilterValue(setUniversityAgreementFilters, option.value)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </details>
          </div>
        </div>

        <div className="careers-action-row">
          <button className="btn btn-primary" type="button" onClick={() => setShowNewUniversityForm((prev) => !prev)}>
            Agregar universidad
          </button>
          <label className="careers-limit-control">
            <span>Mostrar</span>
            <select
              className="admin-input"
              value={universityLimit}
              onChange={(e) => {
                setUniversityLimit(Number(e.target.value));
                setExpandedUniversityId(null);
              }}
            >
              <option value={10}>10 registros</option>
              <option value={50}>50 registros</option>
              <option value={100}>100 registros</option>
              <option value={250}>250 registros</option>
              <option value={500}>500 registros</option>
            </select>
            <span className="careers-limit-count">
              {Math.min(universityLimit, filteredUniversities.length)} de {filteredUniversities.length}
            </span>
          </label>
        </div>
      </div>

      {showNewUniversityForm && renderUniversityForm(newUniversity, setNewUniversity, null, true)}

      <div className="careers-table-card">
        <table className="careers-table universities-table">
          <thead>
            <tr>
              <th>Universidad</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visibleUniversities.map((university) => {
              const isExpanded = expandedUniversityId === university.id;
              return (
                <React.Fragment key={university.id}>
                  <tr>
                    <td className="career-name-cell">{university.nombre}</td>
                    <td>
                      <div className="career-row-actions">
                        <button
                          className={`career-icon-btn career-dropdown-btn ${isExpanded ? 'open' : ''}`}
                          type="button"
                          onClick={() => setExpandedUniversityId(isExpanded ? null : university.id)}
                          aria-expanded={isExpanded}
                          aria-label={`${isExpanded ? 'Cerrar' : 'Abrir'} detalle de ${university.nombre}`}
                          title="Ver detalle"
                        >
                          <img src={iconDesplegable} alt="" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="career-detail-row">
                      <td colSpan="2">
                        <div className="career-detail-panel">
                          <div className="career-detail-header">
                            <div className="career-detail-summary">
                              <strong>Informacion completa</strong>
                              <span>ID: {university.id}</span>
                              <span>Tipo: {university.tipo || 'Sin tipo'}</span>
                              <span>{university.tiene_convenios ? 'Con convenio' : 'Sin convenio'}</span>
                            </div>
                            <button
                              className="career-icon-btn"
                              type="button"
                              onClick={() => openUniversityEditor(university)}
                              aria-label={`Editar ${university.nombre}`}
                              title="Editar universidad"
                            >
                              <img src={iconEditar} alt="" />
                            </button>
                          </div>
                          <div className="career-readonly-grid convenios-readonly-grid">
                            <div className="career-readonly-field">
                              <span>Nombre</span>
                              <strong>{university.nombre || 'Sin nombre'}</strong>
                            </div>
                            <div className="career-readonly-field">
                              <span>Tipo</span>
                              <strong>{university.tipo || 'Sin tipo'}</strong>
                            </div>
                            <div className="career-readonly-field">
                              <span>Localidad</span>
                              <strong>{university.localidad || 'Sin localidad'}</strong>
                            </div>
                            <div className="career-readonly-field">
                              <span>Direccion</span>
                              <strong>{university.direccion || 'Sin direccion'}</strong>
                            </div>
                            <div className="career-readonly-field">
                              <span>Carreras</span>
                              <strong>{university.carreras?.length || 0}</strong>
                            </div>
                            <div className="career-readonly-field">
                              <span>Convenios</span>
                              <strong>{university.convenios?.length || 0}</strong>
                            </div>
                            <div className="career-readonly-field admin-field-wide">
                              <span>Sitio web</span>
                              <strong>{university.sitio_web || 'Sin sitio web'}</strong>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {filteredUniversities.length === 0 && (
              <tr>
                <td className="admin-empty-cell" colSpan="2">
                  No se encuentran resultados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingUniversity && (
        <div className="admin-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="university-edit-title">
          <div className="admin-modal-content university-edit-modal">
            <div className="admin-modal-header">
              <div>
                <h3 id="university-edit-title">Editar universidad</h3>
                <p>Actualiza los datos, carreras, beneficios y convenios vinculados.</p>
              </div>
              <button
                className="admin-modal-close"
                type="button"
                onClick={() => setEditingUniversity(null)}
                aria-label="Cerrar modal"
              >
                x
              </button>
            </div>
            {renderUniversityForm(editingUniversity, setEditingUniversity, null, false, () => setEditingUniversity(null))}
          </div>
        </div>
      )}
    </section>
  );

  const renderCareerLinkModal = () => {
    if (!careerLinkModal) return null;
    const isEditingCareerLink = careerLinkModal.mode === 'edit';

    const modalKeyword = normalizedText(careerLinkModal.search);
    const modalCareerOptions = careersCatalog.filter((career) => {
      return (
        !modalKeyword ||
        normalizedText(career.nombre).includes(modalKeyword) ||
        normalizedText(getAreaName(career.id_area)).includes(modalKeyword)
      );
    });
    const selectedCareers = careerLinkModal.selectedIds
      .map((careerId) => careersCatalog.find((career) => String(career.id) === String(careerId)))
      .filter(Boolean);

    return (
      <div className="admin-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="career-link-title">
        <div className="admin-modal-content university-edit-modal career-link-modal">
          <div className="admin-modal-header">
            <div>
              <h3 id="career-link-title">{isEditingCareerLink ? 'Editar carrera vinculada' : 'Vincular carreras'}</h3>
              <p>
                {isEditingCareerLink
                  ? 'Actualiza la informacion especifica de esta carrera para la universidad.'
                  : 'Selecciona las carreras y completa la informacion especifica para esta universidad.'}
              </p>
            </div>
            <button
              className="admin-modal-close"
              type="button"
              onClick={() => setCareerLinkModal(null)}
              aria-label="Cerrar modal"
            >
              x
            </button>
          </div>

          {careerLinkModal.phase === 'select' && (
            <>
              <label className="careers-search-box">
                <span>Buscar por nombre o area</span>
                <input
                  className="admin-input"
                  value={careerLinkModal.search}
                  onChange={(e) => updateCareerLinkModal({ search: e.target.value })}
                  placeholder="Busca la carrera que quieres vincular"
                />
              </label>
              <div className="career-checkbox-list">
                {modalCareerOptions.map((career) => (
                  <label key={career.id} className="career-checkbox-option">
                    <input
                      type="checkbox"
                      checked={careerLinkModal.selectedIds.includes(String(career.id))}
                      onChange={() => toggleCareerLinkModalSelection(career.id)}
                    />
                    <span>
                      <strong>{career.nombre}</strong>
                      <small>{getAreaName(career.id_area)}</small>
                    </span>
                  </label>
                ))}
                {modalCareerOptions.length === 0 && (
                  <div className="admin-empty-inline">No hay carreras con ese criterio.</div>
                )}
              </div>
              <div className="admin-modal-actions">
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => {
                    if (careerLinkModal.selectedIds.length === 0) {
                      showMessage('Selecciona al menos una carrera para vincular', 'error');
                      return;
                    }
                    updateCareerLinkModal({ phase: 'preview' });
                  }}
                >
                  Vincular carreras
                </button>
              </div>
            </>
          )}

          {careerLinkModal.phase === 'preview' && (
            <>
              <div className="career-link-preview">
                <h4>Previsualizacion</h4>
                {selectedCareers.map((career) => (
                  <div key={career.id} className="career-link-preview-item">
                    {career.nombre}
                  </div>
                ))}
              </div>
              <div className="admin-modal-actions">
                <button className="btn btn-secondary" type="button" onClick={() => updateCareerLinkModal({ phase: 'select' })}>
                  Volver
                </button>
                <button className="btn btn-primary" type="button" onClick={() => updateCareerLinkModal({ phase: 'confirm' })}>
                  Siguiente
                </button>
              </div>
            </>
          )}

          {careerLinkModal.phase === 'confirm' && (
            <>
              <div className="career-link-confirm">
                <h4>¿Deseas vincular las carreras?</h4>
              </div>
              <div className="admin-modal-actions">
                <button className="btn btn-secondary" type="button" onClick={() => updateCareerLinkModal({ phase: 'select' })}>
                  No
                </button>
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => updateCareerLinkModal({ phase: 'form', rows: buildCareerLinkRows(careerLinkModal), errors: {} })}
                >
                  Si
                </button>
              </div>
            </>
          )}

          {careerLinkModal.phase === 'form' && (
            <>
              <div className="career-link-form-list">
                {careerLinkModal.rows.map((career, careerIndex) => (
                  <div key={`${career.id_carrera}-${careerIndex}`} className="admin-nested-card career-link-form-card">
                    <div className="admin-nested-card-title">
                      {careersCatalog.find((item) => String(item.id) === String(career.id_carrera))?.nombre || 'Carrera sin seleccionar'}
                    </div>
                    <div className="admin-form-grid">
                      <label>
                        Carrera
                        <select
                          className={`admin-input ${careerLinkModal.errors[`${careerIndex}.id_carrera`] ? 'admin-input-error' : ''}`}
                          value={career.id_carrera || ''}
                          onChange={(e) => updateCareerLinkModalRow(careerIndex, 'id_carrera', e.target.value)}
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
                          className={`admin-input ${careerLinkModal.errors[`${careerIndex}.modalidad`] ? 'admin-input-error' : ''}`}
                          value={career.modalidad || ''}
                          onChange={(e) => updateCareerLinkModalRow(careerIndex, 'modalidad', e.target.value)}
                        />
                      </label>
                      <label>
                        Duracion semestres
                        <input
                          className={`admin-input ${careerLinkModal.errors[`${careerIndex}.duracion_semestres`] ? 'admin-input-error' : ''}`}
                          value={career.duracion_semestres || ''}
                          onChange={(e) => updateCareerLinkModalRow(careerIndex, 'duracion_semestres', e.target.value)}
                        />
                      </label>
                      <label>
                        Valor semestre
                        <input
                          className={`admin-input ${careerLinkModal.errors[`${careerIndex}.valor_semestre`] ? 'admin-input-error' : ''}`}
                          value={career.valor_semestre || ''}
                          onChange={(e) => updateCareerLinkModalRow(careerIndex, 'valor_semestre', e.target.value)}
                        />
                      </label>
                      <label>
                        Jornada
                        <input
                          className={`admin-input ${careerLinkModal.errors[`${careerIndex}.jornada`] ? 'admin-input-error' : ''}`}
                          value={career.jornada || ''}
                          onChange={(e) => updateCareerLinkModalRow(careerIndex, 'jornada', e.target.value)}
                        />
                      </label>
                      <label className="admin-checkbox">
                        <input
                          type="checkbox"
                          checked={Boolean(career.activa)}
                          onChange={(e) => updateCareerLinkModalRow(careerIndex, 'activa', e.target.checked)}
                        />
                        Carrera activa
                      </label>
                    </div>
                    {!isEditingCareerLink && (
                      <button className="btn btn-danger" type="button" onClick={() => removeCareerLinkModalRow(careerIndex)}>
                        Eliminar carrera
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="admin-modal-actions">
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => (isEditingCareerLink ? setCareerLinkModal(null) : updateCareerLinkModal({ phase: 'select' }))}
                >
                  {isEditingCareerLink ? 'Cancelar' : 'Volver'}
                </button>
                <button className="btn btn-primary btn-icon" type="button" onClick={confirmCareerLinkModalRows}>
                  <img src={iconGuardar} alt="" />
                  Guardar cambios
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderNestedRelationEditor = () => {
    if (!nestedRelationEditor) return null;
    const isBenefit = nestedRelationEditor.type === 'benefit';
    const item = nestedRelationEditor.item;

    return (
      <div className="admin-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="relation-edit-title">
        <div className="admin-modal-content university-edit-modal career-link-modal">
          <div className="admin-modal-header">
            <div>
              <h3 id="relation-edit-title">{isBenefit ? 'Editar beneficio' : 'Editar convenio'}</h3>
              <p>{isBenefit ? 'Actualiza el beneficio vinculado a esta carrera.' : 'Actualiza la informacion del convenio seleccionado.'}</p>
            </div>
            <button
              className="admin-modal-close"
              type="button"
              onClick={() => setNestedRelationEditor(null)}
              aria-label="Cerrar modal"
            >
              x
            </button>
          </div>

          <div className="admin-nested-card career-link-form-card">
            <div className="admin-form-grid">
              <label>
                Carrera
                <select
                  className="admin-input"
                  value={item.id_carrera || ''}
                  onChange={(e) => updateNestedRelationEditor('id_carrera', e.target.value)}
                >
                  <option value="">Selecciona una carrera</option>
                  {careersCatalog.map((career) => (
                    <option key={career.id} value={career.id}>{career.nombre}</option>
                  ))}
                </select>
              </label>

              {isBenefit ? (
                <>
                  <label>
                    Tipo beneficio
                    <input
                      className="admin-input"
                      value={item.tipo_beneficio || ''}
                      onChange={(e) => updateNestedRelationEditor('tipo_beneficio', e.target.value)}
                    />
                  </label>
                  <label>
                    Porcentaje descuento
                    <input
                      className="admin-input"
                      value={item.porcentaje_descuento || ''}
                      onChange={(e) => updateNestedRelationEditor('porcentaje_descuento', e.target.value)}
                    />
                  </label>
                  <label className="admin-field-wide">
                    Descripcion
                    <textarea
                      className="admin-input admin-textarea"
                      value={item.descripcion || ''}
                      onChange={(e) => updateNestedRelationEditor('descripcion', e.target.value)}
                    />
                  </label>
                </>
              ) : (
                <>
                  <label>
                    Entidad apoyo
                    <select
                      className="admin-input"
                      value={item.id_entidad || ''}
                      onChange={(e) => updateNestedRelationEditor('id_entidad', e.target.value)}
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
                      value={item.nombre_convenio || ''}
                      onChange={(e) => updateNestedRelationEditor('nombre_convenio', e.target.value)}
                    />
                  </label>
                  <label>
                    Fecha inicio
                    <input
                      type="date"
                      className="admin-input"
                      value={item.fecha_inicio || ''}
                      onChange={(e) => updateNestedRelationEditor('fecha_inicio', e.target.value)}
                    />
                  </label>
                  <label>
                    Fecha fin
                    <input
                      type="date"
                      className="admin-input"
                      value={item.fecha_fin || ''}
                      onChange={(e) => updateNestedRelationEditor('fecha_fin', e.target.value)}
                    />
                  </label>
                  <label className="admin-checkbox">
                    <input
                      type="checkbox"
                      checked={Boolean(item.vigente)}
                      onChange={(e) => updateNestedRelationEditor('vigente', e.target.checked)}
                    />
                    Convenio vigente
                  </label>
                  <label className="admin-field-wide">
                    Descripcion
                    <textarea
                      className="admin-input admin-textarea"
                      value={item.descripcion || ''}
                      onChange={(e) => updateNestedRelationEditor('descripcion', e.target.value)}
                    />
                  </label>
                </>
              )}
            </div>
          </div>

          <div className="admin-modal-actions">
            <button className="btn btn-secondary" type="button" onClick={() => setNestedRelationEditor(null)}>
              Cancelar
            </button>
            <button className="btn btn-primary btn-icon" type="button" onClick={saveNestedRelationEditor}>
              <img src={iconGuardar} alt="" />
              Guardar cambios
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCareerUploadPreview = () => {
    if (!careerUploadPreview) return null;

    const acceptedRows = careerUploadPreview.rows || [];
    const rejectedRows = careerUploadPreview.rejectedRows || [];
    const acceptedColumns = careerUploadPreview.columns || [
      { key: 'carrera', label: 'Carrera' },
      { key: 'modalidad', label: 'Modalidad' },
      { key: 'duracion_semestres', label: 'Duracion' },
      { key: 'valor_semestre', label: 'Valor' },
      { key: 'jornada', label: 'Jornada' },
      { key: 'activa', label: 'Estado', render: (row) => (row.activa ? 'Activa' : 'Inactiva') },
    ];
    const rejectedColumns = careerUploadPreview.rejectedColumns || [
      { key: 'carrera', label: 'Carrera' },
      { key: 'modalidad', label: 'Modalidad' },
      { key: 'duracion_semestres', label: 'Duracion' },
      { key: 'valor_semestre', label: 'Valor' },
      { key: 'jornada', label: 'Jornada' },
      { key: 'estado', label: 'Estado' },
      { key: 'observacion', label: 'Observacion' },
    ];

    return (
      <div className="admin-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="career-upload-preview-title">
        <div className="admin-modal-content university-edit-modal career-upload-preview-modal">
          <div className="admin-modal-header">
            <div>
              <h3 id="career-upload-preview-title">Visualizacion de datos a cargar</h3>
              <p>{careerUploadPreview.title ? `${careerUploadPreview.title} - ` : ''}{careerUploadPreview.fileName}</p>
            </div>
            <button
              className="admin-modal-close"
              type="button"
              onClick={() => setCareerUploadPreview(null)}
              aria-label="Cerrar modal"
            >
              x
            </button>
          </div>

          <div className="career-upload-summary">
            <div className="career-upload-summary-item success">
              <span>Correctos</span>
              <strong>{careerUploadPreview.loaded}</strong>
            </div>
            <div className="career-upload-summary-item error">
              <span>Rechazados</span>
              <strong>{careerUploadPreview.rejected}</strong>
            </div>
          </div>

          <div className="career-upload-preview-section">
            <h4>Registros correctos</h4>
            <div className="career-upload-table-scroll">
              <table className="career-upload-table">
                <thead>
                  <tr>
                    {acceptedColumns.map((column) => (
                      <th key={column.key}>{column.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {acceptedRows.map((row, rowIndex) => (
                    <tr key={`accepted-${rowIndex}`}>
                      {acceptedColumns.map((column) => (
                        <td key={column.key}>{column.render ? column.render(row) : (row[column.key] || '-')}</td>
                      ))}
                    </tr>
                  ))}
                  {acceptedRows.length === 0 && (
                    <tr>
                      <td colSpan={acceptedColumns.length}>No hay registros correctos para cargar.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="career-upload-preview-section">
            <div className="career-upload-section-header">
              <h4>Registros rechazados</h4>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={downloadRejectedCareerLinkRows}
                disabled={rejectedRows.length === 0}
              >
                Descargar no cargados
              </button>
            </div>
            <div className="career-upload-table-scroll">
              <table className="career-upload-table rejected">
                <thead>
                  <tr>
                    {rejectedColumns.map((column) => (
                      <th key={column.key}>{column.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rejectedRows.map((row, rowIndex) => (
                    <tr key={`rejected-${rowIndex}`}>
                      {rejectedColumns.map((column) => (
                        <td key={column.key}>{row[column.key] || '-'}</td>
                      ))}
                    </tr>
                  ))}
                  {rejectedRows.length === 0 && (
                    <tr>
                      <td colSpan={rejectedColumns.length}>No hay registros rechazados.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="admin-modal-actions">
            <button className="btn btn-secondary" type="button" onClick={() => setCareerUploadPreview(null)}>
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              type="button"
              onClick={confirmUniversityCareerUpload}
              disabled={acceptedRows.length === 0}
            >
              Cargar registros correctos
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (cargando) {
      return <div className="admin-loading">Cargando Dashboard_admin...</div>;
    }

    return (
      <>
        {renderFlash()}
        {vistaActual === 'usuarios' && renderUserSection()}
        {vistaActual === 'carreras' && renderCareersSection()}
        {vistaActual === 'convenios' && renderConveniosSection()}
        {vistaActual === 'universidades' && renderUniversitiesSection()}
        {renderCareerLinkModal()}
        {renderUserEditorModal()}
        {renderNestedRelationEditor()}
        {renderCareerUploadPreview()}
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
          <img src={iconFlecha} alt="" className="sidebar-arrow-icon" />
        </button>
        <button
          className="sidebar-user"
          type="button"
          onClick={() => setFotoModalAbierto(true)}
          aria-label="Cambiar foto de perfil"
        >
          <div className="user-avatar user-avatar-static">
            {fotoPerfil ? (
              <img src={fotoPerfil} alt="Foto de perfil" />
            ) : (
              <img src={iconAccount} alt="" className="user-avatar-placeholder" />
            )}
          </div>
          <div>
            <div className="user-name sidebar-label">{username}</div>
            <div className="admin-sidebar-label sidebar-label">Dashboard admin</div>
          </div>
        </button>
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
            <img src={iconCarreras} alt="" className="menu-icon-img" />
            <span className="sidebar-label">Carreras</span>
          </button>
          <button
            className={`sidebar-item ${vistaActual === 'universidades' ? 'active' : ''}`}
            onClick={() => setVistaActual('universidades')}
          >
            <img src={iconUniversidad} alt="" className="menu-icon-img" />
            <span className="sidebar-label">Universidades</span>
          </button>
          <button
            className={`sidebar-item ${vistaActual === 'convenios' ? 'active' : ''}`}
            onClick={() => setVistaActual('convenios')}
          >
            <img src={iconConvenios} alt="" className="menu-icon-img" />
            <span className="sidebar-label">Convenios</span>
          </button>
          <button className="sidebar-item" onClick={() => setModoOscuro((prev) => !prev)}>
            <img src={modoOscuro ? iconSun : iconMoon} alt="" className="menu-icon-img" />
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

      <main className="main-content admin-main-content">
        {renderContent()}
      </main>
    </div>
  );
}

export default DashboardAdmin;
