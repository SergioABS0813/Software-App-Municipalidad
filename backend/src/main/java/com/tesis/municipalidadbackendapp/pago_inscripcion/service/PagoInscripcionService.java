package com.tesis.municipalidadbackendapp.pago_inscripcion.service;

import com.tesis.municipalidadbackendapp.bitacora.service.BitacoraAccionService;
import com.tesis.municipalidadbackendapp.common.UsuarioAutenticadoService;
import com.tesis.municipalidadbackendapp.eventos.entity.Evento;
import com.tesis.municipalidadbackendapp.inscripciones.entity.Inscripcion;
import com.tesis.municipalidadbackendapp.inscripciones.enums.EstadoInscripcion;
import com.tesis.municipalidadbackendapp.inscripciones.repository.InscripcionRepository;
import com.tesis.municipalidadbackendapp.pago_inscripcion.dto.PagoComprobanteResponseDto;
import com.tesis.municipalidadbackendapp.pago_inscripcion.dto.PagoInscripcionDetalleDto;
import com.tesis.municipalidadbackendapp.pago_inscripcion.dto.PagoInscripcionResumenDto;
import com.tesis.municipalidadbackendapp.pago_inscripcion.entity.PagoInscripcion;
import com.tesis.municipalidadbackendapp.pago_inscripcion.repository.PagoInscripcionRepository;
import com.tesis.municipalidadbackendapp.qr.dto.CodigoQrResponseDto;
import com.tesis.municipalidadbackendapp.qr.service.CodigoQrService;
import com.tesis.municipalidadbackendapp.storage.CloudStorageService;
import com.tesis.municipalidadbackendapp.usuariosinternos.entity.Usuario;
import com.tesis.municipalidadbackendapp.vecinos.entity.Vecino;
import com.tesis.municipalidadbackendapp.vecinos.repository.VecinoRepository;
import com.tesis.municipalidadbackendapp.vecinos.service.VecinoNotificacionService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class PagoInscripcionService {
    private static final String ESTADO_EN_REVISION = "EN_REVISION";
    private static final String ESTADO_VALIDADO = "VALIDADO";
    private static final String ESTADO_RECHAZADO = "RECHAZADO";
    private static final String ESTADO_OBSERVADO = "OBSERVADO";

    private final PagoInscripcionRepository pagoInscripcionRepository;
    private final InscripcionRepository inscripcionRepository;
    private final VecinoRepository vecinoRepository;
    private final CloudStorageService cloudStorageService;
    private final UsuarioAutenticadoService usuarioAutenticadoService;
    private final CodigoQrService codigoQrService;
    private final VecinoNotificacionService vecinoNotificacionService;
    private final BitacoraAccionService bitacoraAccionService;

    @Value("${app.pagos.whatsapp-reclamos:999999999}")
    private String whatsappReclamos;

    @Transactional
    public PagoComprobanteResponseDto subirComprobante(
            Integer inscripcionId,
            String medioPago,
            String numeroOperacion,
            LocalDate fechaPago,
            MultipartFile archivo,
            HttpServletRequest request
    ) {
        Vecino vecino = obtenerVecinoAutenticado();
        Inscripcion inscripcion = inscripcionRepository.findById(inscripcionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inscripcion no encontrada"));

        if (inscripcion.getVecino() == null || !inscripcion.getVecino().getId().equals(vecino.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No puedes modificar esta inscripcion");
        }
        if (!requierePago(inscripcion.getEvento())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este evento no requiere pago");
        }
        if (inscripcion.getEstadoInscripcion() == EstadoInscripcion.CONFIRMADA
                || inscripcion.getEstadoInscripcion() == EstadoInscripcion.CANCELADA) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La inscripcion ya no permite actualizar comprobante");
        }

        PagoInscripcion pago = pagoInscripcionRepository.findByInscripcionId(inscripcionId)
                .orElseGet(() -> {
                    PagoInscripcion nuevo = new PagoInscripcion();
                    nuevo.setInscripcion(inscripcion);
                    nuevo.setFechaRegistro(Instant.now());
                    return nuevo;
                });
        if (ESTADO_EN_REVISION.equalsIgnoreCase(pago.getEstadoPago())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Tu comprobante ya fue enviado y se encuentra en revision"
            );
        }

        CloudStorageService.UploadedObject uploadedObject = cloudStorageService.subirComprobantePago(inscripcionId, archivo);

        pago.setMonto(obtenerMontoEvento(inscripcion.getEvento()));
        pago.setMedioPago(normalizarTexto(medioPago));
        pago.setNumeroOperacion(normalizarTexto(numeroOperacion));
        pago.setFechaPago(fechaPago);
        pago.setUrlComprobante(uploadedObject.objectPath());
        pago.setEstadoPago(ESTADO_EN_REVISION);
        pago.setObservacion(null);
        pago.setValidadoPorUsuario(null);
        pago.setFechaValidacion(null);
        if (pago.getFechaRegistro() == null) {
            pago.setFechaRegistro(Instant.now());
        }

        inscripcion.setEstadoInscripcion(EstadoInscripcion.PENDIENTE_PAGO);
        PagoInscripcion guardado = pagoInscripcionRepository.save(pago);
        vecinoNotificacionService.enviarCorreoComprobantePagoRecibido(inscripcion);

        return new PagoComprobanteResponseDto(
                guardado.getId(),
                inscripcion.getId(),
                guardado.getEstadoPago(),
                inscripcion.getEstadoInscripcion().name(),
                cloudStorageService.generarSignedUrlInscripcion(guardado.getUrlComprobante()),
                guardado.getObservacion()
        );
    }

    @Transactional(readOnly = true)
    public List<PagoInscripcionResumenDto> listarPendientes() {
        return listarPagos("PENDIENTES", null, "RECIENTES");
    }

    @Transactional(readOnly = true)
    public List<PagoInscripcionResumenDto> listarPagos(String estado, String busqueda, String orden) {
        String busquedaNormalizada = normalizarTexto(busqueda);
        List<PagoInscripcion> pagos = new ArrayList<>(pagoInscripcionRepository.findAllByEstadoPagoInConDetalle(
                resolverEstadosFiltro(estado),
                busquedaNormalizada
        ));

        pagos.sort(resolverOrdenPagos(orden));

        return pagos.stream()
                .map(this::toResumenDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public PagoInscripcionDetalleDto obtenerDetalle(Integer pagoId) {
        PagoInscripcion pago = obtenerPagoDetalle(pagoId);
        return toDetalleDto(pago);
    }

    @Transactional
    public PagoInscripcionDetalleDto observarPago(Integer pagoId, String observacion, HttpServletRequest request) {
        String observacionNormalizada = normalizarTexto(observacion);
        if (!StringUtils.hasText(observacionNormalizada)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La observacion es obligatoria");
        }

        Usuario admin = usuarioAutenticadoService.obtenerUsuarioAutenticado();
        PagoInscripcion pago = obtenerPagoDetalle(pagoId);
        Inscripcion inscripcion = pago.getInscripcion();
        if (inscripcion.getEstadoInscripcion() == EstadoInscripcion.CONFIRMADA
                || inscripcion.getEstadoInscripcion() == EstadoInscripcion.CANCELADA) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La inscripcion ya no permite observar el pago");
        }

        pago.setEstadoPago(ESTADO_OBSERVADO);
        pago.setObservacion(observacionNormalizada);
        pago.setValidadoPorUsuario(admin);
        pago.setFechaValidacion(Instant.now());
        inscripcion.setEstadoInscripcion(EstadoInscripcion.PAGO_OBSERVADO);

        vecinoNotificacionService.enviarCorreoPagoObservado(inscripcion, observacionNormalizada);
        bitacoraAccionService.guardarAccion(
                "OBSERVAR_PAGO_INSCRIPCION",
                "PAGO_INSCRIPCION",
                pago.getId(),
                "Se observo el pago de la inscripcion " + inscripcion.getId() + ". Observacion: " + observacionNormalizada,
                admin,
                request
        );

        return toDetalleDto(pago);
    }

    @Transactional
    public PagoInscripcionDetalleDto validarPago(Integer pagoId, HttpServletRequest request) {
        Usuario admin = usuarioAutenticadoService.obtenerUsuarioAutenticado();
        PagoInscripcion pago = obtenerPagoDetalle(pagoId);
        Inscripcion inscripcion = pago.getInscripcion();

        if (inscripcion.getEstadoInscripcion() == EstadoInscripcion.CONFIRMADA) {
            return toDetalleDto(pago);
        }
        if (inscripcion.getEstadoInscripcion() == EstadoInscripcion.CANCELADA) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La inscripcion ya esta cancelada");
        }

        pago.setEstadoPago(ESTADO_VALIDADO);
        pago.setValidadoPorUsuario(admin);
        pago.setFechaValidacion(Instant.now());

        if (!hayCupoDisponibleParaConfirmar(inscripcion.getEvento())) {
            inscripcion.setEstadoInscripcion(EstadoInscripcion.CANCELADA);
            inscripcion.setMotivoCancelacion("AFORO_COMPLETO");
            inscripcion.setObservacionCancelacion("El aforo disponible se completo antes de validar el pago.");
            inscripcion.setFechaCancelacion(Instant.now());
            vecinoNotificacionService.enviarCorreoInscripcionCanceladaPorAforo(inscripcion, whatsappReclamos);
            bitacoraAccionService.guardarAccion(
                    "CANCELAR_INSCRIPCION_AFORO_COMPLETO",
                    "INSCRIPCION",
                    inscripcion.getId(),
                    "Se valido el pago, pero la inscripcion fue cancelada por aforo completo",
                    admin,
                    request
            );
            return toDetalleDto(pago);
        }

        inscripcion.setEstadoInscripcion(EstadoInscripcion.CONFIRMADA);
        if (requiereControlAsistencia(inscripcion.getEvento())) {
            CodigoQrResponseDto qr = codigoQrService.generarQrParaInscripcion(inscripcion.getId());
            vecinoNotificacionService.enviarConstanciaInscripcion(inscripcion, qr.qrDataUrl());
        } else {
            vecinoNotificacionService.enviarConstanciaInscripcion(inscripcion);
        }
        vecinoNotificacionService.enviarCorreoPagoValidado(inscripcion);

        bitacoraAccionService.guardarAccion(
                "VALIDAR_PAGO_INSCRIPCION",
                "PAGO_INSCRIPCION",
                pago.getId(),
                "Se valido el pago y se confirmo la inscripcion " + inscripcion.getId(),
                admin,
                request
        );
        if (requiereControlAsistencia(inscripcion.getEvento())) {
            bitacoraAccionService.guardarAccion(
                    "GENERAR_QR_PAGO_VALIDADO",
                    "INSCRIPCION",
                    inscripcion.getId(),
                    "Se genero QR activo luego de validar el pago",
                    admin,
                    request
            );
        }

        return toDetalleDto(pago);
    }

    private boolean requiereControlAsistencia(Evento evento) {
        return evento != null
                && evento.getRequiereControlAsistencia() != null
                && evento.getRequiereControlAsistencia() == 1;
    }

    private List<String> resolverEstadosFiltro(String estado) {
        String estadoNormalizado = StringUtils.hasText(estado)
                ? estado.trim().toUpperCase(Locale.ROOT)
                : "TODOS";

        return switch (estadoNormalizado) {
            case "EN_REVISION", "REVISION" -> List.of(ESTADO_EN_REVISION);
            case "VALIDADO" -> List.of(ESTADO_VALIDADO);
            case "RECHAZADO" -> List.of(ESTADO_RECHAZADO);
            case "OBSERVADO" -> List.of(ESTADO_OBSERVADO);
            case "PENDIENTES" -> List.of(ESTADO_EN_REVISION, ESTADO_OBSERVADO);
            default -> List.of(ESTADO_EN_REVISION, ESTADO_VALIDADO, ESTADO_RECHAZADO, ESTADO_OBSERVADO);
        };
    }

    private Comparator<PagoInscripcion> resolverOrdenPagos(String orden) {
        String ordenNormalizado = StringUtils.hasText(orden)
                ? orden.trim().toUpperCase(Locale.ROOT)
                : "RECIENTES";

        return switch (ordenNormalizado) {
            case "ANTIGUOS" -> Comparator
                    .comparing(PagoInscripcion::getFechaRegistro, Comparator.nullsLast(Comparator.naturalOrder()))
                    .thenComparing(PagoInscripcion::getId, Comparator.nullsLast(Comparator.naturalOrder()));
            case "MAYOR_MONTO" -> Comparator
                    .comparing(PagoInscripcion::getMonto, Comparator.nullsLast(Comparator.reverseOrder()))
                    .thenComparing(PagoInscripcion::getFechaRegistro, Comparator.nullsLast(Comparator.reverseOrder()))
                    .thenComparing(PagoInscripcion::getId, Comparator.nullsLast(Comparator.reverseOrder()));
            case "MENOR_MONTO" -> Comparator
                    .comparing(PagoInscripcion::getMonto, Comparator.nullsLast(Comparator.naturalOrder()))
                    .thenComparing(PagoInscripcion::getFechaRegistro, Comparator.nullsLast(Comparator.reverseOrder()))
                    .thenComparing(PagoInscripcion::getId, Comparator.nullsLast(Comparator.reverseOrder()));
            default -> Comparator
                    .comparing(PagoInscripcion::getFechaRegistro, Comparator.nullsLast(Comparator.reverseOrder()))
                    .thenComparing(PagoInscripcion::getId, Comparator.nullsLast(Comparator.reverseOrder()));
        };
    }
    private PagoInscripcion obtenerPagoDetalle(Integer pagoId) {
        return pagoInscripcionRepository.findDetalleById(pagoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pago de inscripcion no encontrado"));
    }

    private boolean hayCupoDisponibleParaConfirmar(Evento evento) {
        Integer aforoMaximo = evento.getAforoMaximo();
        if (aforoMaximo == null || aforoMaximo <= 0) {
            return true;
        }
        long confirmadas = inscripcionRepository.countActivasByEventoId(evento.getId());
        return confirmadas < aforoMaximo;
    }

    private BigDecimal obtenerMontoEvento(Evento evento) {
        Float costo = evento.getCostoVecinal() != null ? evento.getCostoVecinal() : evento.getCostoReferencial();
        if (costo == null || costo <= 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El evento no tiene costo configurado");
        }
        return BigDecimal.valueOf(costo.doubleValue());
    }

    private boolean requierePago(Evento evento) {
        return evento != null && evento.getRequierePago() != null && evento.getRequierePago() == 1;
    }

    private Vecino obtenerVecinoAutenticado() {
        Jwt jwt = (Jwt) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String keycloakId = jwt.getSubject();
        String email = jwt.getClaimAsString("email");
        return vecinoRepository.findByKeycloakId(keycloakId)
                .or(() -> StringUtils.hasText(email) ? vecinoRepository.findByEmailIgnoreCase(email) : java.util.Optional.empty())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontro la cuenta vecinal autenticada"));
    }

    private String normalizarTexto(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private PagoInscripcionResumenDto toResumenDto(PagoInscripcion pago) {
        Inscripcion inscripcion = pago.getInscripcion();
        Evento evento = inscripcion.getEvento();
        Vecino vecino = inscripcion.getVecino();
        return new PagoInscripcionResumenDto(
                pago.getId(),
                inscripcion.getId(),
                pago.getEstadoPago(),
                pago.getMonto(),
                pago.getMedioPago(),
                pago.getNumeroOperacion(),
                pago.getFechaPago(),
                pago.getFechaRegistro(),
                cloudStorageService.generarSignedUrlInscripcion(pago.getUrlComprobante()),
                evento.getId(),
                evento.getTitulo(),
                vecino.getId(),
                nombreVecino(vecino),
                vecino.getDni(),
                inscripcion.getEstadoInscripcion() != null ? inscripcion.getEstadoInscripcion().name() : null
        );
    }

    private PagoInscripcionDetalleDto toDetalleDto(PagoInscripcion pago) {
        Inscripcion inscripcion = pago.getInscripcion();
        Evento evento = inscripcion.getEvento();
        Vecino vecino = inscripcion.getVecino();
        Usuario validador = pago.getValidadoPorUsuario();
        return new PagoInscripcionDetalleDto(
                pago.getId(),
                inscripcion.getId(),
                pago.getEstadoPago(),
                pago.getMonto(),
                pago.getMedioPago(),
                pago.getNumeroOperacion(),
                pago.getFechaPago(),
                cloudStorageService.generarSignedUrlInscripcion(pago.getUrlComprobante()),
                pago.getObservacion(),
                pago.getFechaRegistro(),
                pago.getFechaValidacion(),
                validador != null ? validador.getId() : null,
                validador != null ? validador.getNombre() : null,
                evento.getId(),
                evento.getTitulo(),
                evento.getAforoMaximo(),
                calcularCuposDisponibles(evento),
                vecino.getId(),
                nombreVecino(vecino),
                vecino.getDni(),
                vecino.getEmail(),
                inscripcion.getEstadoInscripcion() != null ? inscripcion.getEstadoInscripcion().name() : null,
                inscripcion.getMotivoCancelacion(),
                inscripcion.getObservacionCancelacion()
        );
    }

    private Integer calcularCuposDisponibles(Evento evento) {
        if (evento.getAforoMaximo() == null || evento.getAforoMaximo() <= 0) {
            return 0;
        }
        long confirmadas = inscripcionRepository.countActivasByEventoId(evento.getId());
        return Math.max(0, evento.getAforoMaximo() - (int) confirmadas);
    }

    private String nombreVecino(Vecino vecino) {
        return StringUtils.hasText(vecino.getNombre()) ? vecino.getNombre() : "Vecino";
    }
}