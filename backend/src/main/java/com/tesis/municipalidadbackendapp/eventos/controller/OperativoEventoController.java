package com.tesis.municipalidadbackendapp.eventos.controller;

import com.tesis.municipalidadbackendapp.eventos.dto.EventoOperativoHoyDto;
import com.tesis.municipalidadbackendapp.eventos.dto.OperativoAnnulValidationRequestDto;
import com.tesis.municipalidadbackendapp.eventos.dto.OperativoManualRegistrationIdentityDto;
import com.tesis.municipalidadbackendapp.eventos.dto.OperativoManualRegistrationRequestDto;
import com.tesis.municipalidadbackendapp.eventos.dto.OperativoManualValidationRequestDto;
import com.tesis.municipalidadbackendapp.eventos.dto.OperativoQrTextRequestDto;
import com.tesis.municipalidadbackendapp.eventos.dto.OperativoQrValidationResponseDto;
import com.tesis.municipalidadbackendapp.eventos.service.EventoOperativoService;
import com.tesis.municipalidadbackendapp.qr.service.QrImageDecoderService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/operativo/eventos")
public class OperativoEventoController {

    private final EventoOperativoService eventoOperativoService;
    private final QrImageDecoderService qrImageDecoderService;

    @GetMapping("hoy")
    public List<EventoOperativoHoyDto> listarEventosHoy() {
        return eventoOperativoService.listarEventosHoyParaOperativo();
    }

    @GetMapping("inscripciones/manual/identidad/{dni}")
    public OperativoManualRegistrationIdentityDto consultarIdentidadInscripcionManual(@PathVariable String dni) {
        return eventoOperativoService.consultarIdentidadInscripcionManual(dni);
    }
    @PostMapping("{eventoId}/validaciones/{asistenciaId}/anular")

    public OperativoQrValidationResponseDto anularAsistencia(
            @PathVariable Integer eventoId,
            @PathVariable Integer asistenciaId,
            @RequestBody OperativoAnnulValidationRequestDto request
    ) {
        return eventoOperativoService.anularAsistencia(eventoId, asistenciaId, request);
    }

    @PostMapping("{eventoId}/validaciones/manual")
    public OperativoQrValidationResponseDto validarAsistenciaManual(
            @PathVariable Integer eventoId,
            @RequestBody OperativoManualValidationRequestDto request
    ) {
        return eventoOperativoService.validarAsistenciaManual(eventoId, request);
    }

    @PostMapping("{eventoId}/inscripciones/manual")
    public OperativoQrValidationResponseDto registrarInscripcionManual(
            @PathVariable Integer eventoId,
            @RequestBody OperativoManualRegistrationRequestDto request,
            HttpServletRequest httpRequest
    ) {
        return eventoOperativoService.registrarInscripcionManualYAsistencia(eventoId, request, httpRequest);
    }
    @PostMapping("{eventoId}/validaciones/qr/texto")
    public OperativoQrValidationResponseDto validarQrTexto(
            @PathVariable Integer eventoId,
            @RequestBody OperativoQrTextRequestDto request
    ) {
        return eventoOperativoService.validarQrEvento(eventoId, request.qrContent());
    }

    @PostMapping(value = "{eventoId}/validaciones/qr/imagen", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public OperativoQrValidationResponseDto validarQrImagen(
            @PathVariable Integer eventoId,
            @RequestParam("archivo") MultipartFile archivo
    ) {
        String contenidoQr = qrImageDecoderService.decodificarQr(archivo);
        return eventoOperativoService.validarQrEvento(eventoId, contenidoQr);
    }
}
