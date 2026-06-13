package com.tesis.municipalidadbackendapp.ubicacion.controller;

import com.tesis.municipalidadbackendapp.ubicacion.dto.UbicacionConfiguracionDto;
import com.tesis.municipalidadbackendapp.ubicacion.dto.UbicacionEstadoRequest;
import com.tesis.municipalidadbackendapp.ubicacion.dto.UbicacionRequest;
import com.tesis.municipalidadbackendapp.ubicacion.service.UbicacionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/ubicacion")
public class UbicacionController {
    private final UbicacionService ubicacionService;

    @GetMapping("admin/configuracion")
    public Page<UbicacionConfiguracionDto> obtenerUbicacionesConfiguracion(
            @RequestParam(required = false) String texto,
            @RequestParam(defaultValue = "0") int page
    ) {
        return ubicacionService.obtenerUbicacionesConfiguracion(texto, page);
    }

    @PostMapping("admin/guardar_ubicacion")
    public UbicacionConfiguracionDto guardarUbicacion(@RequestBody UbicacionRequest request) {
        return ubicacionService.guardarUbicacion(request);
    }

    @PatchMapping("admin/{id}/estado")
    public UbicacionConfiguracionDto actualizarEstado(
            @PathVariable Integer id,
            @RequestBody UbicacionEstadoRequest request
    ) {
        return ubicacionService.actualizarEstado(id, request.estado());
    }

    @DeleteMapping("admin/{id}")
    public ResponseEntity<Void> eliminarUbicacion(@PathVariable Integer id) {
        ubicacionService.eliminarUbicacion(id);
        return ResponseEntity.noContent().build();
    }
}
