import { useEffect, useMemo, useRef, useState } from 'react';
import municipalLogo from '../../assets/images/municipalidad-logo.png';
import calendarCheck from '../../assets/icons/calendar-check.png';
import clipboardCheck from '../../assets/icons/clipboard-check.png';
import fileEdit from '../../assets/icons/file-edit.png';
import triangleAlert from '../../assets/icons/triangle-alert.png';
import { adminEvents, formatEventState } from './dashboardData';
import NotificationMenu from './NotificationMenu';
import './AdminDashboard.css';

const managementStats = [
  {
    icon: calendarCheck,
    label: 'Publicados',
    tone: 'is-published',
    trend: 'visibles en el portal',
    value: adminEvents.filter((event) => event.state === 'PUBLICADO').length,
  },
  {
    icon: fileEdit,
    label: 'Borradores',
    tone: 'is-draft',
    trend: 'requieren completar datos',
    value: adminEvents.filter((event) => event.state === 'BORRADOR').length,
  },
  {
    icon: clipboardCheck,
    label: 'Para revisión',
    tone: 'is-review',
    trend: 'pendientes del directivo',
    value: adminEvents.filter((event) =>
      ['EN_REVISION', 'OBSERVADO_EN_REVISION'].includes(event.state),
    ).length,
  },
  {
    icon: triangleAlert,
    label: 'Observados',
    tone: 'is-observed',
    trend: 'requieren correcciones',
    value: adminEvents.filter((event) => event.state === 'OBSERVADO').length,
  },
];

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
        hasValue(event.registrationStart) &&
        hasValue(event.registrationEnd) &&
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
        hasValue(event.registrationStart) &&
        hasValue(event.registrationEnd) &&
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

  if (shortDescription.length > 255) {
    missingFields.push('Descripción breve de máximo 255 caracteres');
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
    window.location.pathname === '/admin/vecinos' ? 'neighbors' : 'dashboard',
  );
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [pendingEventAction, setPendingEventAction] = useState(null);
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
  const adminUser = user ?? fallbackAdminUser;
  const adminUserName = getUserDisplayName(adminUser);

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
    setActiveFormSection(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  const filteredAdminEvents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return adminEvents.filter((event) => {
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
  }, [categoryFilter, searchTerm, stateFilter]);

  return (
    <section
      className={`admin-shell${isSidebarCollapsed ? ' is-sidebar-collapsed' : ''}`}
      aria-labelledby="admin-title"
    >
      <aside className="admin-sidebar">
        <button
          className="sidebar-collapse-button"
          type="button"
          aria-label={isSidebarCollapsed ? 'Mostrar sidebar' : 'Ocultar sidebar'}
          title={isSidebarCollapsed ? 'Mostrar sidebar' : 'Ocultar sidebar'}
          onClick={() => setIsSidebarCollapsed((isCollapsed) => !isCollapsed)}
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
              onClick={() => setCurrentAdminView('dashboard')}
            >
              Resumen
            </button>
            <button
              className={
                currentAdminView === 'neighbors' ? 'admin-nav-link active' : 'admin-nav-link'
              }
              type="button"
              onClick={() => {
                window.history.pushState(null, '', '/admin/vecinos');
                setCurrentAdminView('neighbors');
              }}
            >
              Cuentas vecinales
            </button>
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
            onValidationIssue={setValidationIssue}
          />
        ) : currentAdminView === 'neighbors' ? (
          <NeighborAccountsPage adminUserName={adminUserName} />
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
                  <img alt="" className="admin-stat-icon" src={stat.icon} />
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

              <div className="admin-table">
                <div className="admin-table-row admin-table-head">
                  <span>Evento</span>
                  <span>Estado</span>
                  <span>Categoría</span>
                  <span>Cupos</span>
                  <span>Completitud</span>
                  <span>Acción</span>
                </div>
                {filteredAdminEvents.map((event) => (
                  <div className="admin-table-row" key={event.id}>
                    <span>
                      <strong>{event.title}</strong>
                      <small>{event.date} - {event.venue}</small>
                    </span>
                    <span>
                      <StateBadge state={event.state} />
                    </span>
                    <span>{event.category}</span>
                    <span>{event.spots}</span>
                    <span className="completeness-cell">
                      <CompletenessMeter compact value={event.completeness} />
                      <PendingItemsControl
                        activePendingPopover={activePendingPopover}
                        event={event}
                        onToggle={setActivePendingPopover}
                        popoverRef={pendingPopoverRef}
                      />
                    </span>
                    <span>
                      <button
                        aria-label={
                          event.state === 'FINALIZADO'
                            ? `Ver detalle de ${event.title}`
                            : `Editar ${event.title}`
                        }
                        className={
                          event.state === 'FINALIZADO'
                            ? 'table-icon-action is-detail'
                            : 'table-icon-action'
                        }
                        title={event.state === 'FINALIZADO' ? 'Ver detalle' : 'Editar evento'}
                        type="button"
                        onClick={() => {
                          if (event.state !== 'FINALIZADO') {
                            setSelectedAdminEvent(event);
                            setCurrentAdminView('edit-event');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }}
                      >
                        {event.state === 'FINALIZADO' ? <ViewIcon /> : <EditIcon />}
                      </button>
                    </span>
                  </div>
                ))}
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
      </main>
    </section>
  );
}

function PendingItemsControl({
  activePendingPopover,
  event,
  onToggle,
  popoverRef,
}) {
  const pendingItems = event.pendingItems ?? [];

  if (pendingItems.length === 0) {
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
  const [selectedNeighborId, setSelectedNeighborId] = useState(initialNeighborAccounts[0]?.id ?? null);
  const [editingContact, setEditingContact] = useState(false);
  const [contactDraft, setContactDraft] = useState({ celular: '', correo: '' });
  const [actionModal, setActionModal] = useState(null);
  const [actionReason, setActionReason] = useState('');
  const [notice, setNotice] = useState('');
  const selectedNeighbor = neighbors.find((neighbor) => neighbor.id === selectedNeighborId) ?? neighbors[0];
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
  const summary = {
    active: neighbors.filter((neighbor) => neighbor.estado === 'ACTIVO').length,
    blocked: neighbors.filter((neighbor) => neighbor.estado === 'BLOQUEADO').length,
    pending: neighbors.filter((neighbor) => neighbor.estado === 'PENDIENTE_CONFIRMACION').length,
    total: neighbors.length,
  };

  function startContactEdit() {
    setContactDraft({
      celular: selectedNeighbor.celular,
      correo: selectedNeighbor.correo,
    });
    setEditingContact(true);
    setNotice('');
  }

  function saveContactEdit() {
    if (!contactDraft.correo.trim() || !contactDraft.celular.trim()) {
      setNotice('Completa correo y celular antes de guardar.');
      return;
    }

    setNeighbors((currentNeighbors) =>
      currentNeighbors.map((neighbor) =>
        neighbor.id === selectedNeighbor.id
          ? { ...neighbor, celular: contactDraft.celular.trim(), correo: contactDraft.correo.trim() }
          : neighbor,
      ),
    );
    // TODO: registrar acción en bitácora_accion y persistir contacto en Spring Boot.
    setEditingContact(false);
    setNotice('Contacto actualizado correctamente.');
  }

  function confirmAccountAction() {
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
        if (neighbor.id !== selectedNeighbor.id) {
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

      <section className="admin-stats neighbor-stats" aria-label="Resumen de cuentas vecinales">
        <NeighborStatCard label="Activas" value={summary.active} />
        <NeighborStatCard label="Pendientes" value={summary.pending} />
        <NeighborStatCard label="Bloqueadas" value={summary.blocked} />
        <NeighborStatCard label="Total de vecinos" value={summary.total} />
      </section>

      <section className="neighbor-admin-layout">
        <article className="admin-table-panel admin-table-featured">
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
              <span>Vecino</span><span>DNI</span><span>Correo</span><span>Celular</span><span>Estado</span><span>Inscripciones</span><span>Acción</span>
            </div>
            {filteredNeighbors.map((neighbor) => (
              <div className="admin-table-row" key={neighbor.id}>
                <span><strong>{neighbor.nombreCompleto}</strong><small>{neighbor.fechaRegistro}</small></span>
                <span>{neighbor.dni}</span>
                <span>{neighbor.correo}</span>
                <span>{neighbor.celular}</span>
                <span className={`neighbor-state-badge ${getNeighborStateTone(neighbor.estado)}`}>{getNeighborStateLabel(neighbor.estado)}</span>
                <span>{neighbor.inscripciones.length}</span>
                <button
                  className="table-icon-action is-detail neighbor-detail-action"
                  type="button"
                  onClick={() => {
                    setSelectedNeighborId(neighbor.id);
                    setEditingContact(false);
                    setNotice('');
                  }}
                >
                  Ver detalle
                </button>
              </div>
            ))}
          </div>
        </article>

        {selectedNeighbor && (
          <NeighborDetailPanel
            actionNotice={notice}
            contactDraft={contactDraft}
            editingContact={editingContact}
            neighbor={selectedNeighbor}
            onCancelEdit={() => setEditingContact(false)}
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

function NeighborStatCard({ label, value }) {
  return (
    <article className="admin-panel admin-stat-card management-stat-card neighbor-stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>cuentas</small>
    </article>
  );
}

function NeighborDetailPanel({
  actionNotice,
  contactDraft,
  editingContact,
  neighbor,
  onCancelEdit,
  onContactChange,
  onOpenAction,
  onSaveContact,
  onStartEdit,
}) {
  return (
    <aside className="admin-panel neighbor-detail-panel">
      <div className="neighbor-detail-heading">
        <span className="section-kicker">Detalle vecinal</span>
        <h2>{neighbor.nombreCompleto}</h2>
        <span className={`neighbor-state-badge ${getNeighborStateTone(neighbor.estado)}`}>
          {getNeighborStateLabel(neighbor.estado)}
        </span>
      </div>
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
          {!editingContact && <button type="button" onClick={onStartEdit}>Editar contacto</button>}
        </div>
        {editingContact ? (
          <div className="neighbor-contact-form">
            <label>Correo electrónico<input value={contactDraft.correo} onChange={(event) => onContactChange((current) => ({ ...current, correo: event.target.value }))} /></label>
            <label>Celular<input value={contactDraft.celular} onChange={(event) => onContactChange((current) => ({ ...current, celular: event.target.value }))} /></label>
            <div className="neighbor-inline-actions">
              <button type="button" onClick={onCancelEdit}>Cancelar</button>
              <button type="button" onClick={onSaveContact}>Guardar cambios</button>
            </div>
          </div>
        ) : (
          <dl className="neighbor-detail-list compact">
            <div><dt>Correo</dt><dd>{neighbor.correo}</dd></div>
            <div><dt>Celular</dt><dd>{neighbor.celular}</dd></div>
          </dl>
        )}
      </section>
      <section className="neighbor-admin-actions">
        {neighbor.estado === 'PENDIENTE_CONFIRMACION' && <button type="button" onClick={() => onOpenAction('resend')}>Reenviar correo de confirmación</button>}
        {neighbor.estado === 'ACTIVO' && <button type="button" onClick={() => onOpenAction('block')}>Bloquear cuenta</button>}
        {neighbor.estado === 'BLOQUEADO' && <button type="button" onClick={() => onOpenAction('reactivate')}>Reactivar cuenta</button>}
      </section>
      <section className="neighbor-registrations">
        <h3>Inscripciones</h3>
        {neighbor.inscripciones.length > 0 ? (
          <div className="neighbor-registration-list">
            {neighbor.inscripciones.map((registration) => (
              <div key={registration.codigoInscripcion}>
                <strong>{registration.evento}</strong>
                <span>{registration.fechaEvento}</span>
                <small>{registration.estadoInscripcion} · {registration.codigoInscripcion} · {registration.asistencia}</small>
              </div>
            ))}
          </div>
        ) : (
          <p>Este vecino aún no registra inscripciones.</p>
        )}
      </section>
    </aside>
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
    <div className="modal-backdrop" role="presentation">
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

function EditEventView({ event, onBack, onRequestAction, onValidationIssue }) {
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
