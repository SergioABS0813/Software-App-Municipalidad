import { useState } from 'react';
import municipalLogo from '../../assets/images/municipalidad-logo.png';
import calendarCheck from '../../assets/icons/calendar-check.png';
import clipboardCheck from '../../assets/icons/clipboard-check.png';
import { adminEvents } from './dashboardData';
import './AdminDashboard.css';
import './OperativoDashboard.css';

const operativeEvents = adminEvents
  .filter((event) => ['PUBLICADO', 'FINALIZADO'].includes(event.state))
  .map((event, index) => {
    const registered = [118, 192][index] ?? Math.round(event.spots * 0.82);
    const qrValidated = [44, 76][index] ?? Math.round(registered * 0.42);
    const manualValidated = [8, 14][index] ?? Math.round(registered * 0.08);
    const revokedQr = [1, 3][index] ?? 1;
    const expiredQr = [2, 5][index] ?? 2;

    return {
      ...event,
      expiredQr,
      manualValidated,
      pendingAccess: Math.max(registered - qrValidated - manualValidated, 0),
      qrValidated,
      registered,
      revokedQr,
      totalValidated: qrValidated + manualValidated,
    };
  });

const activeOperativeEvent = operativeEvents[0];

const operativeStats = [
  {
    icon: calendarCheck,
    label: 'Evento activo',
    trend: 'control de ingreso',
    value: operativeEvents.length,
  },
  {
    icon: clipboardCheck,
    label: 'Validados',
    trend: 'asistencias registradas',
    value: activeOperativeEvent?.totalValidated ?? 0,
  },
  {
    icon: clipboardCheck,
    label: 'Pendientes',
    trend: 'inscritos por validar',
    value: activeOperativeEvent?.pendingAccess ?? 0,
  },
];

const recentValidations = [
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

function OperativoDashboard({ onLogout }) {
  const [selectedEventId, setSelectedEventId] = useState(
    activeOperativeEvent?.id ?? null,
  );
  const [scannerStatus, setScannerStatus] = useState('idle');
  const [pendingOperativeAction, setPendingOperativeAction] = useState(null);
  const [operativeValidationIssue, setOperativeValidationIssue] = useState(null);
  const selectedEvent =
    operativeEvents.find((event) => event.id === selectedEventId) ??
    activeOperativeEvent;

  function simulateQrScan() {
    setScannerStatus('success');
  }

  function resetScanner() {
    setScannerStatus('idle');
  }

  function validateManualAttendance(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const missingFields = [];

    if (!formData.get('manualCode')?.trim()) {
      missingFields.push('DNI o codigo de inscripcion');
    }

    if (!formData.get('manualReason')) {
      missingFields.push('Motivo de validacion');
    }

    if (missingFields.length > 0) {
      setOperativeValidationIssue({
        fields: missingFields,
        title: 'Completa los datos de validacion manual',
      });
      return;
    }

    setPendingOperativeAction('manual-validation');
  }

  function validateManualRegistration(event) {
    event.preventDefault();
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
        title: 'Completa los datos de inscripcion manual',
      });
      return;
    }

    setPendingOperativeAction('manual-registration');
  }

  return (
    <section className="admin-shell operative-shell" aria-labelledby="operative-title">
      <aside className="admin-sidebar">
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

        <nav className="admin-nav" aria-label="Navegacion operativa">
          <a className="active" href="#control-acceso">Control de acceso</a>
          <a href="#validacion-manual">Validacion manual</a>
          <a href="#inscripcion-manual">Inscripcion manual</a>
          <a href="#validaciones-recientes">Validaciones</a>
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
          <select
            className="operative-event-select"
            aria-label="Seleccionar evento operativo"
            value={selectedEvent?.id ?? ''}
            onChange={(event) => setSelectedEventId(Number(event.target.value))}
          >
            {operativeEvents.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>
        </header>

        <section className="admin-stats" aria-label="Resumen operativo">
          {operativeStats.map((stat) => (
            <article className="admin-stat-card" key={stat.label}>
              <img alt="" className="admin-stat-icon" src={stat.icon} />
              <div>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
                <small>{stat.trend}</small>
              </div>
            </article>
          ))}
        </section>

        <section className="operative-grid">
          <article className="admin-panel operative-scanner-panel" id="control-acceso">
            <span className="section-kicker">Validacion QR</span>
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
            </div>
          </article>

          <article className="admin-panel" id="validacion-manual">
            <span className="section-kicker">Validacion manual</span>
            <h2>Inscrito sin QR</h2>
            <p className="operative-panel-note">
              Para ciudadanos que ya tienen inscripcion, pero no pueden presentar
              el codigo QR.
            </p>
            <form className="manual-validation-form" onSubmit={validateManualAttendance}>
              <label>
                DNI o codigo de inscripcion
                <input name="manualCode" placeholder="Ingrese DNI o codigo" />
              </label>
              <label>
                Motivo
                <select defaultValue="" name="manualReason">
                  <option disabled value="">Seleccionar motivo</option>
                  <option>QR no legible</option>
                  <option>Participante sin constancia</option>
                  <option>Validacion por lista interna</option>
                </select>
              </label>
              <button
                className="admin-primary-action"
                type="submit"
              >
                Validar asistencia
              </button>
            </form>
          </article>
        </section>

        <section className="admin-panel" id="inscripcion-manual">
          <div className="admin-panel-heading">
            <div>
              <span className="section-kicker">Inscripcion manual</span>
              <h2>Ciudadano sin registro previo</h2>
            </div>
            <span className="directive-badge">Origen MANUAL</span>
          </div>
          <p className="operative-panel-note">
            Usa este flujo si el ciudadano no se inscribio en linea y aun hay cupos
            disponibles para el evento.
          </p>
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
              <input name="manualPhone" placeholder="Numero de contacto" />
            </label>
            <label>
              Correo
              <input name="manualEmail" placeholder="correo@dominio.com" type="email" />
            </label>
            <label className="manual-registration-check">
              <input name="manualDataConsent" type="checkbox" />
              Acepta tratamiento de datos para registrar su participacion.
            </label>
            <button
              className="admin-primary-action"
              type="submit"
            >
              Registrar inscripcion y asistencia
            </button>
          </form>
        </section>

        <section className="admin-table-panel admin-table-featured" id="validaciones-recientes">
          <div className="admin-panel-heading">
            <div>
              <span className="section-kicker">Trazabilidad</span>
              <h2>Validaciones recientes</h2>
            </div>
            <span className="directive-badge">{selectedEvent?.title}</span>
          </div>

          <div className="admin-table operative-validation-table">
            <div className="admin-table-row admin-table-head">
              <span>Participante</span>
              <span>Codigo</span>
              <span>Origen</span>
              <span>Metodo</span>
              <span>Estado</span>
              <span>Hora</span>
            </div>
            {recentValidations.map((validation) => (
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
                </span>
                <span>{validation.time}</span>
              </div>
            ))}
          </div>
        </section>

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

      </main>
    </section>
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
    ? `Estas seguro de registrar una inscripcion manual para "${eventTitle}"?`
    : `Estas seguro de validar esta asistencia en "${eventTitle}"?`;
  const description = isManualRegistration
    ? 'Al confirmar se creara una inscripcion con origen MANUAL y se registrara la asistencia del ciudadano.'
    : 'Al confirmar se marcara la asistencia como VALIDADA mediante metodo MANUAL para el evento seleccionado.';
  const confirmLabel = isManualRegistration
    ? 'Si, registrar'
    : 'Si, validar asistencia';

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        aria-labelledby="operative-action-title"
        aria-modal="true"
        className="confirm-modal"
        role="dialog"
      >
        <span className="section-kicker">
          {isManualRegistration ? 'Inscripcion manual' : 'Validacion manual'}
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
