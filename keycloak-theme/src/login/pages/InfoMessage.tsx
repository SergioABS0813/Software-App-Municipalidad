import { kcSanitize } from "keycloakify/lib/kcSanitize";
import type { I18n } from "../i18n";
import type { KcContext } from "../KcContext";
import municipalLogo from "../assets/municipalidad-logo.png";

type InfoKcContext = Extract<KcContext, { pageId: "info.ftl" }>;

function getBackToEventsUrl(kcContext: InfoKcContext) {
    if (kcContext.pageRedirectUri) return kcContext.pageRedirectUri;
    if (kcContext.client.baseUrl) return kcContext.client.baseUrl;
    if (typeof window === "undefined") return "/";
    return window.location.origin;
}

export default function InfoMessage(props: {
    kcContext: InfoKcContext;
    i18n: I18n;
}) {
    const { kcContext } = props;
    const { actionUri, requiredActions, skipLink, url, message } = kcContext;

    const backToEventsUrl = getBackToEventsUrl(kcContext);
    const summary = message?.summary?.trim() ?? "";
    const normalizedSummary = summary.toLowerCase();

    const isPendingPasswordAction = Boolean(
        !skipLink && actionUri && requiredActions?.includes("UPDATE_PASSWORD")
    );

    const isExpiredAction =
        normalizedSummary.includes("caduc") ||
        normalizedSummary.includes("expir") ||
        normalizedSummary.includes("expired");

    const isTokenOrCookieError =
        normalizedSummary.includes("token") ||
        normalizedSummary.includes("cookie") ||
        normalizedSummary.includes("sesión") ||
        normalizedSummary.includes("session");

    const isSuccess = message?.type === "success" && !isPendingPasswordAction;

    const title = isPendingPasswordAction
        ? "Configurar contraseña"
        : isSuccess
            ? "Contraseña configurada"
            : isExpiredAction
                ? "Enlace caducado"
                : isTokenOrCookieError
                    ? "No se pudo validar la solicitud"
                    : "Información de cuenta";

    const description = isPendingPasswordAction
        ? "Para continuar, confirma la acción solicitada."
        : isSuccess
            ? "Tu contraseña de acceso fue configurada correctamente. Ya puedes ingresar a la plataforma."
            : isExpiredAction
                ? "El enlace utilizado ya expiró o fue usado anteriormente. Solicita un nuevo enlace desde la plataforma."
                : isTokenOrCookieError
                    ? "No encontramos una sesión válida o el token necesario para continuar. Vuelve a iniciar el proceso."
                    : "Revisa el detalle de la solicitud para continuar.";

    const buttonLabel = isPendingPasswordAction
        ? "Continuar"
        : isSuccess
            ? "Ingresar a la plataforma"
            : "Volver a la plataforma";

    const buttonHref = isPendingPasswordAction && actionUri
        ? actionUri
        : backToEventsUrl || url.loginUrl;

    return (
        <main className="kc-login-shell">
            <section className="kc-login-form-side" aria-labelledby="kc-info-title">
                <div className="kc-login-brand">
                    <img
                        alt="Logo Municipalidad de San Miguel"
                        className="kc-municipality-logo kc-brand-logo"
                        src={municipalLogo}
                    />
                    <span>Municipalidad de San Miguel</span>
                </div>

                <section className="kc-login-card kc-info-card">
                    <div className="kc-login-title kc-info-title-block">
                        <span>Portal de eventos</span>
                        <h1 id="kc-info-title">{title}</h1>
                        <p>{description}</p>
                    </div>

                    {isPendingPasswordAction ? (
                        <section className="kc-info-action-box" aria-label="Acción requerida">
                            <div className="kc-info-action-icon">✓</div>

                            <div className="kc-info-action-content">
                                <span>Acción requerida</span>
                                <strong>Configurar contraseña de acceso</strong>
                                <p>
                                    Al continuar, podrás ingresar una nueva contraseña segura
                                    para acceder a la plataforma.
                                </p>
                            </div>
                        </section>
                    ) : (
                        summary && (
                            <section
                                className={`kc-info-status-box ${
                                    isSuccess ? "kc-info-status-box--success" : "kc-info-status-box--warning"
                                }`}
                                aria-label="Detalle de la solicitud"
                            >
                                <div className="kc-info-action-icon">
                                    {isSuccess ? "✓" : "!"}
                                </div>

                                <div className="kc-info-action-content">
                                    <span>Detalle</span>
                                    <p
                                        dangerouslySetInnerHTML={{
                                            __html: kcSanitize(summary)
                                        }}
                                    />
                                </div>
                            </section>
                        )
                    )}

                    <a className="kc-login-submit kc-info-submit" href={buttonHref}>
                        {buttonLabel}
                    </a>
                </section>

                <p className="kc-login-footer">
                    <a href={backToEventsUrl}>Volver a eventos</a>
                </p>
            </section>

            <aside className="kc-login-art-side" aria-hidden="true" />
        </main>
    );
}