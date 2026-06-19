package com.tesis.municipalidadbackendapp.eventos.dto;

import java.time.LocalDateTime;
import java.util.List;

public record EventoRegistroRequest(
        String titulo,
        String descripcionBreve,
        String descripcion,
        Integer categoriaId,
        Integer areaMunicipalId,
        LocalDateTime fechaHoraInicio,
        LocalDateTime fechaHoraFin,
        Float costoReferencial,
        Integer ubicacionId,
        Integer aforoMaximo,
        String publicoTipo,
        Byte edadMin,
        Byte edadMax,
        String metaTipo,
        Float metaValor,
        Boolean encuestaSatisfaccionHabilitado,
        Boolean requiereControlAsistencia,
        Boolean enviarRevision,
        List<Integer> operativosAsignadosIds,
        List<ItemOrdenadoRequest> agenda,
        List<ItemOrdenadoRequest> requisitos,
        List<RecursoRequest> recursos
) {
    public record ItemOrdenadoRequest(
            Integer orden,
            String descripcion
    ) {}

    public record RecursoRequest(
            String tipoRecurso,
            String urlRecurso,
            String nombreArchivo
    ) {}
}
