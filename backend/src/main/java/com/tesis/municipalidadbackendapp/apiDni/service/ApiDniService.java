package com.tesis.municipalidadbackendapp.apiDni.service;

import com.tesis.municipalidadbackendapp.apiDni.dto.BackendResponseDto;
import com.tesis.municipalidadbackendapp.apiDni.dto.DniRequestDto;
import com.tesis.municipalidadbackendapp.apiDni.dto.DniResponseDto;
import lombok.RequiredArgsConstructor;
import org.apache.commons.text.WordUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class ApiDniService {

    private final RestClient.Builder restClientBuilder;

    @Value("${TOKEN_DNI_API}")
    private String tokenApiDni;

    public BackendResponseDto obtenerNombrePorDni(String dni){
        if (dni == null || dni.isEmpty() || dni.equals("null") || !dni.matches("\\d{8}")){
            throw new IllegalArgumentException("El DNI debe de ser de 8 dígitos");
        }
        //Construimos el body
        DniRequestDto dniRequestDto = new DniRequestDto(dni);
        // Consultamos a la API
        DniResponseDto dniResponseDto = restClientBuilder
                .baseUrl("https://api.json.pe")
                .build()
                .post()
                .uri("api/dni")
                .header("Authorization", "Bearer " + tokenApiDni)
                .body(dniRequestDto)
                .retrieve()
                .body(DniResponseDto.class);


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
