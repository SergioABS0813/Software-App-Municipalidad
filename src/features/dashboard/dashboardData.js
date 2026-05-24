import { events } from '../public-portal/data/events';

const eventOperationalData = [
  {
    referenceCost: 4200,
    locationReference: 'Ingreso por la puerta principal de la plaza.',
    registrationEnd: '2026-06-07T18:00',
    registrationStart: '2026-05-20T09:00',
    resources: {
      AFICHE: true,
      DOCUMENTO: true,
      IMAGEN_PORTADA: true,
    },
  },
  {
    referenceCost: 1800,
    locationReference: 'Aula 2, primer piso.',
    registrationEnd: '2026-06-10T12:00',
    registrationStart: '2026-05-22T09:00',
    resources: {
      AFICHE: false,
      DOCUMENTO: true,
      IMAGEN_PORTADA: true,
    },
  },
  {
    referenceCost: 6800,
    locationReference: 'Zona central del parque, modulo municipal.',
    registrationEnd: '2026-06-14T16:00',
    registrationStart: '2026-05-24T09:00',
    resources: {
      AFICHE: true,
      DOCUMENTO: true,
      IMAGEN_PORTADA: true,
    },
  },
  {
    referenceCost: 3600,
    locationReference: '',
    registrationEnd: '',
    registrationStart: '',
    resources: {
      AFICHE: false,
      DOCUMENTO: false,
      IMAGEN_PORTADA: true,
    },
  },
  {
    referenceCost: 2500,
    locationReference: '',
    registrationEnd: '2026-06-18T18:00',
    registrationStart: '2026-05-28T09:00',
    resources: {
      AFICHE: true,
      DOCUMENTO: false,
      IMAGEN_PORTADA: true,
    },
  },
];

const eventStateLabels = {
  BORRADOR: 'Borrador',
  CANCELADO: 'Cancelado',
  CERRADO: 'Cerrado',
  EN_REVISION: 'En revision',
  FINALIZADO: 'Finalizado',
  OBSERVADO: 'Observado',
  PUBLICADO: 'Publicado',
};

function hasData(value) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return value !== undefined && value !== null && String(value).trim().length > 0;
}

function calculateEventCompleteness(event) {
  const checklist = [
    hasData(event.title),
    hasData(event.category),
    hasData(event.description),
    hasData(event.organizer),
    hasData(event.audience),
    hasData(event.date),
    hasData(event.time),
    hasData(event.duration),
    Number(event.spots) > 0,
    hasData(event.registrationStart),
    hasData(event.registrationEnd),
    hasData(event.venue),
    hasData(event.district),
    hasData(event.address),
    hasData(event.locationReference),
    hasData(event.requirements),
    hasData(event.agenda),
    hasData(event.accessibility),
    Boolean(event.resources?.IMAGEN_PORTADA),
    Boolean(event.resources?.AFICHE || event.resources?.DOCUMENTO),
  ];
  const completedItems = checklist.filter(Boolean).length;

  return Math.round((completedItems / checklist.length) * 100);
}

export const adminEvents = events.map((event, index) => {
  const state = ['FINALIZADO', 'OBSERVADO', 'FINALIZADO', 'BORRADOR', 'EN_REVISION'][index];
  const lastUpdate = ['Hoy, 9:30 a.m.', 'Ayer, 4:10 p.m.', 'Lun, 11:20 a.m.', 'Pendiente', 'Hoy, 8:45 a.m.'][index];
  const operationalData = eventOperationalData[index];
  const adminEvent = {
    ...event,
    ...operationalData,
    lastUpdate,
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
