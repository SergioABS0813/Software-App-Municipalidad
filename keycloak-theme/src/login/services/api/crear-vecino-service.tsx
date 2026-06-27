import api from './api';

type RegistroVecinoPayload = {
    dni: string;
    nombreCompleto: string;
    email: string;
    celular: string;
    fechaNacimiento: string;
    aceptaTratamientoDatos: boolean;
};

export async function consultaDni(dni: string){
    const response = await api.get(`consulta_dni/${dni}`);
    return response.data;
}

export async function registrarVecino(payload: RegistroVecinoPayload){
    const response = await api.post('auth/vecinos/registro', payload);
    console.log(response.data)
    return response.data;
}
