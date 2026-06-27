package com.tesis.municipalidadbackendapp.apiDni.service;

import com.tesis.municipalidadbackendapp.apiDni.dto.BackendResponseDto;
import com.tesis.municipalidadbackendapp.apiDni.dto.DniRequestDto;
import com.tesis.municipalidadbackendapp.apiDni.dto.DniResponseDto;
import lombok.RequiredArgsConstructor;
import org.apache.commons.text.WordUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class ApiDniService {

    private final RestClient.Builder restClientBuilder;

    @Value("${TOKEN_DNI_API}")
    private String tokenApiDni;

    public BackendResponseDto obtenerNombrePorDni(String dni){
        if (dni == null || dni.isEmpty() || dni.equals("null") || !dni.matches("\\d{8}")){
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El DNI debe ser de 8 dígitos"
            );
        }
        //Construimos el body del request y response
        DniRequestDto dniRequestDto = new DniRequestDto(dni);
        DniResponseDto dniResponseDto;
        // Consultamos a la API
        try{
            dniResponseDto = restClientBuilder
                    .baseUrl("https://api.json.pe")
                    .build()
                    .post()
                    .uri("api/dni")
                    .header("Authorization", "Bearer " + tokenApiDni)
                    .body(dniRequestDto)
                    .retrieve()
                    .body(DniResponseDto.class);

        }catch (RestClientResponseException e){
            int statusProveedor = e.getStatusCode().value();

            if (statusProveedor == 404 || statusProveedor == 422 || statusProveedor == 400) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No se encontraron datos para el DNI ingresado"
                );
            }

            if (statusProveedor == 401 || statusProveedor == 403) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "No se pudo validar la consulta con el proveedor de DNI"
                );
            }

            if (statusProveedor == 429) {
                throw new ResponseStatusException(
                        HttpStatus.SERVICE_UNAVAILABLE,
                        "El servicio de consulta de DNI alcanzó su límite de consultas"
                );
            }

            if (statusProveedor >= 500) {
                throw new ResponseStatusException(
                        HttpStatus.SERVICE_UNAVAILABLE,
                        "El proveedor de consulta de DNI no está disponible en este momento"
                );
            }

            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Respuesta inesperada del proveedor de DNI"
            );

        }catch(ResourceAccessException e){
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "No se pudo conectar con el proveedor de consulta de DNI"
            );
        }

        if (dniResponseDto == null || !dniResponseDto.success() || dniResponseDto.data() == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "No se encontraron datos para el DNI ingresado"
            );
        }
        // Construimos nombre completo
        String nombreCompleto = WordUtils.capitalizeFully(dniResponseDto.data().nombres() + " " + dniResponseDto.data().apellido_paterno() + " " + dniResponseDto.data().apellido_materno());

        return new BackendResponseDto(
                true,
                "Consulta realizada correctamente",
                nombreCompleto
        );
    }

}
