package com.tesis.municipalidadbackendapp.eventos.service;

import com.tesis.municipalidadbackendapp.eventos.dto.RecursoEventoDto;
import com.tesis.municipalidadbackendapp.eventos.dto.RecursoUploadResponse;
import com.tesis.municipalidadbackendapp.eventos.entity.Evento;
import com.tesis.municipalidadbackendapp.eventos.entity.RecursoEvento;
import com.tesis.municipalidadbackendapp.eventos.repository.EventoRepository;
import com.tesis.municipalidadbackendapp.eventos.repository.RecursoEventoRepository;
import com.tesis.municipalidadbackendapp.storage.CloudStorageService;
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

    @Transactional
    public RecursoUploadResponse subirRecurso(Integer eventoId, String tipoRecurso, MultipartFile archivo) {
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
        recurso.setFechaSubida(Instant.now());

        return toUploadResponse(recursoEventoRepository.save(recurso));
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
    public void eliminarRecurso(Integer eventoId, Integer recursoId) {
        RecursoEvento recurso = recursoEventoRepository.findByIdAndEventoId(recursoId, eventoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recurso no encontrado"));
        eliminarRecursoExistente(recurso);
    }

    private Evento obtenerEvento(Integer eventoId) {
        return eventoRepository.findById(eventoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento no encontrado"));
    }

    private void eliminarRecursoExistente(RecursoEvento recurso) {
        cloudStorageService.eliminar(recurso.getObjectPath());
        recursoEventoRepository.delete(recurso);
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
