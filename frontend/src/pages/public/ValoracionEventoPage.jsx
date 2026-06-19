import { useEffect, useMemo, useState } from 'react';
import municipalLogo from '../../assets/images/municipalidad-logo.png';
import StarRating from '../../components/public/StarRating';
import {
  enviarValoracion,
  validarTokenValoracion,
} from '../../services/valoracionesService';
import './ValoracionEventoPage.css';
import LoadingButton from '../../components/feedback/LoadingButton';

const statusContent = {
  RESPONDIDO: {
    icon: '✓',
    title: 'Valoración registrada',
    text: 'Este evento ya fue valorado anteriormente.',
    tone: 'success',
  },
  EXPIRADO: {
    icon: '!',
    title: 'Enlace expirado',
    text: 'El periodo para valorar este evento ha finalizado.',
    tone: 'warning',
  },
  INVALIDO: {
    icon: '!',
    title: 'Enlace no válido',
    text: 'No pudimos validar este enlace de valoración.',
    tone: 'error',
  },
};

function formatEventDate(value) {
  if (!value) {
    return 'Fecha por confirmar';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Fecha por confirmar';
  }

  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(date);
}

function getTokenFromUrl() {
  return new URLSearchParams(window.location.search).get('token')?.trim() ?? '';
}

function ValoracionEventoPage() {
  const token = useMemo(getTokenFromUrl, []);
  const [eventData, setEventData] = useState(null);
  const [pageState, setPageState] = useState(token ? 'loading' : 'invalid-link');
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }

    let isMounted = true;

    validarTokenValoracion(token)
      .then((data) => {
        if (!isMounted) {
          return;
        }

        setEventData(data);
        setPageState(data?.estado || 'INVALIDO');
      })
      .catch(() => {
        if (isMounted) {
          setPageState('connection-error');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  async function submitRating() {
    if (isSubmitting || rating < 1 || rating > 5) {
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await enviarValoracion({ token, puntuacion: rating });
      const responseStatus = response?.estado;

      if (responseStatus && responseStatus !== 'PENDIENTE') {
        setPageState(responseStatus);
        return;
      }

      setPageState('success');
    } catch (error) {
      const responseStatus = error.response?.data?.estado;

      if (responseStatus) {
        setPageState(responseStatus);
      } else {
        setPageState('submit-error');
      }
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
        ) : pageState === 'invalid-link' ? (
          <StatusCard
            icon="!"
            text="El enlace de valoración no es válido."
            title="Enlace no válido"
            tone="error"
          />
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
        ) : pageState === 'success' ? (
          <StatusCard
            icon="✓"
            text="Tu respuesta fue registrada correctamente."
            title="¡Gracias por tu valoración!"
            tone="success"
          />
        ) : pageState === 'PENDIENTE' ? (
          <article className="rating-card">
            <span className="section-kicker">Valoración de evento</span>
            <h1>Valora tu experiencia</h1>
            <p>Tu opinión ayuda a mejorar los próximos eventos municipales.</p>

            <div className="rating-event-summary">
              <strong>{eventData?.tituloEvento ?? 'Evento municipal'}</strong>
              <time>{formatEventDate(eventData?.fechaEvento)}</time>
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
              {isSubmitting ? 'Enviando...' : 'Enviar valoración'}
            </LoadingButton>
          </article>
        ) : (
          <StatusCard {...(statusContent[pageState] ?? statusContent.INVALIDO)} />
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
    </article>
  );
}

export default ValoracionEventoPage;
