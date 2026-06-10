package com.tesis.municipalidadbackendapp.notificaciones.controller;

import com.tesis.municipalidadbackendapp.notificaciones.dto.NotificacionesPanelDto;
import com.tesis.municipalidadbackendapp.notificaciones.service.NotificacionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/notificacion")
public class NotificacionController {

    private final NotificacionService notificacionService;
    //Request Param se saca cuando tengamos JWT para mandar el header y sacar el usuario por ahí CORREGIR

    @GetMapping("todas")
    public NotificacionesPanelDto obtenerTodasNotificaciones(@RequestParam Integer usuarioId) {
        return notificacionService.obtenerPanelNotificaciones(usuarioId, false);
    }

    @GetMapping("/no_leidas")
    public NotificacionesPanelDto obtenerNoLeidas(@RequestParam Integer usuarioId) {
        return notificacionService.obtenerPanelNotificaciones(usuarioId, true);
    }

    @PatchMapping("/{notificacionId}/leer")
    public ResponseEntity<Void> marcarComoLeida( //Solo se quiere cambiar el estado a "leida", por eso Patch
            @PathVariable Integer notificacionId,
            @RequestParam Integer usuarioId
    ) {
        notificacionService.marcarComoLeida(notificacionId, usuarioId);
        return ResponseEntity.noContent().build();
    }

}
