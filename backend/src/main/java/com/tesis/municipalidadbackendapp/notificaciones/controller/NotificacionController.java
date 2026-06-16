package com.tesis.municipalidadbackendapp.notificaciones.controller;

import com.tesis.municipalidadbackendapp.notificaciones.dto.NotificacionesPanelDto;
import com.tesis.municipalidadbackendapp.notificaciones.service.NotificacionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/notificacion")
public class NotificacionController {

    private final NotificacionService notificacionService;

    @GetMapping("todas")
    public NotificacionesPanelDto obtenerTodasNotificaciones() {
        return notificacionService.obtenerPanelNotificaciones(false);
    }

    @GetMapping("/no_leidas")
    public NotificacionesPanelDto obtenerNoLeidas() {
        return notificacionService.obtenerPanelNotificaciones(true);
    }

    @PatchMapping("/{notificacionId}/leer")
    public ResponseEntity<Void> marcarComoLeida(@PathVariable Integer notificacionId) {
        notificacionService.marcarComoLeida(notificacionId);
        return ResponseEntity.noContent().build();
    }
}
