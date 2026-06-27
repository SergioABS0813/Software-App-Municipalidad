import { useState } from "react";
import type { I18n } from "../i18n";
import type { KcContext } from "../KcContext";
import municipalLogo from "../assets/municipalidad-logo.png";
import { consultaDni, registrarVecino } from "../services/api/crear-vecino-service";

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
    const { url } = kcContext;
    const [dni, setDni] = useState("");
    const [fechaNacimiento, setFechaNacimiento] = useState("");
    const [correo, setCorreo] = useState("");
    const [celular, setCelular] = useState("");
    const [acceptsDataUse, setAcceptsDataUse] = useState(false);
    const [identityResult, setIdentityResult] = useState<Identity | null>(null);
    const [identityMessage, setIdentityMessage] = useState("");
    const [formError, setFormError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isSearchingIdentity, setIsSearchingIdentity] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    function updateDni(value: string) {
        setDni(value.replace(/\D/g, "").slice(0, 8));
        setIdentityResult(null);
        setIdentityMessage("");
        setFormError("");
        setSuccessMessage("");
    }

    async function searchIdentity() {
        if (!/^\d{8}$/.test(dni)) {
            setFormError("Ingresa un DNI valido de 8 digitos.");
            return;
        }

        setFormError("");
        setSuccessMessage("");
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

            setIdentityResult({ dni, nombreCompleto });
            setIdentityMessage("");
        } catch {
            setIdentityResult(null);
            setIdentityMessage("No se pudo consultar el DNI. Intentalo nuevamente.");
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
            return "Ingresa un DNI valido de 8 digitos.";
        }

        if (identityResult === null) {
            return "Busca y valida tu identidad antes de crear la cuenta.";
        }

        if (!fechaNacimiento) {
            return "Selecciona tu fecha de nacimiento.";
        }

        if (!correo.trim()) {
            return "El correo electronico es obligatorio.";
        }

        if (!emailPattern.test(correo.trim())) {
            return "Ingresa un correo electronico valido.";
        }

        if (!celular.trim()) {
            return "Ingresa tu numero de celular.";
        }

        if (!/^\d{6,15}$/.test(celular.trim().replace(/\s+/g, ""))) {
            return "Ingresa un celular valido.";
        }

        if (!acceptsDataUse) {
            return "Debes aceptar el uso de tus datos para crear la cuenta.";
        }

        return "";
    }

    function getFriendlyError(error: unknown) {
        const responseMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;

        if (!responseMessage) {
            return "No se pudo crear la cuenta. Intentalo nuevamente.";
        }

        if (responseMessage.includes("DNI ya")) {
            return "El DNI ya esta registrado.";
        }

        if (responseMessage.includes("correo ya")) {
            return "El correo ya esta registrado.";
        }

        return responseMessage;
    }

    async function submitRegister() {
        if (isSubmitting) {
            return;
        }

        const validationMessage = validateRegisterForm();

        if (validationMessage) {
            setFormError(validationMessage);
            return;
        }

        setFormError("");
        setSuccessMessage("");
        setIsSubmitting(true);

        try {
            await registrarVecino({
                dni: dni.trim(),
                nombreCompleto: identityResult?.nombreCompleto ?? "",
                email: correo.trim(),
                celular: celular.trim().replace(/\s+/g, ""),
                fechaNacimiento,
                aceptaTratamientoDatos: acceptsDataUse,
            });

            setSuccessMessage("Cuenta creada. Te enviamos un correo para configurar tu contrasena. Revisa tu bandeja de entrada.");
            setFormError("");
        } catch (error) {
            setFormError(getFriendlyError(error));
        } finally {
            setIsSubmitting(false);
        }
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

                <div
                    className="kc-login-card kc-register-card"
                    id="kc-citizen-register-panel"
                    onKeyDown={event => {
                        if (event.key === "Enter") {
                            event.preventDefault();
                        }
                    }}
                >
                    <div className="kc-login-title">
                        <span>Portal de eventos</span>
                        <h1 id="kc-register-title">Crear cuenta vecinal</h1>
                        <p>Registrate para reservar tu lugar en las actividades municipales.</p>
                    </div>

                    <div className="kc-register-fields-grid">
                        <label className="kc-login-field kc-register-dni-field" htmlFor="dni">
                            DNI
                            <span className="kc-dni-search-control">
                                <input
                                    id="dni"
                                    autoComplete="off"
                                    inputMode="numeric"
                                    maxLength={8}
                                    placeholder="Ingrese su DNI"
                                    type="text"
                                    value={dni}
                                    onChange={event => updateDni(event.target.value)}
                                    disabled={isSubmitting}
                                />
                                <button
                                    disabled={!/^\d{8}$/.test(dni) || isSearchingIdentity || isSubmitting}
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
                                autoComplete="bday"
                                placeholder="Seleccione su fecha de nacimiento"
                                type="date"
                                value={fechaNacimiento}
                                disabled={isSubmitting}
                                onChange={event => {
                                    setFechaNacimiento(event.target.value);
                                    setFormError("");
                                    setSuccessMessage("");
                                }}
                            />
                        </label>

                        <label className="kc-login-field" htmlFor="email">
                            Correo electronico
                            <input
                                id="email"
                                autoComplete="email"
                                placeholder="Ingrese su correo electronico"
                                type="email"
                                value={correo}
                                disabled={isSubmitting}
                                onChange={event => {
                                    setCorreo(event.target.value);
                                    setFormError("");
                                    setSuccessMessage("");
                                }}
                            />
                        </label>

                        <label className="kc-login-field" htmlFor="celular">
                            Celular
                            <input
                                id="celular"
                                autoComplete="tel"
                                inputMode="tel"
                                placeholder="Ingrese su numero de celular"
                                type="tel"
                                value={celular}
                                disabled={isSubmitting}
                                onChange={event => {
                                    setCelular(event.target.value.replace(/[^\d\s]/g, ""));
                                    setFormError("");
                                    setSuccessMessage("");
                                }}
                            />
                        </label>
                    </div>

                    <label className="kc-data-consent-control" htmlFor="acceptsDataUse">
                        <input
                            id="acceptsDataUse"
                            type="checkbox"
                            checked={acceptsDataUse}
                            disabled={isSubmitting}
                            onChange={event => {
                                setAcceptsDataUse(event.target.checked);
                                setFormError("");
                                setSuccessMessage("");
                            }}
                        />
                        <span>
                            Acepto el uso de mis datos para gestionar mi participacion en eventos municipales.
                        </span>
                    </label>

                    {formError && <p className="kc-login-error">{formError}</p>}
                    {successMessage && <p className="kc-register-success-message">{successMessage}</p>}

                    <button
                        className="kc-login-submit kc-register-primary-button"
                        type="button"
                        disabled={isSubmitting || Boolean(successMessage)}
                        onClick={event => {
                            event.preventDefault();
                            event.stopPropagation();
                            void submitRegister();
                        }}
                    >
                        {isSubmitting ? "Creando cuenta..." : successMessage ? "Cuenta creada" : "Crear cuenta"}
                    </button>

                    <p className="kc-register-login-link">
                        <span>Ya tienes cuenta?</span>
                        <a href={url.loginUrl}>Inicia sesion</a>
                    </p>
                </div>

            </section>

            <aside className="kc-login-art-side" aria-hidden="true" />
        </main>
    );
}
