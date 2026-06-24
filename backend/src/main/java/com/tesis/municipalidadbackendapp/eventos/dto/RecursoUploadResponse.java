package com.tesis.municipalidadbackendapp.eventos.dto;

import java.time.Instant;

public record RecursoUploadResponse(
        Integer id,
        Integer eventoId,
        String tipoRecurso,
        String objectPath,
        String nombreOriginal,
        String mimeType,
        Long sizeBytes,
        Instant fechaSubida,
        String signedUrl
) {}