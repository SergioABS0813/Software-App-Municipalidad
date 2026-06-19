import { useEffect, useMemo, useState } from 'react';
import municipalLogo from '../../assets/images/municipalidad-logo.png';
import { getApiErrorMessage } from '../../services/api/api';
import { getEventosOperativoHoy } from '../../services/dashboardService';
import { DashboardSkeleton, ErrorState } from '../../components/feedback/LoadingStates';
import './AdminDashboard.css';
import './OperativoDashboard.css';

const fallbackOperativeUser = {
  id: 'operativo-1',
  fullName: 'Carlos Ramirez',
  role: 'OPERATIVO',
};

function getOperativeUserInitials(name) {
  const nameParts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (nameParts.length === 0) {
    return 'OP';
  }

  return `${nameParts[0][0] ?? ''}${nameParts.at(-1)?.[0] ?? ''}`.toUpperCase();
}

function formatOperativeUserRole(role) {
  return role === 'OPERATIVO' ? 'Operativo' : role ?? 'Operativo';
}

function parseEventDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function isSameLocalDay(firstDate, secondDate) {
  return (
    firstDate?.getFullYear() === secondDate.getFullYear() &&
    firstDate?.getMonth() === secondDate.getMonth() &&
    firstDate?.getDate() === secondDate.getDate()
  );
}

function getEventControlRange(event) {
  return {
    end: parseEventDate(event.eventEndAt ?? event.operativeEndAt ?? event.endAt),
    start: parseEventDate(event.eventStartAt ?? event.operativeStartAt ?? event.startAt),
  };
}

function getOperativeState(event, now) {
  const { end, start } = getEventControlRange(event);

  if (event.state === 'EN_CURSO') {
    return 'EN_CURSO';
  }

  if (start && end && now >= start && now <= end) {
    return 'EN_CURSO';
  }

  return event.state;
}

function getOperativeStatusLabel(event, now) {
  const { end, start } = getEventControlRange(event);

  if (end && now > end) {
    return 'Finalizado';
  }

  if (start && now < start) {
    return 'Aún no inicia';
  }

  if (event.operativeState === 'EN_CURSO' || (start && end && now >= start && now <= end)) {
    return 'En validación';
  }

  return event.state === 'PUBLICADO' ? 'Aún no inicia' : 'En validación';
}

function formatEventTimeRange(event) {
  const { end, start } = getEventControlRange(event);

  if (!start || !end) {
    return event.time ?? 'Horario por confirmar';
  }

  return `${start.toLocaleTimeString('es-PE', {
    hour: 'numeric',
    minute: '2-digit',
  })} - ${end.toLocaleTimeString('es-PE', {
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}

function isEventToday(event, now) {
  const { end, start } = getEventControlRange(event);

  if (!start && !end) {
    return false;
  }

  if (!start || !end) {
    return isSameLocalDay(start ?? end, now);
  }

  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  return start < dayEnd && end >= dayStart;
}

function buildOperativeEvent(event, now) {
  const registered = event.registered ?? Math.max(Math.round((event.spots ?? 0) * 0.82), 0);
  const qrValidated = event.qrValidated ?? Math.round(registered * 0.42);
  const manualValidated = event.manualValidated ?? Math.round(registered * 0.08);
  const revokedQr = event.revokedQr ?? 1;
  const expiredQr = event.expiredQr ?? 2;

  return {
    ...event,
    operativeState: getOperativeState(event, now),
    expiredQr,
    manualValidated,
    pendingAccess: Math.max(registered - qrValidated - manualValidated, 0),
    qrValidated,
    registered,
    revokedQr,
    totalValidated: qrValidated + manualValidated,
  };
}

const initialRecentValidations = [
  {
    code: 'QR-SM-0087',
    method: 'QR',
    origin: 'ONLINE',
    person: 'Mariana Torres',
    status: 'VALIDADA',
    time: '10:12 a.m.',
  },
  {
    code: 'MAN-0021',
    method: 'MANUAL',
    origin: 'ONLINE',
    person: 'Luis Ramírez',
    status: 'VALIDADA',
    time: '10:18 a.m.',
  },
  {
    code: 'QR-SM-0044',
    method: 'QR',
    origin: 'ONLINE',
    person: 'Rosa Salazar',
    status: 'ANULADA',
    time: '10:23 a.m.',
  },
  {
    code: 'INS-MAN-003',
    method: 'MANUAL',
    origin: 'MANUAL',
    person: 'Carmen Paredes',
    status: 'VALIDADA',
    time: '10:31 a.m.',
  },
];

const operativeSectionIds = [
  'control-acceso',
  'validacion-manual',
  'inscripcion-manual',
  'validaciones-recientes',
];

function buildValidationFeedback(type, detail = {}) {
  const feedbackMap = {
    CLOSED: {
      message: 'El evento no está disponible para validación.',
      title: 'Evento cerrado',
      tone: 'error',
    },
    DUPLICATE: {
      message: 'Esta asistencia ya fue validada anteriormente.',
      title: 'Asistencia duplicada',
      tone: 'warning',
    },
    FULL: {
      message: 'El evento no tiene cupos disponibles.',
      title: 'Sin cupos',
      tone: 'warning',
    },
    NOT_FOUND: {
      message: 'No se encontró una inscripción asociada al código ingresado.',
      title: 'Código no encontrado',
      tone: 'error',
    },
    OTHER_EVENT: {
      message: 'El código pertenece a otro evento.',
      title: 'Evento no autorizado',
      tone: 'info',
    },
    SUCCESS: {
      message: 'Asistencia validada correctamente.',
      title: 'Validación exitosa',
      tone: 'success',
    },
    ANNULLED: {
      message: 'La validación fue anulada y se conservó la trazabilidad del registro.',
      title: 'Validación anulada',
      tone: 'info',
    },
  };

  return {
    ...feedbackMap[type],
    citizenName: detail.citizenName,
    code: detail.code,
    source: detail.source ?? 'scanner',
  };
}

function getMockValidationResult(code, event) {
  const normalizedCode = String(code ?? '').trim().toUpperCase();

  if (!event || !['PUBLICADO', 'EN_CURSO'].includes(event.operativeState)) {
    return buildValidationFeedback('CLOSED', { code: normalizedCode });
  }

  if ((event.aforoMaximo ?? event.spots) && event.pendingAccess <= 0) {
    return buildValidationFeedback('FULL', { code: normalizedCode });
  }

  if (normalizedCode.includes('DUP')) {
    return buildValidationFeedback('DUPLICATE', {
      citizenName: 'Mariana Torres',
      code: normalizedCode,
    });
  }

  if (normalizedCode.includes('OTRO')) {
    return buildValidationFeedback('OTHER_EVENT', { code: normalizedCode });
  }

  if (normalizedCode.includes('NO') || normalizedCode.includes('404')) {
    return buildValidationFeedback('NOT_FOUND', { code: normalizedCode });
  }

  return buildValidationFeedback('SUCCESS', {
    citizenName: 'Luis Ramirez',
    code: normalizedCode || 'QR-SM-0091',
  });
}

function OperativoDashboard({ onLogout, user }) {
  const operativeUser = user?.id ? user : { ...fallbackOperativeUser, ...user };
  const operativeUserName =
    operativeUser.fullName || operativeUser.name || fallbackOperativeUser.fullName;
  const now = useMemo(() => new Date(), []);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarDrawerOpen, setIsSidebarDrawerOpen] = useState(false);
  const [activeOperativeSection, setActiveOperativeSection] = useState('control-acceso');
  const [operativeEventsData, setOperativeEventsData] = useState([]);
  const [isLoadingOperativeEvents, setIsLoadingOperativeEvents] = useState(true);
  const [operativeEventsError, setOperativeEventsError] = useState('');
  const [operativeEventsReloadKey, setOperativeEventsReloadKey] = useState(0);
  const operativeEvents = useMemo(
    () =>
      operativeEventsData
        .filter((event) => {
          const operativeState = getOperativeState(event, now);

          return (
            isEventToday(event, now) &&
            ['PUBLICADO', 'EN_CURSO'].includes(operativeState) &&
            !['FINALIZADO', 'CANCELADO'].includes(event.state)
          );
        })
        .map((event) => buildOperativeEvent(event, now)),
    [now, operativeEventsData],
  );
  const activeOperativeEvent = operativeEvents[0] ?? null;
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [scannerStatus, setScannerStatus] = useState('idle');
  const [isManualRegistrationOpen, setIsManualRegistrationOpen] = useState(false);
  const [validationFeedback, setValidationFeedback] = useState(null);
  const [validations, setValidations] = useState(initialRecentValidations);
  const [pendingOperativeAction, setPendingOperativeAction] = useState(null);
  const [pendingAnnulment, setPendingAnnulment] = useState(null);
  const [operativeValidationIssue, setOperativeValidationIssue] = useState(null);
  const selectedEvent =
    operativeEvents.find((event) => event.id === selectedEventId) ??
    activeOperativeEvent;
  const hasAuthorizedEvent = Boolean(selectedEvent);
  const validValidationCount = validations.filter(
    (validation) => validation.status === 'VALIDADA',
  ).length;
  const qrValidationCount = validations.filter(
    (validation) => validation.status === 'VALIDADA' && validation.method === 'QR',
  ).length;
  const manualValidationCount = validations.filter(
    (validation) => validation.status === 'VALIDADA' && validation.method === 'MANUAL',
  ).length;
  const registeredCount = selectedEvent?.registered ?? 0;
  const pendingAccessCount = Math.max(registeredCount - validValidationCount, 0);
  const aforoMaximo = selectedEvent?.aforoMaximo ?? null;
  const hasCapacityControl = aforoMaximo !== null && aforoMaximo !== undefined;
  const availableCapacity = hasCapacityControl
    ? Math.max(aforoMaximo - validValidationCount, 0)
    : null;

  useEffect(() => {
    let isMounted = true;

    setIsLoadingOperativeEvents(true);
    setOperativeEventsError('');

    getEventosOperativoHoy()
      .then((data) => {
        if (!isMounted) {
          return;
        }

        setOperativeEventsData(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setOperativeEventsData([]);
        setOperativeEventsError(getApiErrorMessage(error, 'No se pudieron cargar tus eventos asignados.'));
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingOperativeEvents(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [operativeEventsReloadKey]);

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
    if (!hasAuthorizedEvent) {
      return undefined;
    }

    const observedSections = operativeSectionIds
      .map((sectionId) => document.getElementById(sectionId))
      .filter(Boolean);

    if (observedSections.length === 0) {
      return undefined;
    }

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((firstEntry, secondEntry) =>
            firstEntry.boundingClientRect.top - secondEntry.boundingClientRect.top,
          )[0];

        if (visibleEntry?.target?.id) {
          setActiveOperativeSection(visibleEntry.target.id);
        }
      },
      {
        rootMargin: '-24% 0px -58% 0px',
        threshold: [0.1, 0.35],
      },
    );

    observedSections.forEach((section) => sectionObserver.observe(section));

    return () => sectionObserver.disconnect();
  }, [hasAuthorizedEvent, isManualRegistrationOpen]);

  function navigateOperativeSection(sectionId) {
    closeSidebarDrawer();
    setActiveOperativeSection(sectionId);
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

  function simulateQrScan() {
    if (!hasAuthorizedEvent) {
      setValidationFeedback(buildValidationFeedback('CLOSED', { source: 'scanner' }));
      return;
    }

    const feedback = getMockValidationResult('QR-SM-0091', selectedEvent);
    setValidationFeedback(feedback);
    setScannerStatus(feedback.tone === 'success' ? 'success' : 'idle');
  }

  function resetScanner() {
    setScannerStatus('idle');
    setValidationFeedback(null);
  }

  function validateManualAttendance(event) {
    event.preventDefault();

    if (!hasAuthorizedEvent) {
      setValidationFeedback(buildValidationFeedback('CLOSED', { source: 'manual' }));
      return;
    }

    const formData = new FormData(event.currentTarget);
    const missingFields = [];

    if (!formData.get('manualCode')?.trim()) {
      missingFields.push('DNI o código de inscripción');
    }

    if (!formData.get('manualReason')) {
      missingFields.push('Motivo de validación');
    }

    if (missingFields.length > 0) {
      setOperativeValidationIssue({
        fields: missingFields,
        title: 'Completa los datos de validación manual',
      });
      return;
    }

    const feedback = {
      ...getMockValidationResult(formData.get('manualCode'), selectedEvent),
      source: 'manual',
    };
    setValidationFeedback(feedback);

    if (feedback.tone === 'success') {
      setPendingOperativeAction('manual-validation');
    }
  }

  function validateManualRegistration(event) {
    event.preventDefault();

    if (!hasAuthorizedEvent) {
      setValidationFeedback(buildValidationFeedback('CLOSED', { source: 'manual' }));
      return;
    }

    const formData = new FormData(event.currentTarget);
    const requiredFields = [
      ['manualDni', 'DNI'],
      ['manualNames', 'Nombres'],
      ['manualLastNames', 'Apellidos'],
      ['manualPhone', 'Celular'],
      ['manualEmail', 'Correo'],
    ];
    const missingFields = requiredFields
      .filter(([field]) => !formData.get(field)?.trim())
      .map(([, label]) => label);

    if (!formData.get('manualDataConsent')) {
      missingFields.push('Aceptacion de tratamiento de datos');
    }

    if (missingFields.length > 0) {
      setOperativeValidationIssue({
        fields: missingFields,
        title: 'Completa los datos de inscripción manual',
      });
      return;
    }

    setValidationFeedback(buildValidationFeedback('SUCCESS', {
      citizenName: `${formData.get('manualNames')} ${formData.get('manualLastNames')}`,
      code: formData.get('manualDni'),
      source: 'manual',
    }));
    setPendingOperativeAction('manual-registration');
  }

  function confirmAnnulment({ reason, detail }) {
    if (!pendingAnnulment) {
      return;
    }

    const annulledAt = new Date().toLocaleString('es-PE', {
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
    });

    setValidations((currentValidations) =>
      currentValidations.map((validation) =>
        validation.code === pendingAnnulment.code
          ? {
            ...validation,
            annulledAt,
            annulmentReason: reason === 'Otro' ? detail : reason,
            status: 'ANULADA',
          }
          : validation,
      ),
    );
    setValidationFeedback(buildValidationFeedback('ANNULLED', {
      code: pendingAnnulment.code,
      citizenName: pendingAnnulment.person,
      source: 'manual',
    }));
    setPendingAnnulment(null);
  }

  return (
    <section
      className={[
        'admin-shell operative-shell',
        isSidebarCollapsed ? 'is-sidebar-collapsed' : '',
        isSidebarDrawerOpen ? 'is-sidebar-drawer-open' : '',
      ].filter(Boolean).join(' ')}
      aria-labelledby="operative-title"
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
            <small>Panel operativo</small>
          </span>
        </button>

        <section className="admin-user-card" aria-label="Usuario autenticado">
          <span className="admin-user-avatar" aria-hidden="true">
            {getOperativeUserInitials(operativeUserName)}
          </span>
          <span className="admin-user-copy">
            <strong>{operativeUserName}</strong>
            <small>{formatOperativeUserRole(operativeUser.role)}</small>
          </span>
        </section>

        <nav className="admin-nav" aria-label="Navegacion operativa">
          {hasAuthorizedEvent && (
            <>
              <a
                className={activeOperativeSection === 'control-acceso' ? 'active' : ''}
                href="#control-acceso"
                onClick={(event) => {
                  event.preventDefault();
                  navigateOperativeSection('control-acceso');
                }}
              >
                Control de acceso
              </a>
              <a
                className={activeOperativeSection === 'inscripcion-manual' ? 'active' : ''}
                href="#inscripcion-manual"
                onClick={(event) => {
                  event.preventDefault();
                  navigateOperativeSection('inscripcion-manual');
                }}
              >
                Inscripción manual
              </a>
              <a
                className={activeOperativeSection === 'validaciones-recientes' ? 'active' : ''}
                href="#validaciones-recientes"
                onClick={(event) => {
                  event.preventDefault();
                  navigateOperativeSection('validaciones-recientes');
                }}
              >
                Validaciones
              </a>
            </>
          )}
          <button className="admin-nav-logout" type="button" onClick={onLogout}>
            Salir del panel
          </button>
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="section-kicker">Panel operativo</span>
            <h1 id="operative-title">Control de asistencia y aforo</h1>
          </div>
          {operativeEvents.length > 1 ? (
            <select
              className="operative-event-select"
              aria-label="Seleccionar evento operativo"
              value={selectedEvent?.id ?? ''}
              onChange={(event) => {
                setSelectedEventId(Number(event.target.value));
                resetScanner();
              }}
            >
              {operativeEvents.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
          ) : hasAuthorizedEvent ? (
            <span className="operative-active-event">{selectedEvent.title}</span>
          ) : null}
        </header>

        {isLoadingOperativeEvents ? (
          <DashboardSkeleton tableColumns={4} />
        ) : operativeEventsError ? (
          <ErrorState
            description={operativeEventsError}
            onRetry={() => setOperativeEventsReloadKey((key) => key + 1)}
          />
        ) : !hasAuthorizedEvent ? (
          <section className="admin-panel operative-empty-state" aria-live="polite">
            <span className="section-kicker">
              {isLoadingOperativeEvents ? 'Cargando asignaciones' : 'Sin asignación activa'}
            </span>
            <h2>
              {isLoadingOperativeEvents
                ? 'Cargando eventos asignados...'
                : 'No tienes eventos asignados para hoy.'}
            </h2>
            <p>
              {operativeEventsError || 'Cuando seas asignado a un evento publicado o en curso, podrás registrar asistencias desde este panel.'}
            </p>
          </section>
        ) : (
          <>
            <section className="admin-panel operative-event-summary" aria-label="Resumen del evento">
              <div className="operative-summary-main">
                <span className="section-kicker">Resumen del evento</span>
                <h2>{selectedEvent.title}</h2>
                <p>
                  {selectedEvent.date} · {formatEventTimeRange(selectedEvent)} · {selectedEvent.venue}
                </p>
              </div>

              <div className="operative-summary-status">
                <span className={`operative-status-badge is-${selectedEvent.operativeState === 'EN_CURSO' ? 'active' : 'pending'}`}>
                  {getOperativeStatusLabel(selectedEvent, now)}
                </span>
                {hasCapacityControl ? (
                  <small>Cupos disponibles: {availableCapacity}</small>
                ) : (
                  <small>Evento sin control de aforo</small>
                )}
              </div>

              <dl className="operative-summary-metrics">
                <div>
                  <dt>Validados</dt>
                  <dd>{validValidationCount} / {registeredCount}</dd>
                </div>
                <div>
                  <dt>Pendientes</dt>
                  <dd>{pendingAccessCount}</dd>
                </div>
                <div>
                  <dt>QR</dt>
                  <dd>{qrValidationCount}</dd>
                </div>
                <div>
                  <dt>Manual</dt>
                  <dd>{manualValidationCount}</dd>
                </div>
                {hasCapacityControl && (
                  <div>
                    <dt>Aforo</dt>
                    <dd>{validValidationCount} / {aforoMaximo}</dd>
                  </div>
                )}
              </dl>
            </section>

            <section className="operative-grid">
              <article className="admin-panel operative-scanner-panel" id="control-acceso">
                <span className="section-kicker">Validación QR</span>
                <h2>Escaneo de ingreso</h2>
                <div className="operative-scanner-box">
                  <div className={scannerStatus === 'success' ? 'scanner-frame success' : 'scanner-frame'}>
                    <span>{scannerStatus === 'success' ? 'QR validado' : 'Listo para escanear'}</span>
                  </div>
                  <div className="operative-scanner-actions">
                    <button className="admin-primary-action" type="button" onClick={simulateQrScan}>
                      Escanear QR
                    </button>
                    <button className="admin-secondary-action" type="button" onClick={resetScanner}>
                      Reiniciar
                    </button>
                  </div>
                  {validationFeedback?.source === 'scanner' && (
                    <ValidationFeedbackCard feedback={validationFeedback} />
                  )}
                </div>
              </article>

              <article className="admin-panel" id="validacion-manual">
            <span className="section-kicker">Validación manual</span>
            <h2>Inscrito sin QR</h2>
            <p className="operative-panel-note">
              Para ciudadanos inscritos que no presentan el código QR.
            </p>
            <form className="manual-validation-form" onSubmit={validateManualAttendance}>
              <label>
                DNI o código de inscripción
                <input name="manualCode" placeholder="Ingrese DNI o código" />
              </label>
              <label>
                Motivo
                <select defaultValue="" name="manualReason">
                  <option disabled value="">Seleccionar motivo</option>
                  <option>QR no legible</option>
                  <option>Participante sin constancia</option>
                  <option>Validación por lista interna</option>
                </select>
              </label>
              <button
                className="admin-primary-action"
                type="submit"
              >
                Validar asistencia
              </button>
            </form>
            {validationFeedback?.source === 'manual' && (
              <ValidationFeedbackCard feedback={validationFeedback} />
            )}
              </article>
            </section>

            <section
              className={`admin-panel manual-registration-panel${isManualRegistrationOpen ? ' is-open' : ''}`}
              id="inscripcion-manual"
            >
              <div className="admin-panel-heading">
                <div>
                  <span className="section-kicker">Inscripción manual</span>
                  <h2>Registrar ciudadano sin inscripción previa</h2>
                </div>
              </div>
              <p className="operative-panel-note">
                Usa este flujo solo cuando el ciudadano no se inscribió en línea y aún hay cupos disponibles.
              </p>

              {!isManualRegistrationOpen ? (
                <button
                  className="admin-secondary-action manual-registration-toggle"
                  type="button"
                  onClick={() => setIsManualRegistrationOpen(true)}
                >
                  Desplegar formulario
                </button>
              ) : (
                <form className="manual-registration-form" onSubmit={validateManualRegistration}>
                  <label>
                    DNI
                    <input maxLength="8" name="manualDni" placeholder="Ingrese DNI" />
                  </label>
                  <label>
                    Nombres
                    <input name="manualNames" placeholder="Nombres del ciudadano" />
                  </label>
                  <label>
                    Apellidos
                    <input name="manualLastNames" placeholder="Apellidos del ciudadano" />
                  </label>
                  <label>
                    Celular
                    <input name="manualPhone" placeholder="Número de contacto" />
                  </label>
                  <label>
                    Correo
                    <input name="manualEmail" placeholder="correo@dominio.com" type="email" />
                  </label>
                  <label className="manual-registration-check">
                    <input name="manualDataConsent" type="checkbox" />
                    Acepta tratamiento de datos para registrar su participación.
                  </label>
                  <div className="manual-registration-actions">
                    <button
                      className="admin-secondary-action"
                      type="button"
                      onClick={() => setIsManualRegistrationOpen(false)}
                    >
                      Ocultar formulario
                    </button>
                    <button
                      className="admin-primary-action"
                      type="submit"
                    >
                      Registrar inscripción y asistencia
                    </button>
                  </div>
                </form>
              )}
            </section>

            <section className="admin-table-panel admin-table-featured" id="validaciones-recientes">
          <div className="admin-panel-heading">
            <div>
              <span className="section-kicker">Trazabilidad</span>
              <h2>Validaciones recientes</h2>
            </div>
          </div>

          <div className="admin-table operative-validation-table">
            <div className="admin-table-row admin-table-head">
              <span>Participante</span>
              <span>Codigo</span>
              <span>Origen</span>
              <span>Metodo</span>
              <span>Estado</span>
              <span>Hora</span>
              <span>Accion</span>
            </div>
            {validations.map((validation) => (
              <div className="admin-table-row" key={validation.code}>
                <span>
                  <strong>{validation.person}</strong>
                  <small>{selectedEvent?.title}</small>
                </span>
                <span>{validation.code}</span>
                <span>{validation.origin}</span>
                <span>{validation.method}</span>
                <span>
                  <mark>{validation.status}</mark>
                  {validation.annulmentReason && (
                    <small>
                      {validation.annulmentReason} · {validation.annulledAt}
                    </small>
                  )}
                </span>
                <span>{validation.time}</span>
                <span>
                  {validation.status === 'VALIDADA' && (
                    <button
                      className="operative-annul-action"
                      type="button"
                      onClick={() => setPendingAnnulment(validation)}
                    >
                      Anular
                    </button>
                  )}
                </span>
              </div>
            ))}
          </div>
            </section>
          </>
        )}

        {pendingOperativeAction && (
          <OperativeActionModal
            action={pendingOperativeAction}
            eventTitle={selectedEvent?.title}
            onCancel={() => setPendingOperativeAction(null)}
            onConfirm={() => setPendingOperativeAction(null)}
          />
        )}

        {operativeValidationIssue && (
          <OperativeValidationIssueModal
            fields={operativeValidationIssue.fields}
            title={operativeValidationIssue.title}
            onClose={() => setOperativeValidationIssue(null)}
          />
        )}

        {pendingAnnulment && (
          <AnnulValidationModal
            validation={pendingAnnulment}
            onCancel={() => setPendingAnnulment(null)}
            onConfirm={confirmAnnulment}
          />
        )}

      </main>
    </section>
  );
}

function ValidationFeedbackCard({ feedback }) {
  return (
    <article
      className={`operative-validation-feedback is-${feedback.tone}`}
      aria-live="polite"
    >
      <span className="operative-feedback-icon" aria-hidden="true" />
      <div>
        <strong>{feedback.title}</strong>
        <p>{feedback.message}</p>
        {(feedback.citizenName || feedback.code) && (
          <small>
            {feedback.citizenName ? `${feedback.citizenName} · ` : ''}
            {feedback.code}
          </small>
        )}
      </div>
    </article>
  );
}

function AnnulValidationModal({ validation, onCancel, onConfirm }) {
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const requiresDetail = reason === 'Otro';
  const canConfirm = reason && (!requiresDetail || detail.trim().length > 0);
  const reasonOptions = [
    'Error de escaneo',
    'Persona equivocada',
    'Duplicado detectado',
    'Registro manual incorrecto',
    'Otro',
  ];

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        aria-labelledby="annul-validation-title"
        aria-modal="true"
        className="confirm-modal annul-validation-modal"
        role="dialog"
      >
        <span className="section-kicker">Anulación controlada</span>
        <h2 id="annul-validation-title">Anular validación</h2>
        <p>
          El registro se conservara visible en la trazabilidad con el motivo de
          anulación.
        </p>

        <dl className="annul-validation-summary">
          <div>
            <dt>Participante</dt>
            <dd>{validation.person}</dd>
          </div>
          <div>
            <dt>Codigo</dt>
            <dd>{validation.code}</dd>
          </div>
          <div>
            <dt>Metodo</dt>
            <dd>{validation.method}</dd>
          </div>
          <div>
            <dt>Hora</dt>
            <dd>{validation.time}</dd>
          </div>
        </dl>

        <label className="annul-validation-field">
          Motivo de anulación
          <select
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              setDetail('');
            }}
          >
            <option value="">Seleccionar motivo</option>
            {reasonOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>

        {requiresDetail && (
          <label className="annul-validation-field">
            Especificar motivo
            <textarea
              rows="3"
              value={detail}
              onChange={(event) => setDetail(event.target.value)}
              placeholder="Describe brevemente el motivo"
            />
          </label>
        )}

        <div className="modal-actions">
          <button className="back-button" type="button" onClick={onCancel}>
            Cancelar
          </button>
          <button
            className="primary-button danger-action"
            type="button"
            disabled={!canConfirm}
            onClick={() => onConfirm({ detail: detail.trim(), reason })}
          >
            Anular validación
          </button>
        </div>
      </section>
    </div>
  );
}

function OperativeValidationIssueModal({ fields, title, onClose }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section
        aria-labelledby="operative-validation-issue-title"
        aria-modal="true"
        className="confirm-modal"
        role="dialog"
      >
        <span className="section-kicker">Datos incompletos</span>
        <h2 id="operative-validation-issue-title">{title}</h2>
        <p>Antes de continuar, registra la informacion obligatoria del flujo.</p>
        <ul className="validation-list">
          {fields.map((field) => (
            <li key={field}>{field}</li>
          ))}
        </ul>
        <div className="modal-actions single-action">
          <button className="primary-button" type="button" onClick={onClose}>
            Revisar datos
          </button>
        </div>
      </section>
    </div>
  );
}

function OperativeActionModal({ action, eventTitle, onCancel, onConfirm }) {
  const isManualRegistration = action === 'manual-registration';
  const title = isManualRegistration
    ? `¿Estás seguro de registrar una inscripción manual para "${eventTitle}"?`
    : `¿Estás seguro de validar esta asistencia en "${eventTitle}"?`;
  const description = isManualRegistration
    ? 'Al confirmar se creará una inscripción con origen MANUAL y se registrará la asistencia del ciudadano.'
    : 'Al confirmar se marcará la asistencia como VALIDADA mediante método MANUAL para el evento seleccionado.';
  const confirmLabel = isManualRegistration
    ? 'Sí, registrar'
    : 'Sí, validar asistencia';

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        aria-labelledby="operative-action-title"
        aria-modal="true"
        className="confirm-modal"
        role="dialog"
      >
        <span className="section-kicker">
          {isManualRegistration ? 'Inscripción manual' : 'Validación manual'}
        </span>
        <h2 id="operative-action-title">{title}</h2>
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

export default OperativoDashboard;
