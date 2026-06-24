package com.tesis.municipalidadbackendapp.bitacora.dto;

import java.time.Instant;

public record BitacoraEventoDto(
        Integer id,
        Instant fechaHora,
        String usuarioNombre,
        String usuarioRol,
        String accion,
        String detalle,
        String tipoAccion
) {
}
