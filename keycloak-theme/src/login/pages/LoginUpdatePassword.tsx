import { useState } from "react";
import { kcSanitize } from "keycloakify/lib/kcSanitize";
import type { I18n } from "../i18n";
import type { KcContext } from "../KcContext";
import municipalLogo from "../assets/municipalidad-logo.png";

type LoginUpdatePasswordKcContext = Extract<KcContext, { pageId: "login-update-password.ftl" }>;

export default function LoginUpdatePassword(props: {
    kcContext: LoginUpdatePasswordKcContext;
    i18n: I18n;
}) {
    const { kcContext } = props;
    const { isAppInitiatedAction, messagesPerField, url } = kcContext;
    const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
    const hasPasswordError = messagesPerField.existsError("password", "password-confirm");

    return (
        <main className="kc-login-shell">
            <section className="kc-login-form-side kc-update-password-form-side" aria-labelledby="kc-update-password-title">
                <div className="kc-login-brand">
                    <img
                        alt="Logo Municipalidad de San Miguel"
                        className="kc-municipality-logo kc-brand-logo"
                        src={municipalLogo}
                    />
                    <span>Municipalidad de San Miguel</span>
                </div>

                <form
                    className="kc-login-card kc-update-password-card"
                    id="kc-passwd-update-form"
                    action={url.loginAction}
                    method="post"
                >
                    <div className="kc-login-title">
                        <span>Portal de eventos</span>
                        <h1 id="kc-update-password-title">Configura tu contraseña de acceso</h1>
                        <p>Ingresa una nueva contraseña segura para acceder al Sistema de Gestión de Eventos.</p>
                    </div>

                    <label className="kc-login-field" htmlFor="password-new">
                        Nueva contraseña
                        <span className="kc-password-control">
                            <input
                                id="password-new"
                                name="password-new"
                                type={isNewPasswordVisible ? "text" : "password"}
                                autoComplete="new-password"
                                autoFocus
                                placeholder="Ingrese su nueva contraseña"
                                aria-invalid={hasPasswordError}
                                aria-describedby={
                                    messagesPerField.existsError("password") ? "input-error-password" : undefined
                                }
                            />
                            <button
                                aria-label={
                                    isNewPasswordVisible ? "Ocultar nueva contraseña" : "Mostrar nueva contraseña"
                                }
                                className="kc-password-toggle"
                                type="button"
                                onClick={() => setIsNewPasswordVisible(currentValue => !currentValue)}
                            >
                                {isNewPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                            </button>
                        </span>
                        {messagesPerField.existsError("password") && (
                            <span
                                id="input-error-password"
                                className="kc-login-error"
                                dangerouslySetInnerHTML={{
                                    __html: kcSanitize(messagesPerField.get("password"))
                                }}
                            />
                        )}
                    </label>

                    <label className="kc-login-field" htmlFor="password-confirm">
                        Confirmar contraseña
                        <span className="kc-password-control">
                            <input
                                id="password-confirm"
                                name="password-confirm"
                                type={isConfirmPasswordVisible ? "text" : "password"}
                                autoComplete="new-password"
                                placeholder="Repita su nueva contraseña"
                                aria-invalid={hasPasswordError}
                                aria-describedby={
                                    messagesPerField.existsError("password-confirm")
                                        ? "input-error-password-confirm"
                                        : undefined
                                }
                            />
                            <button
                                aria-label={
                                    isConfirmPasswordVisible
                                        ? "Ocultar confirmación de contraseña"
                                        : "Mostrar confirmación de contraseña"
                                }
                                className="kc-password-toggle"
                                type="button"
                                onClick={() => setIsConfirmPasswordVisible(currentValue => !currentValue)}
                            >
                                {isConfirmPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                            </button>
                        </span>
                        {messagesPerField.existsError("password-confirm") && (
                            <span
                                id="input-error-password-confirm"
                                className="kc-login-error"
                                dangerouslySetInnerHTML={{
                                    __html: kcSanitize(messagesPerField.get("password-confirm"))
                                }}
                            />
                        )}
                    </label>

                    <label className="kc-login-remember kc-update-password-session" htmlFor="logout-sessions">
                        <input
                            id="logout-sessions"
                            name="logout-sessions"
                            type="checkbox"
                            value="on"
                            defaultChecked
                        />
                        Cerrar sesión en otros dispositivos
                    </label>

                    <div className="kc-update-password-actions">
                        <button className="kc-login-submit kc-register-primary-button kc-update-password-primary" type="submit">
                            Guardar contraseña
                        </button>

                        {isAppInitiatedAction && (
                            <button
                                className="kc-login-submit"
                                name="cancel-aia"
                                type="submit"
                                value="true"
                            >
                                Cancelar
                            </button>
                        )}
                    </div>
                </form>
            </section>

            <aside className="kc-login-art-side" aria-hidden="true" />
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
