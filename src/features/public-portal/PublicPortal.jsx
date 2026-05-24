import { useMemo, useState } from 'react';
import { eventCategories, events } from './data/events';
import './PublicPortal.css';

const emptyRegistration = {
  fullName: '',
  documentNumber: '',
  email: '',
  phone: '',
  acceptsTerms: false,
};

function PublicPortal() {
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registration, setRegistration] = useState(emptyRegistration);
  const [isRegistered, setIsRegistered] = useState(false);

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
    setSelectedEvent(event);
    setRegistration(emptyRegistration);
    setIsRegistered(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function closeEventDetail() {
    setSelectedEvent(null);
    setRegistration(emptyRegistration);
    setIsRegistered(false);
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
    setIsRegistered(true);
  }

  return (
    <main className="citizen-portal">
      <PortalHeader onHome={closeEventDetail} />

      {selectedEvent ? (
        <EventDetail
          event={selectedEvent}
          isRegistered={isRegistered}
          registration={registration}
          onBack={closeEventDetail}
          onFieldChange={updateRegistration}
          onSubmit={submitRegistration}
        />
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

function PortalHeader({ onHome }) {
  return (
    <header className="portal-header">
      <button className="brand brand-button" type="button" onClick={onHome}>
        <span className="brand-mark">EC</span>
        <span>
          <strong>Eventos Ciudadanos</strong>
          <small>Gobierno local</small>
        </span>
      </button>

      <nav className="portal-nav" aria-label="Navegacion principal">
        <a href="#eventos">Eventos</a>
        <a href="#agenda">Agenda</a>
        <a href="#ayuda">Ayuda</a>
      </nav>

      <button className="outline-button" type="button">
        Ingresar
      </button>
    </header>
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
                placeholder="Nombre, distrito o lugar"
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
  isRegistered,
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

          {isRegistered ? (
            <div className="confirmation-card">
              <span>Registro recibido</span>
              <h2>Tu preinscripcion fue generada</h2>
              <p>
                Se envio una constancia a {registration.email}. Presenta tu DNI
                en el punto de control del evento.
              </p>
              <div className="ticket-code">EC-{event.id}024</div>
            </div>
          ) : (
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
          )}
        </aside>
      </div>
    </section>
  );
}

export default PublicPortal;
