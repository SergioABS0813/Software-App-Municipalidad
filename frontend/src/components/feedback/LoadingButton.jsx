import './LoadingButton.css';

export default function LoadingButton({
  children,
  className = '',
  disabled = false,
  loading = false,
  loadingLabel = 'Procesando…',
  type = 'button',
  variant = '',
  ...buttonProps
}) {
  const classes = ['loading-button', variant && `is-${variant}`, className]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      {...buttonProps}
      aria-busy={loading || undefined}
      className={classes}
      disabled={disabled || loading}
      type={type}
    >
      <span className="loading-button-content" aria-hidden={loading || undefined}>
        {children}
      </span>
      {loading && (
        <span className="loading-button-progress">
          <span className="loading-button-spinner" aria-hidden="true" />
          <span>{loadingLabel}</span>
        </span>
      )}
    </button>
  );
}
