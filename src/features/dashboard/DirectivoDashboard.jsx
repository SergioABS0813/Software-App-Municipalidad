import { useEffect, useRef, useState } from 'react';
import municipalLogo from '../../assets/images/municipalidad-logo.png';
import eventReviewPlaceholder from '../../assets/images/event-review-placeholder.png';
import { adminEvents, formatEventState } from './dashboardData';
import NotificationMenu from './NotificationMenu';
import './AdminDashboard.css';
import './DirectivoDashboard.css';

const reviewEvents = adminEvents.filter((event) =>
  ['EN_REVISION', 'OBSERVADO_EN_REVISION', 'OBSERVADO'].includes(event.state),
);

function getAforoMaximo(event) {
  if (event.aforoMaximo === null) {
    return null;
  }

  return event.aforoMaximo ?? event.spots ?? null;
}

function hasAforoMaximo(event) {
  return Number(getAforoMaximo(event)) > 0;
}

const eventReports = adminEvents
  .filter((event) => event.state === 'FINALIZADO')
  .map((event, index) => {
    const aforoMaximo = getAforoMaximo(event);
    const registered = [118, 192][index] ?? Math.round(event.spots * 0.82);
    const qrValidated = [86, 146][index] ?? Math.round(registered * 0.72);
    const manualValidated = [12, 18][index] ?? Math.round(registered * 0.12);
    const cancelled = [2, 4][index] ?? 1;
    const cancelledRegistrations = [4, 7][index] ?? 2;
    const totalAttendance = qrValidated + manualValidated;

    return {
      ...event,
      approvedAt: ['2026-05-08T15:30:00', '2026-05-14T11:45:00'][index] ?? '2026-05-20T09:00:00',
      aforoMaximo,
      cancelled,
      cancelledRegistrations,
      completedAt: ['08/06/2026', '14/06/2026'][index] ?? event.date,
      digitalValidationRate: totalAttendance > 0
        ? Math.round((qrValidated / totalAttendance) * 100)
        : 0,
      generatedAt: ['Hoy, 10:20 a.m.', 'Lun, 9:15 a.m.'][index] ?? 'Pendiente',
      generatedAtDate: ['2026-05-28T10:20:00', '2026-05-25T09:15:00'][index] ?? '2026-05-20T09:00:00',
      manualValidated,
      qrValidated,
      registered,
      totalAttendance,
      turnoutRate: Math.round((totalAttendance / registered) * 100),
      usedCapacityRate: aforoMaximo && aforoMaximo > 0
        ? Math.round((totalAttendance / aforoMaximo) * 100)
        : null,
    };
  });

const reviewFilters = [
  {
    label: 'Todos',
    value: 'TODOS',
  },
  {
    label: 'Pendientes',
    value: 'EN_REVISION',
  },
  {
    label: 'Observados',
    value: 'OBSERVADO',
  },
];

const reviewableStates = ['EN_REVISION', 'OBSERVADO_EN_REVISION'];
const relativeTimeReference = new Date('2026-06-06T13:45:00');

const directiveNotifications = [
  {
    id: 'directive-review-1',
    time: 'Hace 10 min',
    message: 'Carlos Ramírez envió "Festival Cultural Barrial" a revisión.',
    type: 'Evento enviado a revisión',
    unread: true,
  },
  {
    id: 'directive-review-2',
    time: 'Ayer',
    message: 'Carlos Ramírez corrigió "Carrera Vecinal 5K" y la volvió a enviar a revisión.',
    type: 'Evento reenviado',
    unread: true,
  },
  {
    id: 'directive-review-3',
    time: 'Hoy',
    message: 'Nuevo evento pendiente de decisión.',
    type: 'Pendiente de revisión',
    unread: true,
  },
  {
    id: 'directive-review-4',
    time: '05 jun. 2026',
    message: 'Tienes eventos para revisión que requieren decisión directiva.',
    type: 'Recordatorio de revisión',
    unread: false,
  },
];

const eventHistoryItems = [
  {
    id: 1,
    eventId: 2,
    type: 'CREATED',
    title: 'Evento creado',
    actorName: 'Carlos Ramírez',
    actorRole: 'Administrador',
    dateTime: '2026-06-02T09:10:00',
    message: 'Se registró la ficha inicial del evento.',
    userComment: null,
    tone: 'neutral',
  },
  {
    id: 2,
    eventId: 2,
    type: 'SENT_TO_REVIEW',
    title: 'Evento enviado a revisión',
    actorName: 'Carlos Ramírez',
    actorRole: 'Administrador',
    dateTime: '2026-06-03T15:30:00',
    message: 'La ficha fue enviada para evaluación directiva.',
    userComment: null,
    tone: 'review',
  },
  {
    id: 3,
    eventId: 2,
    type: 'OBSERVED',
    title: 'Evento observado',
    actorName: 'Mariana Fuentes',
    actorRole: 'Directivo',
    dateTime: '2026-06-04T11:45:00',
    message: null,
    userComment: 'Precisar el lugar exacto del evento y corregir la descripción para indicar el público objetivo.',
    tone: 'warning',
  },
  {
    id: 4,
    eventId: 2,
    type: 'UPDATED',
    title: 'Ficha actualizada',
    actorName: 'Carlos Ramírez',
    actorRole: 'Administrador',
    dateTime: '2026-06-05T10:25:00',
    message: 'La ficha del evento fue actualizada.',
    userComment: null,
    tone: 'neutral',
  },
  {
    id: 5,
    eventId: 2,
    type: 'CORRECTION_COMMENT',
    title: 'Corrección registrada',
    actorName: 'Carlos Ramírez',
    actorRole: 'Administrador',
    dateTime: '2026-06-05T10:32:00',
    message: null,
    userComment: 'Se precisó el ambiente donde se realizará el taller.',
    tone: 'neutral',
  },
  {
    id: 6,
    eventId: 2,
    type: 'RESENT_TO_REVIEW',
    title: 'Evento reenviado para revisión',
    actorName: 'Carlos Ramírez',
    actorRole: 'Administrador',
    dateTime: '2026-06-05T10:40:00',
    message: 'La ficha corregida fue enviada nuevamente para evaluación directiva.',
    userComment: null,
    tone: 'review',
  },
  {
    id: 7,
    eventId: 5,
    type: 'CREATED',
    title: 'Evento creado',
    actorName: 'Ana Torres',
    actorRole: 'Administrador',
    dateTime: '2026-06-01T08:50:00',
    message: 'Se registró la ficha inicial del evento.',
    userComment: null,
    tone: 'neutral',
  },
  {
    id: 8,
    eventId: 5,
    type: 'SAVED_DRAFT',
    title: 'Guardado como borrador',
    actorName: 'Ana Torres',
    actorRole: 'Administrador',
    dateTime: '2026-06-01T09:20:00',
    message: 'El evento fue guardado como borrador.',
    userComment: null,
    tone: 'neutral',
  },
  {
    id: 9,
    eventId: 5,
    type: 'SENT_TO_REVIEW',
    title: 'Evento enviado a revisión',
    actorName: 'Ana Torres',
    actorRole: 'Administrador',
    dateTime: '2026-06-06T08:45:00',
    message: 'La ficha fue enviada para evaluación directiva.',
    userComment: null,
    tone: 'review',
  },
  {
    id: 10,
    eventId: 1,
    type: 'APPROVED',
    title: 'Evento aprobado',
    actorName: 'Mariana Fuentes',
    actorRole: 'Directivo',
    dateTime: '2026-05-18T10:30:00',
    message: 'El evento fue aprobado para su publicación.',
    userComment: 'La propuesta está alineada con la agenda cultural del distrito.',
    tone: 'success',
  },
  {
    id: 11,
    eventId: 1,
    type: 'PUBLISHED',
    title: 'Evento publicado',
    actorName: 'Sistema',
    actorRole: 'Sistema',
    dateTime: '2026-05-18T10:45:00',
    message: 'El evento fue publicado en la plataforma ciudadana.',
    userComment: null,
    tone: 'success',
  },
  {
    id: 12,
    eventId: 4,
    type: 'CANCELLED',
    title: 'Evento cancelado',
    actorName: 'Sistema',
    actorRole: 'Sistema',
    dateTime: '2026-06-07T16:15:00',
    message: 'El evento fue cancelado.',
    userComment: 'No se confirmó la disponibilidad del punto de partida.',
    tone: 'danger',
  },
];

const currentMonthReference = new Date('2026-05-28T12:00:00');
const directiveApprovalAudit = [
  // Mock temporal: reemplazar por fecha_aprobación desde backend/API.
  ...adminEvents
    .filter((event) => event.state === 'PUBLICADO')
    .map((event, index) => ({
      eventId: event.id,
      approvedAt: ['2026-05-18T10:30:00', '2026-04-22T16:45:00'][index] ?? '2026-05-21T09:00:00',
    })),
  ...eventReports.map((report) => ({
    eventId: report.id,
    approvedAt: report.approvedAt,
  })),
];

function isDateInMonth(dateValue, referenceDate = currentMonthReference) {
  const date = new Date(dateValue);

  return (
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === referenceDate.getFullYear() &&
    date.getMonth() === referenceDate.getMonth()
  );
}

const directiveStats = [
  {
    icon: FileSearchIcon,
    label: 'Por revisar',
    tone: 'is-decision',
    trend: 'pendientes de decisión',
    value: adminEvents.filter((event) => reviewableStates.includes(event.state)).length,
  },
  {
    icon: MessageWarningIcon,
    label: 'Observados',
    tone: 'is-returned',
    trend: 'devueltos al administrador',
    value: adminEvents.filter((event) => event.state === 'OBSERVADO').length,
  },
  {
    icon: BadgeCheckIcon,
    label: 'Aprobados del mes',
    tone: 'is-month-approved',
    trend: 'aprobados en el mes actual',
    value: directiveApprovalAudit.filter((approval) =>
      isDateInMonth(approval.approvedAt),
    ).length,
  },
  {
    icon: ChartColumnIcon,
    label: 'Reportes del mes',
    tone: 'is-month-report',
    trend: 'eventos con reporte',
    value: eventReports.filter((report) => isDateInMonth(report.generatedAtDate)).length,
  },
];

const reviewResourceLabels = [
  ['IMAGEN_PORTADA', 'Portada ciudadana'],
  ['AFICHE', 'Afiche oficial'],
  ['DOCUMENTO', 'Documento adjunto'],
  ['VIDEO', 'Video referencial'],
];

function formatRelativeTime(dateValue, referenceDate = relativeTimeReference) {
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
  if (event.state === 'EN_REVISION') {
    const dateValue = event.sentToReviewAt ?? event.lastUpdatedAt;

    return {
      value: dateValue ? formatRelativeTime(dateValue) : null,
    };
  }

  if (event.state === 'OBSERVADO_EN_REVISION') {
    const dateValue = event.resentToReviewAt ?? event.lastUpdatedAt;

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

function getResourceKind(type) {
  if (type === 'VIDEO') {
    return 'video';
  }

  if (type === 'DOCUMENTO') {
    return 'document';
  }

  return 'image';
}

function getResourceValue(event, type) {
  if (type === 'VIDEO') {
    return event.resources?.[type] ?? event.videoUrl ?? true;
  }

  return event.resources?.[type];
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

function getExecutiveReviewDescription(event) {
  const executiveDescriptions = {
    2: 'Taller de marinera orientado a jóvenes para fortalecer coordinación corporal y trabajo en pareja.',
  };

  return executiveDescriptions[event.id] ?? event.summary ?? event.description;
}

function getDirectiveStateTone(state) {
  const stateToneMap = {
    EN_REVISION: 'state-review',
    OBSERVADO: 'state-observed',
    OBSERVADO_EN_REVISION: 'state-reobserved',
    APROBADO: 'state-published',
    PUBLICADO: 'state-published',
  };

  return stateToneMap[state] ?? 'state-default';
}

function DirectivoDashboard({ onLogout }) {
  const [currentDirectiveView, setCurrentDirectiveView] = useState('review');
  const [reviewFilter, setReviewFilter] = useState('TODOS');
  const [selectedReviewEvent, setSelectedReviewEvent] = useState(null);
  const [selectedReportEvent, setSelectedReportEvent] = useState(null);
  const [pendingDecision, setPendingDecision] = useState(null);
  const [activeReviewSection, setActiveReviewSection] = useState('ficha-directiva');
  const filteredReviewEvents =
    reviewFilter === 'TODOS'
      ? reviewEvents
      : reviewEvents.filter((event) =>
        reviewFilter === 'EN_REVISION'
          ? reviewableStates.includes(event.state)
          : event.state === reviewFilter,
      );

  function navigateReviewSection(sectionId) {
    setActiveReviewSection(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  return (
    <section className="admin-shell directive-shell" aria-labelledby="directive-title">
      <aside className="admin-sidebar">
        <button className="admin-brand" type="button" onClick={onLogout}>
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
                onClick={() => setCurrentDirectiveView('review')}
              >
                Revisión
              </button>
              <button
                className={currentDirectiveView === 'reports' ? 'active admin-nav-link' : 'admin-nav-link'}
                type="button"
                onClick={() => setCurrentDirectiveView('reports')}
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
            onActiveSectionChange={setActiveReviewSection}
            onBack={() => {
              setSelectedReviewEvent(null);
              setActiveReviewSection('ficha-directiva');
            }}
            onDecision={setPendingDecision}
          />
        ) : selectedReportEvent ? (
          <EventReportView
            report={selectedReportEvent}
            onActiveSectionChange={setActiveReviewSection}
            onBack={() => setSelectedReportEvent(null)}
          />
        ) : (
          <>
            {currentDirectiveView === 'reports' ? (
              <ReportsDashboardView
                reports={eventReports}
                onSelectReport={(report) => {
                  setSelectedReportEvent(report);
                  setActiveReviewSection('report-section');
                }}
              />
            ) : (
              <DirectiveReviewDashboard
                filteredReviewEvents={filteredReviewEvents}
                reviewFilter={reviewFilter}
                onFilterChange={setReviewFilter}
                onSelectReview={setSelectedReviewEvent}
              />
            )}
          </>
        )}

        {pendingDecision && (
          <DirectiveDecisionModal
            decision={pendingDecision}
            onCancel={() => setPendingDecision(null)}
            onConfirm={() => {
              setPendingDecision(null);
              setSelectedReviewEvent(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </main>
    </section>
  );
}

function DirectiveReviewDashboard({
  filteredReviewEvents,
  reviewFilter,
  onFilterChange,
  onSelectReview,
}) {
  const reviewFilterCounts = reviewFilters.reduce((counts, filter) => {
    counts[filter.value] =
      filter.value === 'TODOS'
        ? reviewEvents.length
        : reviewEvents.filter((event) =>
          filter.value === 'EN_REVISION'
            ? reviewableStates.includes(event.state)
            : event.state === filter.value,
        ).length;

    return counts;
  }, {});

  return (
    <>
      <header className="admin-topbar">
        <div>
          <span className="section-kicker">Panel directivo</span>
          <h1 id="directive-title">Supervisión municipal de eventos</h1>
        </div>
        <div className="admin-topbar-actions">
          <NotificationMenu notifications={directiveNotifications} />
        </div>
      </header>

      <section className="admin-stats" aria-label="Resumen directivo">
        {directiveStats.map((stat) => (
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
          {filteredReviewEvents.map((event) => (
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

function ReportsDashboardView({ reports, onSelectReport }) {
  const [reportSearch, setReportSearch] = useState('');
  const [reportCategory, setReportCategory] = useState('Todas');
  const [reportSort, setReportSort] = useState('recent');
  const reportCategories = [
    'Todas',
    ...new Set(reports.map((report) => report.category)),
  ];
  const filteredReports = reports
    .filter((report) => {
      const normalizedSearch = reportSearch.trim().toLowerCase();
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [report.title, report.venue, report.category]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);
      const matchesCategory =
        reportCategory === 'Todas' || report.category === reportCategory;

      return matchesSearch && matchesCategory;
    })
    .sort((firstReport, secondReport) => {
      if (reportSort === 'attendance') {
        return secondReport.totalAttendance - firstReport.totalAttendance;
      }

      if (reportSort === 'completed') {
        return secondReport.completedAt.localeCompare(firstReport.completedAt);
      }

      return firstReport.id - secondReport.id;
    });

  return (
    <section className="reports-dashboard-view" aria-labelledby="reports-title">
      <header className="admin-topbar">
        <div>
          <span className="section-kicker">Reportes directivos</span>
          <h1 id="reports-title">Historial de eventos finalizados</h1>
        </div>
        <div className="admin-topbar-actions">
          <NotificationMenu notifications={directiveNotifications} />
        </div>
      </header>

      <section className="admin-table-panel admin-table-featured" id="reportes-evento">
        <div className="admin-panel-heading">
          <div>
            <h2>Resultados de eventos finalizados</h2>
          </div>
        </div>

        <div className="reports-filter-grid" aria-label="Filtros de reportes">
          <label>
            Buscar reporte
            <input
              placeholder="Nombre, categoría o lugar"
              type="search"
              value={reportSearch}
              onChange={(event) => setReportSearch(event.target.value)}
            />
          </label>
          <label>
            Categoría
            <select
              value={reportCategory}
              onChange={(event) => setReportCategory(event.target.value)}
            >
              {reportCategories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
          <label>
            Ordenar por
            <select
              value={reportSort}
              onChange={(event) => setReportSort(event.target.value)}
            >
              <option value="recent">Más recientes</option>
              <option value="completed">Fecha de culminación</option>
              <option value="attendance">Mayor asistencia</option>
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
              <span>{report.registered}</span>
              <span className="report-attendance-cell">
                <strong>{report.totalAttendance}</strong>
                <small>{report.turnoutRate}%</small>
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
          <div class="card"><span>${report.usedCapacityRate === null ? 'ValidaciÃ³n digital' : 'Aforo utilizado'}</span><strong>${report.usedCapacityRate === null ? report.digitalValidationRate : report.usedCapacityRate}%</strong></div>
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

function EventReportView({ report, onActiveSectionChange, onBack }) {
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
  const participationInsight =
    report.turnoutRate >= 80
      ? {
          tone: 'positive',
          title: 'Alta participación ciudadana',
          text: `Se registraron ${report.totalAttendance} asistentes de ${report.registered} inscritos, alcanzando una tasa de asistencia del ${report.turnoutRate}%.`,
        }
      : report.turnoutRate >= 60
        ? {
            tone: 'neutral',
            title: 'Participación moderada',
            text: `Se registraron ${report.totalAttendance} asistentes de ${report.registered} inscritos, alcanzando una tasa de asistencia del ${report.turnoutRate}%.`,
          }
        : {
            tone: 'warning',
            title: 'Baja participación registrada',
            text: `Se registraron ${report.totalAttendance} asistentes de ${report.registered} inscritos, alcanzando una tasa de asistencia del ${report.turnoutRate}%.`,
          };
  const capacityInsight = report.usedCapacityRate === null
    ? {
        tone: 'neutral',
        title: 'Evento sin control de aforo',
        text: 'Este evento no tuvo control de aforo, por lo que el análisis se centra en asistencia y validaciones.',
      }
    : report.usedCapacityRate >= 90
      ? {
          tone: 'warning',
          title: 'Cercano a capacidad máxima',
          text: `El aforo fue utilizado al ${report.usedCapacityRate}%. El evento estuvo cerca de su capacidad máxima.`,
        }
      : report.usedCapacityRate >= 60
        ? {
            tone: 'positive',
            title: 'Uso adecuado del aforo',
            text: `El aforo fue utilizado al ${report.usedCapacityRate}%. El uso del aforo fue adecuado.`,
          }
        : {
            tone: 'warning',
            title: 'Aforo parcialmente aprovechado',
            text: `El aforo fue utilizado al ${report.usedCapacityRate}%. El aforo disponible no fue aprovechado en su totalidad.`,
          };
  const validationInsight = qrValidationRate >= 70
    ? {
        tone: 'positive',
        title: 'Alta adopción QR',
        text: 'La mayoría de validaciones se realizaron mediante QR, evidenciando una adecuada adopción del mecanismo digital.',
      }
    : {
        tone: 'warning',
        title: 'Uso manual relevante',
        text: 'Se observa una participación relevante de validaciones manuales, por lo que podría revisarse la adopción del mecanismo QR.',
      };
  const executiveInsights = [
    participationInsight,
    capacityInsight,
    validationInsight,
    ...(costPerAttendee
      ? [{
          tone: 'neutral',
          title: 'Costo estimado por asistente',
          text: `El costo estimado por asistente fue de ${costPerAttendeeLabel}.`,
        }]
      : []),
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
        <button className="admin-secondary-action" type="button" onClick={onBack}>
          Volver
        </button>
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
        <h2 id="executive-summary-title">Resumen ejecutivo</h2>
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
            <div>
              <dt>Estado</dt>
              <dd>{formatEventState(report.state)}</dd>
            </div>
            <div>
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
    RESENT_TO_REVIEW: (
      <>
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
        <path d="M7 22h6" />
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
          </div>
        </div>
      ))}
    </dl>
  );
}

function EventHistoryMenu({ historyItems }) {
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
            <small>{historyItems.length} movimientos del evento</small>
          </div>
          <div className="event-history-list">
            {historyItems.length > 0 ? (
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

function DirectiveReviewView({ event, onActiveSectionChange, onBack, onDecision }) {
  const fichaRef = useRef(null);
  const recursosRef = useRef(null);
  const decisionRef = useRef(null);
  const [previewResource, setPreviewResource] = useState(null);
  const aforoMaximo = getAforoMaximo(event);
  const canDecide = reviewableStates.includes(event.state);
  const reviewTimeMetric = getReviewTimeMetric(event);
  const shouldShowPreviousObservation =
    event.state === 'OBSERVADO_EN_REVISION' && event.previousObservation;
  const eventHistory = eventHistoryItems
    .filter((historyItem) => historyItem.eventId === event.id)
    .sort((firstItem, secondItem) =>
      new Date(secondItem.dateTime).getTime() - new Date(firstItem.dateTime).getTime(),
    );
  const mainInfoItems = [
    {
      icon: 'calendar',
      label: 'Fecha y hora',
      value: `${event.date} · ${event.time}`,
    },
    {
      icon: 'clock',
      label: 'Duración',
      value: event.duration,
    },
    {
      icon: 'audience',
      label: 'Público objetivo',
      value: event.audience,
    },
  ];
  const locationInfoItems = [
    {
      icon: 'location',
      label: 'Lugar',
      value: event.venue,
      href: getEventMapsUrl(event),
      ariaLabel: `Abrir ${event.venue} en Google Maps`,
    },
    {
      icon: 'route',
      label: 'Dirección',
      value: event.address,
    },
    {
      icon: 'reference',
      label: 'Referencia',
      value: event.locationReference || 'Pendiente de completar',
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
          <span className="section-kicker">Ficha para revisión</span>
          <h1 id="review-event-title">{event.title}</h1>
        </div>
        <div className="directive-review-topbar-actions">
          <EventHistoryMenu historyItems={eventHistory} />
          <button className="admin-new-event-action event-form-top-action" type="button" onClick={onBack}>
            Volver
          </button>
        </div>
      </header>

      <section className="directive-review-hero" id="ficha-directiva" ref={fichaRef}>
        <div className={`directive-review-media media-${event.accent}`}>
          <img alt="" src={eventReviewPlaceholder} />
          <span>{event.category}</span>
        </div>
        <article className="admin-panel directive-review-summary">
          <div className="directive-summary-heading">
            <div>
              <span className="section-kicker">Evaluación directiva</span>
              <h2>Resumen para decisión</h2>
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
            </div>
          </div>
          <p>{getExecutiveReviewDescription(event)}</p>
          <dl className="directive-facts">
            <div>
              <dt>Área responsable</dt>
              <dd>{event.organizer}</dd>
            </div>
            <div>
              <dt>Fecha</dt>
              <dd>{event.date} · {event.time}</dd>
            </div>
            <div>
              <dt>Lugar</dt>
              <dd>{event.venue}</dd>
            </div>
            {hasAforoMaximo(event) && (
              <div>
                <dt>Aforo</dt>
                <dd>{aforoMaximo} participantes</dd>
              </div>
            )}
          </dl>
          <div className="directive-review-checks" aria-label="Indicadores de revisión">
            <span>Corrección atendida</span>
          </div>
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

      <section className="directive-review-grid">
        <article className="admin-panel">
          <span className="section-kicker">Datos del evento</span>
          <h2>Información principal</h2>
          <ReviewInfoList items={mainInfoItems} />
        </article>

        <article className="admin-panel">
          <span className="section-kicker">Ubicación</span>
          <h2>Lugar y referencia</h2>
          <ReviewInfoList items={locationInfoItems} />
        </article>
      </section>

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
            const kind = getResourceKind(type);
            const resourceValue = getResourceValue(event, type);
            const isAvailable = Boolean(resourceValue);
            const previewUrl = getResourcePreviewUrl(resourceValue, kind);
            const externalUrl = typeof resourceValue === 'string' && /^https?:\/\//i.test(resourceValue)
              ? resourceValue
              : null;
            const resourceActionLabel = kind === 'video' ? 'Abrir video' : `Previsualizar ${label}`;

            return (
              <article
                className={isAvailable ? 'directive-resource-card' : 'directive-resource-card missing'}
                key={type}
              >
                <div className={kind === 'video' ? 'directive-video-preview' : `directive-resource-preview media-${event.accent}`}>
                  <span>{kind === 'video' ? 'Video' : event.category}</span>
                </div>
                <strong>{label}</strong>
                <div className="directive-resource-meta">
                  <small>{isAvailable ? type : 'No cargado'}</small>
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
                    {isAvailable ? <ResourceActionIcon type={kind} /> : <span>No disponible</span>}
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
          <button
            className="table-text-action approve"
            disabled={!canDecide}
            type="button"
            onClick={() => onDecision({ eventTitle: event.title, type: 'approve' })}
          >
            Aprobar
          </button>
          <button
            className="table-text-action observe"
            disabled={!canDecide}
            type="button"
            onClick={() => onDecision({
              eventTitle: event.title,
              previousObservation: event.previousObservation ?? null,
              type: 'observe',
            })}
          >
            Observar
          </button>
        </div>
      </section>
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

function DirectiveDecisionModal({ decision, onCancel, onConfirm }) {
  const isApproval = decision.type === 'approve';
  const [observationComment, setObservationComment] = useState('');
  const canSubmitDecision = isApproval || observationComment.trim().length > 0;

  function submitDecision() {
    if (!canSubmitDecision) {
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
          {isApproval ? 'Aprobar evento' : 'Observar evento'}
        </span>
        <h2 id="directive-decision-title">
          {isApproval
            ? '¿Deseas aprobar este evento?'
            : `Registrar observación para "${decision.eventTitle}"`}
        </h2>
        <p>
          {isApproval
            ? 'Al aprobarlo, el evento quedará listo para publicación según el flujo definido.'
            : 'Describe con claridad qué debe corregir el administrador antes de reenviar la ficha.'}
        </p>
        
        {!isApproval && (
          <label className="directive-observation-field">
            Comentario de observación
            <textarea
              required
              placeholder="Indica qué debe corregirse antes de publicar."
              value={observationComment}
              onChange={(event) => setObservationComment(event.target.value)}
            />
          </label>
        )}
        <div className="modal-actions">
          <button className="back-button" type="button" onClick={onCancel}>
            Cancelar
          </button>
          <button
            className="primary-button"
            disabled={!canSubmitDecision}
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
