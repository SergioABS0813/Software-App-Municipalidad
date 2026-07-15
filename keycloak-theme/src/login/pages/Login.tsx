import { useState } from "react";
import type { I18n } from "../i18n";
import type { KcContext } from "../KcContext";
import municipalLogo from "../assets/municipalidad-logo.webp";
import portadaOficialLogin from "../assets/portada_oficial_login.webp";

type LoginKcContext = Extract<KcContext, { pageId: "login.ftl" }>;

function getBackToEventsUrl() {
    const fallbackEventsUrl = "https://municipalidadsm.online/eventos";

    if (typeof window === "undefined") {
        return fallbackEventsUrl;
    }

    const redirectUri = new URLSearchParams(window.location.search).get("redirect_uri");

    if (redirectUri === null) {
        return fallbackEventsUrl;
    }

    try {
        const url = new URL(redirectUri);

        if (url.origin !== window.location.origin) {
            return `${url.origin}/eventos`;
        }

        return fallbackEventsUrl;
    } catch {
        return fallbackEventsUrl;
    }
}

export default function Login(props: {
    kcContext: LoginKcContext;
    i18n: I18n;
}) {
    const { kcContext } = props;
    const {
        url,
        login,
        messagesPerField,
        usernameHidden
    } = kcContext;
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const backToEventsUrl = getBackToEventsUrl();

    return (
        <main className="kc-login-shell">
            <section className="kc-login-form-side" aria-labelledby="kc-login-title">
                <div className="kc-login-brand">
                    <img
                        alt="Logo Municipalidad de San Miguel"
                        className="kc-municipality-logo kc-brand-logo"
                        src={municipalLogo}
                    />
                    <span>Municipalidad de San Miguel</span>
                </div>

                <form
                    className="kc-login-card"
                    id="kc-form-login"
                    action={url.loginAction}
                    method="post"
                >
                    <div className="kc-login-title">
                        <span>Portal de eventos</span>
                        <h1 id="kc-login-title">Iniciar sesión</h1>
                        <p>Accede a tu cuenta para continuar.</p>
                    </div>

                    {!usernameHidden && (
                        <label className="kc-login-field" htmlFor="username">
                            Correo electrónico
                            <input
                                id="username"
                                name="username"
                                type="email"
                                defaultValue={login.username ?? ""}
                                autoComplete="email"
                                placeholder="Ingrese su correo electrónico"
                                aria-invalid={messagesPerField.existsError("username")}
                            />
                        </label>
                    )}

                    <label className="kc-login-field" htmlFor="password">
                        Contraseña
                        <span className="kc-password-control">
                            <input
                                id="password"
                                name="password"
                                type={isPasswordVisible ? "text" : "password"}
                                autoComplete="current-password"
                                placeholder="Ingrese su contraseña"
                                aria-invalid={messagesPerField.existsError("password")}
                            />
                            <button
                                aria-label={
                                    isPasswordVisible ? "Ocultar contraseña" : "Mostrar contraseña"
                                }
                                className="kc-password-toggle"
                                type="button"
                                onClick={() => setIsPasswordVisible(currentValue => !currentValue)}
                            >
                                {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                            </button>
                        </span>
                    </label>

                    <div className="kc-login-options">
                        {!usernameHidden && (
                            <label className="kc-login-remember" htmlFor="rememberMe">
                                <input
                                    id="rememberMe"
                                    name="rememberMe"
                                    type="checkbox"
                                    defaultChecked={login.rememberMe === "on"}
                                />
                                Recordarme
                            </label>
                        )}

                        <a className="kc-login-link" href={url.loginResetCredentialsUrl}>
                            Recuperar contraseña
                        </a>
                    </div>

                    {messagesPerField.existsError("username", "password") && (
                        <p className="kc-login-error kc-login-error-summary">
                            {messagesPerField.getFirstError("username", "password")}
                        </p>
                    )}

                    <button className="kc-login-submit" name="login" type="submit">
                        Ingresar
                    </button>

                    <p className="kc-login-register-link">
                        <span>¿Aún no tienes cuenta vecinal?</span>
                        <a href={url.registrationUrl}>Crear cuenta</a>
                    </p>
                </form>

                <p className="kc-login-footer">
                    <a href={backToEventsUrl}>Volver a eventos</a>
                </p>
            </section>

            <aside className="kc-login-art-side" aria-hidden="true">
                <img alt="" src={portadaOficialLogin} />
            </aside>
        </main>
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

function EyeOffIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="m3 3 18 18" />
            <path d="M10.6 10.6A2 2 0 0 0 12 14a2 2 0 0 0 1.4-.6" />
            <path d="M9.9 5.3A9.8 9.8 0 0 1 12 5c6 0 9.5 7 9.5 7a17.8 17.8 0 0 1-2.4 3.3" />
            <path d="M6.6 6.6A17.8 17.8 0 0 0 2.5 12S6 19 12 19a9.8 9.8 0 0 0 4.1-.9" />
        </svg>
    );
}

