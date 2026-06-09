package com.tesis.municipalidadbackendapp.eventos.dto;

import java.time.LocalDateTime;
import java.util.List;

public record EventoPanelAdministrativoDto(
        Integer id,
        String titulo,
        LocalDateTime fechaHoraInicio,
        String ubicacionNombre,
        String estadoCodigo,
        CategoriaEventoPanelAdministrativoDto categoria,
        Integer completitud,
        List<AlertaFichaEventoPanelAdministrativoDto> alertas
){
    //Dtos que se usan dentro del módulo de evento
    public record AlertaFichaEventoPanelAdministrativoDto(String tipo, String mensaje){}
    public record CategoriaEventoPanelAdministrativoDto(Integer id, String nombre){}
}
