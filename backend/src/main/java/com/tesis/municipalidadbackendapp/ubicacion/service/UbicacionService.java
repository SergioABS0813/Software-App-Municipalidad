package com.tesis.municipalidadbackendapp.ubicacion.service;

import com.tesis.municipalidadbackendapp.eventos.repository.EventoRepository;
import com.tesis.municipalidadbackendapp.ubicacion.dto.UbicacionConfiguracionDto;
import com.tesis.municipalidadbackendapp.ubicacion.dto.UbicacionRequest;
import com.tesis.municipalidadbackendapp.ubicacion.entity.Ubicacion;
import com.tesis.municipalidadbackendapp.ubicacion.repository.UbicacionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class UbicacionService {
    private static final int MAX_TEXTO_UBICACION = 100;
    private static final BigDecimal LATITUD_MINIMA = BigDecimal.valueOf(-90);
    private static final BigDecimal LATITUD_MAXIMA = BigDecimal.valueOf(90);
    private static final BigDecimal LONGITUD_MINIMA = BigDecimal.valueOf(-180);
    private static final BigDecimal LONGITUD_MAXIMA = BigDecimal.valueOf(180);
    private static final BigDecimal LATITUD_INVERTIDA_MINIMA = BigDecimal.valueOf(-82.5);
    private static final BigDecimal LATITUD_INVERTIDA_MAXIMA = BigDecimal.valueOf(-68.5);
    private static final BigDecimal LONGITUD_INVERTIDA_MINIMA = BigDecimal.valueOf(-18.5);
    private static final BigDecimal LONGITUD_INVERTIDA_MAXIMA = BigDecimal.valueOf(0.5);

    private final UbicacionRepository ubicacionRepository;
    private final EventoRepository eventoRepository;

    public Page<UbicacionConfiguracionDto> obtenerUbicacionesConfiguracion(String texto, int page, int size) {
        int pageSize = Math.max(1, Math.min(size, 200));
        PageRequest pageable = PageRequest.of(page, pageSize, Sort.by("nombre").ascending());
        return ubicacionRepository.findAllConfiguracion(texto, pageable);
    }

    public UbicacionConfiguracionDto guardarUbicacion(UbicacionRequest request) {
        validarUbicacion(request);
        validarLongitudesUbicacion(request);
        validarCoordenadas(request);

        Ubicacion ubicacion = new Ubicacion();
        ubicacion.setNombre(request.nombre().trim());
        ubicacion.setDireccion(request.direccion().trim());
        ubicacion.setReferencia(normalizarTextoOpcional(request.referencia()));
        ubicacion.setLatitud(request.latitud());
        ubicacion.setLongitud(request.longitud());
        ubicacion.setActivo(mapActivo(request.estado()));

        return mapToConfiguracionDto(ubicacionRepository.save(ubicacion));
    }

    public UbicacionConfiguracionDto actualizarEstado(Integer id, String estado) {
        Ubicacion ubicacion = obtenerUbicacion(id);
        ubicacion.setActivo(mapActivo(estado));
        return mapToConfiguracionDto(ubicacionRepository.save(ubicacion));
    }

    public void eliminarUbicacion(Integer id) {
        Ubicacion ubicacion = obtenerUbicacion(id);
        Long eventosAsociados = eventoRepository.countByUbicacionId(id);

        if (eventosAsociados > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No se puede eliminar la ubicación porque tiene eventos asociados"
            );
        }

        ubicacionRepository.delete(ubicacion);
    }

    private void validarUbicacion(UbicacionRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La ubicación es requerida");
        }

        if (!hasText(request.nombre())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre de la ubicación es requerido");
        }

        if (!hasText(request.direccion())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La dirección de la ubicación es requerida");
        }
    }

    private void validarLongitudesUbicacion(UbicacionRequest request) {
        validarLongitudMaxima(request.nombre(), "El nombre");
        validarLongitudMaxima(request.direccion(), "La dirección");
        validarLongitudMaxima(request.referencia(), "La referencia");
    }

    private void validarLongitudMaxima(String value, String fieldName) {
        if (value != null && value.trim().length() > MAX_TEXTO_UBICACION) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    fieldName + " no debe exceder los " + MAX_TEXTO_UBICACION + " caracteres"
            );
        }
    }

    private void validarCoordenadas(UbicacionRequest request) {
        if (request.latitud() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La latitud es obligatoria");
        }

        if (request.longitud() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La longitud es obligatoria");
        }

        if (request.latitud().compareTo(LATITUD_MINIMA) < 0 || request.latitud().compareTo(LATITUD_MAXIMA) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La latitud debe estar entre -90 y 90");
        }

        if (request.longitud().compareTo(LONGITUD_MINIMA) < 0 || request.longitud().compareTo(LONGITUD_MAXIMA) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La longitud debe estar entre -180 y 180");
        }

        if (parecenCoordenadasInvertidas(request.latitud(), request.longitud())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Las coordenadas parecen invertidas");
        }
    }

    private boolean parecenCoordenadasInvertidas(BigDecimal latitud, BigDecimal longitud) {
        return latitud.compareTo(LATITUD_INVERTIDA_MINIMA) >= 0
                && latitud.compareTo(LATITUD_INVERTIDA_MAXIMA) <= 0
                && longitud.compareTo(LONGITUD_INVERTIDA_MINIMA) >= 0
                && longitud.compareTo(LONGITUD_INVERTIDA_MAXIMA) <= 0;
    }

    private Byte mapActivo(String estado) {
        return "INACTIVO".equalsIgnoreCase(estado) ? (byte) 0 : (byte) 1;
    }

    private String normalizarTextoOpcional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private UbicacionConfiguracionDto mapToConfiguracionDto(Ubicacion ubicacion) {
        return new UbicacionConfiguracionDto(
                ubicacion.getId(),
                ubicacion.getNombre(),
                ubicacion.getDireccion(),
                ubicacion.getReferencia(),
                ubicacion.getLatitud(),
                ubicacion.getLongitud(),
                ubicacion.getActivo(),
                eventoRepository.countByUbicacionId(ubicacion.getId())
        );
    }

    private Ubicacion obtenerUbicacion(Integer id) {
        return ubicacionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Ubicación no encontrada"
                ));
    }
}
