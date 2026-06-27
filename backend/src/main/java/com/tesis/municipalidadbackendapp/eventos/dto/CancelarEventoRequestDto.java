package com.tesis.municipalidadbackendapp.eventos.dto;



import jakarta.validation.constraints.NotBlank;



public record CancelarEventoRequestDto(

        @NotBlank(message = "El motivo de cancelacion es obligatorio")

        String motivo

) {

}