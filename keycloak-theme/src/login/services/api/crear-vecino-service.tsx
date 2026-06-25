import api from './api';

export async function consultaDni(dni: string){
    const response = await api.get(`consulta_dni/${dni}`);
    return response.data;
}


