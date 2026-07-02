package com.tesis.municipalidadbackendapp.pago_inscripcion.controller;

import com.tesis.municipalidadbackendapp.pago_inscripcion.dto.ObservarPagoRequestDto;
import com.tesis.municipalidadbackendapp.pago_inscripcion.dto.PagoComprobanteResponseDto;
import com.tesis.municipalidadbackendapp.pago_inscripcion.dto.PagoInscripcionDetalleDto;
import com.tesis.municipalidadbackendapp.pago_inscripcion.dto.PagoInscripcionResumenDto;
import com.tesis.municipalidadbackendapp.pago_inscripcion.service.PagoInscripcionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class PagoInscripcionController {
    private final PagoInscripcionService pagoInscripcionService;

    @PostMapping("api/inscripciones/{inscripcionId}/pago/comprobante")
    public PagoComprobanteResponseDto subirComprobante(
            @PathVariable Integer inscripcionId,
            @RequestParam(required = false) String medioPago,
            @RequestParam(required = false) String numeroOperacion,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaPago,
            @RequestPart("archivo") MultipartFile archivo,
            HttpServletRequest request
    ) {
        return pagoInscripcionService.subirComprobante(
                inscripcionId,
                medioPago,
                numeroOperacion,
                fechaPago,
                archivo,
                request
        );
    }

    @GetMapping("api/admin/pagos-inscripcion")
    public List<PagoInscripcionResumenDto> listarPagos(
            @RequestParam(defaultValue = "TODOS") String estado,
            @RequestParam(required = false) String busqueda,
            @RequestParam(defaultValue = "RECIENTES") String orden
    ) {
        return pagoInscripcionService.listarPagos(estado, busqueda, orden);
    }

    @GetMapping("api/admin/pagos-inscripcion/pendientes")
    public List<PagoInscripcionResumenDto> listarPendientes() {
        return pagoInscripcionService.listarPendientes();
    }

    @GetMapping("api/admin/pagos-inscripcion/{id}")
    public PagoInscripcionDetalleDto obtenerDetalle(@PathVariable Integer id) {
        return pagoInscripcionService.obtenerDetalle(id);
    }

    @PostMapping("api/admin/pagos-inscripcion/{id}/validar")
    public PagoInscripcionDetalleDto validarPago(@PathVariable Integer id, HttpServletRequest request) {
        return pagoInscripcionService.validarPago(id, request);
    }

    @PostMapping("api/admin/pagos-inscripcion/{id}/observar")
    public PagoInscripcionDetalleDto observarPago(
            @PathVariable Integer id,
            @Valid @RequestBody ObservarPagoRequestDto requestDto,
            HttpServletRequest request
    ) {
        return pagoInscripcionService.observarPago(id, requestDto.observacion(), request);
    }
}