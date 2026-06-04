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

function getEventChecklist(event, options = {}) {
  const observationAddressed = options.observationAddressed ?? false;
  const checks = [
    {
      complete:
        hasValue(event.title) &&
        hasValue(event.category) &&
        hasValue(event.organizer) &&
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
        hasValidAforo(event),
      completeLabel: 'Fechas e inscripción completas',
      pendingLabel: 'Falta programación o aforo',
    },
    {
      complete:
        hasValue(event.venue) &&
        hasValue(event.district) &&
        hasValue(event.address),
      completeLabel: 'Ubicación registrada',
      pendingLabel: 'Falta completar ubicación',
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
  const checks = [
    {
      complete:
        hasValue(event.title) &&
        hasValue(event.category) &&
        hasValue(event.organizer) &&
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
        hasValue(event.referenceCost),
      completeLabel: 'Programación e inscripción completas',
    },
    {
      complete:
        hasValue(event.venue) &&
        hasValue(event.district) &&
        hasValue(event.address) &&
        hasValue(event.locationReference),
      completeLabel: 'Ubicación registrada',
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

  return {
    ...event,
    address: getNamedFormValue(form, 'address'),
    category: getNamedFormValue(form, 'category'),
    date: getNamedFormValue(form, 'eventStart'),
    descripcion_breve: getNamedFormValue(form, 'descripcion_breve'),
    description: getNamedFormValue(form, 'description'),
    district: getNamedFormValue(form, 'district'),
    organizer: getNamedFormValue(form, 'area'),
    referenceCost: getNamedFormValue(form, 'referenceCost'),
    registrationEnd: getNamedFormValue(form, 'registrationEnd'),
    registrationStart: getNamedFormValue(form, 'registrationStart'),
    resources: {
      ...event.resources,
      AFICHE: Boolean(event.resources?.AFICHE || hasNamedFile(form, 'poster')),
      IMAGEN_PORTADA: Boolean(
        event.resources?.IMAGEN_PORTADA || hasNamedFile(form, 'coverImage'),
      ),
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
    venue: getNamedFormValue(form, 'venue'),
    locationReference: getNamedFormValue(form, 'reference'),
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
    ['area', 'Área responsable'],
    ['descripcion_breve', 'Descripción breve'],
    ['description', 'Descripción'],
    ['eventStart', 'Inicio o fecha del evento'],
    ['eventEnd', 'Fin u hora del evento'],
    ['registrationStart', 'Inicio de inscripción'],
    ['registrationEnd', 'Fin de inscripción'],
    ['referenceCost', 'Costo referencial'],
    ['venue', 'Lugar del evento'],
    ['district', 'Distrito'],
    ['address', 'Dirección'],
    ['reference', 'Referencia de ubicación'],
  ];
  const missingFields = requiredFields
    .filter(([fieldName]) => !hasValue(getNamedFormValue(form, fieldName)))
    .map(([, label]) => label);
  const shortDescription = getNamedFormValue(form, 'descripcion_breve');
  const capacityMode = getNamedFormValue(form, 'capacityMode');
  const attendanceGoalEnabled = isNamedChecked(form, 'attendanceGoalEnabled');
  const attendanceGoalType = getNamedFormValue(form, 'attendanceGoalType');
  const attendanceGoalValue = Number(getNamedFormValue(form, 'attendanceGoalValue'));

  if (shortDescription.length > 255) {
    missingFields.push('Descripción breve de máximo 255 caracteres');
  }

  if (capacityMode !== 'none' && Number(getNamedFormValue(form, 'capacity')) <= 0) {
    missingFields.push('Aforo máximo');
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
  const [currentAdminView, setCurrentAdminView] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [pendingEventAction, setPendingEventAction] = useState(null);
  const [validationIssue, setValidationIssue] = useState(null);
  const [selectedAdminEvent, setSelectedAdminEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('Todos');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [activePendingPopover, setActivePendingPopover] = useState(null);
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
            <a className="active" href="#datos-generales">Datos generales</a>
            <a href="#programacion">Programación</a>
            <a href="#evaluacion">Evaluación</a>
            <a href="#ubicacion">Ubicación</a>
            <a href="#recursos">Recursos</a>
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
                <select defaultValue="" name="area">
                  <option disabled value="">Seleccionar área</option>
                  <option>Cultura</option>
                  <option>Participación Vecinal</option>
                  <option>Deporte</option>
                  <option>Comunicaciones</option>
                </select>
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
                Estado inicial
                <input disabled value="BORRADOR" />
              </label>
            </div>
          </article>

          <EvaluationTrackingSection
            capacityMode={capacityMode}
            goalEnabled={goalEnabled}
            goalType={goalType}
            surveyCommentsEnabled={surveyCommentsEnabled}
            surveyEnabled={surveyEnabled}
          />

          <article className="event-form-section" id="ubicacion">
            <div className="form-section-heading">
              <span className="section-kicker">Ubicación</span>
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
                Dirección
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
              <ResourceUploadCard
                accept=".pdf,.doc,.docx"
                label="Documento"
                name="document"
                resourceType="DOCUMENTO"
              />
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
  const [capacityMode, setCapacityMode] = useState(initialCapacityMode);
  const [goalEnabled, setGoalEnabled] = useState(Boolean(event.metaTipo));
  const [goalType, setGoalType] = useState(event.metaTipo ?? 'CANTIDAD_ASISTENTES');
  const [surveyEnabled, setSurveyEnabled] = useState(Boolean(event.encuestaSatisfaccionHabilitada));
  const [surveyCommentsEnabled, setSurveyCommentsEnabled] = useState(Boolean(event.encuestaComentarioHabilitado));
  const [checklistEvent, setChecklistEvent] = useState(() => event);
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
    setGoalEnabled(isNamedChecked(formRef.current, 'attendanceGoalEnabled'));
    setGoalType(getNamedFormValue(formRef.current, 'attendanceGoalType') || 'CANTIDAD_ASISTENTES');
    setSurveyEnabled(isNamedChecked(formRef.current, 'surveyEnabled'));
    setSurveyCommentsEnabled(isNamedChecked(formRef.current, 'surveyCommentsEnabled'));
    setChecklistEvent(getChecklistEventFromForm(formRef.current, event));
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
                <select defaultValue={event.organizer} name="area">
                  <option>{event.organizer}</option>
                  <option>Cultura</option>
                  <option>Participación Vecinal</option>
                  <option>Deporte</option>
                  <option>Comunicaciones</option>
                </select>
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
                Fecha visible
                <input defaultValue={event.date} name="eventStart" />
              </label>
              <label className="form-field">
                Hora visible
                <input defaultValue={event.time} name="eventEnd" />
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
                Estado actual
                <input disabled value={event.state} />
              </label>
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

          <article className="event-form-section" id="ubicacion">
            <div className="form-section-heading">
              <span className="section-kicker">Ubicación</span>
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
                Dirección
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
              <ResourceUploadCard
                accept=".pdf,.doc,.docx"
                label="Adjuntar documento"
                name="document"
                resourceType="DOCUMENTO"
              />
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
