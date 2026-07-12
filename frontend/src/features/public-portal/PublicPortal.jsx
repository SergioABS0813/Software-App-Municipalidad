import { useEffect, useMemo, useRef, useState } from 'react';
import municipalLogo from '../../assets/images/municipalidad-logo.png';
import AdminDashboard from '../dashboard/AdminDashboard';
import DirectivoDashboard from '../dashboard/DirectivoDashboard';
import OperativoDashboard from '../dashboard/OperativoDashboard';
import keycloak, {
  getKeycloakUser,
  initKeycloak,
  loginWithKeycloak,
  logoutFromKeycloak,
  registerWithKeycloak,
} from '../auth/keycloak';
import PublicEventDetail from './PublicEventDetail';
import './PublicPortal.css';
import { getApiErrorMessage, SESSION_EXPIRED_MESSAGE } from '../../services/api/api';
import {
  obtenerCategoriasPublicas,
  obtenerEventosPublicados,
  obtenerProximoEventoPublicado,
  inscribirEventoPublicado,
  obtenerInscripcionActualEvento,
  cancelarInscripcionEvento,
  obtenerQrActivoInscripcion,
  confirmarSesionActual,
  recuperarContrasena,
  obtenerPerfilVecino,
  actualizarPerfilVecino,
  subirComprobantePago,
  consultarIdentidadRegistroVecino,
  registrarVecinoPublico,
} from '../../services/publicPortalService';
import LoadingButton from '../../components/feedback/LoadingButton';

const emptyPaymentForm = {
  medioPago: '',
  numeroOperacion: '',
  fechaPago: '',
  archivo: null,
};

function getTodayInputDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

const institutionalUsers = [
  {
    email: 'admin@munisanmiguel.gob.pe',
    fullName: 'Sergio Bustamante',
    password: 'admin123',
    role: 'ADMINISTRADOR',
  },
  {
    email: 'directivo@munisanmiguel.gob.pe',
    fullName: 'Mariana Fuentes',
    password: 'directivo123',
    role: 'DIRECTIVO',
  },
  {
    email: 'operativo@munisanmiguel.gob.pe',
    fullName: 'Carlos Ramirez',
    password: 'operativo123',
    role: 'OPERATIVO',
  },
  {
    apellidos: 'Bustamante Villanueva',
    acceptsDataUse: true,
    celular: '987654321',
    correo: 'vecino@gmail.com',
    dni: '12345678',
    email: 'vecino@gmail.com',
    fechaNacimiento: '1998-04-16',
    fullName: 'Sergio André Bustamante Villanueva',
    nombreCompleto: 'Sergio André Bustamante Villanueva',
    nombres: 'Sergio André',
    password: 'vecino123',
    role: 'VECINO',
  },
];

const emptyRegistration = {
  fullName: '',
  documentNumber: '',
  email: '',
  phone: '',
  acceptsTerms: false,
};

const emptyCitizenRegister = {
  dni: '',
  fechaNacimiento: '',
  correo: '',
  celular: '',
  password: '',
  confirmPassword: '',
  acceptsDataUse: false,
};

const eventsListPath = '/eventos';
const citizenAuthStorageKey = 'citizenAuthUser';
const citizenAuthTokenKey = 'token';
const allCategoriesLabel = 'Todos';
const portalAccentOptions = ['coral', 'teal', 'indigo', 'lime', 'gold'];
const publicEventsPageSize = 6;

function getResourceUrl(resource) {
  return resource?.signedUrl ?? resource?.url_recurso ?? resource?.url ?? '';
}

function getEventCoverResource(event) {
  const resources = Array.isArray(event.recursos)
    ? event.recursos
    : Array.isArray(event.resources)
      ? event.resources
      : [];

  return resources.find((resource) => {
    const resourceType = resource.tipo_recurso?.toUpperCase();
    return resourceType === 'PORTADA' || resourceType === 'IMAGEN_PORTADA';
  });
}

function getEventCoverUrl(event) {
  const coverResource = getEventCoverResource(event);

  return getResourceUrl(coverResource) || event.imageUrl || '';
}

function getEventShortDescription(event) {
  return event.descripcion_breve || event.descripcion || event.summary || event.description || '';
}

function parsePublicLocalDateTime(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const text = String(value).trim();
  const localDateTimeMatch = text.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/,
  );

  if (localDateTimeMatch) {
    const [, year, month, day, hour, minute, second = '0'] = localDateTimeMatch;
    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    );

    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(text);

  return Number.isNaN(date.getTime()) ? null : date;
}
function formatPublicEventDate(value) {
  const date = parsePublicLocalDateTime(value);

  if (!date || Number.isNaN(date.getTime())) {
    return 'Fecha por confirmar';
  }

  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    weekday: 'short',
  }).format(date);
}

function formatPublicEventTime(value) {
  const date = parsePublicLocalDateTime(value);

  if (!date || Number.isNaN(date.getTime())) {
    return 'Hora por confirmar';
  }

  return new Intl.DateTimeFormat('es-PE', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function formatPublicEventDuration(startValue, endValue) {
  const start = parsePublicLocalDateTime(startValue);
  const end = parsePublicLocalDateTime(endValue);

  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return 'Duracion por confirmar';
  }

  const totalMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return [hours > 0 ? `${hours} ${hours === 1 ? 'hora' : 'horas'}` : '', minutes > 0 ? `${minutes} min` : '']
    .filter(Boolean)
    .join(' ');
}

function normalizePublicEventsPage(response) {
  if (Array.isArray(response)) {
    return {
      content: response,
      number: 0,
      totalElements: response.length,
      totalPages: response.length > 0 ? 1 : 0,
    };
  }

  return {
    content: Array.isArray(response?.content) ? response.content : [],
    number: response?.number ?? 0,
    totalElements: response?.totalElements ?? 0,
    totalPages: response?.totalPages ?? 0,
  };
}

function mapPublicEventFromApi(event, index = 0) {
  const aforoMaximo = event.aforoMaximo ?? null;
  const cuposDisponibles = event.cuposDisponibles ?? aforoMaximo;
  const venue = event.ubicacionNombre ?? 'Ubicacion por confirmar';
  const address = [event.ubicacionDireccion, event.ubicacionReferencia].filter(Boolean).join(' - ');
  const requiresControl = event.requiereControlAsistencia ?? event.requiresAttendanceControl ?? true;
  const requiresPayment = Boolean(event.requierePago ?? event.requiresPayment);
  const requiresRegistration =
    event.requiereInscripcion ?? event.requiresRegistration ?? (requiresControl || requiresPayment);
  const resources = Array.isArray(event.recursos)
    ? event.recursos.map((resource) => ({
        fecha_subida: resource.fechaSubida,
        mime_type: resource.mimeType,
        mimeType: resource.mimeType,
        nombre_archivo: resource.nombreOriginal,
        nombreOriginal: resource.nombreOriginal,
        objectPath: resource.objectPath,
        recurso_id: resource.id,
        signedUrl: resource.signedUrl,
        sizeBytes: resource.sizeBytes,
        tipo_recurso: resource.tipoRecurso,
        url_recurso: resource.signedUrl,
      }))
    : [];
  const coverResource = resources.find((resource) => {
    const resourceType = resource.tipo_recurso?.toUpperCase();
    return resourceType === 'PORTADA' || resourceType === 'IMAGEN_PORTADA';
  });

  return {
    id: event.id,
    title: event.titulo ?? 'Evento municipal',
    state: event.estadoCodigo ?? event.state ?? 'PUBLICADO',
    category: event.categoriaNombre ?? 'Sin categoria',
    categoryId: event.categoriaId,
    date: formatPublicEventDate(event.fechaHoraInicio),
    time: formatPublicEventTime(event.fechaHoraInicio),
    eventStartAt: event.fechaHoraInicio,
    eventEndAt: event.fechaHoraFin,
    venue,
    district: 'San Miguel',
    aforoMaximo,
    spots: cuposDisponibles ?? 0,
    capacityLabel: cuposDisponibles !== null && cuposDisponibles !== undefined ? `${cuposDisponibles} cupos disponibles` : 'Aforo por confirmar',
    status: requiresRegistration ? (aforoMaximo ? 'Inscripcion abierta' : 'Entrada disponible') : 'Ingreso libre',
    descripcion_breve: event.descripcionBreve ?? '',
    summary: event.descripcionBreve ?? event.descripcion ?? '',
    accent: portalAccentOptions[index % portalAccentOptions.length],
    imageUrl: coverResource?.signedUrl ?? coverResource?.url_recurso ?? '',
    duration: formatPublicEventDuration(event.fechaHoraInicio, event.fechaHoraFin),
    organizer: event.areaMunicipalNombre ?? 'Municipalidad de San Miguel',
    address,
    audience: event.edadMin !== null && event.edadMax !== null && event.edadMin !== undefined && event.edadMax !== undefined
      ? `${event.edadMin}-${event.edadMax} anos`
      : 'Publico general',
    publico_tipo: event.edadMin !== null && event.edadMax !== null && event.edadMin !== undefined && event.edadMax !== undefined
      ? 'OBJETIVO'
      : 'GENERAL',
    edad_minima: event.edadMin,
    edad_maxima: event.edadMax,
    description: event.descripcion ?? '',
    requirements: event.requisitos ?? [],
    agenda: event.agenda ?? [],
    accessibility: event.ubicacionReferencia ?? '',
    recursos: resources,
    latitude: event.latitud,
    longitude: event.longitud,
    requiresRegistration,
    requiresAttendanceControl: requiresControl,
    requiresPayment,
    paymentCost: event.costoVecinal ?? event.costo ?? event.costoReferencial ?? null,
    paymentInstructions: event.instruccionesPago ?? '',
  };
}
function getCurrentInternalPath() {
  return `${window.location.pathname}${window.location.search}` || eventsListPath;
}

function readStoredCitizenUser() {
  try {
    const storedUser = localStorage.getItem(citizenAuthStorageKey);

    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
}

function saveCitizenSession(user) {
  const citizenUser = {
    acceptsDataUse: user.acceptsDataUse ?? true,
    apellidos: user.apellidos,
    celular: user.celular ?? '',
    correo: user.correo ?? user.email,
    dni: user.dni ?? '',
    fechaNacimiento: user.fechaNacimiento ?? '',
    nombreCompleto: user.nombreCompleto ?? user.fullName,
    nombres: user.nombres,
    rol: 'VECINO',
    role: 'VECINO',
  };

  try {
    localStorage.setItem(citizenAuthTokenKey, `mock-vecino-${Date.now()}`);
    localStorage.setItem(citizenAuthStorageKey, JSON.stringify(citizenUser));
  } catch {
    return citizenUser;
  }

  return citizenUser;
}

function mapNeighborProfileToSession(profile) {
  return saveCitizenSession({
    acceptsDataUse: profile.aceptaTratamientoDatos ?? true,
    celular: profile.celular ?? '',
    correo: profile.correo ?? '',
    dni: profile.dni ?? '',
    email: profile.correo ?? '',
    fechaNacimiento: profile.fechaNacimiento ?? '',
    fullName: profile.nombreCompleto ?? '',
    nombreCompleto: profile.nombreCompleto ?? '',
    rol: 'VECINO',
    role: 'VECINO',
  });
}

function getAccountFormData(source = {}) {
  return {
    acceptsDataUse: source.aceptaTratamientoDatos ?? source.acceptsDataUse ?? true,
    celular: source.celular ?? '',
    correo: source.correo ?? source.email ?? '',
    fechaNacimiento: source.fechaNacimiento ?? '',
  };
}

function clearCitizenSession() {
  try {
    localStorage.removeItem(citizenAuthTokenKey);
    localStorage.removeItem(citizenAuthStorageKey);
    sessionStorage.removeItem('postLoginRedirect');
  } catch {
    // La sesion mock solo mejora la experiencia visual del frontend.
  }
}

function hasActiveCitizenSession(authenticatedUser) {
  if (authenticatedUser?.role === 'VECINO' || authenticatedUser?.rol === 'VECINO') {
    return true;
  }

  // TODO: reemplazar por el contexto real de autenticacion ciudadana.
  // La proteccion definitiva debe vivir tambien en el backend con JWT.
  try {
    return ['token', 'authToken', 'accessToken', 'jwt'].some((storageKey) =>
      Boolean(localStorage.getItem(storageKey)),
    );
  } catch {
    return false;
  }
}

function getSafeEventsOriginPath() {
  const currentPath = getCurrentInternalPath();

  if (currentPath === '/' || currentPath.startsWith('/eventos/')) {
    return eventsListPath;
  }

  return currentPath;
}

function getInitialPortalView() {
  if (window.location.pathname === '/login') {
    return 'portal';
  }

  if (window.location.pathname === '/registro') {
    return 'register';
  }

  if (window.location.pathname === '/recuperar-contrasena') {
    return 'recoverPassword';
  }

  if (window.location.pathname === '/cuenta') {
    return 'account';
  }

  return 'portal';
}

function getInitialSelectedEvent() {
  return null;
}

function PublicPortal() {
  const [authState, setAuthState] = useState('checking');
  const [authMode, setAuthMode] = useState('auth-check');
  const [authError, setAuthError] = useState('');
  const [currentView, setCurrentView] = useState(getInitialPortalView);
  const [selectedCategory, setSelectedCategory] = useState(allCategoriesLabel);
  const [searchTerm, setSearchTerm] = useState('');
  const [portalEvents, setPortalEvents] = useState([]);
  const [portalEventsPage, setPortalEventsPage] = useState({ number: 0, totalElements: 0, totalPages: 0 });
  const [portalEventsPageNumber, setPortalEventsPageNumber] = useState(0);
  const [featuredEvent, setFeaturedEvent] = useState(null);
  const [portalCategories, setPortalCategories] = useState([]);
  const [isLoadingPortalEvents, setIsLoadingPortalEvents] = useState(true);
  const [portalEventsError, setPortalEventsError] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(getInitialSelectedEvent);
  const [registration, setRegistration] = useState(emptyRegistration);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmittingRegistration, setIsSubmittingRegistration] = useState(false);
  const [registrationError, setRegistrationError] = useState('');
  const [isLoginRequiredOpen, setIsLoginRequiredOpen] = useState(false);
  const [receiptCode, setReceiptCode] = useState('');
  const [receiptQrDataUrl, setReceiptQrDataUrl] = useState('');
  const [receiptQrError, setReceiptQrError] = useState('');
  const [selectedEventRegistration, setSelectedEventRegistration] = useState(null);
  const [registrationQrDataUrl, setRegistrationQrDataUrl] = useState('');
  const [registrationQrError, setRegistrationQrError] = useState('');
  const [isLoadingRegistrationQr, setIsLoadingRegistrationQr] = useState(false);
  const [isLoadingRegistrationStatus, setIsLoadingRegistrationStatus] = useState(false);
  const [isCancellingRegistration, setIsCancellingRegistration] = useState(false);
  const [registrationActionError, setRegistrationActionError] = useState('');
  const [authenticatedUser, setAuthenticatedUser] = useState(readStoredCitizenUser);
  const [detailOriginPath, setDetailOriginPath] = useState(eventsListPath);
  const [loginNotice, setLoginNotice] = useState('');
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState('');
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);
  const [paymentError, setPaymentError] = useState('');
  const [paymentNotice, setPaymentNotice] = useState('');
  const [isUploadingPaymentReceipt, setIsUploadingPaymentReceipt] = useState(false);

  useEffect(() => {
    let isMounted = true;

    initKeycloak()
      .then(async (authenticated) => {
        if (!isMounted) {
          return;
        }

        if (authenticated) {
          const user = getKeycloakUser();

          if (user) {
            await openInstitutionalDashboard(user);
            setAuthState('ready');
          } else {
            setAuthError('Tu cuenta no tiene un rol habilitado para ingresar al sistema.');
            setAuthState('error');
          }

          return;
        }

        const currentPath = window.location.pathname;
        const requiresAuthentication = [
          '/login', '/admin', '/directivo', '/operativo',
        ].includes(currentPath);

        if (requiresAuthentication) {
          setAuthMode('login');
          setAuthState('redirecting');
          await loginWithKeycloak(
            sessionStorage.getItem('postLoginRedirect') ?? currentPath,
          );
          return;
        }

        setAuthState('ready');
      })
      .catch((error) => {
        console.error('No se pudo inicializar Keycloak', error);
        if (isMounted) {
          const isProtectedPath = [
            '/login', '/admin', '/directivo', '/operativo',
          ].includes(window.location.pathname);

          if (isProtectedPath) {
            setAuthError('No pudimos verificar tu sesión. Intenta nuevamente.');
            setAuthState('error');
          } else {
            setAuthState('ready');
          }
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    function showSessionExpiredMessage(event) {
      setSessionExpiredMessage(event.detail?.message ?? SESSION_EXPIRED_MESSAGE);
    }

    window.addEventListener('app-session-expired', showSessionExpiredMessage);

    return () => {
      window.removeEventListener('app-session-expired', showSessionExpiredMessage);
    };
  }, []);

  const categoryOptions = useMemo(
    () => [allCategoriesLabel, ...portalCategories.map((category) => category.nombre).filter(Boolean)],
    [portalCategories],
  );

  const selectedCategoryId = useMemo(() => {
    if (selectedCategory === allCategoriesLabel) {
      return '';
    }

    return portalCategories.find((category) => category.nombre === selectedCategory)?.id ?? '';
  }, [portalCategories, selectedCategory]);

  useEffect(() => {
    let isMounted = true;

    obtenerCategoriasPublicas()
      .then((categories) => {
        if (!isMounted) {
          return;
        }

        setPortalCategories(Array.isArray(categories) ? categories : []);
      })
      .catch((error) => {
        console.error('No se pudieron cargar las categorias publicas.', error);
        if (isMounted) {
          setPortalCategories([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    obtenerProximoEventoPublicado()
      .then((event) => {
        if (!isMounted) {
          return;
        }

        setFeaturedEvent(event ? mapPublicEventFromApi(event) : null);
      })
      .catch((error) => {
        console.error('No se pudo cargar el proximo evento publicado.', error);
        if (isMounted) {
          setFeaturedEvent(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);
  useEffect(() => {
    if (selectedCategory !== allCategoriesLabel && !categoryOptions.includes(selectedCategory)) {
      setSelectedCategory(allCategoriesLabel);
    }
  }, [categoryOptions, selectedCategory]);

  useEffect(() => {
    let isMounted = true;
    const timeoutId = window.setTimeout(() => {
      setIsLoadingPortalEvents(true);
      setPortalEventsError('');

      obtenerEventosPublicados({
        categoriaId: selectedCategoryId,
        texto: searchTerm.trim(),
        page: portalEventsPageNumber,
        size: publicEventsPageSize,
      })
        .then((response) => {
          if (!isMounted) {
            return;
          }

          const pageData = normalizePublicEventsPage(response);
          setPortalEvents(pageData.content.map(mapPublicEventFromApi));
          setPortalEventsPage({
            number: pageData.number,
            totalElements: pageData.totalElements,
            totalPages: pageData.totalPages,
          });
        })
        .catch((error) => {
          console.error('No se pudieron cargar los eventos publicados.', error);
          if (isMounted) {
            setPortalEvents([]);
            setPortalEventsPage({ number: 0, totalElements: 0, totalPages: 0 });
            setPortalEventsError('No se pudieron cargar los eventos publicados.');
          }
        })
        .finally(() => {
          if (isMounted) {
            setIsLoadingPortalEvents(false);
          }
        });
    }, 300);

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [searchTerm, selectedCategoryId, portalEventsPageNumber]);

  useEffect(() => {
    const eventId = window.location.pathname.match(/^\/eventos\/([^/?#]+)$/)?.[1];

    if (!eventId || selectedEvent) {
      return;
    }

    const matchingEvent = portalEvents.find((event) => String(event.id) === eventId);

    if (matchingEvent) {
      setSelectedEvent(matchingEvent);
      setDetailOriginPath(eventsListPath);
    }
  }, [portalEvents, selectedEvent]);
  useEffect(() => {
    if (!selectedEvent) {
      setSelectedEventRegistration(null);
      setIsLoadingRegistrationStatus(false);
      setRegistrationActionError('');
      return;
    }

    if (!hasActiveCitizenSession(authenticatedUser)) {
      setSelectedEventRegistration(null);
      setIsLoadingRegistrationStatus(false);
      setRegistrationActionError('');
      return;
    }

    let isMounted = true;

    setIsLoadingRegistrationStatus(true);
    setRegistrationActionError('');

    obtenerInscripcionActualEvento(selectedEvent.id)
      .then((response) => {
        if (isMounted) {
          setSelectedEventRegistration(response);
        }
      })
      .catch((error) => {
        console.error('No se pudo consultar la inscripcion actual del evento.', error);
        if (isMounted) {
          setSelectedEventRegistration(null);
          setRegistrationActionError(getApiErrorMessage(error, 'No se pudo verificar tu inscripcion actual.'));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingRegistrationStatus(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [authenticatedUser, selectedEvent]);
  useEffect(() => {
    const inscriptionId = selectedEventRegistration?.id;
    const isConfirmed = selectedEventRegistration?.estado === 'CONFIRMADA';

    if (!inscriptionId || !isConfirmed || selectedEvent?.requiresAttendanceControl === false) {
      setRegistrationQrDataUrl('');
      setRegistrationQrError('');
      setIsLoadingRegistrationQr(false);
      return;
    }

    let isMounted = true;

    setIsLoadingRegistrationQr(true);
    setRegistrationQrError('');

    obtenerQrActivoInscripcion(inscriptionId)
      .then((response) => {
        if (!isMounted) {
          return;
        }

        const qrDataUrl = response?.qrDataUrl ?? '';
        setRegistrationQrDataUrl(qrDataUrl);
        setRegistrationQrError(qrDataUrl ? '' : 'No se recibio la imagen del codigo QR.');
      })
      .catch((error) => {
        console.error('No se pudo cargar el QR activo de la inscripcion.', error);
        if (isMounted) {
          setRegistrationQrDataUrl('');
          setRegistrationQrError(getApiErrorMessage(error, 'No se pudo cargar el codigo QR.'));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingRegistrationQr(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedEvent?.requiresAttendanceControl, selectedEventRegistration?.estado, selectedEventRegistration?.id]);

  const filteredEvents = portalEvents;

  function changeCategory(category) {
    setSelectedCategory(category);
    setPortalEventsPageNumber(0);
  }

  function changeSearchTerm(value) {
    setSearchTerm(value);
    setPortalEventsPageNumber(0);
  }

  function changePortalEventsPage(nextPage) {
    if (nextPage < 0 || nextPage >= portalEventsPage.totalPages || nextPage === portalEventsPageNumber) {
      return;
    }

    setPortalEventsPageNumber(nextPage);
  }
  function openEventDetail(event) {
    const from = getSafeEventsOriginPath();

    setCurrentView('portal');
    setSelectedEvent(event);
    setRegistration(emptyRegistration);
    setIsRegistered(false);
    setIsConfirmOpen(false);
    setIsLoginRequiredOpen(false);
    setReceiptCode('');
    setReceiptQrDataUrl('');
    setReceiptQrError('');
    setSelectedEventRegistration(null);
    setIsLoadingRegistrationStatus(false);
    setRegistrationActionError('');
    setLoginNotice('');
    setPaymentForm(emptyPaymentForm);
    setPaymentError('');
    setPaymentNotice('');
    setIsUploadingPaymentReceipt(false);
    setDetailOriginPath(from);
    window.history.pushState(
      { from },
      '',
      `/eventos/${event.id}`,
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function closeEventDetail() {
    const fallbackPath =
      detailOriginPath || window.history.state?.from || eventsListPath;

    setCurrentView('portal');
    setSelectedEvent(null);
    setRegistration(emptyRegistration);
    setIsRegistered(false);
    setIsConfirmOpen(false);
    setIsLoginRequiredOpen(false);
    setReceiptCode('');
    setReceiptQrDataUrl('');
    setReceiptQrError('');
    setSelectedEventRegistration(null);
    setIsLoadingRegistrationStatus(false);
    setRegistrationActionError('');
    setLoginNotice('');
    setPaymentForm(emptyPaymentForm);
    setPaymentError('');
    setPaymentNotice('');
    setIsUploadingPaymentReceipt(false);
    window.history.pushState(null, '', fallbackPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function submitRegistration(event) {
    event.preventDefault();

    if (!hasActiveCitizenSession(authenticatedUser)) {
      setIsLoginRequiredOpen(true);
      return;
    }

    setRegistrationError('');
    setIsConfirmOpen(true);
  }

  async function confirmRegistration() {
    if (!selectedEvent || isSubmittingRegistration) {
      return;
    }

    setIsSubmittingRegistration(true);
    setRegistrationError('');
    setPaymentError('');
    setPaymentNotice('');

    try {
      const response = await inscribirEventoPublicado(selectedEvent.id);
      const inscriptionId = response?.id;
      const isConfirmed = response?.estado === 'CONFIRMADA';

      setSelectedEventRegistration(response);
      setReceiptCode(response.codigoInscripcion ?? `EC-${selectedEvent.id}`);
      setReceiptQrDataUrl('');
      setReceiptQrError('');
      setIsConfirmOpen(false);

      if (!isConfirmed) {
        setIsRegistered(false);
        setPaymentNotice('Tu preinscripcion fue registrada. Sube tu comprobante para que el administrador valide el pago.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      let qrDataUrl = '';
      let qrError = '';

      if (selectedEvent.requiresAttendanceControl !== false) {
        if (inscriptionId) {
          try {
            const qrResponse = await obtenerQrActivoInscripcion(inscriptionId);
            qrDataUrl = qrResponse?.qrDataUrl ?? '';
            qrError = qrDataUrl ? '' : 'No se recibio la imagen del codigo QR.';
          } catch (qrRequestError) {
            console.error('No se pudo cargar el QR de la inscripcion.', qrRequestError);
            qrError = getApiErrorMessage(qrRequestError, 'No se pudo cargar el codigo QR.');
          }
        } else {
          qrError = 'No se recibio el identificador de la inscripcion para cargar el QR.';
        }
      }

      setReceiptQrDataUrl(qrDataUrl);
      setReceiptQrError(qrError);
      setIsRegistered(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setRegistrationError(getApiErrorMessage(error, 'No se pudo registrar tu inscripcion.'));
    } finally {
      setIsSubmittingRegistration(false);
    }
  }

  function handlePaymentFieldChange(field, value) {
    setPaymentForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
    setPaymentError('');
  }

  function handlePaymentFileChange(file) {
    setPaymentForm((currentForm) => ({
      ...currentForm,
      archivo: file,
    }));
    setPaymentError('');
  }

  async function submitPaymentReceipt(event) {
    event.preventDefault();

    if (!selectedEventRegistration?.id || isUploadingPaymentReceipt) {
      return;
    }

    if (selectedEventRegistration?.estadoPago === 'EN_REVISION') {
      setPaymentError('Tu comprobante ya fue enviado y esta pendiente de revision.');
      return;
    }

    if (!paymentForm.medioPago.trim() || !paymentForm.numeroOperacion.trim() || !paymentForm.fechaPago || !paymentForm.archivo) {
      setPaymentError('Completa el medio de pago, numero de operacion, fecha y comprobante.');
      return;
    }

    if (paymentForm.fechaPago > getTodayInputDate()) {
      setPaymentError('La fecha de pago no puede ser posterior a la fecha actual.');
      return;
    }

    setIsUploadingPaymentReceipt(true);
    setPaymentError('');
    setPaymentNotice('');

    try {
      await subirComprobantePago(selectedEventRegistration.id, paymentForm);
      const updatedRegistration = await obtenerInscripcionActualEvento(selectedEvent.id);
      setSelectedEventRegistration(updatedRegistration);
      setPaymentForm(emptyPaymentForm);
      setPaymentNotice('Comprobante enviado. El administrador revisara el pago y recibiras la confirmacion en tu correo.');
    } catch (error) {
      setPaymentError(getApiErrorMessage(error, 'No se pudo enviar el comprobante.'));
    } finally {
      setIsUploadingPaymentReceipt(false);
    }
  }
  async function cancelEventRegistration() {
    if (!selectedEvent || isCancellingRegistration) {
      return;
    }

    setIsCancellingRegistration(true);
    setRegistrationActionError('');

    try {
      const response = await cancelarInscripcionEvento(selectedEvent.id);
      setSelectedEventRegistration(response);
      setIsRegistered(false);
      setReceiptCode('');
      setReceiptQrDataUrl('');
      setReceiptQrError('');
    } catch (error) {
      setRegistrationActionError(getApiErrorMessage(error, 'No se pudo cancelar tu inscripcion.'));
    } finally {
      setIsCancellingRegistration(false);
    }
  }
  function cancelRegistrationConfirmation() {
    if (isSubmittingRegistration) {
      return;
    }

    setRegistrationError('');
    setIsConfirmOpen(false);
  }

  function closeLoginRequiredModal() {
    setIsLoginRequiredOpen(false);
  }

  function continueToLoginFromReservation() {
    if (!selectedEvent) {
      return;
    }

    const redirectTo = `/eventos/${selectedEvent.id}`;

    setIsLoginRequiredOpen(false);
    setLoginNotice('');
    setPaymentForm(emptyPaymentForm);
    setPaymentError('');
    setPaymentNotice('');
    setIsUploadingPaymentReceipt(false);
    setIsConfirmOpen(false);
    setAuthError('');
    setAuthMode('login');
    setAuthState('redirecting');
    loginWithKeycloak(redirectTo).catch((error) => {
      console.error('No se pudo abrir el inicio de sesión', error);
      setAuthError('No pudimos abrir el inicio de sesión. Intenta nuevamente.');
      setAuthState('error');
    });
  }

  function openLogin(notice = '') {
    setLoginNotice(typeof notice === 'string' ? notice : '');
    setSelectedEvent(null);
    setIsConfirmOpen(false);
    setIsLoginRequiredOpen(false);
    setAuthError('');
    setAuthMode('login');
    setAuthState('redirecting');
    loginWithKeycloak('/admin').catch((error) => {
      console.error('No se pudo abrir el inicio de sesión', error);
      setAuthError('No pudimos abrir el inicio de sesión. Intenta nuevamente.');
      setAuthState('error');
    });
  }

  function openRegister() {
    setLoginNotice('');
    setPaymentForm(emptyPaymentForm);
    setPaymentError('');
    setPaymentNotice('');
    setIsUploadingPaymentReceipt(false);
    setSelectedEvent(null);
    setIsConfirmOpen(false);
    setIsLoginRequiredOpen(false);
    setAuthError('');
    setAuthMode('login');
    setAuthState('redirecting');
    registerWithKeycloak(getCurrentInternalPath()).catch((error) => {
      console.error('No se pudo abrir el registro', error);
      setAuthError('No pudimos abrir el registro. Intenta nuevamente.');
      setAuthState('error');
    });
  }

  function openRecoverPassword() {
    setLoginNotice('');
    setPaymentForm(emptyPaymentForm);
    setPaymentError('');
    setPaymentNotice('');
    setIsUploadingPaymentReceipt(false);
    setCurrentView('recoverPassword');
    setSelectedEvent(null);
    setIsConfirmOpen(false);
    setIsLoginRequiredOpen(false);
    window.history.pushState(null, '', '/recuperar-contrasena');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openAccountSettings() {
    setCurrentView('account');
    setSelectedEvent(null);
    setIsConfirmOpen(false);
    setIsLoginRequiredOpen(false);
    window.history.pushState(null, '', '/cuenta');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function logoutUser() {
    setAuthError('');
    setAuthMode('logout');
    setAuthState('redirecting');
    clearCitizenSession();
    setAuthenticatedUser(null);
    setCurrentView('portal');
    setSelectedEvent(null);
    setIsConfirmOpen(false);
    setIsLoginRequiredOpen(false);
    setLoginNotice('');
    setPaymentForm(emptyPaymentForm);
    setPaymentError('');
    setPaymentNotice('');
    setIsUploadingPaymentReceipt(false);
    window.history.pushState(null, '', eventsListPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (keycloak.authenticated) {
      logoutFromKeycloak().catch((error) => {
        console.error('No se pudo cerrar la sesión', error);
        setAuthError('No pudimos cerrar la sesión. Intenta nuevamente.');
        setAuthState('error');
      });
    } else {
      window.setTimeout(() => setAuthState('ready'), 300);
    }
  }

  async function openInstitutionalDashboard(user) {
    if (user.role === 'VECINO') {
      let citizenUser = saveCitizenSession(user);

      try {
        await confirmarSesionActual();
        const profile = await obtenerPerfilVecino();
        citizenUser = mapNeighborProfileToSession(profile);
      } catch (error) {
        console.error('No se pudo cargar la cuenta vecinal autenticada desde base de datos.', error);
      }

      const requestedRedirect = sessionStorage.getItem('postLoginRedirect') ?? eventsListPath;
      const redirectTo = requestedRedirect === eventsListPath || requestedRedirect.startsWith('/eventos/')
        ? requestedRedirect
        : eventsListPath;
      const redirectEventId = redirectTo.match(/^\/eventos\/(.+)$/)?.[1];
      const redirectEvent = portalEvents.find((event) => String(event.id) === redirectEventId);

      setAuthenticatedUser(citizenUser);
      setLoginNotice('');
    setPaymentForm(emptyPaymentForm);
    setPaymentError('');
    setPaymentNotice('');
    setIsUploadingPaymentReceipt(false);
      setCurrentView('portal');
      setSelectedEvent(redirectEvent ?? null);
      setIsConfirmOpen(false);
      setIsLoginRequiredOpen(false);
      window.history.pushState(null, '', redirectTo);
      sessionStorage.removeItem('postLoginRedirect');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setAuthenticatedUser(user);
    clearCitizenSession();
    setLoginNotice('');
    setPaymentForm(emptyPaymentForm);
    setPaymentError('');
    setPaymentNotice('');
    setIsUploadingPaymentReceipt(false);
    const viewByRole = {
      ADMINISTRADOR: 'admin',
      DIRECTIVO: 'directivo',
      OPERATIVO: 'operativo',
    };
    const pathByRole = {
      ADMINISTRADOR: '/admin',
      DIRECTIVO: '/directivo',
      OPERATIVO: '/operativo',
    };

    setCurrentView(viewByRole[user.role] ?? 'admin');
    setSelectedEvent(null);
    setIsConfirmOpen(false);
    sessionStorage.removeItem('postLoginRedirect');
    window.history.replaceState(null, '', pathByRole[user.role] ?? '/admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  if (authState !== 'ready') {
    return (
      <AuthTransition
        error={authError}
        mode={authMode}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <main className="citizen-portal">
      {currentView !== 'login' &&
        currentView !== 'register' &&
        currentView !== 'recoverPassword' &&
        currentView !== 'admin' &&
        currentView !== 'directivo' &&
        currentView !== 'operativo' && (
        <PortalHeader
          user={authenticatedUser}
          onAccount={openAccountSettings}
          onHome={closeEventDetail}
          onLogin={openLogin}
          onLogout={logoutUser}
        />
      )}

      {currentView === 'login' ? (
        <LoginView
          notice={loginNotice}
          onBack={closeEventDetail}
          onLoginSuccess={openInstitutionalDashboard}
          onRecoverPassword={openRecoverPassword}
          onRegister={openRegister}
        />
      ) : currentView === 'register' ? (
        <VecinoRegisterPage
          onBack={closeEventDetail}
          onLogin={openLogin}
        />
      ) : currentView === 'recoverPassword' ? (
        <RecoverPasswordPage
          onBack={closeEventDetail}
          onLogin={openLogin}
        />
      ) : currentView === 'admin' ? (
        <AdminDashboard user={authenticatedUser} onLogout={logoutUser} />
      ) : currentView === 'directivo' ? (
        <DirectivoDashboard user={authenticatedUser} onLogout={logoutUser} />
      ) : currentView === 'operativo' ? (
        <OperativoDashboard user={authenticatedUser} onLogout={logoutUser} />
      ) : currentView === 'account' ? (
        <AccountSettingsPage
          user={authenticatedUser}
          onBack={closeEventDetail}
          onUserUpdate={setAuthenticatedUser}
        />
      ) : selectedEvent ? (
        <>
          {isRegistered ? (
            <RegistrationReceipt
              event={selectedEvent}
              receiptCode={receiptCode}
              qrDataUrl={receiptQrDataUrl}
              qrError={receiptQrError}
              registration={registration}
              user={authenticatedUser}
              onBack={closeEventDetail}
              onPrint={() => window.print()}
            />
          ) : (
            <PublicEventDetail
              event={selectedEvent}
              currentRegistration={selectedEventRegistration}
              isCancellingRegistration={isCancellingRegistration}
              isLoadingRegistrationStatus={isLoadingRegistrationStatus}
              registrationActionError={registrationActionError}
              registrationQrDataUrl={registrationQrDataUrl}
              registrationQrError={registrationQrError}
              registrationStatus={selectedEventRegistration?.estado ?? 'NO_INSCRITO'}
              isLoadingRegistrationQr={isLoadingRegistrationQr}
              paymentForm={paymentForm}
              paymentError={paymentError}
              paymentNotice={paymentNotice}
              maxPaymentDate={getTodayInputDate()}
              isUploadingPaymentReceipt={isUploadingPaymentReceipt}
              onBack={closeEventDetail}
              onCancelRegistration={cancelEventRegistration}
              onPaymentFieldChange={handlePaymentFieldChange}
              onPaymentFileChange={handlePaymentFileChange}
              onPaymentSubmit={submitPaymentReceipt}
              onSubmit={submitRegistration}
            />
          )}

          {isConfirmOpen && (
            <ConfirmRegistrationModal
              error={registrationError}
              eventTitle={selectedEvent.title}
              isSubmitting={isSubmittingRegistration}
              onCancel={cancelRegistrationConfirmation}
              onConfirm={confirmRegistration}
            />
          )}

          {isLoginRequiredOpen && (
            <LoginRequiredModal
              onCancel={closeLoginRequiredModal}
              onLogin={continueToLoginFromReservation}
              onRegister={openRegister}
            />
          )}
        </>
      ) : (
        <PortalHome
          categories={categoryOptions}
          featuredEvent={featuredEvent}
          filteredEvents={filteredEvents}
          isLoading={isLoadingPortalEvents}
          loadError={portalEventsError}
          searchTerm={searchTerm}
          selectedCategory={selectedCategory}
          eventsPage={portalEventsPage}
          onCategoryChange={changeCategory}
          onEventSelect={openEventDetail}
          onPageChange={changePortalEventsPage}
          onSearchChange={changeSearchTerm}
          upcomingEvents={portalEvents}
        />
      )}

      {sessionExpiredMessage && (
        <SessionExpiredModal
          message={sessionExpiredMessage}
          onLogin={() => {
            setSessionExpiredMessage('');
            openLogin();
          }}
        />
      )}
    </main>
  );
}

function AuthTransition({ error, mode, onRetry }) {
  const isLogout = mode === 'logout';
  const isCheckingAuth = mode === 'auth-check';
  const title = error
    ? isLogout ? 'No se pudo cerrar la sesión' : 'No se pudo verificar la sesión'
    : isLogout ? 'Saliendo del sistema...'
      : isCheckingAuth ? 'Verificando tu sesión...'
        : 'Ingresando al sistema...';
  const message = error || (isLogout
    ? 'Estamos cerrando tu sesión de forma segura.'
    : isCheckingAuth ? 'Estamos verificando tu sesión y perfil.'
      : 'Estamos preparando el acceso seguro a tu cuenta.');

  return (
    <main className={'auth-transition'} role={error ? 'alert' : 'status'} aria-live={'polite'}>
      <section className={'auth-transition-card'}>
        <span className={'auth-transition-spinner'} aria-hidden={true}></span>
        <h1>{title}</h1>
        <p>{message}</p>
        {error ? <button type={'button'} onClick={onRetry}>Reintentar</button> : null}
      </section>
    </main>
  );
}

function PortalHeader({ user, onAccount, onHome, onLogin, onLogout }) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const isNeighbor = user?.role === 'VECINO' || user?.rol === 'VECINO';
  const userDisplayName = user?.nombreCompleto || user?.fullName || [user?.nombres, user?.apellidos].filter(Boolean).join(' ') || user?.correo || user?.email || 'Mi cuenta';

  useEffect(() => {
    function closeMenuOnOutsideClick(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', closeMenuOnOutsideClick);

    return () => {
      document.removeEventListener('mousedown', closeMenuOnOutsideClick);
    };
  }, []);

  function selectAccountSettings() {
    setIsUserMenuOpen(false);
    onAccount();
  }

  function selectLogout() {
    setIsUserMenuOpen(false);
    onLogout();
  }

  return (
    <header className="portal-header">
      <button className="brand brand-button" type="button" onClick={onHome}>
        <img
          alt="Logo Municipalidad de San Miguel"
          className="municipality-logo brand-logo"
          src={municipalLogo}
        />
        <span>
          <strong>Municipalidad de San Miguel</strong>
          <small>Portal de eventos</small>
        </span>
      </button>

      <nav className="portal-nav" aria-label="Navegacion principal">
        {isNeighbor ? (
          <div className="portal-user-menu" ref={menuRef}>
            <button
              aria-expanded={isUserMenuOpen}
              className="portal-user-button"
              type="button"
              onClick={() => setIsUserMenuOpen((currentValue) => !currentValue)}
            >
              <span>{userDisplayName}</span>
              <span aria-hidden="true">▾</span>
            </button>
            {isUserMenuOpen && (
              <div className="portal-user-dropdown" role="menu">
                <button type="button" role="menuitem" onClick={selectAccountSettings}>
                  Configuración de cuenta
                </button>
                <button
                  className="portal-user-logout"
                  type="button"
                  role="menuitem"
                  onClick={selectLogout}
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        ) : (
          <button type="button" onClick={onLogin}>
            Ingresar
          </button>
        )}
      </nav>
    </header>
  );
}

function AccountSettingsPage({ user, onBack, onUserUpdate }) {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState(() => getAccountFormData(user));
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const currentProfile = profile ?? user ?? {};
  const displayName =
    currentProfile.nombreCompleto || [currentProfile.nombres, currentProfile.apellidos].filter(Boolean).join(' ');

  useEffect(() => {
    let isMounted = true;

    obtenerPerfilVecino()
      .then((loadedProfile) => {
        if (!isMounted) {
          return;
        }

        setProfile(loadedProfile);
        setFormData(getAccountFormData(loadedProfile));
        onUserUpdate(mapNeighborProfileToSession(loadedProfile));
      })
      .catch((error) => {
        console.error('No se pudo cargar la configuracion de cuenta vecinal.', error);
        if (isMounted) {
          setFormError(getApiErrorMessage(error, 'No se pudieron cargar tus datos de cuenta.'));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingProfile(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [onUserUpdate]);

  function updateField(field, value) {
    setFormData((currentData) => ({
      ...currentData,
      [field]: value,
    }));
    setFormError('');
    setFormSuccess('');
  }

  async function submitAccountSettings(event) {
    event.preventDefault();

    if (!profile) {
      setFormError('Espera a que se carguen tus datos de cuenta.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(formData.correo.trim())) {
      setFormError('Ingresa un correo electronico valido.');
      return;
    }

    if (!formData.celular.trim()) {
      setFormError('Ingresa tu numero de celular.');
      return;
    }

    setIsSavingProfile(true);
    setFormError('');
    setFormSuccess('');

    try {
      const updatedProfile = await actualizarPerfilVecino({
        dni: profile.dni,
        nombreCompleto: profile.nombreCompleto,
        fechaNacimiento: formData.fechaNacimiento,
        correo: formData.correo.trim(),
        celular: formData.celular.trim(),
        aceptaTratamientoDatos: formData.acceptsDataUse,
      });

      setProfile(updatedProfile);
      setFormData(getAccountFormData(updatedProfile));
      onUserUpdate(mapNeighborProfileToSession(updatedProfile));
      setFormSuccess('Datos actualizados correctamente.');
    } catch (error) {
      console.error('No se pudo actualizar la configuracion de cuenta vecinal.', error);
      setFormError(getApiErrorMessage(error, 'No se pudieron actualizar tus datos.'));
    } finally {
      setIsSavingProfile(false);
    }
  }

  function cancelAccountSettings() {
    setFormData(getAccountFormData(currentProfile));
    setFormError('');
    setFormSuccess('');
    onBack();
  }

  return (
    <section className="account-settings-shell" aria-labelledby="account-settings-title">
      <form className="account-settings-panel" onSubmit={submitAccountSettings}>
        <button className="detail-back-link register-back-link" type="button" onClick={onBack}>
          <span aria-hidden="true">←</span>
          Volver a eventos
        </button>

        <div className="account-settings-heading">
          <span className="section-kicker">Cuenta vecinal</span>
          <h1 id="account-settings-title">Configuración de cuenta</h1>
          <p>Revisa y actualiza los datos asociados a tu cuenta vecinal.</p>
        </div>

        {isLoadingProfile && <p className="portal-inline-message">Cargando datos de cuenta...</p>}

        <div className="register-fields-grid account-fields-grid">
          <label>
            DNI
            <input
              disabled
              type="text"
              value={currentProfile.dni ?? ''}
              readOnly
            />
            <span className="account-field-help">
              No editable. Documento validado para tu cuenta.
            </span>
          </label>
          <label>
            Nombres y apellidos
            <input
              disabled
              type="text"
              value={displayName}
              readOnly
            />
            <span className="account-field-help">
              No editable. Información validada con fuente oficial.
            </span>
          </label>
          <label>
            Fecha de nacimiento
            <input
              autoComplete="bday"
              disabled={isLoadingProfile || isSavingProfile}
              type="date"
              value={formData.fechaNacimiento}
              onChange={(event) => updateField('fechaNacimiento', event.target.value)}
            />
          </label>
          <label>
            Correo electrónico
            <input
              autoComplete="email"
              disabled={isLoadingProfile || isSavingProfile}
              type="email"
              value={formData.correo}
              onChange={(event) => updateField('correo', event.target.value)}
            />
          </label>
          <label>
            Celular
            <input
              autoComplete="tel"
              disabled={isLoadingProfile || isSavingProfile}
              inputMode="tel"
              type="tel"
              value={formData.celular}
              onChange={(event) => updateField('celular', event.target.value)}
            />
          </label>
        </div>

        <label className="data-consent-control account-consent-control">
          <input
            disabled={isLoadingProfile || isSavingProfile}
            type="checkbox"
            checked={formData.acceptsDataUse}
            onChange={(event) => updateField('acceptsDataUse', event.target.checked)}
          />
          <span>
            Acepto el uso de mis datos para gestionar mi participación en eventos
            municipales.
          </span>
        </label>

        {formError && <p className="login-error">{formError}</p>}
        {formSuccess && <p className="login-success">{formSuccess}</p>}

        <div className="account-form-actions">
          <button className="back-button" disabled={isSavingProfile} type="button" onClick={cancelAccountSettings}>
            Cancelar
          </button>
          <LoadingButton
            className="primary-button register-primary-button"
            disabled={isLoadingProfile || !profile}
            loading={isSavingProfile}
            loadingLabel="Guardando..."
            type="submit"
          >
            Guardar cambios
          </LoadingButton>
        </div>
      </form>
    </section>
  );
}

function LoginView({ notice, onBack, onLoginSuccess, onRecoverPassword, onRegister }) {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [loginError, setLoginError] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  function updateCredential(field, value) {
    setCredentials((currentCredentials) => ({
      ...currentCredentials,
      [field]: value,
    }));
    setLoginError('');
  }

  function submitLogin(event) {
    event.preventDefault();

    const user = institutionalUsers.find(
      (institutionalUser) =>
        institutionalUser.email === credentials.email.trim().toLowerCase() &&
        institutionalUser.password === credentials.password,
    );

    if (!user) {
      setLoginError('Credenciales incorrectas. Verifica el correo y la contraseña.');
      return;
    }

    onLoginSuccess(user);
  }

  return (
    <section className="login-shell" aria-labelledby="login-title">
      <div className="login-form-side">
        <button className="login-brand" type="button" onClick={onBack}>
          <img
            alt="Logo Municipalidad de San Miguel"
            className="municipality-logo brand-logo"
            src={municipalLogo}
          />
          <strong>Municipalidad de San Miguel</strong>
        </button>

        <form
          className="login-card"
          onSubmit={submitLogin}
        >
          <div className="login-title">
            <span>Portal de eventos</span>
            <h1 id="login-title">Iniciar sesión</h1>
            <p>Accede a tu cuenta para continuar.</p>
          </div>

          <label>
            Correo electrónico
            <input
              autoComplete="email"
              placeholder="Ingrese su correo electrónico"
              type="email"
              value={credentials.email}
              onChange={(event) => updateCredential('email', event.target.value)}
            />
          </label>
          <label>
            Contraseña
            <span className="password-control">
              <input
                autoComplete="current-password"
                placeholder='Ingrese su contraseña'
                type={isPasswordVisible ? 'text' : 'password'}
                value={credentials.password}
                onChange={(event) =>
                  updateCredential('password', event.target.value)
                }
              />
              <button
                aria-label={
                  isPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'
                }
                className="password-toggle"
                type="button"
                onClick={() =>
                  setIsPasswordVisible((currentValue) => !currentValue)
                }
              >
                {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </span>
          </label>
          <div className="login-options">
            <label className="remember-control">
              <input type="checkbox" />
              Recordarme
            </label>
            <button type="button" onClick={onRecoverPassword}>
              Recuperar contraseña
            </button>
          </div>
          <button className="primary-button" type="submit">
            Ingresar
          </button>
          <p className="login-register-link">
            <span>¿Aún no tienes cuenta vecinal?</span>
            <button type="button" onClick={onRegister}>
              Crear cuenta
            </button>
          </p>
          {notice && <p className="login-success">{notice}</p>}
          {loginError && <p className="login-error">{loginError}</p>}
          <div className="login-test-users" aria-label="Credenciales de prueba">
            <span>Admin: admin@munisanmiguel.gob.pe / admin123</span>
            <span>Directivo: directivo@munisanmiguel.gob.pe / directivo123</span>
            <span>Operativo: operativo@munisanmiguel.gob.pe / operativo123</span>
            <span>Vecino: vecino@gmail.com / vecino123</span>
          </div>
        </form>

        <p className="login-footer">
          <button type="button" onClick={onBack}>
            Volver a eventos
          </button>
        </p>
      </div>

      <div className="login-art-side" aria-hidden="true" />
    </section>
  );
}

function RecoverPasswordPage({ onBack, onLogin }) {
  const [verificationData, setVerificationData] = useState({
    correo: '',
    dni: '',
  });
  const [passwordData, setPasswordData] = useState({
    confirmPassword: '',
    newPassword: '',
  });
  const [verifiedUser, setVerifiedUser] = useState(null);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [isRecoveringPassword, setIsRecoveringPassword] = useState(false);

  function updateVerificationField(field, value) {
    const nextValue = field === 'dni' ? value.replace(/\D/g, '').slice(0, 8) : value;

    setVerificationData((currentData) => ({
      ...currentData,
      [field]: nextValue,
    }));
    setVerifiedUser(null);
    setFormError('');
    setFormSuccess('');
  }

  function updatePasswordField(field, value) {
    setPasswordData((currentData) => ({
      ...currentData,
      [field]: value,
    }));
    setFormError('');
    setFormSuccess('');
  }

  async function verifyAccount(event) {
    event.preventDefault();

    if (isRecoveringPassword) {
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const correo = verificationData.correo.trim().toLowerCase();
    const dni = verificationData.dni.trim();

    if (!correo) {
      setFormError('Ingresa tu correo electrónico.');
      return;
    }

    if (!emailPattern.test(correo)) {
      setFormError('Ingresa un correo electrónico válido.');
      return;
    }

    if (!dni) {
      setFormError('Ingresa tu DNI.');
      return;
    }

    if (!/^\d{8}$/.test(dni)) {
      setFormError('Ingrese un DNI válido de 8 dígitos.');
      return;
    }

    setIsRecoveringPassword(true);
    try {
      await recuperarContrasena(correo, dni);

      setFormError('');
      setFormSuccess(
        'Si los datos corresponden a una cuenta registrada, recibirás un correo para restablecer tu contraseña.'
      );
    } catch (error) {
      console.error(error);

      setFormError(
        'No se pudo procesar la solicitud. Inténtalo nuevamente.'
      );
    } finally {
      setIsRecoveringPassword(false);
    }

  }

  function updatePassword(event) {
    event.preventDefault();

    if (!passwordData.newPassword) {
      setFormError('Ingresa una nueva contraseña.');
      return;
    }

    if (!passwordData.confirmPassword) {
      setFormError('Confirma tu nueva contraseña.');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setFormError('Las contraseñas no coinciden.');
      return;
    }

    // TODO: conectar con Spring Boot para registrar el cambio de contrasena.
    setFormError('');
    setFormSuccess('Contraseña actualizada correctamente. Ahora puedes iniciar sesión.');
  }

  return (
    <section className="login-shell" aria-labelledby="recover-password-title">
      <div className="login-form-side">
        <button className="login-brand" type="button" onClick={onBack}>
          <img
            alt="Logo Municipalidad de San Miguel"
            className="municipality-logo brand-logo"
            src={municipalLogo}
          />
          <strong>Municipalidad de San Miguel</strong>
        </button>

        <form className="login-card recover-password-card" onSubmit={verifyAccount}>
          <div className="login-title">
            <span>Portal de eventos</span>
            <h1 id="recover-password-title">Recuperar contraseña</h1>
            <p>Ingresa tu correo electrónico y DNI para verificar tu cuenta.</p>
          </div>

          <label>
            Correo electrónico
            <input
              autoComplete="email"
              placeholder="Ingrese su correo electrónico"
              type="email"
              value={verificationData.correo}
              onChange={(event) => updateVerificationField('correo', event.target.value)}
            />
          </label>
          <label>
            DNI
            <input
              autoComplete="off"
              inputMode="numeric"
              maxLength={8}
              placeholder="Ingrese su DNI"
              type="text"
              value={verificationData.dni}
              onChange={(event) => updateVerificationField('dni', event.target.value)}
            />
          </label>

          <LoadingButton className="primary-button" loading={isRecoveringPassword} loadingLabel="Enviando..." type="submit">
            Verificar datos
          </LoadingButton>

          {verifiedUser && !formSuccess && (
            <section className="recover-password-step" aria-label="Actualizar contraseña">
              <span className="identity-verified-message">
                Cuenta verificada: {verifiedUser.nombreCompleto ?? verifiedUser.fullName}
              </span>
              <label>
                Nueva contraseña
                <span className="password-control">
                  <input
                    autoComplete="new-password"
                    placeholder="Ingrese su nueva contraseña"
                    type={isNewPasswordVisible ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(event) => updatePasswordField('newPassword', event.target.value)}
                  />
                  <button
                    aria-label={
                      isNewPasswordVisible ? 'Ocultar nueva contraseña' : 'Mostrar nueva contraseña'
                    }
                    className="password-toggle"
                    type="button"
                    onClick={() => setIsNewPasswordVisible((currentValue) => !currentValue)}
                  >
                    {isNewPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </span>
              </label>
              <label>
                Confirmar nueva contraseña
                <span className="password-control">
                  <input
                    autoComplete="new-password"
                    placeholder="Repita su nueva contraseña"
                    type={isConfirmPasswordVisible ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(event) =>
                      updatePasswordField('confirmPassword', event.target.value)
                    }
                  />
                  <button
                    aria-label={
                      isConfirmPasswordVisible
                        ? 'Ocultar confirmación de contraseña'
                        : 'Mostrar confirmación de contraseña'
                    }
                    className="password-toggle"
                    type="button"
                    onClick={() =>
                      setIsConfirmPasswordVisible((currentValue) => !currentValue)
                    }
                  >
                    {isConfirmPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </span>
              </label>
              <button
                className="primary-button register-primary-button"
                type="button"
                onClick={updatePassword}
              >
                Actualizar contraseña
              </button>
            </section>
          )}

          {formError && <p className="login-error">{formError}</p>}
          {formSuccess && (
            <>
              <p className="login-success">{formSuccess}</p>
              <button className="primary-button" type="button" onClick={() => onLogin()}>
                Ir a iniciar sesión
              </button>
            </>
          )}
        </form>

        <p className="login-footer">
          <button type="button" onClick={() => onLogin()}>
            Volver a iniciar sesión
          </button>
        </p>
      </div>

      <div className="login-art-side" aria-hidden="true" />
    </section>
  );
}

function VecinoRegisterPage({ onBack, onLogin }) {
  const [formData, setFormData] = useState(emptyCitizenRegister);
  const [formError, setFormError] = useState('');
  const [identityResult, setIdentityResult] = useState(null);
  const [identityMessage, setIdentityMessage] = useState('');
  const [isSearchingIdentity, setIsSearchingIdentity] = useState(false);
  const [isSubmittingRegister, setIsSubmittingRegister] = useState(false);

  function updateField(field, value) {
    const nextValue = field === 'dni' ? value.replace(/\D/g, '').slice(0, 8) : value;

    setFormData((currentData) => ({
      ...currentData,
      [field]: nextValue,
    }));
    setFormError('');

    if (field === 'dni') {
      setIdentityResult(null);
      setIdentityMessage('');
    }
  }

  async function searchIdentity() {
    const dni = formData.dni.trim();

    if (!/^\d{8}$/.test(dni)) {
      setFormError('Ingresa un DNI válido de 8 dígitos.');
      return;
    }

    setFormError('');
    setIdentityMessage('');
    setIdentityResult(null);
    setIsSearchingIdentity(true);

    try {
      const identity = await consultarIdentidadRegistroVecino(dni);

      setIdentityResult({
        apellidos: '',
        dni: identity.dni ?? dni,
        nombreCompleto: identity.nombreCompleto ?? '',
        nombres: identity.nombreCompleto ?? '',
      });
      setIdentityMessage('');
    } catch (error) {
      setIdentityResult(null);
      setIdentityMessage(getApiErrorMessage(error, 'No se encontraron datos para el DNI ingresado.'));
    } finally {
      setIsSearchingIdentity(false);
    }
  }
  function validateRegisterForm() {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.dni.trim()) {
      return 'Ingresa tu DNI.';
    }

    if (!/^\d{8}$/.test(formData.dni.trim())) {
      return 'Ingresa un DNI válido de 8 dígitos.';
    }

    if (!identityResult) {
      return 'Busca y valida tu identidad antes de crear la cuenta.';
    }

    if (!formData.fechaNacimiento) {
      return 'Selecciona tu fecha de nacimiento.';
    }

    if (!formData.correo.trim()) {
      return 'Ingresa tu correo electrónico.';
    }

    if (!emailPattern.test(formData.correo.trim())) {
      return 'Ingresa un correo electrónico válido.';
    }

    if (!formData.celular.trim()) {
      return 'Ingresa tu número de celular.';
    }



    if (!formData.acceptsDataUse) {
      return 'Debes aceptar el uso de tus datos para crear la cuenta.';
    }

    return '';
  }

  async function submitRegister(event) {
    event.preventDefault();

    const validationMessage = validateRegisterForm();

    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    const payload = {
      aceptaTratamientoDatos: formData.acceptsDataUse,
      celular: formData.celular.trim(),
      dni: formData.dni.trim(),
      email: formData.correo.trim(),
      fechaNacimiento: formData.fechaNacimiento,
      nombreCompleto: identityResult.nombreCompleto,
    };

    setIsSubmittingRegister(true);

    try {
      const response = await registrarVecinoPublico(payload);
      onLogin(response?.mensaje || '¡Cuenta creada! Te enviamos un correo de confirmación. Revisa tu bandeja de entrada para activar tu cuenta e iniciar sesión.');
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'No se pudo crear la cuenta vecinal.'));
    } finally {
      setIsSubmittingRegister(false);
    }
  }
  return (
    <section className="login-shell register-shell" aria-labelledby="register-title">
      <div className="login-form-side register-form-side">
        <button className="login-brand" type="button" onClick={onBack}>
          <img
            alt="Logo Municipalidad de San Miguel"
            className="municipality-logo brand-logo"
            src={municipalLogo}
          />
          <strong>Municipalidad de San Miguel</strong>
        </button>

        <form className="login-card register-card" onSubmit={submitRegister}>
          <button className="detail-back-link register-back-link" type="button" onClick={onBack}>
            <span aria-hidden="true">←</span>
            Volver a eventos
          </button>

          <div className="login-title">
            <span>Portal de eventos</span>
            <h1 id="register-title">Crear cuenta vecinal</h1>
            <p>Regístrate para reservar tu lugar en las actividades municipales.</p>
          </div>

          <div className="register-fields-grid">
            <label className="register-dni-field">
              DNI
              <span className="dni-search-control">
                <input
                  autoComplete="off"
                  inputMode="numeric"
                  maxLength={8}
                  placeholder="Ingrese su DNI"
                  type="text"
                  value={formData.dni}
                  onChange={(event) => updateField('dni', event.target.value)}
                />
                <LoadingButton
                  disabled={!/^\d{8}$/.test(formData.dni) || isSearchingIdentity || isSubmittingRegister}
                  loading={isSearchingIdentity}
                  loadingLabel="Buscando..."
                  type="button"
                  onClick={searchIdentity}
                >
                  {isSearchingIdentity ? 'Buscando...' : 'Buscar'}
                </LoadingButton>
              </span>
              {identityResult && (
                <span className="identity-verified-message">
                  Identidad verificada: {identityResult.nombreCompleto}
                </span>
              )}
              {!identityResult && identityMessage && (
                <span className="identity-error-message">{identityMessage}</span>
              )}
            </label>
            <label>
              Fecha de nacimiento
              <input
                autoComplete="bday"
                placeholder="Seleccione su fecha de nacimiento"
                type="date"
                value={formData.fechaNacimiento}
                onChange={(event) => updateField('fechaNacimiento', event.target.value)}
              />
            </label>
            <label>
              Correo electrónico
              <input
                autoComplete="email"
                placeholder="Ingrese su correo electrónico"
                type="email"
                value={formData.correo}
                onChange={(event) => updateField('correo', event.target.value)}
              />
            </label>
            <label>
              Celular
              <input
                autoComplete="tel"
                inputMode="tel"
                placeholder="Ingrese su número de celular"
                type="tel"
                value={formData.celular}
                onChange={(event) => updateField('celular', event.target.value)}
              />
            </label>

          </div>

          <label className="data-consent-control">
            <input
              type="checkbox"
              checked={formData.acceptsDataUse}
              onChange={(event) => updateField('acceptsDataUse', event.target.checked)}
            />
            <span>
              Acepto el uso de mis datos para gestionar mi participación en eventos
              municipales.
            </span>
          </label>

          {formError && <p className="login-error">{formError}</p>}

          <button className="primary-button register-primary-button" disabled={isSubmittingRegister} type="submit">
            {isSubmittingRegister ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>

          <p className="register-login-link">
            ¿Ya tienes cuenta?{' '}
            <button type="button" onClick={onLogin}>
              Inicia sesión
            </button>
          </p>
        </form>
      </div>

      <div className="login-art-side" aria-hidden="true" />
    </section>
  );
}

function EyeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M2.8 12s3.2-5.5 9.2-5.5S21.2 12 21.2 12 18 17.5 12 17.5 2.8 12 2.8 12Z" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M3.3 3.3 20.7 20.7" />
      <path d="M9.7 5.9A10.1 10.1 0 0 1 12 5.6c6 0 9.2 6.4 9.2 6.4a16.6 16.6 0 0 1-3 3.8" />
      <path d="M14.2 14.2A3 3 0 0 1 9.8 9.8" />
      <path d="M6.5 7.6A16.6 16.6 0 0 0 2.8 12s3.2 6.4 9.2 6.4c1.1 0 2.1-.2 3-.6" />
    </svg>
  );
}

function CalendarClockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M7 3v3M17 3v3M4 9h18M6 5h12a2 2 0 0 1 2 2v10.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
      <path d="M12 13v3l2 1" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M16 19v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V19" />
      <path d="M9.5 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM21 19v-1.2a3.5 3.5 0 0 0-2.7-3.4M16.5 4.4a3 3 0 0 1 0 5.8" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" />
    </svg>
  );
}
function PortalHome({
  categories,
  featuredEvent,
  filteredEvents,
  eventsPage,
  isLoading,
  loadError,
  searchTerm,
  selectedCategory,
  onCategoryChange,
  onEventSelect,
  onPageChange,
  onSearchChange,
  upcomingEvents,
}) {
  const featuredCoverUrl = featuredEvent ? getEventCoverUrl(featuredEvent) : '';
  const hasFeaturedEvent = Boolean(featuredEvent);
  const featuredKicker = featuredEvent?.state === 'EN_CURSO' ? 'Evento en curso' : 'Próximo evento';
  const currentPage = eventsPage?.number ?? 0;
  const totalPages = eventsPage?.totalPages ?? 0;
  const totalEvents = eventsPage?.totalElements ?? filteredEvents.length;
  const canGoPrevious = currentPage > 0;
  const canGoNext = totalPages > 0 && currentPage < totalPages - 1;

  return (
    <>
      <section className="hero-section" aria-labelledby="portal-title">
        <div className="hero-copy">
          <span className="section-kicker">Agenda municipal</span>
          <h1 id="portal-title">Encuentra actividades en San Miguel</h1>
          <p>
            Explora eventos culturales, deportivos y comunitarios organizados
            en San Miguel. Revisa cupos, horarios y lugares en un solo
            espacio.
          </p>
          <a className="agenda-jump-link" href="#agenda-eventos">
            Explorar agenda <span aria-hidden="true">↓</span>
          </a>
        </div>

        {hasFeaturedEvent && (<article
          aria-label={`Ver detalle de ${featuredEvent.title}`}
          className={`featured-event media-${featuredEvent.accent}`}
          role="button"
          tabIndex={0}
          onClick={() => onEventSelect(featuredEvent)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onEventSelect(featuredEvent);
            }
          }}
        >
          <div className="event-visual" aria-hidden="true">
            {featuredCoverUrl && <img alt="" src={featuredCoverUrl} />}
            <span style={{ color: '#0a56c2' }}>{featuredEvent.status}</span>
          </div>
          <div className="featured-content">
            <h3>{featuredEvent.title}</h3>
            <p>{getEventShortDescription(featuredEvent)}</p>
            <div className="featured-event-meta" aria-label={`Datos rápidos del ${featuredKicker.toLowerCase()}`}>
              <span>
                <CalendarClockIcon />
                {featuredEvent.date} · {featuredEvent.time}
              </span>
              {featuredEvent.capacityLabel && (
                <span>
                  <UsersIcon />
                  {featuredEvent.capacityLabel}
                </span>
              )}
            </div>
          </div>
        </article>)}
      </section>

      <span className="section-anchor" id="eventos" aria-hidden="true" />
      <section className="content-grid" id="agenda-eventos">
        <div className="events-area">
          <div className="section-heading">
            <div>
              <span className="section-kicker">Eventos disponibles</span>
              <h2>Agenda para ciudadanos</h2>
            </div>
            <p>{totalEvents} actividades encontradas</p>
          </div>

          <form className="search-panel agenda-search-panel" role="search">
            <label htmlFor="event-search">Buscar evento</label>
            <div className="search-control">
              <input
                id="event-search"
                type="search"
                placeholder="Ingresar nombre o lugar del evento"
                value={searchTerm}
                onChange={(event) => onSearchChange(event.target.value)}
              />
              <button aria-label="Buscar evento" type="submit" onClick={(event) => event.preventDefault()}>
                <SearchIcon />
                <span>Buscar</span>
              </button>
            </div>
          </form>

          <div className="category-tabs" aria-label="Filtrar por categoria">
            {categories.map((category) => (
              <button
                className={category === selectedCategory ? 'active' : ''}
                key={category}
                type="button"
                onClick={() => onCategoryChange(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {loadError && <p className="portal-inline-message" role="alert">{loadError}</p>}
          {isLoading && <p className="portal-inline-message">Cargando eventos publicados...</p>}

          <div className="events-list">
            {!isLoading && filteredEvents.length === 0 && (
              <article className="event-empty-state">
                <strong>No hay eventos publicados para los filtros seleccionados.</strong>
                <span>Prueba con otro nombre, lugar o categoria.</span>
              </article>
            )}
            {filteredEvents.map((event) => {
              const coverUrl = getEventCoverUrl(event);
              const shortDescription = getEventShortDescription(event);

              return (
              <article
                aria-label={`Ver detalle de ${event.title}`}
                className="event-card"
                key={event.id}
                role="button"
                tabIndex={0}
                onClick={() => onEventSelect(event)}
                onKeyDown={(keyboardEvent) => {
                  if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
                    keyboardEvent.preventDefault();
                    onEventSelect(event);
                  }
                }}
              >
                <div className={`event-card-media media-${event.accent}`}>
                  {coverUrl && <img alt="" src={coverUrl} />}
                </div>
                <div className="event-card-body">
                  <time>{event.date}</time>
                  <h3>{event.title}</h3>
                  <p>{shortDescription}</p>
                  <span>{event.venue}</span>
                </div>
                <div className="event-card-action">
                  <time>{event.time}</time>
                </div>
              </article>
              );
            })}
          </div>

          {totalPages > 1 && (
            <nav className="events-pagination" aria-label="Paginacion de eventos">
              <button
                disabled={!canGoPrevious || isLoading}
                type="button"
                onClick={() => onPageChange(currentPage - 1)}
              >
                Anterior
              </button>
              <span>Página {currentPage + 1} de {totalPages}</span>
              <button
                disabled={!canGoNext || isLoading}
                type="button"
                onClick={() => onPageChange(currentPage + 1)}
              >
                Siguiente
              </button>
            </nav>
          )}
        </div>

        <AgendaSidebar events={upcomingEvents} />
      </section>
    </>
  );
}

function AgendaSidebar({ events: upcomingEvents = [] }) {
  return (
    <aside className="sidebar" id="agenda" aria-label="Resumen de agenda">
      <section className="next-panel">
        <h2>Próximas fechas</h2>
        {upcomingEvents.slice(0, 3).map((event) => (
          <div className="mini-event" key={event.id}>
            <time>{event.date}</time>
            <span>{event.title}</span>
          </div>
        ))}
      </section>
    </aside>
  );
}


function ConfirmRegistrationModal({ error = '', eventTitle, isSubmitting = false, onCancel, onConfirm }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section
        aria-labelledby="confirm-registration-title"
        aria-modal="true"
        className="confirm-modal"
        role="dialog"
      >
        <span className="section-kicker">Confirmar inscripci&oacute;n</span>
        <h2 id="confirm-registration-title">
          &iquest;Est&aacute;s seguro de inscribirte al evento "{eventTitle}"?
        </h2>
        <p>
          Al confirmar se generar&aacute; tu constancia de inscripci&oacute;n usando los datos
          de tu perfil ciudadano.
        </p>
        {error && <p className="modal-inline-error" role="alert">{error}</p>}
        <div className="modal-actions">
          <button className="back-button" disabled={isSubmitting} type="button" onClick={onCancel}>
            Volver al evento
          </button>
          <LoadingButton
            className="primary-button"
            loading={isSubmitting}
            loadingLabel="Inscribiendo..."
            type="button"
            onClick={onConfirm}
          >
            S&iacute;, inscribirme
          </LoadingButton>
        </div>
      </section>
    </div>
  );
}
function SessionExpiredModal({ message, onLogin }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section
        aria-labelledby="session-expired-title"
        aria-modal="true"
        className="confirm-modal login-required-modal"
        role="dialog"
      >
        <span className="section-kicker">Sesión expirada</span>
        <h2 id="session-expired-title">Vuelve a iniciar sesión</h2>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="primary-button" type="button" onClick={onLogin}>
            Iniciar sesión
          </button>
        </div>
      </section>
    </div>
  );
}

function LoginRequiredModal({ onCancel, onLogin, onRegister }) {
  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === 'Escape') {
        onCancel();
      }
    }

    window.addEventListener('keydown', closeOnEscape);

    return () => {
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [onCancel]);

  return (
    <div className="modal-backdrop" role="presentation" onClick={onCancel}>
      <section
        aria-labelledby="login-required-title"
        aria-modal="true"
        className="confirm-modal login-required-modal"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="section-kicker">Acceso requerido</span>
        <h2 id="login-required-title">Inicia sesi&oacute;n y reserva tu lugar</h2>
        <p>
          Accede con tu cuenta vecinal para confirmar tu participaci&oacute;n y
          guardar tus reservas de eventos municipales.
        </p>
        <div className="modal-actions">
          <button className="back-button" type="button" onClick={onCancel}>
            Cancelar
          </button>
          <button className="primary-button" type="button" onClick={onLogin}>
            Iniciar sesi&oacute;n
          </button>
        </div>
        <p className="login-required-register-link">
          ¿Aún no tienes cuenta?{' '}
          <button type="button" onClick={onRegister}>
            Crear cuenta vecinal
          </button>
        </p>
      </section>
    </div>
  );
}

function RegistrationReceipt({ event, receiptCode, qrDataUrl, qrError, registration, user, onBack, onPrint }) {
  const participantName =
    registration.fullName ||
    user?.nombreCompleto ||
    [user?.nombres, user?.apellidos].filter(Boolean).join(' ') ||
    'Sergio André Bustamante Villanueva';
  const participantDni = registration.documentNumber || user?.dni || '12345678';
  const requiresAttendanceControl = event.requiresAttendanceControl !== false;

  function downloadReceipt() {
    // TODO: conectar con endpoint de descarga de constancia cuando exista backend.
    onPrint();
  }

  return (
    <section className="receipt-shell" aria-labelledby="receipt-title">
      <article className="receipt-card">
        <header className="receipt-header">
          <div>
            <span className="section-kicker">Constancia de inscripción</span>
            <h1 id="receipt-title">Inscripción confirmada</h1>
            <p>
              {requiresAttendanceControl
                ? 'Tu reserva fue registrada correctamente. Presenta el codigo QR el dia del evento.'
                : 'Tu reserva fue registrada correctamente. Conserva este codigo como constancia.'}
            </p>
          </div>
          {requiresAttendanceControl && (
            qrDataUrl ? (
              <img
                alt={`Codigo QR de la inscripcion ${receiptCode}`}
                className="qr-preview"
                src={qrDataUrl}
              />
            ) : (
              <div className="qr-preview qr-placeholder" role="status">
                <span>{qrError || 'QR no disponible'}</span>
              </div>
            )
          )}
        </header>

        <div className="receipt-code">
          <span>Código de inscripción:</span>
          <strong>{receiptCode}</strong>
        </div>

        <dl className="receipt-details">
          <div>
            <dt>Participante</dt>
            <dd>{participantName}</dd>
          </div>
          <div>
            <dt>DNI</dt>
            <dd>{participantDni}</dd>
          </div>
          <div>
            <dt>Evento</dt>
            <dd>{event.title}</dd>
          </div>
          <div>
            <dt>Fecha y hora</dt>
            <dd>
              {event.date} - {event.time}
            </dd>
          </div>
          <div>
            <dt>Lugar</dt>
            <dd>{event.venue}</dd>
          </div>
          <div>
            <dt>Dirección</dt>
            <dd>{event.address}</dd>
          </div>
        </dl>

        <div className="receipt-note">
          <p>Se envió una constancia a tu correo electrónico.</p>
        </div>

        <div className="receipt-actions no-print">
          <button className="detail-back-link receipt-back-link" type="button" onClick={onBack}>
            <span aria-hidden="true">←</span>
            Volver a eventos
          </button>
          <button
            className="receipt-download-link"
            type="button"
            onClick={downloadReceipt}
          >
            <DownloadIcon />
            Descargar constancia
          </button>
        </div>
      </article>
    </section>
  );
}

function DownloadIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 3v11" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 20h14" />
    </svg>
  );
}

export default PublicPortal;
