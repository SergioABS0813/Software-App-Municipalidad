import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
    url: import.meta.env.VITE_KEYCLOAK_URL ?? "http://localhost:7000",
    realm: import.meta.env.VITE_KEYCLOAK_REALM ?? "municipalidad-gestion-eventos",
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? "municipalidad-frontend",
});

let initPromise;

export function initKeycloak() {
    if (!initPromise) {
        initPromise = keycloak.init({
            onLoad: "check-sso",
            pkceMethod: "S256",
            checkLoginIframe: false,
        });
    }

    return initPromise;
}

export function loginWithKeycloak(redirectPath = "/eventos") {
    sessionStorage.setItem("postLoginRedirect", redirectPath);

    return keycloak.login({
        redirectUri: `${window.location.origin}/login`,
        locale: "es",
    });
}

export function registerWithKeycloak(redirectPath = "/eventos") {
    sessionStorage.setItem("postLoginRedirect", redirectPath);

    return keycloak.register({
        redirectUri: `${window.location.origin}/login`,
        locale: "es",
    });
}

export function logoutFromKeycloak() {
    return keycloak.logout({
        redirectUri: `${window.location.origin}/eventos`,
    });
}

export function getKeycloakUser() {
    const token = keycloak.tokenParsed;

    if (!keycloak.authenticated || !token) {
        return null;
    }

    const roles = token.realm_access?.roles ?? [];
    const appRole = ["ADMINISTRADOR", "DIRECTIVO", "OPERATIVO", "VECINO"].find(role =>
        roles.includes(role),
    );

    if (!appRole) {
        return null;
    }

    const fullName =
        token.name ||
        [token.given_name, token.family_name].filter(Boolean).join(" ") ||
        token.preferred_username;

    return {
        id: token.sub,
        username: token.preferred_username,
        email: token.email ?? "",
        correo: token.email ?? "",
        fullName,
        nombreCompleto: fullName,
        nombres: token.given_name ?? "",
        apellidos: token.family_name ?? "",
        role: appRole,
        rol: appRole,
        token: keycloak.token,
    };
}

export default keycloak;
