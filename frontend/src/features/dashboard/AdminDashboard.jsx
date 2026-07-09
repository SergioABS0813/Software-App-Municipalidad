import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import municipalLogo from '../../assets/images/municipalidad-logo.png';
import PublicEventDetail from '../public-portal/PublicEventDetail';
import { formatEventState } from './dashboardData';
import NotificationMenu from './NotificationMenu';
import './AdminDashboard.css';
import {
  actualizarEstadoUsuarioInterno,
  actualizarEstadoUbicacionConfiguracion,
  actualizarContactoCuentaVecinal,
  actualizarEventoGestion,
  actualizarUsuarioInterno,
  cancelarEventoGestion,
  eliminarCategoriaConfiguracion,
  eliminarEventoGestion,
  eliminarRecursoEvento,
  eliminarUbicacionConfiguracion,
  enviarEnlaceRestablecimientoUsuario,
  getCuentaVecinalDetalle,
  getCuentasVecinales,
  getCategoriasConfiguracion,
  getEstadosEventoGestion,
  getEventosActivosDesdeHoyCard,
  getEventosBorradoresCard,
  getEventosGestion,
  getEventosObservadosCard,
  getEventosParaRevisionCard,
  getUbicacionesConfiguracion,
  getNotificacionesAdministrador,
  getRecursosEvento,
  getOperativosActivos,
  getPagosInscripcionPendientes,
  getPagoInscripcionDetalle,
  observarPagoInscripcion,
  getUsuarioInternoDetalle,
  getUsuariosInternos,
  getRolesUsuariosInternos,
  guardarCategoria,
  guardarEventoGestion,
  guardarUsuarioInterno,
  guardarUbicacionConfiguracion,
  marcarNotificacionComoLeida,
  subirRecursoEvento,
  consultaDni,
  validarPagoInscripcion,
} from '../../services/dashboardService';
import { getApiErrorMessage } from '../../services/api/api';
import { CardSkeleton, EmptyState, ErrorState, EventFormSkeleton, TableSkeleton } from '../../components/feedback/LoadingStates';
import LoadingButton from '../../components/feedback/LoadingButton';

function getManagementStats(counts) {
  return [
    {
      icon: CalendarCheckLineIcon,
      label: 'Activos',
      tone: 'is-published',
      trend: 'desde hoy',
      value: counts.activosDesdeHoy,
    },
    {
      icon: FileEditLineIcon,
      label: 'Borradores',
      tone: 'is-draft',
      trend: 'requieren completar datos',
      value: counts.borradores,
    },
    {
      icon: ClipboardCheckLineIcon,
      label: 'Para revision',
      tone: 'is-review',
      trend: 'pendientes del directivo',
      value: counts.paraRevision,
    },
    {
      icon: TriangleAlertLineIcon,
      label: 'Observados',
      tone: 'is-observed',
      trend: 'requieren correcciones',
      value: counts.observados,
    },
  ];
}
const adminNotifications = [
  {
    id: 1,
    message: 'Carlos Ramirez creo el evento "Festival Juvenil".',
    type: 'Nuevo evento creado',
    unread: true,
  },
  {
    id: 2,
    message: 'Ana Torres envió "Carrera 5K" a revisión.',
    type: 'Evento enviado a revisión',
    unread: true,
  },
  {
    id: 3,
    message: 'Directivo observo "Taller de Marinera".',
    type: 'Evento observado',
    unread: true,
  },
  {
    id: 4,
    message: '"Voluntariado Local" fue publicado.',
    type: 'Evento publicado',
    unread: true,
  },
  {
    id: 5,
    message: '"Festival Cultural Barrial" fue publicado.',
    type: 'Evento publicado',
    unread: true,
  },
  {
    id: 6,
    message: '"Cine Familiar al Aire Libre" fue cancelado.',
    type: 'Evento cancelado',
    unread: true,
  },
];

const defaultPaymentInstructions = 'Ej. Realizar el pago de S/ 10.00 en caja municipal o mediante deposito al Banco de la Nacion. Luego, subir el comprobante en la plataforma...';

const eventFormSections = [
  { id: 'datos-generales', label: 'Datos generales' },
  { id: 'programacion', label: 'Programación' },
  { id: 'control-asistencia', label: 'Asistencia' },
  { id: 'personal-operativo', label: 'Operativos' },
  { id: 'evaluacion', label: 'Evaluación' },
  { id: 'contenido-evento', label: 'Contenido' },
  { id: 'ubicacion', label: 'Ubicación' },
  { id: 'recursos', label: 'Recursos' },
];
const UNCATEGORIZED_FILTER_VALUE = '__SIN_CATEGORIA__';

function formatNotificationTime(value) {
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

function mapAdminNotificationFromApi(notification) {
  const leida = Boolean(notification.leida ?? notification.read ?? false);

  return {
    id: notification.id,
    leida,
    message: notification.mensaje ?? notification.message ?? '',
    title: notification.titulo ?? notification.title ?? notification.tipo ?? '',
    time: formatNotificationTime(notification.fechaCreacion),
    type: notification.tipo ?? notification.type ?? '',
    unread: !leida,
    urlDestino: notification.urlDestino ?? notification.destinationUrl ?? '',
  };
}

function formatManagementDateTime(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    weekday: 'short',
  }).format(date);
}

function formatManagementTime(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('es-PE', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function formatManagementDuration(startValue, endValue) {
  if (!startValue || !endValue) {
    return '';
  }

  const startDate = new Date(startValue);
  const endDate = new Date(endValue);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) {
    return '';
  }

  const totalMinutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours} h ${minutes} min`;
  }

  return hours > 0 ? `${hours} h` : `${minutes} min`;
}

function mapPublicPreviewResource(resource) {
  const tipoRecurso = resource?.tipoRecurso ?? resource?.tipo_recurso ?? '';
  const signedUrl = resource?.signedUrl ?? resource?.url_recurso ?? resource?.url ?? '';

  return {
    ...resource,
    fecha_subida: resource?.fechaSubida ?? resource?.fecha_subida,
    mime_type: resource?.mimeType ?? resource?.mime_type,
    mimeType: resource?.mimeType ?? resource?.mime_type,
    nombre_archivo: resource?.nombreOriginal ?? resource?.nombre_archivo,
    nombreOriginal: resource?.nombreOriginal ?? resource?.nombre_archivo,
    recurso_id: resource?.id ?? resource?.recurso_id,
    signedUrl,
    tipo_recurso: tipoRecurso,
    tipoRecurso,
    url_recurso: signedUrl,
  };
}

function getPublicPreviewResources(event) {
  const resources = Array.isArray(event?.recursos)
    ? event.recursos
    : Array.isArray(event?.resourceItems)
      ? event.resourceItems
      : Array.isArray(event?.resources)
        ? event.resources
        : [];

  return resources.map(mapPublicPreviewResource);
}

function getPublicPreviewCoverUrl(resources, fallbackUrl = '') {
  const coverResource = resources.find((resource) => {
    const resourceType = resource.tipo_recurso?.toUpperCase();
    return resourceType === 'PORTADA' || resourceType === 'IMAGEN_PORTADA';
  });

  return coverResource?.signedUrl || coverResource?.url_recurso || fallbackUrl;
}

function mapManagementEventFromApi(event) {
  const pendingItems = Array.isArray(event.alertas)
    ? event.alertas.map((alerta) => alerta?.mensaje).filter(Boolean)
    : [];
  const categoryName = event.categoria?.nombre ?? '';
  const resourceItems = Array.isArray(event.recursos)
    ? event.recursos.map(mapPublicPreviewResource)
    : [];
  const videoResource = resourceItems.find((resource) => resource?.tipoRecurso === 'VIDEO');
  const coverUrl = getPublicPreviewCoverUrl(resourceItems);

  const directiveObservation = event.ultimaObservacionDirectiva ?? event.ultimaObservacion ?? null;
  const requiresControl = event.requiereControlAsistencia ?? true;
  const requiresPayment = Boolean(event.requierePago);
  const requiresRegistration = event.requiereInscripcion ?? (requiresControl || requiresPayment);
  const metaTipo = event.metaTipo ?? null;
  const metaValor = event.metaValor ?? '';
  const surveyEnabled = Boolean(
    event.encuestaSatisfaccionHabilitada ?? event.encuestaSatisfaccionHabilitado,
  );

  return {
    id: event.id,
    title: event.titulo ?? 'Evento sin titulo',
    descripcion_breve: event.descripcionBreve ?? '',
    description: event.descripcion ?? '',
    date: formatManagementDateTime(event.fechaHoraInicio),
    eventEnd: event.fechaHoraFin ?? '',
    eventStart: event.fechaHoraInicio ?? '',
    time: formatManagementTime(event.fechaHoraFin),
    duration: formatManagementDuration(event.fechaHoraInicio, event.fechaHoraFin),
    venue: event.ubicacionNombre ?? 'Ubicacion pendiente',
    state: event.estadoCodigo ?? 'BORRADOR',
    organizer: event.areaMunicipalNombre ?? '',
    area_municipal_id: event.areaMunicipalId ?? '',
    category: categoryName,
    categoria_id: event.categoria?.id ?? '',
    ubicacion_id: event.ubicacionId ?? '',
    referenceCost: event.costoReferencial ?? '',
    requiresPayment,
    paymentCost: event.costoVecinal ?? '',
    paymentInstructions: event.instruccionesPago ?? '',
    aforoMaximo: event.aforoMaximo ?? '',
    cuposDisponibles: event.cuposDisponibles ?? event.aforoMaximo ?? 0,
    spots: event.cuposDisponibles ?? event.aforoMaximo ?? 0,
    edad_minima: event.edadMin ?? '',
    edad_maxima: event.edadMax ?? '',
    requiresRegistration,
    requiereInscripcion: requiresRegistration,
    requiereControlAsistencia: requiresControl,
    metaAsistenciaHabilitada: Boolean(metaTipo),
    metaTipo,
    metaValor,
    encuestaSatisfaccionHabilitada: surveyEnabled,
    encuestaSatisfaccionHabilitado: surveyEnabled,
    motivoCancelacion: event.motivoCancelacion ?? '',
    fechaCancelacion: event.fechaCancelacion ?? '',
    usuarioCancelacionId: event.usuarioCancelacionId ?? null,
    directorObservation: directiveObservation?.observacion ?? '',
    directorObservationStatus: directiveObservation?.estado ?? '',
    directorObservationDateTime: directiveObservation?.fechaObservacion ?? '',
    directorName: directiveObservation?.usuarioNombre ?? '',
    lastUpdatedAt: event.actualizadoEn ?? '',
    criteriosFicha: Array.isArray(event.criteriosFicha) ? event.criteriosFicha : [],
    agenda_evento: Array.isArray(event.agenda) ? event.agenda : [],
    requisitos_evento: Array.isArray(event.requisitos) ? event.requisitos : [],
    operativosAsignados: Array.isArray(event.operativosAsignados) ? event.operativosAsignados : [],
    operativosAsignadosIds: Array.isArray(event.operativosAsignados)
      ? event.operativosAsignados.map((operativo) => operativo.usuarioId).filter(Boolean)
      : [],
    pendingItems,
    completeness: Number(event.completitud ?? 0),
    imageUrl: coverUrl,
    recursos: resourceItems,
    resourceItems,
    resources: {
      AFICHE: resourceItems.some((resource) => resource?.tipoRecurso === 'AFICHE'),
      IMAGEN_PORTADA: resourceItems.some((resource) => resource?.tipoRecurso === 'IMAGEN_PORTADA'),
      VIDEO: resourceItems.some((resource) => resource?.tipoRecurso === 'VIDEO'),
    },
    videoUrl: videoResource?.signedUrl ?? '',
  };
}

function mapCategoryCatalogFromApi(category) {
  return {
    id: category.id,
    nombre: category.nombre ?? '',
  };
}

function mapLocationCatalogFromApi(location) {
  return {
    direccion: location.direccion ?? '',
    distrito: 'San Miguel',
    estado: location.activo === 1 ? 'ACTIVO' : 'INACTIVO',
    latitud: location.latitud ?? '',
    longitud: location.longitud ?? '',
    nombre_lugar: location.nombre ?? '',
    referencia: location.referencia ?? '',
    ubicacion_id: location.id,
  };
}

function uniqueCatalogItems(items, getKey) {
  const seenKeys = new Set();

  return items.filter((item) => {
    const key = getKey(item);

    if (key === null || key === undefined || key === '' || seenKeys.has(String(key))) {
      return false;
    }

    seenKeys.add(String(key));
    return true;
  });
}

function getNamedFile(form, name) {
  const control = getNamedFormControl(form, name);
  return control?.files?.[0] ?? null;
}

function buildResourceUploadRequestsFromForm(form) {
  return [
    { tipoRecurso: 'IMAGEN_PORTADA', archivo: getNamedFile(form, 'coverImage') },
    { tipoRecurso: 'AFICHE', archivo: getNamedFile(form, 'poster') },
    { tipoRecurso: 'VIDEO', archivo: getNamedFile(form, 'videoFile') },
  ].filter((resource) => resource.archivo);
}
function emptyToNull(value) {
  return hasValue(value) ? value : null;
}

function numberOrNull(value) {
  return hasValue(value) ? Number(value) : null;
}

function positiveCapacityOrZero(value) {
  if (!hasValue(value)) {
    return 0;
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return numericValue <= 0 ? 1 : numericValue;
}

function buildEventCreatePayload(form, actionType) {
  const audienceType = getNamedFormValue(form, 'publico_tipo') || 'GENERAL';
  const capacityMode = getNamedFormValue(form, 'capacityMode');
  const attendanceGoalEnabled = isNamedChecked(form, 'attendanceGoalEnabled');
  const requiresRegistration = isNamedChecked(form, 'requiresRegistration');
  const requiereControlAsistencia = requiresRegistration && isNamedChecked(form, 'requiresAttendanceControl');
  const requiresPayment = requiresRegistration && isNamedChecked(form, 'requiresPayment');

  return {
    titulo: emptyToNull(getNamedFormValue(form, 'title')),
    descripcionBreve: emptyToNull(getNamedFormValue(form, 'descripcion_breve')),
    descripcion: emptyToNull(getNamedFormValue(form, 'description')),
    categoriaId: numberOrNull(getNamedFormValue(form, 'categoryId')),
    areaMunicipalId: numberOrNull(getNamedFormValue(form, 'area_municipal_id')),
    fechaHoraInicio: emptyToNull(getNamedFormValue(form, 'eventStart')),
    fechaHoraFin: emptyToNull(getNamedFormValue(form, 'eventEnd')),
    costoReferencial: numberOrNull(getNamedFormValue(form, 'referenceCost')),
    requierePago: requiresPayment,
    costoVecinal: requiresPayment ? numberOrNull(getNamedFormValue(form, 'paymentCost')) : null,
    instruccionesPago: requiresPayment ? emptyToNull(getNamedFormValue(form, 'paymentInstructions')) : null,
    ubicacionId: numberOrNull(getNamedFormValue(form, 'ubicacion_id')),
    aforoMaximo: requiresRegistration
      ? (capacityMode === 'none' ? null : positiveCapacityOrZero(getNamedFormValue(form, 'capacity')))
      : null,
    publicoTipo: audienceType,
    edadMin: audienceType === 'OBJETIVO' ? numberOrNull(getNamedFormValue(form, 'edad_minima')) : null,
    edadMax: audienceType === 'OBJETIVO' ? numberOrNull(getNamedFormValue(form, 'edad_maxima')) : null,
    metaTipo: requiresRegistration && attendanceGoalEnabled ? emptyToNull(getNamedFormValue(form, 'attendanceGoalType')) : null,
    metaValor: requiresRegistration && attendanceGoalEnabled ? numberOrNull(getNamedFormValue(form, 'attendanceGoalValue')) : null,
    encuestaSatisfaccionHabilitado: requiresRegistration && isNamedChecked(form, 'surveyEnabled') ? true : null,
    requiereInscripcion: requiresRegistration,
    requiereControlAsistencia,
    enviarRevision: actionType === 'review',
    operativosAsignadosIds: requiereControlAsistencia ? getSelectedOperativeIdsFromForm(form) : [],
    agenda: parseOrderedEventItems(getNamedFormValue(form, 'agenda_evento_json')),
    requisitos: parseOrderedEventItems(getNamedFormValue(form, 'requisitos_evento_json')),
    recursos: null,
  };
}


function getSelectedOperativeIdsFromForm(form) {
  if (!form) {
    return [];
  }

  return Array.from(form.querySelectorAll('input[name="operativosAsignadosIds"]'))
    .map((input) => Number(input.value))
    .filter((value) => Number.isFinite(value));
}

// TODO: reemplazar este mock por el catálogo de áreas municipales desde Spring Boot.
const areasMunicipales = [
  {
    area_municipal_id: 1,
    nombre: 'Gerencia de Desarrollo Social',
    tipo_area: 'GERENCIA',
    organizar_eventos: true,
  },
  {
    area_municipal_id: 2,
    nombre: 'Subgerencia de Bienestar Social y DEMUNA',
    tipo_area: 'SUBGERENCIA',
    organizar_eventos: true,
  },
  {
    area_municipal_id: 3,
    nombre: 'Subgerencia de Educación y Cultura',
    tipo_area: 'SUBGERENCIA',
    organizar_eventos: true,
  },
  {
    area_municipal_id: 4,
    nombre: 'Subgerencia de Deporte y Recreación',
    tipo_area: 'SUBGERENCIA',
    organizar_eventos: true,
  },
  {
    area_municipal_id: 5,
    nombre: 'Oficina de Participación Vecinal',
    tipo_area: 'OFICINA',
    organizar_eventos: true,
  },
  {
    area_municipal_id: 6,
    nombre: 'Gerencia de Salud',
    tipo_area: 'GERENCIA',
    organizar_eventos: true,
  },
  {
    area_municipal_id: 7,
    nombre: 'Subgerencia de Vigilancia Sanitaria y Zoonosis',
    tipo_area: 'SUBGERENCIA',
    organizar_eventos: true,
  },
  {
    area_municipal_id: 8,
    nombre: 'Subgerencia de Programas Alimentarios',
    tipo_area: 'SUBGERENCIA',
    organizar_eventos: true,
  },
  {
    area_municipal_id: 9,
    nombre: 'Gerencia de Desarrollo Económico y Cooperación',
    tipo_area: 'GERENCIA',
    organizar_eventos: true,
  },
  {
    area_municipal_id: 10,
    nombre: 'Subgerencia de Licencias y Comercio',
    tipo_area: 'SUBGERENCIA',
    organizar_eventos: true,
  },
  {
    area_municipal_id: 11,
    nombre: 'Subgerencia de Innovación',
    tipo_area: 'SUBGERENCIA',
    organizar_eventos: true,
  },
];

const eventOrganizerAreas = areasMunicipales.filter((area) => area.organizar_eventos === true);

const neighborStatusOptions = [
  { label: 'Todos', value: 'TODOS' },
  { label: 'Activo', value: 'ACTIVO' },
  { label: 'Pendiente de confirmación', value: 'PENDIENTE_CONFIRMACION' },
  { label: 'Inactivo', value: 'INACTIVO' },
];

const identityLookupMock = {
  11223344: { nombreCompleto: 'Operativo de asistencia' },
  12345678: { nombreCompleto: 'Administrador municipal' },
  87654321: { nombreCompleto: 'Directivo de Cultura' },
};

const settingsCategories = [
  // En backend, eventosAsociados debe calcularse con JOIN/COUNT desde eventos.
  { id: 1, nombre: 'Cultura', eventosAsociados: 8 },
  { id: 2, nombre: 'Deporte', eventosAsociados: 5 },
  { id: 3, nombre: 'Participación vecinal', eventosAsociados: 4 },
  { id: 4, nombre: 'Salud', eventosAsociados: 3 },
  { id: 5, nombre: 'Educación', eventosAsociados: 0 },
];

const settingsLocations = [
  {
    id: 1,
    nombre: 'Casa de la Cultura',
    direccion: 'Av. Federico Gallese 420',
    referencia: 'Ingreso principal por la avenida',
    tipo: 'Auditorio',
    aforoReferencial: 180,
    latitud: '-12.0763',
    longitud: '-77.0821',
    estado: 'ACTIVO',
  },
  {
    id: 2,
    nombre: 'Parque Media Luna',
    direccion: 'Circuito de playas, San Miguel',
    referencia: 'Zona central frente al malecon',
    tipo: 'Parque',
    aforoReferencial: 400,
    latitud: '-12.0876',
    longitud: '-77.0936',
    estado: 'ACTIVO',
  },
  {
    id: 3,
    nombre: 'Complejo Deportivo Municipal',
    direccion: 'Av. La Paz 1450',
    referencia: 'Ingreso por puerta norte',
    tipo: 'Complejo deportivo',
    aforoReferencial: 320,
    latitud: '-12.0899',
    longitud: '-77.0812',
    estado: 'ACTIVO',
  },
  {
    id: 4,
    nombre: 'Plaza principal',
    direccion: 'Centro civico de San Miguel',
    referencia: 'Explanada central junto al modulo municipal',
    tipo: 'Plaza',
    aforoReferencial: 600,
    latitud: '-12.0782',
    longitud: '-77.0851',
    estado: 'ACTIVO',
  },
  {
    id: 5,
    nombre: 'Auditorio municipal',
    direccion: 'Palacio Municipal',
    referencia: 'Segundo piso, acceso por recepcion',
    tipo: 'Auditorio',
    aforoReferencial: 120,
    latitud: '-12.0774',
    longitud: '-77.0837',
    estado: 'INACTIVO',
  },
];

// TODO: cargar este catálogo desde el CRUD real de ubicaciones en Spring Boot.
const registeredLocations = [
  {
    ubicacion_id: 1,
    nombre_lugar: 'Casa de la Juventud',
    distrito: 'San Miguel',
    direccion: 'Av. Universitaria 1801',
    referencia: 'Frente al parque, ingreso por puerta principal',
    latitud: -12.0765,
    longitud: -77.0831,
  },
  {
    ubicacion_id: 2,
    nombre_lugar: 'Plaza principal',
    distrito: 'San Miguel',
    direccion: 'Av. La Marina 2000',
    referencia: 'Zona central de la plaza',
    latitud: -12.0782,
    longitud: -77.0851,
  },
  {
    ubicacion_id: 3,
    nombre_lugar: 'Parque Media Luna',
    distrito: 'San Miguel',
    direccion: 'Malecón Bertolotto 610',
    referencia: 'Módulo municipal junto al ingreso peatonal',
    latitud: -12.0876,
    longitud: -77.0936,
  },
  {
    ubicacion_id: 4,
    nombre_lugar: 'Complejo Deportivo Municipal',
    distrito: 'San Miguel',
    direccion: 'Av. Costanera 1250',
    referencia: 'Ingreso por la puerta norte',
    latitud: -12.0899,
    longitud: -77.0812,
  },
];
const fallbackAdminUser = {
  email: 'admin@munisanmiguel.gob.pe',
  fullName: 'Sergio Bustamante',
  role: 'ADMINISTRADOR',
};

function getEventStateTone(state) {
  const stateToneMap = {
    BORRADOR: 'state-draft',
    CANCELADO: 'state-cancelled',
    EN_CURSO: 'state-active',
    FINALIZADO: 'state-finished',
    OBSERVADO: 'state-observed',
    PUBLICADO: 'state-published',
  };

  return stateToneMap[state] ?? 'state-default';
}

function getUserDisplayName(user) {
  return user?.fullName || user?.name || user?.email?.split('@')[0] || fallbackAdminUser.fullName;
}

function getUserInitials(name) {
  const nameParts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (nameParts.length === 0) {
    return 'AD';
  }

  return `${nameParts[0][0] ?? ''}${nameParts.at(-1)?.[0] ?? ''}`.toUpperCase();
}

function getNeighborStateLabel(state) {
  const labels = {
    ACTIVO: 'Activo',
    INACTIVO: 'Inactivo',
    PENDIENTE_CONFIRMACION: 'Pendiente',
  };

  return labels[state] ?? state;
}

function getNeighborStateTone(state) {
  const tones = {
    ACTIVO: 'neighbor-active',
    INACTIVO: 'neighbor-inactive',
    PENDIENTE_CONFIRMACION: 'neighbor-pending',
  };

  return tones[state] ?? 'neighbor-inactive';
}

function getRegisteredLocationById(locationId, locations = registeredLocations) {
  return locations.find(
    (location) => String(location.ubicacion_id) === String(locationId),
  );
}

function getLocationMapEmbedUrl(location) {
  if (!location?.latitud || !location?.longitud) {
    return '';
  }

  // TODO: reemplazar por URL oficial/clave configurada si el backend provee mapas reales.
  return `https://maps.google.com/maps?q=${location.latitud},${location.longitud}&z=16&output=embed`;
}

function getSettingsLocationMapEmbedUrl(location) {
  if (!location?.latitud || !location?.longitud) {
    return '';
  }

  return `https://maps.google.com/maps?q=${location.latitud},${location.longitud}&z=16&output=embed`;
}

function getSettingsLocationMapsUrl(location) {
  if (!location?.latitud || !location?.longitud) {
    return '';
  }

  return `https://www.google.com/maps/search/?api=1&query=${location.latitud},${location.longitud}`;
}

const LOCATION_DEFAULT_COORDINATES = {
  latitud: -12.0774,
  longitud: -77.0837,
};
const LOCATION_MAP_ZOOM = 16;
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';
let googleMapsScriptPromise = null;

function parseLocationCoordinate(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function getLocationCoordinates(location) {
  const latitud = parseLocationCoordinate(location?.latitud);
  const longitud = parseLocationCoordinate(location?.longitud);

  if (latitud === null || longitud === null) {
    return null;
  }

  return { latitud, longitud };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getGoogleMapsApi() {
  if (window.google?.maps?.places) {
    return Promise.resolve(window.google.maps);
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return Promise.reject(new Error('Google Maps API key no configurada.'));
  }

  if (!googleMapsScriptPromise) {
    googleMapsScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector('script[data-google-maps-loader="true"]');

      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(window.google.maps), { once: true });
        existingScript.addEventListener('error', reject, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.async = true;
      script.defer = true;
      script.dataset.googleMapsLoader = 'true';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
        GOOGLE_MAPS_API_KEY,
      )}&libraries=places&language=es&region=PE`;
      script.onload = () => resolve(window.google.maps);
      script.onerror = () => reject(new Error('No se pudo cargar Google Maps.'));
      document.head.appendChild(script);
    });
  }

  return googleMapsScriptPromise;
}

function getVideoPreviewEmbedUrl(url) {
  if (!url) {
    return '';
  }

  try {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      const videoId = parsedUrl.pathname.split('/').filter(Boolean)[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsedUrl.pathname.startsWith('/embed/')) {
        return url;
      }

      const videoId = parsedUrl.searchParams.get('v');
      return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
    }
  } catch {
    return '';
  }

  return '';
}

function normalizeOrderedEventItems(items = []) {
  return items
    .map((item, index) => {
      const descripcion =
        typeof item === 'string' ? item : item?.descripcion ?? item?.description ?? '';

      return {
        descripcion: String(descripcion).trim(),
        orden: Number(item?.orden ?? index + 1),
      };
    })
    .filter((item) => item.descripcion.length > 0)
    .sort((firstItem, secondItem) => firstItem.orden - secondItem.orden)
    .map((item, index) => ({
      ...item,
      orden: index + 1,
    }));
}

function parseOrderedEventItems(value) {
  if (!value) {
    return [];
  }

  try {
    const parsedItems = JSON.parse(value);
    return Array.isArray(parsedItems) ? normalizeOrderedEventItems(parsedItems) : [];
  } catch {
    return [];
  }
}

function hasValidOrderedItems(items) {
  return normalizeOrderedEventItems(items).length > 0;
}

function formatUserRole(role) {
  const roleLabels = {
    ADMINISTRADOR: 'Administrador',
    DIRECTIVO: 'Directivo',
    OPERATIVO: 'Operativo',
  };

  return roleLabels[role] ?? role ?? 'Administrador';
}

function getPendingTitle(state) {
  return state === 'OBSERVADO' ? 'Observaciones' : 'Pendientes de ficha';
}

function hasValidAforo(event) {
  if (event.capacityMode === 'none') {
    return true;
  }

  const aforoValue = event.aforoMaximo ?? event.spots;

  if (event.capacityMode === 'defined') {
    return Number(aforoValue) > 0;
  }

  if (!hasValue(aforoValue)) {
    return true;
  }

  return Number(aforoValue) >= 0;
}

function hasValidAudienceConfig(event) {
  const audienceType = event.publico_tipo ?? 'GENERAL';

  if (audienceType === 'GENERAL') {
    return true;
  }

  const minAge = Number(event.edad_minima);
  const maxAge = Number(event.edad_maxima);

  return (
    Number.isFinite(minAge) &&
    Number.isFinite(maxAge) &&
    minAge >= 0 &&
    maxAge > minAge &&
    maxAge <= 120
  );
}

function requiresAttendanceControl(event) {
  if (event?.requiresRegistration === false || event?.requiereInscripcion === false) {
    return false;
  }

  return event?.requiereControlAsistencia !== false;
}

function requiresEventRegistration(event) {
  if (typeof event?.requiresRegistration === 'boolean') {
    return event.requiresRegistration;
  }

  if (typeof event?.requiereInscripcion === 'boolean') {
    return event.requiereInscripcion;
  }

  return requiresAttendanceControl(event) || Boolean(event?.requiresPayment);
}

function hasAssignedOperatives(event) {
  return Array.isArray(event?.operativosAsignadosIds) && event.operativosAsignadosIds.length > 0;
}

function getOperativeChecklistItem(event) {
  if (!requiresAttendanceControl(event)) {
    return {
      complete: true,
      completeLabel: 'Personal operativo no requerido',
      pendingLabel: 'Personal operativo no requerido',
    };
  }

  return {
    complete: hasAssignedOperatives(event),
    completeLabel: 'Personal operativo asignado',
    pendingLabel: 'Falta personal operativo asignado',
  };
}

function getAudienceLabel(event) {
  const audienceType = event.publico_tipo ?? (event.edad_minima || event.edad_maxima ? 'OBJETIVO' : 'GENERAL');

  if (audienceType === 'OBJETIVO' && hasValidAudienceConfig({ ...event, publico_tipo: 'OBJETIVO' })) {
    return `${event.edad_minima}-${event.edad_maxima} años`;
  }

  return 'Público general';
}

function normalizeSearchText(value = '') {
  return value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function getMunicipalAreaById(areaId, areas = eventOrganizerAreas) {
  return areas.find(
    (area) => String(area.area_municipal_id) === String(areaId),
  );
}

function getMunicipalAreaByEvent(event, areas = eventOrganizerAreas) {
  if (event?.area_municipal_id) {
    return getMunicipalAreaById(event.area_municipal_id, areas);
  }

  const organizerText = normalizeSearchText(event?.organizer ?? '');

  if (!organizerText) {
    return null;
  }

  return (
    areas.find((area) => normalizeSearchText(area.nombre) === organizerText) ??
    areas.find((area) => normalizeSearchText(area.nombre).includes(organizerText)) ??
    areas.find((area) => organizerText.includes(normalizeSearchText(area.nombre))) ??
    areas.find((area) => {
      const areaText = normalizeSearchText(area.nombre);

      return ['cultura', 'deporte', 'participacion', 'salud', 'comercio', 'innovacion'].some(
        (keyword) => organizerText.includes(keyword) && areaText.includes(keyword),
      );
    }) ??
    null
  );
}

function getDateTimeLocalValue(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value) ? value.slice(0, 16) : '';
}

function formatDateToDateTimeLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function parsePublicEventDateTime(dateLabel = '', timeLabel = '') {
  const directValue = getDateTimeLocalValue(dateLabel);

  if (directValue) {
    return directValue;
  }

  const monthMap = {
    abr: 3,
    ago: 7,
    dic: 11,
    ene: 0,
    feb: 1,
    jul: 6,
    jun: 5,
    mar: 2,
    may: 4,
    nov: 10,
    oct: 9,
    sep: 8,
  };
  const normalizedDate = normalizeSearchText(dateLabel);
  const normalizedTime = normalizeSearchText(timeLabel);
  const dateMatch = normalizedDate.match(/(\d{1,2})\s+([a-z]{3})/);
  const timeMatch = normalizedTime.match(/(\d{1,2}):(\d{2})\s*([ap])\.?m/);

  if (!dateMatch || !timeMatch) {
    return '';
  }

  const day = Number(dateMatch[1]);
  const month = monthMap[dateMatch[2]];
  let hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2]);
  const meridiem = timeMatch[3];

  if (meridiem === 'p' && hours < 12) {
    hours += 12;
  }

  if (meridiem === 'a' && hours === 12) {
    hours = 0;
  }

  if (!Number.isFinite(day) || month === undefined) {
    return '';
  }

  return formatDateToDateTimeLocal(new Date(new Date().getFullYear(), month, day, hours, minutes));
}

function parseDurationMinutes(durationLabel = '') {
  const normalizedDuration = normalizeSearchText(durationLabel);
  const hourMatch = normalizedDuration.match(/(\d+)\s*hora/);
  const minuteMatch = normalizedDuration.match(/(\d+)\s*min/);

  return (Number(hourMatch?.[1] ?? 0) * 60) + Number(minuteMatch?.[1] ?? 0);
}

function getEventStartDateTimeValue(event) {
  return getDateTimeLocalValue(event.eventStart) ||
    getDateTimeLocalValue(event.fechaHoraInicio) ||
    getDateTimeLocalValue(event.date) ||
    parsePublicEventDateTime(event.date, event.time);
}

function getEventEndDateTimeValue(event) {
  const directEndValue =
    getDateTimeLocalValue(event.eventEnd) ||
    getDateTimeLocalValue(event.fechaHoraFin) ||
    getDateTimeLocalValue(event.time);

  if (directEndValue) {
    return directEndValue;
  }

  const startValue = getEventStartDateTimeValue(event);
  const durationMinutes = parseDurationMinutes(event.duration);

  if (!startValue || durationMinutes <= 0) {
    return startValue;
  }

  const endDate = new Date(startValue);
  endDate.setMinutes(endDate.getMinutes() + durationMinutes);

  return formatDateToDateTimeLocal(endDate);
}

function hasValidEventSchedule(event) {
  const startValue = getEventStartDateTimeValue(event);
  const endValue = getEventEndDateTimeValue(event);

  return hasValue(startValue) && hasValue(endValue) && isDateTimeAfter(startValue, endValue);
}

function canCompareDateTimeValues(startValue, endValue) {
  return hasValue(startValue) &&
    hasValue(endValue) &&
    !Number.isNaN(new Date(startValue).getTime()) &&
    !Number.isNaN(new Date(endValue).getTime());
}

function isDateTimeAfter(startValue, endValue) {
  if (!canCompareDateTimeValues(startValue, endValue)) {
    return true;
  }

  return new Date(endValue).getTime() > new Date(startValue).getTime();
}

function getEventChecklist(event, options = {}) {
  const observationAddressed = options.observationAddressed ?? false;
  const resolvedAreaId = event.area_municipal_id ?? getMunicipalAreaByEvent(event)?.area_municipal_id;
  const checks = [
    {
      complete:
        hasValue(event.title) &&
        hasValue(event.category) &&
        hasValue(resolvedAreaId) &&
        hasValue(event.descripcion_breve) &&
        hasValue(event.description),
      completeLabel: 'Datos generales completos',
      pendingLabel: 'Faltan datos generales',
    },
    {
      complete:
        hasValidEventSchedule(event) &&
        hasValue(event.publico_tipo) &&
        hasValidAudienceConfig(event) &&
        (!requiresEventRegistration(event) || hasValidAforo(event)),
      completeLabel: 'Fechas completas',
      pendingLabel: 'Falta programación o aforo',
    },
    {
      complete: hasValue(event.ubicacion_id),
      completeLabel: 'Ubicación registrada',
      pendingLabel: 'Falta completar ubicación',
    },
    {
      complete: hasValidOrderedItems(event.agenda_evento ?? event.agenda),
      completeLabel: 'Agenda del evento registrada',
      pendingLabel: 'Falta agenda del evento',
    },
    {
      complete: hasValidOrderedItems(event.requisitos_evento ?? event.requirements),
      completeLabel: 'Requisitos registrados',
      pendingLabel: 'Faltan requisitos del evento',
    },
    {
      complete: Boolean(event.resources?.IMAGEN_PORTADA),
      completeLabel: 'Recursos adjuntados',
      pendingLabel: 'Falta imagen de portada',
    },
    getOperativeChecklistItem(event),
  ];
  const completedChecks = checks.filter((item) => item.complete).length;
  const items = checks.map((item) => ({
    complete: item.complete,
    label: item.complete ? item.completeLabel : item.pendingLabel,
    positiveLabel: item.completeLabel,
  }));

  const hasUnaddressedObservation =
    event.state === 'OBSERVADO' && event.directorObservation && !observationAddressed;

  if (hasUnaddressedObservation) {
    items.push({
      complete: false,
      isContextual: true,
      label: 'Observación pendiente de corregir',
    });
  }

  return {
    completion: Math.round((completedChecks / checks.length) * 100),
    hasCriticalPending: completedChecks !== checks.length || hasUnaddressedObservation,
    hasRequiredBlocksComplete: completedChecks === checks.length,
    items,
  };
}

function getCreationEventChecklist(event) {
  const resolvedAreaId = event.area_municipal_id ?? getMunicipalAreaByEvent(event)?.area_municipal_id;
  const checks = [
    {
      complete:
        hasValue(event.title) &&
        hasValue(event.category) &&
        hasValue(resolvedAreaId) &&
        hasValue(event.descripcion_breve) &&
        hasValue(event.description),
      completeLabel: 'Datos generales completos',
    },
    {
      complete:
        hasValidEventSchedule(event) &&
        (!requiresEventRegistration(event) || hasValidAforo(event)) &&
        hasValue(event.referenceCost) &&
        hasValue(event.publico_tipo) &&
        hasValidAudienceConfig(event),
      completeLabel: 'Programación y Aforo completos',
    },
    {
      complete: hasValidOrderedItems(event.agenda_evento ?? event.agenda),
      completeLabel: 'Agenda del evento registrada',
    },
    {
      complete: hasValidOrderedItems(event.requisitos_evento ?? event.requirements),
      completeLabel: 'Requisitos registrados',
    },
    {
      complete: hasValue(event.ubicacion_id),
      completeLabel: 'Ubicación registrada',
    },
    {
      complete: Boolean(event.resources?.IMAGEN_PORTADA),
      completeLabel: 'Recursos adjuntados',
    },
    getOperativeChecklistItem(event),
  ];
  const completedChecks = checks.filter((item) => item.complete).length;

  return {
    completion: Math.round((completedChecks / checks.length) * 100),
    hasCriticalPending: completedChecks !== checks.length,
    items: checks.map((item) => ({
      complete: item.complete,
      label: item.complete ? item.completeLabel : item.pendingLabel,
      positiveLabel: item.completeLabel,
    })),
  };
}

function getChecklistEventFromForm(form, event, catalogs = {}) {
  if (!form) {
    return event;
  }

  const selectedLocationId = getNamedFormValue(form, 'ubicacion_id');
  const selectedLocation = getRegisteredLocationById(selectedLocationId, catalogs.locations);
  const selectedCategoryId = getNamedFormValue(form, 'categoryId');
  const selectedCategory = catalogs.categories?.find(
    (category) => String(category.id) === String(selectedCategoryId),
  );
  const agendaItems = parseOrderedEventItems(getNamedFormValue(form, 'agenda_evento_json'));
  const requirementItems = parseOrderedEventItems(
    getNamedFormValue(form, 'requisitos_evento_json'),
  );
  const audienceType = getNamedFormValue(form, 'publico_tipo') || 'GENERAL';
  const ageMin = audienceType === 'OBJETIVO' ? getNamedFormValue(form, 'edad_minima') : '';
  const ageMax = audienceType === 'OBJETIVO' ? getNamedFormValue(form, 'edad_maxima') : '';
  const selectedAreaId = getNamedFormValue(form, 'area_municipal_id');
  const selectedArea = getMunicipalAreaById(selectedAreaId);
  const requiresRegistration = isNamedChecked(form, 'requiresRegistration');
  const requiresControl = requiresRegistration && isNamedChecked(form, 'requiresAttendanceControl');
  const requiresPayment = requiresRegistration && isNamedChecked(form, 'requiresPayment');

  return {
    ...event,
    address: selectedLocation?.direccion ?? '',
    agenda: agendaItems.map((item) => item.descripcion),
    agenda_evento: agendaItems,
    audience: getAudienceLabel({
      edad_maxima: ageMax,
      edad_minima: ageMin,
      publico_tipo: audienceType,
    }),
    category: selectedCategory?.nombre ?? '',
    categoria_id: selectedCategoryId,
    date: getNamedFormValue(form, 'eventStart'),
    descripcion_breve: getNamedFormValue(form, 'descripcion_breve'),
    description: getNamedFormValue(form, 'description'),
    district: selectedLocation?.distrito ?? '',
    edad_maxima: ageMax || null,
    edad_minima: ageMin || null,
    area_municipal_id: selectedAreaId,
    organizer: selectedArea?.nombre ?? '',
    publico_tipo: audienceType,
    referenceCost: getNamedFormValue(form, 'referenceCost'),
    resources: {
      ...event.resources,
      AFICHE: Boolean(event.resources?.AFICHE || hasNamedFile(form, 'poster')),
      IMAGEN_PORTADA: Boolean(
        event.resources?.IMAGEN_PORTADA || hasNamedFile(form, 'coverImage'),
      ),
      VIDEO: Boolean(event.resources?.VIDEO || getNamedFormValue(form, 'videoUrl') || hasNamedFile(form, 'videoFile')),
    },
    aforoMaximo: requiresRegistration
      ? (getNamedFormValue(form, 'capacityMode') === 'none'
        ? null
        : positiveCapacityOrZero(getNamedFormValue(form, 'capacity')))
      : null,
    capacityMode: requiresRegistration ? getNamedFormValue(form, 'capacityMode') : 'none',
    encuestaComentarioHabilitado: requiresRegistration && isNamedChecked(form, 'surveyCommentsEnabled'),
    encuestaSatisfaccionHabilitada: requiresRegistration && isNamedChecked(form, 'surveyEnabled'),
    metaAsistenciaHabilitada: requiresRegistration && isNamedChecked(form, 'attendanceGoalEnabled'),
    metaTipo: requiresRegistration && isNamedChecked(form, 'attendanceGoalEnabled')
      ? getNamedFormValue(form, 'attendanceGoalType')
      : null,
    metaValor: requiresRegistration && isNamedChecked(form, 'attendanceGoalEnabled')
      ? getNamedFormValue(form, 'attendanceGoalValue')
      : null,
    requiresRegistration,
    requiresPayment,
    requiereInscripcion: requiresRegistration,
    requiereControlAsistencia: requiresControl,
    operativosAsignadosIds: requiresControl ? getSelectedOperativeIdsFromForm(form) : [],
    spots: requiresRegistration
      ? (getNamedFormValue(form, 'capacityMode') === 'none'
        ? ''
        : positiveCapacityOrZero(getNamedFormValue(form, 'capacity')))
      : '',
    time: getNamedFormValue(form, 'eventEnd'),
    title: getNamedFormValue(form, 'title'),
    ubicacion_id: selectedLocationId,
    venue: selectedLocation?.nombre_lugar ?? '',
    locationReference: selectedLocation?.referencia ?? '',
    requirements: requirementItems.map((item) => item.descripcion),
    requisitos_evento: requirementItems,
  };
}

function hasValue(value) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return value !== undefined && value !== null && String(value).trim().length > 0;
}

function getNamedFormControl(form, name) {
  return form?.elements.namedItem(name);
}

function getNamedFormValue(form, name) {
  const control = getNamedFormControl(form, name);

  if (!control) {
    return '';
  }

  if (control instanceof RadioNodeList) {
    return control.value;
  }

  return control.value;
}

function isNamedChecked(form, name) {
  const control = getNamedFormControl(form, name);

  return Boolean(control?.checked);
}

function hasNamedFile(form, name) {
  const control = getNamedFormControl(form, name);

  return Boolean(control?.files?.length);
}

function getMissingReviewFields(form, existingEvent = null) {
  const requiredFields = [
    ['title', 'Título del evento'],
    ['categoryId', 'Categoría'],
    ['area_municipal_id', 'Área responsable'],
    ['descripcion_breve', 'Descripción breve'],
    ['description', 'Descripción'],
    ['eventStart', 'Inicio o fecha del evento'],
    ['eventEnd', 'Fin u hora del evento'],
    ['referenceCost', 'Costo referencial'],
    ['ubicacion_id', 'Ubicación del evento'],
    ['agenda_evento_json', 'Agenda del evento'],
    ['requisitos_evento_json', 'Requisitos del evento'],
  ];
  const missingFields = requiredFields
    .filter(([fieldName]) => !hasValue(getNamedFormValue(form, fieldName)))
    .map(([, label]) => label);
  const shortDescription = getNamedFormValue(form, 'descripcion_breve');
  const capacityMode = getNamedFormValue(form, 'capacityMode');
  const attendanceGoalEnabled = isNamedChecked(form, 'attendanceGoalEnabled');
  const attendanceGoalType = getNamedFormValue(form, 'attendanceGoalType');
  const attendanceGoalValue = Number(getNamedFormValue(form, 'attendanceGoalValue'));
  const audienceType = getNamedFormValue(form, 'publico_tipo') || 'GENERAL';
  const minAge = Number(getNamedFormValue(form, 'edad_minima'));
  const maxAge = Number(getNamedFormValue(form, 'edad_maxima'));
  const eventStart = getNamedFormValue(form, 'eventStart');
  const eventEnd = getNamedFormValue(form, 'eventEnd');
  const requiresRegistration = isNamedChecked(form, 'requiresRegistration');
  const requiereControlAsistencia = requiresRegistration && isNamedChecked(form, 'requiresAttendanceControl');
  const requiresPayment = requiresRegistration && isNamedChecked(form, 'requiresPayment');

  if (shortDescription.length > 45) {
    missingFields.push('Descripción breve de máximo 45 caracteres');
  }

  if (hasValue(eventStart) && hasValue(eventEnd) && !isDateTimeAfter(eventStart, eventEnd)) {
    missingFields.push('Fin del evento posterior al inicio del evento');
  }

  if (!hasValidOrderedItems(parseOrderedEventItems(getNamedFormValue(form, 'agenda_evento_json')))) {
    missingFields.push('Agenda del evento');
  }

  if (
    !hasValidOrderedItems(parseOrderedEventItems(getNamedFormValue(form, 'requisitos_evento_json')))
  ) {
    missingFields.push('Requisitos del evento');
  }

  if (requiresPayment) {
    if (Number(getNamedFormValue(form, 'paymentCost')) <= 0) {
      missingFields.push('Monto de pago por inscripcion');
    }

    if (!hasValue(getNamedFormValue(form, 'paymentInstructions'))) {
      missingFields.push('Instrucciones de pago');
    }
  }

  if (requiresRegistration && capacityMode !== 'none' && Number(getNamedFormValue(form, 'capacity')) <= 0) {
    missingFields.push('Aforo máximo');
  }

  if (audienceType === 'OBJETIVO') {
    if (!Number.isFinite(minAge) || minAge < 0) {
      missingFields.push('Edad mínima válida');
    }

    if (!Number.isFinite(maxAge) || maxAge <= minAge || maxAge > 120) {
      missingFields.push('Edad máxima válida');
    }
  }

  if (requiresRegistration && attendanceGoalEnabled) {
    if (!attendanceGoalType) {
      missingFields.push('Tipo de meta de asistencia');
    }

    if (
      (attendanceGoalType === 'CANTIDAD_ASISTENTES' && attendanceGoalValue <= 0) ||
      (attendanceGoalType === 'PORCENTAJE_ASISTENCIA' &&
        (attendanceGoalValue < 1 || attendanceGoalValue > 100)) ||
      Number.isNaN(attendanceGoalValue)
    ) {
      missingFields.push('Valor de meta de asistencia');
    }
  }
  const hasMainResource =
    hasNamedFile(form, 'coverImage') ||
    Boolean(existingEvent?.resources?.IMAGEN_PORTADA);

  if (!hasMainResource) {
    missingFields.push('Imagen de portada');
  }

  if (requiereControlAsistencia && getSelectedOperativeIdsFromForm(form).length === 0) {
    missingFields.push('Personal operativo asignado');
  }

  return missingFields;
}

function formatPaymentDate(value) {
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return 'Por confirmar';
  }

  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatPaymentAmount(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return 'S/ 0.00';
  }

  return new Intl.NumberFormat('es-PE', {
    currency: 'PEN',
    style: 'currency',
  }).format(amount);
}

function isPdfReceipt(url = '') {
  return /\.pdf(?:$|[?#])/i.test(url);
}

const paymentStatusFilters = [
  { label: 'Todos', value: 'TODOS' },
  { label: 'En revision', value: 'EN_REVISION' },
  { label: 'Validado', value: 'VALIDADO' },
  { label: 'Rechazado', value: 'RECHAZADO' },
  { label: 'Observado', value: 'OBSERVADO' },
];

const paymentOrderOptions = [
  { label: 'Mas recientes primero', value: 'RECIENTES' },
  { label: 'Mas antiguos primero', value: 'ANTIGUOS' },
  { label: 'Mayor monto', value: 'MAYOR_MONTO' },
  { label: 'Menor monto', value: 'MENOR_MONTO' },
];

function PaymentStateBadge({ state }) {
  const stateLabels = {
    EN_REVISION: 'En revision',
    VALIDADO: 'Validado',
    RECHAZADO: 'Rechazado',
    OBSERVADO: 'Observado',
  };
  const stateTones = {
    EN_REVISION: 'state-review',
    VALIDADO: 'state-published',
    RECHAZADO: 'state-cancelled',
    OBSERVADO: 'state-observed',
  };

  return (
    <span className={`state-badge ${stateTones[state] ?? 'state-default'}`}>
      {stateLabels[state] ?? formatEventState(state)}
    </span>
  );
}

function AdminPaymentsValidationPage() {
  const [payments, setPayments] = useState([]);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [searchValue, setSearchValue] = useState('');
  const [orderValue, setOrderValue] = useState('RECIENTES');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const loadPayments = useCallback(() => {
    setIsLoading(true);
    setError('');

    getPagosInscripcionPendientes({
      busqueda: searchValue.trim(),
      estado: statusFilter,
      orden: orderValue,
    })
      .then((response) => {
        setPayments(Array.isArray(response) ? response : []);
      })
      .catch((requestError) => {
        console.error('No se pudieron cargar los pagos por validar.', requestError);
        setError(getApiErrorMessage(requestError, 'No se pudieron cargar los pagos por validar.'));
      })
      .finally(() => setIsLoading(false));
  }, [orderValue, searchValue, statusFilter]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments, reloadKey]);

  if (selectedPaymentId) {
    return (
      <AdminPaymentReviewDetail
        paymentId={selectedPaymentId}
        onBack={(message = '') => {
          setSelectedPaymentId(null);
          setReloadKey((currentKey) => currentKey + 1);
          if (message) {
            setNotice(message);
          }
        }}
        onChanged={() => setReloadKey((currentKey) => currentKey + 1)}
      />
    );
  }

  return (
    <>
      <header className="admin-topbar">
        <div>
          <span className="section-kicker">Pagos de inscripcion</span>
          <h1>Validacion manual de comprobantes</h1>
        </div>
      </header>

      <section className="admin-table-panel payments-validation-panel">
        <div className="admin-panel-heading">
          <div>
            <span className="section-kicker">Revision</span>
            <h2>Comprobantes de pago</h2>
          </div>
          <button
            aria-label="Actualizar comprobantes"
            className="payments-refresh-button"
            data-tooltip="Actualizar"
            disabled={isLoading}
            type="button"
            onClick={loadPayments}
          >
            <RefreshIcon />
          </button>
        </div>

        <div className="payments-filter-grid" aria-label="Filtros de pagos de inscripcion">
          <label>
            Buscar vecino
            <input
              value={searchValue}
              placeholder="Nombre o DNI"
              onChange={(event) => setSearchValue(event.target.value)}
            />
          </label>
          <label>
            Estado del comprobante
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {paymentStatusFilters.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label>
            Ordenamiento
            <select value={orderValue} onChange={(event) => setOrderValue(event.target.value)}>
              {paymentOrderOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>

        {notice && <p className="settings-inline-notice">{notice}</p>}

        <div className="admin-table payments-validation-table">
          <div className="admin-table-row admin-table-head">
            <span>Vecino</span>
            <span>Evento</span>
            <span>Pago</span>
            <span>Estado</span>
            <span>Accion</span>
          </div>
          {isLoading ? (
            <TableSkeleton columns={5} rows={4} />
          ) : error ? (
            <ErrorState description={error} onRetry={loadPayments} />
          ) : payments.length === 0 ? (
            <EmptyState title="No hay pagos registrados" description="Los comprobantes enviados apareceran en esta vista." />
          ) : payments.map((payment) => (
            <div className="admin-table-row" key={payment.id}>
              <span>
                <strong>{payment.vecinoNombre || 'Vecino'}</strong>
                <small>DNI {payment.vecinoDni || 'sin registrar'}</small>
              </span>
              <span>
                <strong>{payment.eventoTitulo || 'Evento municipal'}</strong>
                <small>Inscripcion #{payment.inscripcionId}</small>
              </span>
              <span>
                <strong>{formatPaymentAmount(payment.monto)}</strong>
                <small>{payment.medioPago || 'Medio no indicado'} - {formatPaymentDate(payment.fechaPago)}</small>
              </span>
              <span><PaymentStateBadge state={payment.estadoPago || payment.estadoInscripcion} /></span>
              <span className="payment-validation-actions">
                <button
                  aria-label="Ver comprobante"
                  className="table-icon-action is-detail neighbor-detail-action"
                  data-tooltip="Ver comprobante"
                  type="button"
                  onClick={() => {
                    setNotice('');
                    setSelectedPaymentId(payment.id);
                  }}
                >
                  <ViewIcon />
                </button>
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function AdminPaymentReviewDetail({ paymentId, onBack, onChanged }) {
  const [payment, setPayment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const [observation, setObservation] = useState('');
  const [isObservationOpen, setIsObservationOpen] = useState(false);
  const [isValidationOpen, setIsValidationOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadPayment = useCallback(() => {
    setIsLoading(true);
    setError('');

    getPagoInscripcionDetalle(paymentId)
      .then((response) => setPayment(response ?? null))
      .catch((requestError) => {
        console.error('No se pudo cargar el detalle del pago.', requestError);
        setError(getApiErrorMessage(requestError, 'No se pudo cargar el detalle del pago.'));
      })
      .finally(() => setIsLoading(false));
  }, [paymentId]);

  useEffect(() => {
    loadPayment();
  }, [loadPayment]);

  async function validatePayment() {
    if (!payment || isProcessing) {
      return;
    }

    setIsProcessing(true);
    setActionError('');
    setNotice('');

    try {
      const response = await validarPagoInscripcion(payment.id);
      const successMessage = response?.estadoInscripcion === 'CANCELADA' && response?.motivoCancelacion === 'AFORO_COMPLETO'
        ? 'El pago fue validado, pero la inscripcion se cancelo automaticamente porque ya no habia cupos disponibles.'
        : 'Pago validado. La inscripcion quedo confirmada y el QR fue generado.';
      setPayment(response);
      setIsValidationOpen(false);
      onChanged?.();
      onBack(successMessage);
    } catch (requestError) {
      setActionError(getApiErrorMessage(requestError, 'No se pudo validar el pago.'));
    } finally {
      setIsProcessing(false);
    }
  }

  function openValidationModal() {
    setActionError('');
    setIsValidationOpen(true);
  }

  async function observePayment(event) {
    event.preventDefault();

    if (!payment || isProcessing) {
      return;
    }

    if (!observation.trim()) {
      setActionError('Ingresa la observacion para el vecino.');
      return;
    }

    setIsProcessing(true);
    setActionError('');
    setNotice('');

    try {
      const response = await observarPagoInscripcion(payment.id, observation.trim());
      setPayment(response);
      setIsObservationOpen(false);
      setObservation('');
      onChanged?.();
      setNotice('Pago observado. El vecino recibira la indicacion para corregir el comprobante.');
    } catch (requestError) {
      setActionError(getApiErrorMessage(requestError, 'No se pudo observar el pago.'));
    } finally {
      setIsProcessing(false);
    }
  }

  function openObservationModal() {
    setObservation('');
    setActionError('');
    setIsObservationOpen(true);
  }

  const canReviewPayment = payment && !['VALIDADO', 'RECHAZADO'].includes(payment.estadoPago);

  return (
    <>
      <header className="admin-topbar payment-detail-topbar">
        <div>
          <button className="detail-back-link" type="button" onClick={onBack}>
            &larr; Volver a pagos
          </button>
          <span className="section-kicker">Comprobante de pago</span>
          <h1>{payment?.eventoTitulo || 'Detalle de comprobante'}</h1>
        </div>
        {payment && <PaymentStateBadge state={payment.estadoPago} />}
      </header>

      {notice && <p className="settings-inline-notice">{notice}</p>}
      {actionError && !isObservationOpen && !isValidationOpen && <p className="settings-inline-error">{actionError}</p>}

      {isLoading ? (
        <section className="admin-panel payment-review-detail"><TableSkeleton columns={2} rows={3} /></section>
      ) : error ? (
        <section className="admin-panel"><ErrorState description={error} onRetry={loadPayment} /></section>
      ) : !payment ? (
        <section className="admin-panel"><EmptyState title="Pago no encontrado" description="No se pudo ubicar el comprobante solicitado." /></section>
      ) : (
        <section className="admin-panel payment-review-detail is-standalone" aria-label="Detalle de comprobante">
          <div className="payment-receipt-preview">
            <div className="payment-receipt-toolbar">
              <div>
                <span className="section-kicker">Comprobante</span>
                <h2>{payment.eventoTitulo || 'Evento municipal'}</h2>
              </div>
              {payment.comprobanteUrl && (
                <a className="payment-open-file-button" href={payment.comprobanteUrl} rel="noopener noreferrer" target="_blank">
                  Abrir archivo
                </a>
              )}
            </div>
            <div className="payment-receipt-frame">
              {payment.comprobanteUrl ? (
                isPdfReceipt(payment.comprobanteUrl) ? (
                  <iframe title="Comprobante de pago" src={payment.comprobanteUrl} />
                ) : (
                  <img alt="Comprobante de pago" src={payment.comprobanteUrl} />
                )
              ) : (
                <span>No hay comprobante disponible.</span>
              )}
            </div>
          </div>

          <aside className="payment-review-summary">
            <span className="section-kicker">Datos de validacion</span>
            <dl>
              <div>
                <dt>Vecino</dt>
                <dd>
                  <strong>{payment.vecinoNombre || 'Vecino'}</strong>
                  <small>DNI {payment.vecinoDni || 'sin registrar'}</small>
                </dd>
              </div>
              <div>
                <dt>Evento</dt>
                <dd>{payment.eventoTitulo || 'Evento municipal'}</dd>
              </div>
              <div>
                <dt>Costo de inscripcion</dt>
                <dd>{formatPaymentAmount(payment.monto)}</dd>
              </div>
              <div>
                <dt>Medio de pago</dt>
                <dd>{payment.medioPago || 'No indicado'}</dd>
              </div>
              <div>
                <dt>Numero de operacion</dt>
                <dd>{payment.numeroOperacion || 'No indicado'}</dd>
              </div>
              <div>
                <dt>Fecha de pago</dt>
                <dd>{formatPaymentDate(payment.fechaPago)}</dd>
              </div>
              {payment.observacion && (
                <div>
                  <dt>Observacion</dt>
                  <dd>{payment.observacion}</dd>
                </div>
              )}
            </dl>
            {canReviewPayment && (
              <div className="payment-review-actions">
                <button className="table-text-action observe" disabled={isProcessing} type="button" onClick={openObservationModal}>
                  Observar
                </button>
                <button className="primary-button" disabled={isProcessing} type="button" onClick={openValidationModal}>
                  Validar
                </button>
              </div>
            )}
          </aside>
        </section>
      )}

      {isValidationOpen && payment && (
        <div className="modal-backdrop" role="presentation">
          <div className="confirm-modal event-delete-modal" role="dialog" aria-modal="true" aria-labelledby="payment-validation-title">
            <h2 id="payment-validation-title">Validar comprobante</h2>
            <p>
              &iquest;Estas seguro de validar el comprobante de pago de {payment.vecinoNombre || 'este vecino'} para el evento {payment.eventoTitulo || 'municipal'}?
            </p>
            <p>
              Al confirmar, la inscripcion quedara validada y se notificara al vecino por correo electronico.
            </p>
            {actionError && <p className="settings-inline-error">{actionError}</p>}
            <div className="modal-actions">
              <button className="back-button" disabled={isProcessing} type="button" onClick={() => setIsValidationOpen(false)}>
                Cancelar
              </button>
              <button className="primary-button" disabled={isProcessing} type="button" onClick={validatePayment}>
                {isProcessing ? 'Validando...' : 'Validar comprobante'}
              </button>
            </div>
          </div>
        </div>
      )}
      {isObservationOpen && payment && (
        <div className="modal-backdrop" role="presentation">
          <form className="confirm-modal event-delete-modal" onSubmit={observePayment}>
            <h2>Observar pago</h2>
            <p>Indica que debe corregir el vecino para volver a enviar el comprobante.</p>
            <label className="event-cancel-form">
              Observacion
              <textarea
                maxLength={500}
                value={observation}
                onChange={(changeEvent) => setObservation(changeEvent.target.value)}
              />
            </label>
            {actionError && <p className="settings-inline-error">{actionError}</p>}
            <div className="modal-actions">
              <button className="back-button" disabled={isProcessing} type="button" onClick={() => setIsObservationOpen(false)}>
                Cancelar
              </button>
              <button className="primary-button danger-action" disabled={isProcessing} type="submit">
                {isProcessing ? 'Enviando...' : 'Enviar observacion'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
function AdminDashboard({ onLogout, user }) {
  const [currentAdminView, setCurrentAdminView] = useState(() =>
    window.location.pathname === '/admin/pagos'
      ? 'payments'
      : window.location.pathname === '/admin/vecinos'
        ? 'neighbors'
      : window.location.pathname === '/admin/configuracion' ||
          window.location.pathname === '/admin/configuracion/san-miguel'
        ? 'settings-users'
        : window.location.pathname === '/admin/configuracion/usuarios'
          ? 'settings-users'
          : window.location.pathname === '/admin/configuracion/categorias'
            ? 'settings-categories'
            : window.location.pathname === '/admin/configuracion/ubicaciones'
              ? 'settings-locations'
              : 'dashboard',
  );
  const [isSettingsNavOpen, setIsSettingsNavOpen] = useState(() =>
    window.location.pathname.startsWith('/admin/configuracion'),
  );
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarTransitioning, setIsSidebarTransitioning] = useState(false);
  const [isSidebarDrawerOpen, setIsSidebarDrawerOpen] = useState(false);
  const [eventItems, setEventItems] = useState([]);
  const [managementCardCounts, setManagementCardCounts] = useState({
    activosDesdeHoy: 0,
    borradores: 0,
    observados: 0,
    paraRevision: 0,
  });
  const [isLoadingManagementCards, setIsLoadingManagementCards] = useState(true);
  const [eventCategoryCatalog, setEventCategoryCatalog] = useState([]);
  const [eventAreaCatalog, setEventAreaCatalog] = useState(eventOrganizerAreas);
  const [eventLocationCatalog, setEventLocationCatalog] = useState(registeredLocations);
  const [eventOperativeCatalog, setEventOperativeCatalog] = useState([]);
  const [eventStateCatalog, setEventStateCatalog] = useState([]);
  const [isLoadingEventCatalogs, setIsLoadingEventCatalogs] = useState(true);
  const [eventCatalogError, setEventCatalogError] = useState('');
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState('');
  const [eventsPage, setEventsPage] = useState({
    number: 0,
    size: 5,
    totalElements: 0,
    totalPages: 0,
  });
  const [pendingEventAction, setPendingEventAction] = useState(null);
  const [isSavingEventAction, setIsSavingEventAction] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [isDeletingEventAction, setIsDeletingEventAction] = useState(false);
  const [eventToCancel, setEventToCancel] = useState(null);
  const [cancelEventReason, setCancelEventReason] = useState('');
  const [cancelEventError, setCancelEventError] = useState('');
  const [isCancellingEventAction, setIsCancellingEventAction] = useState(false);
  const [eventDeleteNotice, setEventDeleteNotice] = useState('');
  const [eventsReloadKey, setEventsReloadKey] = useState(0);
  const [validationIssue, setValidationIssue] = useState(null);
  const [selectedAdminEvent, setSelectedAdminEvent] = useState(null);
  const [adminNotificationItems, setAdminNotificationItems] = useState(adminNotifications);
  const [adminNotificationCounts, setAdminNotificationCounts] = useState({
    total: adminNotifications.length,
    unread: adminNotifications.filter((notification) => notification.unread).length,
  });
  const [notificationFilter, setNotificationFilter] = useState('all');
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const [notificationError, setNotificationError] = useState('');
  const [targetUserDetailId, setTargetUserDetailId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('Todos');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [activePendingPopover, setActivePendingPopover] = useState(null);
  const [activeFormSection, setActiveFormSection] = useState(eventFormSections[0].id);
  const eventCatalogRequestRef = useRef(0);
  const pendingPopoverRef = useRef(null);
  const manualFormSectionRef = useRef(null);
  const manualFormSectionTimeoutRef = useRef(null);
  const sidebarTransitionTimeoutRef = useRef(null);
  const isEventFormView =
    currentAdminView === 'new-event' || currentAdminView === 'edit-event';
  const isSettingsView = currentAdminView.startsWith('settings-');
  const adminUser = user ?? fallbackAdminUser;
  const adminUserName = getUserDisplayName(adminUser);
  const managementStats = useMemo(() => getManagementStats(managementCardCounts), [managementCardCounts]);

  useEffect(() => () => {
    if (sidebarTransitionTimeoutRef.current) {
      window.clearTimeout(sidebarTransitionTimeoutRef.current);
    }
  }, []);

  const managementStateOptions = useMemo(
    () => [
      { label: 'Todos', value: 'Todos' },
      ...eventStateCatalog
        .map((state) => state.codigo)
        .filter(Boolean)
        .map((state) => ({
          label: formatEventState(state),
          value: state,
        })),
    ],
    [eventStateCatalog],
  );
  const managementCategoryOptions = useMemo(
    () => {
      return [
        { label: 'Todas', value: 'Todas' },
        ...eventCategoryCatalog.map((category) => ({
          label: category.nombre,
          value: String(category.id),
        })),
        { label: 'Sin categoria', value: UNCATEGORIZED_FILTER_VALUE },
      ];
    },
    [eventCategoryCatalog],
  );
  const loadManagementCards = useCallback(() => {
    setIsLoadingManagementCards(true);

    return Promise.all([
      getEventosActivosDesdeHoyCard(),
      getEventosBorradoresCard(),
      getEventosParaRevisionCard(),
      getEventosObservadosCard(),
    ])
      .then(([activosDesdeHoy, borradores, paraRevision, observados]) => {
        setManagementCardCounts({
          activosDesdeHoy: Number(activosDesdeHoy) || 0,
          borradores: Number(borradores) || 0,
          observados: Number(observados) || 0,
          paraRevision: Number(paraRevision) || 0,
        });
      })
      .catch((error) => {
        console.error('No se pudieron cargar los indicadores generales de eventos.', error);
        setManagementCardCounts({
          activosDesdeHoy: 0,
          borradores: 0,
          observados: 0,
          paraRevision: 0,
        });
      })
      .finally(() => setIsLoadingManagementCards(false));
  }, []);

  const loadAdminNotifications = useCallback((nextFilter = notificationFilter) => {
    const soloNoLeidas = nextFilter === 'unread';
    setIsLoadingNotifications(true);
    setNotificationError('');

    return getNotificacionesAdministrador({ soloNoLeidas })
      .then((data) => {
        const notifications = Array.isArray(data.notificaciones)
          ? data.notificaciones.map(mapAdminNotificationFromApi)
          : [];

        setAdminNotificationItems(notifications);
        setAdminNotificationCounts({
          total: data.total ?? notifications.length,
          unread: data.noLeidas ?? notifications.filter((notification) => !notification.leida).length,
        });
      })
      .catch((error) => {
        console.error('No se pudieron cargar las notificaciones.', error);
        setAdminNotificationItems([]);
        setAdminNotificationCounts({ total: 0, unread: 0 });
        setNotificationError(getApiErrorMessage(error, 'No se pudieron cargar las notificaciones.'));
      })
      .finally(() => setIsLoadingNotifications(false));
  }, [notificationFilter]);

  const loadEventCatalogs = useCallback(async () => {
    const requestId = eventCatalogRequestRef.current + 1;
    eventCatalogRequestRef.current = requestId;
    setIsLoadingEventCatalogs(true);
    setEventCatalogError('');

    try {
      const [categoriesData, locationsData, statesData, operativesData] = await Promise.all([
        getCategoriasConfiguracion({ page: 0, size: 200 }),
        getUbicacionesConfiguracion({ page: 0, size: 200 }),
        getEstadosEventoGestion(),
        getOperativosActivos(),
      ]);

      if (eventCatalogRequestRef.current !== requestId) {
        return;
      }

      const categories = Array.isArray(categoriesData.content)
        ? categoriesData.content.map(mapCategoryCatalogFromApi)
        : [];
      const locations = Array.isArray(locationsData.content)
        ? locationsData.content.map(mapLocationCatalogFromApi)
        : [];

      setEventCategoryCatalog(uniqueCatalogItems(categories, (category) => category.id));
      setEventAreaCatalog(uniqueCatalogItems(eventOrganizerAreas, (area) => area.area_municipal_id));
      setEventLocationCatalog(uniqueCatalogItems(locations, (location) => location.ubicacion_id));
      setEventStateCatalog(Array.isArray(statesData) ? statesData : []);
      setEventOperativeCatalog(Array.isArray(operativesData) ? operativesData : []);
    } catch (error) {
      console.error('No se pudieron cargar los catalogos de eventos.', error);

      if (eventCatalogRequestRef.current === requestId) {
        setEventCatalogError('No se pudieron cargar los catálogos del evento.');
      }
    } finally {
      if (eventCatalogRequestRef.current === requestId) {
        setIsLoadingEventCatalogs(false);
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const selectedCategoryId =
      categoryFilter === 'Todas' || categoryFilter === UNCATEGORIZED_FILTER_VALUE
        ? ''
        : categoryFilter;

    setIsLoadingEvents(true);
    setEventsError('');
    getEventosGestion({
      categoriaId: selectedCategoryId,
      estado: stateFilter === 'Todos' ? '' : stateFilter,
      page: eventsPage.number,
      sinCategoria: categoryFilter === UNCATEGORIZED_FILTER_VALUE,
      size: 5,
      texto: searchTerm,
    })
      .then((data) => {
        if (!isMounted) {
          return;
        }

        const content = Array.isArray(data.content) ? data.content : [];
        setEventItems(content.map(mapManagementEventFromApi));
        setEventsPage((currentPage) => ({
          ...currentPage,
          number: data.number ?? 0,
          size: data.size ?? 5,
          totalElements: data.totalElements ?? 0,
          totalPages: data.totalPages ?? 0,
        }));
      })
      .catch((error) => {
        console.error('No se pudieron cargar los eventos en gestion.', error);
        if (isMounted) {
          setEventItems([]);
          setEventsError(getApiErrorMessage(error, 'No se pudieron cargar los eventos.'));
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingEvents(false);
      });

    return () => {
      isMounted = false;
    };
  }, [categoryFilter, eventsPage.number, eventsReloadKey, searchTerm, stateFilter]);

  useEffect(() => {
    loadManagementCards();
  }, [eventsReloadKey, loadManagementCards]);

  useEffect(() => {
    loadAdminNotifications(notificationFilter);
  }, [loadAdminNotifications, notificationFilter]);

  useEffect(() => {
    const catalogLoadTimeout = window.setTimeout(() => {
      loadEventCatalogs();
    }, 0);

    return () => {
      window.clearTimeout(catalogLoadTimeout);
    };
  }, [loadEventCatalogs]);

  useEffect(() => {
    if (!isEventFormView) {
      return undefined;
    }

    const catalogLoadTimeout = window.setTimeout(() => {
      loadEventCatalogs();
    }, 0);

    return () => {
      window.clearTimeout(catalogLoadTimeout);
    };
  }, [currentAdminView, isEventFormView, loadEventCatalogs]);

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
    if (!activePendingPopover) {
      return undefined;
    }

    function closePendingPopoverOnOutsideClick(event) {
      if (!pendingPopoverRef.current?.contains(event.target)) {
        setActivePendingPopover(null);
      }
    }

    document.addEventListener('mousedown', closePendingPopoverOnOutsideClick);

    return () => {
      document.removeEventListener('mousedown', closePendingPopoverOnOutsideClick);
    };
  }, [activePendingPopover]);

  useEffect(() => {
    if (!isEventFormView) {
      return undefined;
    }

    const sectionElements = eventFormSections
      .map((section) => document.getElementById(section.id))
      .filter(Boolean);

    if (sectionElements.length === 0) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (manualFormSectionRef.current) {
          return;
        }

        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (firstEntry, secondEntry) =>
              secondEntry.intersectionRatio - firstEntry.intersectionRatio,
          )[0];

        if (visibleEntry?.target?.id) {
          setActiveFormSection(visibleEntry.target.id);
        }
      },
      {
        rootMargin: '-18% 0px -58% 0px',
        threshold: [0.15, 0.35, 0.6],
      },
    );

    sectionElements.forEach((sectionElement) => observer.observe(sectionElement));

    return () => {
      if (manualFormSectionTimeoutRef.current) {
        window.clearTimeout(manualFormSectionTimeoutRef.current);
        manualFormSectionTimeoutRef.current = null;
      }
      observer.disconnect();
    };
  }, [isEventFormView, currentAdminView]);

  function navigateToFormSection(sectionId) {
    closeSidebarDrawer();
    manualFormSectionRef.current = sectionId;
    if (manualFormSectionTimeoutRef.current) {
      window.clearTimeout(manualFormSectionTimeoutRef.current);
    }
    setActiveFormSection(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
    manualFormSectionTimeoutRef.current = window.setTimeout(() => {
      manualFormSectionRef.current = null;
      manualFormSectionTimeoutRef.current = null;
    }, 900);
  }

  function toggleSidebarControl() {
    if (window.matchMedia('(max-width: 1024px)').matches) {
      setIsSidebarDrawerOpen((isOpen) => !isOpen);
      return;
    }

    if (sidebarTransitionTimeoutRef.current) {
      window.clearTimeout(sidebarTransitionTimeoutRef.current);
    }

    setIsSidebarTransitioning(true);
    setIsSidebarCollapsed((isCollapsed) => !isCollapsed);
    sidebarTransitionTimeoutRef.current = window.setTimeout(() => {
      setIsSidebarTransitioning(false);
      sidebarTransitionTimeoutRef.current = null;
    }, 240);
  }

  function closeSidebarDrawer() {
    setIsSidebarDrawerOpen(false);
  }

  function handleAdminBrandClick() {
    closeSidebarDrawer();
    window.history.pushState(null, '', '/admin');
    setSelectedAdminEvent(null);
    setCurrentAdminView('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetEventsPage() {
    setEventsPage((currentPage) => ({ ...currentPage, number: 0 }));
  }

  function handleEventSearchChange(value) {
    setSearchTerm(value);
    resetEventsPage();
  }

  function handleEventStateFilterChange(value) {
    setStateFilter(value);
    resetEventsPage();
  }

  function handleEventCategoryFilterChange(value) {
    setCategoryFilter(value);
    resetEventsPage();
  }

  const filteredAdminEvents = eventItems;

  function openAdminEventEdit(event) {
    setIsLoadingEventCatalogs(true);
    setEventCatalogError('');
    setSelectedAdminEvent(event);
    setCurrentAdminView('edit-event');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openAdminEventReview(event) {
    setSelectedAdminEvent(event);
    setCurrentAdminView('review-event');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function openPublishedEventPreview(event) {
    let previewEvent = event;

    try {
      const resources = await getRecursosEvento(event.id);
      const previewResources = Array.isArray(resources)
        ? resources.map(mapPublicPreviewResource)
        : getPublicPreviewResources(event);

      previewEvent = {
        ...event,
        imageUrl: getPublicPreviewCoverUrl(previewResources, event.imageUrl),
        recursos: previewResources,
        resourceItems: previewResources,
      };
    } catch (error) {
      const previewResources = getPublicPreviewResources(event);
      previewEvent = {
        ...event,
        imageUrl: getPublicPreviewCoverUrl(previewResources, event.imageUrl),
        recursos: previewResources,
        resourceItems: previewResources,
      };
    }

    setSelectedAdminEvent(previewEvent);
    setCurrentAdminView('public-preview');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function findAdminEventById(eventId) {
    const localEvent = eventItems.find((event) => String(event.id) === String(eventId));

    if (localEvent) {
      return localEvent;
    }

    const data = await getEventosGestion({ page: 0, size: 50 });
    const content = Array.isArray(data.content) ? data.content : [];
    return content.map(mapManagementEventFromApi)
      .find((event) => String(event.id) === String(eventId)) ?? null;
  }

  function handleNotificationFilterChange(nextFilter) {
    setNotificationFilter(nextFilter);
  }

  async function handleNotificationRead(notification) {
    const wasUnread = notification?.leida === false;

    if (notification?.id) {
      await marcarNotificacionComoLeida(notification.id);
    }

    setAdminNotificationItems((currentItems) =>
      currentItems.map((currentNotification) =>
        currentNotification.id === notification?.id
          ? { ...currentNotification, leida: true, unread: false }
          : currentNotification,
      ),
    );
    if (wasUnread) {
      setAdminNotificationCounts((currentCounts) => ({
        ...currentCounts,
        unread: Math.max(0, currentCounts.unread - 1),
      }));
    }
  }

  async function handleNotificationOpen(notification) {
    const destination = notification?.urlDestino;

    if (!destination) {
      return;
    }

    window.history.pushState(null, '', destination);

    const eventMatch = destination.match(/^\/admin\/eventos\/([^/]+)\/(editar|detalle)$/);
    if (eventMatch) {
      const [, eventId, action] = eventMatch;
      const event = await findAdminEventById(eventId);

      if (!event) {
        setCurrentAdminView('dashboard');
        return;
      }

      if (action === 'editar') {
        openAdminEventEdit(event);
        return;
      }

      openPublishedEventPreview(event);
      return;
    }

    const userMatch = destination.match(/^\/admin\/usuarios-internos\/([^/]+)\/detalle$/);
    if (userMatch) {
      setTargetUserDetailId(Number(userMatch[1]));
      setCurrentAdminView('settings-users');
      setIsSettingsNavOpen(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function runAdminEventTableAction(event) {
    const actionConfig = getAdminEventActionConfig(event);

    if (!actionConfig) {
      return;
    }

    if (actionConfig.type === 'edit') {
      openAdminEventEdit(event);
      return;
    }

    if (actionConfig.type === 'review') {
      openAdminEventReview(event);
      return;
    }

    if (actionConfig.type === 'preview') {
      openPublishedEventPreview(event);
    }
  }

  async function confirmPendingEventAction() {
    if (!pendingEventAction || isSavingEventAction) {
      return;
    }

    try {
      setIsSavingEventAction(true);
      const shouldSendToReview = ['review', 'review-changes'].includes(pendingEventAction.type);
      const firstPayload = shouldSendToReview
        ? { ...pendingEventAction.payload, enviarRevision: false }
        : pendingEventAction.payload;
      let savedEvent = pendingEventAction.mode === 'edit'
        ? await actualizarEventoGestion(pendingEventAction.eventId, firstPayload)
        : await guardarEventoGestion(firstPayload);
      const eventoId = savedEvent.id ?? pendingEventAction.eventId;

      for (const resourceUpload of pendingEventAction.resourceUploads ?? []) {
        await subirRecursoEvento(eventoId, resourceUpload.tipoRecurso, resourceUpload.archivo);
      }

      if (shouldSendToReview) {
        savedEvent = await actualizarEventoGestion(eventoId, {
          ...pendingEventAction.payload,
          enviarRevision: true,
          recursos: null,
        });
      }

      setPendingEventAction(null);
      setSelectedAdminEvent(null);
      setCurrentAdminView('dashboard');
      setEventsPage((currentPage) => ({ ...currentPage, number: 0 }));
      setEventsReloadKey((currentKey) => currentKey + 1);
      setEventDeleteNotice(
        pendingEventAction.mode === 'edit'
          ? 'Evento actualizado correctamente.'
          : savedEvent.estadoCodigo === 'PARA_REVISION'
            ? 'Evento registrado y enviado a revisión.'
            : 'Evento registrado como borrador.',
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      const message = getApiErrorMessage(error, 'No se pudo guardar el evento.');
      const status = error.response?.status;
      setPendingEventAction(null);
      setValidationIssue({
        description:
          status === 401 || error.sessionExpired
            ? 'Tu sesión ya no está activa.'
            : status === 403
              ? 'Tu usuario no puede realizar esta acción.'
              : 'Revisa la información enviada.',
        kicker:
          status === 401 || error.sessionExpired
            ? 'Sesión expirada'
            : status === 403
              ? 'Sin permisos'
              : 'Datos inválidos',
        missingFields: [message],
        title:
          status === 401 || error.sessionExpired
            ? 'Vuelve a iniciar sesión'
            : status === 403
              ? 'Acción no permitida'
              : 'Datos inválidos o ficha incompleta',
        actionLabel: status === 400 ? 'Revisar ficha' : 'Entendido',
      });
    } finally {
      setIsSavingEventAction(false);
    }
  }
  function requestDeleteDraftEvent(event) {
    setEventDeleteNotice('');
    setEventToDelete(event);
  }

  function cancelDeleteDraftEvent() {
    setEventToDelete(null);
  }

  async function confirmDeleteDraftEvent() {
    if (!eventToDelete || isDeletingEventAction) {
      return;
    }

    const currentEvent = eventItems.find((event) => event.id === eventToDelete.id) ?? eventToDelete;

    if (currentEvent?.state !== 'BORRADOR') {
      setEventToDelete(null);
      setEventDeleteNotice('Solo se pueden eliminar eventos en estado borrador.');
      return;
    }

    try {
      setIsDeletingEventAction(true);
      await eliminarEventoGestion(eventToDelete.id);
      setEventToDelete(null);
      setSelectedAdminEvent(null);
      setCurrentAdminView('dashboard');
      setEventDeleteNotice('Evento eliminado correctamente.');

      if (eventItems.length === 1 && eventsPage.number > 0) {
        setEventsPage((currentPage) => ({ ...currentPage, number: currentPage.number - 1 }));
      } else {
        setEventsReloadKey((currentKey) => currentKey + 1);
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      const message = getApiErrorMessage(error, 'No se pudo eliminar el evento.');
      setEventToDelete(null);
      setEventDeleteNotice(message);
    } finally {
      setIsDeletingEventAction(false);
    }
  }

  function requestCancelPublishedEvent(event) {
    if (!event || ['FINALIZADO', 'CANCELADO'].includes(event.state)) {
      return;
    }

    setCancelEventReason('');
    setCancelEventError('');
    setEventToCancel(event);
  }

  function cancelCancelPublishedEvent() {
    if (isCancellingEventAction) {
      return;
    }

    setEventToCancel(null);
    setCancelEventReason('');
    setCancelEventError('');
  }

  async function confirmCancelPublishedEvent() {
    if (!eventToCancel || isCancellingEventAction) {
      return;
    }

    const motivo = cancelEventReason.trim();
    if (!motivo) {
      setCancelEventError('Ingresa el motivo de cancelacion.');
      return;
    }

    try {
      setIsCancellingEventAction(true);
      setCancelEventError('');
      const updatedEvent = await cancelarEventoGestion(eventToCancel.id, { motivo });
      const mappedEvent = mapManagementEventFromApi(updatedEvent);
      setEventToCancel(null);
      setCancelEventReason('');
      setSelectedAdminEvent(null);
      setCurrentAdminView('dashboard');
      setEventItems((currentItems) =>
        currentItems.map((event) => (String(event.id) === String(mappedEvent.id) ? mappedEvent : event)),
      );
      setEventDeleteNotice('Evento cancelado correctamente.');
      setEventsReloadKey((currentKey) => currentKey + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setCancelEventError(getApiErrorMessage(error, 'No se pudo cancelar el evento.'));
    } finally {
      setIsCancellingEventAction(false);
    }
  }

  return (
    <section
      className={[
        'admin-shell',
        isSidebarCollapsed ? 'is-sidebar-collapsed' : '',
        isSidebarTransitioning ? 'is-sidebar-transitioning' : '',
        isSidebarDrawerOpen ? 'is-sidebar-drawer-open' : '',
      ].filter(Boolean).join(' ')}
      aria-labelledby="admin-title"
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

        <button className="admin-brand" type="button" onClick={handleAdminBrandClick}>
          <img
            alt="Logo Municipalidad de San Miguel"
            className="municipality-logo brand-logo"
            src={municipalLogo}
          />
          <span>
            <strong>San Miguel</strong>
            <small>Gestión de eventos</small>
          </span>
        </button>

        <section className="admin-user-card" aria-label="Usuario autenticado">
          <span className="admin-user-avatar" aria-hidden="true">
            {getUserInitials(adminUserName)}
          </span>
          <span className="admin-user-copy">
            <strong>{adminUserName}</strong>
            <small>{formatUserRole(adminUser.role)}</small>
          </span>
        </section>

        {isEventFormView ? (
          <nav
            className="admin-nav"
            aria-label={
              currentAdminView === 'new-event'
                ? 'Secciones de creacion de evento'
                : 'Secciones de edicion de evento'
            }
          >
            {eventFormSections.map((section) => (
              <button
                className={
                  activeFormSection === section.id
                    ? 'admin-nav-link active'
                    : 'admin-nav-link'
                }
                key={section.id}
                type="button"
                onClick={() => navigateToFormSection(section.id)}
              >
                {section.label}
              </button>
            ))}
            <button
              className="admin-nav-logout"
              type="button"
              onClick={() => {
                closeSidebarDrawer();
                setSelectedAdminEvent(null);
                setCurrentAdminView('dashboard');
              }}
            >
              Volver al panel
            </button>
          </nav>
        ) : (
          <nav className="admin-nav" aria-label="Navegacion administrativa">
            <button
              className={
                currentAdminView === 'dashboard' ? 'admin-nav-link active' : 'admin-nav-link'
              }
              type="button"
              onClick={() => {
                closeSidebarDrawer();
                window.history.pushState(null, '', '/admin');
                setCurrentAdminView('dashboard');
              }}
            >
              Eventos
            </button>
            <button
              className={
                currentAdminView === 'payments' ? 'admin-nav-link active' : 'admin-nav-link'
              }
              type="button"
              onClick={() => {
                closeSidebarDrawer();
                window.history.pushState(null, '', '/admin/pagos');
                setCurrentAdminView('payments');
              }}
            >
              Pagos por validar
            </button>
            <button
              className={
                currentAdminView === 'neighbors' ? 'admin-nav-link active' : 'admin-nav-link'
              }
              type="button"
              onClick={() => {
                closeSidebarDrawer();
                window.history.pushState(null, '', '/admin/vecinos');
                setCurrentAdminView('neighbors');
              }}
            >
              Cuentas vecinales
            </button>
            <div className={`admin-nav-group${isSettingsNavOpen || isSettingsView ? ' is-open' : ''}`}>
              <button
                className={isSettingsView ? 'admin-nav-link active' : 'admin-nav-link'}
                type="button"
                aria-expanded={isSettingsNavOpen || isSettingsView}
                onClick={() => setIsSettingsNavOpen((isOpen) => !isOpen)}
              >
                Configuración
                <span className="admin-nav-chevron" aria-hidden="true">&#9662;</span>
              </button>
              {(isSettingsNavOpen || isSettingsView) && (
                <div className="admin-nav-submenu">
                  {[
                    { label: 'Usuarios', path: '/admin/configuracion/usuarios', view: 'settings-users' },
                    { label: 'Categorías', path: '/admin/configuracion/categorias', view: 'settings-categories' },
                    { label: 'Ubicaciones', path: '/admin/configuracion/ubicaciones', view: 'settings-locations' },
                  ].map((item) => (
                    <button
                      className={
                        currentAdminView === item.view
                          ? 'admin-nav-sublink active'
                          : 'admin-nav-sublink'
                      }
                      key={item.view}
                      type="button"
                      onClick={() => {
                        closeSidebarDrawer();
                        window.history.pushState(null, '', item.path);
                        setCurrentAdminView(item.view);
                        setIsSettingsNavOpen(true);
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="admin-nav-logout" type="button" onClick={onLogout}>
              Salir del panel
            </button>
          </nav>
        )}
      </aside>

      <main className="admin-main">
        {currentAdminView === 'new-event' ? (
          isLoadingEventCatalogs ? <EventFormSkeleton /> : eventCatalogError ? (
            <ErrorState description={eventCatalogError} onRetry={loadEventCatalogs} />
          ) : <NewEventView
            areas={eventAreaCatalog}
            categories={eventCategoryCatalog}
            catalogError={eventCatalogError}
            isLoadingCatalogs={isLoadingEventCatalogs}
            locations={eventLocationCatalog}
            operatives={eventOperativeCatalog}
            onBack={() => setCurrentAdminView('dashboard')}
            onRequestAction={(type, payload, resourceUploads) =>
              setPendingEventAction({ mode: 'create', payload, resourceUploads, type })
            }
            onValidationIssue={setValidationIssue}
          />
        ) : currentAdminView === 'edit-event' && selectedAdminEvent ? (
          isLoadingEventCatalogs ? <EventFormSkeleton /> : eventCatalogError ? (
            <ErrorState description={eventCatalogError} onRetry={loadEventCatalogs} />
          ) : <EditEventView
            areas={eventAreaCatalog}
            categories={eventCategoryCatalog}
            catalogError={eventCatalogError}
            event={selectedAdminEvent}
            isLoadingCatalogs={isLoadingEventCatalogs}
            locations={eventLocationCatalog}
            operatives={eventOperativeCatalog}
            onBack={() => {
              setSelectedAdminEvent(null);
              setCurrentAdminView('dashboard');
            }}
            onRequestAction={(type, payload, resourceUploads) =>
              setPendingEventAction({
                eventId: selectedAdminEvent.id,
                eventTitle: selectedAdminEvent.title,
                mode: 'edit',
                payload,
                resourceUploads,
                type,
              })
            }
            onRequestDelete={requestDeleteDraftEvent}
            onValidationIssue={setValidationIssue}
          />
        ) : currentAdminView === 'review-event' && selectedAdminEvent ? (
          <EventReviewStatusView
            event={selectedAdminEvent}
            onBack={() => {
              setSelectedAdminEvent(null);
              setCurrentAdminView('dashboard');
            }}
          />
        ) : currentAdminView === 'public-preview' && selectedAdminEvent ? (
          <AdminPublicEventPreview
            event={selectedAdminEvent}
            onRequestCancel={requestCancelPublishedEvent}
            onBack={() => {
              setSelectedAdminEvent(null);
              setCurrentAdminView('dashboard');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        ) : currentAdminView === 'payments' ? (
          <AdminPaymentsValidationPage />
        ) : currentAdminView === 'neighbors' ? (
          <NeighborAccountsPage adminUserName={adminUserName} />
        ) : currentAdminView === 'settings-users' ? (
          <SettingsUsersPage targetUserDetailId={targetUserDetailId} />
        ) : currentAdminView === 'settings-categories' ? (
          <SettingsCategoriesPage onEventCatalogChanged={loadEventCatalogs} />
        ) : currentAdminView === 'settings-locations' ? (
          <SettingsLocationsPage onEventCatalogChanged={loadEventCatalogs} />
        ) : (
          <>
            <header className="admin-topbar">
              <div>
                <span className="section-kicker">Panel administrativo</span>
                <h1 id="admin-title">Gestión municipal de eventos</h1>
              </div>
              <div className="admin-topbar-actions">
                <NotificationMenu
                  error={notificationError}
                  isLoading={isLoadingNotifications}
                  notifications={adminNotificationItems}
                  totalCount={adminNotificationCounts.total}
                  unreadCount={adminNotificationCounts.unread}
                  onFilterChange={handleNotificationFilterChange}
                  onNotificationOpen={handleNotificationOpen}
                  onNotificationRead={handleNotificationRead}
                  onRetry={() => loadAdminNotifications(notificationFilter)}
                />
                <button
                  className="admin-new-event-action"
                  type="button"
                  onClick={() => {
                    setIsLoadingEventCatalogs(true);
                    setEventCatalogError('');
                    setCurrentAdminView('new-event');
                  }}
                >
                  <span aria-hidden="true">+</span>
                  Nuevo evento
                </button>
              </div>
            </header>

            <section className="admin-stats" id="resumen" aria-label="Resumen de gestion">
              {isLoadingManagementCards ? <CardSkeleton count={4} /> : managementStats.map((stat) => (
                <article
                  className={`admin-stat-card management-stat-card ${stat.tone}`}
                  key={stat.label}
                >
                  <span className="admin-stat-icon">
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

            <section className="admin-table-panel admin-table-featured" id="eventos-admin">
              <div className="admin-panel-heading">
                <div>
                  <span className="section-kicker">Operacion</span>
                  <h2>Eventos en gestion</h2>
                </div>
              </div>
              {eventDeleteNotice && <p className="settings-inline-notice">{eventDeleteNotice}</p>}

              <div className="admin-filters" aria-label="Filtros de eventos">
                <label>
                  Buscar por nombre
                  <input
                    placeholder="Ingrese el nombre..."
                    type="search"
                    value={searchTerm}
                    onChange={(event) => handleEventSearchChange(event.target.value)}
                  />
                </label>
                <label>
                  Estado
                  <ManagementFilterCombobox
                    emptyLabel="No se encontraron estados"
                    options={managementStateOptions}
                    placeholder="Buscar estado"
                    value={stateFilter}
                    onChange={handleEventStateFilterChange}
                  />
                </label>
                <label>
                  Categoría
                  <ManagementFilterCombobox
                    emptyLabel="No se encontraron categorías"
                    options={managementCategoryOptions}
                    placeholder="Buscar categoría"
                    value={categoryFilter}
                    onChange={handleEventCategoryFilterChange}
                  />
                </label>
              </div>

              <div className="admin-table events-management-table">
                <div className="admin-table-row admin-table-head">
                  <span>Evento</span>
                  <span>Estado</span>
                  <span>Categoría</span>
                  <span>Completitud</span>
                  <span>Acción</span>
                </div>
                {isLoadingEvents ? (
                  <TableSkeleton columns={5} rows={5} />
                ) : eventsError ? (
                  <ErrorState description={eventsError} onRetry={() => setEventsReloadKey((key) => key + 1)} />
                ) : filteredAdminEvents.length === 0 ? (
                  <EmptyState title="No se encontraron eventos" description="Prueba con otros filtros o registra un nuevo evento." />
                ) : filteredAdminEvents.map((event) => {
                  const actionConfig = getAdminEventActionConfig(event);
                  const ActionIcon = actionConfig?.icon;

                  return (
                    <div className="admin-table-row" key={event.id}>
                      <span className="event-management-name-cell">
                        <strong>{event.title}</strong>
                        <small>{event.date} - {event.venue}</small>
                      </span>
                      <span>
                        <StateBadge state={event.state} />
                      </span>
                      <span>{event.category || 'Sin categoria'}</span>
                      <span className="completeness-cell">
                        <CompletenessMeter compact value={event.completeness} />
                        <PendingItemsControl
                          activePendingPopover={activePendingPopover}
                          event={event}
                          onToggle={setActivePendingPopover}
                          popoverRef={pendingPopoverRef}
                        />
                      </span>
                      <span className="event-action-cell">
                        {actionConfig && ActionIcon ? (
                          <button
                            aria-label={actionConfig.label}
                            className="table-icon-action event-table-action neighbor-detail-action"
                            data-tooltip={actionConfig.tooltip}
                            type="button"
                            onClick={() => runAdminEventTableAction(event)}
                          >
                            <ActionIcon />
                          </button>
                        ) : (
                          <span className="event-action-empty" aria-label="Sin acción disponible">
                            -
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="settings-pagination">
                <button
                  className="back-button"
                  disabled={eventsPage.number === 0}
                  type="button"
                  onClick={() =>
                    setEventsPage((currentPage) => ({
                      ...currentPage,
                      number: Math.max(0, currentPage.number - 1),
                    }))
                  }
                >
                  Anterior
                </button>
                <span>
                  Página {eventsPage.totalPages === 0 ? 0 : eventsPage.number + 1} de {eventsPage.totalPages}
                  {' '}· {eventsPage.totalElements} eventos
                </span>
                <button
                  className="back-button"
                  disabled={eventsPage.number + 1 >= eventsPage.totalPages}
                  type="button"
                  onClick={() =>
                    setEventsPage((currentPage) => ({
                      ...currentPage,
                      number: currentPage.number + 1 >= currentPage.totalPages
                        ? currentPage.number
                        : currentPage.number + 1,
                    }))
                  }
                >
                  Siguiente
                </button>
              </div>
            </section>

            
          </>
        )}

        {pendingEventAction && (
          <ConfirmEventActionModal
            action={pendingEventAction}
            isSaving={isSavingEventAction}
            onCancel={() => setPendingEventAction(null)}
            onConfirm={() => confirmPendingEventAction()}
          />
        )}

        {validationIssue && (
          <ValidationIssueModal
            actionLabel={validationIssue.actionLabel}
            description={validationIssue.description}
            kicker={validationIssue.kicker}
            missingFields={validationIssue.missingFields}
            title={validationIssue.title}
            onClose={() => setValidationIssue(null)}
          />
        )}

        {eventToDelete && (
          <DeleteDraftEventModal
            event={eventToDelete}
            isDeleting={isDeletingEventAction}
            onCancel={cancelDeleteDraftEvent}
            onConfirm={confirmDeleteDraftEvent}
          />
        )}

        {eventToCancel && (
          <CancelPublishedEventModal
            error={cancelEventError}
            event={eventToCancel}
            isCancelling={isCancellingEventAction}
            motivo={cancelEventReason}
            onCancel={cancelCancelPublishedEvent}
            onConfirm={confirmCancelPublishedEvent}
            onMotivoChange={(value) => {
              setCancelEventReason(value);
              if (cancelEventError) {
                setCancelEventError('');
              }
            }}
          />
        )}
      </main>
    </section>
  );
}

function EventReviewStatusView({ event, onBack }) {
  const pendingItems = event.pendingItems?.length
    ? event.pendingItems
    : ['La ficha se encuentra registrada para seguimiento directivo.'];

  return (
    <section className="review-status-view" aria-labelledby="review-status-title">
      <header className="admin-topbar">
        <div>
          <span className="section-kicker">Seguimiento de revisión</span>
          <h1 id="review-status-title">Estado del evento</h1>
        </div>
        <button className="admin-new-event-action event-form-top-action" type="button" onClick={onBack}>
          Volver
        </button>
      </header>

      <section className="review-status-grid">
        <article className="admin-panel review-status-summary">
          <span className="section-kicker">Evento</span>
          <h2>{event.title}</h2>
          <p>{event.date} - {event.venue}</p>
          <div className="review-status-meta">
            <StateBadge state={event.state} />
            <CompletenessMeter value={event.completeness} />
          </div>
        </article>

        <article className="admin-panel review-status-summary">
          <span className="section-kicker">Estado actual</span>
          <h2>{formatEventState(event.state)}</h2>
          <p>{getStateSummaryText(event.state)}</p>
          {event.sentToReviewAt && <small>Enviado: {event.sentToReviewAt}</small>}
        </article>

        <article className="admin-panel review-status-notes">
          <span className="section-kicker">Pendientes y observaciones</span>
          <ul>
            {pendingItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>
    </section>
  );
}

function OperativeAssignmentSection({
  onSelectionChange,
  operatives = [],
  selectedIds = [],
}) {
  const [searchValue, setSearchValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const comboboxRef = useRef(null);
  const selectedSet = new Set(selectedIds.map(String));
  const selectedOperatives = operatives.filter((operative) =>
    selectedSet.has(String(operative.usuarioId ?? operative.id)),
  );
  const normalizedSearch = normalizeSearchText(searchValue.trim());
  const filteredOperatives = operatives.filter((operative) => {
    if (!normalizedSearch) {
      return true;
    }

    return [
      operative.nombres,
      operative.apellidos,
      operative.dni,
      operative.email,
    ].some((value) => normalizeSearchText(value).includes(normalizedSearch));
  });

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (!comboboxRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', closeOnOutsideClick);

    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
    };
  }, []);

  function toggleOperative(operativeId) {
    const normalizedId = Number(operativeId);
    const nextSelectedIds = selectedSet.has(String(operativeId))
      ? selectedIds.filter((id) => String(id) !== String(operativeId))
      : [...selectedIds, normalizedId];

    onSelectionChange?.(nextSelectedIds);
  }

  function getOperativeName(operative) {
    return [operative.nombres, operative.apellidos].filter(Boolean).join(' ')
      || operative.email
      || `Usuario ${operative.usuarioId ?? operative.id}`;
  }

  function getSelectionSummary() {
    if (selectedOperatives.length === 0) {
      return '';
    }

    if (selectedOperatives.length === 1) {
      return getOperativeName(selectedOperatives[0]);
    }

    return `${selectedOperatives.length} operativos seleccionados`;
  }

  return (
    <article className="event-form-section operative-assignment-section" id="personal-operativo">
      <div className="form-section-heading">
        <span className="section-kicker">Personal operativo</span>
        <h2>Personal operativo asignado</h2>
      </div>

      {operatives.length === 0 ? (
        <p className="settings-inline-notice">
          No hay usuarios operativos activos disponibles para asignar.
        </p>
      ) : (
        <div className="area-combobox operative-assignment-combobox" ref={comboboxRef}>
          {selectedIds.map((operativeId) => (
            <input
              key={operativeId}
              name="operativosAsignadosIds"
              readOnly
              type="hidden"
              value={operativeId}
            />
          ))}
          <input
            aria-autocomplete="list"
            aria-expanded={isOpen}
            className="area-combobox-input"
            placeholder={getSelectionSummary() || 'Buscar operativos por nombre, DNI o correo'}
            role="combobox"
            type="text"
            value={searchValue}
            onChange={(event) => {
              setSearchValue(event.target.value);
              setIsOpen(true);
            }}
            onClick={() => setIsOpen(true)}
            onFocus={() => setIsOpen(true)}
          />
          {selectedOperatives.length > 0 && (
            <div className="operative-assignment-selected">
              {selectedOperatives.map((operative) => (
                <span key={operative.usuarioId ?? operative.id}>
                  {getOperativeName(operative)}
                </span>
              ))}
            </div>
          )}
          {isOpen && (
            <div className="area-combobox-menu operative-assignment-menu" role="listbox">
              {filteredOperatives.length > 0 ? (
                filteredOperatives.map((operative) => {
                  const operativeId = operative.usuarioId ?? operative.id;
                  const isSelected = selectedSet.has(String(operativeId));

                  return (
                    <label
                      aria-selected={isSelected}
                      className={isSelected ? 'operative-assignment-option is-selected' : 'operative-assignment-option'}
                      key={operativeId}
                      role="option"
                    >
                      <input
                        checked={isSelected}
                        type="checkbox"
                        onChange={(event) => {
                          event.stopPropagation();
                          toggleOperative(operativeId);
                        }}
                      />
                      <span>
                        <strong>{getOperativeName(operative)}</strong>
                        <small>{operative.dni || 'Sin DNI'} · {operative.email || 'Sin correo'}</small>
                      </span>
                    </label>
                  );
                })
              ) : (
                <span className="area-combobox-empty">No se encontraron operativos activos.</span>
              )}
            </div>
          )}
        </div>
      )}

      {selectedSet.size === 0 && (
        <p className="operative-assignment-warning">
          Este evento requiere control de asistencia. Asigna al menos un operativo para que pueda validar el ingreso de asistentes el día del evento.
        </p>
      )}
    </article>
  );
}

function RegistrationRequirementField({ checked = true, onChange }) {
  return (
    <label className="form-switch-field span-2">
      <input
        checked={checked}
        name="requiresRegistration"
        type="checkbox"
        onChange={(event) => onChange?.(event.target.checked)}
      />
      <span>
        <strong>Requiere inscripcion previa</strong>
        <small>
          Activa esta opcion cuando el vecino deba reservar o preinscribirse desde el portal publico.
        </small>
      </span>
    </label>
  );
}

function AttendanceControlSection({
  onControlChange,
  requiresControl = true,
  requiresRegistration = true,
}) {
  if (!requiresRegistration) {
    return null;
  }

  return (
    <article className="event-form-section attendance-control-section" id="control-asistencia">
      <div className="form-section-heading">
        <span className="section-kicker">Validacion</span>
        <h2>Validacion de ingreso</h2>
      </div>
      <label className="form-switch-field">
        <input
          checked={requiresControl}
          name="requiresAttendanceControl"
          type="checkbox"
          onChange={(event) => onControlChange?.(event.target.checked)}
        />
        <span>
          <strong>Este evento requiere control de asistencia</strong>
          <small>
            Activa esta opcion si el ingreso de asistentes sera validado por personal operativo mediante QR o busqueda manual.
          </small>
        </span>
      </label>
    </article>
  );
}
function AdminPublicEventPreview({ event, onBack, onRequestCancel }) {
  const [isOperativesOpen, setIsOperativesOpen] = useState(false);
  const operativesPopoverRef = useRef(null);
  const previewResources = getPublicPreviewResources(event);
  const previewEvent = {
    ...event,
    imageUrl: getPublicPreviewCoverUrl(previewResources, event.imageUrl),
    recursos: previewResources,
    resourceItems: previewResources,
    spots: event.cuposDisponibles ?? event.spots ?? event.aforoMaximo ?? 0,
  };
  const assignedOperatives = Array.isArray(event.operativosAsignados)
    ? event.operativosAsignados
    : [];

  const canCancelEvent = !['FINALIZADO', 'CANCELADO'].includes(previewEvent.state);

  useEffect(() => {
    if (!isOperativesOpen) {
      return undefined;
    }

    function handlePointerDown(pointerEvent) {
      if (!operativesPopoverRef.current?.contains(pointerEvent.target)) {
        setIsOperativesOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOperativesOpen]);

  function handlePreviewSubmit(submitEvent) {
    submitEvent.preventDefault();
    if (canCancelEvent) {
      onRequestCancel?.(previewEvent);
    }
  }

  return (
    <section className="admin-public-preview-view" aria-labelledby="admin-public-preview-title">
      <header className="admin-public-preview-notice">
        <div>
          <span className="section-kicker">Vista previa</span>
          <h1 id="admin-public-preview-title">Vista previa publica del evento</h1>
          <p>Asi se visualizara este evento en el portal ciudadano.</p>
        </div>
        <div className="admin-public-preview-operatives" ref={operativesPopoverRef}>
          <button
            aria-expanded={isOperativesOpen}
            className="admin-public-preview-operatives-button"
            type="button"
            onClick={() => setIsOperativesOpen((currentValue) => !currentValue)}
          >
            <OperativeUsersIcon />
            <span>Ver operativos asignados</span>
          </button>
          {isOperativesOpen && (
            <div className="admin-public-preview-operatives-popover" role="dialog">
              {assignedOperatives.length ? (
                <ul>
                  {assignedOperatives.map((operative) => (
                    <li key={operative.usuarioId ?? operative.email}>
                      {[operative.nombres, operative.apellidos].filter(Boolean).join(' ') || operative.email}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Este evento no tiene personal operativo asignado.</p>
              )}
            </div>
          )}
        </div>
      </header>

      <PublicEventDetail
        backLabel="Volver al panel de eventos"
        event={previewEvent}
        onBack={onBack}
        reservationActionClassName="admin-cancel-event-action"
        reservationActionDisabled={!canCancelEvent}
        reservationActionLabel="Cancelar evento"
        reservationCardKicker="ADMINISTRACION"
        reservationCardTitle="Gestion del evento publicado"
        onSubmit={handlePreviewSubmit}
      />
    </section>
  );
}

function PendingItemsControl({
  activePendingPopover,
  event,
  onToggle,
  popoverRef,
}) {
  const pendingItems =
    event.completeness < 100 && (event.pendingItems?.length ?? 0) === 0
      ? ['Faltan datos obligatorios']
      : event.pendingItems ?? [];

  if (event.completeness >= 100 || pendingItems.length === 0) {
    return null;
  }

  const isOpen = activePendingPopover?.eventId === event.id;
  const placement = isOpen ? activePendingPopover.placement : 'bottom';

  function togglePendingPopover(clickEvent) {
    const buttonRect = clickEvent.currentTarget.getBoundingClientRect();
    const shouldOpenUp = window.innerHeight - buttonRect.bottom < 220;

    onToggle(
      isOpen
        ? null
        : {
            eventId: event.id,
            placement: shouldOpenUp ? 'top' : 'bottom',
          },
    );
  }

  return (
    <span className="pending-control" ref={isOpen ? popoverRef : null}>
      <button
        aria-expanded={isOpen}
        aria-label={`${pendingItems.length} pendientes de ${event.title}`}
        className="pending-control-button"
        data-tooltip={
          pendingItems.length > 1 ? 'Ficha incompleta' : pendingItems[0]
        }
        type="button"
        onClick={togglePendingPopover}
      >
        <span aria-hidden="true">i</span>
      </button>
      {isOpen && (
        <span className={`pending-popover opens-${placement}`} role="dialog">
          <strong>{getPendingTitle(event.state)}</strong>
          <ul>
            {pendingItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </span>
      )}
    </span>
  );
}

function StateBadge({ state }) {
  return (
    <span className={`state-badge ${getEventStateTone(state)}`}>
      {formatEventState(state)}
    </span>
  );
}

function CompletenessMeter({ compact = false, showValue = true, value }) {
  return (
    <span
      aria-label={`Completitud al ${value}%`}
      className={compact ? 'completeness-meter compact' : 'completeness-meter'}
    >
      <span className="completeness-meter-track">
        <span style={{ width: `${value}%` }} />
      </span>
      {showValue && <strong>{value}%</strong>}
    </span>
  );
}

function DonutProgress({ value }) {
  const normalizedValue = Math.min(100, Math.max(0, value));
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (normalizedValue / 100) * circumference;

  return (
    <span
      aria-label={`Completitud al ${value}%`}
      className="donut-progress"
    >
      <svg aria-hidden="true" className="donut-progress-ring" viewBox="0 0 120 120">
        <circle className="donut-progress-track" cx="60" cy="60" r={radius} />
        <circle
          className="donut-progress-value"
          cx="60"
          cy="60"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={progressOffset}
        />
      </svg>
      <strong>{normalizedValue}%</strong>
    </span>
  );
}

function getResourceTypeLabel(tipoRecurso) {
  const labels = {
    AFICHE: 'Afiche',
    DOCUMENTO: 'Documento',
    EVIDENCIA: 'Evidencia',
    IMAGEN_PORTADA: 'Portada',
    VIDEO: 'Video',
  };

  return labels[tipoRecurso] ?? tipoRecurso ?? 'Recurso';
}

function getResourceFileSizeLabel(sizeBytes) {
  const size = Number(sizeBytes);

  if (!Number.isFinite(size) || size <= 0) {
    return '';
  }

  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(size >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

function isImageResource(resource) {
  return resource?.mimeType?.startsWith('image/') && resource?.signedUrl;
}

function isVideoResource(resource) {
  return resource?.mimeType?.startsWith('video/') && resource?.signedUrl;
}

function ExistingEventResources({ deletingResourceId = null, error = '', isLoading = false, resources = [], onDelete, onRetry }) {
  if (isLoading) {
    return (
      <div className="existing-resources-panel is-loading">
        <span className="section-kicker">Recursos cargados</span>
        <p>Actualizando recursos del evento...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="existing-resources-panel is-error">
        <span className="section-kicker">Recursos cargados</span>
        <p>{error}</p>
        <button className="back-button" type="button" onClick={onRetry}>
          Reintentar
        </button>
      </div>
    );
  }

  if (!resources.length) {
    return (
      <div className="existing-resources-panel is-empty">
        <span className="section-kicker">Recursos cargados</span>
        <p>Este evento aún no tiene recursos asociados.</p>
      </div>
    );
  }

  return (
    <div className="existing-resources-panel">
      <div className="existing-resources-heading">
        <span className="section-kicker">Recursos cargados</span>
        <strong>{resources.length} recurso{resources.length === 1 ? '' : 's'}</strong>
      </div>
      <div className="existing-resources-grid">
        {resources.map((resource) => {
          const fileSize = getResourceFileSizeLabel(resource.sizeBytes);
          const typeLabel = getResourceTypeLabel(resource.tipoRecurso);
          const title = resource.nombreOriginal || typeLabel;

          return (
            <article className="existing-resource-card" key={resource.id ?? resource.objectPath}>
              {resource.id && (
                <button
                  aria-label={`Eliminar ${title}`}
                  className="existing-resource-delete"
                  disabled={deletingResourceId === resource.id}
                  title="Eliminar recurso"
                  type="button"
                  onClick={() => onDelete?.(resource)}
                >
                  {deletingResourceId === resource.id ? '...' : '×'}
                </button>
              )}
              <span className="existing-resource-preview">
                {isImageResource(resource) ? (
                  <img alt={title} src={resource.signedUrl} />
                ) : isVideoResource(resource) ? (
                  <video controls preload="metadata" src={resource.signedUrl} />
                ) : (
                  <strong>{typeLabel}</strong>
                )}
              </span>
              <span className="existing-resource-copy">
                <em>{typeLabel}</em>
                <strong title={title}>{title}</strong>
                <small>
                  {[resource.mimeType, fileSize].filter(Boolean).join(' · ') || 'Metadata no disponible'}
                </small>
              </span>
              {resource.signedUrl && (
                <a className="existing-resource-link" href={resource.signedUrl} rel="noopener noreferrer" target="_blank">
                  Abrir recurso
                </a>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
function ResourceUploadCard({ accept, label, name, resourceType, showPreview = false }) {
  const [fileName, setFileName] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (!file) {
      setFileName('');
      setPreviewUrl('');
      return;
    }

    setFileName(file.name);
    setPreviewUrl(showPreview && file.type.startsWith('image/')
      ? URL.createObjectURL(file)
      : '');
  }

  return (
    <label className={previewUrl ? 'resource-upload has-preview' : 'resource-upload'}>
      <span className="resource-upload-heading">
        <strong>{label}</strong>
        <em>{resourceType}</em>
      </span>
      {showPreview && (
        <span className="resource-preview">
          {previewUrl ? (
            <img alt={`Vista previa de ${label.toLowerCase()}`} src={previewUrl} />
          ) : (
            <small>Vista previa</small>
          )}
        </span>
      )}
      <span className="resource-file-row">
        <input accept={accept} name={name} type="file" onChange={handleFileChange} />
        {fileName && <small>{fileName}</small>}
      </span>
    </label>
  );
}

function VideoResourceCard({ defaultValue = '' }) {
  const [videoUrl, setVideoUrl] = useState(defaultValue);
  const [videoFileName, setVideoFileName] = useState('');
  const embedUrl = getVideoPreviewEmbedUrl(videoUrl);

  return (
    <label className="resource-upload video-resource-card">
      <span className="resource-upload-heading">
        <strong>Video del evento</strong>
        <em>VIDEO</em>
      </span>
      <span className="video-resource-preview">
        {videoUrl ? (
          embedUrl ? (
            <iframe
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              src={embedUrl}
              title="Vista previa del video del evento"
            />
          ) : (
            <span>
              <strong>Video registrado</strong>
              <a href={videoUrl} rel="noopener noreferrer" target="_blank">
                Ver video
              </a>
            </span>
          )
        ) : (
          <small>Agrega un enlace de video para mostrarlo en el portal ciudadano.</small>
        )}
      </span>
      <span className="video-resource-field">
        URL del video
        <input
          name="videoUrl"
          placeholder="Pega el enlace del video del evento"
          type="url"
          value={videoUrl}
          onChange={(event) => setVideoUrl(event.target.value)}
        />
        <small>
          Puedes usar un enlace de YouTube, Facebook o una URL de video compatible.
        </small>
      </span>
      <span className="video-resource-field">
        Archivo de video
        <input
          accept="video/*"
          name="videoFile"
          type="file"
          onChange={(event) => {
            const file = event.target.files?.[0];
            setVideoFileName(file?.name ?? '');
          }}
        />
        {videoFileName && <small>{videoFileName}</small>}
      </span>
    </label>
  );
}

function LocationCatalogSelector({ defaultLocationId = '', locations = registeredLocations }) {
  const [selectedLocationId, setSelectedLocationId] = useState(defaultLocationId);
  const selectedLocation = getRegisteredLocationById(selectedLocationId, locations);
  const mapUrl = getLocationMapEmbedUrl(selectedLocation);

  return (
    <div className="location-catalog-layout">
      <div className="location-catalog-form">
        <label className="form-field">
          Ubicación del evento
          <select
            name="ubicacion_id"
            value={selectedLocationId}
            onChange={(event) => setSelectedLocationId(event.target.value)}
          >
            <option value="">Seleccionar ubicación</option>
            {locations.map((location) => (
              <option key={location.ubicacion_id} value={location.ubicacion_id}>
                {location.nombre_lugar}
              </option>
            ))}
          </select>
          <small>
            Selecciona una ubicación registrada en configuración.
          </small>
        </label>

        {selectedLocation ? (
          <div className="location-summary-card" aria-live="polite">
            <strong>{selectedLocation.nombre_lugar}</strong>
            <span>
              {selectedLocation.direccion}, {selectedLocation.distrito}
            </span>
            {selectedLocation.referencia && <small>{selectedLocation.referencia}</small>}
          </div>
        ) : (
          <div className="location-summary-placeholder">
            Selecciona una ubicación registrada para ver el detalle.
          </div>
        )}
      </div>

      <div className="location-map-preview">
        {mapUrl ? (
          <iframe
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={mapUrl}
            title={`Mapa de ${selectedLocation.nombre_lugar}`}
          />
        ) : (
          <span>Selecciona una ubicación para visualizar el mapa.</span>
        )}
      </div>
    </div>
  );
}

function OrderedEventListEditor({
  addLabel,
  description,
  hiddenInputName,
  initialItems = [],
  itemPlaceholder,
  kicker,
  onListChange,
  title,
}) {
  const [items, setItems] = useState(() => {
    const normalizedItems = normalizeOrderedEventItems(initialItems);
    return normalizedItems.length > 0 ? normalizedItems : [{ descripcion: '', orden: 1 }];
  });
  const onListChangeRef = useRef(onListChange);
  const validItems = normalizeOrderedEventItems(items);

  useEffect(() => {
    onListChangeRef.current = onListChange;
  }, [onListChange]);

  useEffect(() => {
    onListChangeRef.current?.();
  }, [items]);

  function updateItems(updater) {
    setItems((currentItems) =>
      updater(currentItems).map((item, index) => ({
        ...item,
        orden: index + 1,
      })),
    );
  }

  function updateItem(index, descripcion) {
    updateItems((currentItems) =>
      currentItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, descripcion } : item,
      ),
    );
  }

  function addItem() {
    updateItems((currentItems) => [
      ...currentItems,
      { descripcion: '', orden: currentItems.length + 1 },
    ]);
  }

  function removeItem(index) {
    updateItems((currentItems) => {
      const nextItems = currentItems.filter((_, itemIndex) => itemIndex !== index);
      return nextItems.length > 0 ? nextItems : [{ descripcion: '', orden: 1 }];
    });
  }

  function moveItem(index, direction) {
    updateItems((currentItems) => {
      const targetIndex = index + direction;

      if (targetIndex < 0 || targetIndex >= currentItems.length) {
        return currentItems;
      }

      const nextItems = [...currentItems];
      [nextItems[index], nextItems[targetIndex]] = [nextItems[targetIndex], nextItems[index]];
      return nextItems;
    });
  }

  return (
    <section className="ordered-list-editor">
      <input
        name={hiddenInputName}
        type="hidden"
        value={JSON.stringify(validItems)}
        readOnly
      />
      <div className="ordered-list-heading">
        <span className="section-kicker">{kicker}</span>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div className="ordered-list-items">
        {items.map((item, index) => (
          <div className="ordered-list-row" key={`${hiddenInputName}-${index}`}>
            <span className="ordered-list-number">{index + 1}</span>
            <input
              aria-label={`${title} ${index + 1}`}
              placeholder={itemPlaceholder}
              type="text"
              value={item.descripcion}
              onChange={(event) => updateItem(index, event.target.value)}
            />
            <div className="ordered-list-actions">
              <button
                disabled={index === 0}
                type="button"
                onClick={() => moveItem(index, -1)}
              >
                ↑
              </button>
              <button
                disabled={index === items.length - 1}
                type="button"
                onClick={() => moveItem(index, 1)}
              >
                ↓
              </button>
              <button type="button" onClick={() => removeItem(index)}>
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
      <button className="ordered-list-add-button" type="button" onClick={addItem}>
        + {addLabel}
      </button>
    </section>
  );
}

function getStateSummaryText(state) {
  const stateMessages = {
    BORRADOR: 'Completa la ficha para enviarla a revisión.',
    CANCELADO: 'Evento cancelado.',
    PARA_REVISION: 'Pendiente de revisión directiva.',
    EN_CURSO: 'Evento en curso.',
    FINALIZADO: 'Evento finalizado.',
    OBSERVADO: 'Requiere correcciones antes de reenviar.',
    PUBLICADO: 'Visible en el portal ciudadano.',
  };

  return stateMessages[state] ?? 'Estado registrado.';
}

function getAdminEventActionConfig(event) {
  if (event.state === 'BORRADOR') {
    return {
      icon: EditIcon,
      label: `Editar ${event.title}`,
      tooltip: 'Editar evento',
      type: 'edit',
    };
  }

  if (event.state === 'OBSERVADO') {
    return {
      icon: EditIcon,
      label: `Corregir ${event.title}`,
      tooltip: 'Corregir evento observado',
      type: 'edit',
    };
  }

  if (event.state === 'PARA_REVISION') {
    return null;
  }

  if (event.state === 'PUBLICADO') {
    return {
      icon: ViewIcon,
      label: `Ver vista previa publica de ${event.title}`,
      tooltip: 'Ver vista previa pública',
      type: 'preview',
    };
  }

  return null;
}

function OperativeUsersIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M16 11a4 4 0 1 0-8 0" />
      <path d="M5 21a7 7 0 0 1 14 0" />
      <path d="M19 8a3 3 0 0 1 2 2.8" />
      <path d="M3 10.8A3 3 0 0 1 5 8" />
    </svg>
  );
}
function RefreshIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M20 11a8 8 0 0 0-14.7-4.4L4 8" />
      <path d="M4 4v4h4" />
      <path d="M4 13a8 8 0 0 0 14.7 4.4L20 16" />
      <path d="M20 20v-4h-4" />
    </svg>
  );
}
function ViewIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m14.7 5.3 4 4" />
      <path d="M4 20h4.2L19.5 8.7a2.8 2.8 0 0 0-4-4L4.2 16H4v4Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M6 7l1 14h10l1-14" />
      <path d="M9 7V4h6v3" />
    </svg>
  );
}

function InfoLineIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function CalendarCheckLineIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M7 2v4" />
      <path d="M17 2v4" />
      <path d="M4 9h16" />
      <path d="M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
      <path d="m8.5 14 2.2 2.2 4.8-5" />
    </svg>
  );
}

function FileEditLineIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="m12.5 16.5 4.8-4.8a1.7 1.7 0 0 1 2.4 2.4l-4.8 4.8H12v-2.4Z" />
    </svg>
  );
}

function ClipboardCheckLineIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M9 4h6" />
      <path d="M9 4a3 3 0 0 1 6 0" />
      <path d="M8 5H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <path d="m8.5 14 2.2 2.2 4.8-5" />
    </svg>
  );
}

function TriangleAlertLineIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 3 2.8 19a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L12 3Z" />
      <path d="M12 9v5" />
      <path d="M12 18h.01" />
    </svg>
  );
}

function MunicipalAreaCombobox({
  areas = eventOrganizerAreas,
  defaultAreaId = '',
  defaultAreaName = '',
  onAreaChange,
}) {
  const initialArea =
    getMunicipalAreaById(defaultAreaId, areas) ??
    getMunicipalAreaByEvent({ organizer: defaultAreaName }, areas) ??
    null;
  const [selectedArea, setSelectedArea] = useState(initialArea);
  const [searchValue, setSearchValue] = useState(initialArea?.nombre ?? defaultAreaName ?? '');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const comboboxRef = useRef(null);
  const isShowingCurrentArea =
    selectedArea && normalizeSearchText(searchValue) === normalizeSearchText(selectedArea.nombre);
  const normalizedSearch = isOpen && isShowingCurrentArea
    ? ''
    : normalizeSearchText(searchValue.trim());
  const filteredAreas = areas.filter((area) => {
    if (!normalizedSearch) {
      return true;
    }

    return [area.nombre, area.tipo_area].some((value) =>
      normalizeSearchText(value).includes(normalizedSearch),
    );
  });

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (!comboboxRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', closeOnOutsideClick);

    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
    };
  }, []);

  function selectArea(area) {
    setSelectedArea(area);
    setSearchValue(area.nombre);
    setIsOpen(false);
    setHighlightedIndex(0);
    window.setTimeout(() => onAreaChange?.(), 0);
  }

  function handleSearchChange(event) {
    setSearchValue(event.target.value);
    setSelectedArea(null);
    setIsOpen(true);
    setHighlightedIndex(0);
    window.setTimeout(() => onAreaChange?.(), 0);
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((currentIndex) =>
        Math.min(currentIndex + 1, Math.max(filteredAreas.length - 1, 0)),
      );
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((currentIndex) => Math.max(currentIndex - 1, 0));
      return;
    }

    if (event.key === 'Enter' && isOpen && filteredAreas[highlightedIndex]) {
      event.preventDefault();
      selectArea(filteredAreas[highlightedIndex]);
      return;
    }

    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  }

  return (
    <span className="area-combobox" ref={comboboxRef}>
      <input name="area" readOnly type="hidden" value={selectedArea?.nombre ?? ''} />
      <input
        name="area_municipal_id"
        readOnly
        type="hidden"
        value={selectedArea?.area_municipal_id ?? ''}
      />
      <input
        aria-autocomplete="list"
        aria-expanded={isOpen}
        className="area-combobox-input"
        placeholder="Buscar o seleccionar área"
        role="combobox"
        type="text"
        value={searchValue}
        onChange={handleSearchChange}
        onClick={() => setIsOpen(true)}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
      />
      {isOpen && (
        <span className="area-combobox-menu" role="listbox">
          {filteredAreas.length > 0 ? (
            filteredAreas.map((area, index) => (
              <button
                aria-selected={selectedArea?.area_municipal_id === area.area_municipal_id}
                className={index === highlightedIndex ? 'is-highlighted' : ''}
                key={area.area_municipal_id}
                role="option"
                type="button"
                onClick={() => selectArea(area)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <span>{area.nombre}</span>
                <small>{area.tipo_area}</small>
              </button>
            ))
          ) : (
            <span className="area-combobox-empty">No se encontraron áreas</span>
          )}
        </span>
      )}
    </span>
  );
}

function ManagementFilterCombobox({
  emptyLabel = 'No se encontraron opciones',
  onChange,
  options = [],
  placeholder = 'Buscar',
  value,
}) {
  const selectedOption =
    options.find((option) => String(option.value) === String(value)) ?? options[0] ?? null;
  const [searchValue, setSearchValue] = useState(selectedOption?.label ?? '');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const comboboxRef = useRef(null);
  const normalizedSearch = normalizeSearchText(searchValue.trim());
  const filteredOptions = options.filter((option) => {
    if (!normalizedSearch || selectedOption?.label === searchValue) {
      return true;
    }

    return normalizeSearchText(option.label).includes(normalizedSearch);
  });

  useEffect(() => {
    setSearchValue(selectedOption?.label ?? '');
    setHighlightedIndex(0);
  }, [selectedOption?.label]);

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (!comboboxRef.current?.contains(event.target)) {
        setIsOpen(false);
        setSearchValue(selectedOption?.label ?? '');
      }
    }

    document.addEventListener('mousedown', closeOnOutsideClick);

    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
    };
  }, [selectedOption?.label]);

  function selectOption(option) {
    setSearchValue(option.label);
    setIsOpen(false);
    setHighlightedIndex(0);
    onChange?.(option.value);
  }

  function handleSearchChange(event) {
    setSearchValue(event.target.value);
    setIsOpen(true);
    setHighlightedIndex(0);
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((currentIndex) =>
        Math.min(currentIndex + 1, Math.max(filteredOptions.length - 1, 0)),
      );
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((currentIndex) => Math.max(currentIndex - 1, 0));
      return;
    }

    if (event.key === 'Enter' && isOpen && filteredOptions[highlightedIndex]) {
      event.preventDefault();
      selectOption(filteredOptions[highlightedIndex]);
      return;
    }

    if (event.key === 'Escape') {
      setIsOpen(false);
      setSearchValue(selectedOption?.label ?? '');
    }
  }

  return (
    <span className="area-combobox category-combobox management-filter-combobox" ref={comboboxRef}>
      <input
        aria-autocomplete="list"
        aria-expanded={isOpen}
        className="area-combobox-input"
        placeholder={placeholder}
        role="combobox"
        type="text"
        value={searchValue}
        onChange={handleSearchChange}
        onClick={() => setIsOpen(true)}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
      />
      {isOpen && (
        <span className="area-combobox-menu" role="listbox">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <button
                aria-selected={String(option.value) === String(value)}
                className={index === highlightedIndex ? 'is-highlighted' : ''}
                key={option.value}
                role="option"
                type="button"
                onClick={() => selectOption(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <span>{option.label}</span>
              </button>
            ))
          ) : (
            <span className="area-combobox-empty">{emptyLabel}</span>
          )}
        </span>
      )}
    </span>
  );
}

function CategoryCombobox({ categories = [], defaultCategoryId = '', defaultCategoryName = '', onCategoryChange }) {
  const initialCategory =
    categories.find((category) => String(category.id) === String(defaultCategoryId)) ??
    categories.find(
      (category) => normalizeSearchText(category.nombre) === normalizeSearchText(defaultCategoryName),
    ) ??
    null;
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchValue, setSearchValue] = useState(initialCategory?.nombre ?? defaultCategoryName ?? '');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const comboboxRef = useRef(null);
  const hasInitializedDefaultCategoryRef = useRef(Boolean(initialCategory));
  const hasUserEditedCategoryRef = useRef(false);
  const isShowingCurrentCategory =
    selectedCategory && normalizeSearchText(searchValue) === normalizeSearchText(selectedCategory.nombre);
  const normalizedSearch = isOpen && isShowingCurrentCategory
    ? ''
    : normalizeSearchText(searchValue.trim());
  const filteredCategories = categories.filter((category) => {
    if (!normalizedSearch) {
      return true;
    }

    return normalizeSearchText(category.nombre).includes(normalizedSearch);
  });

  useEffect(() => {
    if (
      hasInitializedDefaultCategoryRef.current ||
      hasUserEditedCategoryRef.current ||
      (!defaultCategoryId && !defaultCategoryName) ||
      categories.length === 0
    ) {
      return;
    }

    const category =
      categories.find((item) => String(item.id) === String(defaultCategoryId)) ??
      categories.find(
        (item) => normalizeSearchText(item.nombre) === normalizeSearchText(defaultCategoryName),
      );

    if (category) {
      setSelectedCategory(category);
      setSearchValue(category.nombre);
      hasInitializedDefaultCategoryRef.current = true;
    }
  }, [categories, defaultCategoryId, defaultCategoryName]);

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (!comboboxRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', closeOnOutsideClick);

    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
    };
  }, []);

  function selectCategory(category) {
    setSelectedCategory(category);
    setSearchValue(category.nombre);
    setIsOpen(false);
    setHighlightedIndex(0);
    window.setTimeout(() => onCategoryChange?.(), 0);
  }

  function handleSearchChange(event) {
    hasUserEditedCategoryRef.current = true;
    setSearchValue(event.target.value);
    setSelectedCategory(null);
    setIsOpen(true);
    setHighlightedIndex(0);
    window.setTimeout(() => onCategoryChange?.(), 0);
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((currentIndex) =>
        Math.min(currentIndex + 1, Math.max(filteredCategories.length - 1, 0)),
      );
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((currentIndex) => Math.max(currentIndex - 1, 0));
      return;
    }

    if (event.key === 'Enter' && isOpen && filteredCategories[highlightedIndex]) {
      event.preventDefault();
      selectCategory(filteredCategories[highlightedIndex]);
      return;
    }

    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  }

  return (
    <span className="area-combobox category-combobox" ref={comboboxRef}>
      <input name="categoryId" readOnly type="hidden" value={selectedCategory?.id ?? ''} />
      <input
        aria-autocomplete="list"
        aria-expanded={isOpen}
        className="area-combobox-input"
        placeholder="Buscar o seleccionar categoría"
        role="combobox"
        type="text"
        value={searchValue}
        onChange={handleSearchChange}
        onClick={() => setIsOpen(true)}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
      />
      {isOpen && (
        <span className="area-combobox-menu" role="listbox">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category, index) => (
              <button
                aria-selected={selectedCategory?.id === category.id}
                className={index === highlightedIndex ? 'is-highlighted' : ''}
                key={category.id}
                role="option"
                type="button"
                onClick={() => selectCategory(category)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <span>{category.nombre}</span>
              </button>
            ))
          ) : (
            <span className="area-combobox-empty">No se encontraron categorías</span>
          )}
        </span>
      )}
    </span>
  );
}

function mapNeighborAccountFromApi(neighbor) {
  return {
    id: neighbor.id,
    dni: neighbor.dni ?? '',
    nombres: neighbor.nombreCompleto ?? '',
    apellidos: '',
    nombreCompleto: neighbor.nombreCompleto ?? '',
    correo: neighbor.correo ?? '',
    celular: '',
    fechaNacimiento: '',
    estado: neighbor.estado ?? 'INACTIVO',
    fechaRegistro: '',
    inscripciones: [],
  };
}

function mapNeighborDetailFromApi(neighbor) {
  return {
    id: neighbor.id,
    dni: neighbor.dni ?? '',
    nombres: neighbor.nombreCompleto ?? '',
    apellidos: '',
    nombreCompleto: neighbor.nombreCompleto ?? '',
    correo: neighbor.correo ?? '',
    celular: neighbor.celular ?? '',
    fechaNacimiento: neighbor.fechaNacimiento || 'No registrado',
    estado: neighbor.estado ?? 'INACTIVO',
    fechaRegistro: neighbor.fechaRegistro || 'No registrado',
    inscripciones: (neighbor.inscripciones ?? []).map((registration) => ({
      asistencia: registration.asistencia ?? 'Pendiente',
      codigoInscripcion: registration.codigoInscripcion ?? '',
      estadoInscripcion: registration.estadoInscripcion ?? 'Registrada',
      evento: registration.evento ?? '',
      fechaEvento: registration.fechaEvento ?? '',
    })),
  };
}

function NeighborAccountsPage({ adminUserName }) {
  const [neighbors, setNeighbors] = useState([]);
  const [neighborsPage, setNeighborsPage] = useState({
    number: 0,
    size: 5,
    totalElements: 0,
    totalPages: 0,
  });
  const [searchValue, setSearchValue] = useState('');
  const [stateFilterValue, setStateFilterValue] = useState('TODOS');
  const [selectedNeighbor, setSelectedNeighbor] = useState(null);
  const [editingContact, setEditingContact] = useState(false);
  const [contactDraft, setContactDraft] = useState({ celular: '', correo: '' });
  const [actionModal, setActionModal] = useState(null);
  const [actionReason, setActionReason] = useState('');
  const [notice, setNotice] = useState('');
  const [listNotice, setListNotice] = useState('');
  const [isLoadingNeighbors, setIsLoadingNeighbors] = useState(true);
  const [isLoadingNeighborDetail, setIsLoadingNeighborDetail] = useState(false);
  const [isSavingNeighborContact, setIsSavingNeighborContact] = useState(false);
  const modalNeighbor = useMemo(() => {
    if (!selectedNeighbor) {
      return null;
    }

    return {
      ...(neighbors.find((neighbor) => neighbor.id === selectedNeighbor.id) ?? {}),
      ...selectedNeighbor,
    };
  }, [neighbors, selectedNeighbor]);

  useEffect(() => {
    let ignoreResponse = false;

    async function loadCuentasVecinales() {
      setIsLoadingNeighbors(true);
      setListNotice('');

      try {
        const data = await getCuentasVecinales({
          texto: searchValue,
          estado: stateFilterValue === 'TODOS' ? '' : stateFilterValue,
          page: neighborsPage.number,
        });

        if (ignoreResponse) {
          return;
        }

        setNeighbors(data.content.map(mapNeighborAccountFromApi));
        setNeighborsPage((currentPage) => ({
          ...currentPage,
          number: data.number,
          size: data.size,
          totalElements: data.totalElements,
          totalPages: data.totalPages,
        }));
      } catch (error) {
        if (ignoreResponse) {
          return;
        }

        setNeighbors([]);
        setListNotice(getApiErrorMessage(error, 'No se pudieron cargar las cuentas vecinales.'));
      } finally {
        if (!ignoreResponse) {
          setIsLoadingNeighbors(false);
        }
      }
    }

    loadCuentasVecinales();

    return () => {
      ignoreResponse = true;
    };
  }, [searchValue, stateFilterValue, neighborsPage.number]);

  const handleSearchChange = (value) => {
    setSearchValue(value);
    setNeighborsPage((currentPage) => ({ ...currentPage, number: 0 }));
  };

  const handleStateFilterChange = (value) => {
    setStateFilterValue(value);
    setNeighborsPage((currentPage) => ({ ...currentPage, number: 0 }));
  };

  const goToPreviousNeighborsPage = () => {
    setNeighborsPage((currentPage) => ({
      ...currentPage,
      number: Math.max(0, currentPage.number - 1),
    }));
  };

  const goToNextNeighborsPage = () => {
    setNeighborsPage((currentPage) => ({
      ...currentPage,
      number: currentPage.number + 1 >= currentPage.totalPages
        ? currentPage.number
        : currentPage.number + 1,
    }));
  };

  async function openNeighborDetailModal(neighbor) {
    setIsLoadingNeighborDetail(true);
    setEditingContact(false);
    setNotice('');
    setListNotice('');

    try {
      const detail = await getCuentaVecinalDetalle(neighbor.id);
      setSelectedNeighbor(mapNeighborDetailFromApi(detail));
    } catch (error) {
      setListNotice(getApiErrorMessage(error, 'No se pudo cargar el detalle de la cuenta vecinal.'));
    } finally {
      setIsLoadingNeighborDetail(false);
    }
  }

  // function closeNeighborDetailModal() {
  //   if (actionModal) {
  //     return;
  //   }

  //   setSelectedNeighbor(null);
  //   setEditingContact(false);
  //   setNotice('');
  // }

  const closeNeighborDetailModal = useCallback(() =>{
    if(actionModal || isSavingNeighborContact){
      return;
    }

    setSelectedNeighbor(null);
    setEditingContact(false);
    setNotice('');


  }, [actionModal, isSavingNeighborContact]);

  useEffect(() => {
    if (!modalNeighbor || isSavingNeighborContact) {
      return undefined;
    }

    function closeNeighborModalOnEscape(event) {
      if (event.key === 'Escape') {
        closeNeighborDetailModal();
      }
    }

    document.addEventListener('keydown', closeNeighborModalOnEscape);

    return () => {
      document.removeEventListener('keydown', closeNeighborModalOnEscape);
    };
  }, [modalNeighbor, closeNeighborDetailModal, isSavingNeighborContact]);

  function startContactEdit() {
    if (!modalNeighbor) {
      return;
    }

    setContactDraft({
      celular: modalNeighbor.celular,
      correo: modalNeighbor.correo,
    });
    setEditingContact(true);
    setNotice('');
  }

  async function saveContactEdit() {
    if (!modalNeighbor || isSavingNeighborContact) {
      return;
    }

    if (!contactDraft.correo.trim() || !contactDraft.celular.trim()) {
      setNotice('Completa correo y celular antes de guardar.');
      return;
    }

    setIsSavingNeighborContact(true);
    try {
      const detail = await actualizarContactoCuentaVecinal(modalNeighbor.id, {
        correo: contactDraft.correo.trim(),
        celular: contactDraft.celular.trim(),
      });
      const updatedNeighbor = mapNeighborDetailFromApi(detail);

      setSelectedNeighbor(updatedNeighbor);
      setNeighbors((currentNeighbors) =>
        currentNeighbors.map((neighbor) =>
          neighbor.id === updatedNeighbor.id
            ? {
              ...neighbor,
              correo: updatedNeighbor.correo,
              celular: updatedNeighbor.celular,
              estado: updatedNeighbor.estado,
              nombreCompleto: updatedNeighbor.nombreCompleto,
            }
            : neighbor,
        ),
      );
      setEditingContact(false);
      setNotice('Contacto actualizado correctamente. Se notificó al vecino por correo.');
    } catch (error) {
      setNotice(getApiErrorMessage(error, 'No se pudo actualizar el contacto.'));
    } finally {
      setIsSavingNeighborContact(false);
    }
  }

  function confirmAccountAction() {
    if (!modalNeighbor) {
      return;
    }

    if ((actionModal === 'deactivate' || actionModal === 'reactivate') && !actionReason.trim()) {
      setNotice('Indica el motivo de la acción.');
      return;
    }

    if (actionModal === 'resend') {
      // TODO: conectar reenvío de correo de confirmación con Spring Boot.
      setNotice('Correo de confirmación reenviado correctamente.');
      setActionModal(null);
      return;
    }

    setNeighbors((currentNeighbors) =>
      currentNeighbors.map((neighbor) => {
        if (neighbor.id !== modalNeighbor.id) {
          return neighbor;
        }

        if (actionModal === 'deactivate') {
          return {
            ...neighbor,
            estado: 'INACTIVO',
            fechaDesactivacion: new Date().toISOString(),
            motivoDesactivacion: actionReason.trim(),
            usuarioAdminDesactivacion: adminUserName,
          };
        }

        if (actionModal === 'reactivate') {
          return {
            ...neighbor,
            estado: 'ACTIVO',
            fechaReactivacion: new Date().toISOString(),
            motivoReactivacion: actionReason.trim(),
            usuarioAdminReactivacion: adminUserName,
          };
        }

        return neighbor;
      }),
    );
    // TODO: registrar acción en bitácora_accion.
    setNotice(actionModal === 'deactivate' ? 'Cuenta desactivada correctamente.' : 'Cuenta reactivada correctamente.');
    setActionModal(null);
  }

  return (
    <section className="neighbor-admin-view" aria-labelledby="neighbor-admin-title">
      <header className="admin-topbar">
        <div>
          <span className="section-kicker">Gestión ciudadana</span>
          <h1 id="neighbor-admin-title">Cuentas vecinales</h1>
          <p>Consulta y administra el estado de las cuentas registradas por los vecinos.</p>
        </div>
      </header>

      <section className="neighbor-admin-layout">
        <article className="admin-table-panel admin-table-featured neighbor-table-panel">
          <div className="admin-panel-heading">
            <div>
              <span className="section-kicker">Directorio</span>
              <h2>Vecinos registrados</h2>
            </div>
          </div>
          <div className="admin-filters neighbor-filters">
            <label>
              Buscar
              <input
                placeholder="DNI, nombre o correo"
                value={searchValue}
                onChange={(event) => handleSearchChange(event.target.value)}
              />
            </label>
            <label>
              Estado
              <select value={stateFilterValue} onChange={(event) => handleStateFilterChange(event.target.value)}>
                {neighborStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>
          {listNotice && <p className="settings-inline-notice">{listNotice}</p>}
          <div className="admin-table neighbor-table">
            <div className="admin-table-row admin-table-head">
              <span>Vecino</span><span>Estado</span><span>Editar</span>
            </div>
            {isLoadingNeighbors && <TableSkeleton columns={3} rows={5} />}
            {!isLoadingNeighbors && neighbors.length === 0 && (
              <EmptyState title="No se encontraron cuentas vecinales" description="Prueba con otro nombre, DNI, correo o estado." />
            )}
            {!isLoadingNeighbors && neighbors.map((neighbor) => (
              <div className="admin-table-row" key={neighbor.id}>
                <span className="neighbor-person-cell">
                  <strong>{neighbor.nombreCompleto}</strong>
                  <small>DNI: {neighbor.dni}</small>
                  <small>Correo: {neighbor.correo}</small>
                </span>
                <span className={`neighbor-state-text ${getNeighborStateTone(neighbor.estado)}`}>
                  {getNeighborStateLabel(neighbor.estado)}
                </span>
                <button
                  aria-label={`Editar información de ${neighbor.nombreCompleto}`}
                  className="table-icon-action is-detail neighbor-detail-action"
                  data-tooltip="Editar información"
                  disabled={isLoadingNeighborDetail}
                  type="button"
                  onClick={() => openNeighborDetailModal(neighbor)}
                >
                  <EditIcon />
                </button>
              </div>
            ))}
          </div>
          <div className="settings-pagination">
            <button
              className="back-button"
              type="button"
              disabled={neighborsPage.number === 0}
              onClick={goToPreviousNeighborsPage}
            >
              Anterior
            </button>
            <span>
              Página {neighborsPage.totalPages === 0 ? 0 : neighborsPage.number + 1} de {neighborsPage.totalPages}
              {' '}· {neighborsPage.totalElements} cuentas
            </span>
            <button
              className="back-button"
              type="button"
              disabled={neighborsPage.number + 1 >= neighborsPage.totalPages}
              onClick={goToNextNeighborsPage}
            >
              Siguiente
            </button>
          </div>
        </article>

        {modalNeighbor && (
          <NeighborDetailModal
            actionNotice={notice}
            contactDraft={contactDraft}
            editingContact={editingContact}
            neighbor={modalNeighbor}
            onCancelEdit={() => setEditingContact(false)}
            onClose={closeNeighborDetailModal}
            onContactChange={setContactDraft}
            onOpenAction={(action) => {
              setActionReason('');
              setNotice('');
              setActionModal(action);
            }}
            onSaveContact={saveContactEdit}
            isSavingContact={isSavingNeighborContact}
            onStartEdit={startContactEdit}
          />
        )}
      </section>

      {actionModal && (
        <NeighborAccountActionModal
          action={actionModal}
          reason={actionReason}
          onCancel={() => setActionModal(null)}
          onConfirm={confirmAccountAction}
          onReasonChange={setActionReason}
        />
      )}
    </section>
  );
}

function NeighborDetailModal({
  actionNotice,
  contactDraft,
  editingContact,
  isSavingContact = false,
  neighbor,
  onCancelEdit,
  onClose,
  onContactChange,
  onOpenAction,
  onSaveContact,
  onStartEdit,
}) {
  const cleanPhone = neighbor.celular.replace(/\D/g, '') || neighbor.celular;
  const contextualAction =
    neighbor.estado === 'PENDIENTE_CONFIRMACION'
      ? { action: 'resend', label: 'Reenviar confirmación' }
      : neighbor.estado === 'ACTIVO'
        ? { action: 'deactivate', label: 'Desactivar cuenta' }
        : neighbor.estado === 'INACTIVO'
          ? { action: 'reactivate', label: 'Reactivar cuenta' }
          : null;

  return (
    <div
      className="modal-backdrop neighbor-detail-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        aria-labelledby="neighbor-detail-title"
        aria-modal="true"
        className="neighbor-detail-modal"
        role="dialog"
      >
        <header className="neighbor-detail-header">
          <div className="neighbor-detail-kicker-row">
            <span className="section-kicker">Detalle vecinal</span>
            <button
              aria-label="Cerrar detalle vecinal"
              className="neighbor-modal-close"
              type="button"
              onClick={onClose}
            >
              ×
            </button>
          </div>
          <div className="neighbor-detail-title-row">
            <h2 id="neighbor-detail-title">{neighbor.nombreCompleto}</h2>
            <span className={`neighbor-state-badge ${getNeighborStateTone(neighbor.estado)}`}>
              {getNeighborStateLabel(neighbor.estado)}
            </span>
          </div>
        </header>
        <div className="neighbor-detail-body">
          {actionNotice && <p className="neighbor-action-notice">{actionNotice}</p>}
          <dl className="neighbor-detail-list">
            <div><dt>DNI</dt><dd>{neighbor.dni}</dd></div>
            <div><dt>Fecha de nacimiento</dt><dd>{neighbor.fechaNacimiento}</dd></div>
            <div><dt>Fecha de registro</dt><dd>{neighbor.fechaRegistro}</dd></div>
          </dl>
          <section className="neighbor-contact-section">
            <div className="neighbor-section-heading">
              <h3>Contacto</h3>
            </div>
            <div className="user-audit-notice">
              <span className="user-audit-icon">
                <InfoLineIcon />
              </span>
              <span>
                Si actualizas el correo o celular del vecino, se enviará una notificación al correo registrado.
              </span>
            </div>
            {editingContact ? (
              <div className="neighbor-contact-form">
                <label>Correo electrónico<input value={contactDraft.correo} onChange={(event) => onContactChange((current) => ({ ...current, correo: event.target.value }))} /></label>
                <label>Celular<input inputMode="numeric" value={contactDraft.celular} onChange={(event) => onContactChange((current) => ({ ...current, celular: event.target.value.replace(/\D/g, '') }))} /></label>
              </div>
            ) : (
              <dl className="neighbor-detail-list compact">
                <div><dt>Correo</dt><dd>{neighbor.correo}</dd></div>
                <div><dt>Celular</dt><dd>{cleanPhone}</dd></div>
              </dl>
            )}
          </section>
          <section className="neighbor-registrations">
            <h3>Inscripciones</h3>
            {neighbor.inscripciones.length > 0 ? (
              <div className="neighbor-registration-list">
                {neighbor.inscripciones.map((registration) => (
                  <div className="neighbor-registration-row" key={registration.codigoInscripcion}>
                    <span className="neighbor-registration-event">
                      <strong>{registration.evento}</strong>
                      <small>{registration.fechaEvento}</small>
                    </span>
                    <dl className="neighbor-registration-meta">
                      <div><dt>Inscripción:</dt><dd>{registration.estadoInscripcion}</dd></div>
                      <div><dt>Código:</dt><dd>{registration.codigoInscripcion}</dd></div>
                      <div><dt>Asistencia:</dt><dd className={`neighbor-attendance-status ${registration.asistencia.toLowerCase()}`}>{registration.asistencia}</dd></div>
                    </dl>
                  </div>
                ))}
              </div>
            ) : (
              <p>Este vecino aún no registra inscripciones.</p>
            )}
          </section>
        </div>
        <footer className="neighbor-detail-footer">
          {editingContact ? (
            <>
              <button className="neighbor-secondary-action" disabled={isSavingContact} type="button" onClick={onCancelEdit}>
                Cancelar
              </button>
              <LoadingButton className="neighbor-primary-action modal-loading-action" loading={isSavingContact} loadingLabel="Guardando..." onClick={onSaveContact}>
                Guardar cambios
              </LoadingButton>
            </>
          ) : (
            <>
              <button className="neighbor-secondary-action" type="button" onClick={onStartEdit}>
                Editar contacto
              </button>
              {contextualAction && (
                <button
                  className={
                    contextualAction.action === 'deactivate'
                      ? 'neighbor-primary-action modal-loading-action is-danger'
                      : 'neighbor-primary-action'
                  }
                  type="button"
                  onClick={() => onOpenAction(contextualAction.action)}
                >
                  {contextualAction.label}
                </button>
              )}
            </>
          )}
        </footer>
      </section>
    </div>
  );
}

function NeighborAccountActionModal({ action, reason, onCancel, onConfirm, onReasonChange }) {
  const isDeactivate = action === 'deactivate';
  const isReactivate = action === 'reactivate';
  const title = isDeactivate
    ? 'Desactivar cuenta vecinal'
    : isReactivate
      ? 'Reactivar cuenta vecinal'
      : 'Reenviar correo de confirmación';

  return (
    <div className="modal-backdrop neighbor-action-backdrop" role="presentation">
      <section className="confirm-modal neighbor-action-modal" role="dialog" aria-modal="true">
        <span className="section-kicker">Acción administrativa</span>
        <h2>{title}</h2>
        {action === 'resend' ? (
          <p>Se reenviará el correo de confirmación al vecino.</p>
        ) : (
          <label className="neighbor-action-reason">
            {isDeactivate ? 'Indica el motivo de la desactivación de la cuenta vecinal.' : 'Indica el motivo de la reactivación de la cuenta vecinal.'}
            <textarea rows={4} value={reason} onChange={(event) => onReasonChange(event.target.value)} />
          </label>
        )}
        <div className="modal-actions">
          <button className="back-button" type="button" onClick={onCancel}>Cancelar</button>
          <button className="primary-button" type="button" onClick={onConfirm}>
            {isDeactivate ? 'Desactivar cuenta' : isReactivate ? 'Reactivar cuenta' : 'Reenviar correo'}
          </button>
        </div>
      </section>
    </div>
  );
}

function SettingsUsersPage({ targetUserDetailId = null }) {

  // >>>>>>>>>>> Estados de SettingsUsersPage <<<<<<<<<<<<<<<<
  const [searchValue, setSearchValue] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [roleOptions, setRoleOptions] = useState([{ label: 'Todos', value: '' }]);
  const [roleCatalog, setRoleCatalog] = useState([]);
  const [usersReloadKey, setUsersReloadKey] = useState(0);
  const [usersPage, setUsersPage] = useState({
    number: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
  });
  //settingsUsers
  const [users, setUsers] = useState([]);
  const [userModalMode, setUserModalMode] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userFormData, setUserFormData] = useState(getEmptyUserFormData());
  const [userFormErrors, setUserFormErrors] = useState({});
  const [identityLookupNotice, setIdentityLookupNotice] = useState('');
  const [passwordResetNotice, setPasswordResetNotice] = useState('');
  const [userNotice, setUserNotice] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState('');
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isTogglingUserState, setIsTogglingUserState] = useState(false);
  const [isSendingPasswordReset, setIsSendingPasswordReset] = useState(false);
  const [openedTargetUserId, setOpenedTargetUserId] = useState(null);

  useEffect(()=>{
    async function loadUsuariosInternos() {
      setIsLoadingUsers(true);
      setUsersError('');
      try {
        const data = await getUsuariosInternos({
          texto: searchValue,
          rolId: roleFilter,
          page: usersPage.number,
          size: usersPage.size,
        });
        const usuarios = data.content.map((usuario) => ({
          id: usuario.id,
          nombre: usuario.nombre,
          correo: usuario.email,
          rolId: usuario.rolConfiguracionDto?.id,
          rol: usuario.rolConfiguracionDto?.codigo ?? '',
          estado: usuario.activo === 1 ? 'ACTIVO' : 'INACTIVO',
        }));
        setUsers(usuarios);
        setUsersPage((currentPage) => ({
          ...currentPage,
          number: data.number,
          size: data.size,
          totalElements: data.totalElements,
          totalPages: data.totalPages,
        }));
      } catch (error) {
        setUsers([]);
        setUsersError(getApiErrorMessage(error, 'No se pudieron cargar los usuarios internos.'));
      } finally {
        setIsLoadingUsers(false);
      }
    }

    loadUsuariosInternos();
  }, [searchValue, roleFilter, usersPage.number, usersPage.size, usersReloadKey]);

  useEffect(()=>{

    async function loadRolesUsuariosInternos(){
      const data = await getRolesUsuariosInternos();

      setRoleCatalog(data);
      setRoleOptions([
        { label: 'Todos', value: '' },
        ...data.map((rol) => ({
          label: rol.codigo,
          value: String(rol.id),
        })),
      ]);

    }

    loadRolesUsuariosInternos();
  }, []);

  const selectedUser = users.find((user) => user.id === selectedUserId) ?? null;
  const handleSearchChange = (value) => {
    setSearchValue(value);
    setUsersPage((currentPage) => ({ ...currentPage, number: 0 }));
  };

  const handleRoleFilterChange = (value) => {
    setRoleFilter(value);
    setUsersPage((currentPage) => ({ ...currentPage, number: 0 }));
  };

  const goToPreviousUsersPage = () => {
    setUsersPage((currentPage) => ({
      ...currentPage,
      number: Math.max(0, currentPage.number - 1),
    }));
  };

  const goToNextUsersPage = () => {
    setUsersPage((currentPage) => ({
      ...currentPage,
      number: currentPage.number + 1 >= currentPage.totalPages
        ? currentPage.number
        : currentPage.number + 1,
    }));
  };

  const closeUserModal = () => {
    setUserModalMode(null);
    setSelectedUserId(null);
    setUserFormData(getEmptyUserFormData());
    setUserFormErrors({});
    setIdentityLookupNotice('');
    setPasswordResetNotice('');
  };

  const openCreateUserModal = () => {
    setSelectedUserId(null);
    setUserFormData(getEmptyUserFormData());
    setUserFormErrors({});
    setIdentityLookupNotice('');
    setPasswordResetNotice('');
    setIsSendingPasswordReset(false);
    setUserModalMode('create');
  };

  const openEditUserModal = async (user) => {
    setUserFormErrors({});
    setIdentityLookupNotice('');
    setPasswordResetNotice('');
    setIsSendingPasswordReset(false);
    setUserNotice('');

    try {
      const userDetail = await getUsuarioInternoDetalle(user.id);
      const detailedUser = mapInternalUserDetailToFormUser(user, userDetail, roleCatalog);

      setSelectedUserId(user.id);
      setUserFormData(getUserFormData(detailedUser));
      setUserModalMode('edit');
    } catch (error) {
      setUserNotice(getApiErrorMessage(error, 'No se pudo cargar la información del usuario.'));
    }
  };

  useEffect(() => {
    if (!targetUserDetailId || openedTargetUserId === targetUserDetailId || roleCatalog.length === 0) {
      return;
    }

    const targetUser = users.find((user) => user.id === targetUserDetailId) ?? {
      id: targetUserDetailId,
      nombre: '',
      correo: '',
      rol: '',
      estado: 'ACTIVO',
    };

    setUsers((currentUsers) =>
      currentUsers.some((user) => user.id === targetUserDetailId)
        ? currentUsers
        : [targetUser, ...currentUsers],
    );
    setOpenedTargetUserId(targetUserDetailId);
    openEditUserModal(targetUser);
  }, [openedTargetUserId, roleCatalog, targetUserDetailId, users]);

  const saveUser = async () => {
    if (isSavingUser) {
      return;
    }
    const errors = validateUserForm(userFormData, userModalMode);

    if (Object.keys(errors).length > 0) {
      setUserFormErrors(errors);
      return;
    }

    const selectedArea = getMunicipalAreaById(userFormData.areaId);
    const normalizedUser = {
      area: selectedArea?.nombre ?? userFormData.area,
      areaId: Number(userFormData.areaId),
      correo: userFormData.correo.trim(),
      dni: userFormData.dni.trim(),
      estado: selectedUser?.estado ?? 'ACTIVO',
      nombre: userFormData.nombre.trim(),
      rol: userFormData.rol,
    };

    setIsSavingUser(true);
    try {
      if (userModalMode === 'edit' && selectedUser) {
        await actualizarUsuarioInterno(selectedUser.id, {
          email: normalizedUser.correo,
          areaMunicipalId: normalizedUser.areaId,
          rolId: Number(userFormData.rolId),
        });
        setUsersReloadKey((currentKey) => currentKey + 1);
      } else {
        await guardarUsuarioInterno({
          dni: userFormData.dni.trim(),
          nombre: userFormData.nombre.trim(),
          email: userFormData.correo.trim(),
          areaMunicipalId: Number(userFormData.areaId),
          rolId: Number(userFormData.rolId),
        });
        setUsersPage((currentPage) => ({ ...currentPage, number: 0 }));
        setUsersReloadKey((currentKey) => currentKey + 1);
      }
      closeUserModal();
    } catch (error) {
      setUserFormErrors({
        general: getApiErrorMessage(error, 'No se pudo guardar el usuario.'),
      });
    } finally {
      setIsSavingUser(false);
    }
  };

  const toggleUserState = async () => {
    if (!selectedUser || isTogglingUserState) {
      return;
    }

    const nextState = selectedUser.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';

    setIsTogglingUserState(true);
    try {
      await actualizarEstadoUsuarioInterno(selectedUser.id, nextState);
      setUsersReloadKey((currentKey) => currentKey + 1);
      closeUserModal();
    } catch (error) {
      setUserFormErrors({
        general: getApiErrorMessage(error, 'No se pudo actualizar el estado del usuario.'),
      });
    } finally {
      setIsTogglingUserState(false);
    }
  };

  return (
    <>
      <SettingsTablePage
        actionLabel="Nuevo usuario"
        cardTitle="Usuarios internos"
        description="Administra las cuentas internas del sistema municipal."
        filterLabel="Rol"
        filterOptions={roleOptions}
        filterValue={roleFilter}
        searchPlaceholder="Nombre, correo o rol"
        searchValue={searchValue}
        title="Usuarios"
        onAction={openCreateUserModal}
        onFilterChange={handleRoleFilterChange}
        onSearchChange={handleSearchChange}
      >
        {userNotice && <p className="settings-inline-notice">{userNotice}</p>}
        <div className="admin-table settings-table settings-users-table">
          <div className="admin-table-row admin-table-head">
            <span>Usuario</span><span>Correo</span><span>Rol</span><span>Estado</span><span>Acción</span>
          </div>
          {isLoadingUsers ? <TableSkeleton columns={5} rows={6} /> : usersError ? (
            <ErrorState description={usersError} onRetry={() => setUsersReloadKey((key) => key + 1)} />
          ) : users.length === 0 ? (
            <EmptyState title="No se encontraron usuarios" description="Ajusta los filtros o registra un nuevo usuario interno." />
          ) : users.map((user) => (
            <div className="admin-table-row" key={user.id}>
              <span><strong>{user.nombre}</strong></span>
              <span>{user.correo}</span>
              <span>{user.rol}</span>
              <SettingsStatus state={user.estado} />
              <span className="settings-row-actions settings-user-actions">
                <button
                  aria-label={`Editar usuario ${user.nombre}`}
                  className="table-icon-action is-detail neighbor-detail-action settings-user-detail-action"
                  data-tooltip="Editar usuario"
                  type="button"
                  onClick={() => openEditUserModal(user)}
                >
                  <EditIcon />
                </button>
              </span>
            </div>
          ))}
        </div>
        <div className="settings-pagination">
          <button
            className="back-button"
            type="button"
            disabled={usersPage.number === 0}
            onClick={goToPreviousUsersPage}
          >
            Anterior
          </button>
          <span>
            Página {usersPage.totalPages === 0 ? 0 : usersPage.number + 1} de {usersPage.totalPages}
            {' '}· {usersPage.totalElements} usuarios
          </span>
          <button
            className="back-button"
            type="button"
            disabled={usersPage.number + 1 >= usersPage.totalPages}
            onClick={goToNextUsersPage}
          >
            Siguiente
          </button>
        </div>
      </SettingsTablePage>

      {userModalMode && (
        <UserFormModal
          errors={userFormErrors}
          formData={userFormData}
          identityNotice={identityLookupNotice}
          mode={userModalMode}
          isSaving={isSavingUser}
          isTogglingState={isTogglingUserState}
          isSendingPasswordReset={isSendingPasswordReset}
          passwordResetNotice={passwordResetNotice}
          roles={roleCatalog}
          user={selectedUser}
          onClose={closeUserModal}
          onFieldChange={(field, value) => {
            setUserFormData((current) => ({ ...current, [field]: value }));
            setUserFormErrors((current) => ({ ...current, [field]: undefined }));
          }}
          onLookupDni={async () => {
            
            const response = await consultaDni(userFormData.dni);

            if(!response.data || !response.success){
              setUserFormData((current) => ({ ...current, identityVerified: false, nombre: '' }));
              setIdentityLookupNotice('No se encontraron datos para el DNI ingresado.');
            }

            if(response.status===404){
              setUserFormData((current) => ({ ...current, identityVerified: false, nombre: '' }));
              setIdentityLookupNotice('No se encontraron datos para el DNI ingresado.');
            }

            if(response.status===429){
              setUserFormData((current) => ({ ...current, identityVerified: false, nombre: '' }));
              setIdentityLookupNotice('El proveedor de consulta de DNI no está disponible en este momento');
            }

            setUserFormData((current) => ({
                ...current,
                identityVerified: true,
                nombre: response.data,
              }));
              setUserFormErrors((current) => ({ ...current, identityVerified: undefined }));
              setIdentityLookupNotice(`Nombre encontrado: ${response.data}`);
          }}
          onSendResetPassword={async () => {
            if (!selectedUser || isSendingPasswordReset) {
              return;
            }

            const correo = userFormData.correo.trim();
            const dni = userFormData.dni.trim();

            if (!correo || !dni) {
              setPasswordResetNotice('No se pudo enviar el enlace: faltan correo o DNI del usuario.');
              return;
            }

            setIsSendingPasswordReset(true);
            setPasswordResetNotice('');
            try {
              await enviarEnlaceRestablecimientoUsuario({ correo, dni });
              registerUserAuditLog('SEND_PASSWORD_RESET_LINK', selectedUser.id, ['passwordReset']);
              setPasswordResetNotice('Enlace de restablecimiento enviado al correo registrado.');
            } catch (error) {
              setPasswordResetNotice(getApiErrorMessage(error, 'No se pudo enviar el enlace de restablecimiento.'));
            } finally {
              setIsSendingPasswordReset(false);
            }
          }}
          onSave={saveUser}
          onToggleState={toggleUserState}
        />
      )}
    </>
  );
}

function getEmptyUserFormData() {
  return {
    area: '',
    areaId: '',
    correo: '',
    dni: '',
    identityVerified: false,
    nombre: '',
    rol: '',
    rolId: '',
  };
}

function getUserFormData(user) {
  return {
    area: user?.area ?? '',
    areaId: user?.areaId ? String(user.areaId) : '',
    correo: user?.correo ?? '',
    dni: user?.dni ?? '',
    identityVerified: Boolean(user?.nombre),
    nombre: user?.nombre ?? '',
    rol: user?.rol ?? '',
    rolId: user?.rolId ? String(user.rolId) : '',
  };
}

function mapInternalUserDetailToFormUser(tableUser, detail, roles) {
  const role = roles.find((currentRole) => String(currentRole.id) === String(detail.rolId));
  const area = getMunicipalAreaById(detail.areaMunicipalId);

  return {
    ...tableUser,
    area: area?.nombre ?? tableUser?.area ?? '',
    areaId: detail.areaMunicipalId,
    correo: detail.email ?? tableUser?.correo ?? '',
    dni: detail.dni ?? tableUser?.dni ?? '',
    estado: detail.activo === 1 ? 'ACTIVO' : 'INACTIVO',
    nombre: detail.nombre ?? tableUser?.nombre ?? '',
    rol: role?.codigo ?? tableUser?.rol ?? '',
    rolId: detail.rolId,
  };
}

function validateUserForm(formData, mode) {
  const errors = {};
  const isCreating = mode === 'create';
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (isCreating && !/^\d{8}$/.test(formData.dni.trim())) {
    errors.dni = 'Ingrese un DNI válido de 8 dígitos.';
  }

  if (isCreating && (!formData.identityVerified || !formData.nombre.trim())) {
    errors.identityVerified = 'Debe buscar y validar el DNI antes de crear el usuario.';
  }

  if (!formData.correo.trim()) {
    errors.correo = 'Ingrese el correo electrónico.';
  } else if (!emailPattern.test(formData.correo.trim())) {
    errors.correo = 'Ingrese un correo electrónico válido.';
  }

  if (!formData.rolId) {
    errors.rol = 'Seleccione un rol.';
  }

  if (!formData.areaId) {
    errors.areaId = 'Seleccione un área municipal.';
  }

  return errors;
}

function registerUserAuditLog(action, userId, changedFields) {
  return {
    action,
    changedFields,
    status: 'registered',
    userId,
  };
}


function UserFormModal({
  errors,
  formData,
  identityNotice,
  isSaving = false,
  isTogglingState = false,
  isSendingPasswordReset = false,
  mode,
  onClose,
  onFieldChange,
  onLookupDni,
  onSendResetPassword,
  onSave,
  onToggleState,
  passwordResetNotice,
  roles = [],
  user,
}) {
  const isEditing = mode === 'edit';
  const identityMessage =
    identityNotice ||
    (formData.identityVerified && formData.nombre
      ? `Nombre encontrado: ${formData.nombre}`
      : '');

  return (
    <div className="modal-backdrop neighbor-detail-backdrop user-detail-backdrop" role="presentation" onMouseDown={isSaving || isTogglingState ? undefined : onClose}>
      <section
        className="neighbor-detail-modal user-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-detail-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="neighbor-detail-header user-detail-header">
          <div className="neighbor-detail-kicker-row">
            <span className="section-kicker">Configuración</span>
            <button className="neighbor-modal-close" disabled={isSaving || isTogglingState} type="button" aria-label="Cerrar usuario" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="neighbor-detail-title-row">
            <h2 id="user-detail-title">{isEditing ? 'Editar usuario' : 'Nuevo usuario'}</h2>
            {isEditing && <SettingsStatus state={user?.estado ?? 'ACTIVO'} />}
          </div>
        </header>

        <div className="neighbor-detail-body user-detail-body">
          <div className="user-form-grid">
            <label className="form-field span-2">
              DNI
              <span className={`user-dni-field${isEditing ? ' is-readonly' : ''}`}>
                <input
                  disabled={isEditing}
                  inputMode="numeric"
                  maxLength={8}
                  readOnly={isEditing}
                  value={formData.dni}
                  onChange={(event) => {
                    if (isEditing) {
                      return;
                    }

                    const nextDni = event.target.value.replace(/\D/g, '').slice(0, 8);
                    onFieldChange('dni', nextDni);
                    onFieldChange('nombre', '');
                    onFieldChange('identityVerified', false);
                  }}
                />
                {!isEditing && (
                  <button
                    disabled={formData.dni.length !== 8}
                    type="button"
                    onClick={onLookupDni}
                  >
                    Buscar
                  </button>
                )}
              </span>
              {errors.dni && <small className="form-error">{errors.dni}</small>}
              {errors.identityVerified && <small className="form-error">{errors.identityVerified}</small>}
              {identityMessage && (
                <small className={`user-identity-notice${formData.identityVerified ? '' : ' is-error'}`}>
                  {identityMessage}
                </small>
              )}
            </label>

            <label className="form-field">
              Correo electrónico
              <input type="email" value={formData.correo} onChange={(event) => onFieldChange('correo', event.target.value)} />
              {errors.correo && <small className="form-error">{errors.correo}</small>}
            </label>

            <label className="form-field">
              Área municipal
              <UserAreaCombobox
                value={formData.areaId}
                onChange={(area) => {
                  onFieldChange('areaId', area?.area_municipal_id ? String(area.area_municipal_id) : '');
                  onFieldChange('area', area?.nombre ?? '');
                }}
              />
              {errors.areaId && <small className="form-error">{errors.areaId}</small>}
            </label>

            <label className="form-field">
              Rol
              <select
                value={formData.rolId}
                onChange={(event) => {
                  const selectedRole = roles.find((role) => String(role.id) === event.target.value);
                  onFieldChange('rolId', event.target.value);
                  onFieldChange('rol', selectedRole?.codigo ?? '');
                }}
              >
                <option value="">Seleccionar rol</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>{role.codigo}</option>
                ))}
              </select>
              {errors.rol && <small className="form-error">{errors.rol}</small>}
            </label>

            {isEditing && (
              <section className="user-security-section span-2">
                <span>
                  <strong>Seguridad de la cuenta</strong>
                  <small>
                    Permite enviar un enlace para que el usuario restablezca su contraseña desde su correo.
                  </small>
                  {passwordResetNotice && <small className="user-reset-notice">{passwordResetNotice}</small>}
                </span>
                <button className="user-reset-action" type="button" disabled={isSendingPasswordReset} onClick={onSendResetPassword}>
                  <span aria-hidden="true">+</span>
                  {isSendingPasswordReset ? 'Enviando enlace...' : 'Enviar enlace de restablecimiento'}
                </button>
              </section>
            )}

            {isEditing && (
              <div className="user-audit-notice span-2">
                <span className="user-audit-icon">
                  <InfoLineIcon />
                </span>
                <span>
                  Los cambios realizados en esta cuenta serán notificados al correo del usuario y registrados en la bitácora del sistema.
                  {' '}
                  Si se modifica el correo electrónico, la notificación será enviada al correo anterior y al nuevo correo registrado.
                </span>
              </div>
            )}

            {!isEditing && (
              <div className="user-activation-notice span-2">
                <span className="user-audit-icon">
                  <InfoLineIcon />
                </span>
                <span>
                  Al guardar el usuario, se enviará automáticamente un correo de activación para que establezca su contraseña e ingrese al sistema.
                </span>
              </div>
            )}

            {errors.general && <small className="form-error span-2">{errors.general}</small>}
          </div>
        </div>

        <footer className="neighbor-detail-footer user-detail-footer">
          <span className="user-footer-state-action">
            {isEditing && (
              <LoadingButton
                className={user?.estado === 'ACTIVO' ? 'neighbor-primary-action modal-loading-action is-danger' : 'neighbor-primary-action modal-loading-action is-positive'}
                loading={isTogglingState}
                loadingLabel={user?.estado === 'ACTIVO' ? 'Desactivando...' : 'Activando...'}
                disabled={isSaving}
                onClick={onToggleState}
              >
                {user?.estado === 'ACTIVO' ? 'Desactivar usuario' : 'Activar usuario'}
              </LoadingButton>
            )}
          </span>
          <span className="user-footer-main-actions">
            <button className="neighbor-secondary-action" disabled={isSaving || isTogglingState} type="button" onClick={onClose}>
              Cancelar
            </button>
            <LoadingButton className="neighbor-primary-action modal-loading-action" disabled={isTogglingState} loading={isSaving} loadingLabel={isEditing ? 'Guardando...' : 'Creando...'} onClick={onSave}>
              {isEditing ? 'Guardar cambios' : 'Guardar usuario'}
            </LoadingButton>
          </span>
        </footer>
      </section>
    </div>
  );
}

function UserAreaCombobox({ onChange, value }) {
  const initialArea = getMunicipalAreaById(value);
  const [selectedArea, setSelectedArea] = useState(initialArea ?? null);
  const [searchValue, setSearchValue] = useState(initialArea?.nombre ?? '');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const comboboxRef = useRef(null);
  const normalizedSearch = normalizeSearchText(searchValue.trim());
  const filteredAreas = areasMunicipales.filter((area) => {
    if (!normalizedSearch) {
      return true;
    }

    return [area.nombre, area.tipo_area].some((areaValue) =>
      normalizeSearchText(areaValue).includes(normalizedSearch),
    );
  });

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (!comboboxRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', closeOnOutsideClick, true);

    return () => document.removeEventListener('mousedown', closeOnOutsideClick, true);
  }, []);

  function selectArea(area) {
    setSelectedArea(area);
    setSearchValue(area.nombre);
    setIsOpen(false);
    setHighlightedIndex(0);
    onChange(area);
  }

  function handleSearchChange(event) {
    setSearchValue(event.target.value);
    setSelectedArea(null);
    setIsOpen(true);
    setHighlightedIndex(0);
    onChange(null);
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((currentIndex) =>
        Math.min(currentIndex + 1, Math.max(filteredAreas.length - 1, 0)),
      );
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((currentIndex) => Math.max(currentIndex - 1, 0));
      return;
    }

    if (event.key === 'Enter' && isOpen && filteredAreas[highlightedIndex]) {
      event.preventDefault();
      selectArea(filteredAreas[highlightedIndex]);
      return;
    }

    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  }

  return (
    <span className="area-combobox user-area-combobox" ref={comboboxRef}>
      <input
        aria-autocomplete="list"
        aria-expanded={isOpen}
        className="area-combobox-input"
        placeholder="Buscar o seleccionar área"
        role="combobox"
        type="text"
        value={searchValue}
        onChange={handleSearchChange}
        onClick={() => setIsOpen(true)}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
      />
      {isOpen && (
        <span className="area-combobox-menu" role="listbox">
          {filteredAreas.length > 0 ? (
            filteredAreas.map((area, index) => (
              <button
                aria-selected={selectedArea?.area_municipal_id === area.area_municipal_id}
                className={index === highlightedIndex ? 'is-highlighted' : ''}
                key={area.area_municipal_id}
                role="option"
                type="button"
                onClick={() => selectArea(area)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <span>{area.nombre}</span>
                <small>{area.tipo_area}</small>
              </button>
            ))
          ) : (
            <span className="area-combobox-empty">No se encontraron áreas</span>
          )}
        </span>
      )}
    </span>
  );
}

function SettingsCategoriesPage({ onEventCatalogChanged }) {
  const [searchValue, setSearchValue] = useState('');
  const [categories, setCategories] = useState(settingsCategories);
  const [categoriesPage, setCategoriesPage] = useState({
    number: 0,
    size: 5,
    totalElements: 0,
    totalPages: 0,
  });
  const [categoryFormValue, setCategoryFormValue] = useState('');
  const [categoryFormError, setCategoryFormError] = useState('');
  const [categoryNotice, setCategoryNotice] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [categoriesReloadKey, setCategoriesReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    setIsLoadingCategories(true);
    getCategoriasConfiguracion({
      texto: searchValue,
      page: categoriesPage.number,
    })
      .then((data) => {
        if (!isMounted) {
          return;
        }

        const mappedCategories = Array.isArray(data.content)
          ? data.content.map((category) => ({
              eventosAsociados: Number(category.eventosAsociados ?? 0),
              id: category.id,
              nombre: category.nombre ?? '',
            }))
          : [];

        setCategories(mappedCategories);
        setCategoriesPage((currentPage) => ({
          ...currentPage,
          number: data.number ?? 0,
          size: data.size ?? 5,
          totalElements: data.totalElements ?? 0,
          totalPages: data.totalPages ?? 0,
        }));
        setCategoryNotice('');
      })
      .catch((error) => {
        console.error('No se pudieron cargar las categorías', error);

        if (isMounted) {
          setCategoryNotice('No se pudieron cargar las categorías registradas.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingCategories(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [searchValue, categoriesPage.number, categoriesReloadKey]);

  const handleCategorySearchChange = (value) => {
    setSearchValue(value);
    setCategoriesPage((currentPage) => ({ ...currentPage, number: 0 }));
  };

  const goToPreviousCategoriesPage = () => {
    setCategoriesPage((currentPage) => ({
      ...currentPage,
      number: Math.max(0, currentPage.number - 1),
    }));
  };

  const goToNextCategoriesPage = () => {
    setCategoriesPage((currentPage) => ({
      ...currentPage,
      number: currentPage.number + 1 >= currentPage.totalPages
        ? currentPage.number
        : currentPage.number + 1,
    }));
  };

  const closeCategoryForm = () => {
    setCategoryFormValue('');
    setCategoryFormError('');
    setIsCategoryFormOpen(false);
  };

  const openCategoryForm = () => {
    setCategoryNotice('');
    setCategoryFormError('');
    setCategoryFormValue('');
    setIsCategoryFormOpen(true);
  };

  const saveCategory = async () => {
    if (isSavingCategory) {
      return;
    }
    const normalizedName = categoryFormValue.trim();

    if (!normalizedName) {
      setCategoryFormError('Ingrese el nombre de la categoría.');
      return;
    }

    if (normalizedName.length > 45) {
      setCategoryFormError('El nombre de la categoría no debe exceder los 45 caracteres.');
      return;
    }

    const hasDuplicate = categories.some(
      (category) => category.nombre.toLowerCase() === normalizedName.toLowerCase(),
    );

    if (hasDuplicate) {
      setCategoryFormError('Ya existe una categoría con ese nombre.');
      return;
    }

    setIsSavingCategory(true);

    try {
      await guardarCategoria({ nombre: normalizedName });
      setCategoriesPage((currentPage) => ({ ...currentPage, number: 0 }));
      setCategoriesReloadKey((currentKey) => currentKey + 1);
      onEventCatalogChanged?.();
      setCategoryNotice('Categoría registrada correctamente.');
      closeCategoryForm();
    } catch (error) {
      setCategoryFormError(getApiErrorMessage(error, 'No se pudo guardar la categoría.'));
    } finally {
      setIsSavingCategory(false);
    }
  };

  const requestCategoryDelete = (category) => {
    if (category.eventosAsociados > 0) {
      setCategoryNotice(
        `No se puede eliminar la categoría ${category.nombre} porque tiene eventos asociados.`,
      );
      return;
    }

    setCategoryNotice('');
    setCategoryToDelete(category);
  };

  const confirmCategoryDelete = async () => {
    if (!categoryToDelete || isDeletingCategory) {
      return;
    }

    setIsDeletingCategory(true);
    try {
      await eliminarCategoriaConfiguracion(categoryToDelete.id);
      setCategoryToDelete(null);
      setCategoriesPage((currentPage) => ({ ...currentPage, number: 0 }));
      setCategoriesReloadKey((currentKey) => currentKey + 1);
      onEventCatalogChanged?.();
      setCategoryNotice('Categoría eliminada correctamente.');
    } catch (error) {
      setCategoryToDelete(null);
      setCategoryNotice(
        getApiErrorMessage(error, 'No se pudo eliminar la categoría.'),
      );
    } finally {
      setIsDeletingCategory(false);
    }
  };

  return (
    <>
      <SettingsTablePage
        actionLabel="Nueva categoría"
        cardKicker="Catálogo"
        cardTitle="Categorías registradas"
        description="Gestiona las categorías utilizadas para clasificar eventos municipales."
        searchPlaceholder="Buscar categoría"
        searchValue={searchValue}
        title="Categorías"
        onAction={openCategoryForm}
        onSearchChange={handleCategorySearchChange}
      >
        {categoryNotice && <p className="settings-inline-notice">{categoryNotice}</p>}
        {isLoadingCategories && <p className="settings-inline-notice">Cargando categorías...</p>}
        <div className="admin-table settings-table settings-categories-table">
          <div className="admin-table-row admin-table-head">
            <span>Categoría</span><span>Eventos asociados</span><span>Acción</span>
          </div>
          {isLoadingCategories ? <TableSkeleton columns={3} rows={5} /> : categories.length === 0 ? (
            <EmptyState title="Sin categorias registradas" description="Registra una categoria para clasificar los eventos." />
          ) : categories.map((category) => (
            <div className="admin-table-row" key={category.id}>
              <span><strong>{category.nombre}</strong></span>
              <span className="category-events-count">{category.eventosAsociados}</span>
              <span className="settings-row-actions category-row-actions">
                <button
                  aria-label={`Eliminar categoría ${category.nombre}`}
                  className="table-icon-action is-detail neighbor-detail-action category-delete-action"
                  data-tooltip={
                    category.eventosAsociados === 0
                      ? 'Eliminar categoría'
                      : 'No se puede eliminar porque tiene eventos asociados'
                  }
                  type="button"
                  onClick={() => requestCategoryDelete(category)}
                >
                  <TrashIcon />
                </button>
              </span>
            </div>
          ))}
        </div>
        <div className="settings-pagination">
          <button
            className="back-button"
            type="button"
            disabled={categoriesPage.number === 0}
            onClick={goToPreviousCategoriesPage}
          >
            Anterior
          </button>
          <span>
            Página {categoriesPage.totalPages === 0 ? 0 : categoriesPage.number + 1} de {categoriesPage.totalPages}
            {' '}· {categoriesPage.totalElements} categorías
          </span>
          <button
            className="back-button"
            type="button"
            disabled={categoriesPage.number + 1 >= categoriesPage.totalPages}
            onClick={goToNextCategoriesPage}
          >
            Siguiente
          </button>
        </div>
      </SettingsTablePage>

      {isCategoryFormOpen && (
        <CategoryFormModal
          error={categoryFormError}
          isSaving={isSavingCategory}
          value={categoryFormValue}
          onCancel={closeCategoryForm}
          onSave={saveCategory}
          onValueChange={(value) => {
            setCategoryFormValue(value);
            setCategoryFormError('');
          }}
        />
      )}

      {categoryToDelete && (
        <CategoryDeleteModal
          category={categoryToDelete}
          isDeleting={isDeletingCategory}
          onCancel={() => setCategoryToDelete(null)}
          onConfirm={confirmCategoryDelete}
        />
      )}
    </>
  );
}

function CategoryFormModal({ error, isSaving, onCancel, onSave, onValueChange, value }) {
  return (
    <div className="modal-backdrop category-modal-backdrop" role="presentation" onMouseDown={onCancel}>
      <section
        className="confirm-modal category-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-form-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <span className="section-kicker">Configuración</span>
        <h2 id="category-form-title">Nueva categoría</h2>
        <label className="form-field">
          Nombre de categoría
          <input
            autoFocus
            maxLength={45}
            type="text"
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
          />
          {error && <small className="form-error">{error}</small>}
        </label>
        <div className="modal-actions">
          <button className="back-button" type="button" disabled={isSaving} onClick={onCancel}>
            Cancelar
          </button>
          <LoadingButton className="primary-button" loading={isSaving} loadingLabel="Creando..." onClick={onSave}>
            {isSaving ? 'Guardando...' : 'Guardar categoría'}
          </LoadingButton>
        </div>
      </section>
    </div>
  );
}

function CategoryDeleteModal({ category, isDeleting = false, onCancel, onConfirm }) {
  return (
    <div className="modal-backdrop category-modal-backdrop" role="presentation" onMouseDown={isDeleting ? undefined : onCancel}>
      <section
        className="confirm-modal category-modal category-delete-modal location-delete-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-delete-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <span className="section-kicker">Configuración</span>
        <h2 id="category-delete-title">Eliminar categoría</h2>
        <p>
          ¿Deseas eliminar la categoría "{category.nombre}"? Esta acción no se puede deshacer.
        </p>
        <div className="modal-actions">
          <button className="back-button" disabled={isDeleting} type="button" onClick={onCancel}>
            Cancelar
          </button>
          <LoadingButton className="primary-button danger-action" loading={isDeleting} loadingLabel="Eliminando..." onClick={onConfirm}>
            Eliminar categoría
          </LoadingButton>
        </div>
      </section>
    </div>
  );
}

function SettingsLocationsPage({ onEventCatalogChanged }) {
  const [searchValue, setSearchValue] = useState('');
  const [locations, setLocations] = useState(settingsLocations);
  const [locationsPage, setLocationsPage] = useState({
    number: 0,
    size: 5,
    totalElements: 0,
    totalPages: 0,
  });
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationModalMode, setLocationModalMode] = useState(null);
  const [locationToDelete, setLocationToDelete] = useState(null);
  const [locationFormData, setLocationFormData] = useState(getEmptyLocationFormData());
  const [locationFormErrors, setLocationFormErrors] = useState({});
  const [locationNotice, setLocationNotice] = useState('');
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [isTogglingLocationState, setIsTogglingLocationState] = useState(false);
  const [isDeletingLocation, setIsDeletingLocation] = useState(false);
  const [locationsReloadKey, setLocationsReloadKey] = useState(0);
  const isLocationModalOpen = Boolean(locationModalMode);

  useEffect(() => {
    let isMounted = true;

    setIsLoadingLocations(true);
    getUbicacionesConfiguracion({
      texto: searchValue,
      page: locationsPage.number,
    })
      .then((data) => {
        if (!isMounted) {
          return;
        }

        const mappedLocations = Array.isArray(data.content)
          ? data.content.map((location) => ({
              direccion: location.direccion ?? '',
              estado: location.activo === 1 ? 'ACTIVO' : 'INACTIVO',
              eventosAsociados: Number(location.eventosAsociados ?? 0),
              id: location.id,
              latitud: location.latitud ?? '',
              longitud: location.longitud ?? '',
              nombre: location.nombre ?? '',
              referencia: location.referencia ?? '',
            }))
          : [];

        setLocations(mappedLocations);
        setLocationsPage((currentPage) => ({
          ...currentPage,
          number: data.number ?? 0,
          size: data.size ?? 5,
          totalElements: data.totalElements ?? 0,
          totalPages: data.totalPages ?? 0,
        }));
        setLocationNotice('');
      })
      .catch((error) => {
        console.error('No se pudieron cargar las ubicaciones', error);

        if (isMounted) {
          setLocationNotice('No se pudieron cargar las ubicaciones registradas.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingLocations(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [searchValue, locationsPage.number, locationsReloadKey]);

  const handleLocationSearchChange = (value) => {
    setSearchValue(value);
    setLocationsPage((currentPage) => ({ ...currentPage, number: 0 }));
  };

  const goToPreviousLocationsPage = () => {
    setLocationsPage((currentPage) => ({
      ...currentPage,
      number: Math.max(0, currentPage.number - 1),
    }));
  };

  const goToNextLocationsPage = () => {
    setLocationsPage((currentPage) => ({
      ...currentPage,
      number: currentPage.number + 1 >= currentPage.totalPages
        ? currentPage.number
        : currentPage.number + 1,
    }));
  };

  const closeLocationModal = () => {
    setLocationModalMode(null);
    setSelectedLocation(null);
    setLocationFormErrors({});
  };

  useEffect(() => {
    if (!isLocationModalOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeLocationModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocationModalOpen]);

  const openLocationDetail = (location) => {
    setSelectedLocation(location);
    setLocationFormData(getLocationFormData(location));
    setLocationFormErrors({});
    setLocationModalMode('detail');
  };

  const openLocationCreate = () => {
    setSelectedLocation(null);
    setLocationFormData(getEmptyLocationFormData());
    setLocationFormErrors({});
    setLocationModalMode('create');
  };

  const openLocationEdit = () => {
    if (!selectedLocation) {
      return;
    }

    setLocationFormData(getLocationFormData(selectedLocation));
    setLocationFormErrors({});
    setLocationModalMode('edit');
  };

  const saveLocation = async () => {
    if (isSavingLocation) {
      return;
    }
    const errors = validateLocationForm(locationFormData);

    if (Object.keys(errors).length > 0) {
      setLocationFormErrors(errors);
      return;
    }

    const normalizedLocation = normalizeLocationFromForm(locationFormData, selectedLocation);

    if (locationModalMode === 'create') {
      setIsSavingLocation(true);
      try {
        await guardarUbicacionConfiguracion({
          direccion: normalizedLocation.direccion,
          estado: normalizedLocation.estado,
          latitud: normalizedLocation.latitud === '' ? null : Number(normalizedLocation.latitud),
          longitud: normalizedLocation.longitud === '' ? null : Number(normalizedLocation.longitud),
          nombre: normalizedLocation.nombre,
          referencia: normalizedLocation.referencia,
        });

        setLocationsPage((currentPage) => ({ ...currentPage, number: 0 }));
        setLocationsReloadKey((currentKey) => currentKey + 1);
        onEventCatalogChanged?.();
        setLocationNotice('Ubicación registrada correctamente.');
        closeLocationModal();
      } catch (error) {
        setLocationFormErrors(getLocationBackendErrors(error));
      } finally {
        setIsSavingLocation(false);
      }

      return;
    }

    if (!selectedLocation) {
      return;
    }

    const updatedLocation = {
      ...normalizedLocation,
      id: selectedLocation.id,
    };

    setLocations((current) =>
      current.map((location) => (location.id === selectedLocation.id ? updatedLocation : location)),
    );
    setSelectedLocation(updatedLocation);
    setLocationModalMode('detail');
    setLocationFormErrors({});
  };

  const toggleSelectedLocationState = async () => {
    if (!selectedLocation || isTogglingLocationState) {
      return;
    }

    const nextState = selectedLocation.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';

    setIsTogglingLocationState(true);
    try {
      const updatedLocationResponse = await actualizarEstadoUbicacionConfiguracion(
        selectedLocation.id,
        nextState,
      );
      const updatedLocation = {
        ...selectedLocation,
        estado: updatedLocationResponse.activo === 1 ? 'ACTIVO' : 'INACTIVO',
      };

      setLocations((current) =>
        current.map((location) => (location.id === selectedLocation.id ? updatedLocation : location)),
      );
      setSelectedLocation(updatedLocation);
      setLocationFormData(getLocationFormData(updatedLocation));
      setLocationsReloadKey((currentKey) => currentKey + 1);
      onEventCatalogChanged?.();
    } catch (error) {
      setLocationFormErrors({
        general: getApiErrorMessage(error, 'No se pudo actualizar el estado de la ubicación.'),
      });
    } finally {
      setIsTogglingLocationState(false);
    }
  };

  const requestLocationDelete = (location) => {
    if (location.eventosAsociados > 0) {
      setLocationNotice(
        `No se puede eliminar la ubicación ${location.nombre} porque tiene eventos asociados.`,
      );
      return;
    }

    setLocationNotice('');
    setLocationToDelete(location);
  };

  const confirmLocationDelete = async () => {
    if (!locationToDelete || isDeletingLocation) {
      return;
    }

    setIsDeletingLocation(true);
    try {
      await eliminarUbicacionConfiguracion(locationToDelete.id);
      setLocationToDelete(null);
      setLocationsPage((currentPage) => ({ ...currentPage, number: 0 }));
      setLocationsReloadKey((currentKey) => currentKey + 1);
      onEventCatalogChanged?.();
      setLocationNotice('Ubicación eliminada correctamente.');
    } catch (error) {
      setLocationToDelete(null);
      setLocationNotice(
        getApiErrorMessage(error, 'No se pudo eliminar la ubicación.'),
      );
    } finally {
      setIsDeletingLocation(false);
    }
  };

  return (
    <>
      <SettingsTablePage
        actionLabel="Nueva ubicación"
        cardKicker="Catálogo"
        cardTitle="Ubicaciones registradas"
        description="Administra los espacios municipales o puntos recurrentes donde se desarrollan eventos."
        searchPlaceholder="Buscar por nombre, dirección o referencia"
        searchValue={searchValue}
        title="Ubicaciones"
        onAction={openLocationCreate}
        onSearchChange={handleLocationSearchChange}
      >
        {locationNotice && <p className="settings-inline-notice">{locationNotice}</p>}
        {isLoadingLocations && <p className="settings-inline-notice">Cargando ubicaciones...</p>}
        <div className="admin-table settings-table settings-locations-table">
          <div className="admin-table-row admin-table-head">
            <span>Ubicación</span><span>Dirección</span><span>Estado</span><span>Detalle</span>
          </div>
          {isLoadingLocations ? <TableSkeleton columns={4} rows={5} /> : locations.length === 0 ? (
            <EmptyState title="Sin ubicaciones registradas" description="Registra un espacio municipal para utilizarlo en los eventos." />
          ) : locations.map((location) => (
            <div className="admin-table-row" key={location.id}>
              <span>
                <strong aria-label={location.nombre} title={location.nombre}>
                  {location.nombre}
                </strong>
                <small aria-label={location.referencia} title={location.referencia}>
                  {location.referencia}
                </small>
              </span>
              <span aria-label={location.direccion} title={location.direccion}>
                {location.direccion}
              </span>
              <SettingsStatus state={location.estado} />
              <span className="settings-row-actions">
                <button
                  aria-label={`Ver o editar ubicación ${location.nombre}`}
                  className="table-icon-action is-detail neighbor-detail-action location-detail-action"
                  data-tooltip="Ver/editar ubicación"
                  type="button"
                  onClick={() => openLocationDetail(location)}
                >
                  <ViewIcon />
                </button>
                <button
                  aria-label={`Eliminar ubicación ${location.nombre}`}
                  className="table-icon-action is-detail neighbor-detail-action category-delete-action"
                  data-tooltip={
                    location.eventosAsociados === 0
                      ? 'Eliminar ubicación'
                      : 'No se puede eliminar porque tiene eventos asociados'
                  }
                  type="button"
                  onClick={() => requestLocationDelete(location)}
                >
                  <TrashIcon />
                </button>
              </span>
            </div>
          ))}
        </div>
        <div className="settings-pagination">
          <button
            className="back-button"
            type="button"
            disabled={locationsPage.number === 0}
            onClick={goToPreviousLocationsPage}
          >
            Anterior
          </button>
          <span>
            Página {locationsPage.totalPages === 0 ? 0 : locationsPage.number + 1} de {locationsPage.totalPages}
            {' '}· {locationsPage.totalElements} ubicaciones
          </span>
          <button
            className="back-button"
            type="button"
            disabled={locationsPage.number + 1 >= locationsPage.totalPages}
            onClick={goToNextLocationsPage}
          >
            Siguiente
          </button>
        </div>
      </SettingsTablePage>

      {isLocationModalOpen && (
        <LocationDetailModal
          errors={locationFormErrors}
          formData={locationFormData}
          location={selectedLocation}
          mode={locationModalMode}
          isSaving={isSavingLocation}
          isTogglingState={isTogglingLocationState}
          onClose={closeLocationModal}
          onEdit={openLocationEdit}
          onFormChange={setLocationFormData}
          onSave={saveLocation}
          onToggleState={toggleSelectedLocationState}
        />
      )}

      {locationToDelete && (
        <LocationDeleteModal
          isDeleting={isDeletingLocation}
          location={locationToDelete}
          onCancel={() => setLocationToDelete(null)}
          onConfirm={confirmLocationDelete}
        />
      )}
    </>
  );
}

function getLocationBackendErrors(error) {
  const message = getApiErrorMessage(error, 'No se pudo guardar la ubicación.');
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes('nombre')) {
    return { nombre: message };
  }

  if (normalizedMessage.includes('dirección') || normalizedMessage.includes('direccion')) {
    return { direccion: message };
  }

  if (normalizedMessage.includes('referencia')) {
    return { referencia: message };
  }

  if (normalizedMessage.includes('latitud')) {
    return { latitud: message };
  }

  if (normalizedMessage.includes('longitud')) {
    return { longitud: message };
  }

  if (normalizedMessage.includes('coordenadas')) {
    return { latitud: message, longitud: message };
  }

  return { general: message };
}

function LocationDeleteModal({ isDeleting = false, location, onCancel, onConfirm }) {
  return (
    <div className="modal-backdrop category-modal-backdrop" role="presentation" onMouseDown={isDeleting ? undefined : onCancel}>
      <section
        className="confirm-modal category-modal category-delete-modal location-delete-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-delete-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <span className="section-kicker">Configuración</span>
        <h2 id="location-delete-title">Eliminar ubicación</h2>
        <p>
          ¿Deseas eliminar la ubicación "{location.nombre}"? Esta acción no se puede deshacer.
        </p>
        <div className="modal-actions">
          <button className="back-button" disabled={isDeleting} type="button" onClick={onCancel}>
            Cancelar
          </button>
          <LoadingButton className="primary-button danger-action" loading={isDeleting} loadingLabel="Eliminando..." onClick={onConfirm}>
            Eliminar ubicación
          </LoadingButton>
        </div>
      </section>
    </div>
  );
}

function getEmptyLocationFormData() {
  return {
    direccion: '',
    estado: 'ACTIVO',
    latitud: '',
    longitud: '',
    nombre: '',
    referencia: '',
  };
}

const LOCATION_TEXT_MAX_LENGTH = 100;

function getLocationFormData(location) {
  return {
    direccion: location?.direccion ?? '',
    estado: location?.estado ?? 'ACTIVO',
    latitud: location?.latitud ? String(location.latitud) : '',
    longitud: location?.longitud ? String(location.longitud) : '',
    nombre: location?.nombre ?? '',
    referencia: location?.referencia ?? '',
  };
}

function validateLocationForm(formData) {
  const errors = {};

  if (!formData.nombre.trim()) {
    errors.nombre = 'Ingrese el nombre de la ubicación.';
  } else if (formData.nombre.trim().length > LOCATION_TEXT_MAX_LENGTH) {
    errors.nombre = `El nombre no debe exceder los ${LOCATION_TEXT_MAX_LENGTH} caracteres.`;
  }

  if (!formData.direccion.trim()) {
    errors.direccion = 'Ingrese la dirección de la ubicación.';
  } else if (formData.direccion.trim().length > LOCATION_TEXT_MAX_LENGTH) {
    errors.direccion = `La dirección no debe exceder los ${LOCATION_TEXT_MAX_LENGTH} caracteres.`;
  }

  if (formData.referencia.trim().length > LOCATION_TEXT_MAX_LENGTH) {
    errors.referencia = `La referencia no debe exceder los ${LOCATION_TEXT_MAX_LENGTH} caracteres.`;
  }

  const latitud = parseLocationCoordinate(formData.latitud);
  const longitud = parseLocationCoordinate(formData.longitud);

  if (!formData.latitud.trim()) {
    errors.latitud = 'La latitud es obligatoria. Ajusta el marcador en el mapa.';
  } else if (latitud === null) {
    errors.latitud = 'La latitud debe ser numérica.';
  } else if (latitud < -90 || latitud > 90) {
    errors.latitud = 'La latitud debe estar entre -90 y 90.';
  }

  if (!formData.longitud.trim()) {
    errors.longitud = 'La longitud es obligatoria. Ajusta el marcador en el mapa.';
  } else if (longitud === null) {
    errors.longitud = 'La longitud debe ser numérica.';
  } else if (longitud < -180 || longitud > 180) {
    errors.longitud = 'La longitud debe estar entre -180 y 180.';
  }

  if (
    latitud !== null &&
    longitud !== null &&
    latitud >= -82.5 &&
    latitud <= -68.5 &&
    longitud >= -18.5 &&
    longitud <= 0.5
  ) {
    errors.latitud = 'Las coordenadas parecen invertidas. Ajusta el marcador en el mapa.';
    errors.longitud = 'Las coordenadas parecen invertidas. Ajusta el marcador en el mapa.';
  }

  return errors;
}

function normalizeLocationFromForm(formData, baseLocation = {}) {
  const safeBaseLocation = baseLocation ?? {};

  return {
    aforoReferencial: safeBaseLocation.aforoReferencial ?? '',
    direccion: formData.direccion.trim(),
    estado: formData.estado,
    latitud: formData.latitud.trim(),
    longitud: formData.longitud.trim(),
    nombre: formData.nombre.trim(),
    referencia: formData.referencia.trim(),
    tipo: safeBaseLocation.tipo ?? 'No especificado',
  };
}

function LocationCoordinatePicker({ errors, formData, onFieldChange }) {
  const mapRef = useRef(null);
  const autocompleteInputRef = useRef(null);
  const googleMapRef = useRef(null);
  const googleMarkerRef = useRef(null);
  const googleGeocoderRef = useRef(null);
  const autocompleteRef = useRef(null);
  const currentCoordinates = getLocationCoordinates(formData);
  const [mapNotice, setMapNotice] = useState('');
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [isGoogleMapsReady, setIsGoogleMapsReady] = useState(false);
  const [googleMapsError, setGoogleMapsError] = useState('');

  const updateCoordinates = useCallback((latitud, longitud) => {
    const safeLatitud = clamp(latitud, -90, 90);
    const safeLongitud = clamp(longitud, -180, 180);

    onFieldChange('latitud', safeLatitud.toFixed(6));
    onFieldChange('longitud', safeLongitud.toFixed(6));
  }, [onFieldChange]);

  const moveMapMarker = useCallback((latitud, longitud, notice = '') => {
    const nextPosition = { lat: latitud, lng: longitud };

    if (googleMapRef.current) {
      googleMapRef.current.setCenter(nextPosition);
      googleMapRef.current.setZoom(LOCATION_MAP_ZOOM);
    }

    if (googleMarkerRef.current) {
      googleMarkerRef.current.setPosition(nextPosition);
    }

    updateCoordinates(latitud, longitud);

    if (notice) {
      setMapNotice(notice);
    }
  }, [updateCoordinates]);

  useEffect(() => {
    if (!mapRef.current) {
      return undefined;
    }

    let isMounted = true;

    getGoogleMapsApi()
      .then((maps) => {
        if (!isMounted || !mapRef.current) {
          return;
        }

        const initialCoordinates = currentCoordinates ?? LOCATION_DEFAULT_COORDINATES;
        const initialPosition = {
          lat: initialCoordinates.latitud,
          lng: initialCoordinates.longitud,
        };

        const map = new maps.Map(mapRef.current, {
          center: initialPosition,
          clickableIcons: false,
          fullscreenControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          zoom: LOCATION_MAP_ZOOM,
        });

        const marker = new maps.Marker({
          draggable: true,
          map,
          position: initialPosition,
          title: 'Ubicación seleccionada',
        });

        googleMapRef.current = map;
        googleMarkerRef.current = marker;
        googleGeocoderRef.current = new maps.Geocoder();

        marker.addListener('dragend', () => {
          const position = marker.getPosition();
          if (position) {
            updateCoordinates(position.lat(), position.lng());
            setMapNotice('Coordenadas actualizadas desde el marcador.');
          }
        });

        map.addListener('click', (event) => {
          if (event.latLng) {
            moveMapMarker(
              event.latLng.lat(),
              event.latLng.lng(),
              'Coordenadas actualizadas desde el mapa.',
            );
          }
        });

        if (autocompleteInputRef.current) {
          autocompleteRef.current = new maps.places.Autocomplete(autocompleteInputRef.current, {
            componentRestrictions: { country: 'pe' },
            fields: ['geometry', 'name', 'formatted_address'],
          });

          autocompleteRef.current.addListener('place_changed', () => {
            const place = autocompleteRef.current.getPlace();
            const location = place.geometry?.location;

            if (!location) {
              setMapNotice('Selecciona una opción del buscador de Google Maps.');
              return;
            }

            moveMapMarker(
              location.lat(),
              location.lng(),
              'Punto seleccionado. Puedes mover el marcador para ajustar la ubicación exacta.',
            );
          });
        }

        setIsGoogleMapsReady(true);

        if (!currentCoordinates) {
          updateCoordinates(initialCoordinates.latitud, initialCoordinates.longitud);
        }
      })
      .catch((error) => {
        console.error(error);
        if (isMounted) {
          setGoogleMapsError(
            'Configura VITE_GOOGLE_MAPS_API_KEY para usar Google Maps y Places Autocomplete.',
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!currentCoordinates || !googleMarkerRef.current || !googleMapRef.current) {
      return;
    }

    const nextPosition = {
      lat: currentCoordinates.latitud,
      lng: currentCoordinates.longitud,
    };

    googleMarkerRef.current.setPosition(nextPosition);
    googleMapRef.current.setCenter(nextPosition);
  }, [currentCoordinates?.latitud, currentCoordinates?.longitud]);

  const searchLocationOnMap = async () => {
    const query = [formData.nombre, formData.direccion, 'San Miguel Lima Perú']
      .map((value) => value?.trim())
      .filter(Boolean)
      .join(', ');

    if (!query) {
      setMapNotice('Ingresa un nombre o dirección para buscar el punto.');
      return;
    }

    if (!googleGeocoderRef.current) {
      setMapNotice('Google Maps todavía se está cargando.');
      return;
    }

    setIsSearchingLocation(true);
    setMapNotice('');

    googleGeocoderRef.current.geocode(
      {
        address: query,
        componentRestrictions: { country: 'PE' },
      },
      (results, status) => {
        setIsSearchingLocation(false);
        const firstResult = Array.isArray(results) ? results[0] : null;

        if (status !== 'OK' || !firstResult?.geometry?.location) {
          setMapNotice('No se encontró un punto para esa búsqueda. Ajusta el marcador manualmente.');
          return;
        }

        const location = firstResult.geometry.location;

        moveMapMarker(
          location.lat(),
          location.lng(),
          'Punto encontrado. Puedes mover el marcador para ajustar la ubicación exacta.',
        );
      },
    );
  };

  return (
    <div className="location-coordinate-picker">
      <div className="location-map-toolbar">
        <p>Mueve el marcador en el mapa para ajustar la ubicación exacta.</p>
        <button
          className="neighbor-secondary-action"
          type="button"
          disabled={isSearchingLocation}
          onClick={searchLocationOnMap}
        >
          {isSearchingLocation ? 'Buscando...' : 'Buscar en mapa'}
        </button>
      </div>
      <input
        ref={autocompleteInputRef}
        className="location-google-search"
        disabled={!isGoogleMapsReady}
        placeholder="Buscar en Google Maps por nombre o dirección"
        type="search"
      />
      <div
        ref={mapRef}
        className="location-google-map"
        role="application"
        aria-label="Selector de coordenadas con Google Maps"
      />
      {(googleMapsError || mapNotice || errors.latitud || errors.longitud) && (
        <small className={errors.latitud || errors.longitud ? 'form-error' : 'location-map-notice'}>
          {errors.latitud || errors.longitud || googleMapsError || mapNotice}
        </small>
      )}
    </div>
  );
}

function LocationDetailModal({
  errors,
  formData,
  location,
  mode,
  isSaving = false,
  isTogglingState = false,
  onClose,
  onEdit,
  onFormChange,
  onSave,
  onToggleState,
}) {
  const isEditing = mode === 'create' || mode === 'edit';
  const visibleLocation = isEditing ? normalizeLocationFromForm(formData, location) : location;
  const mapEmbedUrl = getSettingsLocationMapEmbedUrl(visibleLocation);
  const mapsUrl = getSettingsLocationMapsUrl(visibleLocation);
  const modalTitle = mode === 'create' ? 'Nueva ubicación' : visibleLocation?.nombre;
  const statusLabel = visibleLocation?.estado === 'ACTIVO' ? 'Activa' : 'Inactiva';

  const updateField = (field, value) => {
    onFormChange((current) => ({ ...current, [field]: value }));
  };

  return (
    <div
      aria-modal="true"
      className="modal-backdrop neighbor-detail-backdrop location-detail-backdrop"
      role="dialog"
      onMouseDown={isSaving || isTogglingState ? undefined : onClose}
    >
      <section
        className={`neighbor-detail-modal location-detail-modal ${isEditing ? 'is-editing' : 'is-viewing'}`}
        aria-labelledby="location-detail-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="neighbor-detail-header location-detail-header">
          <div className="neighbor-detail-kicker-row">
            <span className="section-kicker">Detalle de ubicación</span>
            <button className="neighbor-modal-close" type="button" aria-label="Cerrar detalle de ubicación" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="neighbor-detail-title-row">
            <h2 id="location-detail-title">{modalTitle}</h2>
            <SettingsStatus state={visibleLocation?.estado ?? 'ACTIVO'} />
          </div>
        </header>

        <div className={`neighbor-detail-body location-detail-body ${isEditing ? 'is-editing' : 'is-viewing'}`}>
          {errors.general && <p className="settings-inline-notice">{errors.general}</p>}
          {isEditing ? (
            <LocationForm
              errors={errors}
              formData={formData}
              onFieldChange={updateField}
            />
          ) : (
            <dl className="neighbor-detail-list location-detail-list">
              <div>
                <dt>Nombre de ubicación</dt>
                <dd>{visibleLocation.nombre}</dd>
              </div>
              <div>
                <dt>Dirección</dt>
                <dd>{visibleLocation.direccion}</dd>
              </div>
              <div>
                <dt>Referencia</dt>
                <dd>{visibleLocation.referencia || 'Sin referencia registrada'}</dd>
              </div>
              <div>
                <dt>Estado</dt>
                <dd>{statusLabel}</dd>
              </div>
              <div>
                <dt>Latitud</dt>
                <dd>{visibleLocation.latitud || 'No registrada'}</dd>
              </div>
              <div>
                <dt>Longitud</dt>
                <dd>{visibleLocation.longitud || 'No registrada'}</dd>
              </div>
            </dl>
          )}

          <section className="location-map-card" aria-label="Previsualización de ubicación en mapa">
            <div className="neighbor-section-heading">
              <h3>Mapa</h3>
              {!isEditing && mapsUrl && (
                <a href={mapsUrl} target="_blank" rel="noreferrer">
                  Abrir en Google Maps
                </a>
              )}
            </div>
            {isEditing ? (
              <LocationCoordinatePicker
                errors={errors}
                formData={formData}
                onFieldChange={updateField}
              />
            ) : mapEmbedUrl ? (
              <iframe
                src={mapEmbedUrl}
                title={`Mapa de ${visibleLocation?.nombre || 'ubicación'}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <p>Agrega latitud y longitud para visualizar el punto registrado.</p>
            )}
          </section>
        </div>

        <footer className="neighbor-detail-footer">
          {isEditing ? (
            <>
              <button className="neighbor-secondary-action" disabled={isSaving} type="button" onClick={onClose}>
                Cancelar
              </button>
              <LoadingButton className="neighbor-primary-action modal-loading-action" loading={isSaving} loadingLabel="Guardando..." onClick={onSave}>
                Guardar ubicación
              </LoadingButton>
            </>
          ) : (
            <>
              <button className="neighbor-secondary-action" type="button" onClick={onEdit}>
                Editar ubicación
              </button>
              <LoadingButton
                className={
                  visibleLocation?.estado === 'ACTIVO'
                    ? 'neighbor-primary-action modal-loading-action is-danger'
                    : 'neighbor-primary-action modal-loading-action is-positive'
                }
                loading={isTogglingState}
                loadingLabel={visibleLocation?.estado === 'ACTIVO' ? 'Desactivando...' : 'Activando...'}
                onClick={onToggleState}
              >
                {visibleLocation?.estado === 'ACTIVO' ? 'Desactivar ubicación' : 'Activar ubicación'}
              </LoadingButton>
            </>
          )}
        </footer>
      </section>
    </div>
  );
}

function LocationForm({ errors, formData, onFieldChange }) {
  return (
    <div className="location-form-grid">
      <label className="form-field">
        Nombre
        <input
          maxLength={LOCATION_TEXT_MAX_LENGTH}
          value={formData.nombre}
          onChange={(event) => onFieldChange('nombre', event.target.value)}
        />
        {errors.nombre && <small className="form-error">{errors.nombre}</small>}
      </label>
      <label className="form-field">
        Estado
        <select
          value={formData.estado}
          onChange={(event) => onFieldChange('estado', event.target.value)}
        >
          <option value="ACTIVO">Activa</option>
          <option value="INACTIVO">Inactiva</option>
        </select>
      </label>
      <label className="form-field span-2">
        Dirección
        <input
          maxLength={LOCATION_TEXT_MAX_LENGTH}
          value={formData.direccion}
          onChange={(event) => onFieldChange('direccion', event.target.value)}
        />
        {errors.direccion && <small className="form-error">{errors.direccion}</small>}
      </label>
      <label className="form-field span-2">
        Referencia
        <input
          maxLength={LOCATION_TEXT_MAX_LENGTH}
          value={formData.referencia}
          onChange={(event) => onFieldChange('referencia', event.target.value)}
        />
        {errors.referencia && <small className="form-error">{errors.referencia}</small>}
      </label>
      <label className="form-field">
        Latitud
        <input
          inputMode="decimal"
          readOnly
          value={formData.latitud}
        />
        {errors.latitud && <small className="form-error">{errors.latitud}</small>}
      </label>
      <label className="form-field">
        Longitud
        <input
          inputMode="decimal"
          readOnly
          value={formData.longitud}
        />
        {errors.longitud && <small className="form-error">{errors.longitud}</small>}
      </label>
    </div>
  );
}

function SettingsTablePage({
  actionLabel,
  cardKicker,
  cardTitle,
  children,
  description,
  filterLabel,
  filterOptions,
  filterValue,
  onAction,
  onFilterChange,
  onSearchChange,
  searchPlaceholder,
  searchValue,
  title,
}) {
  return (
    <section className="settings-view" aria-labelledby={`settings-${title.toLowerCase()}-title`}>
      <header className="admin-topbar">
        <div>
          <span className="section-kicker">Configuración</span>
          <h1 id={`settings-${title.toLowerCase()}-title`}>{title}</h1>
          <p>{description}</p>
        </div>
        <button className="admin-new-event-action" type="button" onClick={onAction}>
          <span aria-hidden="true">+</span>
          {actionLabel}
        </button>
      </header>
      <article className="admin-table-panel admin-table-featured settings-panel">
        <div className="admin-panel-heading">
          <div>
            {cardKicker && <span className="section-kicker">{cardKicker}</span>}
            <h2>{cardTitle}</h2>
          </div>
        </div>
        <div className={`admin-filters settings-filters${filterOptions ? '' : ' single-filter'}`}>
          <label>
            Buscar
            <input
              placeholder={searchPlaceholder}
              type="search"
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </label>
          {filterOptions && (
            <label>
              {filterLabel}
              <select value={filterValue} onChange={(event) => onFilterChange(event.target.value)}>
                {filterOptions.map((option) => {
                  const optionValue = typeof option === 'object' ? option.value : option;
                  const optionLabel = typeof option === 'object' ? option.label : option;

                  return (
                    <option key={optionValue || optionLabel} value={optionValue}>
                      {optionLabel}
                    </option>
                  );
                })}
              </select>
            </label>
          )}
        </div>
        {children}
      </article>
    </section>
  );
}

function SettingsStatus({ state }) {
  return (
    <span className={`settings-status ${state === 'ACTIVO' ? 'is-active' : 'is-inactive'}`}>
      {state === 'ACTIVO' ? 'Activo' : 'Inactivo'}
    </span>
  );
}

function EvaluationTrackingSection({
  capacityValue = '',
  capacityMode,
  goalEnabled,
  goalType = 'CANTIDAD_ASISTENTES',
  goalValue = '',
  surveyEnabled,
}) {
  const hasDefinedCapacity = capacityMode !== 'none';
  const isPercentageGoal = goalType === 'PORCENTAJE_ASISTENCIA';
  const normalizedCapacityValue = Number(capacityValue) > 0 ? capacityValue : '';

  function keepCapacityAtMinimum(event) {
    if (event.target.value !== '' && Number(event.target.value) <= 0) {
      event.target.value = '1';
    }
  }

  return (
    <article className="event-form-section" id="evaluacion">
      <div className="form-section-heading">
        <span className="section-kicker">Evaluación</span>
        <h2>Evaluación y seguimiento</h2>
      </div>
      <div className="form-grid">
        <fieldset className="form-field span-2 form-choice-group">
          <legend>Control de aforo</legend>
          <label>
            <input
              defaultChecked={hasDefinedCapacity}
              name="capacityMode"
              type="radio"
              value="defined"
            />
            Con aforo definido
          </label>
          <label>
            <input
              defaultChecked={!hasDefinedCapacity}
              name="capacityMode"
              type="radio"
              value="none"
            />
            Sin control de aforo
          </label>
        </fieldset>

        {hasDefinedCapacity && (
          <label className="form-field">
            Aforo máximo
            <input
              defaultValue={normalizedCapacityValue}
              min="1"
              name="capacity"
              placeholder="120"
              step="1"
              type="number"
              onBlur={keepCapacityAtMinimum}
              onInput={keepCapacityAtMinimum}
            />
          </label>
        )}

        <label className="form-switch-field span-2">
          <input
            defaultChecked={goalEnabled}
            name="attendanceGoalEnabled"
            type="checkbox"
          />
          <span>
            <strong>Definir meta de asistencia</strong>
            <small>Opcional para reportes directivos y seguimiento posterior.</small>
          </span>
        </label>

        {goalEnabled && (
          <>
            <label className="form-field">
              Tipo de meta
              <select defaultValue={goalType} name="attendanceGoalType">
                <option value="CANTIDAD_ASISTENTES">Cantidad de asistentes</option>
                <option value="PORCENTAJE_ASISTENCIA">Porcentaje de asistencia sobre inscritos</option>
              </select>
            </label>
            <label className="form-field">
              Valor de meta
              <input
                defaultValue={goalValue}
                max={isPercentageGoal ? '100' : undefined}
                min="1"
                name="attendanceGoalValue"
                placeholder={isPercentageGoal ? '80' : '100'}
                type="number"
              />
            </label>
          </>
        )}

        <label className="form-switch-field span-2">
          <input
            defaultChecked={surveyEnabled}
            name="surveyEnabled"
            type="checkbox"
          />
          <span>
            <strong>Enviar encuesta de satisfacción al finalizar el evento</strong>
            <small>Prepara una encuesta de 1 a 5 estrellas para una futura automatización.</small>
          </span>
        </label>
      </div>
    </article>
  );
}

function PaymentConfigurationFields({
  checked = false,
  defaultCost = '',
  defaultInstructions = '',
  enabled = true,
  onToggle,
}) {
  const showPaymentFields = enabled && checked;

  return (
    <>
      <label className="form-switch-field span-2">
        <input
          checked={checked}
          disabled={!enabled}
          name="requiresPayment"
          type="checkbox"
          onChange={(event) => onToggle?.(event.target.checked)}
        />
        <span>
          <strong>Requiere pago por inscripcion</strong>
          <small>Activa la validacion manual de comprobantes antes de confirmar la inscripcion del vecino.</small>
        </span>
      </label>

      {showPaymentFields && (
        <>
          <label className="form-field">
            Monto por inscripcion
            <input
              defaultValue={defaultCost}
              min="0.01"
              name="paymentCost"
              placeholder="10.00"
              step="0.01"
              type="number"
            />
          </label>
          <label className="form-field span-2">
            Instrucciones de pago
            <textarea
              defaultValue={defaultInstructions}
              name="paymentInstructions"
              placeholder={defaultPaymentInstructions}
              rows={4}
            />
          </label>
        </>
      )}
    </>
  );
}

function NewEventView({
  areas = eventOrganizerAreas,
  categories = [],
  catalogError = '',
  isLoadingCatalogs = false,
  locations = [],
  onBack,
  onRequestAction,
  onValidationIssue,
  operatives = [],
}) {
  const formRef = useRef(null);
  const [capacityMode, setCapacityMode] = useState('defined');
  const [audienceType, setAudienceType] = useState('GENERAL');
  const [goalEnabled, setGoalEnabled] = useState(false);
  const [goalType, setGoalType] = useState('CANTIDAD_ASISTENTES');
  const [surveyEnabled, setSurveyEnabled] = useState(false);
  const [surveyCommentsEnabled, setSurveyCommentsEnabled] = useState(false);
  const [eventStartValue, setEventStartValue] = useState('');
  const [requiresRegistration, setRequiresRegistration] = useState(true);
  const [requiresControl, setRequiresControl] = useState(true);
  const [requiresPayment, setRequiresPayment] = useState(false);
  const [selectedOperativeIds, setSelectedOperativeIds] = useState([]);
  const [checklistEvent, setChecklistEvent] = useState(() => ({
    requiresRegistration: true,
    requiereInscripcion: true,
    requiereControlAsistencia: true,
    resources: {},
    state: 'BORRADOR',
  }));
  const [missingReviewFields, setMissingReviewFields] = useState(() =>
    getMissingReviewFields(null),
  );
  const checklist = getCreationEventChecklist(checklistEvent);
  const canSendToReview = missingReviewFields.length === 0;

  function syncChecklistFromForm() {
    const form = formRef.current;

    setCapacityMode(getNamedFormValue(form, 'capacityMode') || 'defined');
    setAudienceType(getNamedFormValue(form, 'publico_tipo') || 'GENERAL');
    setGoalEnabled(isNamedChecked(form, 'attendanceGoalEnabled'));
    setGoalType(getNamedFormValue(form, 'attendanceGoalType') || 'CANTIDAD_ASISTENTES');
    setSurveyEnabled(isNamedChecked(form, 'surveyEnabled'));
    setSurveyCommentsEnabled(isNamedChecked(form, 'surveyCommentsEnabled'));
    setEventStartValue(getNamedFormValue(form, 'eventStart'));
    const nextRequiresRegistration = isNamedChecked(form, 'requiresRegistration');
    const nextRequiresControl = nextRequiresRegistration && isNamedChecked(form, 'requiresAttendanceControl');
    const nextRequiresPayment = nextRequiresRegistration && isNamedChecked(form, 'requiresPayment');
    setRequiresRegistration(nextRequiresRegistration);
    setRequiresControl(nextRequiresControl);
    setRequiresPayment(nextRequiresPayment);
    setSelectedOperativeIds(nextRequiresControl ? getSelectedOperativeIdsFromForm(form) : []);
    setChecklistEvent(
      getChecklistEventFromForm(form, {
        requiresRegistration: true,
        requiereInscripcion: true,
        requiereControlAsistencia: true,
        resources: {},
        state: 'BORRADOR',
      }, { categories, locations }),
    );
    setMissingReviewFields(getMissingReviewFields(form));
  }

  function handleRegistrationChange(checked) {
    setRequiresRegistration(checked);
    if (!checked) {
      setRequiresControl(false);
      setRequiresPayment(false);
      setSelectedOperativeIds([]);
    }
    window.setTimeout(syncChecklistFromForm, 0);
  }

  function handleControlChange(checked) {
    setRequiresControl(checked);
    if (checked) {
      setRequiresRegistration(true);
    }
    window.setTimeout(syncChecklistFromForm, 0);
  }

  function handlePaymentToggle(checked) {
    setRequiresPayment(checked);
    if (checked) {
      setRequiresRegistration(true);
    }
    window.setTimeout(syncChecklistFromForm, 0);
  }

  function requestEventAction(actionType) {
    const form = formRef.current;
    onRequestAction(
      actionType,
      buildEventCreatePayload(form, actionType),
      buildResourceUploadRequestsFromForm(form),
    );
  }

  function requestReview() {
    const missingFields = getMissingReviewFields(formRef.current);

    if (missingFields.length > 0) {
      onValidationIssue({ missingFields });
      return;
    }

    requestEventAction('review');
  }

  return (
    <section className="new-event-view" aria-labelledby="new-event-title">
      <header className="admin-topbar">
        <div>
          <span className="section-kicker">Nuevo registro</span>
          <h1 id="new-event-title">Crear evento municipal</h1>
        </div>
        <button className="admin-new-event-action event-form-top-action" type="button" onClick={onBack}>
          Volver
        </button>
      </header>

      <form
        className="event-form"
        ref={formRef}
        onChange={syncChecklistFromForm}
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        {(isLoadingCatalogs || catalogError) && (
          <p className="settings-inline-notice">
            {catalogError || 'Actualizando catálogos...'}
          </p>
        )}
        <section className="event-form-main">
          <article className="event-form-section" id="datos-generales">
            <div className="form-section-heading">
              <span className="section-kicker">Datos generales</span>
              <h2>Ficha principal</h2>
            </div>
            <div className="form-grid">
              <label className="form-field span-2">
                Título del evento
                <input name="title" placeholder="Ej. Festival Cultural Barrial" />
              </label>
              <label className="form-field">
                Categoria
                <CategoryCombobox categories={categories} onCategoryChange={syncChecklistFromForm} />
              </label>
              <label className="form-field">
                Área responsable
                <MunicipalAreaCombobox areas={areas} onAreaChange={syncChecklistFromForm} />
              </label>
              <label className="form-field span-2">
                Descripción breve
                <textarea
                  maxLength={45}
                  name="descripcion_breve"
                  placeholder="Resumen corto para la agenda y cabecera del evento."
                  rows={3}
                />
                <small>
                  Resumen corto que se mostrará en la agenda y en la cabecera del evento. Máximo 45 caracteres.
                </small>
              </label>
              <label className="form-field span-2">
                Descripción
                <textarea
                  name="description"
                  placeholder="Describe el objetivo, público y actividades principales del evento."
                />
              </label>
            </div>
          </article>

          <article className="event-form-section" id="programacion">
            <div className="form-section-heading">
              <span className="section-kicker">Programación</span>
              <h2>Fechas</h2>
            </div>
            <div className="form-grid">
              <label className="form-field">
                Inicio del evento
                <input name="eventStart" type="datetime-local" />
              </label>
              <label className="form-field">
                Fin del evento
                <input min={eventStartValue || undefined} name="eventEnd" type="datetime-local" />
              </label>
              <label className="form-field">
                Costo referencial
                <input
                  min="0"
                  name="referenceCost"
                  placeholder="4200.00"
                  step="0.01"
                  type="number"
                />
              </label>
              <label className="form-field">
                Dirigido a
                <select defaultValue="GENERAL" name="publico_tipo">
                  <option value="GENERAL">Público general</option>
                  <option value="OBJETIVO">Público objetivo</option>
                </select>
              </label>
              {audienceType === 'OBJETIVO' && (
                <>
                  <label className="form-field">
                    Edad mínima
                    <input min="0" name="edad_minima" placeholder="13" type="number" />
                  </label>
                  <label className="form-field">
                    Edad máxima
                    <input max="120" min="1" name="edad_maxima" placeholder="25" type="number" />
                  </label>
                </>
              )}
              <RegistrationRequirementField
                checked={requiresRegistration}
                onChange={handleRegistrationChange}
              />
              {requiresRegistration && (
                <PaymentConfigurationFields
                  checked={requiresPayment}
                  enabled={requiresRegistration}
                  onToggle={handlePaymentToggle}
                />
              )}
            </div>
          </article>

          {requiresRegistration && (
            <>
              <EvaluationTrackingSection
                capacityMode={capacityMode}
                goalEnabled={goalEnabled}
                goalType={goalType}
                surveyCommentsEnabled={surveyCommentsEnabled}
                surveyEnabled={surveyEnabled}
              />

              <AttendanceControlSection
                requiresControl={requiresControl}
                requiresRegistration={requiresRegistration}
                onControlChange={handleControlChange}
              />
            </>
          )}

          {requiresControl && (
            <OperativeAssignmentSection
              operatives={operatives}
              selectedIds={selectedOperativeIds}
              onSelectionChange={(ids) => {
                setSelectedOperativeIds(ids);
                window.setTimeout(syncChecklistFromForm, 0);
              }}
            />
          )}

          <article className="event-form-section event-content-section" id="contenido-evento">
            <div className="form-section-heading">
              <span className="section-kicker">Contenido del evento</span>
              <h2>Agenda y requisitos</h2>
            </div>
            <div className="event-content-grid">
              <OrderedEventListEditor
                addLabel="Agregar actividad"
                description="Define las actividades principales en el orden en que se realizarán."
                hiddenInputName="agenda_evento_json"
                itemPlaceholder="Recepción ciudadana"
                kicker="Programa"
                title="Agenda del evento"
                onListChange={syncChecklistFromForm}
              />
              <OrderedEventListEditor
                addLabel="Agregar requisito"
                description="Indica las condiciones o documentos que el vecino debe considerar."
                hiddenInputName="requisitos_evento_json"
                itemPlaceholder="DNI vigente"
                kicker="Antes de asistir"
                title="Requisitos del evento"
                onListChange={syncChecklistFromForm}
              />
            </div>
          </article>

          <article className="event-form-section" id="ubicacion">
            <div className="form-section-heading">
              <span className="section-kicker">Ubicación</span>
              <h2>Lugar del evento</h2>
            </div>
            <LocationCatalogSelector locations={locations} />
          </article>

          <article className="event-form-section" id="recursos">
            <div className="form-section-heading">
              <span className="section-kicker">Recursos</span>
              <h2>Material del evento</h2>
            </div>
            <div className="resource-grid">
              <ResourceUploadCard
                accept="image/*"
                label="Imagen de portada"
                name="coverImage"
                resourceType="IMAGEN_PORTADA"
                showPreview
              />
              <ResourceUploadCard
                accept=".pdf,image/jpeg,image/png"
                label="Afiche (PDF, JPG o PNG)"
                name="poster"
                resourceType="AFICHE"
                showPreview
              />
              <VideoResourceCard />
            </div>
          </article>
        </section>

        <aside className="event-form-aside">
          <section className="admin-panel compact-side-card new-event-completion-card">
            <span className="section-kicker">Completitud de ficha</span>
            <div className="side-ficha-summary">
              <DonutProgress value={checklist.completion} />
            </div>
          </section>

          <section className="admin-panel validation-side-card">
            <span className="section-kicker">Revisión</span>
            <h2>Validación de ficha</h2>
            <div className="dynamic-checklist new-event-checklist">
              {checklist.items.map((item) => (
                <p
                  className={item.complete ? 'is-complete' : 'is-pending'}
                  key={item.positiveLabel}
                >
                  <span aria-hidden="true" />
                  {item.label ?? item.positiveLabel}
                </p>
              ))}
            </div>
          </section>

          <div className="event-form-actions">
            <button
              className="admin-secondary-action event-draft-action"
              type="button"
              onClick={() => requestEventAction('draft')}
            >
              Guardar borrador
            </button>
            <button
              className="admin-new-event-action event-review-action"
              disabled={!canSendToReview}
              type="button"
              onClick={requestReview}
            >
              Enviar a revisión
            </button>
          </div>
        </aside>
      </form>
    </section>
  );
}

function EditEventView({
  areas = eventOrganizerAreas,
  categories = [],
  catalogError = '',
  event,
  isLoadingCatalogs = false,
  locations = [],
  onBack,
  onRequestAction,
  onRequestDelete,
  onValidationIssue,
  operatives = [],
}) {
  const formRef = useRef(null);
  const initialCapacityMode = Number(event.aforoMaximo ?? event.spots ?? 0) > 0 ? 'defined' : 'none';
  const initialAudienceType =
    event.publico_tipo ?? (event.edad_minima || event.edad_maxima ? 'OBJETIVO' : 'GENERAL');
  const initialMunicipalArea = getMunicipalAreaByEvent(event, areas);
  const eventWithMunicipalArea = useMemo(() => ({
    ...event,
    area_municipal_id: event.area_municipal_id ?? initialMunicipalArea?.area_municipal_id ?? '',
    organizer: initialMunicipalArea?.nombre ?? event.organizer,
  }), [event, initialMunicipalArea?.area_municipal_id, initialMunicipalArea?.nombre]);
  const [eventResources, setEventResources] = useState(() =>
    Array.isArray(event.resourceItems) ? event.resourceItems : [],
  );
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [resourceLoadError, setResourceLoadError] = useState('');
  const [deletingResourceId, setDeletingResourceId] = useState(null);
  const [resourceToDelete, setResourceToDelete] = useState(null);
  const resourceFlags = useMemo(() => ({
    AFICHE: eventResources.some((resource) => resource?.tipoRecurso === 'AFICHE'),
    IMAGEN_PORTADA: eventResources.some((resource) => resource?.tipoRecurso === 'IMAGEN_PORTADA'),
    VIDEO: eventResources.some((resource) => resource?.tipoRecurso === 'VIDEO'),
  }), [eventResources]);
  const currentVideoResource = eventResources.find((resource) => resource?.tipoRecurso === 'VIDEO');
  const eventWithResources = useMemo(() => ({
    ...eventWithMunicipalArea,
    resourceItems: eventResources,
    resources: {
      ...(eventWithMunicipalArea.resources ?? {}),
      ...resourceFlags,
    },
    videoUrl: currentVideoResource?.signedUrl ?? event.videoUrl ?? '',
  }), [currentVideoResource?.signedUrl, event.videoUrl, eventResources, eventWithMunicipalArea, resourceFlags]);
  const [capacityMode, setCapacityMode] = useState(initialCapacityMode);
  const [audienceType, setAudienceType] = useState(initialAudienceType);
  const [goalEnabled, setGoalEnabled] = useState(Boolean(event.metaTipo));
  const [goalType, setGoalType] = useState(event.metaTipo ?? 'CANTIDAD_ASISTENTES');
  const [surveyEnabled, setSurveyEnabled] = useState(Boolean(event.encuestaSatisfaccionHabilitada));
  const [surveyCommentsEnabled, setSurveyCommentsEnabled] = useState(Boolean(event.encuestaComentarioHabilitado));
  const [eventStartValue, setEventStartValue] = useState(() => getEventStartDateTimeValue(event));
  const [requiresRegistration, setRequiresRegistration] = useState(() => requiresEventRegistration(event));
  const [requiresControl, setRequiresControl] = useState(() => requiresAttendanceControl(event));
  const [requiresPayment, setRequiresPayment] = useState(() => Boolean(event.requiresPayment));
  const [selectedOperativeIds, setSelectedOperativeIds] = useState(() => event.operativosAsignadosIds ?? []);
  const [checklistEvent, setChecklistEvent] = useState(() => eventWithResources);
  const [hasFormChanges, setHasFormChanges] = useState(false);
  const checklist = getEventChecklist(checklistEvent, {
    observationAddressed: hasFormChanges,
  });
  const canSendToReview =
    ['BORRADOR', 'OBSERVADO'].includes(event.state) &&
    !checklist.hasCriticalPending;

  function syncChecklistFromForm() {
    setHasFormChanges(true);
    setCapacityMode(getNamedFormValue(formRef.current, 'capacityMode') || 'defined');
    setAudienceType(getNamedFormValue(formRef.current, 'publico_tipo') || 'GENERAL');
    setGoalEnabled(isNamedChecked(formRef.current, 'attendanceGoalEnabled'));
    setGoalType(getNamedFormValue(formRef.current, 'attendanceGoalType') || 'CANTIDAD_ASISTENTES');
    setSurveyEnabled(isNamedChecked(formRef.current, 'surveyEnabled'));
    setSurveyCommentsEnabled(isNamedChecked(formRef.current, 'surveyCommentsEnabled'));
    setEventStartValue(getNamedFormValue(formRef.current, 'eventStart'));
    const nextRequiresRegistration = isNamedChecked(formRef.current, 'requiresRegistration');
    const nextRequiresControl = nextRequiresRegistration && isNamedChecked(formRef.current, 'requiresAttendanceControl');
    const nextRequiresPayment = nextRequiresRegistration && isNamedChecked(formRef.current, 'requiresPayment');
    setRequiresRegistration(nextRequiresRegistration);
    setRequiresControl(nextRequiresControl);
    setRequiresPayment(nextRequiresPayment);
    setSelectedOperativeIds(nextRequiresControl ? getSelectedOperativeIdsFromForm(formRef.current) : []);
    setChecklistEvent(getChecklistEventFromForm(formRef.current, eventWithResources, { categories, locations }));
  }

  function handleRegistrationChange(checked) {
    setRequiresRegistration(checked);
    if (!checked) {
      setRequiresControl(false);
      setRequiresPayment(false);
      setSelectedOperativeIds([]);
    }
    setHasFormChanges(true);
    window.setTimeout(syncChecklistFromForm, 0);
  }

  function handleControlChange(checked) {
    setRequiresControl(checked);
    if (checked) {
      setRequiresRegistration(true);
    }
    setHasFormChanges(true);
    window.setTimeout(syncChecklistFromForm, 0);
  }

  function handlePaymentToggle(checked) {
    setRequiresPayment(checked);
    if (checked) {
      setRequiresRegistration(true);
    }
    setHasFormChanges(true);
    window.setTimeout(syncChecklistFromForm, 0);
  }

  function requestEventAction(actionType, payloadActionType) {
    const form = formRef.current;
    onRequestAction(
      actionType,
      buildEventCreatePayload(form, payloadActionType, eventWithResources),
      buildResourceUploadRequestsFromForm(form),
    );
  }

  function requestReview() {
    const missingFields = getMissingReviewFields(formRef.current, eventWithResources);

    if (missingFields.length > 0) {
      onValidationIssue({ missingFields });
      return;
    }

    requestEventAction('review-changes', 'review');
  }

  const loadEventResources = useCallback(async () => {
    if (!event.id) {
      setEventResources([]);
      return;
    }

    try {
      setIsLoadingResources(true);
      setResourceLoadError('');
      const resources = await getRecursosEvento(event.id);
      setEventResources(Array.isArray(resources) ? resources : []);
    } catch (error) {
      setResourceLoadError(getApiErrorMessage(error, 'No se pudieron cargar los recursos del evento.'));
    } finally {
      setIsLoadingResources(false);
    }
  }, [event.id]);

  function requestDeleteEventResource(resource) {
    setResourceToDelete(resource);
  }

  const confirmDeleteEventResource = useCallback(async () => {
    if (!event.id || !resourceToDelete?.id) {
      return;
    }

    try {
      setDeletingResourceId(resourceToDelete.id);
      setResourceLoadError('');
      await eliminarRecursoEvento(event.id, resourceToDelete.id);
      setEventResources((currentResources) =>
        currentResources.filter((currentResource) => currentResource.id !== resourceToDelete.id),
      );
      setResourceToDelete(null);
    } catch (error) {
      setResourceLoadError(getApiErrorMessage(error, 'No se pudo eliminar el recurso del evento.'));
    } finally {
      setDeletingResourceId(null);
    }
  }, [event.id, resourceToDelete]);

  useEffect(() => {
    const loadTimer = window.setTimeout(loadEventResources, 0);

    return () => window.clearTimeout(loadTimer);
  }, [loadEventResources]);

  useEffect(() => {
    if (formRef.current) {
      setChecklistEvent(getChecklistEventFromForm(formRef.current, eventWithResources, { categories, locations }));
      return;
    }

    setChecklistEvent(eventWithResources);
  }, [categories, eventWithResources, locations]);

  return (
    <section className="new-event-view" aria-labelledby="edit-event-title">
      <header className="admin-topbar">
        <div>
          <span className="section-kicker">Edición de evento</span>
          <h1 id="edit-event-title">Editar evento municipal</h1>
        </div>
        <button className="admin-new-event-action event-form-top-action" type="button" onClick={onBack}>
          Volver
        </button>
      </header>

      <form
        className="event-form"
        ref={formRef}
        onChange={syncChecklistFromForm}
        onSubmit={(formEvent) => {
          formEvent.preventDefault();
        }}
      >
        {(isLoadingCatalogs || catalogError) && (
          <p className="settings-inline-notice">
            {catalogError || 'Actualizando catálogos...'}
          </p>
        )}
        <section className="event-form-main">
          <article className="event-form-section" id="datos-generales">
            <div className="form-section-heading">
              <span className="section-kicker">Datos generales</span>
              <h2>Ficha principal</h2>
            </div>
            <div className="form-grid">
              <label className="form-field span-2">
                Título del evento
                <input defaultValue={event.title} name="title" />
              </label>
              <label className="form-field">
                Categoría
                <CategoryCombobox
                  categories={categories}
                  defaultCategoryId={event.categoria_id}
                  defaultCategoryName={event.category}
                  onCategoryChange={syncChecklistFromForm}
                />
              </label>
              <label className="form-field">
                Área responsable
                <MunicipalAreaCombobox
                  areas={areas}
                  defaultAreaId={eventWithMunicipalArea.area_municipal_id}
                  defaultAreaName={eventWithMunicipalArea.organizer}
                  onAreaChange={syncChecklistFromForm}
                />
              </label>
              <label className="form-field span-2">
                Descripción breve
                <textarea
                  defaultValue={event.descripcion_breve ?? event.summary ?? ''}
                  maxLength={45}
                  name="descripcion_breve"
                  rows={3}
                />
                <small>
                  Resumen corto que se mostrará en la agenda y en la cabecera del evento. Máximo 45 caracteres.
                </small>
              </label>
              <label className="form-field span-2">
                Descripción
                <textarea defaultValue={event.description} name="description" />
              </label>
            </div>
          </article>

          <article className="event-form-section" id="programacion">
            <div className="form-section-heading">
              <span className="section-kicker">Programación</span>
              <h2>Fechas</h2>
            </div>
            <div className="form-grid">
              <label className="form-field">
                Inicio del evento
                <input
                  defaultValue={getEventStartDateTimeValue(event)}
                  name="eventStart"
                  type="datetime-local"
                />
              </label>
              <label className="form-field">
                Fin del evento
                <input
                  defaultValue={getEventEndDateTimeValue(event)}
                  min={eventStartValue || undefined}
                  name="eventEnd"
                  type="datetime-local"
                />
              </label>
              <label className="form-field">
                Costo referencial
                <input
                  defaultValue={event.referenceCost}
                  min="0"
                  name="referenceCost"
                  step="0.01"
                  type="number"
                />
              </label>
              <label className="form-field">
                Dirigido a
                <select defaultValue={initialAudienceType} name="publico_tipo">
                  <option value="GENERAL">Público general</option>
                  <option value="OBJETIVO">Público objetivo</option>
                </select>
              </label>
              {audienceType === 'OBJETIVO' && (
                <>
                  <label className="form-field">
                    Edad mínima
                    <input
                      defaultValue={event.edad_minima ?? ''}
                      min="0"
                      name="edad_minima"
                      placeholder="13"
                      type="number"
                    />
                  </label>
                  <label className="form-field">
                    Edad máxima
                    <input
                      defaultValue={event.edad_maxima ?? ''}
                      max="120"
                      min="1"
                      name="edad_maxima"
                      placeholder="25"
                      type="number"
                    />
                  </label>
                </>
              )}
              <RegistrationRequirementField
                checked={requiresRegistration}
                onChange={handleRegistrationChange}
              />
              {requiresRegistration && (
                <PaymentConfigurationFields
                  checked={requiresPayment}
                  defaultCost={event.paymentCost ?? ''}
                  defaultInstructions={event.paymentInstructions ?? ''}
                  enabled={requiresRegistration}
                  onToggle={handlePaymentToggle}
                />
              )}
            </div>
          </article>

          {requiresRegistration && (
            <>
              <EvaluationTrackingSection
                capacityMode={capacityMode}
                capacityValue={event.aforoMaximo ?? event.spots ?? ''}
                goalEnabled={goalEnabled}
                goalType={goalType}
                goalValue={event.metaValor ?? ''}
                surveyCommentsEnabled={surveyCommentsEnabled}
                surveyEnabled={surveyEnabled}
              />

              <AttendanceControlSection
                requiresControl={requiresControl}
                requiresRegistration={requiresRegistration}
                onControlChange={handleControlChange}
              />
            </>
          )}

          {requiresControl && (
            <OperativeAssignmentSection
              operatives={operatives}
              selectedIds={selectedOperativeIds}
              onSelectionChange={(ids) => {
                setSelectedOperativeIds(ids);
                setHasFormChanges(true);
                window.setTimeout(syncChecklistFromForm, 0);
              }}
            />
          )}

          <article className="event-form-section event-content-section" id="contenido-evento">
            <div className="form-section-heading">
              <span className="section-kicker">Contenido del evento</span>
              <h2>Agenda y requisitos</h2>
            </div>
            <div className="event-content-grid">
              <OrderedEventListEditor
                addLabel="Agregar actividad"
                description="Define las actividades principales en el orden en que se realizarán."
                hiddenInputName="agenda_evento_json"
                initialItems={event.agenda_evento ?? event.agenda}
                itemPlaceholder="Recepción ciudadana"
                kicker="Programa"
                title="Agenda del evento"
                onListChange={syncChecklistFromForm}
              />
              <OrderedEventListEditor
                addLabel="Agregar requisito"
                description="Indica las condiciones o documentos que el vecino debe considerar."
                hiddenInputName="requisitos_evento_json"
                initialItems={event.requisitos_evento ?? event.requirements}
                itemPlaceholder="DNI vigente"
                kicker="Antes de asistir"
                title="Requisitos del evento"
                onListChange={syncChecklistFromForm}
              />
            </div>
          </article>

          <article className="event-form-section" id="ubicacion">
            <div className="form-section-heading">
              <span className="section-kicker">Ubicación</span>
              <h2>Lugar del evento</h2>
            </div>
            <LocationCatalogSelector defaultLocationId={event.ubicacion_id} locations={locations} />
          </article>

          <article className="event-form-section" id="recursos">
            <div className="form-section-heading">
              <span className="section-kicker">Recursos</span>
              <h2>Material del evento</h2>
            </div>
            <ExistingEventResources
              deletingResourceId={deletingResourceId}
              error={resourceLoadError}
              isLoading={isLoadingResources}
              resources={eventResources}
              onDelete={requestDeleteEventResource}
              onRetry={loadEventResources}
            />
            <div className="resource-grid">
              <ResourceUploadCard
                accept="image/*"
                label="Actualizar portada"
                name="coverImage"
                resourceType="IMAGEN_PORTADA"
                showPreview
              />
              <ResourceUploadCard
                accept=".pdf,image/jpeg,image/png"
                label="Actualizar afiche (PDF, JPG o PNG)"
                name="poster"
                resourceType="AFICHE"
                showPreview
              />
              <VideoResourceCard defaultValue={eventWithResources.videoUrl ?? ''} />
            </div>
          </article>

          
        </section>

        <aside className="event-form-aside">
          <div className="side-summary-grid">
            <section className="admin-panel compact-side-card">
              <span className="section-kicker">Completitud de ficha</span>
              <div className="side-ficha-summary">
                <DonutProgress value={checklist.completion} />
              </div>
            </section>

            <section className="admin-panel compact-side-card">
              <span className="section-kicker">Estado actual</span>
              <div className="side-state-summary">
                <StateBadge state={event.state} />
                <p>{getStateSummaryText(event.state)}</p>
              </div>
            </section>
          </div>

          {event.state === 'OBSERVADO' && event.directorObservation && (
            <section className="admin-panel director-observation-panel">
              <span className="section-kicker">Observacion del directivo</span>
              <h2>Correccion solicitada</h2>
              <blockquote>{event.directorObservation}</blockquote>
              <div className="director-observation-meta">
                {event.directorName && <span>{event.directorName}</span>}
                {event.directorObservationDateTime && (
                  <time dateTime={event.directorObservationDateTime}>
                    {formatManagementDateTime(event.directorObservationDateTime)}
                  </time>
                )}
              </div>
            </section>
          )}
          <section className="admin-panel validation-side-card">
            <span className="section-kicker">Revisión</span>
            <h2>Validación de ficha</h2>
            <div className="dynamic-checklist">
              {checklist.items.map((item) => (
                <p
                  className={
                    item.complete ? 'is-complete' : 'is-pending'
                  }
                  key={item.label}
                >
                  <span aria-hidden="true">{item.complete ? '✓' : '!'}</span>
                  {item.label}
                </p>
              ))}
            </div>
          </section>

          <div className="event-form-actions">
            {event.state === 'BORRADOR' && (
              <button
                className="admin-secondary-action event-delete-action"
                type="button"
                onClick={() => onRequestDelete(event)}
              >
                Eliminar evento
              </button>
            )}
            <button
              className="admin-secondary-action event-draft-action"
              type="button"
              onClick={() => requestEventAction('save-changes', 'draft')}
            >
              Guardar cambios
            </button>
            {['BORRADOR', 'OBSERVADO'].includes(event.state) && (
              <button
                className="admin-new-event-action event-review-action"
                disabled={!canSendToReview}
                type="button"
                onClick={requestReview}
              >
                Enviar a revisión
              </button>
            )}
          </div>
        </aside>
      </form>
      {resourceToDelete && (
        <ResourceDeleteModal
          isDeleting={deletingResourceId === resourceToDelete.id}
          resource={resourceToDelete}
          onCancel={() => setResourceToDelete(null)}
          onConfirm={confirmDeleteEventResource}
        />
      )}
    </section>
  );
}

function ResourceDeleteModal({ isDeleting = false, onCancel, onConfirm, resource }) {
  const resourceName = resource?.nombreOriginal || getResourceTypeLabel(resource?.tipoRecurso);
  const resourceType = getResourceTypeLabel(resource?.tipoRecurso);

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={isDeleting ? undefined : onCancel}
    >
      <section
        aria-labelledby="delete-event-resource-title"
        aria-modal="true"
        className="confirm-modal event-delete-modal resource-delete-modal"
        role="dialog"
        onMouseDown={(mouseEvent) => mouseEvent.stopPropagation()}
      >
        <span className="section-kicker">Recurso del evento</span>
        <h2 id="delete-event-resource-title">Eliminar recurso</h2>
        <p>
          ¿Deseas eliminar el {resourceType.toLowerCase()} "{resourceName}"? Esta acción quitará el archivo del bucket y del evento.
        </p>
        <div className="modal-actions">
          <button className="back-button" disabled={isDeleting} type="button" onClick={onCancel}>
            Cancelar
          </button>
          <LoadingButton className="primary-button danger-action" loading={isDeleting} loadingLabel="Eliminando..." onClick={onConfirm}>
            Eliminar recurso
          </LoadingButton>
        </div>
      </section>
    </div>
  );
}

function ValidationIssueModal({
  actionLabel = 'Revisar ficha',
  description = 'Para enviar este evento a revisión directiva, primero registra los siguientes campos:',
  kicker = 'Ficha incompleta',
  missingFields,
  onClose,
  title = 'Completa la información requerida',
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section
        aria-labelledby="validation-issue-title"
        aria-modal="true"
        className="confirm-modal"
        role="dialog"
      >
        <span className="section-kicker">{kicker}</span>
        <h2 id="validation-issue-title">{title}</h2>
        <p>{description}</p>
        <ul className="validation-missing-list">
          {missingFields.map((field) => (
            <li key={field}>{field}</li>
          ))}
        </ul>
        <div className="modal-actions single-action">
          <button className="primary-button" type="button" onClick={onClose}>
            {actionLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

function DeleteDraftEventModal({ event, isDeleting = false, onCancel, onConfirm }) {
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={isDeleting ? undefined : onCancel}
    >
      <section
        aria-labelledby="delete-draft-event-title"
        aria-modal="true"
        className="confirm-modal event-delete-modal"
        role="dialog"
        onMouseDown={(mouseEvent) => mouseEvent.stopPropagation()}
      >
        <span className="section-kicker">Borrador</span>
        <h2 id="delete-draft-event-title">Eliminar evento</h2>
        <p>
          ¿Deseas eliminar el evento "{event.title}"? Esta acción no se puede deshacer.
        </p>
        <div className="modal-actions">
          <button className="back-button" disabled={isDeleting} type="button" onClick={onCancel}>
            Cancelar
          </button>
          <LoadingButton className="primary-button danger-action" loading={isDeleting} loadingLabel="Eliminando..." onClick={onConfirm}>
            Eliminar evento
          </LoadingButton>
        </div>
      </section>
    </div>
  );
}

function CancelPublishedEventModal({
  error = '',
  event,
  isCancelling = false,
  motivo = '',
  onCancel,
  onConfirm,
  onMotivoChange,
}) {
  function handleSubmit(submitEvent) {
    submitEvent.preventDefault();
    onConfirm();
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="confirm-modal event-delete-modal" aria-labelledby="cancel-event-title" role="dialog" aria-modal="true">
        <span className="section-kicker">Cancelar evento publicado</span>
        <h2 id="cancel-event-title">Cancelar {event?.title ?? 'evento'}</h2>
        <p>
          Al cancelar el evento, se cancelaran las inscripciones confirmadas y se revocaran los codigos QR activos asociados.
        </p>
        <form className="event-cancel-form" onSubmit={handleSubmit}>
          <label>
            Motivo de cancelacion
            <textarea
              autoFocus
              required
              rows={4}
              value={motivo}
              onChange={(changeEvent) => onMotivoChange(changeEvent.target.value)}
              placeholder="Indica el motivo para dejar trazabilidad de la cancelacion."
            />
          </label>
          {error && <p className="settings-inline-error" role="alert">{error}</p>}
          <div className="modal-actions">
            <button className="back-button" disabled={isCancelling} type="button" onClick={onCancel}>
              Volver
            </button>
            <LoadingButton
              className="primary-button danger-action"
              loading={isCancelling}
              loadingLabel="Cancelando..."
              type="submit"
            >
              Cancelar evento
            </LoadingButton>
          </div>
        </form>
      </section>
    </div>
  );
}

function ConfirmEventActionModal({ action, isSaving = false, onCancel, onConfirm }) {
  const actionType = typeof action === 'string' ? action : action.type;
  const isCreate = typeof action === 'string' || action.mode === 'create';
  const isReview = actionType === 'review' || actionType === 'review-changes';
  const isSaveChanges = actionType === 'save-changes';
  const title = getEventActionTitle(actionType, action.eventTitle);
  const description = getEventActionDescription(actionType, isCreate);
  const confirmLabel = isSaveChanges
    ? 'Sí, guardar cambios'
    : isReview
      ? 'Sí, enviar a revisión'
      : 'Sí, guardar borrador';

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        aria-labelledby="confirm-event-action-title"
        aria-modal="true"
        className="confirm-modal"
        role="dialog"
      >
        <span className="section-kicker">
          {isSaveChanges
            ? 'Guardar cambios'
            : isReview
              ? 'Enviar a revisión'
              : 'Guardar borrador'}
        </span>
        <h2 id="confirm-event-action-title">{title}</h2>
        <p>{description}</p>
        <div className="modal-actions">
          <button className="back-button" disabled={isSaving} type="button" onClick={onCancel}>
            Revisar datos
          </button>
          <LoadingButton
            className="primary-button"
            loading={isSaving}
            loadingLabel={isReview ? 'Enviando...' : 'Guardando...'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </LoadingButton>
        </div>
      </section>
    </div>
  );
}

function getEventActionTitle(actionType, eventTitle) {
  if (actionType === 'save-changes') {
    return `¿Estás seguro de guardar los cambios de "${eventTitle}"?`;
  }

  if (actionType === 'review-changes') {
    return `¿Estás seguro de enviar "${eventTitle}" a revisión?`;
  }

  if (actionType === 'review') {
    return '¿Estás seguro de enviar este evento a revisión?';
  }

  return '¿Estás seguro de guardar este evento como borrador?';
}

function getEventActionDescription(actionType, isCreate) {
  if (actionType === 'save-changes') {
    return 'Los cambios quedarán registrados en la ficha del evento y volverás a la gestión municipal de eventos.';
  }

  if (actionType === 'review-changes') {
    return 'La ficha corregida pasará a PARA_REVISION para que el usuario directivo pueda aprobarla u observarla.';
  }

  if (actionType === 'review') {
    return 'El evento pasará a PARA_REVISION para que el usuario directivo pueda aprobarlo u observarlo antes de publicarlo.';
  }

  return isCreate
    ? 'El evento permanecerá como BORRADOR y podrás completarlo o editarlo antes de enviarlo al directivo.'
    : 'La ficha conservará sus cambios como BORRADOR dentro del flujo administrativo.';
}

export default AdminDashboard;