package com.tesis.municipalidadbackendapp.bitacora.service;

import com.tesis.municipalidadbackendapp.bitacora.dto.BitacoraEventoDto;
import com.tesis.municipalidadbackendapp.bitacora.entity.BitacoraAccion;
import com.tesis.municipalidadbackendapp.bitacora.repository.BitacoraAccionRepository;
import com.tesis.municipalidadbackendapp.usuariosinternos.entity.Rol;
import com.tesis.municipalidadbackendapp.usuariosinternos.entity.Usuario;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Locale;

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
        bitacoraAccion.setFechaHora(zonedDateTimePeru.toInstant());
        bitacoraAccion.setIpOrigen(obtenerIpOrigen(request));
        bitacoraAccion.setDetalle(detalle);
        bitacoraAccion.setUsuario(usuario);

        return bitacoraAccionRepository.save(bitacoraAccion);
    }

    @Transactional(readOnly = true)
    public List<BitacoraEventoDto> listarHistorialEvento(Integer eventoId) {
        return bitacoraAccionRepository
                .findByEntidadAfectadaInAndEntidadIdOrderByFechaHoraDesc(
                        List.of("EVENTO", "EVENTO_OPERATIVO"),
                        eventoId
                )
                .stream()
                .map(this::toEventoDto)
                .toList();
    }

    private BitacoraEventoDto toEventoDto(BitacoraAccion bitacoraAccion) {
        Usuario usuario = bitacoraAccion.getUsuario();
        return new BitacoraEventoDto(
                bitacoraAccion.getId(),
                bitacoraAccion.getFechaHora(),
                usuario != null ? usuario.getNombre() : "Sistema",
                obtenerRolUsuario(usuario),
                bitacoraAccion.getAccion(),
                bitacoraAccion.getDetalle(),
                resolverTipoAccion(bitacoraAccion)
        );
    }

    private String obtenerRolUsuario(Usuario usuario) {
        if (usuario == null || usuario.getRol() == null) {
            return "Sistema";
        }

        Rol rol = usuario.getRol();
        if (rol.getCodigo() != null && !rol.getCodigo().isBlank()) {
            return rol.getCodigo();
        }

        return rol.getNombre() != null && !rol.getNombre().isBlank()
                ? rol.getNombre()
                : "Usuario";
    }

    private String resolverTipoAccion(BitacoraAccion bitacoraAccion) {
        String valor = ((bitacoraAccion.getAccion() != null ? bitacoraAccion.getAccion() : "")
                + " "
                + (bitacoraAccion.getDetalle() != null ? bitacoraAccion.getDetalle() : ""))
                .toUpperCase(Locale.ROOT);

        if (valor.contains("RECURSO") || valor.contains("AFICHE") || valor.contains("PORTADA") || valor.contains("VIDEO")) {
            return "RECURSO";
        }
        if (valor.contains("OPERATIVO")) {
            return "OPERATIVO";
        }
        if (valor.contains("UBICACION") || valor.contains("LUGAR")) {
            return "UBICACION";
        }
        if (valor.contains("FECHA") || valor.contains("HORA")) {
            return "FECHA";
        }
        if (valor.contains("CANCEL")) {
            return "CANCELAR";
        }
        if (valor.contains("PUBLIC")) {
            return "PUBLICAR";
        }
        if (valor.contains("OBSERV")) {
            return "OBSERVACION";
        }
        if (valor.contains("REVISION")) {
            return "REVISION";
        }
        if (valor.contains("ACTUALIZ")) {
            return "EDITAR";
        }
        if (valor.contains("CREAR")) {
            return "CREAR";
        }

        return "GENERAL";
    }

    private String obtenerIpOrigen(HttpServletRequest request) {
        String ipAddress = request != null ? request.getHeader("X-Forwarded-For") : null;
        if (ipAddress == null || ipAddress.isEmpty()) {
            ipAddress = request != null ? request.getRemoteAddr() : null;
        }
        return ipAddress;
    }
}
