package com.tesis.municipalidadbackendapp.qr;

import com.tesis.municipalidadbackendapp.qr.dto.CodigoQrResponseDto;
import com.tesis.municipalidadbackendapp.qr.service.CodigoQrService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/qr")
public class QrController {

    private final CodigoQrService codigoQrService;

    @GetMapping("vecino/inscripcion/{inscripcionId}")
    public ResponseEntity<CodigoQrResponseDto> obtenerQrActivoDeInscripcion(@PathVariable Integer inscripcionId) {
        return ResponseEntity.ok(codigoQrService.obtenerQrActivoPorInscripcion(inscripcionId));
    }


}
