import { useEffect, useRef, useState } from 'react';
import municipalLogo from '../../assets/images/municipalidad-logo.png';
import calendarCheck from '../../assets/icons/calendar-check.png';
import clipboardCheck from '../../assets/icons/clipboard-check.png';
import triangleAlert from '../../assets/icons/triangle-alert.png';
import { adminEvents, formatEventState } from './dashboardData';
import NotificationMenu from './NotificationMenu';
import './AdminDashboard.css';
import './DirectivoDashboard.css';

const reviewEvents = adminEvents.filter((event) =>
  ['EN_REVISION', 'OBSERVADO'].includes(event.state),
);

const eventReports = adminEvents
  .filter((event) => event.state === 'FINALIZADO')
  .map((event, index) => {
    const registered = [118, 192][index] ?? Math.round(event.spots * 0.82);
    const qrValidated = [86, 146][index] ?? Math.round(registered * 0.72);
    const manualValidated = [12, 18][index] ?? Math.round(registered * 0.12);
    const cancelled = [2, 4][index] ?? 1;
    const cancelledRegistrations = [4, 7][index] ?? 2;
    const totalAttendance = qrValidated + manualValidated;

    return {
      ...event,
      approvedAt: ['2026-05-08T15:30:00', '2026-05-14T11:45:00'][index] ?? '2026-05-20T09:00:00',
      cancelled,
      cancelledRegistrations,
      completedAt: ['08/06/2026', '14/06/2026'][index] ?? event.date,
      generatedAt: ['Hoy, 10:20 a.m.', 'Lun, 9:15 a.m.'][index] ?? 'Pendiente',
      generatedAtDate: ['2026-05-28T10:20:00', '2026-05-25T09:15:00'][index] ?? '2026-05-20T09:00:00',
      manualValidated,
      qrValidated,
      registered,
      totalAttendance,
      turnoutRate: Math.round((totalAttendance / registered) * 100),
      usedCapacityRate: Math.round((totalAttendance / event.spots) * 100),
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

const directiveNotifications = [
  {
    id: 'directive-review-1',
    message: 'Carlos Ramírez envió "Festival Cultural Barrial" a revisión.',
    type: 'Evento enviado a revisión',
    unread: true,
  },
  {
    id: 'directive-review-2',
    message: 'Carlos Ramírez corrigió "Carrera Vecinal 5K" y la volvió a enviar a revisión.',
    type: 'Evento reenviado',
    unread: true,
  },
  {
    id: 'directive-review-3',
    message: 'Nuevo evento pendiente de decisión.',
    type: 'Pendiente de revisión',
    unread: true,
  },
  {
    id: 'directive-review-4',
    message: 'Tienes eventos en revisión que requieren decisión directiva.',
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
    title: 'Evento reenviado a revisión',
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
    value: adminEvents.filter((event) => event.state === 'EN_REVISION').length,
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

function getDirectiveStateTone(state) {
  const stateToneMap = {
    EN_REVISION: 'state-review',
    OBSERVADO: 'state-observed',
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
  const filteredReviewEvents =
    reviewFilter === 'TODOS'
      ? reviewEvents
      : reviewEvents.filter((event) => event.state === reviewFilter);

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
                  <a className="active" href="#ficha-directiva">Ficha</a>
                  <a href="#recursos-directivos">Recursos</a>
                  <a href="#decision-directiva">Decisión</a>
                </>
              ) : (
                <>
                  <a className="active" href="#reporte-evento">Reporte</a>
                  <a href="#reporte-asistencia">Asistencia</a>
                  <a href="#reporte-exportacion">Exportación</a>
                </>
              )}
              <button
                className="admin-nav-logout"
                type="button"
                onClick={() => {
                  setSelectedReviewEvent(null);
                  setSelectedReportEvent(null);
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
          <button className="admin-nav-logout" type="button" onClick={onLogout}>
            Salir del panel
          </button>
        </nav>
      </aside>

      <main className="admin-main">
        {selectedReviewEvent ? (
          <DirectiveReviewView
            event={selectedReviewEvent}
            onBack={() => setSelectedReviewEvent(null)}
            onDecision={setPendingDecision}
          />
        ) : selectedReportEvent ? (
          <EventReportView
            report={selectedReportEvent}
            onBack={() => setSelectedReportEvent(null)}
          />
        ) : (
          <>
            {currentDirectiveView === 'reports' ? (
              <ReportsDashboardView
                reports={eventReports}
                onSelectReport={setSelectedReportEvent}
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
        : reviewEvents.filter((event) => event.state === filter.value).length;

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
            <h2>Reportes concretos por evento</h2>
          </div>
          <span className="directive-badge">
            Mostrando {filteredReports.length} de {reports.length}
          </span>
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
            <span>Culminacion</span>
            <span>Reporte</span>
          </div>
          {filteredReports.map((report) => (
            <div className="admin-table-row" key={report.id}>
              <span>
                <strong>{report.title}</strong>
                <small>{report.date} - {report.venue}</small>
              </span>
              <span>{report.registered}</span>
              <span>{report.totalAttendance}</span>
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
    ['aforo_utilizado', `${report.usedCapacityRate}%`],
    ['validaciones_qr', report.qrValidated],
    ['validaciones_manual', report.manualValidated],
    ['asistencias_anuladas', report.cancelled],
    ['inscripciones_canceladas', report.cancelledRegistrations],
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
          <div class="card"><span>Aforo utilizado</span><strong>${report.usedCapacityRate}%</strong></div>
        </section>
        <h2>Indicadores de control</h2>
        <table>
          <tr><th>Indicador</th><th>Valor</th></tr>
          <tr><td>Validaciones QR</td><td>${report.qrValidated}</td></tr>
          <tr><td>Validaciones manuales</td><td>${report.manualValidated}</td></tr>
          <tr><td>Asistencias anuladas</td><td>${report.cancelled}</td></tr>
          <tr><td>Inscripciones canceladas</td><td>${report.cancelledRegistrations}</td></tr>
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

function EventReportView({ report, onBack }) {
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

      <section className="admin-stats" id="reporte-evento" aria-label="Resumen del reporte">
        <article className="admin-stat-card">
          <img alt="" className="admin-stat-icon" src={clipboardCheck} />
          <div>
            <span>Inscritos</span>
            <strong>{report.registered}</strong>
            <small>registros confirmados</small>
          </div>
        </article>
        <article className="admin-stat-card">
          <img alt="" className="admin-stat-icon" src={calendarCheck} />
          <div>
            <span>Asistentes</span>
            <strong>{report.totalAttendance}</strong>
            <small>validaciones totales</small>
          </div>
        </article>
        <article className="admin-stat-card">
          <img alt="" className="admin-stat-icon" src={triangleAlert} />
          <div>
            <span>Tasa asistencia</span>
            <strong>{report.turnoutRate}%</strong>
            <small>asistentes sobre inscritos</small>
          </div>
        </article>
        <article className="admin-stat-card">
          <img alt="" className="admin-stat-icon" src={clipboardCheck} />
          <div>
            <span>Aforo utilizado</span>
            <strong>{report.usedCapacityRate}%</strong>
            <small>asistentes sobre capacidad</small>
          </div>
        </article>
      </section>

      <section className="directive-review-grid" id="reporte-asistencia">
        <article className="admin-panel">
          <span className="section-kicker">Asistencia</span>
          <h2>Validaciones registradas</h2>
          <dl className="directive-detail-list">
            <div>
              <dt>QR</dt>
              <dd>{report.qrValidated}</dd>
            </div>
            <div>
              <dt>Manual</dt>
              <dd>{report.manualValidated}</dd>
            </div>
            <div>
              <dt>Estado de asistencia</dt>
              <dd>VALIDADA / ANULADA</dd>
            </div>
            <div>
              <dt>Anuladas</dt>
              <dd>{report.cancelled}</dd>
            </div>
            <div>
              <dt>Inscripciones canceladas</dt>
              <dd>{report.cancelledRegistrations}</dd>
            </div>
            <div>
              <dt>Generado</dt>
              <dd>{report.generatedAt}</dd>
            </div>
          </dl>
        </article>

        <article className="admin-panel">
          <span className="section-kicker">Evento</span>
          <h2>Datos de referencia</h2>
          <dl className="directive-detail-list">
            <div>
              <dt>Fecha</dt>
              <dd>{report.date} - {report.time}</dd>
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
              <dd>S/ {report.referenceCost.toLocaleString('es-PE')}</dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="admin-table-panel admin-table-featured">
        <div className="admin-panel-heading">
          <div>
            <span className="section-kicker">Detalle</span>
            <h2>Resumen de validaciones</h2>
          </div>
        </div>
        <div className="validation-summary-grid">
          <article>
            <span>Metodo</span>
            <strong>QR</strong>
            <dl>
              <div>
                <dt>Cantidad</dt>
                <dd>{report.qrValidated}</dd>
              </div>
              <div>
                <dt>Estado QR</dt>
                <dd>USADO</dd>
              </div>
              <div>
                <dt>Asistencia</dt>
                <dd>VALIDADA</dd>
              </div>
              <div>
                <dt>Responsable</dt>
                <dd>Personal operativo</dd>
              </div>
            </dl>
          </article>

          <article>
            <span>Metodo</span>
            <strong>Manual</strong>
            <dl>
              <div>
                <dt>Cantidad</dt>
                <dd>{report.manualValidated}</dd>
              </div>
              <div>
                <dt>Estado QR</dt>
                <dd>No aplica</dd>
              </div>
              <div>
                <dt>Asistencia</dt>
                <dd>VALIDADA</dd>
              </div>
              <div>
                <dt>Responsable</dt>
                <dd>Personal operativo</dd>
              </div>
            </dl>
          </article>

          <article>
            <span>Metodo</span>
            <strong>Anulacion</strong>
            <dl>
              <div>
                <dt>Cantidad</dt>
                <dd>{report.cancelled}</dd>
              </div>
              <div>
                <dt>Estado QR</dt>
                <dd>REVOCADO</dd>
              </div>
              <div>
                <dt>Asistencia</dt>
                <dd>ANULADA</dd>
              </div>
              <div>
                <dt>Responsable</dt>
                <dd>Coordinacion del evento</dd>
              </div>
            </dl>
          </article>
        </div>
      </section>

      <section className="admin-panel directive-decision-panel" id="reporte-exportacion">
        <div>
          <span className="section-kicker">Exportación</span>
          <h2>Documento de reporte</h2>
          <p>
            El reporte consolida inscripciones, asistencias y validaciones para
            sustentar el seguimiento directivo del evento.
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

function DirectiveReviewView({ event, onBack, onDecision }) {
  const canDecide = event.state === 'EN_REVISION';
  const eventHistory = eventHistoryItems
    .filter((historyItem) => historyItem.eventId === event.id)
    .sort((firstItem, secondItem) =>
      new Date(secondItem.dateTime).getTime() - new Date(firstItem.dateTime).getTime(),
    );

  return (
    <section className="directive-review-view" aria-labelledby="review-event-title">
      <header className="admin-topbar">
        <div>
          <span className="section-kicker">Ficha en revisión</span>
          <h1 id="review-event-title">{event.title}</h1>
        </div>
        <div className="directive-review-topbar-actions">
          <EventHistoryMenu historyItems={eventHistory} />
          <button className="admin-secondary-action" type="button" onClick={onBack}>
            Volver
          </button>
        </div>
      </header>

      <section className="directive-review-hero" id="ficha-directiva">
        <div className={`directive-review-media media-${event.accent}`}>
          <span>{event.category}</span>
        </div>
        <article className="admin-panel directive-review-summary">
          <span className="section-kicker">{formatEventState(event.state)}</span>
          <h2>Resumen para decisión</h2>
          <p>{event.description}</p>
          <dl className="directive-facts">
            <div>
              <dt>Ficha</dt>
              <dd>{event.completeness}%</dd>
            </div>
            <div>
              <dt>Cupos</dt>
              <dd>{event.spots}</dd>
            </div>
            <div>
              <dt>Área</dt>
              <dd>{event.organizer}</dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="directive-review-grid">
        <article className="admin-panel">
          <span className="section-kicker">Datos del evento</span>
          <h2>Información principal</h2>
          <dl className="directive-detail-list">
            <div>
              <dt>Fecha y hora</dt>
              <dd>{event.date} - {event.time}</dd>
            </div>
            <div>
              <dt>Duración</dt>
              <dd>{event.duration}</dd>
            </div>
            <div>
              <dt>Público objetivo</dt>
              <dd>{event.audience}</dd>
            </div>
            <div>
              <dt>Inscripción</dt>
              <dd>{event.registrationStart} hasta {event.registrationEnd}</dd>
            </div>
          </dl>
        </article>

        <article className="admin-panel">
          <span className="section-kicker">Ubicación</span>
          <h2>Lugar y referencia</h2>
          <dl className="directive-detail-list">
            <div>
              <dt>Lugar</dt>
              <dd>{event.venue}</dd>
            </div>
            <div>
              <dt>Distrito</dt>
              <dd>{event.district}</dd>
            </div>
            <div>
              <dt>Dirección</dt>
              <dd>{event.address}</dd>
            </div>
            <div>
              <dt>Referencia</dt>
              <dd>{event.locationReference || 'Pendiente de completar'}</dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="admin-panel" id="recursos-directivos">
        <div className="admin-panel-heading">
          <div>
            <span className="section-kicker">Recursos</span>
            <h2>Material adjunto</h2>
          </div>
        </div>
        <div className="directive-resource-grid">
          {reviewResourceLabels.map(([type, label]) => {
            const isVideo = type === 'VIDEO';
            const isAvailable = isVideo || Boolean(event.resources?.[type]);

            return (
              <article
                className={isAvailable ? 'directive-resource-card' : 'directive-resource-card missing'}
                key={type}
              >
                <div className={isVideo ? 'directive-video-preview' : `directive-resource-preview media-${event.accent}`}>
                  <span>{isVideo ? 'Video' : event.category}</span>
                </div>
                <strong>{label}</strong>
                <small>{isAvailable ? type : 'No cargado'}</small>
              </article>
            );
          })}
        </div>
      </section>

      <section className="directive-review-grid">
        <article className="admin-panel">
          <span className="section-kicker">Requisitos</span>
          <h2>Condiciones publicadas</h2>
          <div className="admin-checklist">
            {event.requirements.map((requirement) => (
              <p key={requirement}>{requirement}</p>
            ))}
          </div>
        </article>

        <article className="admin-panel">
          <span className="section-kicker">Programa</span>
          <h2>Agenda prevista</h2>
          <div className="admin-checklist">
            {event.agenda.map((agendaItem) => (
              <p key={agendaItem}>{agendaItem}</p>
            ))}
          </div>
        </article>
      </section>

      <section className="admin-panel directive-decision-panel" id="decision-directiva">
        <div>
          <span className="section-kicker">Decisión</span>
          <h2>Aprobación directiva</h2>
          <p>
            Aprueba la publicación si la ficha está completa y alineada al
            objetivo municipal. Si encuentras inconsistencias, observa el evento
            para que el administrador corrija la ficha.
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
            onClick={() => onDecision({ eventTitle: event.title, type: 'observe' })}
          >
            Observar
          </button>
        </div>
      </section>
    </section>
  );
}

function DirectiveDecisionModal({ decision, onCancel, onConfirm }) {
  const isApproval = decision.type === 'approve';

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
            ? `¿Estás seguro de aprobar "${decision.eventTitle}"?`
            : `¿Estás seguro de observar "${decision.eventTitle}"?`}
        </h2>
        <p>
          {isApproval
            ? 'El evento pasará a PUBLICADO y será visible para los ciudadanos.'
            : 'El evento pasará a OBSERVADO y volverá al administrador para correcciones.'}
        </p>
        {!isApproval && (
          <label className="directive-observation-field">
            Comentario de observación
            <textarea placeholder="Indica qué debe corregirse antes de publicar." />
          </label>
        )}
        <div className="modal-actions">
          <button className="back-button" type="button" onClick={onCancel}>
            Revisar ficha
          </button>
          <button className="primary-button" type="button" onClick={onConfirm}>
            {isApproval ? 'Sí, aprobar' : 'Sí, observar'}
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
