import './LoadingStates.css';

function SkeletonBlock({ className = '' }) {
  return <span aria-hidden="true" className={`skeleton-block ${className}`.trim()} />;
}

export function CardSkeleton({ count = 1 }) {
  return (
    <div className="skeleton-card-grid">
      {Array.from({ length: count }, (_, index) => (
        <article className="skeleton-card" key={index}>
          <SkeletonBlock className="is-icon" />
          <div>
            <SkeletonBlock className="is-label" />
            <SkeletonBlock className="is-value" />
            <SkeletonBlock className="is-caption" />
          </div>
        </article>
      ))}
    </div>
  );
}

export function TableSkeleton({ columns = 5, rows = 5 }) {
  return (
    <div className="skeleton-table" role="status" aria-label="Cargando tabla">
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div className="skeleton-table-row" key={rowIndex} style={{ '--skeleton-columns': columns }}>
          {Array.from({ length: columns }, (_, columnIndex) => (
            <SkeletonBlock className={columnIndex === 0 ? 'is-wide' : ''} key={columnIndex} />
          ))}
        </div>
      ))}
      <span className="sr-only">Cargando información…</span>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="skeleton-form" role="status" aria-label="Cargando formulario">
      {Array.from({ length: 3 }, (_, sectionIndex) => (
        <section className="skeleton-form-section" key={sectionIndex}>
          <SkeletonBlock className="is-kicker" />
          <SkeletonBlock className="is-heading" />
          <div className="skeleton-form-grid">
            {Array.from({ length: 4 }, (_, fieldIndex) => (
              <div className={fieldIndex === 2 ? 'skeleton-field is-wide' : 'skeleton-field'} key={fieldIndex}>
                <SkeletonBlock className="is-label" />
                <SkeletonBlock className="is-input" />
              </div>
            ))}
          </div>
        </section>
      ))}
      <span className="sr-only">Cargando formulario…</span>
    </div>
  );
}

export function EventFormSkeleton() {
  return (
    <section className="event-form-skeleton" role="status" aria-label="Preparando formulario del evento">
      <div className="skeleton-page-heading">
        <div><SkeletonBlock className="is-kicker" /><SkeletonBlock className="is-title" /></div>
        <SkeletonBlock className="is-button" />
      </div>
      <div className="event-form-skeleton-layout">
        <FormSkeleton />
        <aside><CardSkeleton count={2} /></aside>
      </div>
      <span className="sr-only">Preparando todos los datos del evento…</span>
    </section>
  );
}

export function DetailSkeleton() {
  return <div className="detail-skeleton"><SkeletonBlock className="is-hero" /><CardSkeleton count={3} /></div>;
}

export function ListSkeleton({ count = 4 }) {
  return <div className="list-skeleton">{Array.from({ length: count }, (_, index) => <EventCardSkeleton key={index} />)}</div>;
}

export function EventCardSkeleton() {
  return <article className="event-card-skeleton"><SkeletonBlock className="is-image" /><div><SkeletonBlock className="is-label" /><SkeletonBlock className="is-title" /><SkeletonBlock className="is-caption" /><SkeletonBlock className="is-button" /></div></article>;
}

export function DashboardSkeleton({ tableColumns = 5 }) {
  return <div className="dashboard-skeleton" role="status" aria-label="Cargando panel"><CardSkeleton count={4} /><section className="skeleton-panel"><SkeletonBlock className="is-heading" /><TableSkeleton columns={tableColumns} /></section></div>;
}

export function PageSkeleton() {
  return <div className="page-skeleton" role="status" aria-label="Cargando página"><SkeletonBlock className="is-title" /><SkeletonBlock className="is-caption" /><DashboardSkeleton /></div>;
}

export function ErrorState({ actionLabel = 'Reintentar', description, onRetry, title = 'No pudimos cargar la información' }) {
  return <section className="feedback-state is-error" role="alert"><span className="feedback-state-icon" aria-hidden="true">!</span><h3>{title}</h3>{description && <p>{description}</p>}{onRetry && <button type="button" onClick={onRetry}>{actionLabel}</button>}</section>;
}

export function EmptyState({ actionLabel, description, onAction, title = 'No hay información disponible' }) {
  return <section className="feedback-state is-empty"><span className="feedback-state-icon" aria-hidden="true">○</span><h3>{title}</h3>{description && <p>{description}</p>}{onAction && <button type="button" onClick={onAction}>{actionLabel}</button>}</section>;
}
