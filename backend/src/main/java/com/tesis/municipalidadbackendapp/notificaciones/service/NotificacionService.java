package com.tesis.municipalidadbackendapp.notificaciones.service;

import com.tesis.municipalidadbackendapp.notificaciones.dto.NotificacionResponseDto;
import com.tesis.municipalidadbackendapp.notificaciones.dto.NotificacionesPanelDto;
import com.tesis.municipalidadbackendapp.notificaciones.entity.Notificacion;
import com.tesis.municipalidadbackendapp.notificaciones.repository.NotificacionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.ZoneId;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificacionService {
    private final NotificacionRepository notificacionRepository;

    public NotificacionesPanelDto obtenerPanelNotificaciones(Integer usuarioId, boolean soloNoLeidas) {

        List<Notificacion> notificaciones = soloNoLeidas
                ? notificacionRepository.findByUsuarioDestino_IdAndLeidaFalseOrderByFechaCreacionDesc(usuarioId)
                : notificacionRepository.findByUsuarioDestino_IdOrderByFechaCreacionDesc(usuarioId);

        Integer total = notificacionRepository.countByUsuarioDestino_Id(usuarioId);
        Integer noLeidas = notificacionRepository.countByUsuarioDestino_IdAndLeidaFalse(usuarioId);

        List<NotificacionResponseDto> notificacionesDTO = notificaciones.stream()
                .map(this::mapToDTO)
                .toList();

        return new NotificacionesPanelDto(
                total,
                noLeidas,
                notificacionesDTO
        );
    }

    public void marcarComoLeida(Integer notificacionId, Integer usuarioId) {
        Notificacion notificacion = notificacionRepository
                .findById(notificacionId)
                .orElseThrow(() -> new RuntimeException("Notificación no encontrada"));

        if (!notificacion.getUsuarioDestino().getId().equals(usuarioId)) {
            throw new RuntimeException("No tienes permiso para modificar esta notificación");
        }

        notificacion.setLeida((byte) 1);
        notificacionRepository.save(notificacion);
    }

    private NotificacionResponseDto mapToDTO(Notificacion notificacion) {
        boolean esLeida = notificacion.getLeida() != null && notificacion.getLeida() == 1;
        return new NotificacionResponseDto(
                notificacion.getId(),
                notificacion.getTitulo(),
                notificacion.getMensaje(),
                notificacion.getTipo(),
                esLeida,
                notificacion.getUrlDestino(),
                notificacion.getFechaCreacion()
        );
    }



}
