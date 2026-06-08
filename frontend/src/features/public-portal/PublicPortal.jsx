import { useEffect, useMemo, useRef, useState } from 'react';
import municipalLogo from '../../assets/images/municipalidad-logo.png';
import AdminDashboard from '../dashboard/AdminDashboard';
import DirectivoDashboard from '../dashboard/DirectivoDashboard';
import OperativoDashboard from '../dashboard/OperativoDashboard';
import { eventCategories, events } from './data/events';
import PublicEventDetail from './PublicEventDetail';
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
  {
    apellidos: 'Bustamante Villanueva',
    acceptsDataUse: true,
    celular: '987654321',
    correo: 'vecino@gmail.com',
    dni: '12345678',
    email: 'vecino@gmail.com',
    fechaNacimiento: '1998-04-16',
    fullName: 'Sergio André Bustamante Villanueva',
    nombreCompleto: 'Sergio André Bustamante Villanueva',
    nombres: 'Sergio André',
    password: 'vecino123',
    role: 'VECINO',
  },
];

const emptyRegistration = {
  fullName: '',
  documentNumber: '',
  email: '',
  phone: '',
  acceptsTerms: false,
};

const emptyCitizenRegister = {
  dni: '',
  fechaNacimiento: '',
  correo: '',
  celular: '',
  password: '',
  confirmPassword: '',
  acceptsDataUse: false,
};

const eventsListPath = '/eventos';
const citizenAuthStorageKey = 'citizenAuthUser';
const citizenAuthTokenKey = 'token';

const eventMonthIndex = {
  abr: 3,
  ago: 7,
  dic: 11,
  ene: 0,
  feb: 1,
  jul: 6,
  jun: 5,
  mar: 2,
  may: 4,
  nov: 10,
  oct: 9,
  sep: 8,
};

function parseEventDateTime(event) {
  const dateMatch = event.date?.match(/(\d{1,2})\s+([a-záéíóúñ]{3})/i);

  if (!dateMatch) {
    return null;
  }

  const day = Number(dateMatch[1]);
  const monthKey = dateMatch[2]
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const month = eventMonthIndex[monthKey];

  if (!Number.isFinite(day) || month === undefined) {
    return null;
  }

  const timeMatch = event.time?.match(/(\d{1,2})(?::(\d{2}))?\s*(a\.m\.|p\.m\.)?/i);
  let hours = timeMatch ? Number(timeMatch[1]) : 0;
  const minutes = timeMatch?.[2] ? Number(timeMatch[2]) : 0;
  const meridiem = timeMatch?.[3]?.toLowerCase();

  if (meridiem === 'p.m.' && hours < 12) {
    hours += 12;
  }

  if (meridiem === 'a.m.' && hours === 12) {
    hours = 0;
  }

  const currentYear = new Date().getFullYear();
  const eventDate = new Date(currentYear, month, day, hours, minutes);

  if (Number.isNaN(eventDate.getTime())) {
    return null;
  }

  return eventDate;
}

function getClosestStartingEvent(eventList) {
  const now = new Date();
  const sortedEvents = [...eventList].sort((firstEvent, secondEvent) => {
    const firstDate = parseEventDateTime(firstEvent);
    const secondDate = parseEventDateTime(secondEvent);
    const firstTime = firstDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const secondTime = secondDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const firstIsPast = firstTime < now.getTime();
    const secondIsPast = secondTime < now.getTime();

    if (firstIsPast !== secondIsPast) {
      return firstIsPast ? 1 : -1;
    }

    return firstTime - secondTime;
  });

  return sortedEvents[0] ?? null;
}

function getResourceUrl(resource) {
  return resource?.url_recurso ?? resource?.url ?? '';
}

function getEventCoverResource(event) {
  const resources = Array.isArray(event.recursos)
    ? event.recursos
    : Array.isArray(event.resources)
      ? event.resources
      : [];

  return resources.find((resource) => {
    const resourceType = resource.tipo_recurso?.toUpperCase();
    return resourceType === 'PORTADA' || resourceType === 'IMAGEN_PORTADA';
  });
}

function getEventCoverUrl(event) {
  const coverResource = getEventCoverResource(event);

  return getResourceUrl(coverResource) || event.imageUrl || '';
}

function getEventShortDescription(event) {
  return event.descripcion_breve || event.descripcion || event.summary || event.description || '';
}

function getCurrentInternalPath() {
  return `${window.location.pathname}${window.location.search}` || eventsListPath;
}

function readStoredCitizenUser() {
  try {
    const storedUser = localStorage.getItem(citizenAuthStorageKey);

    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
}

function saveCitizenSession(user) {
  const citizenUser = {
    acceptsDataUse: user.acceptsDataUse ?? true,
    apellidos: user.apellidos,
    celular: user.celular ?? '',
    correo: user.correo ?? user.email,
    dni: user.dni ?? '',
    fechaNacimiento: user.fechaNacimiento ?? '',
    nombreCompleto: user.nombreCompleto ?? user.fullName,
    nombres: user.nombres,
    rol: 'VECINO',
    role: 'VECINO',
  };

  try {
    localStorage.setItem(citizenAuthTokenKey, `mock-vecino-${Date.now()}`);
    localStorage.setItem(citizenAuthStorageKey, JSON.stringify(citizenUser));
  } catch {
    return citizenUser;
  }

  return citizenUser;
}

function clearCitizenSession() {
  try {
    localStorage.removeItem(citizenAuthTokenKey);
    localStorage.removeItem(citizenAuthStorageKey);
  } catch {
    // La sesion mock solo mejora la experiencia visual del frontend.
  }
}

function buscarIdentidadPorDni(dni) {
  // TODO: reemplazar por endpoint Spring Boot que consulte RENIEC o el servicio oficial.
  const mockIdentities = {
    12345678: {
      apellidos: 'Bustamante Villanueva',
      dni: '12345678',
      nombreCompleto: 'Sergio André Bustamante Villanueva',
      nombres: 'Sergio André',
    },
    87654321: {
      apellidos: 'Rojas Mendoza',
      dni: '87654321',
      nombreCompleto: 'María Fernanda Rojas Mendoza',
      nombres: 'María Fernanda',
    },
  };

  return new Promise((resolve) => {
    window.setTimeout(() => {
      resolve(mockIdentities[dni] ?? null);
    }, 650);
  });
}

function hasActiveCitizenSession(authenticatedUser) {
  if (authenticatedUser?.role === 'VECINO' || authenticatedUser?.rol === 'VECINO') {
    return true;
  }

  // TODO: reemplazar por el contexto real de autenticacion ciudadana.
  // La proteccion definitiva debe vivir tambien en el backend con JWT.
  try {
    return ['token', 'authToken', 'accessToken', 'jwt'].some((storageKey) =>
      Boolean(localStorage.getItem(storageKey)),
    );
  } catch {
    return false;
  }
}

function getSafeEventsOriginPath() {
  const currentPath = getCurrentInternalPath();

  if (currentPath === '/' || currentPath.startsWith('/eventos/')) {
    return eventsListPath;
  }

  return currentPath;
}

function getInitialPortalView() {
  if (window.location.pathname === '/login') {
    return 'login';
  }

  if (window.location.pathname === '/registro') {
    return 'register';
  }

  if (window.location.pathname === '/recuperar-contrasena') {
    return 'recoverPassword';
  }

  if (window.location.pathname === '/cuenta') {
    return 'account';
  }

  return 'portal';
}

function getInitialSelectedEvent() {
  const eventId = window.location.pathname.match(/^\/eventos\/([^/?#]+)$/)?.[1];

  if (!eventId) {
    return null;
  }

  return events.find((event) => String(event.id) === eventId) ?? null;
}

function PublicPortal() {
  const [currentView, setCurrentView] = useState(getInitialPortalView);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(getInitialSelectedEvent);
  const [registration, setRegistration] = useState(emptyRegistration);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isLoginRequiredOpen, setIsLoginRequiredOpen] = useState(false);
  const [receiptCode, setReceiptCode] = useState('');
  const [authenticatedUser, setAuthenticatedUser] = useState(readStoredCitizenUser);
  const [detailOriginPath, setDetailOriginPath] = useState(eventsListPath);
  const [loginNotice, setLoginNotice] = useState('');

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

  const featuredEvent = useMemo(
    () => getClosestStartingEvent(filteredEvents.length > 0 ? filteredEvents : events) ?? events[0],
    [filteredEvents],
  );

  function openEventDetail(event) {
    const from = getSafeEventsOriginPath();

    setCurrentView('portal');
    setSelectedEvent(event);
    setRegistration(emptyRegistration);
    setIsRegistered(false);
    setIsConfirmOpen(false);
    setIsLoginRequiredOpen(false);
    setReceiptCode('');
    setLoginNotice('');
    setDetailOriginPath(from);
    window.history.pushState(
      { from },
      '',
      `/eventos/${event.id}`,
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function closeEventDetail() {
    const fallbackPath =
      detailOriginPath || window.history.state?.from || eventsListPath;

    setCurrentView('portal');
    setSelectedEvent(null);
    setRegistration(emptyRegistration);
    setIsRegistered(false);
    setIsConfirmOpen(false);
    setIsLoginRequiredOpen(false);
    setReceiptCode('');
    setLoginNotice('');
    window.history.pushState(null, '', fallbackPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function submitRegistration(event) {
    event.preventDefault();

    if (!hasActiveCitizenSession(authenticatedUser)) {
      setIsLoginRequiredOpen(true);
      return;
    }

    setIsConfirmOpen(true);
  }

  function confirmRegistration() {
    if (!selectedEvent) {
      return;
    }

    const documentSuffix = registration.documentNumber
      ? registration.documentNumber.slice(-4).padStart(4, '0')
      : 'PERFIL';

    setReceiptCode(`EC-${selectedEvent?.id ?? '000'}-${documentSuffix}`);
    setIsRegistered(true);
    setIsConfirmOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelRegistrationConfirmation() {
    setIsConfirmOpen(false);
  }

  function closeLoginRequiredModal() {
    setIsLoginRequiredOpen(false);
  }

  function continueToLoginFromReservation() {
    if (!selectedEvent) {
      return;
    }

    const redirectTo = `/eventos/${selectedEvent.id}`;

    setIsLoginRequiredOpen(false);
    setLoginNotice('');
    setCurrentView('login');
    setIsConfirmOpen(false);
    window.history.pushState(
      {
        action: 'reservar',
        redirectTo,
      },
      '',
      '/login',
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openLogin(notice = '') {
    setLoginNotice(typeof notice === 'string' ? notice : '');
    setCurrentView('login');
    setSelectedEvent(null);
    setIsConfirmOpen(false);
    setIsLoginRequiredOpen(false);
    window.history.pushState(null, '', '/login');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openRegister() {
    setLoginNotice('');
    setCurrentView('register');
    setSelectedEvent(null);
    setIsConfirmOpen(false);
    setIsLoginRequiredOpen(false);
    window.history.pushState(null, '', '/registro');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openRecoverPassword() {
    setLoginNotice('');
    setCurrentView('recoverPassword');
    setSelectedEvent(null);
    setIsConfirmOpen(false);
    setIsLoginRequiredOpen(false);
    window.history.pushState(null, '', '/recuperar-contrasena');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openAccountSettings() {
    setCurrentView('account');
    setSelectedEvent(null);
    setIsConfirmOpen(false);
    setIsLoginRequiredOpen(false);
    window.history.pushState(null, '', '/cuenta');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function logoutUser() {
    clearCitizenSession();
    setAuthenticatedUser(null);
    setCurrentView('portal');
    setSelectedEvent(null);
    setIsConfirmOpen(false);
    setIsLoginRequiredOpen(false);
    setLoginNotice('');
    window.history.pushState(null, '', eventsListPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openInstitutionalDashboard(user) {
    if (user.role === 'VECINO') {
      const citizenUser = saveCitizenSession(user);
      const redirectTo = window.history.state?.redirectTo ?? eventsListPath;
      const redirectEventId = redirectTo.match(/^\/eventos\/(.+)$/)?.[1];
      const redirectEvent = events.find((event) => String(event.id) === redirectEventId);

      setAuthenticatedUser(citizenUser);
      setLoginNotice('');
      setCurrentView('portal');
      setSelectedEvent(redirectEvent ?? null);
      setIsConfirmOpen(false);
      setIsLoginRequiredOpen(false);
      window.history.pushState(null, '', redirectTo);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setAuthenticatedUser(user);
    clearCitizenSession();
    setLoginNotice('');
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
        currentView !== 'register' &&
        currentView !== 'recoverPassword' &&
        currentView !== 'admin' &&
        currentView !== 'directivo' &&
        currentView !== 'operativo' && (
        <PortalHeader
          user={authenticatedUser}
          onAccount={openAccountSettings}
          onHome={closeEventDetail}
          onLogin={openLogin}
          onLogout={logoutUser}
        />
      )}

      {currentView === 'login' ? (
        <LoginView
          notice={loginNotice}
          onBack={closeEventDetail}
          onLoginSuccess={openInstitutionalDashboard}
          onRecoverPassword={openRecoverPassword}
          onRegister={openRegister}
        />
      ) : currentView === 'register' ? (
        <VecinoRegisterPage
          onBack={closeEventDetail}
          onLogin={openLogin}
        />
      ) : currentView === 'recoverPassword' ? (
        <RecoverPasswordPage
          onBack={closeEventDetail}
          onLogin={openLogin}
        />
      ) : currentView === 'admin' ? (
        <AdminDashboard user={authenticatedUser} onLogout={logoutUser} />
      ) : currentView === 'directivo' ? (
        <DirectivoDashboard user={authenticatedUser} onLogout={logoutUser} />
      ) : currentView === 'operativo' ? (
        <OperativoDashboard user={authenticatedUser} onLogout={logoutUser} />
      ) : currentView === 'account' ? (
        <AccountSettingsPage
          user={authenticatedUser}
          onBack={closeEventDetail}
          onUserUpdate={setAuthenticatedUser}
        />
      ) : selectedEvent ? (
        <>
          {isRegistered ? (
            <RegistrationReceipt
              event={selectedEvent}
              receiptCode={receiptCode}
              registration={registration}
              user={authenticatedUser}
              onBack={closeEventDetail}
              onPrint={() => window.print()}
            />
          ) : (
            <PublicEventDetail
              event={selectedEvent}
              onBack={closeEventDetail}
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

          {isLoginRequiredOpen && (
            <LoginRequiredModal
              onCancel={closeLoginRequiredModal}
              onLogin={continueToLoginFromReservation}
              onRegister={openRegister}
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

function PortalHeader({ user, onAccount, onHome, onLogin, onLogout }) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const isNeighbor = user?.role === 'VECINO' || user?.rol === 'VECINO';
  const userDisplayName = [user?.nombres, user?.apellidos].filter(Boolean).join(' ');

  useEffect(() => {
    function closeMenuOnOutsideClick(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', closeMenuOnOutsideClick);

    return () => {
      document.removeEventListener('mousedown', closeMenuOnOutsideClick);
    };
  }, []);

  function selectAccountSettings() {
    setIsUserMenuOpen(false);
    onAccount();
  }

  function selectLogout() {
    setIsUserMenuOpen(false);
    onLogout();
  }

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
        {isNeighbor ? (
          <div className="portal-user-menu" ref={menuRef}>
            <button
              aria-expanded={isUserMenuOpen}
              className="portal-user-button"
              type="button"
              onClick={() => setIsUserMenuOpen((currentValue) => !currentValue)}
            >
              <span>{userDisplayName}</span>
              <span aria-hidden="true">▾</span>
            </button>
            {isUserMenuOpen && (
              <div className="portal-user-dropdown" role="menu">
                <button type="button" role="menuitem" onClick={selectAccountSettings}>
                  Configuración de cuenta
                </button>
                <button
                  className="portal-user-logout"
                  type="button"
                  role="menuitem"
                  onClick={selectLogout}
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        ) : (
          <button type="button" onClick={onLogin}>
            Ingresar
          </button>
        )}
      </nav>
    </header>
  );
}

function AccountSettingsPage({ user, onBack, onUserUpdate }) {
  const initialFormData = {
    acceptsDataUse: user?.acceptsDataUse ?? true,
    celular: user?.celular ?? '',
    confirmNewPassword: '',
    correo: user?.correo ?? '',
    fechaNacimiento: user?.fechaNacimiento ?? '',
    newPassword: '',
  };
  const displayName =
    user?.nombreCompleto || [user?.nombres, user?.apellidos].filter(Boolean).join(' ');
  const [formData, setFormData] = useState(initialFormData);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  function updateField(field, value) {
    setFormData((currentData) => ({
      ...currentData,
      [field]: value,
    }));
    setFormError('');
    setFormSuccess('');
  }

  function submitAccountSettings(event) {
    event.preventDefault();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(formData.correo.trim())) {
      setFormError('Ingresa un correo electrónico válido.');
      return;
    }

    if (!formData.celular.trim()) {
      setFormError('Ingresa tu número de celular.');
      return;
    }

    if (
      (formData.newPassword || formData.confirmNewPassword) &&
      formData.newPassword !== formData.confirmNewPassword
    ) {
      setFormError('Las contraseñas deben coincidir.');
      return;
    }

    const payload = {
      fechaNacimiento: formData.fechaNacimiento,
      correo: formData.correo.trim(),
      celular: formData.celular.trim(),
      acceptsDataUse: formData.acceptsDataUse,
      nuevaPassword: formData.newPassword || null,
    };

    // TODO: conectar este payload con el endpoint de actualizacion de cuenta en Spring Boot.
    void payload;

    const updatedUser = {
      ...user,
      acceptsDataUse: formData.acceptsDataUse,
      celular: formData.celular.trim(),
      correo: formData.correo.trim(),
      fechaNacimiento: formData.fechaNacimiento,
    };

    try {
      localStorage.setItem(citizenAuthStorageKey, JSON.stringify(updatedUser));
    } catch {
      // La persistencia local es temporal mientras no exista backend.
    }

    onUserUpdate(updatedUser);
    setFormData((currentData) => ({
      ...currentData,
      confirmNewPassword: '',
      newPassword: '',
    }));
    setFormSuccess('Datos actualizados correctamente.');
  }

  function cancelAccountSettings() {
    setFormData(initialFormData);
    setFormError('');
    setFormSuccess('');
    onBack();
  }

  return (
    <section className="account-settings-shell" aria-labelledby="account-settings-title">
      <form className="account-settings-panel" onSubmit={submitAccountSettings}>
        <button className="detail-back-link register-back-link" type="button" onClick={onBack}>
          <span aria-hidden="true">←</span>
          Volver a eventos
        </button>

        <div className="account-settings-heading">
          <span className="section-kicker">Cuenta vecinal</span>
          <h1 id="account-settings-title">Configuración de cuenta</h1>
          <p>Revisa y actualiza los datos asociados a tu cuenta vecinal.</p>
        </div>

        <div className="register-fields-grid account-fields-grid">
          <label>
            DNI
            <input
              disabled
              type="text"
              value={user?.dni ?? ''}
              readOnly
            />
            <span className="account-field-help">
              No editable. Documento validado para tu cuenta.
            </span>
          </label>
          <label>
            Nombres y apellidos
            <input
              disabled
              type="text"
              value={displayName}
              readOnly
            />
            <span className="account-field-help">
              No editable. Información validada con fuente oficial.
            </span>
          </label>
          <label>
            Fecha de nacimiento
            <input
              autoComplete="bday"
              type="date"
              value={formData.fechaNacimiento}
              onChange={(event) => updateField('fechaNacimiento', event.target.value)}
            />
          </label>
          <label>
            Correo electrónico
            <input
              autoComplete="email"
              type="email"
              value={formData.correo}
              onChange={(event) => updateField('correo', event.target.value)}
            />
          </label>
          <label>
            Celular
            <input
              autoComplete="tel"
              inputMode="tel"
              type="tel"
              value={formData.celular}
              onChange={(event) => updateField('celular', event.target.value)}
            />
          </label>
        </div>

        <label className="data-consent-control account-consent-control">
          <input
            type="checkbox"
            checked={formData.acceptsDataUse}
            onChange={(event) => updateField('acceptsDataUse', event.target.checked)}
          />
          <span>
            Acepto el uso de mis datos para gestionar mi participación en eventos
            municipales.
          </span>
        </label>

        <section className="account-security-section" aria-labelledby="account-security-title">
          <div>
            <h2 id="account-security-title">Seguridad</h2>
            <p>Puedes actualizar tu contraseña cuando lo necesites.</p>
          </div>
          <div className="register-fields-grid account-fields-grid">
            <label>
              Nueva contraseña
              <span className="password-control">
                <input
                  autoComplete="new-password"
                  type={isNewPasswordVisible ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(event) => updateField('newPassword', event.target.value)}
                />
                <button
                  aria-label={
                    isNewPasswordVisible ? 'Ocultar nueva contraseña' : 'Mostrar nueva contraseña'
                  }
                  className="password-toggle"
                  type="button"
                  onClick={() => setIsNewPasswordVisible((currentValue) => !currentValue)}
                >
                  {isNewPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </span>
            </label>
            <label>
              Confirmar nueva contraseña
              <span className="password-control">
                <input
                  autoComplete="new-password"
                  type={isConfirmPasswordVisible ? 'text' : 'password'}
                  value={formData.confirmNewPassword}
                  onChange={(event) => updateField('confirmNewPassword', event.target.value)}
                />
                <button
                  aria-label={
                    isConfirmPasswordVisible
                      ? 'Ocultar confirmación de contraseña'
                      : 'Mostrar confirmación de contraseña'
                  }
                  className="password-toggle"
                  type="button"
                  onClick={() =>
                    setIsConfirmPasswordVisible((currentValue) => !currentValue)
                  }
                >
                  {isConfirmPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </span>
            </label>
          </div>
        </section>

        {formError && <p className="login-error">{formError}</p>}
        {formSuccess && <p className="login-success">{formSuccess}</p>}

        <div className="account-form-actions">
          <button className="back-button" type="button" onClick={cancelAccountSettings}>
            Cancelar
          </button>
          <button className="primary-button register-primary-button" type="submit">
            Guardar cambios
          </button>
        </div>
      </form>
    </section>
  );
}

function LoginView({ notice, onBack, onLoginSuccess, onRecoverPassword, onRegister }) {
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
      setLoginError('Credenciales incorrectas. Verifica el correo y la contraseña.');
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
            <h1 id="login-title">Iniciar sesión</h1>
            <p>Accede a tu cuenta para continuar.</p>
          </div>

          <label>
            Correo electrónico
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
                  isPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'
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
            <button type="button" onClick={onRecoverPassword}>
              Recuperar contraseña
            </button>
          </div>
          <button className="primary-button" type="submit">
            Ingresar
          </button>
          <p className="login-register-link">
            <span>¿Aún no tienes cuenta vecinal?</span>
            <button type="button" onClick={onRegister}>
              Crear cuenta
            </button>
          </p>
          {notice && <p className="login-success">{notice}</p>}
          {loginError && <p className="login-error">{loginError}</p>}
          <div className="login-test-users" aria-label="Credenciales de prueba">
            <span>Admin: admin@munisanmiguel.gob.pe / admin123</span>
            <span>Directivo: directivo@munisanmiguel.gob.pe / directivo123</span>
            <span>Operativo: operativo@munisanmiguel.gob.pe / operativo123</span>
            <span>Vecino: vecino@gmail.com / vecino123</span>
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

function RecoverPasswordPage({ onBack, onLogin }) {
  const [verificationData, setVerificationData] = useState({
    correo: '',
    dni: '',
  });
  const [passwordData, setPasswordData] = useState({
    confirmPassword: '',
    newPassword: '',
  });
  const [verifiedUser, setVerifiedUser] = useState(null);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  function updateVerificationField(field, value) {
    const nextValue = field === 'dni' ? value.replace(/\D/g, '').slice(0, 8) : value;

    setVerificationData((currentData) => ({
      ...currentData,
      [field]: nextValue,
    }));
    setVerifiedUser(null);
    setFormError('');
    setFormSuccess('');
  }

  function updatePasswordField(field, value) {
    setPasswordData((currentData) => ({
      ...currentData,
      [field]: value,
    }));
    setFormError('');
    setFormSuccess('');
  }

  function verifyAccount(event) {
    event.preventDefault();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const correo = verificationData.correo.trim().toLowerCase();
    const dni = verificationData.dni.trim();

    if (!correo) {
      setFormError('Ingresa tu correo electrónico.');
      return;
    }

    if (!emailPattern.test(correo)) {
      setFormError('Ingresa un correo electrónico válido.');
      return;
    }

    if (!dni) {
      setFormError('Ingresa tu DNI.');
      return;
    }

    if (!/^\d{8}$/.test(dni)) {
      setFormError('Ingrese un DNI válido de 8 dígitos.');
      return;
    }

    // TODO: en produccion este flujo debe enviar un codigo o enlace al correo
    // antes de permitir cambiar la contrasena desde Spring Boot.
    const user = institutionalUsers.find(
      (mockUser) =>
        (mockUser.correo ?? mockUser.email)?.toLowerCase() === correo &&
        mockUser.dni === dni,
    );

    if (!user) {
      setVerifiedUser(null);
      setFormError('No encontramos una cuenta con el correo y DNI ingresados.');
      return;
    }

    setVerifiedUser(user);
    setPasswordData({
      confirmPassword: '',
      newPassword: '',
    });
    setFormError('');
    setFormSuccess('');
  }

  function updatePassword(event) {
    event.preventDefault();

    if (!passwordData.newPassword) {
      setFormError('Ingresa una nueva contraseña.');
      return;
    }

    if (!passwordData.confirmPassword) {
      setFormError('Confirma tu nueva contraseña.');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setFormError('Las contraseñas no coinciden.');
      return;
    }

    // TODO: conectar con Spring Boot para registrar el cambio de contrasena.
    setFormError('');
    setFormSuccess('Contraseña actualizada correctamente. Ahora puedes iniciar sesión.');
  }

  return (
    <section className="login-shell" aria-labelledby="recover-password-title">
      <div className="login-form-side">
        <button className="login-brand" type="button" onClick={onBack}>
          <img
            alt="Logo Municipalidad de San Miguel"
            className="municipality-logo brand-logo"
            src={municipalLogo}
          />
          <strong>Municipalidad de San Miguel</strong>
        </button>

        <form className="login-card recover-password-card" onSubmit={verifyAccount}>
          <div className="login-title">
            <span>Portal de eventos</span>
            <h1 id="recover-password-title">Recuperar contraseña</h1>
            <p>Ingresa tu correo electrónico y DNI para verificar tu cuenta.</p>
          </div>

          <label>
            Correo electrónico
            <input
              autoComplete="email"
              placeholder="Ingrese su correo electrónico"
              type="email"
              value={verificationData.correo}
              onChange={(event) => updateVerificationField('correo', event.target.value)}
            />
          </label>
          <label>
            DNI
            <input
              autoComplete="off"
              inputMode="numeric"
              maxLength={8}
              placeholder="Ingrese su DNI"
              type="text"
              value={verificationData.dni}
              onChange={(event) => updateVerificationField('dni', event.target.value)}
            />
          </label>

          <button className="primary-button" type="submit">
            Verificar datos
          </button>

          {verifiedUser && !formSuccess && (
            <section className="recover-password-step" aria-label="Actualizar contraseña">
              <span className="identity-verified-message">
                Cuenta verificada: {verifiedUser.nombreCompleto ?? verifiedUser.fullName}
              </span>
              <label>
                Nueva contraseña
                <span className="password-control">
                  <input
                    autoComplete="new-password"
                    placeholder="Ingrese su nueva contraseña"
                    type={isNewPasswordVisible ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(event) => updatePasswordField('newPassword', event.target.value)}
                  />
                  <button
                    aria-label={
                      isNewPasswordVisible ? 'Ocultar nueva contraseña' : 'Mostrar nueva contraseña'
                    }
                    className="password-toggle"
                    type="button"
                    onClick={() => setIsNewPasswordVisible((currentValue) => !currentValue)}
                  >
                    {isNewPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </span>
              </label>
              <label>
                Confirmar nueva contraseña
                <span className="password-control">
                  <input
                    autoComplete="new-password"
                    placeholder="Repita su nueva contraseña"
                    type={isConfirmPasswordVisible ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(event) =>
                      updatePasswordField('confirmPassword', event.target.value)
                    }
                  />
                  <button
                    aria-label={
                      isConfirmPasswordVisible
                        ? 'Ocultar confirmación de contraseña'
                        : 'Mostrar confirmación de contraseña'
                    }
                    className="password-toggle"
                    type="button"
                    onClick={() =>
                      setIsConfirmPasswordVisible((currentValue) => !currentValue)
                    }
                  >
                    {isConfirmPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </span>
              </label>
              <button
                className="primary-button register-primary-button"
                type="button"
                onClick={updatePassword}
              >
                Actualizar contraseña
              </button>
            </section>
          )}

          {formError && <p className="login-error">{formError}</p>}
          {formSuccess && (
            <>
              <p className="login-success">{formSuccess}</p>
              <button className="primary-button" type="button" onClick={() => onLogin()}>
                Ir a iniciar sesión
              </button>
            </>
          )}
        </form>

        <p className="login-footer">
          <button type="button" onClick={() => onLogin()}>
            Volver a iniciar sesión
          </button>
        </p>
      </div>

      <div className="login-art-side" aria-hidden="true" />
    </section>
  );
}

function VecinoRegisterPage({ onBack, onLogin }) {
  const [formData, setFormData] = useState(emptyCitizenRegister);
  const [formError, setFormError] = useState('');
  const [identityResult, setIdentityResult] = useState(null);
  const [identityMessage, setIdentityMessage] = useState('');
  const [isSearchingIdentity, setIsSearchingIdentity] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  function updateField(field, value) {
    const nextValue = field === 'dni' ? value.replace(/\D/g, '').slice(0, 8) : value;

    setFormData((currentData) => ({
      ...currentData,
      [field]: nextValue,
    }));
    setFormError('');

    if (field === 'dni') {
      setIdentityResult(null);
      setIdentityMessage('');
    }
  }

  async function searchIdentity() {
    const dni = formData.dni.trim();

    if (!/^\d{8}$/.test(dni)) {
      setFormError('Ingresa un DNI válido de 8 dígitos.');
      return;
    }

    setFormError('');
    setIdentityMessage('');
    setIsSearchingIdentity(true);

    const identity = await buscarIdentidadPorDni(dni);

    setIsSearchingIdentity(false);

    if (!identity) {
      setIdentityResult(null);
      setIdentityMessage('No se encontraron datos para el DNI ingresado.');
      return;
    }

    setIdentityResult(identity);
    setIdentityMessage('');
  }

  function validateRegisterForm() {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.dni.trim()) {
      return 'Ingresa tu DNI.';
    }

    if (!/^\d{8}$/.test(formData.dni.trim())) {
      return 'Ingresa un DNI válido de 8 dígitos.';
    }

    if (!identityResult) {
      return 'Busca y valida tu identidad antes de crear la cuenta.';
    }

    if (!formData.fechaNacimiento) {
      return 'Selecciona tu fecha de nacimiento.';
    }

    if (!formData.correo.trim()) {
      return 'Ingresa tu correo electrónico.';
    }

    if (!emailPattern.test(formData.correo.trim())) {
      return 'Ingresa un correo electrónico válido.';
    }

    if (!formData.celular.trim()) {
      return 'Ingresa tu número de celular.';
    }

    if (!formData.password) {
      return 'Crea una contraseña.';
    }

    if (!formData.confirmPassword) {
      return 'Confirma tu contraseña.';
    }

    if (formData.password !== formData.confirmPassword) {
      return 'Las contraseñas deben coincidir.';
    }

    if (!formData.acceptsDataUse) {
      return 'Debes aceptar el uso de tus datos para crear la cuenta.';
    }

    return '';
  }

  function submitRegister(event) {
    event.preventDefault();

    const validationMessage = validateRegisterForm();

    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    const payload = {
      dni: formData.dni.trim(),
      nombres: identityResult.nombres,
      apellidos: identityResult.apellidos,
      nombreCompleto: identityResult.nombreCompleto,
      fechaNacimiento: formData.fechaNacimiento,
      correo: formData.correo.trim(),
      celular: formData.celular.trim(),
      password: formData.password,
    };

    // TODO: conectar este payload con el endpoint de registro vecinal en Spring Boot.
    void payload;
    onLogin('¡Cuenta creada! Te enviamos un correo de confirmación. Revisa tu bandeja de entrada para activar tu cuenta e iniciar sesión.');
  }

  return (
    <section className="login-shell register-shell" aria-labelledby="register-title">
      <div className="login-form-side register-form-side">
        <button className="login-brand" type="button" onClick={onBack}>
          <img
            alt="Logo Municipalidad de San Miguel"
            className="municipality-logo brand-logo"
            src={municipalLogo}
          />
          <strong>Municipalidad de San Miguel</strong>
        </button>

        <form className="login-card register-card" onSubmit={submitRegister}>
          <button className="detail-back-link register-back-link" type="button" onClick={onBack}>
            <span aria-hidden="true">←</span>
            Volver a eventos
          </button>

          <div className="login-title">
            <span>Portal de eventos</span>
            <h1 id="register-title">Crear cuenta vecinal</h1>
            <p>Regístrate para reservar tu lugar en las actividades municipales.</p>
          </div>

          <div className="register-fields-grid">
            <label className="register-dni-field">
              DNI
              <span className="dni-search-control">
                <input
                  autoComplete="off"
                  inputMode="numeric"
                  maxLength={8}
                  placeholder="Ingrese su DNI"
                  type="text"
                  value={formData.dni}
                  onChange={(event) => updateField('dni', event.target.value)}
                />
                <button
                  disabled={!/^\d{8}$/.test(formData.dni) || isSearchingIdentity}
                  type="button"
                  onClick={searchIdentity}
                >
                  {isSearchingIdentity ? 'Buscando...' : 'Buscar'}
                </button>
              </span>
              {identityResult && (
                <span className="identity-verified-message">
                  Identidad verificada: {identityResult.nombreCompleto}
                </span>
              )}
              {!identityResult && identityMessage && (
                <span className="identity-error-message">{identityMessage}</span>
              )}
            </label>
            <label>
              Fecha de nacimiento
              <input
                autoComplete="bday"
                placeholder="Seleccione su fecha de nacimiento"
                type="date"
                value={formData.fechaNacimiento}
                onChange={(event) => updateField('fechaNacimiento', event.target.value)}
              />
            </label>
            <label>
              Correo electrónico
              <input
                autoComplete="email"
                placeholder="Ingrese su correo electrónico"
                type="email"
                value={formData.correo}
                onChange={(event) => updateField('correo', event.target.value)}
              />
            </label>
            <label>
              Celular
              <input
                autoComplete="tel"
                inputMode="tel"
                placeholder="Ingrese su número de celular"
                type="tel"
                value={formData.celular}
                onChange={(event) => updateField('celular', event.target.value)}
              />
            </label>
            <label>
              Contraseña
              <span className="password-control">
                <input
                  autoComplete="new-password"
                  placeholder="Cree una contraseña"
                  type={isPasswordVisible ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(event) => updateField('password', event.target.value)}
                />
                <button
                  aria-label={
                    isPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'
                  }
                  className="password-toggle"
                  type="button"
                  onClick={() => setIsPasswordVisible((currentValue) => !currentValue)}
                >
                  {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </span>
            </label>
            <label>
              Confirmar contraseña
              <span className="password-control">
                <input
                  autoComplete="new-password"
                  placeholder="Repita su contraseña"
                  type={isConfirmPasswordVisible ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(event) => updateField('confirmPassword', event.target.value)}
                />
                <button
                  aria-label={
                    isConfirmPasswordVisible
                      ? 'Ocultar confirmación de contraseña'
                      : 'Mostrar confirmación de contraseña'
                  }
                  className="password-toggle"
                  type="button"
                  onClick={() =>
                    setIsConfirmPasswordVisible((currentValue) => !currentValue)
                  }
                >
                  {isConfirmPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </span>
            </label>
          </div>

          <label className="data-consent-control">
            <input
              type="checkbox"
              checked={formData.acceptsDataUse}
              onChange={(event) => updateField('acceptsDataUse', event.target.checked)}
            />
            <span>
              Acepto el uso de mis datos para gestionar mi participación en eventos
              municipales.
            </span>
          </label>

          {formError && <p className="login-error">{formError}</p>}

          <button className="primary-button register-primary-button" type="submit">
            Crear cuenta
          </button>

          <p className="register-login-link">
            ¿Ya tienes cuenta?{' '}
            <button type="button" onClick={onLogin}>
              Inicia sesión
            </button>
          </p>
        </form>
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

function CalendarClockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M7 3v3M17 3v3M4 9h18M6 5h12a2 2 0 0 1 2 2v10.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
      <path d="M12 13v3l2 1" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M16 19v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V19" />
      <path d="M9.5 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM21 19v-1.2a3.5 3.5 0 0 0-2.7-3.4M16.5 4.4a3 3 0 0 1 0 5.8" />
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
  const featuredCoverUrl = getEventCoverUrl(featuredEvent);

  return (
    <>
      <section className="hero-section" aria-labelledby="portal-title">
        <div className="hero-copy">
          <span className="section-kicker">Agenda municipal</span>
          <h1 id="portal-title">Encuentra actividades en San Miguel</h1>
          <p>
            Explora eventos culturales, deportivos y comunitarios organizados
            en San Miguel. Revisa cupos, horarios y lugares en un solo
            espacio.
          </p>
          <a className="agenda-jump-link" href="#agenda-eventos">
            Explorar agenda <span aria-hidden="true">↓</span>
          </a>
        </div>

        <article className={`featured-event media-${featuredEvent.accent}`}>
          <div className="event-visual" aria-hidden="true">
            {featuredCoverUrl && <img alt="" src={featuredCoverUrl} />}
            <span>{featuredEvent.category}</span>
          </div>
          <div className="featured-content">
            <div className="featured-labels">
              <span className="featured-kicker">Próximo evento</span>
              <span className="featured-status">{featuredEvent.status}</span>
            </div>
            <h2>{featuredEvent.title}</h2>
            <p>{getEventShortDescription(featuredEvent)}</p>
            <div className="featured-event-meta" aria-label="Datos rápidos del próximo evento">
              <span>
                <CalendarClockIcon />
                {featuredEvent.date} · {featuredEvent.time}
              </span>
              <span>
                <UsersIcon />
                {featuredEvent.spots} cupos disponibles
              </span>
            </div>
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

      <span className="section-anchor" id="eventos" aria-hidden="true" />
      <section className="content-grid" id="agenda-eventos">
        <div className="events-area">
          <div className="section-heading">
            <div>
              <span className="section-kicker">Eventos disponibles</span>
              <h2>Agenda para ciudadanos</h2>
            </div>
            <p>{filteredEvents.length} actividades encontradas</p>
          </div>

          <form className="search-panel agenda-search-panel" role="search">
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
            {filteredEvents.map((event) => {
              const coverUrl = getEventCoverUrl(event);
              const shortDescription = getEventShortDescription(event);

              return (
              <article className="event-card" key={event.id}>
                <div className={`event-card-media media-${event.accent}`}>
                  {coverUrl && <img alt="" src={coverUrl} />}
                </div>
                <div className="event-card-body">
                  <time>{event.date}</time>
                  <h3>{event.title}</h3>
                  <p>{shortDescription}</p>
                  <span>{event.venue}</span>
                </div>
                <div className="event-card-action">
                  <time>{event.time}</time>
                  <button type="button" onClick={() => onEventSelect(event)}>
                    Ver detalle
                  </button>
                </div>
              </article>
              );
            })}
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
      <section className="next-panel">
        <h2>Próximas fechas</h2>
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

function ConfirmRegistrationModal({ eventTitle, onCancel, onConfirm }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section
        aria-labelledby="confirm-registration-title"
        aria-modal="true"
        className="confirm-modal"
        role="dialog"
      >
        <span className="section-kicker">Confirmar inscripción</span>
        <h2 id="confirm-registration-title">
          ¿Estás seguro de inscribirte al evento "{eventTitle}"?
        </h2>
        <p>
          Al confirmar se generará tu constancia de inscripción usando los datos
          de tu perfil ciudadano.
        </p>
        <div className="modal-actions">
          <button className="back-button" type="button" onClick={onCancel}>
            Volver al evento
          </button>
          <button className="primary-button" type="button" onClick={onConfirm}>
            Sí, inscribirme
          </button>
        </div>
      </section>
    </div>
  );
}

function LoginRequiredModal({ onCancel, onLogin, onRegister }) {
  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === 'Escape') {
        onCancel();
      }
    }

    window.addEventListener('keydown', closeOnEscape);

    return () => {
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [onCancel]);

  return (
    <div className="modal-backdrop" role="presentation" onClick={onCancel}>
      <section
        aria-labelledby="login-required-title"
        aria-modal="true"
        className="confirm-modal login-required-modal"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="section-kicker">Acceso requerido</span>
        <h2 id="login-required-title">Inicia sesi&oacute;n y reserva tu lugar</h2>
        <p>
          Accede con tu cuenta vecinal para confirmar tu participaci&oacute;n y
          guardar tus reservas de eventos municipales.
        </p>
        <div className="modal-actions">
          <button className="back-button" type="button" onClick={onCancel}>
            Cancelar
          </button>
          <button className="primary-button" type="button" onClick={onLogin}>
            Iniciar sesi&oacute;n
          </button>
        </div>
        <p className="login-required-register-link">
          ¿Aún no tienes cuenta?{' '}
          <button type="button" onClick={onRegister}>
            Crear cuenta vecinal
          </button>
        </p>
      </section>
    </div>
  );
}

function RegistrationReceipt({ event, receiptCode, registration, user, onBack, onPrint }) {
  const participantName =
    registration.fullName ||
    user?.nombreCompleto ||
    [user?.nombres, user?.apellidos].filter(Boolean).join(' ') ||
    'Sergio André Bustamante Villanueva';
  const participantDni = registration.documentNumber || user?.dni || '12345678';

  function downloadReceipt() {
    // TODO: conectar con endpoint de descarga de constancia cuando exista backend.
    onPrint();
  }

  return (
    <section className="receipt-shell" aria-labelledby="receipt-title">
      <article className="receipt-card">
        <header className="receipt-header">
          <div>
            <span className="section-kicker">Constancia de inscripción</span>
            <h1 id="receipt-title">Inscripción confirmada</h1>
            <p>
              Tu reserva fue registrada correctamente. Presenta el código QR el
              día del evento.
            </p>
          </div>
          <HardcodedQrCode value={receiptCode} />
        </header>

        <div className="receipt-code">
          <span>Código de inscripción:</span>
          <strong>{receiptCode}</strong>
        </div>

        <dl className="receipt-details">
          <div>
            <dt>Participante</dt>
            <dd>{participantName}</dd>
          </div>
          <div>
            <dt>DNI</dt>
            <dd>{participantDni}</dd>
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
            <dt>Dirección</dt>
            <dd>{event.address}</dd>
          </div>
        </dl>

        <div className="receipt-note">
          <p>Se envió una constancia a tu correo electrónico.</p>
        </div>

        <div className="receipt-actions no-print">
          <button className="detail-back-link receipt-back-link" type="button" onClick={onBack}>
            <span aria-hidden="true">←</span>
            Volver a eventos
          </button>
          <button
            className="receipt-download-link"
            type="button"
            onClick={downloadReceipt}
          >
            <DownloadIcon />
            Descargar constancia
          </button>
        </div>
      </article>
    </section>
  );
}

function DownloadIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 3v11" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 20h14" />
    </svg>
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
