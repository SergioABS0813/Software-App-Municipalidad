import { kcSanitize } from "keycloakify/lib/kcSanitize";
import type { I18n } from "../i18n";
import type { KcContext } from "../KcContext";
import municipalLogo from "../assets/municipalidad-logo.webp";

type ErrorKcContext = Extract<KcContext, { pageId: "error.ftl" }>;

function getBackToEventsUrl(kcContext: ErrorKcContext) {
    if (kcContext.client?.baseUrl) {
        return kcContext.client.baseUrl;
    }

    if (typeof window === "undefined") {
        return "/";
    }

    return window.location.origin;
}

export default function ErrorMessage(props: {
    kcContext: ErrorKcContext;
    i18n: I18n;
}) {
    const { kcContext } = props;
    const { message, url } = kcContext;

    const backToEventsUrl = getBackToEventsUrl(kcContext);
    const summary = message?.summary ?? "No se pudo completar la solicitud.";
    const normalizedSummary = summary.toLowerCase();

    const isExpired =
        normalizedSummary.includes("caduc") ||
        normalizedSummary.includes("expir") ||
        normalizedSummary.includes("expired");

    const title = isExpired
        ? "Enlace caducado"
        : "No se pudo validar la solicitud";

    const description = isExpired
        ? "El enlace utilizado ya expiró o fue usado anteriormente. Solicita un nuevo enlace desde la plataforma."
        : "No se encontró una sesión válida o el token necesario para continuar. Vuelve a iniciar el proceso.";

    return (
        <main className="kc-login-shell">
            <section className="kc-login-form-side" aria-labelledby="kc-error-title">
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
                        <h1 id="kc-error-title">{title}</h1>
                        <p>{description}</p>
                    </div>

                    <section className="kc-info-action-box" aria-label="Detalle del error">
                        <div className="kc-info-action-icon">!</div>

                        <div className="kc-info-action-content">
                            <span>Detalle</span>
                            <p
                                dangerouslySetInnerHTML={{
                                    __html: kcSanitize(summary)
                                }}
                            />
                        </div>
                    </section>

                    <a
                        className="kc-login-submit kc-info-submit"
                        href={backToEventsUrl || url.loginUrl}
                    >
                        Volver a la plataforma
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