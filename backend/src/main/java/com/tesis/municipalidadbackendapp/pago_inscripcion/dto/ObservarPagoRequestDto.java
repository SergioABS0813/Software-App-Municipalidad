package com.tesis.municipalidadbackendapp.pago_inscripcion.dto;

import jakarta.validation.constraints.NotBlank;

public record ObservarPagoRequestDto(
        @NotBlank(message = "La observacion es obligatoria")
        String observacion
) {
}