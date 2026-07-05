package com.tesis.municipalidadbackendapp.eventos.service;

import static com.tesis.municipalidadbackendapp.common.FechaHoraUtils.ahoraLima;

import com.tesis.municipalidadbackendapp.bitacora.service.BitacoraAccionService;
import com.tesis.municipalidadbackendapp.eventos.dto.RecursoEventoDto;
import com.tesis.municipalidadbackendapp.eventos.dto.RecursoUploadResponse;
import com.tesis.municipalidadbackendapp.eventos.entity.Evento;
import com.tesis.municipalidadbackendapp.eventos.entity.RecursoEvento;
import com.tesis.municipalidadbackendapp.eventos.repository.EventoRepository;
import com.tesis.municipalidadbackendapp.eventos.repository.RecursoEventoRepository;
import com.tesis.municipalidadbackendapp.storage.CloudStorageService;
import com.tesis.municipalidadbackendapp.usuariosinternos.entity.Usuario;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RecursoEventoService {
    private final EventoRepository eventoRepository;
    private final RecursoEventoRepository recursoEventoRepository;
    private final CloudStorageService cloudStorageService;
    private final BitacoraAccionService bitacoraAccionService;

    @Transactional
    public RecursoUploadResponse subirRecurso(Integer eventoId, String tipoRecurso, MultipartFile archivo, Usuario usuario, HttpServletRequest request) {
        Evento evento = obtenerEvento(eventoId);
        String tipoNormalizado = cloudStorageService.normalizarTipo(tipoRecurso);
        CloudStorageService.UploadedObject uploadedObject = cloudStorageService.subir(eventoId, tipoNormalizado, archivo);

        if (cloudStorageService.esTipoUnico(tipoNormalizado)) {
            recursoEventoRepository.findByEventoAndTipoRecurso(evento, tipoNormalizado)
                    .forEach(this::eliminarRecursoExistente);
        }

        RecursoEvento recurso = new RecursoEvento();
        recurso.setEvento(evento);
        recurso.setTipoRecurso(tipoNormalizado);
        recurso.setObjectPath(uploadedObject.objectPath());
        recurso.setNombreOriginal(uploadedObject.nombreOriginal());
        recurso.setMimeType(uploadedObject.mimeType());
        recurso.setSizeBytes(uploadedObject.sizeBytes());
        recurso.setFechaSubida(ahoraLima());

        RecursoEvento recursoGuardado = recursoEventoRepository.save(recurso);
        bitacoraAccionService.guardarAccion(
                "SUBIR_RECURSO_EVENTO",
                "EVENTO",
                evento.getId(),
                "Subio " + articuloTipoRecurso(tipoNormalizado) + " \"" + valorDetalle(recursoGuardado.getNombreOriginal()) + "\"",
                usuario,
                request
        );

        return toUploadResponse(recursoGuardado);
    }

    @Transactional(readOnly = true)
    public List<RecursoEventoDto> listarRecursos(Integer eventoId) {
        obtenerEvento(eventoId);
        return recursoEventoRepository.findByEventoId(eventoId).stream()
                .sorted(Comparator.comparing(RecursoEvento::getFechaSubida, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public void eliminarRecurso(Integer eventoId, Integer recursoId, Usuario usuario, HttpServletRequest request) {
        RecursoEvento recurso = recursoEventoRepository.findByIdAndEventoId(recursoId, eventoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recurso no encontrado"));
        String tipoRecurso = recurso.getTipoRecurso();
        String nombreOriginal = recurso.getNombreOriginal();
        eliminarRecursoExistente(recurso);
        bitacoraAccionService.guardarAccion(
                "ELIMINAR_RECURSO_EVENTO",
                "EVENTO",
                eventoId,
                "Elimino " + articuloTipoRecurso(tipoRecurso) + " \"" + valorDetalle(nombreOriginal) + "\"",
                usuario,
                request
        );
    }

    private Evento obtenerEvento(Integer eventoId) {
        return eventoRepository.findById(eventoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento no encontrado"));
    }

    private void eliminarRecursoExistente(RecursoEvento recurso) {
        cloudStorageService.eliminar(recurso.getObjectPath());
        recursoEventoRepository.delete(recurso);
    }

    private String articuloTipoRecurso(String tipoRecurso) {
        return switch (tipoRecurso != null ? tipoRecurso : "") {
            case "IMAGEN_PORTADA" -> "una portada ciudadana";
            case "AFICHE" -> "un afiche";
            case "VIDEO" -> "un video";
            case "DOCUMENTO" -> "un documento";
            case "EVIDENCIA" -> "una evidencia";
            default -> "un recurso";
        };
    }

    private String valorDetalle(String value) {
        return value != null && !value.isBlank() ? value.trim() : "Sin nombre";
    }

    private RecursoUploadResponse toUploadResponse(RecursoEvento recurso) {
        return new RecursoUploadResponse(
                recurso.getId(),
                recurso.getEvento().getId(),
                recurso.getTipoRecurso(),
                recurso.getObjectPath(),
                recurso.getNombreOriginal(),
                recurso.getMimeType(),
                recurso.getSizeBytes(),
                recurso.getFechaSubida(),
                cloudStorageService.generarSignedUrl(recurso.getObjectPath())
        );
    }

    private RecursoEventoDto toDto(RecursoEvento recurso) {
        return new RecursoEventoDto(
                recurso.getId(),
                recurso.getEvento().getId(),
                recurso.getTipoRecurso(),
                recurso.getObjectPath(),
                recurso.getNombreOriginal(),
                recurso.getMimeType(),
                recurso.getSizeBytes(),
                recurso.getFechaSubida(),
                cloudStorageService.generarSignedUrl(recurso.getObjectPath())
        );
    }
}

