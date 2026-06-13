import { kcSanitize } from "keycloakify/lib/kcSanitize";
import type { I18n } from "../i18n";
import type { KcContext } from "../KcContext";
import municipalLogo from "../assets/municipalidad-logo.png";

type InfoKcContext = Extract<KcContext, { pageId: "info.ftl" }>;

function getBackToEventsUrl(kcContext: InfoKcContext) {
    if (kcContext.pageRedirectUri) {
        return kcContext.pageRedirectUri;
    }

    if (kcContext.client.baseUrl) {
        return kcContext.client.baseUrl;
    }

    if (typeof window === "undefined") {
        return "/";
    }

    return window.location.origin;
}

export default function InfoMessage(props: {
    kcContext: InfoKcContext;
    i18n: I18n;
}) {
    const { kcContext, i18n } = props;
    const { advancedMsgStr } = i18n;
    const { actionUri, message, messageHeader, requiredActions, skipLink, url } = kcContext;
    const backToEventsUrl = getBackToEventsUrl(kcContext);
    const title = requiredActions ? "Verificacion de cuenta" : messageHeader ? advancedMsgStr(messageHeader) : "Verificacion de cuenta";
    let summary = message.summary?.trim() ?? "";

    if (requiredActions) {
        summary += ` <strong>${requiredActions
            .map(requiredAction => advancedMsgStr(`requiredAction.${requiredAction}`))
            .join(", ")}</strong>`;
    }

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
                    <div className="kc-login-title">
                        <span>Portal de eventos</span>
                        <h1
                            id="kc-info-title"
                            dangerouslySetInnerHTML={{ __html: kcSanitize(title) }}
                        />
                    </div>

                    <p
                        className="kc-info-message-panel"
                        dangerouslySetInnerHTML={{ __html: kcSanitize(summary) }}
                    />

                    {!skipLink && actionUri && (
                        <a className="kc-login-submit" href={actionUri}>
                            Continuar
                        </a>
                    )}

                    {!skipLink && !actionUri && (
                        <a className="kc-login-submit" href={backToEventsUrl || url.loginUrl}>
                            Ingresar a la plataforma
                        </a>
                    )}
                </section>

                <p className="kc-login-footer">
                    <a href={backToEventsUrl}>Volver a eventos</a>
                </p>
            </section>

            <aside className="kc-login-art-side" aria-hidden="true" />
        </main>
    );
}
