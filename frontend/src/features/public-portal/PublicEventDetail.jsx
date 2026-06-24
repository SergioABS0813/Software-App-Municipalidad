import { useState } from 'react';

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

function parseEventDurationMinutes(duration) {
  const hoursMatch = duration?.match(/(\d+(?:[.,]\d+)?)\s*hora/i);
  const minutesMatch = duration?.match(/(\d+)\s*min/i);
  const hours = hoursMatch ? Number(hoursMatch[1].replace(',', '.')) : 0;
  const minutes = minutesMatch ? Number(minutesMatch[1]) : 0;
  const totalMinutes = hours * 60 + minutes;

  return totalMinutes > 0 ? totalMinutes : null;
}

function formatEventClock(date) {
  const hours24 = date.getHours();
  const minutes = date.getMinutes();
  const period = hours24 >= 12 ? 'p.m.' : 'a.m.';
  const hours12 = hours24 % 12 || 12;

  return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
}

function getEventMapsUrl(event) {
  const locationQuery = [event.address, event.venue].filter(Boolean).join(', ');

  if (!locationQuery) {
    return null;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationQuery)}`;
}

function getEventScheduleLabel(event) {
  const startDate = parseEventDateTime(event);
  const durationMinutes = parseEventDurationMinutes(event.duration);

  if (!startDate || !durationMinutes) {
    return `${event.date} · ${event.time}`;
  }

  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  return `${event.date} · ${formatEventClock(startDate)} - ${formatEventClock(endDate)}`;
}

function getAvailabilityState(spots) {
  const availableSpots = Number(spots) || 0;

  if (availableSpots <= 0) {
    return {
      isAvailable: false,
      label: 'Sin cupos disponibles',
      tone: 'empty',
    };
  }

  if (availableSpots <= 5) {
    return {
      isAvailable: true,
      label: `Últimos ${availableSpots} cupos`,
      tone: 'low',
    };
  }

  return {
    isAvailable: true,
    label: `${availableSpots} cupos`,
    tone: 'available',
  };
}

function getEventShortDescription(event) {
  return event.descripcion_breve || event.descripcion || event.summary || event.description || '';
}

function getOrderedTextItems(items = []) {
  return items
    .map((item, index) => ({
      descripcion:
        typeof item === 'string' ? item : item?.descripcion ?? item?.description ?? '',
      orden: Number(item?.orden ?? index + 1),
    }))
    .filter((item) => item.descripcion.trim().length > 0)
    .sort((firstItem, secondItem) => firstItem.orden - secondItem.orden)
    .map((item) => item.descripcion);
}

function getEventAudienceLabel(event) {
  const audienceType =
    event.publico_tipo ?? (event.edad_minima || event.edad_maxima ? 'OBJETIVO' : 'GENERAL');

  if (audienceType === 'OBJETIVO' && event.edad_minima !== null && event.edad_maxima !== null) {
    return `${event.edad_minima}-${event.edad_maxima} años`;
  }

  return event.audience || 'Público general';
}

const eventMaterialPriority = {
  AFICHE: 0,
  VIDEO: 1,
};

function getEventMaterialResources(event) {
  const resources = Array.isArray(event.recursos)
    ? event.recursos
    : Array.isArray(event.resources)
      ? event.resources
      : [];

  return resources
    .map((resource) => ({
      ...resource,
      tipo_recurso: resource.tipo_recurso?.toUpperCase(),
    }))
    .filter((resource) => resource.tipo_recurso in eventMaterialPriority)
    .sort(
      (firstResource, secondResource) =>
        eventMaterialPriority[firstResource.tipo_recurso] -
        eventMaterialPriority[secondResource.tipo_recurso],
    );
}

function getResourceUrl(resource) {
  return resource?.signedUrl ?? resource?.url_recurso ?? resource?.url ?? '';
}

function isPdfResource(resource) {
  const mimeType = resource?.mime_type ?? resource?.mimeType ?? '';
  const resourceUrl = getResourceUrl(resource);
  const fileName = resource?.nombre_archivo ?? resource?.nombreOriginal ?? '';

  return mimeType === 'application/pdf' || /\.pdf($|[?#])/i.test(resourceUrl) || /\.pdf$/i.test(fileName);
}

function getVideoEmbedUrl(url) {
  if (!url) {
    return null;
  }

  try {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      const videoId = parsedUrl.pathname.split('/').filter(Boolean)[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsedUrl.pathname.startsWith('/embed/')) {
        return url;
      }

      const videoId = parsedUrl.searchParams.get('v');
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (host === 'vimeo.com') {
      const videoId = parsedUrl.pathname.split('/').filter(Boolean)[0];
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
    }
  } catch {
    return null;
  }

  return null;
}

function isDirectVideoUrl(url) {
  return /\.(mp4|webm|ogg)(?:\?.*)?$/i.test(url);
}

function EventMaterialSection({ event }) {
  const materialResources = getEventMaterialResources(event);
  const [activeMaterialType, setActiveMaterialType] = useState('AFICHE');

  if (materialResources.length === 0) {
    return null;
  }

  const availableTypes = materialResources.map((resource) => resource.tipo_recurso);
  const hasMultipleResources = materialResources.length > 1;
  const selectedType = availableTypes.includes(activeMaterialType)
    ? activeMaterialType
    : availableTypes[0];
  const selectedResource =
    materialResources.find((resource) => resource.tipo_recurso === selectedType) ??
    materialResources[0];

  return (
    <section className="detail-section event-material-section">
      <div className="section-heading compact">
        <div>
          <span className="section-kicker">Material del evento</span>
          <h2>Afiche y contenido informativo</h2>
        </div>
      </div>

      {hasMultipleResources && (
        <div className="event-material-tabs" aria-label="Seleccionar material del evento">
          {materialResources.map((resource) => (
            <button
              className={selectedType === resource.tipo_recurso ? 'active' : ''}
              key={resource.recurso_id ?? resource.tipo_recurso}
              type="button"
              onClick={() => setActiveMaterialType(resource.tipo_recurso)}
            >
              {resource.tipo_recurso === 'AFICHE' ? 'Afiche oficial' : 'Video'}
            </button>
          ))}
        </div>
      )}

      <EventMaterialPreview resource={selectedResource} />
    </section>
  );
}

function EventMaterialPreview({ resource }) {
  if (resource.tipo_recurso === 'AFICHE') {
    return <EventPosterPreview resource={resource} />;
  }

  return <EventVideoPreview resource={resource} />;
}

function EventPosterPreview({ resource }) {
  const posterUrl = getResourceUrl(resource);
  const posterName = resource.nombre_archivo ?? resource.nombreOriginal ?? 'Afiche oficial del evento';

  if (isPdfResource(resource)) {
    return (
      <div className="event-poster-preview is-pdf">
        <div className="event-poster-pdf-card">
          <strong>Afiche en PDF</strong>
          <span>{posterName}</span>
        </div>
        <a href={posterUrl} rel="noopener noreferrer" target="_blank">
          Abrir afiche PDF
        </a>
      </div>
    );
  }

  return (
    <div className="event-poster-preview">
      <img alt={posterName} src={posterUrl} />
      <a href={posterUrl} rel="noopener noreferrer" target="_blank">
        Ver afiche completo
      </a>
    </div>
  );
}

function EventVideoPreview({ resource }) {
  const videoUrl = getResourceUrl(resource);
  const embedUrl = getVideoEmbedUrl(videoUrl);

  if (embedUrl) {
    return (
      <div className="event-video-preview">
        <iframe
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          src={embedUrl}
          title={resource.nombre_archivo ?? 'Video del evento'}
        />
      </div>
    );
  }

  if (isDirectVideoUrl(videoUrl)) {
    return (
      <div className="event-video-preview">
        <video controls src={videoUrl}>
          <a href={videoUrl} rel="noopener noreferrer" target="_blank">
            Ver video
          </a>
        </video>
      </div>
    );
  }

  return (
    <div className="event-video-link-card">
      <strong>Video del evento</strong>
      <p>Abre el contenido informativo en una nueva pestaña.</p>
      <a href={videoUrl} rel="noopener noreferrer" target="_blank">
        Ver video
      </a>
    </div>
  );
}

export default function PublicEventDetail({
  backLabel = 'Volver a eventos',
  event,
  onBack,
  onSubmit,
}) {
  const mapsUrl = getEventMapsUrl(event);
  const scheduleLabel = getEventScheduleLabel(event);
  const availabilityState = getAvailabilityState(event.spots);
  const requirementItems = getOrderedTextItems(event.requisitos_evento ?? event.requirements);
  const agendaItems = getOrderedTextItems(event.agenda_evento ?? event.agenda);
  const audienceLabel = getEventAudienceLabel(event);

  return (
    <section className="detail-shell" aria-labelledby="event-detail-title">
      <div className="detail-hero">
        <div className={`detail-media media-${event.accent}`}>
          {event.imageUrl ? (
            <img alt="" src={event.imageUrl} />
          ) : null}
          <span>{event.category}</span>
        </div>
      </div>

      <div className="detail-layout">
        <div className="detail-content">
          <div className="detail-heading">
            <button className="detail-back-link" type="button" onClick={onBack}>
              <span aria-hidden="true">←</span>
              {backLabel}
            </button>

            <h1 id="event-detail-title">{event.title}</h1>
            <p>{getEventShortDescription(event)}</p>
            <div className="detail-quick-meta" aria-label="Datos rápidos del evento">
              <span>
                <CalendarClockIcon />
                {scheduleLabel}
              </span>
              {mapsUrl ? (
                <a href={mapsUrl} rel="noopener noreferrer" target="_blank">
                  <MapPinIcon />
                  {event.venue}
                </a>
              ) : (
                <span>
                  <MapPinIcon />
                  {event.venue}
                </span>
              )}
            </div>
          </div>

          <div className="detail-main">
            <section className="detail-section two-columns">
              <div>
                <span className="section-kicker">Antes de asistir</span>
                <h2>Requisitos</h2>
                <ul className="check-list">
                  {requirementItems.map((requirement) => (
                    <li key={requirement}>{requirement}</li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="section-kicker">Programa</span>
                <h2>Agenda prevista</h2>
                <ol className="timeline-list">
                  {agendaItems.map((agendaItem) => (
                    <li key={agendaItem}>{agendaItem}</li>
                  ))}
                </ol>
              </div>
            </section>

            <EventMaterialSection event={event} />
          </div>
        </div>

        <aside className="reservation-card" aria-label="Reserva al evento">
          <div className="reservation-card-header">
            <span className="section-kicker">PREINSCRIPCIÓN</span>
            <h2>Reserva tu participación</h2>
          </div>

          <div className={`reservation-availability ${availabilityState.tone}`}>
            <strong>{availabilityState.label}</strong>
            <span>
              {availabilityState.isAvailable
                ? 'Disponibles para este evento'
                : 'No hay disponibilidad por ahora'}
            </span>
          </div>

          <div className="reservation-info-list">
            <div className="reservation-info-row is-muted-value">
              <span className="reservation-icon">
                <CalendarClockIcon />
              </span>
              <div className="reservation-info-text">
                <span>Fecha y hora</span>
                <strong>{scheduleLabel}</strong>
              </div>
            </div>

            {mapsUrl ? (
              <a
                className="reservation-info-row reservation-location-link"
                href={mapsUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                <span className="reservation-icon">
                  <MapPinIcon />
                </span>
                <div className="reservation-info-text">
                  <span>Ubicación</span>
                  <strong>{event.venue}</strong>
                  {event.address && <small>{event.address}</small>}
                </div>
                <ExternalLinkIcon />
              </a>
            ) : (
              <div className="reservation-info-row">
                <span className="reservation-icon">
                  <MapPinIcon />
                </span>
                <div className="reservation-info-text">
                  <span>Ubicación</span>
                  <strong>{event.venue}</strong>
                </div>
              </div>
            )}

            <div className="reservation-info-row is-muted-value">
              <span className="reservation-icon">
                <UsersIcon />
              </span>
              <div className="reservation-info-text">
                <span>Dirigido a</span>
                <strong>{audienceLabel}</strong>
              </div>
            </div>

            <div className="reservation-info-row is-muted-value">
              <span className="reservation-icon">
                <BuildingIcon />
              </span>
              <div className="reservation-info-text">
                <span>Área responsable</span>
                <strong>{event.organizer}</strong>
              </div>
            </div>
          </div>

          <form className="reservation-action" onSubmit={onSubmit}>
            <button
              className="primary-button reservation-button"
              disabled={!availabilityState.isAvailable}
              type="submit"
            >
              Reservar un lugar
            </button>
          </form>
        </aside>
      </div>
    </section>
  );
}

function CalendarClockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M7 3v3" />
      <path d="M17 3v3" />
      <path d="M4 8h16" />
      <path d="M5 5h14v15H5z" />
      <path d="M12 12v4l3 2" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 21s7-5.4 7-11a7 7 0 0 0-14 0c0 5.6 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M16 11a4 4 0 1 0-8 0" />
      <path d="M5 21a7 7 0 0 1 14 0" />
      <path d="M19 8a3 3 0 0 1 2 2.8" />
      <path d="M3 10.8A3 3 0 0 1 5 8" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M4 21V5l8-3 8 3v16" />
      <path d="M9 21v-6h6v6" />
      <path d="M8 8h.01M12 8h.01M16 8h.01M8 12h.01M12 12h.01M16 12h.01" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M14 4h6v6" />
      <path d="m10 14 10-10" />
      <path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5" />
    </svg>
  );
}
