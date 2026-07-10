package com.tesis.municipalidadbackendapp.eventos.service;

import static com.tesis.municipalidadbackendapp.common.FechaHoraUtils.ahoraLima;

import com.tesis.municipalidadbackendapp.apiDni.dto.BackendResponseDto;
import com.tesis.municipalidadbackendapp.apiDni.service.ApiDniService;
import com.tesis.municipalidadbackendapp.bitacora.service.BitacoraAccionService;
import com.tesis.municipalidadbackendapp.common.UsuarioAutenticadoService;
import com.tesis.municipalidadbackendapp.eventos.dto.EventoOperativoHoyDto;
import com.tesis.municipalidadbackendapp.eventos.dto.OperativoAnnulValidationRequestDto;
import com.tesis.municipalidadbackendapp.eventos.dto.OperativoManualRegistrationIdentityDto;
import com.tesis.municipalidadbackendapp.eventos.dto.OperativoManualRegistrationRequestDto;
import com.tesis.municipalidadbackendapp.eventos.dto.OperativoManualValidationRequestDto;
import com.tesis.municipalidadbackendapp.eventos.dto.OperativoQrValidationResponseDto;
import com.tesis.municipalidadbackendapp.eventos.dto.UsuarioOperativoDto;
import com.tesis.municipalidadbackendapp.eventos.entity.Evento;
import com.tesis.municipalidadbackendapp.eventos.entity.EventoOperativo;
import com.tesis.municipalidadbackendapp.eventos.repository.EventoRepository;
import com.tesis.municipalidadbackendapp.eventos.repository.EventoOperativoRepository;
import com.tesis.municipalidadbackendapp.inscripciones.repository.InscripcionRepository;
import com.tesis.municipalidadbackendapp.inscripciones.entity.Inscripcion;
import com.tesis.municipalidadbackendapp.inscripciones.enums.EstadoInscripcion;
import com.tesis.municipalidadbackendapp.asistencias.entity.Asistencia;
import com.tesis.municipalidadbackendapp.asistencias.repository.AsistenciaRepository;
import com.tesis.municipalidadbackendapp.qr.entity.CodigoQr;
import com.tesis.municipalidadbackendapp.qr.enums.EstadoQr;
import com.tesis.municipalidadbackendapp.qr.repository.CodigoQrRepository;
import com.tesis.municipalidadbackendapp.qr.service.CodigoQrTokenService;
import com.tesis.municipalidadbackendapp.usuariosinternos.entity.Usuario;
import com.tesis.municipalidadbackendapp.vecinos.entity.EstadoVecino;
import com.tesis.municipalidadbackendapp.vecinos.entity.Vecino;
import com.tesis.municipalidadbackendapp.vecinos.repository.EstadoVecinoRepository;
import com.tesis.municipalidadbackendapp.vecinos.repository.VecinoRepository;
import com.tesis.municipalidadbackendapp.vecinos.service.VecinoNotificacionService;
import com.tesis.municipalidadbackendapp.usuariosinternos.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.Locale;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class EventoOperativoService {
    private static final ZoneId ZONA_LIMA = ZoneId.of("America/Lima");
    private static final DateTimeFormatter FECHA_FORMATTER = DateTimeFormatter.ofPattern("dd MMM yyyy");
    private static final DateTimeFormatter HORA_FORMATTER = DateTimeFormatter.ofPattern("h:mm a");

    private final EventoOperativoRepository eventoOperativoRepository;
    private final EventoRepository eventoRepository;
    private final UsuarioRepository usuarioRepository;
    private final UsuarioAutenticadoService usuarioAutenticadoService;
    private final BitacoraAccionService bitacoraAccionService;
    private final InscripcionRepository inscripcionRepository;
    private final AsistenciaRepository asistenciaRepository;
    private final CodigoQrRepository codigoQrRepository;
    private final CodigoQrTokenService codigoQrTokenService;
    private final VecinoRepository vecinoRepository;
    private final EstadoVecinoRepository estadoVecinoRepository;
    private final VecinoNotificacionService vecinoNotificacionService;
    private final ApiDniService apiDniService;

    @Transactional(readOnly = true)
    public OperativoManualRegistrationIdentityDto consultarIdentidadInscripcionManual(String dni) {
        String dniNormalizado = normalizarDni(dni);
        if (!StringUtils.hasText(dniNormalizado) || !dniNormalizado.matches("^\\d{8}$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ingresa un DNI valido de 8 digitos");
        }

        Optional<Vecino> vecinoExistente = vecinoRepository.findByDni(dniNormalizado);
        boolean existeVecino = vecinoExistente.isPresent();
        boolean tieneCuentaPlataforma = vecinoExistente
                .map(Vecino::getKeycloakId)
                .filter(StringUtils::hasText)
                .isPresent();

        if (tieneCuentaPlataforma) {
            String nombreCompleto = vecinoExistente.map(Vecino::getNombre).orElse("");
            PartesNombre partesNombre = separarNombreCompleto(nombreCompleto);
            return new OperativoManualRegistrationIdentityDto(
                    dniNormalizado,
                    partesNombre.nombres(),
                    partesNombre.apellidos(),
                    nombreCompleto,
                    true,
                    true
            );
        }

        BackendResponseDto respuestaDni = apiDniService.obtenerNombrePorDni(dniNormalizado);
        String nombreCompleto = String.valueOf(respuestaDni.data());
        PartesNombre partesNombre = separarNombreCompleto(nombreCompleto);
        return new OperativoManualRegistrationIdentityDto(
                dniNormalizado,
                partesNombre.nombres(),
                partesNombre.apellidos(),
                nombreCompleto,
                existeVecino,
                false
        );
    }
    public List<UsuarioOperativoDto> listarOperativosActivos() {
        return usuarioRepository.findOperativosActivos().stream()
                .map(this::toUsuarioOperativoDto)
                .toList();
    }

    public List<UsuarioOperativoDto> listarOperativosAsignados(Evento evento) {
        return eventoOperativoRepository.findByEventoAndActivo(evento, (byte) 1).stream()
                .map(EventoOperativo::getUsuario)
                .filter(Objects::nonNull)
                .map(this::toUsuarioOperativoDto)
                .toList();
    }

    public boolean tieneOperativosActivos(Evento evento) {
        return evento != null && eventoOperativoRepository.countByEventoAndActivo(evento, (byte) 1) > 0;
    }

    @Transactional
    public void sincronizarOperativos(Evento evento, List<Integer> operativosIds, Usuario asignadoPor, HttpServletRequest request) {
        Set<Integer> idsSolicitados = new LinkedHashSet<>(
                operativosIds == null ? List.of() : operativosIds.stream().filter(Objects::nonNull).toList()
        );
        List<EventoOperativo> asignacionesActuales = eventoOperativoRepository.findByEvento(evento);
        validarOperativosAsignables(idsSolicitados);

        for (Integer usuarioId : idsSolicitados) {
            Usuario operativo = obtenerOperativoAsignable(usuarioId);
            EventoOperativo existente = asignacionesActuales.stream()
                    .filter(asignacion -> asignacion.getUsuario() != null && usuarioId.equals(asignacion.getUsuario().getId()))
                    .findFirst()
                    .orElse(null);

            if (existente == null) {
                crearAsignacion(evento, operativo, asignadoPor, request);
            } else if (existente.getActivo() == null || existente.getActivo() == 0) {
                existente.setActivo((byte) 1);
                existente.setFechaAsignacion(ahoraLima());
                existente.setAsignadoPor(asignadoPor);
                eventoOperativoRepository.save(existente);
                registrarBitacora("ASIGNAR_OPERATIVO_EVENTO", evento, operativo, asignadoPor, request);
            }
        }

        for (EventoOperativo asignacion : asignacionesActuales) {
            Integer usuarioId = asignacion.getUsuario() != null ? asignacion.getUsuario().getId() : null;
            boolean sigueAsignado = usuarioId != null && idsSolicitados.contains(usuarioId);

            if (!sigueAsignado && asignacion.getActivo() != null && asignacion.getActivo() == 1) {
                asignacion.setActivo((byte) 0);
                eventoOperativoRepository.save(asignacion);
                registrarBitacora("DESACTIVAR_OPERATIVO_EVENTO", evento, asignacion.getUsuario(), asignadoPor, request);
            }
        }
    }

    public void validarOperativoAsignado(Integer eventoId) {
        Usuario usuario = usuarioAutenticadoService.obtenerUsuarioAutenticado();
        validarRolOperativo(usuario);
        Evento evento = eventoRepository.findById(eventoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento no encontrado"));

        if (evento.getRequiereControlAsistencia() == null || evento.getRequiereControlAsistencia() == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este evento no requiere control de asistencia");
        }

        if (!eventoOperativoRepository.existsByEventoIdAndUsuarioIdAndActivo(eventoId, usuario.getId(), (byte) 1)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El operativo no esta asignado a este evento");
        }
    }

    public List<EventoOperativoHoyDto> listarEventosHoyParaOperativo() {
        Usuario usuario = usuarioAutenticadoService.obtenerUsuarioAutenticado();
        validarRolOperativo(usuario);

        LocalDateTime inicioDia = LocalDateTime.now(ZONA_LIMA).toLocalDate().atStartOfDay();
        Instant inicio = inicioDia.atZone(ZONA_LIMA).toInstant();
        Instant fin = inicioDia.plusDays(1).atZone(ZONA_LIMA).toInstant();

        Instant ahora = ahoraLima();
        Instant limitePostFin = ahora.minusSeconds(1800);

        return eventoOperativoRepository.findEventosAsignadosDelDia(
                        usuario,
                        inicio,
                        fin,
                        ahora,
                        limitePostFin,
                        List.of("PUBLICADO", "EN_CURSO", "FINALIZADO")
                ).stream()
                .map(this::toEventoOperativoHoyDto)
                .toList();
    }

    @Transactional
    public OperativoQrValidationResponseDto validarQrEvento(Integer eventoId, String contenidoQr) {
        Usuario usuario = usuarioAutenticadoService.obtenerUsuarioAutenticado();
        Evento evento = obtenerEventoOperativoAsignado(eventoId, usuario);
        String token;

        try {
            token = codigoQrTokenService.extraerTokenDesdeContenidoQr(contenidoQr);
        } catch (IllegalArgumentException exception) {
            return respuestaQr("NOT_FOUND", "QR no reconocido", "El codigo QR no pertenece a una inscripcion valida.", "error", null, null, null);
        }


        CodigoQr codigoQr = codigoQrRepository.findDetalleByToken(token)
                .orElse(null);

        if (codigoQr == null || codigoQr.getInscripcion() == null) {
            return respuestaQr("NOT_FOUND", "QR no encontrado", "No se encontro una inscripcion asociada al codigo QR.", "error", null, null, null);
        }

        Inscripcion inscripcion = codigoQr.getInscripcion();
        if (inscripcion.getEvento() == null || !eventoId.equals(inscripcion.getEvento().getId())) {
            return respuestaQr("OTHER_EVENT", "Evento no autorizado", "El codigo QR pertenece a otro evento.", "info", null, inscripcion.getCodigoInscripcion(), null);
        }

        if (codigoQr.getEstadoQr() != EstadoQr.ACTIVO) {
            return respuestaQr("DUPLICATE", "QR no activo", "Este codigo QR ya no se encuentra activo para validar ingreso.", "warning", nombreVecino(inscripcion), inscripcion.getCodigoInscripcion(), null);
        }

        Instant ahora = ahoraLima();
        if (codigoQr.getFechaExpiracion() != null
                && codigoQr.getFechaExpiracion().isBefore(ahora)
                && !ventanaOperativaActiva(evento, ahora)) {
            return respuestaQr("CLOSED", "QR expirado", "El codigo QR expiro porque el evento ya finalizo.", "error", nombreVecino(inscripcion), inscripcion.getCodigoInscripcion(), null);
        }

        if (inscripcion.getEstadoInscripcion() != null && inscripcion.getEstadoInscripcion() != EstadoInscripcion.CONFIRMADA) {
            return respuestaQr("NOT_FOUND", "Inscripcion no confirmada", "La inscripcion asociada al QR no esta confirmada.", "error", nombreVecino(inscripcion), inscripcion.getCodigoInscripcion(), null);
        }

        Optional<Asistencia> asistenciaExistente = asistenciaRepository.findByInscripcionId(inscripcion.getId());
        if (asistenciaExistente.isPresent() && !"ANULADA".equalsIgnoreCase(asistenciaExistente.get().getEstado())) {
            return respuestaQr("DUPLICATE", "Asistencia duplicada", "Esta asistencia ya fue validada anteriormente.", "warning", nombreVecino(inscripcion), inscripcion.getCodigoInscripcion(), toValidacionRecienteDto(asistenciaExistente.get()));
        }

        if (evento.getAforoMaximo() != null && evento.getAforoMaximo() > 0 && contarAsistenciasValidas(eventoId) >= evento.getAforoMaximo()) {
            return respuestaQr("FULL", "Sin cupos", "El evento no tiene cupos disponibles.", "warning", nombreVecino(inscripcion), inscripcion.getCodigoInscripcion(), null);
        }

        Asistencia asistencia = asistenciaExistente.orElseGet(Asistencia::new);
        asistencia.setInscripcion(inscripcion);
        asistencia.setEstado("VALIDADA");
        asistencia.setMetodoValidacion("QR");
        asistencia.setFechaHoraValidacion(ahora.toString());
        asistencia.setValidadoPorUsuario(usuario);
        asistencia.setMotivo(null);
        Asistencia guardada = asistenciaRepository.save(asistencia);

        codigoQr.setUsadoEn(ahora);
        codigoQrRepository.save(codigoQr);

        return respuestaQr("SUCCESS", "Validacion exitosa", "Asistencia validada correctamente.", "success", nombreVecino(inscripcion), inscripcion.getCodigoInscripcion(), toValidacionRecienteDto(guardada));
    }


    @Transactional
    public OperativoQrValidationResponseDto anularAsistencia(
            Integer eventoId,
            Integer asistenciaId,
            OperativoAnnulValidationRequestDto request
    ) {
        Usuario usuario = usuarioAutenticadoService.obtenerUsuarioAutenticado();
        obtenerEventoOperativoAsignado(eventoId, usuario);

        if (request == null || !StringUtils.hasText(request.reason())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecciona el motivo de anulacion");
        }

        String motivo = normalizarTexto(request.reason());
        if ("Otro".equalsIgnoreCase(motivo)) {
            String detalle = normalizarTexto(request.detail());
            if (!StringUtils.hasText(detalle)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Especifica el motivo de anulacion");
            }
            motivo = detalle;
        }

        Asistencia asistencia = asistenciaRepository.findOperativaByEventoIdAndId(eventoId, asistenciaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Asistencia no encontrada para este evento"));

        if ("ANULADA".equalsIgnoreCase(asistencia.getEstado())) {
            return respuestaQr(
                    "DUPLICATE",
                    "Asistencia ya anulada",
                    "Esta asistencia ya fue anulada anteriormente.",
                    "warning",
                    nombreVecino(asistencia.getInscripcion()),
                    asistencia.getInscripcion() != null ? asistencia.getInscripcion().getCodigoInscripcion() : null,
                    toValidacionRecienteDto(asistencia)
            );
        }

        Instant ahora = ahoraLima();
        asistencia.setEstado("ANULADA");
        asistencia.setMotivo(motivo);
        asistencia.setFechaHoraValidacion(ahora.toString());
        asistencia.setValidadoPorUsuario(usuario);
        Asistencia guardada = asistenciaRepository.save(asistencia);
        cancelarInscripcionManualOperativaSiCorresponde(guardada.getInscripcion(), motivo, ahora);

        return respuestaQr(
                "SUCCESS",
                "Asistencia anulada",
                "La asistencia fue anulada correctamente.",
                "success",
                nombreVecino(guardada.getInscripcion()),
                guardada.getInscripcion() != null ? guardada.getInscripcion().getCodigoInscripcion() : null,
                toValidacionRecienteDto(guardada)
        );
    }

    private void cancelarInscripcionManualOperativaSiCorresponde(Inscripcion inscripcion, String motivo, Instant fechaCancelacion) {
        if (inscripcion == null || !"MANUAL_OPERATIVO".equalsIgnoreCase(inscripcion.getOrigenInscripcion())) {
            return;
        }

        inscripcion.setEstadoInscripcion(EstadoInscripcion.CANCELADA);
        inscripcion.setMotivoCancelacion("ASISTENCIA_ANULADA");
        inscripcion.setObservacionCancelacion(motivo);
        inscripcion.setFechaCancelacion(fechaCancelacion);
        inscripcionRepository.save(inscripcion);
    }

    @Transactional
    public OperativoQrValidationResponseDto validarAsistenciaManual(
            Integer eventoId,
            OperativoManualValidationRequestDto request
    ) {
        Usuario usuario = usuarioAutenticadoService.obtenerUsuarioAutenticado();
        obtenerEventoOperativoAsignado(eventoId, usuario);

        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ingresa DNI o codigo de inscripcion");
        }

        String identificador = normalizarTexto(request.identifier());
        String motivo = normalizarTexto(request.reason());

        if (!StringUtils.hasText(identificador)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ingresa DNI o codigo de inscripcion");
        }

        if (!StringUtils.hasText(motivo)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecciona el motivo de validacion manual");
        }

        String dniBusqueda = normalizarDni(identificador);
        if (!dniBusqueda.matches("^\\d{8}$")) {
            dniBusqueda = null;
        }

        Inscripcion inscripcion = inscripcionRepository.findOperativaByEventoAndIdentificador(
                        eventoId,
                        identificador,
                        dniBusqueda
                )
                .orElse(null);

        if (inscripcion == null) {
            return respuestaQr("NOT_FOUND", "Inscripcion no encontrada", "No se encontro una inscripcion asociada al DNI o codigo ingresado.", "error", null, identificador, null);
        }

        if (inscripcion.getEstadoInscripcion() != null && inscripcion.getEstadoInscripcion() != EstadoInscripcion.CONFIRMADA) {
            return respuestaQr("NOT_FOUND", "Inscripcion no confirmada", "La inscripcion encontrada no esta confirmada para validar asistencia.", "error", nombreVecino(inscripcion), inscripcion.getCodigoInscripcion(), null);
        }

        return registrarAsistenciaManual(eventoId, inscripcion, usuario, motivo);
    }

    @Transactional
    public OperativoQrValidationResponseDto registrarInscripcionManualYAsistencia(
            Integer eventoId,
            OperativoManualRegistrationRequestDto request,
            HttpServletRequest httpRequest
    ) {
        Usuario usuario = usuarioAutenticadoService.obtenerUsuarioAutenticado();
        obtenerEventoOperativoAsignado(eventoId, usuario);
        Evento evento = eventoRepository.findByIdForUpdate(eventoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento no encontrado"));
        validarEventoPermiteInscripcionManual(evento);

        String dni = normalizarDni(request.dni());
        String nombres = normalizarTexto(request.names());
        String apellidos = normalizarTexto(request.lastNames());
        String celular = normalizarTexto(request.phone());
        String email = normalizarTexto(request.email());

        if (!StringUtils.hasText(dni) || !dni.matches("^\\d{8}$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ingresa un DNI valido de 8 digitos");
        }

        Optional<Vecino> vecinoPorDni = vecinoRepository.findByDni(dni);
        boolean vecinoRegistradoEnPlataforma = vecinoPorDni
                .map(Vecino::getKeycloakId)
                .filter(StringUtils::hasText)
                .isPresent();

        if (!vecinoRegistradoEnPlataforma
                && (!StringUtils.hasText(nombres) || !StringUtils.hasText(apellidos)
                || !Boolean.TRUE.equals(request.aceptaTratamientoDatos()))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Completa los datos del ciudadano y confirma el tratamiento de datos");
        }

        Vecino vecino = vecinoPorDni
                .map(vecinoExistente -> completarDatosVecinoManual(vecinoExistente, nombres, apellidos, celular, email))
                .orElseGet(() -> crearVecinoManual(dni, nombres, apellidos, celular, email));


        Inscripcion inscripcion = inscripcionRepository.findByEventoIdAndVecinoId(eventoId, vecino.getId())
                .map(existente -> prepararInscripcionManualExistente(existente, evento, vecino))
                .orElseGet(() -> crearInscripcionManual(evento, vecino));


        OperativoQrValidationResponseDto response = registrarAsistenciaManual(eventoId, inscripcion, usuario, "Inscripcion manual en puerta");
        if ("SUCCESS".equals(response.status())) {
            registrarBitacoraInscripcionManual(inscripcion, usuario, httpRequest);
            vecinoNotificacionService.enviarConstanciaInscripcionManualValidada(inscripcion);
        }

        return response;
    }

    private OperativoQrValidationResponseDto registrarAsistenciaManual(
            Integer eventoId,
            Inscripcion inscripcion,
            Usuario usuario,
            String motivo
    ) {
        Optional<Asistencia> asistenciaExistente = asistenciaRepository.findByInscripcionId(inscripcion.getId());
        if (asistenciaExistente.isPresent() && !"ANULADA".equalsIgnoreCase(asistenciaExistente.get().getEstado())) {
            return respuestaQr("DUPLICATE", "Asistencia duplicada", "Esta asistencia ya fue validada anteriormente.", "warning", nombreVecino(inscripcion), inscripcion.getCodigoInscripcion(), toValidacionRecienteDto(asistenciaExistente.get()));
        }

        Evento evento = inscripcion.getEvento();
        if (evento != null && evento.getAforoMaximo() != null && evento.getAforoMaximo() > 0
                && contarAsistenciasValidas(eventoId) >= evento.getAforoMaximo()) {
            return respuestaQr("FULL", "Sin cupos", "El evento no tiene cupos disponibles.", "warning", nombreVecino(inscripcion), inscripcion.getCodigoInscripcion(), null);
        }

        Asistencia asistencia = asistenciaExistente.orElseGet(Asistencia::new);
        asistencia.setInscripcion(inscripcion);
        asistencia.setEstado("VALIDADA");
        asistencia.setMetodoValidacion("MANUAL");
        asistencia.setFechaHoraValidacion(ahoraLima().toString());
        asistencia.setValidadoPorUsuario(usuario);
        asistencia.setMotivo(motivo);
        Asistencia guardada = asistenciaRepository.save(asistencia);

        return respuestaQr("SUCCESS", "Validacion exitosa", "Asistencia validada correctamente.", "success", nombreVecino(inscripcion), inscripcion.getCodigoInscripcion(), toValidacionRecienteDto(guardada));
    }

    private Vecino crearVecinoManual(String dni, String nombres, String apellidos, String celular, String email) {
        Vecino vecino = new Vecino();
        vecino.setKeycloakId(null);
        vecino.setDni(dni);
        vecino.setNombre(nombreCompleto(nombres, apellidos));
        vecino.setCelular(celular);
        vecino.setEmail(email);
        vecino.setFechaCreado(ahoraLima());
        vecino.setAceptaTratamientoDatos((byte) 1);
        vecino.setFechaAceptacionDatos(ahoraLima());
        vecino.setEstadoVecino(obtenerEstadoVecinoActivo());
        return vecinoRepository.save(vecino);
    }

    private Vecino completarDatosVecinoManual(Vecino vecino, String nombres, String apellidos, String celular, String email) {
        boolean tieneCuentaPlataforma = StringUtils.hasText(vecino.getKeycloakId());

        if (!tieneCuentaPlataforma) {
            if (!StringUtils.hasText(vecino.getNombre())) {
                vecino.setNombre(nombreCompleto(nombres, apellidos));
            }
            if (!StringUtils.hasText(vecino.getCelular()) && StringUtils.hasText(celular)) {
                vecino.setCelular(celular);
            }
            if (!StringUtils.hasText(vecino.getEmail()) && StringUtils.hasText(email)) {
                vecino.setEmail(email);
            }
        }

        if (vecino.getAceptaTratamientoDatos() == null || vecino.getAceptaTratamientoDatos() == 0) {
            vecino.setAceptaTratamientoDatos((byte) 1);
            vecino.setFechaAceptacionDatos(ahoraLima());
        }
        if (vecino.getEstadoVecino() == null) {
            vecino.setEstadoVecino(obtenerEstadoVecinoActivo());
        }
        return vecinoRepository.save(vecino);
    }

    private Inscripcion crearInscripcionManual(Evento evento, Vecino vecino) {
        validarCuposInscripcionManual(evento);
        Instant ahora = ahoraLima();
        Inscripcion inscripcion = new Inscripcion();
        inscripcion.setEvento(evento);
        inscripcion.setVecino(vecino);
        inscripcion.setFechaInscripcion(ahora);
        inscripcion.setOrigenInscripcion("MANUAL_OPERATIVO");
        inscripcion.setCodigoInscripcion(generarCodigoInscripcionManual(evento, vecino, ahora));
        inscripcion.setEstadoInscripcion(EstadoInscripcion.CONFIRMADA);
        return inscripcionRepository.save(inscripcion);
    }

    private Inscripcion prepararInscripcionManualExistente(Inscripcion inscripcion, Evento evento, Vecino vecino) {
        EstadoInscripcion estado = inscripcion.getEstadoInscripcion();

        if (estado == null || estado == EstadoInscripcion.CONFIRMADA) {
            return inscripcion;
        }

        if (estado != EstadoInscripcion.CANCELADA) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "La inscripcion existente no esta confirmada para validar asistencia"
            );
        }

        validarCuposInscripcionManual(evento);
        Instant ahora = ahoraLima();
        inscripcion.setFechaInscripcion(ahora);
        inscripcion.setOrigenInscripcion("MANUAL_OPERATIVO");
        inscripcion.setCodigoInscripcion(generarCodigoInscripcionManual(evento, vecino, ahora));
        inscripcion.setMotivoCancelacion(null);
        inscripcion.setObservacionCancelacion(null);
        inscripcion.setFechaCancelacion(null);
        inscripcion.setEstadoInscripcion(EstadoInscripcion.CONFIRMADA);
        return inscripcionRepository.save(inscripcion);
    }

    private void validarEventoPermiteInscripcionManual(Evento evento) {
        if (evento.getRequiereInscripcion() == null || evento.getRequiereInscripcion() == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este evento no requiere inscripcion previa");
        }
    }

    private void validarCuposInscripcionManual(Evento evento) {
        Integer aforoMaximo = evento.getAforoMaximo();
        if (aforoMaximo != null && aforoMaximo > 0
                && inscripcionRepository.countActivasByEventoId(evento.getId()) >= aforoMaximo) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El evento ya no tiene cupos disponibles");
        }
    }

    private void registrarBitacoraInscripcionManual(Inscripcion inscripcion, Usuario operativo, HttpServletRequest request) {
        bitacoraAccionService.guardarAccion(
                "REGISTRAR_INSCRIPCION_MANUAL",
                "INSCRIPCION",
                inscripcion.getId(),
                "Registro manual operativo para DNI "
                        + (inscripcion.getVecino() != null ? inscripcion.getVecino().getDni() : "")
                        + " en evento \""
                        + (inscripcion.getEvento() != null ? inscripcion.getEvento().getTitulo() : "")
                        + "\" con origen MANUAL_OPERATIVO",
                operativo,
                request
        );
    }

    private EstadoVecino obtenerEstadoVecinoActivo() {
        return estadoVecinoRepository.findByNombre("ACTIVO")
                .or(() -> estadoVecinoRepository.findByNombre("HABILITADO"))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No existe un estado activo para vecinos"));
    }
    private String generarCodigoInscripcionManual(Evento evento, Vecino vecino, Instant fecha) {
        String dni = StringUtils.hasText(vecino.getDni()) ? vecino.getDni() : "0000";
        String sufijoDni = dni.length() <= 4 ? dni : dni.substring(dni.length() - 4);
        return "MO-" + evento.getId() + "-" + sufijoDni + "-" + Math.abs(fecha.toEpochMilli() % 100000);
    }

    private record PartesNombre(String nombres, String apellidos) {
    }

    private PartesNombre separarNombreCompleto(String nombreCompleto) {
        String[] partes = normalizarTexto(nombreCompleto).split("\\s+");
        if (partes.length == 0 || !StringUtils.hasText(partes[0])) {
            return new PartesNombre("", "");
        }
        if (partes.length <= 2) {
            return new PartesNombre(partes[0], partes.length == 2 ? partes[1] : "");
        }

        String apellidos = partes[partes.length - 2] + " " + partes[partes.length - 1];
        String nombres = String.join(" ", java.util.Arrays.copyOf(partes, partes.length - 2));
        return new PartesNombre(nombres, apellidos);
    }
    private String nombreCompleto(String nombres, String apellidos) {
        return (nombres + " " + apellidos).trim().replaceAll("\\s+", " ");
    }

    private String normalizarDni(String dni) {
        return normalizarTexto(dni).replaceAll("\\D", "");
    }

    private String normalizarTexto(String valor) {
        return valor == null ? "" : valor.trim();
    }
    private Evento obtenerEventoOperativoAsignado(Integer eventoId, Usuario usuario) {
        validarRolOperativo(usuario);
        Evento evento = eventoRepository.findById(eventoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento no encontrado"));

        if (evento.getRequiereControlAsistencia() == null || evento.getRequiereControlAsistencia() == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este evento no requiere control de asistencia");
        }

        if (!eventoOperativoRepository.existsByEventoIdAndUsuarioIdAndActivo(eventoId, usuario.getId(), (byte) 1)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El operativo no esta asignado a este evento");
        }

        validarVentanaOperativa(evento);

        return evento;
    }

    private void validarVentanaOperativa(Evento evento) {
        if (!ventanaOperativaActiva(evento, ahoraLima())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "La ventana operativa solo esta activa desde 1 hora antes del inicio hasta 30 minutos despues del fin del evento"
            );
        }
    }

    private boolean ventanaOperativaActiva(Evento evento, Instant ahora) {
        if (evento == null || evento.getFechaHoraInicio() == null || evento.getFechaHoraFin() == null) {
            return false;
        }

        return !ahora.isBefore(evento.getFechaHoraInicio().minusSeconds(3600))
                && !ahora.isAfter(evento.getFechaHoraFin().plusSeconds(1800));
    }
    private long contarAsistenciasValidas(Integer eventoId) {
        List<Integer> inscripcionIds = inscripcionRepository.findByEventoId(eventoId).stream()
                .map(Inscripcion::getId)
                .toList();

        if (inscripcionIds.isEmpty()) {
            return 0;
        }

        return asistenciaRepository.findByInscripcionIdIn(inscripcionIds).stream()
                .filter(asistencia -> !"ANULADA".equalsIgnoreCase(asistencia.getEstado()))
                .count();
    }

    private String nombreVecino(Inscripcion inscripcion) {
        return inscripcion != null && inscripcion.getVecino() != null
                ? inscripcion.getVecino().getNombre()
                : null;
    }

    private OperativoQrValidationResponseDto respuestaQr(
            String status,
            String title,
            String message,
            String tone,
            String citizenName,
            String code,
            EventoOperativoHoyDto.ValidacionRecienteDto validation
    ) {
        return new OperativoQrValidationResponseDto(status, title, message, tone, citizenName, code, validation);
    }
    private void crearAsignacion(Evento evento, Usuario operativo, Usuario asignadoPor, HttpServletRequest request) {
        EventoOperativo asignacion = new EventoOperativo();
        asignacion.setEvento(evento);
        asignacion.setUsuario(operativo);
        asignacion.setFechaAsignacion(ahoraLima());
        asignacion.setAsignadoPor(asignadoPor);
        asignacion.setActivo((byte) 1);
        eventoOperativoRepository.save(asignacion);
        registrarBitacora("ASIGNAR_OPERATIVO_EVENTO", evento, operativo, asignadoPor, request);
    }

    private Usuario obtenerOperativoAsignable(Integer usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "El usuario operativo seleccionado no existe"));

        validarOperativoAsignable(usuario);
        return usuario;
    }

    private void validarOperativosAsignables(Set<Integer> usuarioIds) {
        for (Integer usuarioId : usuarioIds) {
            obtenerOperativoAsignable(usuarioId);
        }
    }

    private void validarOperativoAsignable(Usuario usuario) {
        if (usuario.getActivo() == null || usuario.getActivo() == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se puede asignar un usuario inactivo");
        }

        if (!esRolOperativo(usuario)) {
            String nombre = StringUtils.hasText(usuario.getNombre()) ? usuario.getNombre() : usuario.getEmail();
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El usuario " + nombre + " ya no tiene rol OPERATIVO. Retíralo del evento antes de guardar."
            );
        }
    }

    private void validarRolOperativo(Usuario usuario) {
        if (usuario == null || usuario.getRol() == null || !esRolOperativo(usuario)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo usuarios con rol OPERATIVO pueden realizar esta accion");
        }
    }

    private boolean esRolOperativo(Usuario usuario) {
        if (usuario == null || usuario.getRol() == null) {
            return false;
        }

        String codigo = usuario.getRol().getCodigo();
        String nombre = usuario.getRol().getNombre();
        return "OPERATIVO".equalsIgnoreCase(codigo) || "OPERATIVO".equalsIgnoreCase(nombre);
    }

    private UsuarioOperativoDto toUsuarioOperativoDto(Usuario usuario) {
        return new UsuarioOperativoDto(
                usuario.getId(),
                usuario.getNombre(),
                "",
                usuario.getDni(),
                usuario.getEmail(),
                usuario.getRol() != null
                        ? (usuario.getRol().getCodigo() != null && !usuario.getRol().getCodigo().isBlank()
                            ? usuario.getRol().getCodigo()
                            : usuario.getRol().getNombre())
                        : "",
                esRolOperativo(usuario) && usuario.getActivo() != null && usuario.getActivo() == 1
        );
    }

    private EventoOperativoHoyDto toEventoOperativoHoyDto(Evento evento) {
        List<Integer> inscripcionIds = inscripcionRepository.findByEventoId(evento.getId()).stream()
                .map(inscripcion -> inscripcion.getId())
                .toList();
        List<Asistencia> asistencias = inscripcionIds.isEmpty()
                ? List.of()
                : asistenciaRepository.findByInscripcionIdIn(inscripcionIds);
        List<Asistencia> asistenciasNoAnuladas = asistencias.stream()
                .filter(asistencia -> !"ANULADA".equalsIgnoreCase(asistencia.getEstado()))
                .toList();
        long totalValidadas = asistenciasNoAnuladas.size();
        long qrValidadas = asistenciasNoAnuladas.stream()
                .filter(asistencia -> "QR".equalsIgnoreCase(asistencia.getMetodoValidacion()))
                .count();
        long manualValidadas = totalValidadas - qrValidadas;
        LocalDateTime inicio = toLocalDateTime(evento.getFechaHoraInicio());
        LocalDateTime fin = toLocalDateTime(evento.getFechaHoraFin());
        int registradas = Math.toIntExact(inscripcionRepository.countActivasByEventoId(evento.getId()));
        List<EventoOperativoHoyDto.ValidacionRecienteDto> trazabilidad = asistenciaRepository
                .findTrazabilidadByEventoId(evento.getId())
                .stream()
                .sorted(Comparator.comparing(Asistencia::getId, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(12)
                .map(this::toValidacionRecienteDto)
                .toList();

        return new EventoOperativoHoyDto(
                evento.getId(),
                evento.getTitulo(),
                evento.getDescripcionBreve(),
                evento.getDescripcion(),
                inicio,
                fin,
                inicio != null ? FECHA_FORMATTER.format(inicio) : "",
                inicio != null && fin != null ? HORA_FORMATTER.format(inicio) + " - " + HORA_FORMATTER.format(fin) : "",
                evento.getUbicacion() != null ? evento.getUbicacion().getNombre() : "Ubicacion pendiente",
                evento.getEstadoEvento() != null ? evento.getEstadoEvento().getCodigo() : "",
                ventanaOperativaActiva(evento, ahoraLima()),
                evento.getAforoMaximo(),
                registradas,
                (int) totalValidadas,
                (int) qrValidadas,
                (int) manualValidadas,
                trazabilidad
        );
    }

    private EventoOperativoHoyDto.ValidacionRecienteDto toValidacionRecienteDto(Asistencia asistencia) {
        String estado = asistencia.getEstado() != null ? asistencia.getEstado() : "VALIDADA";
        String metodo = asistencia.getMetodoValidacion() != null ? asistencia.getMetodoValidacion() : "MANUAL";
        String origen = asistencia.getInscripcion() != null && asistencia.getInscripcion().getOrigenInscripcion() != null
                ? asistencia.getInscripcion().getOrigenInscripcion()
                : "ONLINE";
        String participante = asistencia.getInscripcion() != null && asistencia.getInscripcion().getVecino() != null
                ? asistencia.getInscripcion().getVecino().getNombre()
                : "Participante";
        String codigo = asistencia.getInscripcion() != null && asistencia.getInscripcion().getCodigoInscripcion() != null
                ? asistencia.getInscripcion().getCodigoInscripcion()
                : "SIN-CODIGO";
        String anuladaEn = "ANULADA".equalsIgnoreCase(estado) ? formatearHoraAsistencia(asistencia.getFechaHoraValidacion()) : null;

        return new EventoOperativoHoyDto.ValidacionRecienteDto(
                asistencia.getId(),
                codigo,
                metodo.toUpperCase(Locale.ROOT),
                origen.toUpperCase(Locale.ROOT),
                participante,
                estado.toUpperCase(Locale.ROOT),
                formatearHoraAsistencia(asistencia.getFechaHoraValidacion()),
                asistencia.getMotivo(),
                anuladaEn
        );
    }

    private String formatearHoraAsistencia(String fechaHoraValidacion) {
        if (fechaHoraValidacion == null || fechaHoraValidacion.isBlank()) {
            return "Por confirmar";
        }

        try {
            Instant instant = Instant.parse(fechaHoraValidacion);
            return HORA_FORMATTER.format(toLocalDateTime(instant));
        } catch (RuntimeException ignored) {
            return fechaHoraValidacion;
        }
    }
    private LocalDateTime toLocalDateTime(Instant instant) {
        return instant == null ? null : LocalDateTime.ofInstant(instant, ZONA_LIMA);
    }

    private void registrarBitacora(
            String accion,
            Evento evento,
            Usuario operativo,
            Usuario asignadoPor,
            HttpServletRequest request
    ) {
        bitacoraAccionService.guardarAccion(
                accion,
                "EVENTO",
                evento.getId(),
                ("ASIGNAR_OPERATIVO_EVENTO".equals(accion) ? "Asigno personal operativo:" : "Removio personal operativo:")
                        + " " + (operativo != null ? operativo.getNombre() : "")
                        + " al evento \"" + (evento.getTitulo() != null ? evento.getTitulo() : "Sin titulo") + "\"",
                asignadoPor,
                request
        );
    }
}

