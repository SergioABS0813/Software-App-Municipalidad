import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import municipalLogo from '../../assets/images/municipalidad-logo.png';
import PublicEventDetail from '../public-portal/PublicEventDetail';
import { adminEvents, formatEventState } from './dashboardData';
import NotificationMenu from './NotificationMenu';
import './AdminDashboard.css';

function getManagementStats(events) {
  return [
    {
      icon: CalendarCheckLineIcon,
      label: 'Publicados',
      tone: 'is-published',
      trend: 'visibles en el portal',
      value: events.filter((event) => event.state === 'PUBLICADO').length,
    },
    {
      icon: FileEditLineIcon,
      label: 'Borradores',
      tone: 'is-draft',
      trend: 'requieren completar datos',
      value: events.filter((event) => event.state === 'BORRADOR').length,
    },
    {
      icon: ClipboardCheckLineIcon,
      label: 'Para revisión',
      tone: 'is-review',
      trend: 'pendientes del directivo',
      value: events.filter((event) =>
        ['EN_REVISION', 'OBSERVADO_EN_REVISION'].includes(event.state),
      ).length,
    },
    {
      icon: TriangleAlertLineIcon,
      label: 'Observados',
      tone: 'is-observed',
      trend: 'requieren correcciones',
      value: events.filter((event) => event.state === 'OBSERVADO').length,
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
    message: '"Voluntariado Local" fue aprobado.',
    type: 'Evento aprobado',
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

const stateOptions = ['Todos', ...new Set(adminEvents.map((event) => event.state))];
const categoryOptions = ['Todas', ...new Set(adminEvents.map((event) => event.category))];
const eventFormSections = [
  { id: 'datos-generales', label: 'Datos generales' },
  { id: 'programacion', label: 'Programación' },
  { id: 'evaluacion', label: 'Evaluación' },
  { id: 'contenido-evento', label: 'Contenido' },
  { id: 'ubicacion', label: 'Ubicación' },
  { id: 'recursos', label: 'Recursos' },
];

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

const initialNeighborAccounts = [
  {
    id: 1,
    dni: '12345678',
    nombres: 'Sergio André',
    apellidos: 'Bustamante Villanueva',
    nombreCompleto: 'Sergio André Bustamante Villanueva',
    correo: 'vecino@gmail.com',
    celular: '987654321',
    fechaNacimiento: '1998-04-16',
    estado: 'ACTIVO',
    fechaRegistro: '2026-06-01',
    fechaConfirmacionCorreo: '2026-06-01',
    inscripciones: [
      {
        asistencia: 'Pendiente',
        codigoInscripcion: 'EC-1-PERFIL',
        estadoInscripcion: 'Confirmada',
        evento: 'Festival Cultural Barrial',
        fechaEvento: 'Sáb, 08 jun',
      },
      {
        asistencia: 'Validada',
        codigoInscripcion: 'EC-2-5678',
        estadoInscripcion: 'Confirmada',
        evento: 'Taller de Marinera',
        fechaEvento: 'Mié, 12 jun',
      },
      {
        asistencia: 'Pendiente',
        codigoInscripcion: 'EC-5-5678',
        estadoInscripcion: 'Confirmada',
        evento: 'Voluntariado Local',
        fechaEvento: 'Vie, 21 jun',
      },
    ],
  },
  {
    id: 2,
    dni: '87654321',
    nombres: 'María Fernanda',
    apellidos: 'López Ramos',
    nombreCompleto: 'María Fernanda López Ramos',
    correo: 'maria@gmail.com',
    celular: '999888777',
    fechaNacimiento: '2001-09-20',
    estado: 'PENDIENTE_CONFIRMACION',
    fechaRegistro: '2026-06-02',
    fechaConfirmacionCorreo: '',
    inscripciones: [],
  },
  {
    id: 3,
    dni: '11223344',
    nombres: 'Carlos Alberto',
    apellidos: 'Ruiz Medina',
    nombreCompleto: 'Carlos Alberto Ruiz Medina',
    correo: 'carlos@gmail.com',
    celular: '988776655',
    fechaNacimiento: '1985-02-10',
    estado: 'BLOQUEADO',
    fechaRegistro: '2026-05-28',
    fechaConfirmacionCorreo: '2026-05-28',
    motivoBloqueo: 'Uso indebido de reservas',
    inscripciones: [],
  },
];

const neighborStatusOptions = [
  { label: 'Todos', value: 'TODOS' },
  { label: 'Activo', value: 'ACTIVO' },
  { label: 'Pendiente de confirmación', value: 'PENDIENTE_CONFIRMACION' },
  { label: 'Bloqueado', value: 'BLOQUEADO' },
  { label: 'Inactivo', value: 'INACTIVO' },
];

const settingsUsers = [
  { id: 1, dni: '12345678', nombre: 'Administrador municipal', correo: 'admin@munisanmiguel.gob.pe', rol: 'Administrador', areaId: 1, area: 'Gerencia de Desarrollo Social', estado: 'ACTIVO' },
  { id: 2, dni: '87654321', nombre: 'Directivo de Cultura', correo: 'directivo@munisanmiguel.gob.pe', rol: 'Directivo', areaId: 3, area: 'Subgerencia de Educación y Cultura', estado: 'ACTIVO' },
  { id: 3, dni: '11223344', nombre: 'Operativo de asistencia', correo: 'operativo@munisanmiguel.gob.pe', rol: 'Operativo', areaId: 5, area: 'Oficina de Participación Vecinal', estado: 'INACTIVO' },
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
    CERRADO: 'state-closed',
    EN_REVISION: 'state-review',
    FINALIZADO: 'state-finished',
    OBSERVADO: 'state-observed',
    OBSERVADO_EN_REVISION: 'state-reobserved',
    APROBADO: 'state-published',
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
    BLOQUEADO: 'Bloqueado',
    INACTIVO: 'Inactivo',
    PENDIENTE_CONFIRMACION: 'Pendiente',
  };

  return labels[state] ?? state;
}

function getNeighborStateTone(state) {
  const tones = {
    ACTIVO: 'neighbor-active',
    BLOQUEADO: 'neighbor-blocked',
    INACTIVO: 'neighbor-inactive',
    PENDIENTE_CONFIRMACION: 'neighbor-pending',
  };

  return tones[state] ?? 'neighbor-inactive';
}

function getRegisteredLocationById(locationId) {
  return registeredLocations.find(
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
  if (event.aforoMaximo === null || event.capacityMode === 'none') {
    return true;
  }

  return Number(event.aforoMaximo ?? event.spots) > 0;
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

function getMunicipalAreaById(areaId) {
  return eventOrganizerAreas.find(
    (area) => String(area.area_municipal_id) === String(areaId),
  );
}

function getMunicipalAreaByEvent(event) {
  if (event?.area_municipal_id) {
    return getMunicipalAreaById(event.area_municipal_id);
  }

  const organizerText = normalizeSearchText(event?.organizer ?? '');

  if (!organizerText) {
    return null;
  }

  return (
    eventOrganizerAreas.find((area) => normalizeSearchText(area.nombre) === organizerText) ??
    eventOrganizerAreas.find((area) => normalizeSearchText(area.nombre).includes(organizerText)) ??
    eventOrganizerAreas.find((area) => organizerText.includes(normalizeSearchText(area.nombre))) ??
    eventOrganizerAreas.find((area) => {
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
  return getDateTimeLocalValue(event.date) || parsePublicEventDateTime(event.date, event.time);
}

function getEventEndDateTimeValue(event) {
  const directEndValue = getDateTimeLocalValue(event.time);

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
        hasValue(event.date) &&
        hasValue(event.time) &&
        isDateTimeAfter(event.date, event.time) &&
        hasValue(event.registrationStart) &&
        hasValue(event.registrationEnd) &&
        isDateTimeAfter(event.registrationStart, event.registrationEnd) &&
        hasValue(event.publico_tipo) &&
        hasValidAudienceConfig(event) &&
        hasValidAforo(event),
      completeLabel: 'Fechas e inscripción completas',
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
      complete: Boolean(event.resources?.IMAGEN_PORTADA || event.resources?.AFICHE),
      completeLabel: 'Recursos adjuntados',
      pendingLabel: 'Falta imagen referencial',
    },
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
        hasValue(event.date) &&
        hasValue(event.time) &&
        isDateTimeAfter(event.date, event.time) &&
        hasValue(event.registrationStart) &&
        hasValue(event.registrationEnd) &&
        isDateTimeAfter(event.registrationStart, event.registrationEnd) &&
        hasValidAforo(event) &&
        hasValue(event.referenceCost) &&
        hasValue(event.publico_tipo) &&
        hasValidAudienceConfig(event),
      completeLabel: 'Programación e inscripción completas',
    },
    {
      complete: hasValue(event.ubicacion_id),
      completeLabel: 'Ubicación registrada',
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
      complete: Boolean(event.resources?.IMAGEN_PORTADA || event.resources?.AFICHE),
      completeLabel: 'Recursos adjuntados',
    },
  ];
  const completedChecks = checks.filter((item) => item.complete).length;

  return {
    completion: Math.round((completedChecks / checks.length) * 100),
    hasCriticalPending: completedChecks !== checks.length,
    items: checks.map((item) => ({
      complete: item.complete,
      positiveLabel: item.completeLabel,
    })),
  };
}

function getChecklistEventFromForm(form, event) {
  if (!form) {
    return event;
  }

  const selectedLocationId = getNamedFormValue(form, 'ubicacion_id');
  const selectedLocation = getRegisteredLocationById(selectedLocationId);
  const agendaItems = parseOrderedEventItems(getNamedFormValue(form, 'agenda_evento_json'));
  const requirementItems = parseOrderedEventItems(
    getNamedFormValue(form, 'requisitos_evento_json'),
  );
  const audienceType = getNamedFormValue(form, 'publico_tipo') || 'GENERAL';
  const ageMin = audienceType === 'OBJETIVO' ? getNamedFormValue(form, 'edad_minima') : '';
  const ageMax = audienceType === 'OBJETIVO' ? getNamedFormValue(form, 'edad_maxima') : '';
  const selectedAreaId = getNamedFormValue(form, 'area_municipal_id');
  const selectedArea = getMunicipalAreaById(selectedAreaId);

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
    category: getNamedFormValue(form, 'category'),
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
    registrationEnd: getNamedFormValue(form, 'registrationEnd'),
    registrationStart: getNamedFormValue(form, 'registrationStart'),
    resources: {
      ...event.resources,
      AFICHE: Boolean(event.resources?.AFICHE || hasNamedFile(form, 'poster')),
      IMAGEN_PORTADA: Boolean(
        event.resources?.IMAGEN_PORTADA || hasNamedFile(form, 'coverImage'),
      ),
      VIDEO: Boolean(event.resources?.VIDEO || getNamedFormValue(form, 'videoUrl')),
    },
    aforoMaximo:
      getNamedFormValue(form, 'capacityMode') === 'none'
        ? null
        : getNamedFormValue(form, 'capacity'),
    capacityMode: getNamedFormValue(form, 'capacityMode'),
    encuestaComentarioHabilitado: isNamedChecked(form, 'surveyCommentsEnabled'),
    encuestaSatisfaccionHabilitada: isNamedChecked(form, 'surveyEnabled'),
    metaAsistenciaHabilitada: isNamedChecked(form, 'attendanceGoalEnabled'),
    metaTipo: isNamedChecked(form, 'attendanceGoalEnabled')
      ? getNamedFormValue(form, 'attendanceGoalType')
      : null,
    metaValor: isNamedChecked(form, 'attendanceGoalEnabled')
      ? getNamedFormValue(form, 'attendanceGoalValue')
      : null,
    spots:
      getNamedFormValue(form, 'capacityMode') === 'none'
        ? ''
        : getNamedFormValue(form, 'capacity'),
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
    ['category', 'Categoría'],
    ['area_municipal_id', 'Área responsable'],
    ['descripcion_breve', 'Descripción breve'],
    ['description', 'Descripción'],
    ['eventStart', 'Inicio o fecha del evento'],
    ['eventEnd', 'Fin u hora del evento'],
    ['registrationStart', 'Inicio de inscripción'],
    ['registrationEnd', 'Fin de inscripción'],
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
  const registrationStart = getNamedFormValue(form, 'registrationStart');
  const registrationEnd = getNamedFormValue(form, 'registrationEnd');

  if (shortDescription.length > 255) {
    missingFields.push('Descripción breve de máximo 255 caracteres');
  }

  if (hasValue(eventStart) && hasValue(eventEnd) && !isDateTimeAfter(eventStart, eventEnd)) {
    missingFields.push('Fin del evento posterior al inicio del evento');
  }

  if (
    hasValue(registrationStart) &&
    hasValue(registrationEnd) &&
    !isDateTimeAfter(registrationStart, registrationEnd)
  ) {
    missingFields.push('Fin de inscripción posterior al inicio de inscripción');
  }

  if (!hasValidOrderedItems(parseOrderedEventItems(getNamedFormValue(form, 'agenda_evento_json')))) {
    missingFields.push('Agenda del evento');
  }

  if (
    !hasValidOrderedItems(parseOrderedEventItems(getNamedFormValue(form, 'requisitos_evento_json')))
  ) {
    missingFields.push('Requisitos del evento');
  }

  if (capacityMode !== 'none' && Number(getNamedFormValue(form, 'capacity')) <= 0) {
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

  if (attendanceGoalEnabled) {
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
    hasNamedFile(form, 'poster') ||
    Boolean(existingEvent?.resources?.IMAGEN_PORTADA) ||
    Boolean(existingEvent?.resources?.AFICHE);

  if (!hasMainResource) {
    missingFields.push('Imagen de portada o afiche');
  }

  return missingFields;
}

function AdminDashboard({ onLogout, user }) {
  const [currentAdminView, setCurrentAdminView] = useState(() =>
    window.location.pathname === '/admin/vecinos'
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
  const [isSidebarDrawerOpen, setIsSidebarDrawerOpen] = useState(false);
  const [eventItems, setEventItems] = useState(adminEvents);
  const [pendingEventAction, setPendingEventAction] = useState(null);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [eventDeleteNotice, setEventDeleteNotice] = useState('');
  const [validationIssue, setValidationIssue] = useState(null);
  const [selectedAdminEvent, setSelectedAdminEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('Todos');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [activePendingPopover, setActivePendingPopover] = useState(null);
  const [activeFormSection, setActiveFormSection] = useState(eventFormSections[0].id);
  const pendingPopoverRef = useRef(null);
  const isEventFormView =
    currentAdminView === 'new-event' || currentAdminView === 'edit-event';
  const isSettingsView = currentAdminView.startsWith('settings-');
  const adminUser = user ?? fallbackAdminUser;
  const adminUserName = getUserDisplayName(adminUser);
  const managementStats = useMemo(() => getManagementStats(eventItems), [eventItems]);

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
    //Gagaga
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
      observer.disconnect();
    };
  }, [isEventFormView, currentAdminView]);

  function navigateToFormSection(sectionId) {
    closeSidebarDrawer();
    setActiveFormSection(sectionId);
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

  const filteredAdminEvents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return eventItems.filter((event) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [event.title, event.venue, event.organizer]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);
      const matchesState = stateFilter === 'Todos' || event.state === stateFilter;
      const matchesCategory =
        categoryFilter === 'Todas' || event.category === categoryFilter;

      return matchesSearch && matchesState && matchesCategory;
    });
  }, [categoryFilter, eventItems, searchTerm, stateFilter]);

  function openAdminEventEdit(event) {
    setSelectedAdminEvent(event);
    setCurrentAdminView('edit-event');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openAdminEventReview(event) {
    setSelectedAdminEvent(event);
    setCurrentAdminView('review-event');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openPublishedEventPreview(event) {
    setSelectedAdminEvent(event);
    setCurrentAdminView('public-preview');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  function requestDeleteDraftEvent(event) {
    setEventDeleteNotice('');
    setEventToDelete(event);
  }

  function cancelDeleteDraftEvent() {
    setEventToDelete(null);
  }

  function confirmDeleteDraftEvent() {
    if (!eventToDelete) {
      return;
    }

    const currentEvent = eventItems.find((event) => event.id === eventToDelete.id);

    if (currentEvent?.state !== 'BORRADOR') {
      setEventToDelete(null);
      setEventDeleteNotice('Solo se pueden eliminar eventos en estado borrador.');
      return;
    }

    setEventItems((currentEvents) =>
      currentEvents.filter((event) => event.id !== eventToDelete.id),
    );
    registerEventAuditLog('ELIMINAR_EVENTO_BORRADOR', eventToDelete.id);
    setEventToDelete(null);
    setSelectedAdminEvent(null);
    setCurrentAdminView('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <section
      className={[
        'admin-shell',
        isSidebarCollapsed ? 'is-sidebar-collapsed' : '',
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

        <button className="admin-brand" type="button" onClick={onLogout}>
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
                <span className="admin-nav-chevron" aria-hidden="true">⌄</span>
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
          <NewEventView
            onBack={() => setCurrentAdminView('dashboard')}
            onRequestAction={(type) =>
              setPendingEventAction({ mode: 'create', type })
            }
            onValidationIssue={setValidationIssue}
          />
        ) : currentAdminView === 'edit-event' && selectedAdminEvent ? (
          <EditEventView
            event={selectedAdminEvent}
            onBack={() => {
              setSelectedAdminEvent(null);
              setCurrentAdminView('dashboard');
            }}
            onRequestAction={(type) =>
              setPendingEventAction({
                eventTitle: selectedAdminEvent.title,
                mode: 'edit',
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
            onBack={() => {
              setSelectedAdminEvent(null);
              setCurrentAdminView('dashboard');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        ) : currentAdminView === 'neighbors' ? (
          <NeighborAccountsPage adminUserName={adminUserName} />
        ) : currentAdminView === 'settings-users' ? (
          <SettingsUsersPage />
        ) : currentAdminView === 'settings-categories' ? (
          <SettingsCategoriesPage />
        ) : currentAdminView === 'settings-locations' ? (
          <SettingsLocationsPage />
        ) : (
          <>
            <header className="admin-topbar">
              <div>
                <span className="section-kicker">Panel administrativo</span>
                <h1 id="admin-title">Gestión municipal de eventos</h1>
              </div>
              <div className="admin-topbar-actions">
                <NotificationMenu notifications={adminNotifications} />
                <button
                  className="admin-new-event-action"
                  type="button"
                  onClick={() => {
                    setCurrentAdminView('new-event');
                  }}
                >
                  <span aria-hidden="true">+</span>
                  Nuevo evento
                </button>
              </div>
            </header>

            <section className="admin-stats" id="resumen" aria-label="Resumen de gestion">
              {managementStats.map((stat) => (
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
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </label>
                <label>
                  Estado
                  <select
                    value={stateFilter}
                    onChange={(event) => setStateFilter(event.target.value)}
                  >
                    {stateOptions.map((state) => (
                      <option key={state} value={state}>
                        {state === 'Todos' ? state : formatEventState(state)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Categoría
                  <select
                    value={categoryFilter}
                    onChange={(event) => setCategoryFilter(event.target.value)}
                  >
                    {categoryOptions.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
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
                {filteredAdminEvents.map((event) => {
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
                      <span>{event.category}</span>
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
            </section>

            
          </>
        )}

        {pendingEventAction && (
          <ConfirmEventActionModal
            action={pendingEventAction}
            onCancel={() => setPendingEventAction(null)}
            onConfirm={() => {
              setPendingEventAction(null);
              setSelectedAdminEvent(null);
              setCurrentAdminView('dashboard');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {validationIssue && (
          <ValidationIssueModal
            missingFields={validationIssue.missingFields}
            onClose={() => setValidationIssue(null)}
          />
        )}

        {eventToDelete && (
          <DeleteDraftEventModal
            event={eventToDelete}
            onCancel={cancelDeleteDraftEvent}
            onConfirm={confirmDeleteDraftEvent}
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
          {event.resentToReviewAt && <small>Reenviado: {event.resentToReviewAt}</small>}
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

function AdminPublicEventPreview({ event, onBack }) {
  function preventPreviewSubmit(submitEvent) {
    submitEvent.preventDefault();
  }

  return (
    <section className="admin-public-preview-view" aria-labelledby="admin-public-preview-title">
      <header className="admin-public-preview-notice">
        <span className="section-kicker">Vista previa</span>
        <h1 id="admin-public-preview-title">Vista previa pública del evento</h1>
        <p>Así se visualizará este evento en el portal ciudadano.</p>
      </header>

      <PublicEventDetail
        backLabel="Volver al panel de eventos"
        event={event}
        onBack={onBack}
        onSubmit={preventPreviewSubmit}
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
        title={pendingItems.length > 1 ? 'Ficha incompleta' : pendingItems[0]}
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
          TODO: permitir carga directa de video si el backend lo soporta.
        </small>
      </span>
    </label>
  );
}

function LocationCatalogSelector({ defaultLocationId = '' }) {
  const [selectedLocationId, setSelectedLocationId] = useState(defaultLocationId);
  const selectedLocation = getRegisteredLocationById(selectedLocationId);
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
            {registeredLocations.map((location) => (
              <option key={location.ubicacion_id} value={location.ubicacion_id}>
                {location.nombre_lugar}
              </option>
            ))}
          </select>
          <small>
            TODO: consumir ubicaciones desde el CRUD administrador cuando el backend esté listo.
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
    CERRADO: 'Evento cerrado.',
    EN_REVISION: 'Pendiente de revisión directiva.',
    OBSERVADO_EN_REVISION: 'Ficha corregida y reenviada al directivo.',
    FINALIZADO: 'Evento cerrado.',
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

  if (['EN_REVISION', 'APROBADO'].includes(event.state)) {
    return {
      icon: ClipboardCheckLineIcon,
      label: `Ver estado de revision de ${event.title}`,
      tooltip: 'Ver estado de revisión',
      type: 'review',
    };
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

function MunicipalAreaCombobox({ defaultAreaId = '', defaultAreaName = '', onAreaChange }) {
  const initialArea =
    getMunicipalAreaById(defaultAreaId) ??
    getMunicipalAreaByEvent({ organizer: defaultAreaName }) ??
    null;
  const [selectedArea, setSelectedArea] = useState(initialArea);
  const [searchValue, setSearchValue] = useState(initialArea?.nombre ?? defaultAreaName ?? '');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const comboboxRef = useRef(null);
  const normalizedSearch = normalizeSearchText(searchValue.trim());
  const filteredAreas = eventOrganizerAreas.filter((area) => {
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

function NeighborAccountsPage({ adminUserName }) {
  const [neighbors, setNeighbors] = useState(initialNeighborAccounts);
  const [searchValue, setSearchValue] = useState('');
  const [stateFilterValue, setStateFilterValue] = useState('TODOS');
  const [selectedNeighbor, setSelectedNeighbor] = useState(null);
  const [editingContact, setEditingContact] = useState(false);
  const [contactDraft, setContactDraft] = useState({ celular: '', correo: '' });
  const [actionModal, setActionModal] = useState(null);
  const [actionReason, setActionReason] = useState('');
  const [notice, setNotice] = useState('');
  const modalNeighbor = selectedNeighbor
    ? neighbors.find((neighbor) => neighbor.id === selectedNeighbor.id) ?? selectedNeighbor
    : null;
  const filteredNeighbors = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return neighbors.filter((neighbor) => {
      const matchesState = stateFilterValue === 'TODOS' || neighbor.estado === stateFilterValue;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [neighbor.dni, neighbor.nombreCompleto, neighbor.correo]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesState && matchesSearch;
    });
  }, [neighbors, searchValue, stateFilterValue]);

  function openNeighborDetailModal(neighbor) {
    setSelectedNeighbor(neighbor);
    setEditingContact(false);
    setNotice('');
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
    if(actionModal){
      return;
    }

    setSelectedNeighbor(null);
    setEditingContact(false);
    setNotice('');


  }, [actionModal]);

  useEffect(() => {
    if (!modalNeighbor) {
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
  }, [modalNeighbor, closeNeighborDetailModal]);

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

  function saveContactEdit() {
    if (!modalNeighbor) {
      return;
    }

    if (!contactDraft.correo.trim() || !contactDraft.celular.trim()) {
      setNotice('Completa correo y celular antes de guardar.');
      return;
    }

    setNeighbors((currentNeighbors) =>
      currentNeighbors.map((neighbor) =>
        neighbor.id === modalNeighbor.id
          ? { ...neighbor, celular: contactDraft.celular.trim(), correo: contactDraft.correo.trim() }
          : neighbor,
      ),
    );
    // TODO: registrar acción en bitácora_accion y persistir contacto en Spring Boot.
    setEditingContact(false);
    setNotice('Contacto actualizado correctamente.');
  }

  function confirmAccountAction() {
    if (!modalNeighbor) {
      return;
    }

    if (actionModal === 'block' && !actionReason.trim()) {
      setNotice('Indica el motivo del bloqueo.');
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

        if (actionModal === 'block') {
          return {
            ...neighbor,
            estado: 'BLOQUEADO',
            fechaBloqueo: new Date().toISOString(),
            motivoBloqueo: actionReason.trim(),
            usuarioAdminBloqueo: adminUserName,
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
    setNotice(actionModal === 'block' ? 'Cuenta bloqueada correctamente.' : 'Cuenta reactivada correctamente.');
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
                onChange={(event) => setSearchValue(event.target.value)}
              />
            </label>
            <label>
              Estado
              <select value={stateFilterValue} onChange={(event) => setStateFilterValue(event.target.value)}>
                {neighborStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="admin-table neighbor-table">
            <div className="admin-table-row admin-table-head">
              <span>Vecino</span><span>Estado</span><span>Acción</span>
            </div>
            {filteredNeighbors.map((neighbor) => (
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
                  aria-label={`Ver o editar información de ${neighbor.nombreCompleto}`}
                  className="table-icon-action is-detail neighbor-detail-action"
                  data-tooltip="Ver/editar información"
                  type="button"
                  onClick={() => openNeighborDetailModal(neighbor)}
                >
                  <ViewIcon />
                </button>
              </div>
            ))}
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
        ? { action: 'block', label: 'Bloquear cuenta' }
        : neighbor.estado === 'BLOQUEADO'
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
            <div><dt>Confirmación de correo</dt><dd>{neighbor.fechaConfirmacionCorreo || 'Pendiente'}</dd></div>
          </dl>
          <section className="neighbor-contact-section">
            <div className="neighbor-section-heading">
              <h3>Contacto</h3>
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
              <button className="neighbor-secondary-action" type="button" onClick={onCancelEdit}>
                Cancelar
              </button>
              <button className="neighbor-primary-action" type="button" onClick={onSaveContact}>
                Guardar cambios
              </button>
            </>
          ) : (
            <>
              <button className="neighbor-secondary-action" type="button" onClick={onStartEdit}>
                Editar contacto
              </button>
              {contextualAction && (
                <button
                  className={
                    contextualAction.action === 'block'
                      ? 'neighbor-primary-action is-danger'
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
  const isBlock = action === 'block';
  const isReactivate = action === 'reactivate';
  const title = isBlock
    ? 'Bloquear cuenta vecinal'
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
            {isBlock ? 'Indica el motivo del bloqueo de la cuenta vecinal.' : 'Indica el motivo de la reactivación de la cuenta vecinal.'}
            <textarea rows={4} value={reason} onChange={(event) => onReasonChange(event.target.value)} />
          </label>
        )}
        <div className="modal-actions">
          <button className="back-button" type="button" onClick={onCancel}>Cancelar</button>
          <button className="primary-button" type="button" onClick={onConfirm}>
            {isBlock ? 'Bloquear cuenta' : isReactivate ? 'Reactivar cuenta' : 'Reenviar correo'}
          </button>
        </div>
      </section>
    </div>
  );
}

function SettingsUsersPage() {
  const [searchValue, setSearchValue] = useState('');
  const [roleFilter, setRoleFilter] = useState('Todos');
  const [users, setUsers] = useState(settingsUsers);
  const [userModalMode, setUserModalMode] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userFormData, setUserFormData] = useState(getEmptyUserFormData());
  const [userFormErrors, setUserFormErrors] = useState({});
  const [identityLookupNotice, setIdentityLookupNotice] = useState('');
  const [passwordResetNotice, setPasswordResetNotice] = useState('');
  const selectedUser = users.find((user) => user.id === selectedUserId) ?? null;
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchValue.trim().length === 0 ||
      [user.nombre, user.correo, user.rol]
        .join(' ')
        .toLowerCase()
        .includes(searchValue.trim().toLowerCase());
    const matchesRole = roleFilter === 'Todos' || user.rol === roleFilter;

    return matchesSearch && matchesRole;
  });

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
    setUserModalMode('create');
  };

  const openEditUserModal = (user) => {
    setSelectedUserId(user.id);
    setUserFormData(getUserFormData(user));
    setUserFormErrors({});
    setIdentityLookupNotice('');
    setPasswordResetNotice('');
    setUserModalMode('edit');
  };

  const saveUser = () => {
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

    if (userModalMode === 'edit' && selectedUser) {
      const changedFields = getChangedUserFields(selectedUser, normalizedUser);

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === selectedUser.id ? { ...user, ...normalizedUser } : user,
        ),
      );
      notifyUserAccountChanges(normalizedUser, changedFields);
      registerUserAuditLog('UPDATE_INTERNAL_USER', selectedUser.id, changedFields);
    } else {
      setUsers((currentUsers) => [
        ...currentUsers,
        {
          ...normalizedUser,
          id: Math.max(0, ...currentUsers.map((user) => user.id)) + 1,
        },
      ]);
    }

    closeUserModal();
  };

  const toggleUserState = () => {
    if (!selectedUser) {
      return;
    }

    const nextState = selectedUser.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';

    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.id === selectedUser.id
          ? { ...user, estado: nextState }
          : user,
      ),
    );
    notifyUserAccountChanges({ ...selectedUser, estado: nextState }, ['estado']);
    registerUserAuditLog('TOGGLE_INTERNAL_USER_STATE', selectedUser.id, ['estado']);
    closeUserModal();
  };

  return (
    <>
      <SettingsTablePage
        actionLabel="Nuevo usuario"
        cardKicker="Configuración"
        cardTitle="Usuarios internos"
        description="Administra las cuentas internas del sistema municipal."
        filterLabel="Rol"
        filterOptions={['Todos', 'Administrador', 'Directivo', 'Operativo']}
        filterValue={roleFilter}
        searchPlaceholder="Nombre, correo o rol"
        searchValue={searchValue}
        title="Usuarios"
        onAction={openCreateUserModal}
        onFilterChange={setRoleFilter}
        onSearchChange={setSearchValue}
      >
        <div className="admin-table settings-table settings-users-table">
          <div className="admin-table-row admin-table-head">
            <span>Usuario</span><span>Correo</span><span>Rol</span><span>Estado</span><span>Acción</span>
          </div>
          {filteredUsers.map((user) => (
            <div className="admin-table-row" key={user.id}>
              <span><strong>{user.nombre}</strong><small>Usuario interno</small></span>
              <span>{user.correo}</span>
              <span>{user.rol}</span>
              <SettingsStatus state={user.estado} />
              <span className="settings-row-actions settings-user-actions">
                <button
                  aria-label={`Ver o editar usuario ${user.nombre}`}
                  className="table-icon-action is-detail neighbor-detail-action settings-user-detail-action"
                  data-tooltip="Ver/editar usuario"
            type="button"
            onClick={() => openEditUserModal(user)}
          >
            <ViewIcon />
                </button>
              </span>
            </div>
          ))}
        </div>
      </SettingsTablePage>

      {userModalMode && (
        <UserFormModal
          errors={userFormErrors}
          formData={userFormData}
          identityNotice={identityLookupNotice}
          mode={userModalMode}
          passwordResetNotice={passwordResetNotice}
          user={selectedUser}
          onClose={closeUserModal}
          onFieldChange={(field, value) => {
            setUserFormData((current) => ({ ...current, [field]: value }));
            setUserFormErrors((current) => ({ ...current, [field]: undefined }));
          }}
          onLookupDni={() => {
            const identity = identityLookupMock[userFormData.dni];

            if (identity) {
              setUserFormData((current) => ({
                ...current,
                identityVerified: true,
                nombre: identity.nombreCompleto,
              }));
              setUserFormErrors((current) => ({ ...current, identityVerified: undefined }));
              setIdentityLookupNotice(`Identidad verificada: ${identity.nombreCompleto}`);
            } else {
              setUserFormData((current) => ({ ...current, identityVerified: false, nombre: '' }));
              setIdentityLookupNotice('No se encontraron datos para el DNI ingresado.');
            }
          }}
          onSendResetPassword={() => {
            if (!selectedUser) {
              return;
            }

            requestPasswordResetLink(selectedUser);
            registerUserAuditLog('SEND_PASSWORD_RESET_LINK', selectedUser.id, ['passwordReset']);
            setPasswordResetNotice('Enlace de restablecimiento enviado al correo registrado.');
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
    confirmarPassword: '',
    correo: '',
    dni: '',
    identityVerified: false,
    nombre: '',
    password: '',
    rol: '',
  };
}

function getUserFormData(user) {
  return {
    area: user?.area ?? '',
    areaId: user?.areaId ? String(user.areaId) : '',
    confirmarPassword: '',
    correo: user?.correo ?? '',
    dni: user?.dni ?? '',
    identityVerified: Boolean(user?.nombre),
    nombre: user?.nombre ?? '',
    password: '',
    rol: user?.rol ?? '',
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
    errors.identityVerified = 'Verifique la identidad con un DNI válido antes de guardar.';
  }

  if (!formData.correo.trim()) {
    errors.correo = 'Ingrese el correo electrónico.';
  } else if (!emailPattern.test(formData.correo.trim())) {
    errors.correo = 'Ingrese un correo electrónico válido.';
  }

  if (!formData.rol) {
    errors.rol = 'Seleccione un rol.';
  }

  if (!formData.areaId) {
    errors.areaId = 'Seleccione un área municipal.';
  }

  if (isCreating && !formData.password) {
    errors.password = 'Ingrese una contraseña.';
  }

  if (isCreating && !formData.confirmarPassword) {
    errors.confirmarPassword = 'Confirme la contraseña.';
  }

  if (formData.password && formData.password !== formData.confirmarPassword) {
    errors.confirmarPassword = 'Las contraseñas no coinciden.';
  }

  return errors;
}

function getChangedUserFields(currentUser, nextUser) {
  return ['correo', 'rol', 'areaId', 'area'].filter((field) => currentUser[field] !== nextUser[field]);
}

function notifyUserAccountChanges(user, changedFields) {
  return {
    changedFields,
    recipient: user.correo,
    status: 'queued',
  };
}

function registerUserAuditLog(action, userId, changedFields) {
  return {
    action,
    changedFields,
    status: 'registered',
    userId,
  };
}

function requestPasswordResetLink(user) {
  return {
    recipient: user.correo,
    status: 'sent',
  };
}

function registerEventAuditLog(action, eventId) {
  return {
    action,
    eventId,
    status: 'registered',
  };
}

function UserFormModal({
  errors,
  formData,
  identityNotice,
  mode,
  onClose,
  onFieldChange,
  onLookupDni,
  onSendResetPassword,
  onSave,
  onToggleState,
  passwordResetNotice,
  user,
}) {
  const isEditing = mode === 'edit';
  const identityMessage =
    identityNotice ||
    (formData.identityVerified && formData.nombre
      ? `Identidad verificada: ${formData.nombre}`
      : '');

  return (
    <div className="modal-backdrop neighbor-detail-backdrop user-detail-backdrop" role="presentation" onMouseDown={onClose}>
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
            <button className="neighbor-modal-close" type="button" aria-label="Cerrar usuario" onClick={onClose}>
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
              <select value={formData.rol} onChange={(event) => onFieldChange('rol', event.target.value)}>
                <option value="">Seleccionar rol</option>
                <option value="Administrador">Administrador</option>
                <option value="Directivo">Directivo</option>
                <option value="Operativo">Operativo</option>
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
                <button className="user-reset-action" type="button" onClick={onSendResetPassword}>
                  <span aria-hidden="true">+</span>
                  Enviar enlace de restablecimiento
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
              <>
                <label className="form-field">
                  Password
                  <input
                    placeholder="Ingrese una contraseña"
                    type="password"
                    value={formData.password}
                    onChange={(event) => onFieldChange('password', event.target.value)}
                  />
                  {errors.password && <small className="form-error">{errors.password}</small>}
                </label>

                <label className="form-field">
                  Confirmar password
                  <input
                    type="password"
                    value={formData.confirmarPassword}
                    onChange={(event) => onFieldChange('confirmarPassword', event.target.value)}
                  />
                  {errors.confirmarPassword && <small className="form-error">{errors.confirmarPassword}</small>}
                </label>
              </>
            )}
          </div>
        </div>

        <footer className="neighbor-detail-footer user-detail-footer">
          <span className="user-footer-state-action">
            {isEditing && (
              <button
                className={user?.estado === 'ACTIVO' ? 'neighbor-primary-action is-danger' : 'neighbor-primary-action is-positive'}
                type="button"
                onClick={onToggleState}
              >
                {user?.estado === 'ACTIVO' ? 'Desactivar usuario' : 'Activar usuario'}
              </button>
            )}
          </span>
          <span className="user-footer-main-actions">
            <button className="neighbor-secondary-action" type="button" onClick={onClose}>
              Cancelar
            </button>
            <button className="neighbor-primary-action" type="button" onClick={onSave}>
              {isEditing ? 'Guardar cambios' : 'Guardar usuario'}
            </button>
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

    document.addEventListener('mousedown', closeOnOutsideClick);

    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
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

function SettingsCategoriesPage() {
  const [searchValue, setSearchValue] = useState('');
  const [categories, setCategories] = useState(settingsCategories);
  const [categoryFormValue, setCategoryFormValue] = useState('');
  const [categoryFormError, setCategoryFormError] = useState('');
  const [categoryNotice, setCategoryNotice] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const filteredCategories = categories.filter((category) =>
    category.nombre.toLowerCase().includes(searchValue.trim().toLowerCase()),
  );

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

  const saveCategory = () => {
    const normalizedName = categoryFormValue.trim();

    if (!normalizedName) {
      setCategoryFormError('Ingrese el nombre de la categoría.');
      return;
    }

    const hasDuplicate = categories.some((category) => category.nombre === normalizedName);

    if (hasDuplicate) {
      setCategoryFormError('Ya existe una categoría con ese nombre.');
      return;
    }

    setCategories((current) => [
      ...current,
      {
        eventosAsociados: 0,
        id: Math.max(0, ...current.map((category) => category.id)) + 1,
        nombre: normalizedName,
      },
    ]);
    closeCategoryForm();
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

  const confirmCategoryDelete = () => {
    if (!categoryToDelete) {
      return;
    }

    setCategories((current) => current.filter((category) => category.id !== categoryToDelete.id));
    setCategoryToDelete(null);
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
        onSearchChange={setSearchValue}
      >
        {categoryNotice && <p className="settings-inline-notice">{categoryNotice}</p>}
        <div className="admin-table settings-table settings-categories-table">
          <div className="admin-table-row admin-table-head">
            <span>Categoría</span><span>Eventos asociados</span><span>Acción</span>
          </div>
          {filteredCategories.map((category) => (
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
      </SettingsTablePage>

      {isCategoryFormOpen && (
        <CategoryFormModal
          error={categoryFormError}
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
          onCancel={() => setCategoryToDelete(null)}
          onConfirm={confirmCategoryDelete}
        />
      )}
    </>
  );
}

function CategoryFormModal({ error, onCancel, onSave, onValueChange, value }) {
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
            type="text"
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
          />
          {error && <small className="form-error">{error}</small>}
        </label>
        <div className="modal-actions">
          <button className="back-button" type="button" onClick={onCancel}>
            Cancelar
          </button>
          <button className="primary-button" type="button" onClick={onSave}>
            Guardar categoría
          </button>
        </div>
      </section>
    </div>
  );
}

function CategoryDeleteModal({ category, onCancel, onConfirm }) {
  return (
    <div className="modal-backdrop category-modal-backdrop" role="presentation" onMouseDown={onCancel}>
      <section
        className="confirm-modal category-modal category-delete-modal"
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
          <button className="back-button" type="button" onClick={onCancel}>
            Cancelar
          </button>
          <button className="primary-button danger-action" type="button" onClick={onConfirm}>
            Eliminar categoría
          </button>
        </div>
      </section>
    </div>
  );
}

function SettingsLocationsPage() {
  const [searchValue, setSearchValue] = useState('');
  const [locations, setLocations] = useState(settingsLocations);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationModalMode, setLocationModalMode] = useState(null);
  const [locationFormData, setLocationFormData] = useState(getEmptyLocationFormData());
  const [locationFormErrors, setLocationFormErrors] = useState({});
  const isLocationModalOpen = Boolean(locationModalMode);
  const filteredLocations = locations.filter((location) => {
    return (
      searchValue.trim().length === 0 ||
      [location.nombre, location.direccion, location.referencia]
        .join(' ')
        .toLowerCase()
        .includes(searchValue.trim().toLowerCase())
    );
  });

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

  const saveLocation = () => {
    const errors = validateLocationForm(locationFormData);

    if (Object.keys(errors).length > 0) {
      setLocationFormErrors(errors);
      return;
    }

    const normalizedLocation = normalizeLocationFromForm(locationFormData, selectedLocation);

    if (locationModalMode === 'create') {
      const nextLocation = {
        ...normalizedLocation,
        aforoReferencial: '',
        id: Math.max(0, ...locations.map((location) => location.id)) + 1,
        tipo: 'No especificado',
      };

      setLocations((current) => [...current, nextLocation]);
      setSelectedLocation(nextLocation);
      setLocationModalMode('detail');
      setLocationFormErrors({});
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

  const toggleSelectedLocationState = () => {
    if (!selectedLocation) {
      return;
    }

    const nextState = selectedLocation.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    const updatedLocation = { ...selectedLocation, estado: nextState };

    setLocations((current) =>
      current.map((location) => (location.id === selectedLocation.id ? updatedLocation : location)),
    );
    setSelectedLocation(updatedLocation);
    setLocationFormData(getLocationFormData(updatedLocation));
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
        onSearchChange={setSearchValue}
      >
        <div className="admin-table settings-table settings-locations-table">
          <div className="admin-table-row admin-table-head">
            <span>Ubicación</span><span>Dirección</span><span>Estado</span><span>Acción</span>
          </div>
          {filteredLocations.map((location) => (
            <div className="admin-table-row" key={location.id}>
              <span><strong>{location.nombre}</strong><small>{location.referencia}</small></span>
              <span>{location.direccion}</span>
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
              </span>
            </div>
          ))}
        </div>
      </SettingsTablePage>

      {isLocationModalOpen && (
        <LocationDetailModal
          errors={locationFormErrors}
          formData={locationFormData}
          location={selectedLocation}
          mode={locationModalMode}
          onClose={closeLocationModal}
          onEdit={openLocationEdit}
          onFormChange={setLocationFormData}
          onSave={saveLocation}
          onToggleState={toggleSelectedLocationState}
        />
      )}
    </>
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
  }

  if (!formData.direccion.trim()) {
    errors.direccion = 'Ingrese la dirección de la ubicación.';
  }

  if (formData.latitud.trim() && Number.isNaN(Number(formData.latitud))) {
    errors.latitud = 'La latitud debe ser numérica.';
  }

  if (formData.longitud.trim() && Number.isNaN(Number(formData.longitud))) {
    errors.longitud = 'La longitud debe ser numérica.';
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

function LocationDetailModal({
  errors,
  formData,
  location,
  mode,
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
      onMouseDown={onClose}
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
              {mapsUrl && (
                <a href={mapsUrl} target="_blank" rel="noreferrer">
                  Abrir en Google Maps
                </a>
              )}
            </div>
            {mapEmbedUrl ? (
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
              <button className="neighbor-secondary-action" type="button" onClick={onClose}>
                Cancelar
              </button>
              <button className="neighbor-primary-action" type="button" onClick={onSave}>
                Guardar ubicación
              </button>
            </>
          ) : (
            <>
              <button className="neighbor-secondary-action" type="button" onClick={onEdit}>
                Editar ubicación
              </button>
              <button
                className={
                  visibleLocation?.estado === 'ACTIVO'
                    ? 'neighbor-primary-action is-danger'
                    : 'neighbor-primary-action is-positive'
                }
                type="button"
                onClick={onToggleState}
              >
                {visibleLocation?.estado === 'ACTIVO' ? 'Desactivar ubicación' : 'Activar ubicación'}
              </button>
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
          value={formData.direccion}
          onChange={(event) => onFieldChange('direccion', event.target.value)}
        />
        {errors.direccion && <small className="form-error">{errors.direccion}</small>}
      </label>
      <label className="form-field span-2">
        Referencia
        <input
          value={formData.referencia}
          onChange={(event) => onFieldChange('referencia', event.target.value)}
        />
      </label>
      <label className="form-field">
        Latitud
        <input
          inputMode="decimal"
          value={formData.latitud}
          onChange={(event) => onFieldChange('latitud', event.target.value)}
        />
        {errors.latitud && <small className="form-error">{errors.latitud}</small>}
      </label>
      <label className="form-field">
        Longitud
        <input
          inputMode="decimal"
          value={formData.longitud}
          onChange={(event) => onFieldChange('longitud', event.target.value)}
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
            <span className="section-kicker">{cardKicker}</span>
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
                {filterOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
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
              defaultValue={capacityValue}
              min="1"
              name="capacity"
              placeholder="120"
              type="number"
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

function NewEventView({ onBack, onRequestAction, onValidationIssue }) {
  const formRef = useRef(null);
  const [capacityMode, setCapacityMode] = useState('defined');
  const [audienceType, setAudienceType] = useState('GENERAL');
  const [goalEnabled, setGoalEnabled] = useState(false);
  const [goalType, setGoalType] = useState('CANTIDAD_ASISTENTES');
  const [surveyEnabled, setSurveyEnabled] = useState(false);
  const [surveyCommentsEnabled, setSurveyCommentsEnabled] = useState(false);
  const [checklistEvent, setChecklistEvent] = useState(() => ({
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
    setChecklistEvent(
      getChecklistEventFromForm(form, {
        resources: {},
        state: 'BORRADOR',
      }),
    );
    setMissingReviewFields(getMissingReviewFields(form));
  }

  function requestReview() {
    const missingFields = getMissingReviewFields(formRef.current);

    if (missingFields.length > 0) {
      onValidationIssue({ missingFields });
      return;
    }

    onRequestAction('review');
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
                <select defaultValue="" name="category">
                  <option disabled value="">Seleccionar categoría</option>
                  {categoryOptions
                    .filter((category) => category !== 'Todas')
                    .map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                </select>
              </label>
              <label className="form-field">
                Área responsable
                <MunicipalAreaCombobox onAreaChange={syncChecklistFromForm} />
              </label>
              <label className="form-field span-2">
                Descripción breve
                <textarea
                  maxLength={255}
                  name="descripcion_breve"
                  placeholder="Resumen corto para la agenda y cabecera del evento."
                  rows={3}
                />
                <small>
                  Resumen corto que se mostrará en la agenda y en la cabecera del evento. Máximo 255 caracteres.
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
              <h2>Fechas e inscripción</h2>
            </div>
            <div className="form-grid">
              <label className="form-field">
                Inicio del evento
                <input name="eventStart" type="datetime-local" />
              </label>
              <label className="form-field">
                Fin del evento
                <input name="eventEnd" type="datetime-local" />
              </label>
              <label className="form-field">
                Inicio de inscripción
                <input name="registrationStart" type="datetime-local" />
              </label>
              <label className="form-field">
                Fin de inscripción
                <input name="registrationEnd" type="datetime-local" />
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
            </div>
          </article>

          <EvaluationTrackingSection
            capacityMode={capacityMode}
            goalEnabled={goalEnabled}
            goalType={goalType}
            surveyCommentsEnabled={surveyCommentsEnabled}
            surveyEnabled={surveyEnabled}
          />

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
            <LocationCatalogSelector />
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
                accept="image/*"
                label="Afiche"
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
                  {item.positiveLabel}
                </p>
              ))}
            </div>
          </section>

          <div className="event-form-actions">
            <button
              className="admin-secondary-action event-draft-action"
              type="button"
              onClick={() => onRequestAction('draft')}
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

function EditEventView({ event, onBack, onRequestAction, onRequestDelete, onValidationIssue }) {
  const formRef = useRef(null);
  const initialCapacityMode = event.aforoMaximo === null ? 'none' : 'defined';
  const initialAudienceType =
    event.publico_tipo ?? (event.edad_minima || event.edad_maxima ? 'OBJETIVO' : 'GENERAL');
  const initialMunicipalArea = getMunicipalAreaByEvent(event);
  const eventWithMunicipalArea = {
    ...event,
    area_municipal_id: event.area_municipal_id ?? initialMunicipalArea?.area_municipal_id ?? '',
    organizer: initialMunicipalArea?.nombre ?? event.organizer,
  };
  const [capacityMode, setCapacityMode] = useState(initialCapacityMode);
  const [audienceType, setAudienceType] = useState(initialAudienceType);
  const [goalEnabled, setGoalEnabled] = useState(Boolean(event.metaTipo));
  const [goalType, setGoalType] = useState(event.metaTipo ?? 'CANTIDAD_ASISTENTES');
  const [surveyEnabled, setSurveyEnabled] = useState(Boolean(event.encuestaSatisfaccionHabilitada));
  const [surveyCommentsEnabled, setSurveyCommentsEnabled] = useState(Boolean(event.encuestaComentarioHabilitado));
  const [checklistEvent, setChecklistEvent] = useState(() => eventWithMunicipalArea);
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
    setChecklistEvent(getChecklistEventFromForm(formRef.current, eventWithMunicipalArea));
  }

  function requestReview() {
    const missingFields = getMissingReviewFields(formRef.current, event);

    if (missingFields.length > 0) {
      onValidationIssue({ missingFields });
      return;
    }

    onRequestAction('review-changes');
  }

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
                <select defaultValue={event.category} name="category">
                  {categoryOptions
                    .filter((category) => category !== 'Todas')
                    .map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                </select>
              </label>
              <label className="form-field">
                Área responsable
                <MunicipalAreaCombobox
                  defaultAreaId={eventWithMunicipalArea.area_municipal_id}
                  defaultAreaName={eventWithMunicipalArea.organizer}
                  onAreaChange={syncChecklistFromForm}
                />
              </label>
              <label className="form-field span-2">
                Descripción breve
                <textarea
                  defaultValue={event.descripcion_breve ?? event.summary ?? ''}
                  maxLength={255}
                  name="descripcion_breve"
                  rows={3}
                />
                <small>
                  Resumen corto que se mostrará en la agenda y en la cabecera del evento. Máximo 255 caracteres.
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
              <h2>Fechas e inscripción</h2>
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
                  name="eventEnd"
                  type="datetime-local"
                />
              </label>
              <label className="form-field">
                Inicio de inscripción
                <input
                  defaultValue={event.registrationStart}
                  name="registrationStart"
                  type="datetime-local"
                />
              </label>
              <label className="form-field">
                Fin de inscripción
                <input
                  defaultValue={event.registrationEnd}
                  name="registrationEnd"
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
            </div>
          </article>

          <EvaluationTrackingSection
            capacityMode={capacityMode}
            capacityValue={event.aforoMaximo ?? event.spots ?? ''}
            goalEnabled={goalEnabled}
            goalType={goalType}
            goalValue={event.metaValor ?? ''}
            surveyCommentsEnabled={surveyCommentsEnabled}
            surveyEnabled={surveyEnabled}
          />

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
            <LocationCatalogSelector defaultLocationId={event.ubicacion_id} />
          </article>

          <article className="event-form-section" id="recursos">
            <div className="form-section-heading">
              <span className="section-kicker">Recursos</span>
              <h2>Material del evento</h2>
            </div>
            <div className="resource-grid">
              <ResourceUploadCard
                accept="image/*"
                label="Actualizar portada"
                name="coverImage"
                resourceType="IMAGEN_PORTADA"
                showPreview
              />
              <ResourceUploadCard
                accept="image/*"
                label="Actualizar afiche"
                name="poster"
                resourceType="AFICHE"
                showPreview
              />
              <VideoResourceCard defaultValue={event.videoUrl ?? ''} />
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
              <span className="section-kicker">Observación del directivo</span>
              <blockquote>{event.directorObservation}</blockquote>
              {event.directorName && <small>Registrada por {event.directorName}</small>}
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
              onClick={() => onRequestAction('save-changes')}
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
    </section>
  );
}

function ValidationIssueModal({ missingFields, onClose }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section
        aria-labelledby="validation-issue-title"
        aria-modal="true"
        className="confirm-modal"
        role="dialog"
      >
        <span className="section-kicker">Ficha incompleta</span>
        <h2 id="validation-issue-title">Completa la información requerida</h2>
        <p>
          Para enviar este evento a revisión directiva, primero registra los
          siguientes campos:
        </p>
        <ul className="validation-missing-list">
          {missingFields.map((field) => (
            <li key={field}>{field}</li>
          ))}
        </ul>
        <div className="modal-actions single-action">
          <button className="primary-button" type="button" onClick={onClose}>
            Revisar ficha
          </button>
        </div>
      </section>
    </div>
  );
}

function DeleteDraftEventModal({ event, onCancel, onConfirm }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onCancel}>
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
          <button className="back-button" type="button" onClick={onCancel}>
            Cancelar
          </button>
          <button className="primary-button danger-action" type="button" onClick={onConfirm}>
            Eliminar evento
          </button>
        </div>
      </section>
    </div>
  );
}

function ConfirmEventActionModal({ action, onCancel, onConfirm }) {
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
          <button className="back-button" type="button" onClick={onCancel}>
            Revisar datos
          </button>
          <button className="primary-button" type="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
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
    return 'La ficha corregida pasará a EN_REVISION para que el usuario directivo pueda aprobarla u observarla.';
  }

  if (actionType === 'review') {
    return 'El evento pasará a EN_REVISION para que el usuario directivo pueda aprobarlo u observarlo antes de publicarlo.';
  }

  return isCreate
    ? 'El evento permanecerá como BORRADOR y podrás completarlo o editarlo antes de enviarlo al directivo.'
    : 'La ficha conservará sus cambios como BORRADOR dentro del flujo administrativo.';
}

export default AdminDashboard;
