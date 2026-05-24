import municipalLogo from '../../assets/images/municipalidad-logo.png';
import { events } from '../public-portal/data/events';
import './AdminDashboard.css';

const adminEvents = events.map((event, index) => {
  const state = ['Publicado', 'Cupos limitados', 'Publicado', 'Borrador', 'Revision'][index];
  const lastUpdate = ['Hoy, 9:30 a.m.', 'Ayer, 4:10 p.m.', 'Lun, 11:20 a.m.', 'Pendiente', 'Hoy, 8:45 a.m.'][index];
  const completeness = [100, 92, 100, 68, 84][index];

  return {
    ...event,
    completeness,
    lastUpdate,
    state,
  };
});

const managementStats = [
  {
    label: 'Publicados',
    trend: 'visibles en el portal',
    value: adminEvents.filter((event) => event.state === 'Publicado').length,
  },
  {
    label: 'Borradores',
    trend: 'requieren completar datos',
    value: adminEvents.filter((event) => event.state === 'Borrador').length,
  },
  {
    label: 'En revision',
    trend: 'pendientes de publicacion',
    value: adminEvents.filter((event) => event.state === 'Revision').length,
  },
  {
    label: 'Por actualizar',
    trend: 'con observaciones operativas',
    value: 2,
  },
];

const operationalAlerts = [
  'Carrera Vecinal 5K requiere publicar punto de partida final.',
  'Mesa de Voluntariado necesita confirmar responsable municipal.',
  'Taller de Marinera tiene requisitos pendientes de validacion.',
];

const publicationChecklist = [
  'Datos basicos del evento',
  'Lugar y direccion exacta',
  'Cupos y condiciones de inscripcion',
  'Requisitos y accesibilidad',
];

function AdminDashboard({ onLogout }) {
  const nextEvent = adminEvents[0];

  return (
    <section className="admin-shell" aria-labelledby="admin-title">
      <aside className="admin-sidebar">
        <button className="admin-brand" type="button" onClick={onLogout}>
          <img
            alt="Logo Municipalidad de San Miguel"
            className="municipality-logo brand-logo"
            src={municipalLogo}
          />
          <span>
            <strong>San Miguel</strong>
            <small>Gestion de eventos</small>
          </span>
        </button>

        <nav className="admin-nav" aria-label="Navegacion administrativa">
          <a className="active" href="#resumen">Resumen</a>
          <a href="#eventos-admin">Eventos</a>
          <a href="#borradores">Borradores</a>
          <a href="#publicacion">Publicacion</a>
          <a href="#observaciones">Observaciones</a>
          <button className="admin-nav-logout" type="button" onClick={onLogout}>
            Salir del panel
          </button>
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="section-kicker">Panel administrativo</span>
            <h1 id="admin-title">Gestion municipal de eventos</h1>
          </div>
          <button className="admin-primary-action" type="button">
            Nuevo evento
          </button>
        </header>

        <section className="admin-stats" id="resumen" aria-label="Resumen de gestion">
          {managementStats.map((stat) => (
            <article className="admin-stat-card" key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              <small>{stat.trend}</small>
            </article>
          ))}
        </section>

        <section className="admin-grid">
          <article className="admin-panel next-admin-event" id="publicacion">
            <div className="admin-panel-heading">
              <div>
                <span className="section-kicker">Evento destacado</span>
                <h2>{nextEvent.title}</h2>
              </div>
              <span className="status-pill">{nextEvent.state}</span>
            </div>
            <div className="admin-event-progress">
              <div>
                <strong>{nextEvent.completeness}%</strong>
                <span>ficha completa</span>
              </div>
              <div>
                <strong>{nextEvent.spots}</strong>
                <span>cupos</span>
              </div>
              <div>
                <strong>{nextEvent.category}</strong>
                <span>categoria</span>
              </div>
            </div>
            <div className="progress-track">
              <span style={{ width: `${nextEvent.completeness}%` }} />
            </div>
            <dl className="admin-event-facts">
              <div>
                <dt>Fecha</dt>
                <dd>{nextEvent.date}</dd>
              </div>
              <div>
                <dt>Lugar</dt>
                <dd>{nextEvent.venue}</dd>
              </div>
              <div>
                <dt>Ultima edicion</dt>
                <dd>{nextEvent.lastUpdate}</dd>
              </div>
              <div>
                <dt>Responsable</dt>
                <dd>{nextEvent.organizer}</dd>
              </div>
            </dl>
          </article>

          <article className="admin-panel validation-panel">
            <span className="section-kicker">Flujo de publicacion</span>
            <h2>Checklist del evento</h2>
            <p>
              Revisa que cada ficha tenga informacion suficiente antes de
              publicarse en el portal ciudadano.
            </p>
            <div className="admin-checklist">
              {publicationChecklist.map((item) => (
                <label key={item}>
                  <input defaultChecked={item !== 'Requisitos y accesibilidad'} type="checkbox" />
                  {item}
                </label>
              ))}
            </div>
            <button className="admin-secondary-action" type="button">
              Revisar ficha
            </button>
          </article>
        </section>

        <section className="admin-table-panel" id="eventos-admin">
          <div className="admin-panel-heading">
            <div>
              <span className="section-kicker">Operacion</span>
              <h2>Eventos en gestion</h2>
            </div>
            <button className="admin-secondary-action" type="button">
              Filtrar
            </button>
          </div>

          <div className="admin-table">
            <div className="admin-table-row admin-table-head">
              <span>Evento</span>
              <span>Estado</span>
              <span>Categoria</span>
              <span>Cupos</span>
              <span>Ficha</span>
              <span>Accion</span>
            </div>
            {adminEvents.map((event) => (
              <div className="admin-table-row" key={event.id}>
                <span>
                  <strong>{event.title}</strong>
                  <small>{event.date} - {event.venue}</small>
                </span>
                <span>
                  <mark>{event.state}</mark>
                </span>
                <span>{event.category}</span>
                <span>{event.spots}</span>
                <span>{event.completeness}%</span>
                <span>
                  <button className="table-action" type="button">
                    Editar
                  </button>
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-bottom-grid">
          <article className="admin-panel" id="observaciones">
            <span className="section-kicker">Alertas</span>
            <h2>Atencion operativa</h2>
            <div className="admin-alerts">
              {operationalAlerts.map((alert) => (
                <p key={alert}>{alert}</p>
              ))}
            </div>
          </article>

          <article className="admin-panel" id="borradores">
            <span className="section-kicker">Borradores</span>
            <h2>Acciones pendientes</h2>
            <div className="report-list">
              <span>Completar direccion y mapa del evento 5K</span>
              <span>Confirmar aforo de Mesa de Voluntariado</span>
              <span>Validar requisitos del taller de Marinera</span>
              <span>Programar fecha de publicacion de borradores</span>
            </div>
          </article>
        </section>
      </main>
    </section>
  );
}

export default AdminDashboard;
