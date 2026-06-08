import { events } from '../public-portal/data/events';

function buildTodayDateTime(hours, minutes = 0) {
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toISOString();
}

const eventOperationalData = [
  {
    controlAsistenciaHabilitado: true,
    operativeEndAt: buildTodayDateTime(23, 0),
    operativosAsignados: ['operativo-2'],
    operativeStartAt: buildTodayDateTime(8, 0),
    pendingItems: [],
    referenceCost: 4200,
    ubicacion_id: 2,
    publico_tipo: 'GENERAL',
    edad_minima: null,
    edad_maxima: null,
    lastUpdatedAt: '2026-05-18T10:45:00',
    locationReference: 'Ingreso por la puerta principal de la plaza.',
    registrationEnd: '2026-06-07T18:00',
    registrationStart: '2026-05-20T09:00',
    resources: {
      AFICHE: true,
      IMAGEN_PORTADA: true,
      VIDEO: true,
    },
  },
  {
    controlAsistenciaHabilitado: true,
    operativeEndAt: buildTodayDateTime(18, 30),
    operativosAsignados: ['operativo-1'],
    operativeStartAt: buildTodayDateTime(8, 30),
    pendingItems: [
      '1 observación del directivo "Mariana Fuentes".',
    ],
    directorName: 'Mariana Fuentes',
    directorObservation:
      'Precisar el lugar exacto del evento y corregir la descripción para indicar el público objetivo.',
    previousObservation: {
      author: 'Sergio Villanueva',
      comment: 'Precisar el lugar exacto del evento y corregir la referencia.',
      dateTime: '2026-06-04T11:45:00',
      role: 'Directivo',
    },
    referenceCost: 1800,
    ubicacion_id: 1,
    publico_tipo: 'OBJETIVO',
    edad_minima: 13,
    edad_maxima: 25,
    lastUpdatedAt: '2026-06-05T10:40:00',
    locationReference: 'Aula 2, primer piso.',
    registrationEnd: '2026-06-10T12:00',
    registrationStart: '2026-05-22T09:00',
    resources: {
      AFICHE: false,
      IMAGEN_PORTADA: true,
      VIDEO: false,
    },
  },
  {
    controlAsistenciaHabilitado: true,
    operativeEndAt: buildTodayDateTime(22, 30),
    operativosAsignados: ['operativo-1'],
    operativeStartAt: buildTodayDateTime(18, 0),
    pendingItems: [],
    referenceCost: 6800,
    ubicacion_id: 3,
    publico_tipo: 'GENERAL',
    edad_minima: null,
    edad_maxima: null,
    lastUpdatedAt: '2026-05-14T11:45:00',
    locationReference: 'Zona central del parque, modulo municipal.',
    registrationEnd: '2026-06-14T16:00',
    registrationStart: '2026-05-24T09:00',
    resources: {
      AFICHE: true,
      IMAGEN_PORTADA: true,
      VIDEO: true,
    },
  },
  {
    controlAsistenciaHabilitado: false,
    operativosAsignados: [],
    pendingItems: [
      'Completar punto de partida.',
      'Agregar imagen referencial.',
      'Definir fechas de inscripción.',
    ],
    referenceCost: 3600,
    ubicacion_id: '',
    publico_tipo: 'OBJETIVO',
    edad_minima: 15,
    edad_maxima: 60,
    lastUpdatedAt: '2026-06-07T16:15:00',
    locationReference: '',
    registrationEnd: '',
    registrationStart: '',
    resources: {
      AFICHE: false,
      IMAGEN_PORTADA: true,
      VIDEO: false,
    },
  },
  {
    controlAsistenciaHabilitado: true,
    operativeEndAt: buildTodayDateTime(23, 30),
    operativosAsignados: ['operativo-1'],
    operativeStartAt: buildTodayDateTime(6, 0),
    pendingItems: [],
    referenceCost: 2500,
    ubicacion_id: 4,
    publico_tipo: 'OBJETIVO',
    edad_minima: 18,
    edad_maxima: 120,
    lastUpdatedAt: '2026-06-06T08:45:00',
    locationReference: '',
    registrationEnd: '2026-06-18T18:00',
    registrationStart: '2026-05-28T09:00',
    resources: {
      AFICHE: true,
      IMAGEN_PORTADA: true,
      VIDEO: false,
    },
  },
];

const eventStateLabels = {
  BORRADOR: 'Borrador',
  CANCELADO: 'Cancelado',
  CERRADO: 'Cerrado',
  EN_CURSO: 'En curso',
  EN_REVISION: 'Para revisión',
  FINALIZADO: 'Finalizado',
  OBSERVADO: 'Observado',
  OBSERVADO_EN_REVISION: 'Reenviado',
  APROBADO: 'Aprobado',
  PUBLICADO: 'Publicado',
};

function hasData(value) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return value !== undefined && value !== null && String(value).trim().length > 0;
}

function hasCapacity(event) {
  if (event.aforoMaximo === null) {
    return true;
  }

  return Number(event.aforoMaximo ?? event.spots) > 0;
}

function hasAudienceConfig(event) {
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

function calculateEventCompleteness(event) {
  const checklist = [
    hasData(event.title),
    hasData(event.category),
    hasData(event.descripcion_breve),
    hasData(event.description),
    hasData(event.organizer),
    hasData(event.audience),
    hasData(event.date),
    hasData(event.time),
    hasData(event.duration),
    hasCapacity(event),
    hasData(event.publico_tipo),
    hasAudienceConfig(event),
    hasData(event.registrationStart),
    hasData(event.registrationEnd),
    hasData(event.ubicacion_id),
    hasData(event.requirements),
    hasData(event.agenda),
    hasData(event.accessibility),
    Boolean(event.resources?.IMAGEN_PORTADA),
    Boolean(event.resources?.AFICHE),
  ];
  const completedItems = checklist.filter(Boolean).length;

  return Math.round((completedItems / checklist.length) * 100);
}

export const adminEvents = events.map((event, index) => {
  const state = ['FINALIZADO', 'OBSERVADO_EN_REVISION', 'FINALIZADO', 'BORRADOR', 'PUBLICADO'][index];
  const lastUpdate = ['Hoy, 9:30 a.m.', 'Ayer, 4:10 p.m.', 'Lun, 11:20 a.m.', 'Pendiente', 'Hoy, 8:45 a.m.'][index];
  const operationalData = eventOperationalData[index];
  const adminEvent = {
    ...event,
    ...operationalData,
    lastUpdate,
    resentToReviewAt:
      state === 'OBSERVADO_EN_REVISION'
        ? operationalData.lastUpdatedAt
        : undefined,
    sentToReviewAt:
      state === 'EN_REVISION'
        ? operationalData.lastUpdatedAt
        : state === 'OBSERVADO_EN_REVISION'
          ? '2026-06-03T15:30:00'
          : undefined,
    state,
  };

  return {
    ...adminEvent,
    completeness: calculateEventCompleteness(adminEvent),
  };
});

export function formatEventState(state) {
  return eventStateLabels[state] ?? state;
}
