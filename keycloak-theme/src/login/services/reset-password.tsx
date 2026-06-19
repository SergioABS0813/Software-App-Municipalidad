import api from "./api/api";

// Recuperar contraseña
export async function recuperarContrasena(correo: string, dni: string) {
    const response = await api.post("auth/forgot-password", {
        correo,
        dni
    });
    return response.data;
}
