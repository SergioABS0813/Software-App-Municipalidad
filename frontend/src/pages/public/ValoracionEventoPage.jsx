import { useEffect, useMemo, useState } from 'react';
import municipalLogo from '../../assets/images/municipalidad-logo.webp';
import StarRating from '../../components/public/StarRating';
import {
  enviarValoracion,
  obtenerValoracion,
} from '../../services/valoracionesService';
import './ValoracionEventoPage.css';
import LoadingButton from '../../components/feedback/LoadingButton';

const statusContent = {
  RESPONDIDA: {
    icon: '✓',
    title: 'Esta valoración ya fue registrada',
    text: 'Gracias por participar.',
    tone: 'success',
  },
  RESPONDIDO: {
    icon: '✓',
    title: 'Esta valoración ya fue registrada',
    text: 'Gracias por participar.',
    tone: 'success',
  },
  EXPIRADA: {
    icon: '!',
    title: 'Este enlace de valoración ya expiró',
    text: 'El periodo disponible para calificar este evento ha finalizado.',
    tone: 'warning',
  },
  EXPIRADO: {
    icon: '!',
    title: 'Este enlace de valoración ya expiró',
    text: 'El periodo disponible para calificar este evento ha finalizado.',
    tone: 'warning',
  },
  INVALIDA: {
    icon: '!',
    title: 'No se encontró la valoración solicitada',
    text: 'Verifica el enlace recibido o vuelve al portal ciudadano.',
    tone: 'error',
  },
  INVALIDO: {
    icon: '!',
    title: 'No se encontró la valoración solicitada',
    text: 'Verifica el enlace recibido o vuelve al portal ciudadano.',
    tone: 'error',
  },
};

function formatEventDate(startValue, endValue) {
  if (!startValue) {
    return 'Fecha por confirmar';
  }

  const startDate = new Date(startValue);
  const endDate = endValue ? new Date(endValue) : null;

  if (Number.isNaN(startDate.getTime())) {
    return 'Fecha por confirmar';
  }

  const dateLabel = new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(startDate);

  if (!endDate || Number.isNaN(endDate.getTime())) {
    return dateLabel;
  }

  const endTime = new Intl.DateTimeFormat('es-PE', {
    timeStyle: 'short',
  }).format(endDate);

  return `${dateLabel} - ${endTime}`;
}

function getTokenFromUrl() {
  const pathMatch = window.location.pathname.match(/^\/satisfaccion\/([^/]+)$/);
  if (pathMatch?.[1]) {
    return decodeURIComponent(pathMatch[1]).trim();
  }

  return new URLSearchParams(window.location.search).get('token')?.trim() ?? '';
}

function ValoracionEventoPage({ view }) {
  const token = useMemo(getTokenFromUrl, []);
  const [eventData, setEventData] = useState(null);
  const [pageState, setPageState] = useState(view === 'thanks' ? 'thanks' : token ? 'loading' : 'INVALIDA');
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (view === 'thanks' || !token) {
      return undefined;
    }

    let isMounted = true;

    obtenerValoracion(token)
      .then((data) => {
        if (!isMounted) {
          return;
        }

        setEventData(data);
        setPageState(data?.estadoValoracion || 'INVALIDA');
      })
      .catch((error) => {
        if (isMounted) {
          setPageState(error.response?.status === 404 ? 'INVALIDA' : 'connection-error');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token, view]);

  async function submitRating() {
    if (isSubmitting || rating < 1 || rating > 5) {
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await enviarValoracion({ token, puntuacion: rating });
      const responseStatus = response?.estadoValoracion;

      if (responseStatus === 'RESPONDIDA' || responseStatus === 'RESPONDIDO') {
        window.location.assign('/satisfaccion/gracias');
        return;
      }

      if (responseStatus && responseStatus !== 'PENDIENTE') {
        setPageState(responseStatus);
        return;
      }

      window.location.assign('/satisfaccion/gracias');
    } catch (error) {
      const responseStatus = error.response?.data?.estadoValoracion;
      setPageState(responseStatus || 'submit-error');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="rating-page">
      <header className="rating-header">
        <a className="rating-brand" href="/eventos">
          <img alt="Logo Municipalidad de San Miguel" src={municipalLogo} />
          <span>
            <strong>Municipalidad de San Miguel</strong>
            <small>Portal de eventos</small>
          </span>
        </a>
      </header>

      <section className="rating-shell" aria-live="polite">
        {pageState === 'loading' ? (
          <RatingSkeleton />
        ) : pageState === 'connection-error' ? (
          <StatusCard
            icon="!"
            text="No pudimos conectar con el servicio de valoración. Inténtalo nuevamente en unos minutos."
            title="Servicio no disponible"
            tone="error"
          />
        ) : pageState === 'submit-error' ? (
          <StatusCard
            icon="!"
            text="No pudimos registrar tu valoración. Inténtalo nuevamente."
            title="No se envió la valoración"
            tone="error"
          />
        ) : pageState === 'thanks' ? (
          <StatusCard
            icon="✓"
            text="Tu valoración ha sido registrada correctamente. Tu opinión nos ayuda a mejorar los próximos eventos municipales."
            title="Gracias por participar"
            tone="success"
          />
        ) : pageState === 'PENDIENTE' ? (
          <article className="rating-card">
            <span className="section-kicker">Valoración de evento</span>
            <h1>Califica tu experiencia</h1>
            <p>Tu opinión ayuda a mejorar los próximos eventos municipales.</p>

            <div className="rating-event-summary">
              <strong>{eventData?.eventoTitulo ?? 'Evento municipal'}</strong>
              <time>{formatEventDate(eventData?.fechaHoraInicio, eventData?.fechaHoraFin)}</time>
            </div>

            <StarRating disabled={isSubmitting} value={rating} onChange={setRating} />

            <LoadingButton
              className="rating-submit-button"
              disabled={rating < 1 || isSubmitting}
              loading={isSubmitting}
              loadingLabel="Enviando..."
              type="button"
              onClick={submitRating}
            >
              Enviar valoración
            </LoadingButton>
          </article>
        ) : (
          <StatusCard {...(statusContent[pageState] ?? statusContent.INVALIDA)} />
        )}
      </section>
    </main>
  );
}

function RatingSkeleton() {
  return (
    <article className="rating-card rating-skeleton-card" aria-label="Cargando valoración">
      <span className="rating-skeleton rating-skeleton-kicker" />
      <span className="rating-skeleton rating-skeleton-title" />
      <span className="rating-skeleton rating-skeleton-text" />
      <span className="rating-skeleton rating-skeleton-event" />
      <div className="rating-skeleton-stars">
        {[1, 2, 3, 4, 5].map((item) => (
          <span className="rating-skeleton-star" key={item} />
        ))}
      </div>
      <span className="rating-skeleton rating-skeleton-button" />
    </article>
  );
}

function StatusCard({ icon, text, title, tone }) {
  return (
    <article className={`rating-card rating-status-card is-${tone}`}>
      <span className="rating-status-icon" aria-hidden="true">
        {icon}
      </span>
      <h1>{title}</h1>
      <p>{text}</p>
      <a className="rating-return-button" href="/eventos">
        Volver al portal ciudadano
      </a>
    </article>
  );
}

export default ValoracionEventoPage;