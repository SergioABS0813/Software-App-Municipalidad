package com.tesis.municipalidadbackendapp.notificaciones.dto;
import java.util.List;

public record NotificacionesPanelDto(Integer total,
                                     Integer noLeidas,
                                     List<NotificacionResponseDto> notificaciones) {
}
