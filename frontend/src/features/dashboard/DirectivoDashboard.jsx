import { useCallback, useEffect, useRef, useState } from 'react';
import municipalLogo from '../../assets/images/municipalidad-logo.png';
import eventReviewPlaceholder from '../../assets/images/event-review-placeholder.png';
import { formatEventState } from './dashboardData';
import NotificationMenu from './NotificationMenu';
import { CardSkeleton, EmptyState, ErrorState, TableSkeleton } from '../../components/feedback/LoadingStates';
import { getApiErrorMessage } from '../../services/api/api';
import {
  aprobarEventoDirectivo,
  cancelarEventoDirectivo,
  getConteosRevisionDirectiva,
  getDetalleRevisionDirectiva,
  getHistorialEvento,
  getEventosRevisionDirectiva,
  getNotificacionesDirectivo,
  getReportesDirectivosFinalizados,
  getResumenCardsDirectivo,
  marcarNotificacionComoLeida,
  observarEventoDirectivo,
} from '../../services/dashboardService';
import './AdminDashboard.css';
import './DirectivoDashboard.css';

const fallbackDirectiveUser = {
  fullName: 'Sergio Bustamante',
  role: 'DIRECTIVO',
};

function getDirectiveUserInitials(name) {
  const nameParts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (nameParts.length === 0) {
    return 'DI';
  }

  return `${nameParts[0][0] ?? ''}${nameParts.at(-1)?.[0] ?? ''}`.toUpperCase();
}

function formatDirectiveUserRole(role) {
  return role === 'DIRECTIVO' ? 'Directivo' : role ?? 'Directivo';
}

function formatDirectiveNotificationTime(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  }).format(date);
}

function mapDirectiveNotificationFromApi(notification) {
  return {
    id: notification.id,
    message: notification.mensaje ?? notification.message ?? '',
    title: notification.titulo ?? notification.title ?? notification.tipo ?? '',
    time: formatDirectiveNotificationTime(notification.fechaCreacion),
    type: notification.tipo ?? notification.type ?? '',
    unread: !(notification.leida ?? notification.read ?? false),
    urlDestino: notification.urlDestino ?? notification.destinationUrl ?? '',
  };
}

function formatDirectiveEventDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime())
    ? new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', weekday: 'short' }).format(date)
    : 'Fecha no especificada';
}

function formatDirectiveEventTime(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime())
    ? new Intl.DateTimeFormat('es-PE', { hour: 'numeric', minute: '2-digit' }).format(date)
    : 'Horario no especificado';
}

function formatDirectiveDuration(startValue, endValue) {
  const start = startValue ? new Date(startValue) : null;
  const end = endValue ? new Date(endValue) : null;

  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return 'No especificada';
  }

  const totalMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return [hours > 0 ? `${hours} ${hours === 1 ? 'hora' : 'horas'}` : '', minutes > 0 ? `${minutes} min` : '']
    .filter(Boolean)
    .join(' ');
}

function mapDirectiveReviewSummaryFromApi(event) {
  return {
    category: event.categoriaNombre ?? 'Sin categoría',
    date: formatDirectiveEventDate(event.fechaHoraInicio),
    id: event.id,
    lastUpdatedAt: event.actualizadoEn,
    state: event.estadoCodigo,
    title: event.titulo ?? 'Evento sin título',
    venue: event.ubicacionNombre ?? 'Ubicación pendiente',
  };
}

function mapDirectiveReviewDetailFromApi(event) {
  const resourceItems = event.recursos ?? [];
  const resources = resourceItems.reduce((mappedResources, resource) => {
    if (resource?.tipoRecurso) {
      mappedResources[resource.tipoRecurso] = resource.signedUrl || resource.nombreOriginal || true;
    }
    return mappedResources;
  }, {});
  const minimumAge = Number(event.edadMin);
  const maximumAge = Number(event.edadMax);
  const hasTargetAudience = Number.isFinite(minimumAge) && Number.isFinite(maximumAge) && maximumAge > minimumAge;

  return {
    accent: 'teal',
    address: event.ubicacion?.direccion ?? '',
    aforoMaximo: event.aforoMaximo,
    agenda: (event.agenda ?? []).map((item) => item.descripcion).filter(Boolean),
    audience: hasTargetAudience ? `${minimumAge}-${maximumAge} años` : 'Público general',
    category: event.categoriaNombre ?? 'Sin categoría',
    coordinates: {
      lat: event.ubicacion?.latitud,
      lng: event.ubicacion?.longitud,
    },
    date: formatDirectiveEventDate(event.fechaHoraInicio),
    descripcion_breve: event.descripcionBreve ?? '',
    description: event.descripcion ?? '',
    duration: formatDirectiveDuration(event.fechaHoraInicio, event.fechaHoraFin),
    id: event.id,
    imageUrl: resources.IMAGEN_PORTADA && typeof resources.IMAGEN_PORTADA === 'string'
      ? resources.IMAGEN_PORTADA
      : null,
    lastUpdatedAt: event.actualizadoEn,
    locationReference: event.ubicacion?.referencia ?? '',
    operativosAsignados: event.operativosAsignados ?? [],
    organizer: event.areaMunicipalNombre ?? '',
    previousObservation: event.ultimaObservacion ? {
      author: event.ultimaObservacion.usuarioNombre ?? 'Directivo',
      comment: event.ultimaObservacion.observacion,
      dateTime: event.ultimaObservacion.fechaObservacion,
      role: 'Directivo',
    } : null,
    referenceCost: event.costoReferencial,
    requirements: (event.requisitos ?? []).map((item) => item.descripcion).filter(Boolean),
    resourceItems,
    resources,
    state: event.estadoCodigo,
    summary: event.descripcionBreve ?? '',
    time: formatDirectiveEventTime(event.fechaHoraInicio),
    title: event.titulo ?? 'Evento sin título',
    venue: event.ubicacion?.nombre ?? 'Ubicación pendiente',
  };
}

function getAforoMaximo(event) {
  if (event.aforoMaximo === null) {
    return null;
  }

  return event.aforoMaximo ?? event.spots ?? null;
}

function hasAforoMaximo(event) {
  return Number(getAforoMaximo(event)) > 0;
}

function mapDirectiveReportFromApi(report) {
  const totalInscritos = Number(report.totalInscritos ?? 0);
  const totalAsistentes = Number(report.totalAsistentes ?? 0);
  const totalQr = Number(report.totalValidacionesQr ?? 0);
  const totalManual = Number(report.totalValidacionesManual ?? 0);
  const tasaAsistencia = report.tasaAsistencia ?? safePercent(totalAsistentes, totalInscritos) ?? null;
  const adopcionQr = report.adopcionQr ?? safePercent(totalQr, totalQr + totalManual) ?? null;
  const aforoMaximo = report.aforoMaximo ?? null;

  return {
    id: report.id,
    title: report.titulo ?? 'Evento sin titulo',
    category: report.categoriaNombre ?? 'Sin categoria',
    venue: report.ubicacionNombre ?? 'Ubicacion pendiente',
    date: formatDirectiveEventDate(report.fechaHoraInicio),
    time: formatDirectiveEventTime(report.fechaHoraInicio),
    state: report.estadoCodigo ?? 'FINALIZADO',
    completedAt: formatDirectiveReportDate(report.finalizadoEn ?? report.fechaHoraFin),
    generatedAt: report.finalizadoEn ? formatDirectiveNotificationTime(report.finalizadoEn) : 'Pendiente',
    generatedAtDate: report.finalizadoEn ?? report.fechaHoraFin ?? report.fechaHoraInicio,
    eventStartAt: report.fechaHoraInicio,
    requiereControlAsistencia: Boolean(report.requiereControlAsistencia),
    encuestaSatisfaccionHabilitada: Boolean(report.encuestaSatisfaccionHabilitada),
    registered: totalInscritos,
    totalAttendance: totalAsistentes,
    turnoutRate: tasaAsistencia,
    qrValidated: totalQr,
    manualValidated: totalManual,
    digitalValidationRate: adopcionQr,
    cancelled: 0,
    cancelledRegistrations: 0,
    puntuacionPromedio: report.promedioSatisfaccion ?? null,
    totalValoraciones: Number(report.totalValoraciones ?? 0),
    referenceCost: report.costoReferencial ?? 0,
    aforoMaximo,
    usedCapacityRate: aforoMaximo && aforoMaximo > 0 && totalAsistentes > 0
      ? Math.round((totalAsistentes / aforoMaximo) * 100)
      : null,
    metaTipo: report.metaTipo,
    metaValor: report.metaValor,
  };
}

function formatDirectiveReportDate(value) {
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}
const reviewFilters = [
  {
    label: 'Todos',
    value: 'TODOS',
  },
  {
    label: 'Pendientes',
    value: 'PENDIENTES',
  },
  {
    label: 'Observados',
    value: 'OBSERVADOS',
  },
];

const reviewableStates = ['PARA_REVISION'];
const emptyDirectiveStatsSummary = {
  observados: 0,
  porRevisar: 0,
  publicadosDelMes: 0,
  reportesDelMes: 0,
};

function buildDirectiveStats(summary = emptyDirectiveStatsSummary) {
  return [
    {
      icon: FileSearchIcon,
      label: 'Por revisar',
      tone: 'is-decision',
      trend: 'pendientes de decisión',
      value: Number(summary.porRevisar ?? 0),
    },
    {
      icon: MessageWarningIcon,
      label: 'Observados',
      tone: 'is-returned',
      trend: 'devueltos al administrador',
      value: Number(summary.observados ?? 0),
    },
    {
      icon: BadgeCheckIcon,
      label: 'Publicados del mes',
      tone: 'is-month-approved',
      trend: 'publicados en el mes actual',
      value: Number(summary.publicadosDelMes ?? 0),
    },
    {
      icon: ChartColumnIcon,
      label: 'Reportes del mes',
      tone: 'is-month-report',
      trend: 'eventos con reporte',
      value: Number(summary.reportesDelMes ?? 0),
    },
  ];
}

const reviewResourceLabels = [
  ['IMAGEN_PORTADA', 'Portada ciudadana'],
  ['AFICHE', 'Afiche oficial'],
  ['VIDEO', 'Video referencial'],
];

const directiveOperativeDirectory = {
  'operativo-1': { fullName: 'Carlos Ramirez', role: 'Operativo' },
  'operativo-2': { fullName: 'Lucía Mendoza', role: 'Operativo' },
};

function getAssignedOperatives(event) {
  const assignedOperatives = Array.isArray(event.operativosAsignados)
    ? event.operativosAsignados
    : [];

  return assignedOperatives.map((operative, index) => {
    if (operative && typeof operative === 'object') {
      const id = operative.usuarioId ?? operative.id ?? `operativo-${index + 1}`;
      const fullName = operative.fullName
        || operative.nombreCompleto
        || [operative.nombres, operative.apellidos].filter(Boolean).join(' ')
        || operative.email
        || `Usuario operativo ${index + 1}`;

      return {
        email: operative.email ?? operative.correo ?? '',
        fullName,
        id,
        role: operative.role ?? operative.rol ?? 'Operativo',
      };
    }

    const id = String(operative);
    return {
      ...directiveOperativeDirectory[id],
      fullName: directiveOperativeDirectory[id]?.fullName ?? `Usuario operativo ${index + 1}`,
      id,
      role: directiveOperativeDirectory[id]?.role ?? 'Operativo',
    };
  });
}

function formatRelativeTime(dateValue, referenceDate = new Date()) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return 'Sin fecha registrada';
  }

  const diffInMinutes = Math.max(
    0,
    Math.round((referenceDate.getTime() - date.getTime()) / 60000),
  );

  if (diffInMinutes < 60) {
    return `Hace ${diffInMinutes || 1} min`;
  }

  const diffInHours = Math.round(diffInMinutes / 60);

  if (diffInHours < 24) {
    return `Hace ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
  }

  const diffInDays = Math.round(diffInHours / 24);

  if (diffInDays < 7) {
    return `Hace ${diffInDays} ${diffInDays === 1 ? 'día' : 'días'}`;
  }

  const diffInWeeks = Math.round(diffInDays / 7);

  return `Hace ${diffInWeeks} ${diffInWeeks === 1 ? 'semana' : 'semanas'}`;
}

function getReviewTimeMetric(event) {
  if (event.state === 'PARA_REVISION') {
    const dateValue = event.sentToReviewAt ?? event.lastUpdatedAt;

    return {
      value: dateValue ? formatRelativeTime(dateValue) : null,
    };
  }

  const dateValue = event.lastUpdatedAt;

  return {
    value: dateValue ? `Actualizado ${formatRelativeTime(dateValue).toLowerCase()}` : null,
  };
}

function getReviewPendingTime(event) {
  return getReviewTimeMetric(event).value ?? 'Sin fecha';
}

function getResourceValue(event, type) {
  if (type === 'VIDEO') {
    return event.resources?.[type] ?? event.videoUrl ?? null;
  }

  return event.resources?.[type];
}

function getDirectiveResourceItem(event, type) {
  return Array.isArray(event.resourceItems)
    ? event.resourceItems.find((resource) => resource?.tipoRecurso === type)
    : null;
}

function getDirectiveResourceUrl(resource, fallbackValue) {
  if (resource?.signedUrl) {
    return resource.signedUrl;
  }

  return typeof fallbackValue === 'string' && /^https?:\/\//i.test(fallbackValue)
    ? fallbackValue
    : null;
}

function getDirectiveResourceName(resource, fallbackLabel) {
  return resource?.nombreOriginal || fallbackLabel;
}

function getDirectiveReviewResourceKind(type, resource) {
  const mimeType = resource?.mimeType ?? '';

  if (type === 'VIDEO' || mimeType.startsWith('video/')) {
    return 'video';
  }

  if (mimeType === 'application/pdf' || type === 'DOCUMENTO') {
    return 'document';
  }

  return 'image';
}

function getResourcePreviewUrl(resourceValue, kind) {
  if (typeof resourceValue === 'string') {
    return resourceValue;
  }

  return kind === 'image' ? eventReviewPlaceholder : null;
}

function getEventMapsUrl(event) {
  const latitude = event.coordinates?.lat ?? event.location?.lat ?? event.latitude;
  const longitude = event.coordinates?.lng ?? event.coordinates?.lon ?? event.location?.lng ?? event.location?.lon ?? event.longitude;

  if (latitude && longitude) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latitude},${longitude}`)}`;
  }

  const locationQuery = [event.venue, event.address].filter(Boolean).join(', ');

  if (!locationQuery) {
    return null;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationQuery)}`;
}

function getDisplayValue(value, fallback) {
  return value !== undefined && value !== null && String(value).trim().length > 0
    ? String(value).trim()
    : fallback;
}

function parseClockMinutes(value) {
  const match = String(value ?? '').match(/(\d{1,2})(?::(\d{2}))?\s*(a\.m\.|p\.m\.)?/i);

  if (!match) {
    return null;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2] ?? 0);
  const period = match[3]?.toLowerCase();

  if (period === 'p.m.' && hours < 12) {
    hours += 12;
  }

  if (period === 'a.m.' && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}

function parseDurationMinutes(value) {
  const hoursMatch = String(value ?? '').match(/(\d+(?:[.,]\d+)?)\s*hora/i);
  const minutesMatch = String(value ?? '').match(/(\d+)\s*min/i);
  const hours = hoursMatch ? Number(hoursMatch[1].replace(',', '.')) : 0;
  const minutes = minutesMatch ? Number(minutesMatch[1]) : 0;
  const totalMinutes = hours * 60 + minutes;

  return totalMinutes > 0 ? totalMinutes : null;
}

function formatClockMinutes(totalMinutes) {
  const normalizedMinutes = totalMinutes % (24 * 60);
  const hours24 = Math.floor(normalizedMinutes / 60);
  const minutes = normalizedMinutes % 60;
  const period = hours24 >= 12 ? 'p.m.' : 'a.m.';
  const hours12 = hours24 % 12 || 12;

  return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
}

function getDirectiveScheduleLabel(event) {
  const date = getDisplayValue(event.date, 'Fecha no especificada');
  const time = getDisplayValue(event.time, 'Horario no especificado');
  const startMinutes = parseClockMinutes(event.time);
  const durationMinutes = parseDurationMinutes(event.duration);

  if (startMinutes === null || durationMinutes === null) {
    return `${date} · ${time}`;
  }

  return `${date} · ${formatClockMinutes(startMinutes)} - ${formatClockMinutes(startMinutes + durationMinutes)}`;
}

function getReferenceCostLabel(event) {
  const referenceCost = Number(event.referenceCost);

  return Number.isFinite(referenceCost) && referenceCost > 0
    ? `S/ ${referenceCost.toLocaleString('es-PE')}`
    : 'No especificado';
}

function normalizeHistoryType(value) {
  return String(value ?? '').trim().toUpperCase();
}

function getHistoryIconType(value) {
  const type = normalizeHistoryType(value);
  const iconTypeMap = {
    CANCELAR: 'CANCELLED',
    CREAR: 'CREATED',
    EDITAR: 'UPDATED',
    FECHA: 'DATE',
    GENERAL: 'UPDATED',
    OBSERVACION: 'OBSERVED',
    OPERATIVO: 'OPERATIVE',
    PUBLICAR: 'PUBLISHED',
    RECURSO: 'RESOURCE',
    REVISION: 'SENT_TO_REVIEW',
    UBICACION: 'LOCATION',
  };

  return iconTypeMap[type] ?? iconTypeMap[normalizeHistoryType(value).replace('_EVENTO', '')] ?? 'UPDATED';
}

function getHistoryTone(value) {
  const type = normalizeHistoryType(value);
  if (type === 'CANCELAR') {
    return 'danger';
  }
  if (type === 'OBSERVACION') {
    return 'warning';
  }
  if (type === 'PUBLICAR' || type === 'CREAR') {
    return 'success';
  }
  if (type === 'REVISION') {
    return 'review';
  }

  return 'neutral';
}

function getHistoryTitle(item) {
  const action = normalizeHistoryType(item?.accion);
  const type = normalizeHistoryType(item?.tipoAccion);

  if (action === 'CREAR_EVENTO' || type === 'CREAR') {
    return 'Evento creado';
  }
  if (action.includes('ACTUALIZAR') || type === 'EDITAR') {
    return 'Informacion actualizada';
  }
  if (action.includes('SUBIR_RECURSO') || action.includes('ELIMINAR_RECURSO') || type === 'RECURSO') {
    return 'Recurso actualizado';
  }
  if (action.includes('OPERATIVO') || type === 'OPERATIVO') {
    return 'Personal operativo';
  }
  if (action.includes('CANCEL') || type === 'CANCELAR') {
    return 'Evento cancelado';
  }
  if (action.includes('PUBLIC') || type === 'PUBLICAR') {
    return 'Evento publicado';
  }
  if (action.includes('OBSERV') || type === 'OBSERVACION') {
    return 'Observacion registrada';
  }
  if (action.includes('REVISION') || type === 'REVISION') {
    return 'Enviado a revision';
  }
  if (type === 'UBICACION') {
    return 'Ubicacion actualizada';
  }
  if (type === 'FECHA') {
    return 'Fecha y hora actualizadas';
  }

  return item?.detalle ? 'Movimiento registrado' : 'Gestion del evento';
}

function mapEventHistoryFromApi(item) {
  const type = item?.tipoAccion ?? item?.accion;
  return {
    actorName: item?.usuarioNombre ?? 'Sistema',
    actorRole: item?.usuarioRol ?? 'Sistema',
    dateTime: item?.fechaHora,
    id: item?.id ?? `${item?.accion ?? 'historial'}-${item?.fechaHora ?? Math.random()}`,
    message: item?.detalle ?? '',
    title: getHistoryTitle(item),
    tone: getHistoryTone(type),
    type: getHistoryIconType(type),
    userComment: null,
  };
}
function getDirectiveStateTone(state) {
  const stateToneMap = {
    PARA_REVISION: 'state-review',
    OBSERVADO: 'state-observed',
    PUBLICADO: 'state-published',
  };

  return stateToneMap[state] ?? 'state-default';
}

function DirectivoDashboard({ onLogout, user }) {
  const [currentDirectiveView, setCurrentDirectiveView] = useState('review');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarDrawerOpen, setIsSidebarDrawerOpen] = useState(false);
  const [reviewFilter, setReviewFilter] = useState('TODOS');
  const [reviewItems, setReviewItems] = useState([]);
  const [reviewCounts, setReviewCounts] = useState({ todos: 0, pendientes: 0, observados: 0 });
  const [reviewPage, setReviewPage] = useState({ number: 0, totalElements: 0, totalPages: 0 });
  const [isLoadingReviewEvents, setIsLoadingReviewEvents] = useState(true);
  const [reviewEventsError, setReviewEventsError] = useState('');
  const [isLoadingReviewDetail, setIsLoadingReviewDetail] = useState(false);
  const [selectedReviewEvent, setSelectedReviewEvent] = useState(null);
  const [reviewHistoryItems, setReviewHistoryItems] = useState([]);
  const [isLoadingReviewHistory, setIsLoadingReviewHistory] = useState(false);
  const [reviewHistoryError, setReviewHistoryError] = useState('');
  const [selectedReportEvent, setSelectedReportEvent] = useState(null);
  const [directiveReportItems, setDirectiveReportItems] = useState([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [reportsError, setReportsError] = useState('');
  const [pendingDecision, setPendingDecision] = useState(null);
  const [isSavingDecision, setIsSavingDecision] = useState(false);
  const [decisionError, setDecisionError] = useState('');
  const [activeReviewSection, setActiveReviewSection] = useState('ficha-directiva');
  const [directiveStatsSummary, setDirectiveStatsSummary] = useState(emptyDirectiveStatsSummary);
  const [isLoadingDirectiveStats, setIsLoadingDirectiveStats] = useState(true);
  const [directiveStatsError, setDirectiveStatsError] = useState('');
  const [directiveNotificationItems, setDirectiveNotificationItems] = useState([]);
  const [directiveNotificationCounts, setDirectiveNotificationCounts] = useState({ total: 0, unread: 0 });
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [notificationError, setNotificationError] = useState('');
  const [notificationFilter, setNotificationFilter] = useState('all');
  const directiveUser = user ?? fallbackDirectiveUser;
  const directiveUserName = directiveUser.fullName || directiveUser.name || 'Sergio Bustamante';
  const directiveReports = directiveReportItems;

  const loadReviewEvents = useCallback(async () => {
    setIsLoadingReviewEvents(true);
    setReviewEventsError('');

    try {
      const [pageData, countsData] = await Promise.all([
        getEventosRevisionDirectiva({ estado: reviewFilter, page: reviewPage.number }),
        getConteosRevisionDirectiva(),
      ]);
      setReviewItems((pageData.content ?? []).map(mapDirectiveReviewSummaryFromApi));
      setReviewPage((currentPage) => ({
        ...currentPage,
        number: pageData.number ?? 0,
        totalElements: pageData.totalElements ?? 0,
        totalPages: pageData.totalPages ?? 0,
      }));
      setReviewCounts({
        observados: countsData.observados ?? 0,
        pendientes: countsData.pendientes ?? 0,
        todos: countsData.todos ?? 0,
      });
    } catch (error) {
      setReviewItems([]);
      setReviewEventsError(getApiErrorMessage(error, 'No se pudieron cargar los eventos para revisión.'));
    } finally {
      setIsLoadingReviewEvents(false);
    }
  }, [reviewFilter, reviewPage.number]);

  const loadDirectiveReports = useCallback(() => {
    setIsLoadingReports(true);
    setReportsError('');

    return getReportesDirectivosFinalizados()
      .then((data) => {
        const reports = Array.isArray(data) ? data.map(mapDirectiveReportFromApi) : [];
        setDirectiveReportItems(reports);
      })
      .catch((error) => {
        console.error('No se pudieron cargar los reportes directivos.', error);
        setDirectiveReportItems([]);
        setReportsError(getApiErrorMessage(error, 'No se pudieron cargar los reportes directivos.'));
      })
      .finally(() => setIsLoadingReports(false));
  }, []);
  const loadDirectiveNotifications = useCallback((nextFilter = notificationFilter) => {
    const soloNoLeidas = nextFilter === 'unread';
    setIsLoadingNotifications(true);
    setNotificationError('');

    return getNotificacionesDirectivo({ soloNoLeidas })
      .then((data) => {
        const notifications = Array.isArray(data.notificaciones)
          ? data.notificaciones.map(mapDirectiveNotificationFromApi)
          : [];

        setDirectiveNotificationItems(notifications);
        setDirectiveNotificationCounts({
          total: data.total ?? notifications.length,
          unread: data.noLeidas ?? notifications.filter((notification) => notification.unread).length,
        });
      })
      .catch((error) => {
        console.error('No se pudieron cargar las notificaciones directivas.', error);
        setDirectiveNotificationItems([]);
        setDirectiveNotificationCounts({ total: 0, unread: 0 });
        setNotificationError(getApiErrorMessage(error, 'No se pudieron cargar las notificaciones.'));
      })
      .finally(() => setIsLoadingNotifications(false));
  }, [notificationFilter]);

  useEffect(() => {
    let isMounted = true;

    async function loadDirectiveStats() {
      setIsLoadingDirectiveStats(true);
      setDirectiveStatsError('');

      try {
        const data = await getResumenCardsDirectivo();

        if (isMounted) {
          setDirectiveStatsSummary({
            observados: data?.observados ?? 0,
            porRevisar: data?.porRevisar ?? 0,
            publicadosDelMes: data?.publicadosDelMes ?? 0,
            reportesDelMes: data?.reportesDelMes ?? 0,
          });
        }
      } catch (error) {
        if (isMounted) {
          setDirectiveStatsSummary(emptyDirectiveStatsSummary);
          setDirectiveStatsError(getApiErrorMessage(error, 'No se pudieron cargar las métricas directivas.'));
        }
      } finally {
        if (isMounted) {
          setIsLoadingDirectiveStats(false);
        }
      }
    }

    loadDirectiveStats();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadDirectiveReports();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadDirectiveReports]);
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadDirectiveNotifications(notificationFilter);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadDirectiveNotifications, notificationFilter]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadReviewEvents();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadReviewEvents]);

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

  function navigateReviewSection(sectionId) {
    closeSidebarDrawer();
    setActiveReviewSection(sectionId);
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

  function handleDirectiveBrandClick() {
    closeSidebarDrawer();
    window.history.pushState(null, '', '/directivo');
    setSelectedReviewEvent(null);
    setSelectedReportEvent(null);
    setCurrentDirectiveView('review');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleNotificationFilterChange(nextFilter) {
    setNotificationFilter(nextFilter);
  }

  async function handleNotificationRead(notification) {
    const wasUnread = Boolean(notification?.unread);

    if (notification?.id) {
      await marcarNotificacionComoLeida(notification.id);
    }

    setDirectiveNotificationItems((currentItems) =>
      currentItems.map((currentNotification) =>
        currentNotification.id === notification?.id
          ? { ...currentNotification, unread: false }
          : currentNotification,
      ),
    );

    if (wasUnread) {
      setDirectiveNotificationCounts((currentCounts) => ({
        ...currentCounts,
        unread: Math.max(0, currentCounts.unread - 1),
      }));
    }
  }

  async function loadEventHistory(eventId) {
    setIsLoadingReviewHistory(true);
    setReviewHistoryError('');

    try {
      const history = await getHistorialEvento(eventId);
      setReviewHistoryItems(Array.isArray(history) ? history.map(mapEventHistoryFromApi) : []);
    } catch (error) {
      setReviewHistoryItems([]);
      setReviewHistoryError(getApiErrorMessage(error, 'No se pudo cargar el historial de gestion.'));
    } finally {
      setIsLoadingReviewHistory(false);
    }
  }
  async function openDirectiveReviewEvent(eventId) {
    setIsLoadingReviewDetail(true);
    setReviewEventsError('');
    setReviewHistoryItems([]);
    setReviewHistoryError('');

    try {
      const [detail] = await Promise.all([
        getDetalleRevisionDirectiva(eventId),
        loadEventHistory(eventId),
      ]);
      setSelectedReviewEvent(mapDirectiveReviewDetailFromApi(detail));
      setSelectedReportEvent(null);
      setCurrentDirectiveView('review');
      setActiveReviewSection('ficha-directiva');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setReviewEventsError(getApiErrorMessage(error, 'No se pudo cargar el detalle del evento.'));
    } finally {
      setIsLoadingReviewDetail(false);
    }
  }

  function findDirectiveReportById(eventId) {
    return directiveReports.find((report) => String(report.id) === String(eventId)) ?? null;
  }

  async function handleNotificationOpen(notification) {
    const destination = notification?.urlDestino;

    if (!destination) {
      return;
    }

    window.history.pushState(null, '', destination);

    const eventMatch = destination.match(/^\/directivo\/eventos\/([^/]+)\/(revision|reporte)$/);
    if (!eventMatch) {
      return;
    }

    const [, eventId, action] = eventMatch;

    if (action === 'reporte') {
      const report = findDirectiveReportById(eventId);
      if (report) {
        setSelectedReportEvent(report);
        setSelectedReviewEvent(null);
        setCurrentDirectiveView('reports');
        setActiveReviewSection('report-section');
      } else {
        setSelectedReportEvent(null);
        setSelectedReviewEvent(null);
        setCurrentDirectiveView('reports');
      }
      return;
    }

    await openDirectiveReviewEvent(eventId);
  }

  const directiveNotificationMenu = (
    <NotificationMenu
      error={notificationError}
      isLoading={isLoadingNotifications}
      notifications={directiveNotificationItems}
      totalCount={directiveNotificationCounts.total}
      unreadCount={directiveNotificationCounts.unread}
      onFilterChange={handleNotificationFilterChange}
      onNotificationOpen={handleNotificationOpen}
      onNotificationRead={handleNotificationRead}
      onRetry={() => loadDirectiveNotifications(notificationFilter)}
    />
  );

  function applyCancelledState(event) {
    return event ? { ...event, state: 'CANCELADO' } : event;
  }

  function applyReviewDecisionState(event, eventId, nextState) {
    return String(event?.id) === String(eventId)
      ? { ...event, state: nextState }
      : event;
  }

  async function handleDirectiveDecisionConfirm(decisionResult) {
    if (!pendingDecision || isSavingDecision) {
      return;
    }

    const decisionType = pendingDecision.type;
    const eventId = pendingDecision.eventId;

    try {
      setIsSavingDecision(true);
      setDecisionError('');

      if (decisionType === 'approve') {
        await aprobarEventoDirectivo(eventId);
        setSelectedReviewEvent((currentEvent) => applyReviewDecisionState(currentEvent, eventId, 'PUBLICADO'));
      } else if (decisionType === 'observe') {
        await observarEventoDirectivo(eventId, {
          observacion: decisionResult.comment,
        });
        setSelectedReviewEvent((currentEvent) => applyReviewDecisionState(currentEvent, eventId, 'OBSERVADO'));
      } else if (decisionType === 'cancel') {
        await cancelarEventoDirectivo(eventId, {
          motivo: decisionResult.comment,
        });
        setSelectedReviewEvent((currentEvent) => applyCancelledState(currentEvent));
        setSelectedReportEvent((currentReport) =>
          String(currentReport?.id) === String(eventId)
            ? applyCancelledState(currentReport)
            : currentReport,
        );
      }

      setPendingDecision(null);
      setSelectedReviewEvent(null);
      setReviewHistoryItems([]);
      setReviewHistoryError('');
      loadDirectiveNotifications(notificationFilter);
      loadReviewEvents();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      const fallbackMessage = decisionType === 'approve'
        ? 'No se pudo aprobar el evento.'
        : decisionType === 'observe'
          ? 'No se pudo registrar la observacion.'
          : 'No se pudo cancelar el evento.';
      setDecisionError(getApiErrorMessage(error, fallbackMessage));
    } finally {
      setIsSavingDecision(false);
    }
  }
  return (
    <section
      className={[
        'admin-shell directive-shell',
        isSidebarCollapsed ? 'is-sidebar-collapsed' : '',
        isSidebarDrawerOpen ? 'is-sidebar-drawer-open' : '',
      ].filter(Boolean).join(' ')}
      aria-labelledby="directive-title"
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

        <button className="admin-brand" type="button" onClick={handleDirectiveBrandClick}>
          <img
            alt="Logo Municipalidad de San Miguel"
            className="municipality-logo brand-logo"
            src={municipalLogo}
          />
          <span>
            <strong>San Miguel</strong>
            <small>Panel directivo</small>
          </span>
        </button>

        <section className="admin-user-card" aria-label="Usuario autenticado">
          <span className="admin-user-avatar" aria-hidden="true">
            {getDirectiveUserInitials(directiveUserName)}
          </span>
          <span className="admin-user-copy">
            <strong>{directiveUserName}</strong>
            <small>{formatDirectiveUserRole(directiveUser.role)}</small>
          </span>
        </section>

        <nav className="admin-nav" aria-label="Navegación directiva">
          {selectedReviewEvent || selectedReportEvent ? (
            <>
              {selectedReviewEvent ? (
                <>
                  <a
                    className={activeReviewSection === 'ficha-directiva' ? 'active' : ''}
                    href="#ficha-directiva"
                    onClick={(event) => {
                      event.preventDefault();
                      navigateReviewSection('ficha-directiva');
                    }}
                  >
                    Ficha
                  </a>
                  <a
                    className={activeReviewSection === 'recursos-directivos' ? 'active' : ''}
                    href="#recursos-directivos"
                    onClick={(event) => {
                      event.preventDefault();
                      navigateReviewSection('recursos-directivos');
                    }}
                  >
                    Recursos
                  </a>
                  <a
                    className={activeReviewSection === 'decision-directiva' ? 'active' : ''}
                    href="#decision-directiva"
                    onClick={(event) => {
                      event.preventDefault();
                      navigateReviewSection('decision-directiva');
                    }}
                  >
                    Decisión
                  </a>
                </>
              ) : (
                <>
                  <a
                    className={activeReviewSection === 'report-section' ? 'active' : ''}
                    href="#report-section"
                    onClick={(event) => {
                      event.preventDefault();
                      navigateReviewSection('report-section');
                    }}
                  >
                    Reporte
                  </a>
                  <a
                    className={activeReviewSection === 'attendance-section' ? 'active' : ''}
                    href="#attendance-section"
                    onClick={(event) => {
                      event.preventDefault();
                      navigateReviewSection('attendance-section');
                    }}
                  >
                    Asistencia
                  </a>
                  <a
                    className={activeReviewSection === 'export-section' ? 'active' : ''}
                    href="#export-section"
                    onClick={(event) => {
                      event.preventDefault();
                      navigateReviewSection('export-section');
                    }}
                  >
                    Exportación
                  </a>
                </>
              )}
              <button
                className="admin-nav-logout directive-return-panel-action"
                type="button"
                onClick={() => {
                  closeSidebarDrawer();
                  setSelectedReviewEvent(null);
                  setSelectedReportEvent(null);
                  setActiveReviewSection('ficha-directiva');
                }}
              >
                Volver al panel
              </button>
            </>
          ) : (
            <>
              <button
                className={currentDirectiveView === 'review' ? 'active admin-nav-link' : 'admin-nav-link'}
                type="button"
                onClick={() => {
                  closeSidebarDrawer();
                  setCurrentDirectiveView('review');
                }}
              >
                Revisión
              </button>
              <button
                className={currentDirectiveView === 'reports' ? 'active admin-nav-link' : 'admin-nav-link'}
                type="button"
                onClick={() => {
                  closeSidebarDrawer();
                  setCurrentDirectiveView('reports');
                }}
              >
                Reportes
              </button>
            </>
          )}
          <button className="admin-nav-logout directive-logout-action" type="button" onClick={onLogout}>
            Salir del panel
          </button>
        </nav>
      </aside>

      <main className="admin-main">
        {selectedReviewEvent ? (
          <DirectiveReviewView
            event={selectedReviewEvent}
            historyError={reviewHistoryError}
            historyItems={reviewHistoryItems}
            isLoadingHistory={isLoadingReviewHistory}
            onActiveSectionChange={setActiveReviewSection}
            onBack={() => {
              setSelectedReviewEvent(null);
              setReviewHistoryItems([]);
              setReviewHistoryError('');
              setActiveReviewSection('ficha-directiva');
            }}
            onDecision={(decision) => {
              setDecisionError('');
              setPendingDecision(decision);
            }}
          />
        ) : selectedReportEvent ? (
          <EventReportView
            onCancelEvent={(report) => {
              setDecisionError('');
              setPendingDecision({
                eventId: report.id,
                eventTitle: report.title,
                type: 'cancel',
              });
            }}
            report={selectedReportEvent}
            onActiveSectionChange={setActiveReviewSection}
            onBack={() => setSelectedReportEvent(null)}
          />
        ) : (
          <>
            {currentDirectiveView === 'reports' ? (
              <ReportsDashboardView
                notificationMenu={directiveNotificationMenu}
                error={reportsError}
                isLoading={isLoadingReports}
                reports={directiveReports}
                onSelectReport={(report) => {
                  setSelectedReportEvent(report);
                  setActiveReviewSection('report-section');
                }}
              />
            ) : (
              <DirectiveReviewDashboard
                directiveStatsSummary={directiveStatsSummary}
                directiveStatsError={directiveStatsError}
                isLoadingReviewDetail={isLoadingReviewDetail}
                isLoadingReviewEvents={isLoadingReviewEvents}
                isLoadingDirectiveStats={isLoadingDirectiveStats}
                notificationMenu={directiveNotificationMenu}
                reviewCounts={reviewCounts}
                reviewEvents={reviewItems}
                reviewEventsError={reviewEventsError}
                reviewFilter={reviewFilter}
                reviewPage={reviewPage}
                onFilterChange={(nextFilter) => {
                  setReviewFilter(nextFilter);
                  setReviewPage((currentPage) => ({ ...currentPage, number: 0 }));
                }}
                onPageChange={(page) => setReviewPage((currentPage) => ({ ...currentPage, number: page }))}
                onRetry={loadReviewEvents}
                onSelectReview={(event) => openDirectiveReviewEvent(event.id)}
              />
            )}
          </>
        )}

        {pendingDecision && (
          <DirectiveDecisionModal
            decision={pendingDecision}
            error={decisionError}
            isSaving={isSavingDecision}
            onCancel={() => {
              setDecisionError('');
              setPendingDecision(null);
            }}
            onConfirm={handleDirectiveDecisionConfirm}
          />
        )}
      </main>
    </section>
  );
}

function DirectiveReviewDashboard({
  directiveStatsError,
  directiveStatsSummary,
  isLoadingReviewDetail,
  isLoadingReviewEvents,
  isLoadingDirectiveStats,
  notificationMenu,
  reviewCounts,
  reviewEvents,
  reviewEventsError,
  reviewFilter,
  reviewPage,
  onFilterChange,
  onPageChange,
  onRetry,
  onSelectReview,
}) {
  const directiveStats = buildDirectiveStats(directiveStatsSummary);
  const reviewFilterCounts = {
    TODOS: reviewCounts.todos,
    PENDIENTES: reviewCounts.pendientes,
    OBSERVADOS: reviewCounts.observados,
  };

  return (
    <>
      <header className="admin-topbar">
        <div>
          <span className="section-kicker">Panel directivo</span>
          <h1 id="directive-title">Supervisión municipal de eventos</h1>
        </div>
        <div className="admin-topbar-actions">
          {notificationMenu}
        </div>
      </header>

      <section className="admin-stats" aria-label="Resumen directivo">
        {isLoadingDirectiveStats ? <CardSkeleton count={4} /> : directiveStats.map((stat) => (
          <article
            className={`admin-stat-card management-stat-card directive-stat-card ${stat.tone}`}
            key={stat.label}
          >
            <span className="admin-stat-icon directive-stat-icon">
              <stat.icon />
            </span>
            <div>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              <small>{stat.trend}</small>
            </div>
          </article>
        ))}
      </section>
      {directiveStatsError && (
        <p className="settings-inline-notice" role="alert">{directiveStatsError}</p>
      )}

      <section
        className="admin-table-panel admin-table-featured"
        id="revision-directiva"
      >
        <div className="admin-panel-heading">
          <div>
            <span className="section-kicker">Revisión directiva</span>
            <h2>Eventos para decisión</h2>
          </div>
        </div>

        <div className="directive-filter-tabs" aria-label="Filtrar eventos por decisión">
          {reviewFilters.map((filter) => (
            <button
              className={reviewFilter === filter.value ? 'active' : ''}
              key={filter.value}
              type="button"
              onClick={() => onFilterChange(filter.value)}
            >
              <span>{filter.label}</span>
              <span className="directive-filter-count">
                {reviewFilterCounts[filter.value]}
              </span>
            </button>
          ))}
        </div>

        <div className="admin-table directive-review-table">
          <div className="admin-table-row admin-table-head">
            <span>Evento</span>
            <span>Estado</span>
            <span>Categoría</span>
            <span>Pendiente desde</span>
            <span>Revisión</span>
          </div>
          {isLoadingReviewEvents ? (
            <TableSkeleton columns={5} rows={5} />
          ) : reviewEventsError ? (
            <ErrorState description={reviewEventsError} onRetry={onRetry} />
          ) : reviewEvents.length === 0 ? (
            <EmptyState title={'No hay eventos en este filtro'} description={'No se encontraron eventos para revisión directiva.'} />
          ) : reviewEvents.map((event) => (
            <div className="admin-table-row" key={event.id}>
              <span>
                <strong>{event.title}</strong>
                <small>{event.date} - {event.venue}</small>
              </span>
              <span>
                <span className={`state-badge ${getDirectiveStateTone(event.state)}`}>
                  {formatEventState(event.state)}
                </span>
              </span>
              <span>{event.category}</span>
              <span>
                <small>{getReviewPendingTime(event)}</small>
              </span>
              <span>
                <button
                  aria-label={`Revisar ${event.title}`}
                  className="table-icon-action"
                  disabled={isLoadingReviewDetail}
                  title="Revisar ficha"
                  type="button"
                  onClick={() => {
                    onSelectReview(event);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <SearchIcon />
                </button>
              </span>
            </div>
          ))}
        </div>
        <div className={'settings-pagination'}>
          <button
            className={'back-button'}
            disabled={[reviewPage.number === 0, isLoadingReviewEvents].some(Boolean)}
            type={'button'}
            onClick={() => onPageChange(Math.max(0, reviewPage.number - 1))}
          >
            Anterior
          </button>
          <span>
            Página {reviewPage.totalPages === 0 ? 0 : reviewPage.number + 1} de {reviewPage.totalPages}
            {' '}· {reviewPage.totalElements} eventos
          </span>
          <button
            className={'back-button'}
            disabled={[reviewPage.number + 1 >= reviewPage.totalPages, isLoadingReviewEvents].some(Boolean)}
            type={'button'}
            onClick={() => onPageChange(reviewPage.number + 1)}
          >
            Siguiente
          </button>
        </div>
      </section>
    </>
  );
}

function FileSearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h5" />
      <path d="M14 2v6h6" />
      <path d="M16.5 17.5 21 22" />
      <circle cx="14" cy="15" r="3.5" />
    </svg>
  );
}

function MessageWarningIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" />
      <path d="M12 7v5" />
      <path d="M12 16h.01" />
    </svg>
  );
}

function BadgeCheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 2 15 5h4v4l3 3-3 3v4h-4l-3 3-3-3H5v-4l-3-3 3-3V5h4l3-3Z" />
      <path d="m8.5 12.5 2.2 2.2 4.8-5" />
    </svg>
  );
}

function ChartColumnIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M4 20h16" />
      <path d="M7 16V9" />
      <path d="M12 16V5" />
      <path d="M17 16v-4" />
    </svg>
  );
}

function parseReportCompletedDate(report) {
  const [day, month, year] = String(report.completedAt ?? '').split('/').map(Number);

  if (!day || !month || !year) {
    return new Date(report.generatedAtDate ?? report.approvedAt ?? 0);
  }

  return new Date(year, month - 1, day);
}

function safePercent(numerator, denominator) {
  if (!denominator || denominator <= 0) {
    return null;
  }

  return Math.round((numerator / denominator) * 100);
}

function ReportsDashboardView({ error = '', isLoading = false, notificationMenu, reports, onSelectReport }) {
  const availableReportYears = [
    ...new Set(
      reports
        .map((report) => parseReportCompletedDate(report).getFullYear())
        .filter((year) => Number.isFinite(year) && year > 0),
    ),
  ].sort((firstYear, secondYear) => secondYear - firstYear);
  const reportYearOptions = availableReportYears.length > 0
    ? availableReportYears
    : [new Date().getFullYear()];
  const [reportSearch, setReportSearch] = useState('');
  const [reportCategory, setReportCategory] = useState('Todas');
  const [reportYear, setReportYear] = useState(String(reportYearOptions[0]));
  const [reportMonth, setReportMonth] = useState('all');
  const [reportSort, setReportSort] = useState('recent');

  useEffect(() => {
    const availableYears = reportYearOptions.map(String);

    if (!availableYears.includes(reportYear)) {
      setReportYear(availableYears[0]);
    }
  }, [reportYear, reportYearOptions]);

  const reportCategoryOptions = ['Todas', ...new Set(reports.map((report) => report.category).filter(Boolean))];
  const reportMonthOptions = [
    ['all', 'Todos'],
    ['0', 'Enero'],
    ['1', 'Febrero'],
    ['2', 'Marzo'],
    ['3', 'Abril'],
    ['4', 'Mayo'],
    ['5', 'Junio'],
    ['6', 'Julio'],
    ['7', 'Agosto'],
    ['8', 'Septiembre'],
    ['9', 'Octubre'],
    ['10', 'Noviembre'],
    ['11', 'Diciembre'],
  ];
  const selectedMonthLabel = reportMonthOptions.find(([value]) => value === reportMonth)?.[1] ?? 'Todos';
  const highlightedPeriodLabel = reportMonth === 'all'
    ? `del ano ${reportYear}`
    : `de ${selectedMonthLabel.toLowerCase()} ${reportYear}`;
  const globallyFilteredReports = reports.filter((report) => {
    const reportDate = parseReportCompletedDate(report);
    const matchesCategory = reportCategory === 'Todas' || report.category === reportCategory;

    if (!matchesCategory || Number.isNaN(reportDate.getTime())) {
      return false;
    }

    if (String(reportDate.getFullYear()) !== reportYear) {
      return false;
    }

    return reportMonth === 'all' || reportDate.getMonth() === Number(reportMonth);
  });
  const filteredReportsBeforeSort = globallyFilteredReports.filter((report) => {
    const normalizedSearch = reportSearch.trim().toLowerCase();

    return normalizedSearch.length === 0 ||
      [report.title, report.venue, report.category]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch);
  });

  function hasAttendanceData(report) {
    return Boolean(report.requiereControlAsistencia) && Number(report.registered) > 0;
  }

  function hasQrData(report) {
    return Boolean(report.requiereControlAsistencia) && Number(report.qrValidated) > 0;
  }

  function hasSatisfactionData(report) {
    return Boolean(report.encuestaSatisfaccionHabilitada)
      && Number(report.totalValoraciones) > 0
      && Number(report.puntuacionPromedio) > 0;
  }

  function getAttendanceRate(report) {
    return Number.isFinite(Number(report.turnoutRate))
      ? Number(report.turnoutRate)
      : safePercent(report.totalAttendance, report.registered);
  }

  function getQrAdoption(report) {
    return Number.isFinite(Number(report.digitalValidationRate))
      ? Number(report.digitalValidationRate)
      : safePercent(report.qrValidated, report.qrValidated + report.manualValidated);
  }

  const sortableReports = filteredReportsBeforeSort.filter((report) => {
    if (['attendance', 'attendance-rate', 'low-participation'].includes(reportSort)) {
      return hasAttendanceData(report);
    }
    if (reportSort === 'qr-adoption') {
      return hasQrData(report);
    }
    if (reportSort === 'satisfaction') {
      return hasSatisfactionData(report);
    }
    return true;
  });
  const filteredReports = [...sortableReports].sort((firstReport, secondReport) => {
    if (reportSort === 'attendance') {
      return secondReport.totalAttendance - firstReport.totalAttendance;
    }
    if (reportSort === 'attendance-rate') {
      return (getAttendanceRate(secondReport) ?? 0) - (getAttendanceRate(firstReport) ?? 0);
    }
    if (reportSort === 'qr-adoption') {
      return (getQrAdoption(secondReport) ?? 0) - (getQrAdoption(firstReport) ?? 0);
    }
    if (reportSort === 'satisfaction') {
      return (secondReport.puntuacionPromedio ?? 0) - (firstReport.puntuacionPromedio ?? 0);
    }
    if (reportSort === 'low-participation') {
      return (getAttendanceRate(firstReport) ?? 0) - (getAttendanceRate(secondReport) ?? 0);
    }
    return parseReportCompletedDate(secondReport).getTime() - parseReportCompletedDate(firstReport).getTime();
  });
  const reportsWithAttendance = globallyFilteredReports.filter(hasAttendanceData);
  const reportsWithQr = globallyFilteredReports.filter(hasQrData);
  const reportsWithSatisfaction = globallyFilteredReports.filter(hasSatisfactionData);
  const totalFilteredAttendees = reportsWithAttendance.reduce(
    (total, report) => total + report.totalAttendance,
    0,
  );
  const totalFilteredRegistered = reportsWithAttendance.reduce(
    (total, report) => total + report.registered,
    0,
  );
  const totalFilteredQr = reportsWithQr.reduce(
    (total, report) => total + report.qrValidated,
    0,
  );
  const totalFilteredManual = reportsWithQr.reduce(
    (total, report) => total + report.manualValidated,
    0,
  );
  const averageAttendanceRate = safePercent(totalFilteredAttendees, totalFilteredRegistered);
  const averageQrAdoption = safePercent(totalFilteredQr, totalFilteredQr + totalFilteredManual);
  const averageSatisfaction = reportsWithSatisfaction.length > 0
    ? reportsWithSatisfaction.reduce((total, report) => total + Number(report.puntuacionPromedio), 0) / reportsWithSatisfaction.length
    : null;
  const totalSatisfactionRatings = reportsWithSatisfaction.reduce(
    (total, report) => total + Number(report.totalValoraciones ?? 0),
    0,
  );
  const globalReportStats = [
    {
      icon: FileSearchIcon,
      label: 'Eventos finalizados',
      tone: 'is-decision',
      trend: 'segun filtros activos',
      value: globallyFilteredReports.length,
    },
    {
      icon: BadgeCheckIcon,
      label: 'Asistentes totales',
      tone: 'is-month-approved',
      trend: 'solo eventos con asistencia',
      value: totalFilteredAttendees,
    },
    {
      icon: ChartColumnIcon,
      label: 'Tasa promedio',
      tone: 'is-month-report',
      trend: 'solo eventos con asistencia',
      value: averageAttendanceRate === null ? 'No disponible' : `${averageAttendanceRate}%`,
    },
    {
      icon: ChartColumnIcon,
      label: 'Adopcion QR promedio',
      tone: 'is-report-capacity',
      trend: 'solo eventos con QR',
      value: averageQrAdoption === null ? 'No disponible' : `${averageQrAdoption}%`,
    },
    {
      icon: BadgeCheckIcon,
      label: 'Satisfaccion promedio',
      tone: 'is-month-approved',
      trend: `${totalSatisfactionRatings} valoraciones`,
      value: averageSatisfaction === null ? 'No disponible' : `${averageSatisfaction.toFixed(1)} / 5`,
    },
  ];

  function getTopReport(criteria) {
    const candidates = globallyFilteredReports.filter((report) => {
      if (criteria === 'satisfaction') {
        return hasSatisfactionData(report);
      }
      if (criteria === 'qr-adoption') {
        return hasQrData(report);
      }
      return hasAttendanceData(report);
    });

    return candidates.sort((firstReport, secondReport) => {
      if (criteria === 'attendance') {
        return secondReport.totalAttendance - firstReport.totalAttendance;
      }
      if (criteria === 'attendance-rate') {
        return (getAttendanceRate(secondReport) ?? 0) - (getAttendanceRate(firstReport) ?? 0);
      }
      if (criteria === 'qr-adoption') {
        return (getQrAdoption(secondReport) ?? 0) - (getQrAdoption(firstReport) ?? 0);
      }
      if (criteria === 'satisfaction') {
        return (secondReport.puntuacionPromedio ?? 0) - (firstReport.puntuacionPromedio ?? 0);
      }
      if (criteria === 'low-participation') {
        return (getAttendanceRate(firstReport) ?? 0) - (getAttendanceRate(secondReport) ?? 0);
      }
      return 0;
    })[0] ?? null;
  }

  function getHighlightValue(criteria, report) {
    if (!report) {
      return 'No hay datos suficientes';
    }
    if (criteria === 'attendance') {
      return `${report.totalAttendance} asistentes`;
    }
    if (criteria === 'attendance-rate') {
      return `${getAttendanceRate(report)}% asistencia`;
    }
    if (criteria === 'qr-adoption') {
      return `${getQrAdoption(report)}% QR`;
    }
    if (criteria === 'satisfaction') {
      return `${Number(report.puntuacionPromedio).toFixed(1)} / 5`;
    }
    return `${getAttendanceRate(report)}% asistencia`;
  }

  const highlightedCards = [
    ['attendance', 'Mas asistido'],
    ['attendance-rate', 'Mejor tasa asistencia'],
    ['qr-adoption', 'Mejor adopcion QR'],
    ['satisfaction', 'Mayor satisfaccion'],
    ['low-participation', 'Menor participacion'],
  ].map(([criteria, label]) => {
    const report = getTopReport(criteria);
    return {
      criteria,
      label,
      report,
      value: getHighlightValue(criteria, report),
    };
  });

  return (
    <section className="reports-dashboard-view" aria-labelledby="reports-title">
      <header className="admin-topbar">
        <div>
          <span className="section-kicker">Reportes directivos</span>
          <h1 id="reports-title">Analisis de eventos finalizados</h1>
          <p>Consulta metricas acumuladas y reportes individuales de los eventos municipales finalizados.</p>
        </div>
        <div className="admin-topbar-actions">
          {notificationMenu}
        </div>
      </header>

      {error && <p className="settings-inline-notice" role="alert">{error}</p>}
      {isLoading && <p className="settings-inline-notice">Cargando reportes directivos...</p>}

      <section className="reports-global-filters" aria-label="Filtros globales de analisis">
        <label>
          Ano
          <select
            value={reportYear}
            onChange={(event) => setReportYear(event.target.value)}
          >
            {reportYearOptions.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </label>
        <label>
          Mes
          <select
            value={reportMonth}
            onChange={(event) => setReportMonth(event.target.value)}
          >
            {reportMonthOptions.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label>
          Categoria
          <select
            value={reportCategory}
            onChange={(event) => setReportCategory(event.target.value)}
          >
            {reportCategoryOptions.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>
      </section>

      <section className="admin-stats reports-global-stats" aria-label="Metricas globales de eventos finalizados">
        {globalReportStats.map((stat) => (
          <article
            className={`admin-stat-card management-stat-card directive-stat-card ${stat.tone}`}
            key={stat.label}
          >
            <span className="admin-stat-icon directive-stat-icon">
              <stat.icon />
            </span>
            <div>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              <small>{stat.trend}</small>
            </div>
          </article>
        ))}
      </section>

      <section className="admin-panel highlighted-events-panel" aria-labelledby="highlighted-events-title">
        <div className="admin-panel-heading">
          <div>
            <span className="section-kicker">Eventos destacados</span>
            <h2 id="highlighted-events-title">Resumen ejecutivo {highlightedPeriodLabel}</h2>
          </div>
        </div>
        <div className="highlighted-events-grid">
          {highlightedCards.map((card) => (
            <article className={card.report ? 'highlighted-event-card' : 'highlighted-event-card is-empty'} key={card.criteria}>
              <span className="highlight-rank">{card.label}</span>
              {card.report ? (
                <>
                  <div>
                    <strong>{card.report.title}</strong>
                    <small>{card.report.category}</small>
                  </div>
                  <span className="highlight-metric">{card.value}</span>
                  <small>{card.report.totalAttendance} asistentes · {card.report.registered} inscritos</small>
                  <button
                    aria-label={`Ver reporte de ${card.report.title}`}
                    className="table-icon-action"
                    title="Ver reporte"
                    type="button"
                    onClick={() => {
                      onSelectReport(card.report);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <AnalyticsIcon />
                  </button>
                </>
              ) : (
                <span className="highlight-empty">No hay datos suficientes</span>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="admin-table-panel admin-table-featured" id="reportes-evento">
        <div className="admin-panel-heading">
          <div>
            <h2>Historial de eventos finalizados</h2>
          </div>
        </div>

        <div className="reports-filter-grid" aria-label="Filtros de reportes">
          <label>
            Buscar reporte
            <input
              placeholder="Nombre, categoria o lugar"
              type="search"
              value={reportSearch}
              onChange={(event) => setReportSearch(event.target.value)}
            />
          </label>
          <label>
            Ordenar por
            <select
              value={reportSort}
              onChange={(event) => setReportSort(event.target.value)}
            >
              <option value="recent">Mas recientes</option>
              <option value="attendance">Mas asistidos</option>
              <option value="attendance-rate">Mayor tasa de asistencia</option>
              <option value="qr-adoption">Mejor adopcion QR</option>
              <option value="satisfaction">Mayor satisfaccion</option>
              <option value="low-participation">Menor participacion</option>
            </select>
          </label>
        </div>

        <div className="admin-table reports-main-table">
          <div className="admin-table-row admin-table-head">
            <span>Evento</span>
            <span>Inscritos</span>
            <span>Asistentes</span>
            <span>Fecha de cierre</span>
            <span>Reporte</span>
          </div>
          {filteredReports.map((report) => (
            <div className="admin-table-row" key={report.id}>
              <span>
                <strong>{report.title}</strong>
                <small>{report.date} - {report.venue}</small>
              </span>
              <span>{report.requiereControlAsistencia ? report.registered : 'No aplica'}</span>
              <span className="report-attendance-cell">
                <strong>{report.requiereControlAsistencia ? report.totalAttendance : 'No aplica'}</strong>
                <small>{report.requiereControlAsistencia && report.turnoutRate !== null ? `${report.turnoutRate}%` : 'Sin control'}</small>
              </span>
              <span>{report.completedAt}</span>
              <span>
                <button
                  aria-label={`Ver reporte de ${report.title}`}
                  className="table-icon-action"
                  title="Ver reporte"
                  type="button"
                  onClick={() => {
                    onSelectReport(report);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <AnalyticsIcon />
                </button>
              </span>
            </div>
          ))}
          {filteredReports.length === 0 && (
            <div className="admin-table-row">
              <span>No hay eventos finalizados para los filtros seleccionados.</span>
              <span />
              <span />
              <span />
              <span />
            </div>
          )}
        </div>
      </section>

    </section>
  );
}
function downloadReportCsv(report) {
  const rows = [
    ['campo', 'valor'],
    ['evento', report.title],
    ['categoria', report.category],
    ['fecha_evento', `${report.date} ${report.time}`],
    ['fecha_culminacion', report.completedAt],
    ['lugar', report.venue],
    ['estado', formatEventState(report.state)],
    ['inscritos', report.registered],
    ['asistentes_validados', report.totalAttendance],
    ['tasa_asistencia', `${report.turnoutRate}%`],
    [
      report.usedCapacityRate === null ? 'validacion_digital' : 'aforo_utilizado',
      report.usedCapacityRate === null
        ? `${report.digitalValidationRate}%`
        : `${report.usedCapacityRate}%`,
    ],
    ['validaciones_qr', report.qrValidated],
    ['validaciones_manual', report.manualValidated],
    ['validaciones_anuladas', report.cancelled],
    ['costo_referencial', report.referenceCost],
    ['fecha_generacion', report.generatedAt],
  ];
  const csvContent = rows
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `reporte-${slugify(report.title)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function openReportPdf(report) {
  const reportWindow = window.open('', '_blank', 'width=900,height=720');

  if (!reportWindow) {
    window.print();
    return;
  }

  reportWindow.document.write(`
    <html>
      <head>
        <title>Reporte - ${report.title}</title>
        <style>
          body { color: #102033; font-family: Arial, sans-serif; margin: 32px; }
          header { border-bottom: 2px solid #0a56c2; margin-bottom: 24px; padding-bottom: 16px; }
          h1 { font-size: 28px; margin: 8px 0 0; }
          h2 { font-size: 18px; margin: 24px 0 12px; }
          .kicker { color: #009ad6; font-size: 12px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
          .grid { display: grid; gap: 12px; grid-template-columns: repeat(4, 1fr); }
          .card { background: #eef9ff; border: 1px solid #cfe3f2; border-radius: 8px; padding: 14px; }
          .card span { color: #66758a; display: block; font-size: 12px; font-weight: 800; text-transform: uppercase; }
          .card strong { display: block; font-size: 26px; margin-top: 8px; }
          table { border-collapse: collapse; margin-top: 12px; width: 100%; }
          th, td { border-bottom: 1px solid #d8e4ef; padding: 10px; text-align: left; }
          th { color: #66758a; font-size: 12px; text-transform: uppercase; }
          @media print { body { margin: 18mm; } }
        </style>
      </head>
      <body>
        <header>
          <span class="kicker">Municipalidad de San Miguel</span>
          <h1>Reporte del evento: ${report.title}</h1>
          <p>${report.date} - ${report.venue}</p>
        </header>
        <section class="grid">
          <div class="card"><span>Inscritos</span><strong>${report.registered}</strong></div>
          <div class="card"><span>Asistentes</span><strong>${report.totalAttendance}</strong></div>
          <div class="card"><span>Tasa asistencia</span><strong>${report.turnoutRate}%</strong></div>
          <div class="card"><span>${report.usedCapacityRate === null ? 'Validación digital' : 'Aforo utilizado'}</span><strong>${report.usedCapacityRate === null ? report.digitalValidationRate : report.usedCapacityRate}%</strong></div>
        </section>
        <h2>Indicadores de control</h2>
        <table>
          <tr><th>Indicador</th><th>Valor</th></tr>
          <tr><td>Validaciones QR</td><td>${report.qrValidated}</td></tr>
          <tr><td>Validaciones manuales</td><td>${report.manualValidated}</td></tr>
          <tr><td>Validaciones anuladas</td><td>${report.cancelled}</td></tr>
          <tr><td>Costo referencial</td><td>S/ ${report.referenceCost.toLocaleString('es-PE')}</td></tr>
          <tr><td>Fecha de generación</td><td>${report.generatedAt}</td></tr>
        </table>
      </body>
    </html>
  `);
  reportWindow.document.close();
  reportWindow.focus();
  reportWindow.print();
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function EventReportView({ report, onActiveSectionChange, onBack, onCancelEvent }) {
  const effectiveValidations = report.qrValidated + report.manualValidated;
  const qrValidationRate = effectiveValidations > 0
    ? Math.round((report.qrValidated / effectiveValidations) * 100)
    : 0;
  const manualValidationRate = effectiveValidations > 0
    ? Math.round((report.manualValidated / effectiveValidations) * 100)
    : 0;
  const cancelledValidationRate = effectiveValidations > 0
    ? Math.min(100, Math.round((report.cancelled / effectiveValidations) * 100))
    : 0;
  const reportRef = useRef(null);
  const attendanceRef = useRef(null);
  const exportRef = useRef(null);
  const costPerAttendee = report.referenceCost && report.totalAttendance > 0
    ? report.referenceCost / report.totalAttendance
    : null;
  const costPerAttendeeLabel = costPerAttendee
    ? `S/ ${costPerAttendee.toLocaleString('es-PE', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      })}`
    : 'No disponible';
  const unassistedRegistered = Math.max(0, report.registered - report.totalAttendance);
  const goalValue = report.metaValor ?? report.goalValue;
  const goalType = report.metaTipo ?? report.goalType;
  const hasConfiguredGoal = Boolean(goalType && goalValue);
  const goalEvaluation = (() => {
    if (!goalType || !goalValue) {
      return null;
    }

    if (goalType === 'CANTIDAD_ASISTENTES') {
      const goalCompletion = safePercent(report.totalAttendance, goalValue);
      const attendanceDifference = report.totalAttendance - goalValue;

      return [
        {
          tone: 'neutral',
          title: 'Cumplimiento de meta',
          text: goalCompletion === null
            ? 'No hay datos suficientes para calcular el cumplimiento de meta.'
            : `Se registraron ${report.totalAttendance} asistentes frente a una meta de ${goalValue}, alcanzando un cumplimiento del ${goalCompletion}%.`,
        },
        {
          tone: 'neutral',
          title: 'Diferencia frente a meta',
          text: attendanceDifference > 0
            ? `La meta fue superada por ${attendanceDifference} asistentes.`
            : attendanceDifference === 0
              ? 'La meta establecida fue alcanzada.'
              : `Faltaron ${Math.abs(attendanceDifference)} asistentes para alcanzar la meta definida.`,
        },
      ];
    }

    if (goalType === 'PORCENTAJE_ASISTENCIA') {
      const goalCompletion = safePercent(report.turnoutRate, goalValue);
      const rateDifference = report.turnoutRate - goalValue;

      return [
        {
          tone: 'neutral',
          title: 'Cumplimiento de meta',
          text: goalCompletion === null
            ? 'No hay datos suficientes para calcular el cumplimiento de meta.'
            : `La tasa de asistencia fue de ${report.turnoutRate}%, frente a una meta establecida de ${goalValue}%, alcanzando un cumplimiento del ${goalCompletion}%.`,
        },
        {
          tone: 'neutral',
          title: 'Diferencia frente a meta',
          text: rateDifference > 0
            ? `La meta fue superada en ${rateDifference} puntos porcentuales.`
            : rateDifference === 0
              ? 'La meta establecida fue alcanzada.'
              : `Faltaron ${Math.abs(rateDifference)} puntos porcentuales para alcanzar la meta definida.`,
        },
      ];
    }

    return null;
  })();
  const attendanceGapInsight = {
    tone: 'neutral',
    title: 'Brecha de asistencia',
    text: `${unassistedRegistered} inscritos no registraron asistencia.`,
  };
  const digitalValidationInsight = {
    tone: 'neutral',
    title: 'Validación digital',
    text: effectiveValidations > 0
      ? `El ${qrValidationRate}% de las validaciones efectivas se realizaron mediante QR.`
      : 'No se registraron validaciones efectivas para calcular adopción QR.',
  };
  const capacityInsight = {
    tone: 'neutral',
    title: 'Aforo',
    text: report.usedCapacityRate === null
      ? 'Evento sin control de aforo configurado.'
      : `El evento utilizó ${report.usedCapacityRate}% de la capacidad configurada.`,
  };
  const operationalInsight = unassistedRegistered > 0
    ? attendanceGapInsight
    : digitalValidationInsight;
  const executiveSummaryTitle = hasConfiguredGoal ? 'Evaluación de meta' : 'Lectura operativa';
  const executiveInsights = hasConfiguredGoal
    ? [
        ...(goalEvaluation ?? []),
        operationalInsight,
      ]
    : [
        attendanceGapInsight,
        digitalValidationInsight,
        capacityInsight,
      ];
  const capacityOrCostStat = report.usedCapacityRate === null
    ? {
        icon: ChartColumnIcon,
        label: 'Costo por asistente',
        tone: 'is-report-cost',
        trend: 'estimado según asistentes',
        value: costPerAttendeeLabel,
      }
    : {
        icon: BadgeCheckIcon,
        label: 'Aforo utilizado',
        tone: 'is-report-capacity',
        trend: 'asistentes sobre capacidad',
        value: `${report.usedCapacityRate}%`,
      };
  const reportSummaryStats = [
    {
      icon: FileSearchIcon,
      label: 'Inscritos',
      tone: 'is-decision',
      trend: 'registros confirmados',
      value: report.registered,
    },
    {
      icon: BadgeCheckIcon,
      label: 'Asistentes',
      tone: 'is-month-approved',
      trend: 'validaciones totales',
      value: report.totalAttendance,
    },
    {
      icon: ChartColumnIcon,
      label: 'Tasa asistencia',
      tone: 'is-month-report',
      trend: 'asistentes sobre inscritos',
      value: `${report.turnoutRate}%`,
    },
    capacityOrCostStat,
  ];

  useEffect(() => {
    const observedSections = [
      ['report-section', reportRef.current],
      ['attendance-section', attendanceRef.current],
      ['export-section', exportRef.current],
    ].filter(([, element]) => Boolean(element));

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((firstEntry, secondEntry) =>
            secondEntry.intersectionRatio - firstEntry.intersectionRatio,
          )[0];

        if (visibleEntry?.target.id) {
          onActiveSectionChange(visibleEntry.target.id);
        }
      },
      {
        root: null,
        rootMargin: '-120px 0px -45% 0px',
        threshold: [0.2, 0.45, 0.7],
      },
    );

    observedSections.forEach(([, element]) => observer.observe(element));
    onActiveSectionChange('report-section');

    return () => {
      observer.disconnect();
    };
  }, [onActiveSectionChange]);

  return (
    <section className="event-report-view" aria-labelledby="event-report-title">
      <header className="admin-topbar">
        <div>
          <span className="section-kicker">Reporte por evento</span>
          <h1 id="event-report-title">{report.title}</h1>
        </div>
        <div className="directive-review-topbar-actions">
          {report.state === 'PUBLICADO' && (
            <button
              className="table-text-action observe"
              type="button"
              onClick={() => onCancelEvent?.(report)}
            >
              Cancelar evento
            </button>
          )}
          <button className="admin-new-event-action event-form-top-action" type="button" onClick={onBack}>
            Volver
          </button>
        </div>
      </header>

      <section
        className="admin-stats"
        id="report-section"
        ref={reportRef}
        aria-label="Resumen del reporte"
      >
        {reportSummaryStats.map((stat) => (
          <article
            className={`admin-stat-card management-stat-card directive-stat-card ${stat.tone}`}
            key={stat.label}
          >
            <span className="admin-stat-icon directive-stat-icon">
              <stat.icon />
            </span>
            <div>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              <small>{stat.trend}</small>
            </div>
          </article>
        ))}
      </section>

      <section className="admin-panel executive-summary-card" aria-labelledby="executive-summary-title">
        <span className="section-kicker">Análisis</span>
        <h2 id="executive-summary-title">{executiveSummaryTitle}</h2>
        <div className="executive-insight-list">
          {executiveInsights.map((insight) => (
            <article className={`executive-insight is-${insight.tone}`} key={insight.title}>
              <span className="executive-insight-marker" aria-hidden="true" />
              <div>
                <strong>{insight.title}</strong>
                <p>{insight.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        className="directive-review-grid"
        id="attendance-section"
        ref={attendanceRef}
      >
        <article className="admin-panel">
          <span className="section-kicker">Asistencia</span>
          <h2>Métodos de validación</h2>
          <div className="validation-methods" aria-label="Métodos de validación">
            <article className="validation-method">
              <div>
                <strong>QR</strong>
                <span>{report.qrValidated} validaciones</span>
              </div>
              <small>{qrValidationRate}%</small>
              <span className="validation-method-bar" aria-hidden="true">
                <span style={{ width: `${qrValidationRate}%` }} />
              </span>
            </article>
            <article className="validation-method is-manual">
              <div>
                <strong>Manual</strong>
                <span>{report.manualValidated} validaciones</span>
              </div>
              <small>{manualValidationRate}%</small>
              <span className="validation-method-bar" aria-hidden="true">
                <span style={{ width: `${manualValidationRate}%` }} />
              </span>
            </article>
            <article className="validation-method is-cancelled">
              <div>
                <strong>Anuladas</strong>
                <span>{report.cancelled} registros anulados</span>
              </div>
              <small>Fuera del total efectivo</small>
              <span className="validation-method-bar" aria-hidden="true">
                <span style={{ width: `${cancelledValidationRate}%` }} />
              </span>
            </article>
          </div>
          {report.generatedAt && (
            <p className="validation-generated-note">
              Generado: {report.generatedAt}
            </p>
          )}
        </article>

        <article className="admin-panel">
          <span className="section-kicker">Evento</span>
          <h2>Datos de referencia</h2>
          <dl className="directive-detail-list directive-reference-list">
            <div>
              <dt>Fecha</dt>
              <dd>{report.date} · {report.time}</dd>
            </div>
            <div>
              <dt>Lugar</dt>
              <dd>{report.venue}</dd>
            </div>
            <div>
              <dt>Categoría</dt>
              <dd>{report.category}</dd>
            </div>
            <div className="is-emphasis">
              <dt>Estado</dt>
              <dd>{formatEventState(report.state)}</dd>
            </div>
            <div className="is-emphasis">
              <dt>Costo referencial</dt>
              <dd>
                <span>S/ {report.referenceCost.toLocaleString('es-PE')}</span>
                {report.usedCapacityRate !== null && costPerAttendee && (
                  <small>
                    Costo por asistente: {costPerAttendeeLabel}
                  </small>
                )}
              </dd>
            </div>
          </dl>
        </article>
      </section>

      <section
        className="admin-panel directive-decision-panel"
        id="export-section"
        ref={exportRef}
      >
        <div>
          <span className="section-kicker">Exportación</span>
          <h2>Documento de reporte</h2>
          <p>
            Descarga el reporte formal del evento o exporta los datos para análisis externo.
          </p>
        </div>
        <div className="directive-decision-actions">
          <button
            className="table-text-action approve"
            type="button"
            onClick={() => openReportPdf(report)}
          >
            Descargar PDF
          </button>
          <button
            className="table-text-action observe"
            type="button"
            onClick={() => downloadReportCsv(report)}
          >
            Exportar CSV
          </button>
        </div>
      </section>
    </section>
  );
}

function formatHistoryDateTime(dateTime) {
  const date = new Date(dateTime);

  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    hour: '2-digit',
    hour12: true,
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function HistoryClockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function EventHistoryIcon({ type }) {
  const iconPaths = {
    APPROVED: (
      <>
        <path d="M20 6 9 17l-5-5" />
      </>
    ),
    CANCELLED: (
      <>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </>
    ),
    CORRECTION_COMMENT: (
      <>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" />
        <path d="m9 11 2 2 4-4" />
      </>
    ),
    CREATED: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6" />
      </>
    ),
    DATE: (
      <>
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <rect height="18" rx="2" width="18" x="3" y="4" />
        <path d="M3 10h18" />
      </>
    ),
    LOCATION: (
      <>
        <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </>
    ),
    OPERATIVE: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M19 8v6" />
        <path d="M22 11h-6" />
      </>
    ),
    OBSERVED: (
      <>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" />
        <path d="M12 7v5" />
        <path d="M12 16h.01" />
      </>
    ),
    PUBLISHED: (
      <>
        <path d="M12 2 15 8l6 .9-4.5 4.3 1.1 6.1L12 16.4 6.4 19.3l1.1-6.1L3 8.9 9 8Z" />
      </>
    ),
    RESOURCE: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6" />
        <path d="m10 15 2-2 4 4" />
        <path d="M8 17h8" />
      </>
    ),
    SAVED_DRAFT: (
      <>
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
        <path d="M17 21v-8H7v8" />
        <path d="M7 3v5h8" />
      </>
    ),
    SENT_TO_REVIEW: (
      <>
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
      </>
    ),
    UPDATED: (
      <>
        <path d="M21 12a9 9 0 0 1-9 9 8.7 8.7 0 0 1-6-2.3" />
        <path d="M3 12a9 9 0 0 1 15-6.7" />
        <path d="M21 3v6h-6" />
        <path d="M3 21v-6h6" />
      </>
    ),
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      {iconPaths[type] ?? iconPaths.CREATED}
    </svg>
  );
}

function ReviewInfoIcon({ type }) {
  const iconPaths = {
    audience: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    calendar: (
      <>
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <rect height="18" rx="2" width="18" x="3" y="4" />
        <path d="M3 10h18" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    district: (
      <>
        <path d="M3 21h18" />
        <path d="M5 21V7l7-4 7 4v14" />
        <path d="M9 21v-6h6v6" />
        <path d="M9 10h.01" />
        <path d="M15 10h.01" />
      </>
    ),
    location: (
      <>
        <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </>
    ),
    note: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6" />
        <path d="M8 13h8" />
        <path d="M8 17h5" />
      </>
    ),
    reference: (
      <>
        <path d="M12 2v20" />
        <path d="m17 5-5-3-5 3" />
        <path d="m17 19-5 3-5-3" />
        <path d="M4 12h16" />
      </>
    ),
    route: (
      <>
        <circle cx="6" cy="19" r="3" />
        <circle cx="18" cy="5" r="3" />
        <path d="M9 19h2a4 4 0 0 0 4-4v-6" />
      </>
    ),
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      {iconPaths[type] ?? iconPaths.note}
    </svg>
  );
}

function ReviewInfoList({ items }) {
  return (
    <dl className="directive-info-list">
      {items.map((item) => (
        <div className="directive-info-row" key={item.label}>
          <span className="directive-info-icon">
            <ReviewInfoIcon type={item.icon} />
          </span>
          <div>
            <dt>{item.label}</dt>
            <dd>
              {item.href ? (
                <a
                  aria-label={item.ariaLabel ?? `Abrir ${item.value}`}
                  className="directive-info-link"
                  href={item.href}
                  rel="noreferrer"
                  target="_blank"
                >
                  {item.value}
                </a>
              ) : (
                item.value
              )}
            </dd>
            {item.hint ? <small className={'directive-info-hint'}>{item.hint}</small> : null}
          </div>
        </div>
      ))}
    </dl>
  );
}

function EventHistoryMenu({ historyError = '', historyItems = [], isLoading = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function closeOnOutsideClick(event) {
      if (!menuRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', closeOnOutsideClick);

    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
    };
  }, [isOpen]);

  return (
    <div className="event-history-menu" ref={menuRef}>
      <button
        aria-expanded={isOpen}
        aria-label="Ver historial de gestión del evento"
        className="event-history-button"
        title="Historial de gestión"
        type="button"
        onClick={() => setIsOpen((currentOpen) => !currentOpen)}
      >
        <HistoryClockIcon />
      </button>
      {isOpen && (
        <aside className="event-history-panel" aria-label="Historial de gestión">
          <div className="event-history-header">
            <strong>Historial de gestión</strong>
            <small>{isLoading ? 'Cargando movimientos...' : `${historyItems.length} movimientos del evento`}</small>
          </div>
          <div className="event-history-list">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <article className="event-history-item is-neutral is-loading" key={`history-loading-${index}`}>
                  <span className="event-history-icon event-history-skeleton-dot" />
                  <div>
                    <span className="event-history-skeleton-line is-title" />
                    <span className="event-history-skeleton-line is-meta" />
                    <span className="event-history-skeleton-line" />
                  </div>
                </article>
              ))
            ) : historyError ? (
              <p className="event-history-empty is-error">{historyError}</p>
            ) : historyItems.length > 0 ? (
              historyItems.map((item) => (
                <article className={`event-history-item is-${item.tone}`} key={item.id}>
                  <span className="event-history-icon">
                    <EventHistoryIcon type={item.type} />
                  </span>
                  <div>
                    <div className="event-history-item-heading">
                      <strong>{item.title}</strong>
                      <time dateTime={item.dateTime}>{formatHistoryDateTime(item.dateTime)}</time>
                    </div>
                    <span className="event-history-actor">
                      {item.actorName} · {item.actorRole}
                    </span>
                    {item.message && <p>{item.message}</p>}
                    {item.userComment && (
                      <blockquote>{item.userComment}</blockquote>
                    )}
                  </div>
                </article>
              ))
            ) : (
              <p className="event-history-empty">Aún no hay movimientos registrados para este evento.</p>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}

function DirectiveReviewView({ event, historyError = '', historyItems = [], isLoadingHistory = false, onActiveSectionChange, onBack, onDecision }) {
  const fichaRef = useRef(null);
  const recursosRef = useRef(null);
  const decisionRef = useRef(null);
  const [previewResource, setPreviewResource] = useState(null);
  const aforoMaximo = getAforoMaximo(event);
  const canDecide = reviewableStates.includes(event.state);
  const canCancelEvent = event.state !== 'CANCELADO';
  const reviewTimeMetric = getReviewTimeMetric(event);
  const shouldShowPreviousObservation = Boolean(event.previousObservation);
  const mainInfoItems = [
    {
      icon: 'clock',
      label: 'Duración',
      value: getDisplayValue(event.duration, 'No especificada'),
    },
    {
      icon: 'note',
      label: 'Costo referencial',
      hint: 'Gasto estimado del evento para la municipalidad.',
      value: getReferenceCostLabel(event),
    },
    {
      icon: 'audience',
      label: 'Público objetivo',
      value: getDisplayValue(event.audience, 'Público general'),
    },
  ];
  const metadataItems = [
    {
      icon: 'district',
      label: 'Área responsable',
      value: getDisplayValue(event.organizer, 'Área no especificada'),
    },
    {
      icon: 'calendar',
      label: 'Fecha y hora',
      value: getDirectiveScheduleLabel(event),
    },
    {
      icon: 'location',
      label: 'Lugar',
      value: getDisplayValue(event.venue, 'Lugar no especificado'),
      href: getEventMapsUrl(event),
      ariaLabel: `Abrir ${getDisplayValue(event.venue, 'ubicación del evento')} en Google Maps`,
    },
    {
      icon: 'audience',
      label: 'Aforo',
      value: hasAforoMaximo(event)
        ? `${aforoMaximo} participantes`
        : 'Aforo no asignado',
    },
  ];

  function openResourcePreview(resource) {
    if (resource.externalUrl && resource.kind !== 'image') {
      window.open(resource.externalUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    setPreviewResource(resource);
  }

  useEffect(() => {
    const observedSections = [
      ['ficha-directiva', fichaRef.current],
      ['recursos-directivos', recursosRef.current],
      ['decision-directiva', decisionRef.current],
    ].filter(([, element]) => Boolean(element));

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((firstEntry, secondEntry) =>
            secondEntry.intersectionRatio - firstEntry.intersectionRatio,
          )[0];

        if (visibleEntry?.target.id) {
          onActiveSectionChange(visibleEntry.target.id);
        }
      },
      {
        root: null,
        rootMargin: '-120px 0px -45% 0px',
        threshold: [0.2, 0.45, 0.7],
      },
    );

    observedSections.forEach(([, element]) => observer.observe(element));
    onActiveSectionChange('ficha-directiva');

    return () => {
      observer.disconnect();
    };
  }, [onActiveSectionChange]);

  return (
    <section className="directive-review-view" aria-labelledby="review-event-title">
      <header className="admin-topbar">
        <div>
          <span className="section-kicker">Ficha de revisión</span>
          <h1 id="review-event-title">{event.title}</h1>
        </div>
        <div className="directive-review-topbar-actions">
          <EventHistoryMenu historyError={historyError} historyItems={historyItems} isLoading={isLoadingHistory} />
          <button className="admin-new-event-action event-form-top-action" type="button" onClick={onBack}>
            Volver
          </button>
        </div>
      </header>

      <section className="directive-review-hero" id="ficha-directiva" ref={fichaRef}>
        <article className="admin-panel directive-review-summary">
          <div className="directive-summary-heading">
            <div>
              <span className="section-kicker">Evaluación directiva</span>
              <h2>Resumen para decisión</h2>
              <p className="directive-summary-intro">
                Revisa la información principal, los datos operativos y los recursos antes de registrar una decisión.
              </p>
            </div>
            <div className="directive-summary-status">
              <span className={`state-badge ${getDirectiveStateTone(event.state)}`}>
                {formatEventState(event.state)}
              </span>
              {reviewTimeMetric.value && (
                <span className="directive-review-time-metric">
                  Pendiente desde {reviewTimeMetric.value.toLowerCase()}
                </span>
              )}
              <span className="directive-category-pill">{event.category}</span>
            </div>
          </div>
          <div className={'directive-description-grid'}>
            <section className="is-main-description">
              <span>Descripción</span>
              <p>{getDisplayValue(event.description, 'Descripción no especificada.')}</p>
            </section>
            <section>
              <span>Descripción breve</span>
              <p>{getDisplayValue(event.descripcion_breve ?? event.summary, 'Descripción breve no especificada.')}</p>
            </section>
          </div>
          <ReviewInfoList items={metadataItems} />
          {shouldShowPreviousObservation && (
            <div className="directive-review-checks" aria-label="Indicadores de revisión">
              <span>Corrección atendida</span>
            </div>
          )}
        </article>
      </section>

      {shouldShowPreviousObservation && (
        <article className="previous-observation-card">
          <span className="previous-observation-icon">
            <EventHistoryIcon type="OBSERVED" />
          </span>
          <div>
            <span className="section-kicker">Observación anterior</span>
            <p>{event.previousObservation.comment}</p>
            <small>
              {event.previousObservation.role} {event.previousObservation.author} · {formatHistoryDateTime(event.previousObservation.dateTime)}
            </small>
          </div>
        </article>
      )}

      <section className="admin-panel directive-personal-info">
        <span className="section-kicker">Información personal</span>
        <h2>Datos complementarios del evento</h2>
        <ReviewInfoList items={mainInfoItems} />
      </section>

      <DirectiveOperativeAssignments event={event}></DirectiveOperativeAssignments>

      <section className="admin-panel" id="recursos-directivos" ref={recursosRef}>
        <div className="admin-panel-heading">
          <div>
            <span className="section-kicker">Recursos</span>
            <h2>Material adjunto</h2>
            <p className="directive-resource-purpose">
              Validación de recursos visibles para la publicación ciudadana.
            </p>
          </div>
        </div>
        <div className="directive-resource-grid">
          {reviewResourceLabels.map(([type, label]) => {
            const resourceItem = getDirectiveResourceItem(event, type);
            const fallbackValue = getResourceValue(event, type);
            const kind = getDirectiveReviewResourceKind(type, resourceItem);
            const resourceUrl = getDirectiveResourceUrl(resourceItem, fallbackValue);
            const isAvailable = Boolean(resourceUrl);
            const previewUrl = resourceUrl ?? getResourcePreviewUrl(fallbackValue, kind);
            const resourceName = getDirectiveResourceName(resourceItem, label);
            const externalUrl = resourceUrl;
            const resourceActionLabel = kind === 'video'
              ? 'Reproducir video'
              : kind === 'document'
                ? 'Abrir documento'
                : `Previsualizar ${label}`;

            return (
              <article
                className={`directive-resource-card ${isAvailable ? 'is-available' : 'missing'} is-${kind}`}
                key={type}
              >
                <div className="directive-resource-preview-shell">
                  {isAvailable && kind === 'image' && previewUrl ? (
                    <img alt={label} src={previewUrl} />
                  ) : isAvailable && kind === 'video' && previewUrl ? (
                    <>
                      <video
                        aria-hidden="true"
                        muted
                        playsInline
                        preload="metadata"
                        src={previewUrl}
                        onError={(videoEvent) => {
                          videoEvent.currentTarget.style.display = 'none';
                        }}
                      />
                      <span className="directive-video-playmark">
                        <ResourceActionIcon type="video" />
                      </span>
                    </>
                  ) : isAvailable && kind === 'document' ? (
                    <span className="directive-document-mark">
                      <ResourceActionIcon type="document" />
                    </span>
                  ) : (
                    <span className="directive-resource-empty-mark">Sin recurso</span>
                  )}
                </div>
                <div className="directive-resource-card-body">
                  <span className="directive-resource-type">{type}</span>
                  <strong>{label}</strong>
                  <small>{isAvailable ? resourceName : 'Recurso pendiente de carga'}</small>
                </div>
                <div className="directive-resource-meta">
                  <button
                    aria-label={isAvailable ? resourceActionLabel : `${label} no disponible`}
                    className="directive-resource-action"
                    disabled={!isAvailable}
                    title={isAvailable ? resourceActionLabel : 'No disponible'}
                    type="button"
                    onClick={() => openResourcePreview({
                      externalUrl,
                      kind,
                      label,
                      previewUrl,
                      type,
                    })}
                  >
                    {isAvailable ? <><ResourceActionIcon type={kind} /><span>{resourceActionLabel}</span></> : <span>No disponible</span>}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {previewResource && (
        <ResourcePreviewModal
          resource={previewResource}
          onClose={() => setPreviewResource(null)}
        />
      )}

      <section className="directive-review-grid">
        <article className="admin-panel">
          <span className="section-kicker">Requisitos</span>
          <h2>Condiciones para participar</h2>
          <ul className="directive-soft-list">
            {event.requirements.map((requirement) => (
              <li key={requirement}>{requirement}</li>
            ))}
          </ul>
        </article>

        <article className="admin-panel">
          <span className="section-kicker">Programa</span>
          <h2>Agenda prevista</h2>
          <ol className="directive-program-list">
            {event.agenda.map((agendaItem) => (
              <li key={agendaItem}>{agendaItem}</li>
            ))}
          </ol>
        </article>
      </section>

      <section className="admin-panel directive-decision-panel" id="decision-directiva" ref={decisionRef}>
        <div>
          <span className="section-kicker">Decisión</span>
          <h2>Aprobación directiva</h2>
          <p>
            Selecciona una acción para continuar con el proceso de publicación.
          </p>
        </div>
        <div className="directive-decision-actions">
          {canDecide && (
            <>
              <button
                className="table-text-action approve"
                type="button"
                onClick={() => onDecision({ eventId: event.id, eventTitle: event.title, type: 'approve' })}
              >
                Aprobar
              </button>
              <button
                className="table-text-action observe"
                type="button"
                onClick={() => onDecision({
                  eventId: event.id,
                  eventTitle: event.title,
                  previousObservation: event.previousObservation ?? null,
                  type: 'observe',
                })}
              >
                Observar
              </button>
            </>
          )}
          <button
            className="table-text-action observe"
            disabled={!canCancelEvent}
            type="button"
            onClick={() => onDecision({
              eventId: event.id,
              eventTitle: event.title,
              type: 'cancel',
            })}
          >
            Cancelar
          </button>
        </div>
      </section>
    </section>
  );
}

function DirectiveOperativeAssignments({ event }) {
  const operatives = getAssignedOperatives(event);
  const assignmentSummary = operatives.length === 1
    ? '1 usuario operativo asignado'
    : `${operatives.length} usuarios operativos asignados`;

  return (
    <section className={'admin-panel operative-assignment-section directive-operative-review'} aria-label={'Personal operativo asignado'}>
      <div className={'form-section-heading'}>
        <span className={'section-kicker'}>Personal operativo</span>
        <h2>Personal operativo asignado</h2>
        <p>Usuarios responsables del control de asistencia de este evento.</p>
      </div>

      {operatives.length > 0 ? (
        <div className={'directive-operative-compact-list'}>
          {operatives.map((operative) => (
            <article className={'directive-operative-card'} key={operative.id}>
              <strong>{operative.fullName}</strong>
              {operative.email && <small>{operative.email}</small>}
            </article>
          ))}
        </div>
      ) : (
        <p className={'settings-inline-notice'}>
          Este evento no tiene personal operativo asignado.
        </p>
      )}
    </section>
  );
}

function ResourceActionIcon({ type }) {
  const iconPaths = {
    document: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6" />
        <path d="M8 13h8" />
        <path d="M8 17h5" />
      </>
    ),
    image: (
      <>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    video: (
      <path d="m8 5 11 7-11 7Z" />
    ),
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      {iconPaths[type] ?? iconPaths.image}
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function ResourcePreviewModal({ resource, onClose }) {
  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [onClose]);

  function closeOnBackdrop(event) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <div className="resource-preview-backdrop" role="presentation" onMouseDown={closeOnBackdrop}>
      <section
        aria-labelledby="resource-preview-title"
        aria-modal="true"
        className={`resource-preview-modal is-${resource.kind}`}
        role="dialog"
      >
        <header className="resource-preview-header">
          <div>
            <span className="section-kicker">Material adjunto</span>
            <h2 id="resource-preview-title">{resource.label}</h2>
          </div>
          <button
            aria-label="Cerrar previsualización"
            className="resource-preview-close"
            type="button"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </header>

        <div className="resource-preview-body">
          {resource.kind === 'image' && (
            <img alt={resource.label} src={resource.previewUrl} />
          )}
          {resource.kind === 'document' && (
            <div className="resource-document-viewer">
              <span>
                <ResourceActionIcon type="document" />
              </span>
              <strong>Documento cargado para revisión</strong>
              <p>
                Recurso disponible en la ficha. Cuando el backend entregue el
                archivo PDF o documento visualizable, este espacio funcionará
                como visor interno o abrirá el archivo en una nueva pestaña.
              </p>
            </div>
          )}
          {resource.kind === 'video' && (
            <div className="resource-video-viewer">
              <span>
                <ResourceActionIcon type="video" />
              </span>
              <strong>Video referencial disponible</strong>
              <p>
                Previsualización preparada para reproducir el material
                audiovisual cuando exista un archivo local o embebible.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function DirectiveDecisionModal({ decision, error = '', isSaving = false, onCancel, onConfirm }) {
  const isApproval = decision.type === 'approve';
  const isCancellation = decision.type === 'cancel';
  const [observationComment, setObservationComment] = useState('');
  const canSubmitDecision = isApproval || observationComment.trim().length > 0;

  function submitDecision() {
    if (!canSubmitDecision || isSaving) {
      return;
    }

    onConfirm({
      comment: isApproval ? null : observationComment.trim(),
      type: decision.type,
    });
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        aria-labelledby="directive-decision-title"
        aria-modal="true"
        className="confirm-modal"
        role="dialog"
      >
        <span className="section-kicker">
          {isApproval ? 'Aprobar evento' : isCancellation ? 'Cancelar evento' : 'Observar evento'}
        </span>
        <h2 id="directive-decision-title">
          {isApproval
            ? 'Deseas aprobar este evento?'
            : isCancellation
              ? `Cancelar "${decision.eventTitle}"`
              : `Registrar observacion para "${decision.eventTitle}"`}
        </h2>
        <p>
          {isApproval
            ? 'Al aprobarlo, el evento pasara directamente a publicado.'
            : isCancellation
              ? 'Indica el motivo de cancelacion para dejar trazabilidad de la decision.'
              : 'Describe con claridad que debe corregir el administrador antes de reenviar la ficha.'}
        </p>
        
        {!isApproval && (
          <label className="directive-observation-field">
            {isCancellation ? 'Motivo de cancelacion' : 'Comentario de observacion'}
            <textarea
              required
              placeholder={isCancellation ? 'Explica brevemente por que se cancela.' : 'Indica que debe corregirse antes de publicar.'}
              value={observationComment}
              onChange={(event) => setObservationComment(event.target.value)}
            />
          </label>
        )}
        {error && <p className="settings-inline-notice" role="alert">{error}</p>}
        <div className="modal-actions">
          <button className="back-button" disabled={isSaving} type="button" onClick={onCancel}>
            Cancelar
          </button>
          <button
            className="primary-button"
            disabled={!canSubmitDecision || isSaving}
            type="button"
            onClick={submitDecision}
          >
            {isApproval ? 'Aprobar evento' : 'Enviar observación'}
          </button>
        </div>
      </section>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 4.5 4.5" />
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 16v-5" />
      <path d="M12 16V8" />
      <path d="M16 16v-7" />
      <path d="M8 11l4-3 4 1" />
    </svg>
  );
}

export default DirectivoDashboard;
