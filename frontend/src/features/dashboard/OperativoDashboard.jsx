import { useEffect, useMemo, useRef, useState } from 'react';
import municipalLogo from '../../assets/images/municipalidad-logo.png';
import { getApiErrorMessage } from '../../services/api/api';
import {
  anularAsistenciaOperativo,
  consultarIdentidadInscripcionManualOperativo,
  getEventosOperativoHoy,
  registrarInscripcionManualOperativo,
  validarAsistenciaManualOperativo,
  validarQrOperativoImagen,
} from '../../services/dashboardService';
import { DashboardSkeleton, ErrorState } from '../../components/feedback/LoadingStates';
import './AdminDashboard.css';
import './OperativoDashboard.css';

const fallbackOperativeUser = {
  id: 'operativo-1',
  fullName: 'Carlos Ramirez',
  role: 'OPERATIVO',
};

const allowedQrImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

function isAllowedQrImageFile(file) {
  return file && allowedQrImageTypes.has(file.type);
}

async function imageFileToPngBlob(file) {
  if (!isAllowedQrImageFile(file)) {
    throw new Error('Solo se permiten imagenes JPG, PNG o WebP.');
  }

  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext('2d');
  context.drawImage(bitmap, 0, 0);
  bitmap.close?.();

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('No se pudo procesar la imagen del QR.'));
        return;
      }

      resolve(new File([blob], 'qr-upload.png', { type: 'image/png' }));
    }, 'image/png');
  });
}

function splitDniFullName(fullName) {
  const parts = String(fullName ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length <= 2) {
    return {
      lastNames: parts.slice(1).join(' '),
      names: parts[0] ?? '',
    };
  }

  return {
    lastNames: parts.slice(-2).join(' '),
    names: parts.slice(0, -2).join(' '),
  };
}
function canvasToPngFile(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('No se pudo capturar la imagen de la camara.'));
        return;
      }

      resolve(new File([blob], 'qr-camera.png', { type: 'image/png' }));
    }, 'image/png');
  });
}
function getOperativeUserInitials(name) {
  const nameParts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (nameParts.length === 0) {
    return 'OP';
  }

  return `${nameParts[0][0] ?? ''}${nameParts.at(-1)?.[0] ?? ''}`.toUpperCase();
}

function formatOperativeUserRole(role) {
  return role === 'OPERATIVO' ? 'Operativo' : role ?? 'Operativo';
}

function parseEventDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function isSameLocalDay(firstDate, secondDate) {
  return (
    firstDate?.getFullYear() === secondDate.getFullYear() &&
    firstDate?.getMonth() === secondDate.getMonth() &&
    firstDate?.getDate() === secondDate.getDate()
  );
}

function getEventControlRange(event) {
  return {
    end: parseEventDate(event.eventEndAt ?? event.operativeEndAt ?? event.endAt),
    start: parseEventDate(event.eventStartAt ?? event.operativeStartAt ?? event.startAt),
  };
}

function isOperativeWindowActive(event, now) {
  const { end, start } = getEventControlRange(event);

  if (!start || !end) {
    return Boolean(event.ventanaOperativaActiva ?? event.operativeWindowActive);
  }

  const operativeStart = new Date(start.getTime() - 60 * 60 * 1000);
  const operativeEnd = new Date(end.getTime() + 30 * 60 * 1000);

  return now >= operativeStart && now <= operativeEnd;
}

function getEventSelectionRank(event, now) {
  const { end, start } = getEventControlRange(event);

  if (start && end && now >= start && now <= end) {
    return 0;
  }

  if (end) {
    const operativeEnd = new Date(end.getTime() + 30 * 60 * 1000);

    if (now > end && now <= operativeEnd) {
      return 1;
    }
  }

  if (start && now <= start) {
    return 2;
  }

  return 3;
}

function compareOperativeEvents(firstEvent, secondEvent, now) {
  const firstRank = getEventSelectionRank(firstEvent, now);
  const secondRank = getEventSelectionRank(secondEvent, now);

  if (firstRank !== secondRank) {
    return firstRank - secondRank;
  }

  const firstStart = getEventControlRange(firstEvent).start?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const secondStart = getEventControlRange(secondEvent).start?.getTime() ?? Number.MAX_SAFE_INTEGER;

  return firstStart - secondStart || (firstEvent.id ?? 0) - (secondEvent.id ?? 0);
}
function getOperativeState(event, now) {
  const { end, start } = getEventControlRange(event);

  if (event.state === 'EN_CURSO') {
    return 'EN_CURSO';
  }

  if (start && end && now >= start && now <= end) {
    return 'EN_CURSO';
  }

  return event.state;
}

function getOperativeStatusLabel(event, now) {
  const { end, start } = getEventControlRange(event);

  if (end && now > end) {
    return 'Finalizado';
  }

  if (start && now < start) {
    return 'Aún no inicia';
  }

  if (event.operativeState === 'EN_CURSO' || (start && end && now >= start && now <= end)) {
    return 'En validación';
  }

  return event.state === 'PUBLICADO' ? 'Aún no inicia' : 'En validación';
}

function formatEventTimeRange(event) {
  const { end, start } = getEventControlRange(event);

  if (!start || !end) {
    return event.time ?? 'Horario por confirmar';
  }

  return `${start.toLocaleTimeString('es-PE', {
    hour: 'numeric',
    minute: '2-digit',
  })} - ${end.toLocaleTimeString('es-PE', {
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}

function isEventToday(event, now) {
  const { end, start } = getEventControlRange(event);

  if (!start && !end) {
    return false;
  }

  if (!start || !end) {
    return isSameLocalDay(start ?? end, now);
  }

  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  return start < dayEnd && end >= dayStart;
}

function buildOperativeEvent(event, now) {
  const registered = event.registered ?? Math.max(Math.round((event.spots ?? 0) * 0.82), 0);
  const qrValidated = event.qrValidated ?? Math.round(registered * 0.42);
  const manualValidated = event.manualValidated ?? Math.round(registered * 0.08);
  const revokedQr = event.revokedQr ?? 1;
  const expiredQr = event.expiredQr ?? 2;

  return {
    ...event,
    operativeState: getOperativeState(event, now),
    operativeWindowActive: isOperativeWindowActive(event, now),
    expiredQr,
    manualValidated,
    pendingAccess: Math.max(registered - qrValidated - manualValidated, 0),
    qrValidated,
    registered,
    revokedQr,
    totalValidated: qrValidated + manualValidated,
  };
}

const operativeSectionIds = [
  'control-acceso',
  'validacion-manual',
  'inscripcion-manual',
  'validaciones-recientes',
];

function buildValidationFeedback(type, detail = {}) {
  const feedbackMap = {
    CLOSED: {
      message: 'El evento no está disponible para validación.',
      title: 'Evento cerrado',
      tone: 'error',
    },
    DUPLICATE: {
      message: 'Esta asistencia ya fue validada anteriormente.',
      title: 'Asistencia duplicada',
      tone: 'warning',
    },
    FULL: {
      message: 'El evento no tiene cupos disponibles.',
      title: 'Sin cupos',
      tone: 'warning',
    },
    NOT_FOUND: {
      message: 'No se encontró una inscripción asociada al código ingresado.',
      title: 'Código no encontrado',
      tone: 'error',
    },
    OTHER_EVENT: {
      message: 'El código pertenece a otro evento.',
      title: 'Evento no autorizado',
      tone: 'info',
    },
    SUCCESS: {
      message: 'Asistencia validada correctamente.',
      title: 'Validación exitosa',
      tone: 'success',
    },
    ANNULLED: {
      message: 'La validación fue anulada y se conservó la trazabilidad del registro.',
      title: 'Validación anulada',
      tone: 'info',
    },
  };

  return {
    ...feedbackMap[type],
    citizenName: detail.citizenName,
    code: detail.code,
    source: detail.source ?? 'scanner',
  };
}

function OperativoDashboard({ onLogout, user }) {
  const operativeUser = user?.id ? user : { ...fallbackOperativeUser, ...user };
  const operativeUserName =
    operativeUser.fullName || operativeUser.name || fallbackOperativeUser.fullName;
  const [now, setNow] = useState(() => new Date());
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarDrawerOpen, setIsSidebarDrawerOpen] = useState(false);
  const [activeOperativeSection, setActiveOperativeSection] = useState('control-acceso');
  const [operativeEventsData, setOperativeEventsData] = useState([]);
  const [isLoadingOperativeEvents, setIsLoadingOperativeEvents] = useState(true);
  const [operativeEventsError, setOperativeEventsError] = useState('');
  const [operativeEventsReloadKey, setOperativeEventsReloadKey] = useState(0);
  const operativeEvents = useMemo(
    () =>
      operativeEventsData
        .filter((event) => isEventToday(event, now) && event.state !== 'CANCELADO')
        .sort((firstEvent, secondEvent) => compareOperativeEvents(firstEvent, secondEvent, now))
        .map((event) => buildOperativeEvent(event, now)),
    [now, operativeEventsData],
  );
  const activeOperativeEvent =
    operativeEvents.find((event) => event.operativeState === 'EN_CURSO') ??
    operativeEvents.find((event) => event.operativeWindowActive) ??
    operativeEvents[0] ??
    null;
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [scannerStatus, setScannerStatus] = useState('idle');
  const [isCameraScannerActive, setIsCameraScannerActive] = useState(false);
  const [isQrValidationLoading, setIsQrValidationLoading] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const cameraScanIntervalRef = useRef(null);
  const qrValidationInFlightRef = useRef(false);
  const [isManualRegistrationOpen, setIsManualRegistrationOpen] = useState(false);
  const [manualRegistrationIdentity, setManualRegistrationIdentity] = useState(null);
  const [manualRegistrationIdentityMessage, setManualRegistrationIdentityMessage] = useState('');
  const [manualRegistrationContactOptions, setManualRegistrationContactOptions] = useState({ email: false, phone: false });
  const [isSearchingManualRegistrationDni, setIsSearchingManualRegistrationDni] = useState(false);
  const [validationFeedback, setValidationFeedback] = useState(null);
  const [validations, setValidations] = useState([]);
  const [pendingOperativeAction, setPendingOperativeAction] = useState(null);
  const [pendingOperativePayload, setPendingOperativePayload] = useState(null);
  const [isManualActionLoading, setIsManualActionLoading] = useState(false);
  const [pendingAnnulment, setPendingAnnulment] = useState(null);
  const [isAnnulmentLoading, setIsAnnulmentLoading] = useState(false);
  const [operativeValidationIssue, setOperativeValidationIssue] = useState(null);
  const selectedEvent =
    operativeEvents.find((event) => event.id === selectedEventId) ??
    activeOperativeEvent;
  const hasAuthorizedEvent = Boolean(selectedEvent);
  const isOperativeWindowAvailable = Boolean(selectedEvent?.operativeWindowActive);
  const validValidationCount = selectedEvent?.totalValidated ?? validations.filter(
    (validation) => validation.status === 'VALIDADA',
  ).length;
  const qrValidationCount = selectedEvent?.qrValidated ?? validations.filter(
    (validation) => validation.status === 'VALIDADA' && validation.method === 'QR',
  ).length;
  const manualValidationCount = selectedEvent?.manualValidated ?? validations.filter(
    (validation) => validation.status === 'VALIDADA' && validation.method === 'MANUAL',
  ).length;
  const registeredCount = selectedEvent?.registered ?? 0;
  const pendingAccessCount = selectedEvent?.pendingAccess ?? Math.max(registeredCount - validValidationCount, 0);
  const aforoMaximo = selectedEvent?.aforoMaximo ?? null;
  const hasCapacityControl = aforoMaximo !== null && aforoMaximo !== undefined;
  const availableCapacity = hasCapacityControl
    ? Math.max(aforoMaximo - validValidationCount, 0)
    : null;
  const manualRegistrationRequiresAdditionalData = Boolean(manualRegistrationIdentity && !manualRegistrationIdentity.registeredPlatform);
  const isManualRegistrationPlatformNeighbor = Boolean(manualRegistrationIdentity?.registeredPlatform);

  useEffect(() => {
    const timerId = window.setInterval(() => setNow(new Date()), 60_000);

    return () => window.clearInterval(timerId);
  }, []);
  useEffect(() => {
    if (operativeEvents.length === 0) {
      setSelectedEventId(null);
      return;
    }

    if (!selectedEventId || !operativeEvents.some((event) => event.id === selectedEventId)) {
      setSelectedEventId(activeOperativeEvent?.id ?? operativeEvents[0].id);
    }
  }, [activeOperativeEvent?.id, operativeEvents, selectedEventId]);
  useEffect(() => {
    setValidations(Array.isArray(selectedEvent?.recentValidations) ? selectedEvent.recentValidations : []);
  }, [selectedEvent?.id, selectedEvent?.recentValidations]);

  useEffect(() => {
    if (!isCameraScannerActive || !videoRef.current || !cameraStreamRef.current) {
      return undefined;
    }

    videoRef.current.srcObject = cameraStreamRef.current;
    videoRef.current.play().catch(() => undefined);
    cameraScanIntervalRef.current = window.setInterval(() => {
      captureCameraFrame().catch(() => undefined);
    }, 1400);

    return () => {
      if (cameraScanIntervalRef.current) {
        window.clearInterval(cameraScanIntervalRef.current);
        cameraScanIntervalRef.current = null;
      }
    };
    // La captura usa refs mutables para evitar reiniciar el intervalo en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCameraScannerActive, selectedEvent?.id]);

  useEffect(() => () => {
    stopCameraScanner();
  }, []);

  useEffect(() => {
    let isMounted = true;

    setIsLoadingOperativeEvents(true);
    setOperativeEventsError('');

    getEventosOperativoHoy()
      .then((data) => {
        if (!isMounted) {
          return;
        }

        setOperativeEventsData(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setOperativeEventsData([]);
        setOperativeEventsError(getApiErrorMessage(error, 'No se pudieron cargar tus eventos asignados.'));
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingOperativeEvents(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [operativeEventsReloadKey]);

  useEffect(() => {
    if (!isSidebarDrawerOpen) {
      return undefined;
    }

    function closeDrawerOnEscape(event) {
      if (event.key === 'Escape') {
        setIsSidebarDrawerOpen(false);
      }
    }

    document.addEventListener('keydown', closeDrawerOnEscape);

    return () => document.removeEventListener('keydown', closeDrawerOnEscape);
  }, [isSidebarDrawerOpen]);

  useEffect(() => {
    if (!hasAuthorizedEvent) {
      return undefined;
    }

    const observedSections = operativeSectionIds
      .map((sectionId) => document.getElementById(sectionId))
      .filter(Boolean);

    if (observedSections.length === 0) {
      return undefined;
    }

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((firstEntry, secondEntry) =>
            firstEntry.boundingClientRect.top - secondEntry.boundingClientRect.top,
          )[0];

        if (visibleEntry?.target?.id) {
          setActiveOperativeSection(visibleEntry.target.id);
        }
      },
      {
        rootMargin: '-24% 0px -58% 0px',
        threshold: [0.1, 0.35],
      },
    );

    observedSections.forEach((section) => sectionObserver.observe(section));

    return () => sectionObserver.disconnect();
  }, [hasAuthorizedEvent, isManualRegistrationOpen]);

  function navigateOperativeSection(sectionId) {
    closeSidebarDrawer();
    setActiveOperativeSection(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  function toggleSidebarControl() {
    if (window.matchMedia('(max-width: 1024px)').matches) {
      setIsSidebarDrawerOpen((isOpen) => !isOpen);
      return;
    }

    setIsSidebarCollapsed((isCollapsed) => !isCollapsed);
  }

  function closeSidebarDrawer() {
    setIsSidebarDrawerOpen(false);
  }

  function handleOperativeBrandClick() {
    closeSidebarDrawer();
    window.history.pushState(null, '', '/operativo');
    setActiveOperativeSection('control-acceso');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function startCameraScanner() {
    if (!hasAuthorizedEvent || !isOperativeWindowAvailable) {
      setValidationFeedback(buildValidationFeedback('CLOSED', { source: 'scanner' }));
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setValidationFeedback({
        ...buildValidationFeedback('NOT_FOUND', { source: 'scanner' }),
        message: 'El navegador no permite usar la camara para escanear el QR.',
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' } },
      });
      cameraStreamRef.current = stream;
      setIsCameraScannerActive(true);
      setScannerStatus('scanning');
      setValidationFeedback(null);
    } catch {
      setValidationFeedback({
        ...buildValidationFeedback('NOT_FOUND', { source: 'scanner' }),
        message: 'No se pudo acceder a la camara del dispositivo.',
      });
      setScannerStatus('idle');
    }
  }

  function stopCameraScanner() {
    if (cameraScanIntervalRef.current) {
      window.clearInterval(cameraScanIntervalRef.current);
      cameraScanIntervalRef.current = null;
    }

    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraScannerActive(false);
    qrValidationInFlightRef.current = false;
  }

  async function validateQrImageFile(file, source = 'scanner', { silentNoQr = false } = {}) {
    if (!hasAuthorizedEvent || !selectedEvent?.id || !isOperativeWindowAvailable) {
      setValidationFeedback(buildValidationFeedback('CLOSED', { source }));
      return;
    }

    if (qrValidationInFlightRef.current) {
      return;
    }

    qrValidationInFlightRef.current = true;
    setIsQrValidationLoading(true);

    try {
      const result = await validarQrOperativoImagen(selectedEvent.id, file);
      const feedback = {
        title: result.title,
        message: result.message,
        tone: result.tone,
        citizenName: result.citizenName,
        code: result.code,
        source,
      };
      setValidationFeedback(feedback);
      setScannerStatus(result.status === 'SUCCESS' ? 'success' : 'idle');

      if (result.status === 'SUCCESS') {
        stopCameraScanner();
        setOperativeEventsReloadKey((currentKey) => currentKey + 1);
      }
    } catch (error) {
      const message = getApiErrorMessage(error, 'No se pudo validar el QR.');
      if (silentNoQr && message.toLowerCase().includes('qr')) {
        return;
      }

      setValidationFeedback({
        ...buildValidationFeedback('NOT_FOUND', { source }),
        message,
      });
      setScannerStatus('idle');
    } finally {
      qrValidationInFlightRef.current = false;
      setIsQrValidationLoading(false);
    }
  }

  async function captureCameraFrame() {
    if (!isCameraScannerActive || qrValidationInFlightRef.current || !videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || video.videoWidth === 0) {
      return;
    }

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageFile = await canvasToPngFile(canvas);
    await validateQrImageFile(imageFile, 'scanner', { silentNoQr: true });
  }

  async function handleQrImageUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    try {
      const pngFile = await imageFileToPngBlob(file);
      await validateQrImageFile(pngFile, 'scanner');
    } catch (error) {
      setValidationFeedback({
        ...buildValidationFeedback('NOT_FOUND', { source: 'scanner' }),
        message: error.message || 'No se pudo procesar la imagen del QR.',
      });
      setScannerStatus('idle');
    }
  }

  async function lookupManualRegistrationDni(dni) {
    const normalizedDni = String(dni ?? '').replace(/\D/g, '').slice(0, 8);

    if (!/^\d{8}$/.test(normalizedDni)) {
      setManualRegistrationIdentity(null);
      setManualRegistrationIdentityMessage('Ingresa un DNI válido de 8 dígitos.');
      return;
    }

    setIsSearchingManualRegistrationDni(true);
    resetManualRegistrationIdentity();

    try {
      const identity = await consultarIdentidadInscripcionManualOperativo(normalizedDni);
      const fullName = identity?.fullName ?? '';

      if (!fullName) {
        setManualRegistrationIdentityMessage('No se encontraron datos para el DNI ingresado.');
        return;
      }

      setManualRegistrationIdentity({
        dni: normalizedDni,
        existingNeighbor: Boolean(identity.existingNeighbor),
        fullName,
        lastNames: identity.lastNames ?? '',
        names: identity.names ?? '',
        registeredPlatform: Boolean(identity.registeredPlatform),
      });
      setManualRegistrationIdentityMessage(
        identity.registeredPlatform
          ? `Cuenta vecinal verificada: ${fullName}`
          : `Identidad verificada: ${fullName}`,
      );
    } catch (error) {
      setManualRegistrationIdentity(null);
      setManualRegistrationIdentityMessage(getApiErrorMessage(error, 'No se pudo consultar el DNI.'));
    } finally {
      setIsSearchingManualRegistrationDni(false);
    }
  }

  function resetManualRegistrationIdentity() {
    setManualRegistrationIdentity(null);
    setManualRegistrationIdentityMessage('');
    resetManualRegistrationContactOptions();
  }

  function resetManualRegistrationContactOptions() {
    setManualRegistrationContactOptions({ email: false, phone: false });
  }

  function resetScanner() {
    stopCameraScanner();
    setScannerStatus('idle');
    setValidationFeedback(null);
  }

  function validateManualAttendance(event) {
    event.preventDefault();

    if (!hasAuthorizedEvent || !isOperativeWindowAvailable) {
      setValidationFeedback(buildValidationFeedback('CLOSED', { source: 'manual' }));
      return;
    }

    const formData = new FormData(event.currentTarget);
    const missingFields = [];

    const manualIdentifier = formData.get('manualCode')?.trim() ?? '';

    if (!manualIdentifier) {
      missingFields.push('DNI o código de inscripción');
    }

    if (/^\d+$/.test(manualIdentifier) && manualIdentifier.length !== 8) {
      missingFields.push('DNI de 8 dígitos o código de inscripción completo');
    }

    if (!formData.get('manualReason')) {
      missingFields.push('Motivo de validación');
    }

    if (missingFields.length > 0) {
      setOperativeValidationIssue({
        fields: missingFields,
        title: 'Completa los datos de validación manual',
      });
      return;
    }

    setPendingOperativePayload({
      identifier: manualIdentifier,
      reason: formData.get('manualReason'),
    });
    setPendingOperativeAction('manual-validation');
  }

  function validateManualRegistration(event) {
    event.preventDefault();

    if (!hasAuthorizedEvent || !isOperativeWindowAvailable) {
      setValidationFeedback(buildValidationFeedback('CLOSED', { source: 'manual' }));
      return;
    }

    const formData = new FormData(event.currentTarget);
    const requiredFields = [
      ['manualDni', 'DNI'],
    ];
    const missingFields = requiredFields
      .filter(([field]) => !formData.get(field)?.trim())
      .map(([, label]) => label);
    const hasPhone = Boolean(formData.get('manualHasPhone'));
    const hasEmail = Boolean(formData.get('manualHasEmail'));
    const manualPhone = formData.get('manualPhone')?.trim() ?? '';
    const manualEmail = formData.get('manualEmail')?.trim() ?? '';

    const requiresAdditionalManualData = !manualRegistrationIdentity?.registeredPlatform;

    if (requiresAdditionalManualData && hasPhone && !manualPhone) {
      missingFields.push('Celular');
    }

    if (requiresAdditionalManualData && hasEmail && !manualEmail) {
      missingFields.push('Correo');
    }

    if (!manualRegistrationIdentity || manualRegistrationIdentity.dni !== formData.get('manualDni')?.trim()) {
      missingFields.push('Buscar y validar DNI');
    }

    if (requiresAdditionalManualData && !formData.get('manualDataConsent')) {
      missingFields.push('Aceptacion de tratamiento de datos');
    }

    if (missingFields.length > 0) {
      setOperativeValidationIssue({
        fields: missingFields,
        title: 'Completa los datos de inscripción manual',
      });
      return;
    }

    setPendingOperativePayload({
      aceptaTratamientoDatos: requiresAdditionalManualData ? Boolean(formData.get('manualDataConsent')) : null,
      dni: formData.get('manualDni')?.trim(),
      email: requiresAdditionalManualData && hasEmail ? manualEmail : null,
      lastNames: manualRegistrationIdentity.lastNames,
      names: manualRegistrationIdentity.names,
      phone: requiresAdditionalManualData && hasPhone ? manualPhone : null,
    });
    setPendingOperativeAction('manual-registration');
  }

  async function confirmOperativeAction() {
    if (!pendingOperativeAction || !pendingOperativePayload || !selectedEvent?.id) {
      setPendingOperativeAction(null);
      setPendingOperativePayload(null);
      return;
    }

    if (!isOperativeWindowAvailable) {
      setValidationFeedback(buildValidationFeedback('CLOSED', { source: 'manual' }));
      setPendingOperativeAction(null);
      setPendingOperativePayload(null);
      return;
    }

    setIsManualActionLoading(true);

    try {
      const result = pendingOperativeAction === 'manual-registration'
        ? await registrarInscripcionManualOperativo(selectedEvent.id, pendingOperativePayload)
        : await validarAsistenciaManualOperativo(selectedEvent.id, pendingOperativePayload);

      setValidationFeedback({
        title: result.title,
        message: result.message,
        tone: result.tone,
        citizenName: result.citizenName,
        code: result.code,
        source: 'manual',
      });

      if (result.status === 'SUCCESS') {
        setOperativeEventsReloadKey((currentKey) => currentKey + 1);
        if (pendingOperativeAction === 'manual-registration') {
          setIsManualRegistrationOpen(false);
          resetManualRegistrationIdentity();
          resetManualRegistrationContactOptions();
        }
      }
    } catch (error) {
      setValidationFeedback({
        ...buildValidationFeedback('NOT_FOUND', { source: 'manual' }),
        message: getApiErrorMessage(error, 'No se pudo completar la validacion manual.'),
      });
    } finally {
      setIsManualActionLoading(false);
      setPendingOperativeAction(null);
      setPendingOperativePayload(null);
    }
  }
  async function confirmAnnulment({ reason, detail }) {
    if (!pendingAnnulment || !selectedEvent?.id) {
      setPendingAnnulment(null);
      return;
    }

    if (!isOperativeWindowAvailable) {
      setValidationFeedback(buildValidationFeedback('CLOSED', { source: 'manual' }));
      setPendingAnnulment(null);
      return;
    }

    setIsAnnulmentLoading(true);

    try {
      const result = await anularAsistenciaOperativo(selectedEvent.id, pendingAnnulment.id, {
        detail,
        reason,
      });
      const updatedValidation = result.validation ?? {
        ...pendingAnnulment,
        annulmentReason: reason === 'Otro' ? detail : reason,
        status: 'ANULADA',
      };

      setValidations((currentValidations) =>
        currentValidations.map((validation) =>
          validation.id === pendingAnnulment.id ? updatedValidation : validation,
        ),
      );
      setValidationFeedback({
        title: result.title,
        message: result.message,
        tone: result.tone,
        citizenName: result.citizenName,
        code: result.code,
        source: 'manual',
      });
      setOperativeEventsReloadKey((currentKey) => currentKey + 1);
    } catch (error) {
      setValidationFeedback({
        ...buildValidationFeedback('NOT_FOUND', { source: 'manual' }),
        message: getApiErrorMessage(error, 'No se pudo anular la asistencia.'),
      });
    } finally {
      setIsAnnulmentLoading(false);
      setPendingAnnulment(null);
    }
  }

  return (
    <section
      className={[
        'admin-shell operative-shell',
        isSidebarCollapsed ? 'is-sidebar-collapsed' : '',
        isSidebarDrawerOpen ? 'is-sidebar-drawer-open' : '',
      ].filter(Boolean).join(' ')}
      aria-labelledby="operative-title"
    >
      <button
        className="admin-mobile-menu-button"
        type="button"
        aria-label={isSidebarDrawerOpen ? 'Cerrar menú lateral' : 'Abrir menú lateral'}
        aria-expanded={isSidebarDrawerOpen}
        onClick={() => setIsSidebarDrawerOpen((isOpen) => !isOpen)}
      >
        <span aria-hidden="true" />
      </button>
      <button
        className="admin-sidebar-overlay"
        type="button"
        aria-label="Cerrar menú lateral"
        onClick={closeSidebarDrawer}
      />
      <aside className="admin-sidebar">
        <button
          className="sidebar-collapse-button"
          type="button"
          aria-label={
            isSidebarDrawerOpen
              ? 'Cerrar menú lateral'
              : isSidebarCollapsed
                ? 'Abrir menú lateral'
                : 'Cerrar menú lateral'
          }
          title={isSidebarCollapsed ? 'Abrir menú lateral' : 'Cerrar menú lateral'}
          onClick={toggleSidebarControl}
        >
          <span aria-hidden="true" />
        </button>

        <button className="admin-brand" type="button" onClick={handleOperativeBrandClick}>
          <img
            alt="Logo Municipalidad de San Miguel"
            className="municipality-logo brand-logo"
            src={municipalLogo}
          />
          <span>
            <strong>San Miguel</strong>
            <small>Panel operativo</small>
          </span>
        </button>

        <section className="admin-user-card" aria-label="Usuario autenticado">
          <span className="admin-user-avatar" aria-hidden="true">
            {getOperativeUserInitials(operativeUserName)}
          </span>
          <span className="admin-user-copy">
            <strong>{operativeUserName}</strong>
            <small>{formatOperativeUserRole(operativeUser.role)}</small>
          </span>
        </section>

        <nav className="admin-nav" aria-label="Navegacion operativa">
          {hasAuthorizedEvent && (
            <>
              <a
                className={activeOperativeSection === 'control-acceso' ? 'active' : ''}
                href="#control-acceso"
                onClick={(event) => {
                  event.preventDefault();
                  navigateOperativeSection('control-acceso');
                }}
              >
                Control de acceso
              </a>
              <a
                className={activeOperativeSection === 'inscripcion-manual' ? 'active' : ''}
                href="#inscripcion-manual"
                onClick={(event) => {
                  event.preventDefault();
                  navigateOperativeSection('inscripcion-manual');
                }}
              >
                Inscripción manual
              </a>
              <a
                className={activeOperativeSection === 'validaciones-recientes' ? 'active' : ''}
                href="#validaciones-recientes"
                onClick={(event) => {
                  event.preventDefault();
                  navigateOperativeSection('validaciones-recientes');
                }}
              >
                Validaciones
              </a>
            </>
          )}
          <button className="admin-nav-logout" type="button" onClick={onLogout}>
            Salir del panel
          </button>
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="section-kicker">Panel operativo</span>
            <h1 id="operative-title">Control de asistencia y aforo</h1>
          </div>
          {operativeEvents.length > 1 ? (
            <select
              className="operative-event-select"
              aria-label="Seleccionar evento operativo"
              value={selectedEvent?.id ?? ''}
              onChange={(event) => {
                setSelectedEventId(Number(event.target.value));
                resetScanner();
              }}
            >
              {operativeEvents.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
          ) : hasAuthorizedEvent ? (
            <span className="operative-active-event">{selectedEvent.title}</span>
          ) : null}
        </header>

        {isLoadingOperativeEvents ? (
          <DashboardSkeleton tableColumns={4} />
        ) : operativeEventsError ? (
          <ErrorState
            description={operativeEventsError}
            onRetry={() => setOperativeEventsReloadKey((key) => key + 1)}
          />
        ) : !hasAuthorizedEvent ? (
          <section className="admin-panel operative-empty-state" aria-live="polite">
            <span className="section-kicker">
              {isLoadingOperativeEvents ? 'Cargando asignaciones' : 'Sin asignación activa'}
            </span>
            <h2>
              {isLoadingOperativeEvents
                ? 'Cargando eventos asignados...'
                : 'No tienes eventos asignados para hoy.'}
            </h2>
            <p>
              {operativeEventsError || 'Cuando seas asignado a un evento publicado o en curso, podrás registrar asistencias desde este panel.'}
            </p>
          </section>
        ) : (
          <>
            <section className="admin-panel operative-event-summary" aria-label="Resumen del evento">
              <div className="operative-summary-main">
                <span className="section-kicker">Resumen del evento</span>
                <h2>{selectedEvent.title}</h2>
                <p>
                  {selectedEvent.date} · {formatEventTimeRange(selectedEvent)} · {selectedEvent.venue}
                </p>
              </div>

              <div className="operative-summary-status">
                <span className={`operative-status-badge is-${selectedEvent.operativeState === 'EN_CURSO' ? 'active' : 'pending'}`}>
                  {getOperativeStatusLabel(selectedEvent, now)}
                </span>
                {hasCapacityControl ? (
                  <small>Cupos disponibles: {availableCapacity}</small>
                ) : (
                  <small>Evento sin control de aforo</small>
                )}
              </div>

              <dl className="operative-summary-metrics">
                <div>
                  <dt>Validados</dt>
                  <dd>{validValidationCount} / {registeredCount}</dd>
                </div>
                <div>
                  <dt>Pendientes</dt>
                  <dd>{pendingAccessCount}</dd>
                </div>
                <div>
                  <dt>QR</dt>
                  <dd>{qrValidationCount}</dd>
                </div>
                <div>
                  <dt>Manual</dt>
                  <dd>{manualValidationCount}</dd>
                </div>
                {hasCapacityControl && (
                  <div>
                    <dt>Aforo</dt>
                    <dd>{validValidationCount} / {aforoMaximo}</dd>
                  </div>
                )}
              </dl>
            </section>

            <section className="operative-grid">
              <article className="admin-panel operative-scanner-panel" id="control-acceso">
                <span className="section-kicker">Validación QR</span>
                <h2>Escaneo de ingreso</h2>
                <div className="operative-scanner-box">
                  <div className={`scanner-frame${scannerStatus === 'success' ? ' success' : ''}${isCameraScannerActive ? ' is-camera-active' : ''}`}>
                    {isCameraScannerActive ? (
                      <video ref={videoRef} muted playsInline />
                    ) : (
                      <span>{scannerStatus === 'success' ? 'QR validado' : 'Listo para escanear'}</span>
                    )}
                  </div>
                  <canvas ref={canvasRef} className="scanner-capture-canvas" aria-hidden="true" />
                  <input
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/webp"
                    className="scanner-file-input"
                    type="file"
                    onChange={handleQrImageUpload}
                  />
                  <div className="operative-scanner-actions">
                    <button
                      className="admin-primary-action"
                      type="button"
                      disabled={isQrValidationLoading || !isOperativeWindowAvailable}
                      onClick={isCameraScannerActive ? stopCameraScanner : startCameraScanner}
                    >
                      {isCameraScannerActive ? 'Detener camara' : 'Escanear QR'}
                    </button>
                    <button
                      className="admin-secondary-action"
                      type="button"
                      disabled={isQrValidationLoading || !isOperativeWindowAvailable}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Subir imagen
                    </button>
                    <button className="admin-secondary-action" type="button" onClick={resetScanner}>
                      Reiniciar
                    </button>
                  </div>
                  {!isOperativeWindowAvailable && (
                    <small className="scanner-status-text">La ventana operativa aún no está activa para este evento.</small>
                  )}
                  {isQrValidationLoading && (
                    <small className="scanner-status-text">Validando QR...</small>
                  )}
                  {validationFeedback?.source === 'scanner' && (
                    <ValidationFeedbackCard feedback={validationFeedback} />
                  )}
                </div>
              </article>

              <article className="admin-panel" id="validacion-manual">
            <span className="section-kicker">Validación manual</span>
            <h2>Inscrito sin QR</h2>
            <p className="operative-panel-note">
              Para ciudadanos inscritos que no presentan el código QR.
            </p>
            <form className="manual-validation-form" onSubmit={validateManualAttendance}>
              <label>
                DNI o código de inscripción
                <input name="manualCode" placeholder="Ingrese DNI o código" />
              </label>
              <label>
                Motivo
                <select defaultValue="" name="manualReason">
                  <option disabled value="">Seleccionar motivo</option>
                  <option>QR no legible</option>
                  <option>Participante sin constancia</option>
                  <option>Validación por lista interna</option>
                </select>
              </label>
              <button
                className="admin-primary-action"
                disabled={!isOperativeWindowAvailable}
                type="submit"
              >
                Validar asistencia
              </button>
            </form>
            {validationFeedback?.source === 'manual' && (
              <ValidationFeedbackCard feedback={validationFeedback} />
            )}
              </article>
            </section>

            <section
              className={`admin-panel manual-registration-panel${isManualRegistrationOpen ? ' is-open' : ''}`}
              id="inscripcion-manual"
            >
              <div className="admin-panel-heading">
                <div>
                  <span className="section-kicker">Inscripción manual</span>
                  <h2>Registrar ciudadano sin inscripción previa</h2>
                </div>
              </div>
              <p className="operative-panel-note">
                Usa este flujo solo cuando el ciudadano no se inscribió en línea y aún hay cupos disponibles.
              </p>

              {!isManualRegistrationOpen ? (
                <button
                  className="admin-secondary-action manual-registration-toggle"
                  type="button"
                  disabled={!isOperativeWindowAvailable}
                  onClick={() => setIsManualRegistrationOpen(true)}
                >
                  Desplegar formulario
                </button>
              ) : (
                <form className="manual-registration-form" onSubmit={validateManualRegistration}>
                  <label className="manual-registration-dni-field">
                    DNI
                    <span className="manual-registration-dni-control">
                      <input
                        inputMode="numeric"
                        maxLength="8"
                        name="manualDni"
                        placeholder="Ingrese DNI"
                        onChange={(event) => {
                          const normalizedDni = event.target.value.replace(/\D/g, '').slice(0, 8);
                          event.target.value = normalizedDni;
                          resetManualRegistrationIdentity();
                        }}
                      />
                      <button
                        className="admin-secondary-action"
                        disabled={isSearchingManualRegistrationDni}
                        type="button"
                        onClick={(event) => {
                          const form = event.currentTarget.closest('form');
                          lookupManualRegistrationDni(form?.elements.manualDni?.value);
                        }}
                      >
                        {isSearchingManualRegistrationDni ? 'Buscando...' : 'Buscar'}
                      </button>
                    </span>
                    {manualRegistrationIdentityMessage && (
                      <small className={manualRegistrationIdentity ? 'identity-verified-message' : 'identity-error-message'}>
                        {manualRegistrationIdentityMessage}
                      </small>
                    )}
                  </label>
                  <label>
                    Nombres
                    <input name="manualNames" placeholder="Nombres del ciudadano" readOnly value={manualRegistrationIdentity?.names ?? ''} />
                  </label>
                  <label>
                    Apellidos
                    <input name="manualLastNames" placeholder="Apellidos del ciudadano" readOnly value={manualRegistrationIdentity?.lastNames ?? ''} />
                  </label>
                  {isManualRegistrationPlatformNeighbor && (
                    <section className="manual-registration-platform-notice">
                      <strong>Cuenta vecinal encontrada</strong>
                      <p>El ciudadano ya esta registrado en la plataforma. Se usaran sus datos existentes y solo se registrara la inscripcion con asistencia.</p>
                    </section>
                  )}

                  {manualRegistrationRequiresAdditionalData && (
                    <>
                      <div className="manual-registration-contact-field">
                        <label className="manual-registration-contact-toggle">
                          <input
                            checked={manualRegistrationContactOptions.phone}
                            name="manualHasPhone"
                            type="checkbox"
                            onChange={(event) => {
                              const checked = event.target.checked;
                              setManualRegistrationContactOptions((currentOptions) => ({
                                ...currentOptions,
                                phone: checked,
                              }));
                              if (!checked) {
                                const phoneInput = event.currentTarget.closest('.manual-registration-contact-field')
                                  ?.querySelector('input[name="manualPhone"]');
                                if (phoneInput) {
                                  phoneInput.value = '';
                                }
                              }
                            }}
                          />
                          Cuenta con celular
                        </label>
                        <label>
                          Celular
                          <input
                            disabled={!manualRegistrationContactOptions.phone}
                            inputMode="tel"
                            name="manualPhone"
                            placeholder="Numero de contacto"
                          />
                        </label>
                      </div>
                      <div className="manual-registration-contact-field">
                        <label className="manual-registration-contact-toggle">
                          <input
                            checked={manualRegistrationContactOptions.email}
                            name="manualHasEmail"
                            type="checkbox"
                            onChange={(event) => {
                              const checked = event.target.checked;
                              setManualRegistrationContactOptions((currentOptions) => ({
                                ...currentOptions,
                                email: checked,
                              }));
                              if (!checked) {
                                const emailInput = event.currentTarget.closest('.manual-registration-contact-field')
                                  ?.querySelector('input[name="manualEmail"]');
                                if (emailInput) {
                                  emailInput.value = '';
                                }
                              }
                            }}
                          />
                          Cuenta con correo
                        </label>
                        <label>
                          Correo
                          <input
                            disabled={!manualRegistrationContactOptions.email}
                            name="manualEmail"
                            placeholder="correo@dominio.com"
                            type="email"
                          />
                        </label>
                      </div>
                      <label className="manual-registration-check">
                        <input name="manualDataConsent" type="checkbox" />
                        Acepta tratamiento de datos para registrar su participacion.
                      </label>
                    </>
                  )}
                  <div className="manual-registration-actions">
                    <button
                      className="admin-secondary-action"
                      type="button"
                      onClick={() => {
                        setIsManualRegistrationOpen(false);
                        resetManualRegistrationIdentity();
                        resetManualRegistrationContactOptions();
                      }}
                    >
                      Ocultar formulario
                    </button>
                    <button
                      className="admin-primary-action"
                      disabled={!isOperativeWindowAvailable}
                      type="submit"
                    >
                      Registrar inscripción y asistencia
                    </button>
                  </div>
                </form>
              )}
            </section>

            <section className="admin-table-panel admin-table-featured" id="validaciones-recientes">
          <div className="admin-panel-heading">
            <div>
              <span className="section-kicker">Trazabilidad</span>
              <h2>Validaciones recientes</h2>
            </div>
          </div>

          <div className="admin-table operative-validation-table">
            <div className="admin-table-row admin-table-head">
              <span>Participante</span>
              <span>Codigo</span>
              <span>Origen</span>
              <span>Metodo</span>
              <span>Estado</span>
              <span>Hora</span>
              <span>Accion</span>
            </div>
            {validations.map((validation) => (
              <div className="admin-table-row" key={validation.id ?? validation.code}>
                <span>
                  <strong>{validation.person}</strong>
                  <small>{selectedEvent?.title}</small>
                </span>
                <span>{validation.code}</span>
                <span>{validation.origin}</span>
                <span>{validation.method}</span>
                <span>
                  <mark className={validation.status === 'ANULADA' ? 'is-annulled' : undefined}>{validation.status}</mark>
                  {validation.annulmentReason && (
                    <small>
                      {validation.annulmentReason} · {validation.annulledAt}
                    </small>
                  )}
                </span>
                <span>{validation.time}</span>
                <span>
                  {validation.status === 'VALIDADA' && (
                    <button
                      className="operative-annul-action"
                      type="button"
                      disabled={!isOperativeWindowAvailable || !validation.id}
                      onClick={() => setPendingAnnulment(validation)}
                    >
                      Anular
                    </button>
                  )}
                </span>
              </div>
            ))}
          </div>
            </section>
          </>
        )}

        {pendingOperativeAction && (
          <OperativeActionModal
            action={pendingOperativeAction}
            eventTitle={selectedEvent?.title}
            isLoading={isManualActionLoading}
            onCancel={() => {
              setPendingOperativeAction(null);
              setPendingOperativePayload(null);
            }}
            onConfirm={confirmOperativeAction}
          />
        )}

        {operativeValidationIssue && (
          <OperativeValidationIssueModal
            fields={operativeValidationIssue.fields}
            title={operativeValidationIssue.title}
            onClose={() => setOperativeValidationIssue(null)}
          />
        )}

        {pendingAnnulment && (
          <AnnulValidationModal
            validation={pendingAnnulment}
            isLoading={isAnnulmentLoading}
            onCancel={() => setPendingAnnulment(null)}
            onConfirm={confirmAnnulment}
          />
        )}

      </main>
    </section>
  );
}

function ValidationFeedbackCard({ feedback }) {
  return (
    <article
      className={`operative-validation-feedback is-${feedback.tone}`}
      aria-live="polite"
    >
      <span className="operative-feedback-icon" aria-hidden="true" />
      <div>
        <strong>{feedback.title}</strong>
        <p>{feedback.message}</p>
        {(feedback.citizenName || feedback.code) && (
          <small>
            {feedback.citizenName ? `${feedback.citizenName} · ` : ''}
            {feedback.code}
          </small>
        )}
      </div>
    </article>
  );
}

function AnnulValidationModal({ validation, isLoading = false, onCancel, onConfirm }) {
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const requiresDetail = reason === 'Otro';
  const canConfirm = reason && (!requiresDetail || detail.trim().length > 0);
  const reasonOptions = [
    'Error de escaneo',
    'Persona equivocada',
    'Duplicado detectado',
    'Registro manual incorrecto',
    'Otro',
  ];

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        aria-labelledby="annul-validation-title"
        aria-modal="true"
        className="confirm-modal annul-validation-modal"
        role="dialog"
      >
        <span className="section-kicker">Anulación controlada</span>
        <h2 id="annul-validation-title">Anular validación</h2>
        <p>
          El registro se conservara visible en la trazabilidad con el motivo de
          anulación.
        </p>

        <dl className="annul-validation-summary">
          <div>
            <dt>Participante</dt>
            <dd>{validation.person}</dd>
          </div>
          <div>
            <dt>Codigo</dt>
            <dd>{validation.code}</dd>
          </div>
          <div>
            <dt>Metodo</dt>
            <dd>{validation.method}</dd>
          </div>
          <div>
            <dt>Hora</dt>
            <dd>{validation.time}</dd>
          </div>
        </dl>

        <label className="annul-validation-field">
          Motivo de anulación
          <select
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              setDetail('');
            }}
          >
            <option value="">Seleccionar motivo</option>
            {reasonOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>

        {requiresDetail && (
          <label className="annul-validation-field">
            Especificar motivo
            <textarea
              rows="3"
              value={detail}
              onChange={(event) => setDetail(event.target.value)}
              placeholder="Describe brevemente el motivo"
            />
          </label>
        )}

        <div className="modal-actions">
          <button className="back-button" type="button" disabled={isLoading} onClick={onCancel}>
            Cancelar
          </button>
          <button
            className="primary-button danger-action"
            type="button"
            disabled={!canConfirm || isLoading}
            onClick={() => onConfirm({ detail: detail.trim(), reason })}
          >
            {isLoading ? 'Anulando...' : 'Anular validación'}
          </button>
        </div>
      </section>
    </div>
  );
}

function OperativeValidationIssueModal({ fields, title, onClose }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section
        aria-labelledby="operative-validation-issue-title"
        aria-modal="true"
        className="confirm-modal"
        role="dialog"
      >
        <span className="section-kicker">Datos incompletos</span>
        <h2 id="operative-validation-issue-title">{title}</h2>
        <p>Antes de continuar, registra la informacion obligatoria del flujo.</p>
        <ul className="validation-list">
          {fields.map((field) => (
            <li key={field}>{field}</li>
          ))}
        </ul>
        <div className="modal-actions single-action">
          <button className="primary-button" type="button" onClick={onClose}>
            Revisar datos
          </button>
        </div>
      </section>
    </div>
  );
}

function OperativeActionModal({ action, eventTitle, isLoading = false, onCancel, onConfirm }) {
  const isManualRegistration = action === 'manual-registration';
  const title = isManualRegistration
    ? `¿Estás seguro de registrar una inscripción manual para "${eventTitle}"?`
    : `¿Estás seguro de validar esta asistencia en "${eventTitle}"?`;
  const description = isManualRegistration
    ? 'Al confirmar se creará una inscripción con origen MANUAL y se registrará la asistencia del ciudadano.'
    : 'Al confirmar se marcará la asistencia como VALIDADA mediante método MANUAL para el evento seleccionado.';
  const confirmLabel = isManualRegistration
    ? 'Sí, registrar'
    : 'Sí, validar asistencia';

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        aria-labelledby="operative-action-title"
        aria-modal="true"
        className="confirm-modal"
        role="dialog"
      >
        <span className="section-kicker">
          {isManualRegistration ? 'Inscripción manual' : 'Validación manual'}
        </span>
        <h2 id="operative-action-title">{title}</h2>
        <p>{description}</p>
        <div className="modal-actions">
          <button className="back-button" type="button" disabled={isLoading} onClick={onCancel}>
            Revisar datos
          </button>
          <button className="primary-button" type="button" disabled={isLoading} onClick={onConfirm}>
            {isLoading ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

export default OperativoDashboard;
