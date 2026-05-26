import { useEffect, useMemo, useRef, useState } from 'react';
import municipalLogo from '../../assets/images/municipalidad-logo.png';
import calendarCheck from '../../assets/icons/calendar-check.png';
import clipboardCheck from '../../assets/icons/clipboard-check.png';
import fileEdit from '../../assets/icons/file-edit.png';
import triangleAlert from '../../assets/icons/triangle-alert.png';
import { adminEvents, formatEventState } from './dashboardData';
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
    label: 'En revision',
    tone: 'is-review',
    trend: 'pendientes del directivo',
    value: adminEvents.filter((event) => event.state === 'EN_REVISION').length,
  },
  {
    icon: triangleAlert,
    label: 'Observados',
    tone: 'is-observed',
    trend: 'requieren correcciones',
    value: adminEvents.filter((event) => event.state === 'OBSERVADO').length,
  },
];

const operationalAlerts = [
  'Carrera Vecinal 5K requiere publicar punto de partida final.',
  'Mesa de Voluntariado necesita confirmar responsable municipal.',
  'Taller de Marinera fue observado por el directivo.',
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
    message: 'Ana Torres envio "Carrera 5K" a revision.',
    type: 'Evento enviado a revision',
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

const publicationCriteria = [
  'Llenar la ficha del evento con los datos completos para que el directivo pueda revisarlas.',
  'Las fichas en estado Observado son las que se tienen que editar para que sean revisadas nuevamente',
  'Los borradores incompletos deben quedar fuera de la agenda ciudadana.',
];

const stateOptions = ['Todos', ...new Set(adminEvents.map((event) => event.state))];
const categoryOptions = ['Todas', ...new Set(adminEvents.map((event) => event.category))];

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

  if (!control || control instanceof RadioNodeList) {
    return '';
  }

  return control.value;
}

function hasNamedFile(form, name) {
  const control = getNamedFormControl(form, name);

  return Boolean(control?.files?.length);
}

function getMissingReviewFields(form, existingEvent = null) {
  const requiredFields = [
    ['title', 'Titulo del evento'],
    ['category', 'Categoria'],
    ['area', 'Area responsable'],
    ['description', 'Descripcion'],
    ['eventStart', 'Inicio o fecha del evento'],
    ['eventEnd', 'Fin u hora del evento'],
    ['registrationStart', 'Inicio de inscripcion'],
    ['registrationEnd', 'Fin de inscripcion'],
    ['capacity', 'Aforo maximo'],
    ['referenceCost', 'Costo referencial'],
    ['venue', 'Lugar del evento'],
    ['district', 'Distrito'],
    ['address', 'Direccion'],
    ['reference', 'Referencia de ubicacion'],
  ];
  const missingFields = requiredFields
    .filter(([fieldName]) => !hasValue(getNamedFormValue(form, fieldName)))
    .map(([, label]) => label);
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

function AdminDashboard({ onLogout }) {
  const [currentAdminView, setCurrentAdminView] = useState('dashboard');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState('all');
  const [pendingEventAction, setPendingEventAction] = useState(null);
  const [validationIssue, setValidationIssue] = useState(null);
  const [selectedAdminEvent, setSelectedAdminEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('Todos');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const notificationMenuRef = useRef(null);
  const unreadNotifications = adminNotifications.filter(
    (notification) => notification.unread,
  ).length;
  const visibleNotifications =
    notificationFilter === 'unread'
      ? adminNotifications.filter((notification) => notification.unread)
      : adminNotifications;
  const isEventFormView =
    currentAdminView === 'new-event' || currentAdminView === 'edit-event';

  useEffect(() => {
    if (!isNotificationsOpen) {
      return undefined;
    }

    function closeNotificationsOnOutsideClick(event) {
      if (!notificationMenuRef.current?.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    }

    document.addEventListener('mousedown', closeNotificationsOnOutsideClick);

    return () => {
      document.removeEventListener('mousedown', closeNotificationsOnOutsideClick);
    };
  }, [isNotificationsOpen]);

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

        {isEventFormView ? (
          <nav
            className="admin-nav"
            aria-label={
              currentAdminView === 'new-event'
                ? 'Secciones de creacion de evento'
                : 'Secciones de edicion de evento'
            }
          >
            <a className="active" href="#datos-generales">Datos generales</a>
            <a href="#programacion">Programacion</a>
            <a href="#ubicacion">Ubicacion</a>
            <a href="#recursos">Recursos</a>
            {currentAdminView === 'edit-event' && (
              <a href="#observaciones-edicion">Observaciones</a>
            )}
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
            <a className="active" href="#resumen">Resumen</a>
            <a href="#eventos-admin">Eventos</a>
            <a href="#borradores">Borradores</a>
            <a href="#observaciones">Observaciones</a>
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
        ) : (
          <>
            <header className="admin-topbar">
              <div>
                <span className="section-kicker">Panel administrativo</span>
                <h1 id="admin-title">Gestion municipal de eventos</h1>
              </div>
              <div className="admin-topbar-actions">
                <div className="notification-menu" ref={notificationMenuRef}>
                  <button
                    aria-expanded={isNotificationsOpen}
                    aria-label={`${unreadNotifications} notificaciones sin leer`}
                    className="notification-button"
                    type="button"
                    onClick={() => setIsNotificationsOpen((isOpen) => !isOpen)}
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24">
                      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    <span>{unreadNotifications}</span>
                  </button>
                  {isNotificationsOpen && (
                    <div className="notification-dropdown" role="menu">
                      <div className="notification-dropdown-header">
                        <strong>Notificaciones</strong>
                        <div className="notification-tabs" role="tablist">
                          <button
                            aria-selected={notificationFilter === 'all'}
                            className={notificationFilter === 'all' ? 'active' : ''}
                            type="button"
                            onClick={() => setNotificationFilter('all')}
                          >
                            Todas
                            <span>{adminNotifications.length}</span>
                          </button>
                          <button
                            aria-selected={notificationFilter === 'unread'}
                            className={notificationFilter === 'unread' ? 'active' : ''}
                            type="button"
                            onClick={() => setNotificationFilter('unread')}
                          >
                            No leidas
                            <span>{unreadNotifications}</span>
                          </button>
                        </div>
                      </div>
                      <div className="notification-list">
                        {visibleNotifications.map((notification) => (
                          <article className="notification-item" key={notification.id}>
                            <span aria-hidden="true" className="notification-item-icon">
                              <svg viewBox="0 0 24 24">
                                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                              </svg>
                            </span>
                            <div>
                              <strong>{notification.type}</strong>
                              <p>{notification.message}</p>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  className="admin-new-event-action"
                  type="button"
                  onClick={() => {
                    setIsNotificationsOpen(false);
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
                  Categoria
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
                  <span>Categoria</span>
                  <span>Cupos</span>
                  <span>Ficha</span>
                  <span>Accion</span>
                </div>
                {filteredAdminEvents.map((event) => (
                  <div className="admin-table-row" key={event.id}>
                    <span>
                      <strong>{event.title}</strong>
                      <small>{event.date} - {event.venue}</small>
                    </span>
                    <span>
                      <mark>{formatEventState(event.state)}</mark>
                    </span>
                    <span>{event.category}</span>
                    <span>{event.spots}</span>
                    <span>
                      <CompletenessMeter compact value={event.completeness} />
                    </span>
                    <span>
                      <button
                        aria-label={`Editar ${event.title}`}
                        className="table-icon-action"
                        title="Editar evento"
                        type="button"
                        onClick={() => {
                          setSelectedAdminEvent(event);
                          setCurrentAdminView('edit-event');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        <EditIcon />
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="admin-bottom-grid">
              <article className="admin-panel validation-panel">
                <span className="section-kicker">Criterios de publicación de eventos</span>
                <div className="admin-checklist">
                  {publicationCriteria.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
              </article>

              <article className="admin-panel" id="observaciones">
                <span className="section-kicker">Alertas</span>
                <div className="admin-alerts">
                  {operationalAlerts.map((alert) => (
                    <p key={alert}>{alert}</p>
                  ))}
                </div>
              </article>

              <article className="admin-panel admin-wide-panel" id="borradores">
                <span className="section-kicker">Acciones pendientes</span>
                <div className="report-list">
                  <span>Completar direccion y mapa del evento 5K</span>
                  <span>Confirmar aforo de Mesa de Voluntariado</span>
                  <span>Corregir observaciones del taller de Marinera</span>
                  <span>Enviar borradores completos a revision directiva</span>
                </div>
              </article>
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

function CompletenessMeter({ compact = false, value }) {
  return (
    <span
      aria-label={`Ficha completa al ${value}%`}
      className={compact ? 'completeness-meter compact' : 'completeness-meter'}
    >
      <span className="completeness-meter-track">
        <span style={{ width: `${value}%` }} />
      </span>
      <strong>{value}%</strong>
    </span>
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

function NewEventView({ onBack, onRequestAction, onValidationIssue }) {
  const formRef = useRef(null);

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
        <button className="admin-secondary-action" type="button" onClick={onBack}>
          Volver
        </button>
      </header>

      <form
        className="event-form"
        ref={formRef}
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
                Titulo del evento
                <input name="title" placeholder="Ej. Festival Cultural Barrial" />
              </label>
              <label className="form-field">
                Categoria
                <select defaultValue="" name="category">
                  <option disabled value="">Seleccionar categoria</option>
                  {categoryOptions
                    .filter((category) => category !== 'Todas')
                    .map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                </select>
              </label>
              <label className="form-field">
                Area responsable
                <select defaultValue="" name="area">
                  <option disabled value="">Seleccionar area</option>
                  <option>Cultura</option>
                  <option>Participacion Vecinal</option>
                  <option>Deporte</option>
                  <option>Comunicaciones</option>
                </select>
              </label>
              <label className="form-field span-2">
                Descripcion
                <textarea
                  name="description"
                  placeholder="Describe el objetivo, publico y actividades principales del evento."
                />
              </label>
            </div>
          </article>

          <article className="event-form-section" id="programacion">
            <div className="form-section-heading">
              <span className="section-kicker">Programacion</span>
              <h2>Fechas e inscripcion</h2>
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
                Inicio de inscripcion
                <input name="registrationStart" type="datetime-local" />
              </label>
              <label className="form-field">
                Fin de inscripcion
                <input name="registrationEnd" type="datetime-local" />
              </label>
              <label className="form-field">
                Aforo maximo
                <input min="1" name="capacity" placeholder="120" type="number" />
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
                Estado inicial
                <input disabled value="BORRADOR" />
              </label>
            </div>
          </article>

          <article className="event-form-section" id="ubicacion">
            <div className="form-section-heading">
              <span className="section-kicker">Ubicacion</span>
              <h2>Lugar del evento</h2>
            </div>
            <div className="form-grid">
              <label className="form-field">
                Nombre del lugar
                <input name="venue" placeholder="Plaza principal" />
              </label>
              <label className="form-field">
                Distrito
                <input name="district" value="San Miguel" readOnly />
              </label>
              <label className="form-field span-2">
                Direccion
                <input name="address" placeholder="Av. Universitaria 1801" />
              </label>
              <label className="form-field span-2">
                Referencia
                <input
                  name="reference"
                  placeholder="Frente al parque, ingreso por puerta principal"
                />
              </label>
            </div>
          </article>

          <article className="event-form-section" id="recursos">
            <div className="form-section-heading">
              <span className="section-kicker">Recursos</span>
              <h2>Material del evento</h2>
            </div>
            <div className="resource-grid">
              <label className="resource-upload">
                <strong>Imagen de portada</strong>
                <span>IMAGEN_PORTADA</span>
                <input name="coverImage" type="file" />
              </label>
              <label className="resource-upload">
                <strong>Afiche</strong>
                <span>AFICHE</span>
                <input name="poster" type="file" />
              </label>
              <label className="resource-upload">
                <strong>Documento</strong>
                <span>DOCUMENTO</span>
                <input name="document" type="file" />
              </label>
            </div>
          </article>
        </section>

        <aside className="event-form-aside">
          <section className="admin-panel">
            <span className="section-kicker">Estado</span>
            <h2>Borrador</h2>
            <p>
              El evento se guardara como BORRADOR hasta que la ficha este lista
              para enviarse a revision directiva.
            </p>
          </section>

          <section className="admin-panel">
            <span className="section-kicker">Validacion</span>
            <h2>Antes de enviar</h2>
            <div className="admin-checklist">
              <p>Completar titulo, categoria y descripcion.</p>
              <p>Definir fechas del evento e inscripcion.</p>
              <p>Registrar aforo, costo referencial y ubicacion exacta.</p>
              <p>Adjuntar portada o afiche principal.</p>
            </div>
          </section>

          <div className="event-form-actions">
            <button
              className="admin-secondary-action"
              type="button"
              onClick={() => onRequestAction('draft')}
            >
              Guardar borrador
            </button>
            <button
              className="admin-primary-action"
              type="button"
              onClick={requestReview}
            >
              Enviar a revision
            </button>
          </div>
        </aside>
      </form>
    </section>
  );
}

function EditEventView({ event, onBack, onRequestAction, onValidationIssue }) {
  const formRef = useRef(null);
  const canSendToReview = ['BORRADOR', 'OBSERVADO'].includes(event.state);

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
          <span className="section-kicker">Edicion de evento</span>
          <h1 id="edit-event-title">Editar evento municipal</h1>
        </div>
        <button className="admin-secondary-action" type="button" onClick={onBack}>
          Volver
        </button>
      </header>

      <form
        className="event-form"
        ref={formRef}
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
                Titulo del evento
                <input defaultValue={event.title} name="title" />
              </label>
              <label className="form-field">
                Categoria
                <select defaultValue={event.category} name="category">
                  {categoryOptions
                    .filter((category) => category !== 'Todas')
                    .map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                </select>
              </label>
              <label className="form-field">
                Area responsable
                <select defaultValue={event.organizer} name="area">
                  <option>{event.organizer}</option>
                  <option>Cultura</option>
                  <option>Participacion Vecinal</option>
                  <option>Deporte</option>
                  <option>Comunicaciones</option>
                </select>
              </label>
              <label className="form-field span-2">
                Descripcion
                <textarea defaultValue={event.description} name="description" />
              </label>
            </div>
          </article>

          <article className="event-form-section" id="programacion">
            <div className="form-section-heading">
              <span className="section-kicker">Programacion</span>
              <h2>Fechas e inscripcion</h2>
            </div>
            <div className="form-grid">
              <label className="form-field">
                Fecha visible
                <input defaultValue={event.date} name="eventStart" />
              </label>
              <label className="form-field">
                Hora visible
                <input defaultValue={event.time} name="eventEnd" />
              </label>
              <label className="form-field">
                Inicio de inscripcion
                <input
                  defaultValue={event.registrationStart}
                  name="registrationStart"
                  type="datetime-local"
                />
              </label>
              <label className="form-field">
                Fin de inscripcion
                <input
                  defaultValue={event.registrationEnd}
                  name="registrationEnd"
                  type="datetime-local"
                />
              </label>
              <label className="form-field">
                Aforo maximo
                <input
                  defaultValue={event.spots}
                  min="1"
                  name="capacity"
                  type="number"
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
                Estado actual
                <input disabled value={event.state} />
              </label>
            </div>
          </article>

          <article className="event-form-section" id="ubicacion">
            <div className="form-section-heading">
              <span className="section-kicker">Ubicacion</span>
              <h2>Lugar del evento</h2>
            </div>
            <div className="form-grid">
              <label className="form-field">
                Nombre del lugar
                <input defaultValue={event.venue} name="venue" />
              </label>
              <label className="form-field">
                Distrito
                <input defaultValue={event.district} name="district" />
              </label>
              <label className="form-field span-2">
                Direccion
                <input defaultValue={event.address} name="address" />
              </label>
              <label className="form-field span-2">
                Referencia
                <input
                  defaultValue={event.locationReference}
                  name="reference"
                  placeholder="Referencia para orientar al ciudadano"
                />
              </label>
            </div>
          </article>

          <article className="event-form-section" id="recursos">
            <div className="form-section-heading">
              <span className="section-kicker">Recursos</span>
              <h2>Material del evento</h2>
            </div>
            <div className="resource-grid">
              <label className="resource-upload">
                <strong>Actualizar portada</strong>
                <span>IMAGEN_PORTADA</span>
                <input name="coverImage" type="file" />
              </label>
              <label className="resource-upload">
                <strong>Actualizar afiche</strong>
                <span>AFICHE</span>
                <input name="poster" type="file" />
              </label>
              <label className="resource-upload">
                <strong>Adjuntar documento</strong>
                <span>DOCUMENTO</span>
                <input name="document" type="file" />
              </label>
            </div>
          </article>

          <article className="event-form-section" id="observaciones-edicion">
            <div className="form-section-heading">
              <span className="section-kicker">Observaciones</span>
              <h2>Control de cambios</h2>
            </div>
            <div className="admin-checklist">
              {event.state === 'OBSERVADO' ? (
                <p>
                  El directivo observo este evento. Corrige la ficha y enviala
                  nuevamente a revision.
                </p>
              ) : (
                <p>
                  Registra ajustes puntuales y guarda los cambios para mantener
                  actualizada la ficha municipal.
                </p>
              )}
              <p>Ultima actualizacion: {event.lastUpdate}</p>
            </div>
          </article>
        </section>

        <aside className="event-form-aside">
          <section className="admin-panel">
            <span className="section-kicker">Ficha</span>
            <h2>{event.completeness}% completa</h2>
            <CompletenessMeter value={event.completeness} />
          </section>

          <section className="admin-panel">
            <span className="section-kicker">Estado actual</span>
            <h2>{formatEventState(event.state)}</h2>
            <p>
              {event.state === 'PUBLICADO'
                ? 'Este evento ya es visible para el ciudadano. Los cambios deben mantenerse consistentes con la informacion publicada.'
                : 'Puedes actualizar la ficha y conservarla dentro del flujo administrativo correspondiente.'}
            </p>
          </section>

          <section className="admin-panel">
            <span className="section-kicker">Revision</span>
            <h2>Antes de guardar</h2>
            <div className="admin-checklist">
              <p>Validar datos principales y categoria.</p>
              <p>Confirmar fechas, cupos, costo referencial y lugar del evento.</p>
              <p>Actualizar recursos si la ficha fue observada.</p>
            </div>
          </section>

          <div className="event-form-actions">
            <button
              className="admin-secondary-action"
              type="button"
              onClick={() => onRequestAction('save-changes')}
            >
              Guardar cambios
            </button>
            {canSendToReview && (
              <button
                className="admin-primary-action"
                type="button"
                onClick={requestReview}
              >
                Enviar a revision
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
        <h2 id="validation-issue-title">Completa la informacion requerida</h2>
        <p>
          Para enviar este evento a revision directiva, primero registra los
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
    ? 'Si, guardar cambios'
    : isReview
      ? 'Si, enviar a revision'
      : 'Si, guardar borrador';

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
              ? 'Enviar a revision'
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
    return `Estas seguro de guardar los cambios de "${eventTitle}"?`;
  }

  if (actionType === 'review-changes') {
    return `Estas seguro de enviar "${eventTitle}" a revision?`;
  }

  if (actionType === 'review') {
    return 'Estas seguro de enviar este evento a revision?';
  }

  return 'Estas seguro de guardar este evento como borrador?';
}

function getEventActionDescription(actionType, isCreate) {
  if (actionType === 'save-changes') {
    return 'Los cambios quedaran registrados en la ficha del evento y volveras a la gestion municipal de eventos.';
  }

  if (actionType === 'review-changes') {
    return 'La ficha corregida pasara a EN_REVISION para que el usuario directivo pueda aprobarla u observarla.';
  }

  if (actionType === 'review') {
    return 'El evento pasara a EN_REVISION para que el usuario directivo pueda aprobarlo u observarlo antes de publicarlo.';
  }

  return isCreate
    ? 'El evento permanecera como BORRADOR y podras completarlo o editarlo antes de enviarlo al directivo.'
    : 'La ficha conservara sus cambios como BORRADOR dentro del flujo administrativo.';
}

export default AdminDashboard;
