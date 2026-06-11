import { useState } from "react";
import type { I18n } from "../i18n";
import type { KcContext } from "../KcContext";
import municipalLogo from "../assets/municipalidad-logo.png";

type ResetPasswordKcContext = Extract<KcContext, { pageId: "login-reset-password.ftl" }>;

function getBackToEventsUrl() {
    if (typeof window === "undefined") {
        return "/";
    }

    const redirectUri = new URLSearchParams(window.location.search).get("redirect_uri");

    if (redirectUri === null) {
        return "/";
    }

    try {
        const url = new URL(redirectUri);
        return `${url.origin}/`;
    } catch {
        return "/";
    }
}

export default function ResetPassword(props: {
    kcContext: ResetPasswordKcContext;
    i18n: I18n;
}) {
    const { kcContext } = props;
    const { auth, messagesPerField, url } = kcContext;
    const [isReferenceVisible, setIsReferenceVisible] = useState(false);
    const backToEventsUrl = getBackToEventsUrl();

    return (
        <main className="kc-login-shell">
            <section className="kc-login-form-side" aria-labelledby="kc-recover-password-title">
                <div className="kc-login-brand">
                    <img
                        alt="Logo Municipalidad de San Miguel"
                        className="kc-municipality-logo kc-brand-logo"
                        src={municipalLogo}
                    />
                    <span>Municipalidad de San Miguel</span>
                </div>

                <form
                    className="kc-login-card kc-recover-password-card"
                    id="kc-reset-password-form"
                    action={url.loginAction}
                    method="post"
                >
                    <div className="kc-login-title">
                        <span>Portal de eventos</span>
                        <h1 id="kc-recover-password-title">Recuperar contraseña</h1>
                        <p>Ingresa tu correo electrónico para recibir instrucciones.</p>
                    </div>

                    <button
                        className="kc-reference-toggle"
                        type="button"
                        onClick={() => setIsReferenceVisible(currentValue => !currentValue)}
                    >
                        {isReferenceVisible ? "Ocultar referencia React" : "Ver referencia React"}
                    </button>

                    <label className="kc-login-field" htmlFor="username">
                        Correo electrónico
                        <input
                            id="username"
                            name="username"
                            type="email"
                            autoComplete="email"
                            autoFocus
                            defaultValue={auth.attemptedUsername ?? ""}
                            placeholder="Ingrese su correo electrónico"
                            aria-invalid={messagesPerField.existsError("username")}
                        />
                        {messagesPerField.existsError("username") && (
                            <span className="kc-login-error" id="input-error-username">
                                {messagesPerField.get("username")}
                            </span>
                        )}
                    </label>

                    <button className="kc-login-submit" type="submit">
                        Enviar instrucciones
                    </button>

                    <p className="kc-recover-password-note">
                        Si el correo pertenece a una cuenta vecinal registrada, te enviaremos un
                        enlace para crear una nueva contraseña.
                    </p>
                </form>

                {isReferenceVisible && <ReactRecoverPasswordReference />}

                <p className="kc-login-footer">
                    <a href={url.loginUrl}>Volver a iniciar sesión</a>
                    <span aria-hidden="true"> · </span>
                    <a href={backToEventsUrl}>Volver a eventos</a>
                </p>
            </section>

            <aside className="kc-login-art-side" aria-hidden="true" />
        </main>
    );
}

function ReactRecoverPasswordReference() {
    return (
        <section className="kc-login-card kc-react-reference-card" aria-label="Referencia React de recuperar contraseña">
            <div className="kc-login-title">
                <span>Portal de eventos</span>
                <h2>Recuperar contraseña</h2>
                <p>Ingresa tu correo electrónico y DNI para verificar tu cuenta.</p>
            </div>

            <label className="kc-login-field">
                Correo electrónico
                <input placeholder="Ingrese su correo electrónico" type="email" />
            </label>

            <label className="kc-login-field">
                DNI
                <input inputMode="numeric" maxLength={8} placeholder="Ingrese su DNI" type="text" />
            </label>

            <button className="kc-login-submit" type="button">
                Verificar datos
            </button>

            <section className="kc-recover-password-step" aria-label="Referencia actualizar contraseña">
                <span className="kc-identity-verified-message">
                    Cuenta verificada: Sergio André Bustamante Villanueva
                </span>
                <label className="kc-login-field">
                    Nueva contraseña
                    <span className="kc-password-control">
                        <input placeholder="Ingrese su nueva contraseña" type="password" />
                        <span className="kc-password-toggle kc-password-toggle-static">
                            <EyeIcon />
                        </span>
                    </span>
                </label>
                <label className="kc-login-field">
                    Confirmar nueva contraseña
                    <span className="kc-password-control">
                        <input placeholder="Repita su nueva contraseña" type="password" />
                        <span className="kc-password-toggle kc-password-toggle-static">
                            <EyeIcon />
                        </span>
                    </span>
                </label>
                <button className="kc-login-submit kc-register-primary-button" type="button">
                    Actualizar contraseña
                </button>
            </section>
        </section>
    );
}

function EyeIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}
