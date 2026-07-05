package com.tesis.municipalidadbackendapp.valoraciones.controller;

import com.tesis.municipalidadbackendapp.common.UsuarioAutenticadoService;
import com.tesis.municipalidadbackendapp.usuariosinternos.entity.Usuario;
import com.tesis.municipalidadbackendapp.valoraciones.dto.ValoracionGeneracionResponse;
import com.tesis.municipalidadbackendapp.valoraciones.dto.ValoracionRespuestaRequest;
import com.tesis.municipalidadbackendapp.valoraciones.dto.ValoracionTokenResponse;
import com.tesis.municipalidadbackendapp.valoraciones.service.ValoracionEventoService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/valoraciones")
public class ValoracionEventoController {
    private final ValoracionEventoService valoracionEventoService;
    private final UsuarioAutenticadoService usuarioAutenticadoService;

    @GetMapping("{token}")
    public ValoracionTokenResponse obtenerValoracion(@PathVariable String token) {
        return valoracionEventoService.obtenerValoracionPorToken(token);
    }

    @PostMapping("{token}/responder")
    public ValoracionTokenResponse responderValoracion(
            @PathVariable String token,
            @RequestBody ValoracionRespuestaRequest request
    ) {
        return valoracionEventoService.responderValoracion(token, request.puntuacion());
    }

    @GetMapping("validar")
    public ValoracionTokenResponse validarToken(@RequestParam String token) {
        return valoracionEventoService.obtenerValoracionPorToken(token);
    }

    @PostMapping("responder")
    public ValoracionTokenResponse responderValoracionCompatibilidad(@RequestBody ValoracionRespuestaRequest request) {
        return valoracionEventoService.responderValoracion(request.token(), request.puntuacion());
    }

    @PostMapping("admin/eventos/{eventoId}/generar")
    public ValoracionGeneracionResponse generarValoracionesEvento(
            @PathVariable Integer eventoId,
            HttpServletRequest httpServletRequest
    ) {
        Usuario usuario = usuarioAutenticadoService.obtenerUsuarioAutenticado();
        return valoracionEventoService.generarValoracionesParaEventoFinalizado(
                eventoId,
                usuario,
                httpServletRequest
        );
    }
}