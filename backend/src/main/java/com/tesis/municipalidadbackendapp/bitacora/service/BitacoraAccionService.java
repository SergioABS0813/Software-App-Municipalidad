package com.tesis.municipalidadbackendapp.bitacora.service;

import com.tesis.municipalidadbackendapp.bitacora.entity.BitacoraAccion;
import com.tesis.municipalidadbackendapp.bitacora.repository.BitacoraAccionRepository;
import com.tesis.municipalidadbackendapp.usuariosinternos.entity.Usuario;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;

@Service
@RequiredArgsConstructor
public class BitacoraAccionService {

    private final BitacoraAccionRepository bitacoraAccionRepository;


    public BitacoraAccion guardarAccion(String accion, String entidadAfectada, Integer entidadId, String detalle, Usuario usuario, HttpServletRequest request) {
        BitacoraAccion bitacoraAccion = new BitacoraAccion();
        bitacoraAccion.setAccion(accion);
        bitacoraAccion.setEntidadAfectada(entidadAfectada);
        bitacoraAccion.setEntidadId(entidadId);
        ZonedDateTime zonedDateTimePeru = ZonedDateTime.now(ZoneId.of("America/Lima"));
        bitacoraAccion.setFechaHora(zonedDateTimePeru.toInstant()); // Hora peruana
        bitacoraAccion.setIpOrigen(obtenerIpOrigen(request));
        bitacoraAccion.setDetalle(detalle);
        bitacoraAccion.setUsuario(usuario);

        return bitacoraAccionRepository.save(bitacoraAccion);
    }

    private String obtenerIpOrigen(HttpServletRequest request) {
        String ipAddress = request.getHeader("X-Forwarded-For");
        if (ipAddress == null || ipAddress.isEmpty()) {
            ipAddress = request.getRemoteAddr();
        }
        return ipAddress;
    }


}
