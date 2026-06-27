package com.tesis.municipalidadbackendapp.qr.service;

import com.tesis.municipalidadbackendapp.inscripciones.repository.InscripcionRepository;
import com.tesis.municipalidadbackendapp.qr.dto.CodigoQrResponseDto;
import com.tesis.municipalidadbackendapp.qr.entity.CodigoQr;
import com.tesis.municipalidadbackendapp.qr.enums.EstadoQr;
import com.tesis.municipalidadbackendapp.qr.repository.CodigoQrRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Base64;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CodigoQrService {

    private final CodigoQrRepository codigoQrRepository;
    private final CodigoQrTokenService codigoQrTokenService;
    private final QrImageService qrImageService;
    private static final ZoneId ZONA_LIMA = ZoneId.of("America/Lima");
    private final InscripcionRepository  inscripcionRepository;

    // OJO PARA VALIDAR QR VOY A VALIDAR POR EL LENGTH DEL PREFIJO y NO PORQUE SEA EXACTAMENTE IGUAL YA QUE HAY UN DETALLE CON LAS MINUSCULAS

    public CodigoQrResponseDto obtenerQrActivoPorInscripcion(Integer inscripcionId){
        return codigoQrRepository.findByInscripcion_IdAndEstadoQr(inscripcionId, EstadoQr.ACTIVO)
                .stream()
                .findFirst()
                .map(codigoQr -> {
                    String contenidoQr = codigoQrTokenService.construirContenidoQr(codigoQr.getToken());
                    System.out.println("TOKEN BD: " + codigoQr.getToken());
                    System.out.println("CONTENIDO QR GENERADO: " + contenidoQr);
                    byte[] qrPng = qrImageService.generarQrPngProfesional(contenidoQr);
                    String base64 = Base64.getEncoder().encodeToString(qrPng);
                    String dataUrl = "data:image/png;base64," + base64;
                    return new CodigoQrResponseDto(dataUrl);
                })
                .orElseThrow(() -> new RuntimeException("No se encontró un código QR activo para la inscripción con ID: " + inscripcionId));

    }

    @Transactional
    public CodigoQrResponseDto generarQrParaInscripcion(Integer inscripcionId) {
        revocarQrsActivosPorInscripcion(inscripcionId);
        String token = codigoQrTokenService.generarTokenSeguro();
        String contenidoQr = codigoQrTokenService.construirContenidoQr(token);
        ZonedDateTime generadoEn = ZonedDateTime.now(ZONA_LIMA).withZoneSameInstant(ZoneId.of("UTC"));

        // Fecha de expiracion es cuando acaba el evento
        inscripcionRepository.findById(inscripcionId)
                .ifPresent(inscripcion -> {
                    ZonedDateTime fechaExpiracion = null;
                    if (inscripcion.getEvento() != null && inscripcion.getEvento().getFechaHoraFin() != null) {
                        fechaExpiracion = inscripcion.getEvento().getFechaHoraFin().atZone(ZONA_LIMA);
                    }
                    CodigoQr codigoQr = new CodigoQr();
                    codigoQr.setInscripcion(inscripcion);
                    codigoQr.setToken(token);
                    codigoQr.setGeneradoEn(generadoEn.toInstant());
                    codigoQr.setFechaExpiracion(fechaExpiracion != null ? fechaExpiracion.toInstant() : null);
                    codigoQr.setEstadoQr(EstadoQr.ACTIVO);
                    codigoQrRepository.save(codigoQr);
                });

        byte[] qrPng = qrImageService.generarQrPngProfesional(contenidoQr);
        String base64 = Base64.getEncoder().encodeToString(qrPng);
        String dataUrl = "data:image/png;base64," + base64;
        return new CodigoQrResponseDto(dataUrl);

    }

    public void revocarQrsActivosPorInscripcion(Integer inscripcionId) {
        List<CodigoQr> qrsActivos = codigoQrRepository.findByInscripcion_IdAndEstadoQr(
                inscripcionId,
                EstadoQr.ACTIVO
        );

        for (CodigoQr qr : qrsActivos) {
            qr.setEstadoQr(EstadoQr.REVOCADO);
        }
    }


}
