import { useMemo, useState } from 'react';
import municipalLogo from '../../assets/images/municipalidad-logo.png';
import AdminDashboard from '../dashboard/AdminDashboard';
import DirectivoDashboard from '../dashboard/DirectivoDashboard';
import OperativoDashboard from '../dashboard/OperativoDashboard';
import { eventCategories, events } from './data/events';
import './PublicPortal.css';

const institutionalUsers = [
  {
    email: 'admin@munisanmiguel.gob.pe',
    fullName: 'Sergio Bustamante',
    password: 'admin123',
    role: 'ADMINISTRADOR',
  },
  {
    email: 'directivo@munisanmiguel.gob.pe',
    fullName: 'Mariana Fuentes',
    password: 'directivo123',
    role: 'DIRECTIVO',
  },
  {
    email: 'operativo@munisanmiguel.gob.pe',
    fullName: 'Carlos Ramirez',
    password: 'operativo123',
    role: 'OPERATIVO',
  },
];

const emptyRegistration = {
  fullName: '',
  documentNumber: '',
  email: '',
  phone: '',
  acceptsTerms: false,
};

function PublicPortal() {
  const [currentView, setCurrentView] = useState('portal');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registration, setRegistration] = useState(emptyRegistration);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [receiptCode, setReceiptCode] = useState('');
  const [authenticatedUser, setAuthenticatedUser] = useState(null);

  const filteredEvents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return events.filter((event) => {
      const matchesCategory =
        selectedCategory === 'Todos' || event.category === selectedCategory;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [event.title, event.venue, event.district, event.category]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [searchTerm, selectedCategory]);

  const featuredEvent = filteredEvents[0] ?? events[0];

  function openEventDetail(event) {
    setCurrentView('portal');
    setSelectedEvent(event);
    setRegistration(emptyRegistration);
    setIsRegistered(false);
    setIsConfirmOpen(false);
    setReceiptCode('');
    setAuthenticatedUser(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function closeEventDetail() {
    setCurrentView('portal');
    setSelectedEvent(null);
    setRegistration(emptyRegistration);
    setIsRegistered(false);
    setIsConfirmOpen(false);
    setReceiptCode('');
    setAuthenticatedUser(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateRegistration(field, value) {
    setRegistration((currentRegistration) => ({
      ...currentRegistration,
      [field]: value,
    }));
  }

  function submitRegistration(event) {
    event.preventDefault();
    setIsConfirmOpen(true);
  }

  function confirmRegistration() {
    if (!selectedEvent) {
      return;
    }

    const documentSuffix = registration.documentNumber.slice(-4).padStart(4, '0');

    setReceiptCode(`EC-${selectedEvent?.id ?? '000'}-${documentSuffix}`);
    setIsRegistered(true);
    setIsConfirmOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelRegistrationConfirmation() {
    setIsConfirmOpen(false);
  }

  function openLogin() {
    setCurrentView('login');
    setSelectedEvent(null);
    setIsConfirmOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openInstitutionalDashboard(user) {
    setAuthenticatedUser(user);
    const viewByRole = {
      ADMINISTRADOR: 'admin',
      DIRECTIVO: 'directivo',
      OPERATIVO: 'operativo',
    };

    setCurrentView(viewByRole[user.role] ?? 'admin');
    setSelectedEvent(null);
    setIsConfirmOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <main className="citizen-portal">
      {currentView !== 'login' &&
        currentView !== 'admin' &&
        currentView !== 'directivo' &&
        currentView !== 'operativo' && (
        <PortalHeader onHome={closeEventDetail} onLogin={openLogin} />
      )}

      {currentView === 'login' ? (
        <LoginView
          onBack={closeEventDetail}
          onLoginSuccess={openInstitutionalDashboard}
        />
      ) : currentView === 'admin' ? (
        <AdminDashboard user={authenticatedUser} onLogout={closeEventDetail} />
      ) : currentView === 'directivo' ? (
        <DirectivoDashboard user={authenticatedUser} onLogout={closeEventDetail} />
      ) : currentView === 'operativo' ? (
        <OperativoDashboard user={authenticatedUser} onLogout={closeEventDetail} />
      ) : selectedEvent ? (
        <>
          {isRegistered ? (
            <RegistrationReceipt
              event={selectedEvent}
              receiptCode={receiptCode}
              registration={registration}
              onBack={closeEventDetail}
              onPrint={() => window.print()}
            />
          ) : (
            <EventDetail
              event={selectedEvent}
              registration={registration}
              onBack={closeEventDetail}
              onFieldChange={updateRegistration}
              onSubmit={submitRegistration}
            />
          )}

          {isConfirmOpen && (
            <ConfirmRegistrationModal
              eventTitle={selectedEvent.title}
              onCancel={cancelRegistrationConfirmation}
              onConfirm={confirmRegistration}
            />
          )}
        </>
      ) : (
        <PortalHome
          featuredEvent={featuredEvent}
          filteredEvents={filteredEvents}
          searchTerm={searchTerm}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          onEventSelect={openEventDetail}
          onSearchChange={setSearchTerm}
        />
      )}
    </main>
  );
}

function PortalHeader({ onHome, onLogin }) {
  return (
    <header className="portal-header">
      <button className="brand brand-button" type="button" onClick={onHome}>
        <img
          alt="Logo Municipalidad de San Miguel"
          className="municipality-logo brand-logo"
          src={municipalLogo}
        />
        <span>
          <strong>Municipalidad de San Miguel</strong>
          <small>Portal de eventos</small>
        </span>
      </button>

      <nav className="portal-nav" aria-label="Navegacion principal">
        <a href="#eventos">Eventos</a>
        <a href="#agenda">Agenda</a>
        <a href="#ayuda">Ayuda</a>
        <button type="button" onClick={onLogin}>
          Ingresar
        </button>
      </nav>
    </header>
  );
}

function LoginView({ onBack, onLoginSuccess }) {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [loginError, setLoginError] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  function updateCredential(field, value) {
    setCredentials((currentCredentials) => ({
      ...currentCredentials,
      [field]: value,
    }));
    setLoginError('');
  }

  function submitLogin(event) {
    event.preventDefault();

    const user = institutionalUsers.find(
      (institutionalUser) =>
        institutionalUser.email === credentials.email.trim().toLowerCase() &&
        institutionalUser.password === credentials.password,
    );

    if (!user) {
      setLoginError('Credenciales incorrectas. Verifica el correo y la contrasena.');
      return;
    }

    onLoginSuccess(user);
  }

  return (
    <section className="login-shell" aria-labelledby="login-title">
      <div className="login-form-side">
        <button className="login-brand" type="button" onClick={onBack}>
          <img
            alt="Logo Municipalidad de San Miguel"
            className="municipality-logo brand-logo"
            src={municipalLogo}
          />
          <strong>Municipalidad de San Miguel</strong>
        </button>

        <form
          className="login-card"
          onSubmit={submitLogin}
        >
          <div className="login-title">
            <span>Portal de eventos</span>
            <h1 id="login-title">Iniciar sesion</h1>
            <p>Accede con tus credenciales institucionales.</p>
          </div>

          <label>
            Correo institucional
            <input
              autoComplete="email"
              placeholder="Ingrese su correo electrónico"
              type="email"
              value={credentials.email}
              onChange={(event) => updateCredential('email', event.target.value)}
            />
          </label>
          <label>
            Contraseña
            <span className="password-control">
              <input
                autoComplete="current-password"
                placeholder='Ingrese su contraseña'
                type={isPasswordVisible ? 'text' : 'password'}
                value={credentials.password}
                onChange={(event) =>
                  updateCredential('password', event.target.value)
                }
              />
              <button
                aria-label={
                  isPasswordVisible ? 'Ocultar contrasena' : 'Mostrar contrasena'
                }
                className="password-toggle"
                type="button"
                onClick={() =>
                  setIsPasswordVisible((currentValue) => !currentValue)
                }
              >
                {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </span>
          </label>
          <div className="login-options">
            <label className="remember-control">
              <input type="checkbox" />
              Recordarme
            </label>
            <button type="button">Recuperar contraseña</button>
          </div>
          <button className="primary-button" type="submit">
            Ingresar
          </button>
          {loginError && <p className="login-error">{loginError}</p>}
          <div className="login-test-users" aria-label="Credenciales de prueba">
            <span>Admin: admin@munisanmiguel.gob.pe / admin123</span>
            <span>Directivo: directivo@munisanmiguel.gob.pe / directivo123</span>
            <span>Operativo: operativo@munisanmiguel.gob.pe / operativo123</span>
          </div>
        </form>

        <p className="login-footer">
          <button type="button" onClick={onBack}>
            Volver a eventos
          </button>
        </p>
      </div>

      <div className="login-art-side" aria-hidden="true" />
    </section>
  );
}

function EyeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M2.8 12s3.2-5.5 9.2-5.5S21.2 12 21.2 12 18 17.5 12 17.5 2.8 12 2.8 12Z" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M3.3 3.3 20.7 20.7" />
      <path d="M9.7 5.9A10.1 10.1 0 0 1 12 5.6c6 0 9.2 6.4 9.2 6.4a16.6 16.6 0 0 1-3 3.8" />
      <path d="M14.2 14.2A3 3 0 0 1 9.8 9.8" />
      <path d="M6.5 7.6A16.6 16.6 0 0 0 2.8 12s3.2 6.4 9.2 6.4c1.1 0 2.1-.2 3-.6" />
    </svg>
  );
}

function PortalHome({
  featuredEvent,
  filteredEvents,
  searchTerm,
  selectedCategory,
  onCategoryChange,
  onEventSelect,
  onSearchChange,
}) {
  return (
    <>
      <section className="hero-section" aria-labelledby="portal-title">
        <div className="hero-copy">
          <span className="section-kicker">Agenda municipal</span>
          <h1 id="portal-title">Encuentra actividades cerca de ti</h1>
          <p>
            Explora eventos culturales, deportivos y comunitarios organizados
            por tu municipalidad. Revisa cupos, horarios y lugares en un solo
            espacio.
          </p>

          <form className="search-panel" role="search">
            <label htmlFor="event-search">Buscar evento</label>
            <div className="search-control">
              <input
                id="event-search"
                type="search"
                placeholder="Ingresar nombre o lugar del evento"
                value={searchTerm}
                onChange={(event) => onSearchChange(event.target.value)}
              />
              <button type="submit" onClick={(event) => event.preventDefault()}>
                Buscar
              </button>
            </div>
          </form>
        </div>

        <article className={`featured-event media-${featuredEvent.accent}`}>
          <div className="event-visual" aria-hidden="true">
            <span>{featuredEvent.category}</span>
          </div>
          <div className="featured-content">
            <span>{featuredEvent.status}</span>
            <h2>{featuredEvent.title}</h2>
            <p>{featuredEvent.summary}</p>
            <dl>
              <div>
                <dt>Fecha</dt>
                <dd>{featuredEvent.date}</dd>
              </div>
              <div>
                <dt>Hora</dt>
                <dd>{featuredEvent.time}</dd>
              </div>
              <div>
                <dt>Cupos</dt>
                <dd>{featuredEvent.spots}</dd>
              </div>
            </dl>
            <button
              className="primary-button featured-action"
              type="button"
              onClick={() => onEventSelect(featuredEvent)}
            >
              Ver detalle
            </button>
          </div>
        </article>
      </section>

      <section className="content-grid" id="eventos">
        <div className="events-area">
          <div className="section-heading">
            <div>
              <span className="section-kicker">Eventos disponibles</span>
              <h2>Agenda para ciudadanos</h2>
            </div>
            <p>{filteredEvents.length} actividades encontradas</p>
          </div>

          <div className="category-tabs" aria-label="Filtrar por categoria">
            {eventCategories.map((category) => (
              <button
                className={category === selectedCategory ? 'active' : ''}
                key={category}
                type="button"
                onClick={() => onCategoryChange(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="events-list">
            {filteredEvents.map((event) => (
              <article className="event-card" key={event.id}>
                <div className={`event-card-media media-${event.accent}`}>
                  <span>{event.category}</span>
                </div>
                <div className="event-card-body">
                  <div className="event-card-meta">
                    <span>{event.date}</span>
                    <span>{event.time}</span>
                  </div>
                  <h3>{event.title}</h3>
                  <p>{event.summary}</p>
                  <div className="event-card-footer">
                    <span>{event.venue}</span>
                    <button type="button" onClick={() => onEventSelect(event)}>
                      Ver detalle
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <AgendaSidebar />
      </section>
    </>
  );
}

function AgendaSidebar() {
  return (
    <aside className="sidebar" id="agenda" aria-label="Resumen de agenda">
      <section className="summary-panel">
        <span className="section-kicker">Resumen</span>
        <h2>Participacion activa</h2>
        <div className="stats-grid">
          <strong>
            {events.length}
            <span>Eventos</span>
          </strong>
          <strong>
            495
            <span>Cupos</span>
          </strong>
        </div>
      </section>

      <section className="next-panel">
        <h2>Proximas fechas</h2>
        {events.slice(0, 3).map((event) => (
          <div className="mini-event" key={event.id}>
            <time>{event.date}</time>
            <span>{event.title}</span>
          </div>
        ))}
      </section>
    </aside>
  );
}

function EventDetail({
  event,
  registration,
  onBack,
  onFieldChange,
  onSubmit,
}) {
  return (
    <section className="detail-shell" aria-labelledby="event-detail-title">
      <button className="back-button" type="button" onClick={onBack}>
        Volver a eventos
      </button>

      <div className="detail-hero">
        <div className={`detail-media media-${event.accent}`} aria-hidden="true">
          <span>{event.category}</span>
        </div>
        <div className="detail-heading">
          <span className="section-kicker">{event.status}</span>
          <h1 id="event-detail-title">{event.title}</h1>
          <p>{event.description}</p>
        </div>
      </div>

      <div className="detail-layout">
        <div className="detail-main">
          <section className="detail-section">
            <div className="section-heading compact">
              <div>
                <span className="section-kicker">Informacion del evento</span>
                <h2>Datos principales</h2>
              </div>
            </div>
            <dl className="detail-facts">
              <div>
                <dt>Fecha</dt>
                <dd>{event.date}</dd>
              </div>
              <div>
                <dt>Hora</dt>
                <dd>{event.time}</dd>
              </div>
              <div>
                <dt>Duracion</dt>
                <dd>{event.duration}</dd>
              </div>
              <div>
                <dt>Lugar</dt>
                <dd>{event.venue}</dd>
              </div>
              <div>
                <dt>Direccion</dt>
                <dd>{event.address}</dd>
              </div>
              <div>
                <dt>Dirigido a</dt>
                <dd>{event.audience}</dd>
              </div>
            </dl>
          </section>

          <section className="detail-section two-columns">
            <div>
              <span className="section-kicker">Antes de asistir</span>
              <h2>Requisitos</h2>
              <ul className="check-list">
                {event.requirements.map((requirement) => (
                  <li key={requirement}>{requirement}</li>
                ))}
              </ul>
            </div>
            <div>
              <span className="section-kicker">Programa</span>
              <h2>Agenda prevista</h2>
              <ol className="timeline-list">
                {event.agenda.map((agendaItem) => (
                  <li key={agendaItem}>{agendaItem}</li>
                ))}
              </ol>
            </div>
          </section>

          <section className="detail-section">
            <span className="section-kicker">Accesibilidad</span>
            <h2>Condiciones de atencion</h2>
            <p className="detail-note">{event.accessibility}</p>
          </section>
        </div>

        <aside className="registration-panel" aria-label="Registro al evento">
          <div className="capacity-card">
            <span>{event.spots}</span>
            <strong>Cupos disponibles</strong>
            <p>{event.organizer}</p>
          </div>

          <form className="registration-form" onSubmit={onSubmit}>
            <span className="section-kicker">Preinscripcion</span>
            <h2>Reserva tu participacion</h2>
            <label>
              Nombre completo
              <input
                required
                value={registration.fullName}
                onChange={(inputEvent) =>
                  onFieldChange('fullName', inputEvent.target.value)
                }
              />
            </label>
            <label>
              DNI
              <input
                required
                inputMode="numeric"
                maxLength="8"
                minLength="8"
                value={registration.documentNumber}
                onChange={(inputEvent) =>
                  onFieldChange('documentNumber', inputEvent.target.value)
                }
              />
            </label>
            <label>
              Correo
              <input
                required
                type="email"
                value={registration.email}
                onChange={(inputEvent) =>
                  onFieldChange('email', inputEvent.target.value)
                }
              />
            </label>
            <label>
              Celular
              <input
                required
                inputMode="tel"
                value={registration.phone}
                onChange={(inputEvent) =>
                  onFieldChange('phone', inputEvent.target.value)
                }
              />
            </label>
            <label className="terms-control">
              <input
                required
                type="checkbox"
                checked={registration.acceptsTerms}
                onChange={(inputEvent) =>
                  onFieldChange('acceptsTerms', inputEvent.target.checked)
                }
              />
              Acepto el uso de mis datos para gestionar mi participacion.
            </label>
            <button className="primary-button" type="submit">
              Confirmar registro
            </button>
          </form>
        </aside>
      </div>
    </section>
  );
}

function ConfirmRegistrationModal({ eventTitle, onCancel, onConfirm }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section
        aria-labelledby="confirm-registration-title"
        aria-modal="true"
        className="confirm-modal"
        role="dialog"
      >
        <span className="section-kicker">Confirmar inscripcion</span>
        <h2 id="confirm-registration-title">
          Estas seguro de inscribirte al evento "{eventTitle}"?
        </h2>
        <p>
          Al confirmar se generara tu constancia de inscripcion y se enviara una
          copia al correo registrado.
        </p>
        <div className="modal-actions">
          <button className="back-button" type="button" onClick={onCancel}>
            Revisar datos
          </button>
          <button className="primary-button" type="button" onClick={onConfirm}>
            Si, inscribirme
          </button>
        </div>
      </section>
    </div>
  );
}

function RegistrationReceipt({ event, receiptCode, registration, onBack, onPrint }) {
  return (
    <section className="receipt-shell" aria-labelledby="receipt-title">
      <div className="receipt-actions no-print">
        <button className="back-button" type="button" onClick={onBack}>
          Volver a eventos
        </button>
        <button className="primary-button" type="button" onClick={onPrint}>
          Descargar PDF
        </button>
      </div>

      <article className="receipt-card">
        <header className="receipt-header">
          <div>
            <span className="section-kicker">Constancia de inscripcion</span>
            <h1 id="receipt-title">Inscripcion confirmada</h1>
            <p>
              Tu constancia fue generada correctamente. Tambien se enviara una
              copia al correo {registration.email}.
            </p>
          </div>
          <HardcodedQrCode value={receiptCode} />
        </header>

        <div className="receipt-code">{receiptCode}</div>

        <dl className="receipt-details">
          <div>
            <dt>Participante</dt>
            <dd>{registration.fullName}</dd>
          </div>
          <div>
            <dt>DNI</dt>
            <dd>{registration.documentNumber}</dd>
          </div>
          <div>
            <dt>Evento</dt>
            <dd>{event.title}</dd>
          </div>
          <div>
            <dt>Fecha y hora</dt>
            <dd>
              {event.date} - {event.time}
            </dd>
          </div>
          <div>
            <dt>Lugar</dt>
            <dd>{event.venue}</dd>
          </div>
          <div>
            <dt>Direccion</dt>
            <dd>{event.address}</dd>
          </div>
        </dl>

        <div className="receipt-note">
          Presenta esta constancia o el codigo QR en el punto de control del
          evento. El envio de correo requiere integracion con backend en la
          siguiente etapa.
        </div>
      </article>
    </section>
  );
}

function HardcodedQrCode({ value }) {
  return (
    <svg
      aria-label={`Codigo QR ${value}`}
      className="qr-preview"
      role="img"
      viewBox="0 0 116 116"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="116" height="116" fill="#ffffff" />
      <path d="M8 8h28v28H8zM16 16v12h12V16zM80 8h28v28H80zM88 16v12h12V16zM8 80h28v28H8zM16 88v12h12V88z" fill="#0a56c2" />
      <path d="M44 8h8v8h-8zM60 8h8v8h-8zM44 24h16v8H44zM68 24h8v8h-8zM44 40h8v8h-8zM60 40h24v8H60zM92 44h16v8H92zM8 44h8v8H8zM24 44h12v8H24zM48 56h8v8h-8zM64 56h8v8h-8zM80 56h28v8H80zM40 64h24v8H40zM72 68h8v8h-8zM92 72h16v8H92zM44 80h8v8h-8zM60 80h20v8H60zM88 88h8v8h-8zM104 88h4v20h-8V96h-8v-8h12zM44 96h8v12h-8zM60 100h28v8H60zM72 16h4v8h-8V12h4zM52 72h8v8h-8zM20 60h16v8H20zM8 64h8v8H8zM88 64h8v8h-8z" fill="#101828" />
      <path d="M56 20h8v8h-8zM32 56h8v8h-8zM72 40h8v8h-8zM56 88h8v8h-8zM96 56h8v8h-8z" fill="#18c7f3" />
    </svg>
  );
}

export default PublicPortal;
