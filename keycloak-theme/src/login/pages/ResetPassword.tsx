import { type FormEvent, useState } from "react";
import type { I18n } from "../i18n";
import type { KcContext } from "../KcContext";
import municipalLogo from "../assets/municipalidad-logo.png";
import {recuperarContrasena} from '../services/reset-password';

type ResetPasswordKcContext = Extract<KcContext, { pageId: "login-reset-password.ftl" }>;

type Identity = {
    dni: string;
    nombreCompleto: string;
};


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

export default function ResetPassword(props: {
    kcContext: ResetPasswordKcContext;
    i18n: I18n;
}) {
    const { kcContext } = props;
    const { auth, url } = kcContext;
    const [correo, setCorreo] = useState(auth.attemptedUsername ?? "");
    const [dni, setDni] = useState("");
    const [verifiedUser, setVerifiedUser] = useState<Identity | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [formError, setFormError] = useState("");
    const [formSuccess, setFormSuccess] = useState("");
    const [isRecoveringPassword, setIsRecoveringPassword] = useState(false);
    const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
    const backToEventsUrl = getBackToEventsUrl();

    function updateDni(value: string) {
        setDni(value.replace(/\D/g, "").slice(0, 8));
        setVerifiedUser(null);
        setFormError("");
        setFormSuccess("");
    }

    async function verifyAccount(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (isRecoveringPassword) {
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!correo.trim()) {
            setFormError("Ingresa tu correo electrónico.");
            return;
        }

        if (!emailPattern.test(correo.trim())) {
            setFormError("Ingresa un correo electrónico válido.");
            return;
        }

        if (!/^\d{8}$/.test(dni.trim())) {
            setFormError("Ingresa un DNI válido de 8 dígitos.");
            return;
        }

        setIsRecoveringPassword(true);

        try{
            await recuperarContrasena(correo, dni);
            setFormError("");
            setFormSuccess("Si los datos corresponden a una cuenta registrada, recibirás un correo para restablecer tu contraseña.")
        }catch(error){
            console.error(error);
            setFormSuccess("");
            setFormError("No se pudo procesar la solicitud. Inténtalo nuevamente.")
        }finally{
            setIsRecoveringPassword(false);
        }
    }

    function updatePassword() {
        if (!newPassword) {
            setFormError("Ingresa tu nueva contraseña.");
            return;
        }

        if (!confirmPassword) {
            setFormError("Confirma tu nueva contraseña.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setFormError("Las contraseñas no coinciden.");
            return;
        }

        setFormError("");
        setFormSuccess("Contraseña actualizada correctamente. Ahora puedes iniciar sesión.");
    }

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
                    onSubmit={verifyAccount}
                >
                    <div className="kc-login-title">
                        <span>Portal de eventos</span>
                        <h1 id="kc-recover-password-title">Recuperar contraseña</h1>
                        <p>Ingresa tu correo electrónico y DNI para verificar tu cuenta.</p>
                    </div>

                    <label className="kc-login-field" htmlFor="username">
                        Correo electrónico
                        <input
                            id="username"
                            name="username"
                            type="email"
                            autoComplete="email"
                            autoFocus
                            value={correo}
                            placeholder="Ingrese su correo electrónico"
                            disabled={isRecoveringPassword}
                            onChange={event => {
                                setCorreo(event.target.value);
                                setFormError("");
                                setFormSuccess("");
                            }}
                        />
                    </label>

                    <label className="kc-login-field" htmlFor="dni">
                        DNI
                        <input
                            id="dni"
                            name="dni"
                            type="text"
                            inputMode="numeric"
                            maxLength={8}
                            placeholder="Ingrese su DNI"
                            value={dni}
                            disabled={isRecoveringPassword}
                            onChange={event => updateDni(event.target.value)}
                        />
                    </label>

                    <button
                        aria-busy={isRecoveringPassword}
                        className="kc-login-submit kc-loading-submit"
                        disabled={isRecoveringPassword}
                        type="submit"
                    >
                        {isRecoveringPassword && <span className="kc-button-spinner" aria-hidden="true" />}
                        <span>{isRecoveringPassword ? "Verificando..." : "Verificar datos"}</span>
                    </button>

                    {verifiedUser !== null && !formSuccess && (
                        <section className="kc-recover-password-step" aria-label="Actualizar contraseña">
                            <span className="kc-identity-verified-message">
                                Cuenta verificada: {verifiedUser.nombreCompleto}
                            </span>
                            <label className="kc-login-field">
                                Nueva contraseña
                                <span className="kc-password-control">
                                    <input
                                        autoComplete="new-password"
                                        placeholder="Ingrese su nueva contraseña"
                                        type={isNewPasswordVisible ? "text" : "password"}
                                        value={newPassword}
                                        onChange={event => {
                                            setNewPassword(event.target.value);
                                            setFormError("");
                                        }}
                                    />
                                    <button
                                        aria-label={
                                            isNewPasswordVisible
                                                ? "Ocultar nueva contraseña"
                                                : "Mostrar nueva contraseña"
                                        }
                                        className="kc-password-toggle"
                                        type="button"
                                        onClick={() => setIsNewPasswordVisible(currentValue => !currentValue)}
                                    >
                                        {isNewPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                                    </button>
                                </span>
                            </label>
                            <label className="kc-login-field">
                                Confirmar nueva contraseña
                                <span className="kc-password-control">
                                    <input
                                        autoComplete="new-password"
                                        placeholder="Repita su nueva contraseña"
                                        type={isConfirmPasswordVisible ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={event => {
                                            setConfirmPassword(event.target.value);
                                            setFormError("");
                                        }}
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
                            </label>
                            <button
                                className="kc-login-submit kc-register-primary-button"
                                type="button"
                                onClick={updatePassword}
                            >
                                Actualizar contraseña
                            </button>
                        </section>
                    )}

                    {formError && <p className="kc-login-error">{formError}</p>}
                    {formSuccess && <p className="kc-login-success">{formSuccess}</p>}
                </form>

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

