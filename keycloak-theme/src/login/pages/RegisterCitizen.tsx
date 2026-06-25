import { type FormEvent, useState } from "react";
import type { I18n } from "../i18n";
import type { KcContext } from "../KcContext";
import municipalLogo from "../assets/municipalidad-logo.png";
import {consultaDni} from "../services/api/crear-vecino-service";

type RegisterKcContext = Extract<KcContext, { pageId: "register.ftl" }>;

type Identity = {
    dni: string;
    nombreCompleto: string;
};


export default function RegisterCitizen(props: {
    kcContext: RegisterKcContext;
    i18n: I18n;
}) {
    const { kcContext } = props;
    const { messagesPerField, passwordRequired, url } = kcContext;
    const [dni, setDni] = useState("");
    const [fechaNacimiento, setFechaNacimiento] = useState("");
    const [correo, setCorreo] = useState("");
    const [celular, setCelular] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [acceptsDataUse, setAcceptsDataUse] = useState(false);
    const [identityResult, setIdentityResult] = useState<Identity | null>(null);
    const [identityMessage, setIdentityMessage] = useState("");
    const [formError, setFormError] = useState("");
    const [isSearchingIdentity, setIsSearchingIdentity] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
    const [isReferenceVisible, setIsReferenceVisible] = useState(false);

    function updateDni(value: string) {
        setDni(value.replace(/\D/g, "").slice(0, 8));
        setIdentityResult(null);
        setIdentityMessage("");
        setFormError("");
    }

    async function searchIdentity() {
        if (!/^\d{8}$/.test(dni)) {
            setFormError("Ingresa un DNI válido de 8 dígitos.");
            return;
        }

        setFormError("");
        setIdentityMessage("");
        setIdentityResult(null);
        setIsSearchingIdentity(true);

        try {
            const response = await consultaDni(dni);

            if (!response.success || !response.data) {
                setIdentityMessage("No se encontraron datos para el DNI ingresado.");
                return;
            }

            const nombreCompleto = response.data ?? "";

            if (!nombreCompleto) {
                setIdentityResult(null);
                setIdentityMessage("No se encontraron datos para el DNI ingresado.");
                return;
            }

            setIdentityResult({
                dni,
                nombreCompleto: response.data
            });
            setIdentityMessage("");
        } catch {
            setIdentityResult(null);
            setIdentityMessage("No se pudo consultar el DNI. Inténtalo nuevamente.");
        } finally {
            setIsSearchingIdentity(false);
        }
    }

    function validateRegisterForm() {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!dni.trim()) {
            return "Ingresa tu DNI.";
        }

        if (!/^\d{8}$/.test(dni.trim())) {
            return "Ingresa un DNI válido de 8 dígitos.";
        }

        if (identityResult === null) {
            return "Busca y valida tu identidad antes de crear la cuenta.";
        }

        if (!fechaNacimiento) {
            return "Selecciona tu fecha de nacimiento.";
        }

        if (!correo.trim()) {
            return "Ingresa tu correo electrónico.";
        }

        if (!emailPattern.test(correo.trim())) {
            return "Ingresa un correo electrónico válido.";
        }

        if (!celular.trim()) {
            return "Ingresa tu número de celular.";
        }

        if (passwordRequired && !password) {
            return "Crea una contraseña.";
        }

        if (passwordRequired && !confirmPassword) {
            return "Confirma tu contraseña.";
        }

        if (passwordRequired && password !== confirmPassword) {
            return "Las contraseñas deben coincidir.";
        }

        if (!acceptsDataUse) {
            return "Debes aceptar el uso de tus datos para crear la cuenta.";
        }

        return "";
    }

    function submitRegister(event: FormEvent<HTMLFormElement>) {
        const validationMessage = validateRegisterForm();

        if (validationMessage) {
            event.preventDefault();
            setFormError(validationMessage);
            return;
        }

        setFormError("");
    }

    return (
        <main className="kc-login-shell kc-register-shell">
            <section className="kc-login-form-side kc-register-form-side" aria-labelledby="kc-register-title">
                <div className="kc-login-brand">
                    <img
                        alt="Logo Municipalidad de San Miguel"
                        className="kc-municipality-logo kc-brand-logo"
                        src={municipalLogo}
                    />
                    <span>Municipalidad de San Miguel</span>
                </div>

                <form
                    className="kc-login-card kc-register-card"
                    id="kc-register-form"
                    action={url.registrationAction}
                    method="post"
                    onSubmit={submitRegister}
                >
                    <div className="kc-login-title">
                        <span>Portal de eventos</span>
                        <h1 id="kc-register-title">Crear cuenta vecinal</h1>
                        <p>Regístrate para reservar tu lugar en las actividades municipales.</p>
                    </div>

                    <div className="kc-register-fields-grid">
                        <label className="kc-login-field kc-register-dni-field" htmlFor="dni">
                            DNI
                            <span className="kc-dni-search-control">
                                <input
                                    id="dni"
                                    name="user.attributes.dni"
                                    autoComplete="off"
                                    inputMode="numeric"
                                    maxLength={8}
                                    placeholder="Ingrese su DNI"
                                    type="text"
                                    value={dni}
                                    onChange={event => updateDni(event.target.value)}
                                />
                                <button
                                    disabled={!/^\d{8}$/.test(dni) || isSearchingIdentity}
                                    type="button"
                                    onClick={searchIdentity}
                                >
                                    {isSearchingIdentity ? "Buscando..." : "Buscar"}
                                </button>
                            </span>
                            {identityResult !== null && (
                                <span className="kc-identity-verified-message">
                                    Identidad verificada: {identityResult.nombreCompleto}
                                </span>
                            )}
                            {identityResult === null && identityMessage && (
                                <span className="kc-identity-error-message">{identityMessage}</span>
                            )}
                        </label>

                        <label className="kc-login-field" htmlFor="fechaNacimiento">
                            Fecha de nacimiento
                            <input
                                id="fechaNacimiento"
                                name="user.attributes.fechaNacimiento"
                                autoComplete="bday"
                                placeholder="Seleccione su fecha de nacimiento"
                                type="date"
                                value={fechaNacimiento}
                                onChange={event => {
                                    setFechaNacimiento(event.target.value);
                                    setFormError("");
                                }}
                            />
                        </label>

                        <label className="kc-login-field" htmlFor="email">
                            Correo electrónico
                            <input
                                id="email"
                                name="email"
                                autoComplete="email"
                                placeholder="Ingrese su correo electrónico"
                                type="email"
                                value={correo}
                                onChange={event => {
                                    setCorreo(event.target.value);
                                    setFormError("");
                                }}
                                aria-invalid={messagesPerField.existsError("email")}
                            />
                            {messagesPerField.existsError("email") && (
                                <span className="kc-login-error">{messagesPerField.get("email")}</span>
                            )}
                        </label>

                        <label className="kc-login-field" htmlFor="celular">
                            Celular
                            <input
                                id="celular"
                                name="user.attributes.celular"
                                autoComplete="tel"
                                inputMode="tel"
                                placeholder="Ingrese su número de celular"
                                type="tel"
                                value={celular}
                                onChange={event => {
                                    setCelular(event.target.value);
                                    setFormError("");
                                }}
                            />
                        </label>

                        {passwordRequired && (
                            <>
                                <label className="kc-login-field" htmlFor="password">
                                    Contraseña
                                    <span className="kc-password-control">
                                        <input
                                            id="password"
                                            name="password"
                                            autoComplete="new-password"
                                            placeholder="Cree una contraseña"
                                            type={isPasswordVisible ? "text" : "password"}
                                            value={password}
                                            onChange={event => {
                                                setPassword(event.target.value);
                                                setFormError("");
                                            }}
                                            aria-invalid={messagesPerField.existsError("password")}
                                        />
                                        <button
                                            aria-label={isPasswordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
                                            className="kc-password-toggle"
                                            type="button"
                                            onClick={() => setIsPasswordVisible(currentValue => !currentValue)}
                                        >
                                            {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                                        </button>
                                    </span>
                                    {messagesPerField.existsError("password") && (
                                        <span className="kc-login-error">{messagesPerField.get("password")}</span>
                                    )}
                                </label>

                                <label className="kc-login-field" htmlFor="password-confirm">
                                    Confirmar contraseña
                                    <span className="kc-password-control">
                                        <input
                                            id="password-confirm"
                                            name="password-confirm"
                                            autoComplete="new-password"
                                            placeholder="Repita su contraseña"
                                            type={isConfirmPasswordVisible ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={event => {
                                                setConfirmPassword(event.target.value);
                                                setFormError("");
                                            }}
                                            aria-invalid={messagesPerField.existsError("password-confirm")}
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
                                        <span className="kc-login-error">{messagesPerField.get("password-confirm")}</span>
                                    )}
                                </label>
                            </>
                        )}
                    </div>

                    <input name="username" type="hidden" value={correo.trim()} />
                    <input name="firstName" type="hidden" value={identityResult?.nombreCompleto ?? ""} />
                    <input name="user.attributes.rol" type="hidden" value="VECINO" />
                    <input name="lastName" type="hidden" value="" />

                    <label className="kc-data-consent-control" htmlFor="acceptsDataUse">
                        <input
                            id="acceptsDataUse"
                            type="checkbox"
                            checked={acceptsDataUse}
                            onChange={event => {
                                setAcceptsDataUse(event.target.checked);
                                setFormError("");
                            }}
                        />
                        <span>
                            Acepto el uso de mis datos para gestionar mi participación en eventos municipales.
                        </span>
                    </label>

                    {formError && <p className="kc-login-error">{formError}</p>}
                    {messagesPerField.existsError("global") && (
                        <p className="kc-login-error">{messagesPerField.get("global")}</p>
                    )}

                    <button className="kc-login-submit kc-register-primary-button" type="submit">
                        Crear cuenta
                    </button>

                    <p className="kc-register-login-link">
                        <span>¿Ya tienes cuenta?</span>
                        <a href={url.loginUrl}>Inicia sesión</a>
                    </p>
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
