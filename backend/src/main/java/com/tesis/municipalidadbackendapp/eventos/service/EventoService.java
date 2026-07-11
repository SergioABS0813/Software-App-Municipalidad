package com.tesis.municipalidadbackendapp.eventos.service;

import static com.tesis.municipalidadbackendapp.common.FechaHoraUtils.ahoraLima;

import com.tesis.municipalidadbackendapp.asistencias.entity.Asistencia;
import com.tesis.municipalidadbackendapp.asistencias.repository.AsistenciaRepository;
import com.tesis.municipalidadbackendapp.common.UsuarioAutenticadoService;
import com.tesis.municipalidadbackendapp.bitacora.dto.BitacoraEventoDto;
import com.tesis.municipalidadbackendapp.bitacora.entity.BitacoraAccion;
import com.tesis.municipalidadbackendapp.bitacora.service.BitacoraAccionService;
import com.tesis.municipalidadbackendapp.eventos.dto.CancelarEventoRequestDto;
import com.tesis.municipalidadbackendapp.eventos.dto.EventoPanelAdministrativoDto;
import com.tesis.municipalidadbackendapp.eventos.dto.EventoPortalPublicoDto;
import com.tesis.municipalidadbackendapp.eventos.dto.EventoRegistroRequest;
import com.tesis.municipalidadbackendapp.eventos.dto.ConteosRevisionDirectivaDto;
import com.tesis.municipalidadbackendapp.eventos.dto.EventoReporteDirectivoDto;
import com.tesis.municipalidadbackendapp.eventos.dto.EventoRevisionDirectivaDetalleDto;
import com.tesis.municipalidadbackendapp.eventos.dto.EventoRevisionDirectivaResumenDto;
import com.tesis.municipalidadbackendapp.eventos.dto.ResumenCardsDirectivoDto;
import com.tesis.municipalidadbackendapp.eventos.entity.AgendaEvento;
import com.tesis.municipalidadbackendapp.eventos.entity.Categoria;
import com.tesis.municipalidadbackendapp.eventos.entity.EstadoEvento;
import com.tesis.municipalidadbackendapp.eventos.entity.Evento;
import com.tesis.municipalidadbackendapp.eventos.entity.ObservacionEvento;
import com.tesis.municipalidadbackendapp.eventos.entity.RequisitoEvento;
import com.tesis.municipalidadbackendapp.eventos.entity.RecursoEvento;
import com.tesis.municipalidadbackendapp.eventos.repository.*;
import com.tesis.municipalidadbackendapp.inscripciones.entity.Inscripcion;
import com.tesis.municipalidadbackendapp.inscripciones.enums.EstadoInscripcion;
import com.tesis.municipalidadbackendapp.inscripciones.repository.InscripcionRepository;
import com.tesis.municipalidadbackendapp.notificaciones.service.NotificacionService;
import com.tesis.municipalidadbackendapp.qr.repository.CodigoQrRepository;
import com.tesis.municipalidadbackendapp.organizacion.entity.AreaMunicipal;
import com.tesis.municipalidadbackendapp.organizacion.repository.AreaMunicipalRepository;
import com.tesis.municipalidadbackendapp.ubicacion.entity.Ubicacion;
import com.tesis.municipalidadbackendapp.ubicacion.repository.UbicacionRepository;
import com.tesis.municipalidadbackendapp.usuariosinternos.entity.Usuario;
import com.tesis.municipalidadbackendapp.valoraciones.entity.ValoracionEvento;
import com.tesis.municipalidadbackendapp.valoraciones.repository.ValoracionEventoRepository;
import com.tesis.municipalidadbackendapp.valoraciones.service.ValoracionEventoService;
import com.tesis.municipalidadbackendapp.vecinos.service.VecinoNotificacionService;
import com.tesis.municipalidadbackendapp.storage.CloudStorageService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Locale;
import java.util.List;

@Service
@RequiredArgsConstructor //Crea el constructor para los atributos final
public class EventoService {

    private final EventoRepository eventoRepository;
    private final ObservacionEventoRepository observacionEventoRepository;
    private final RequisitoEventoRepository requisitoEventoRepository;
    private final AgendaEventoRepository agendaEventoRepository;
    private final RecursoEventoRepository recursoEventoRepository;
    private final CategoriaRepository categoriaRepository;
    private final EstadoEventoRepository estadoEventoRepository;
    private final AreaMunicipalRepository areaMunicipalRepository;
    private final UbicacionRepository ubicacionRepository;
    private final UsuarioAutenticadoService usuarioAutenticadoService;
    private final BitacoraAccionService bitacoraAccionService;
    private final NotificacionService notificacionService;
    private final CodigoQrRepository codigoQrRepository;
    private final ValoracionEventoService valoracionEventoService;
    private final InscripcionRepository inscripcionRepository;
    private final AsistenciaRepository asistenciaRepository;
    private final ValoracionEventoRepository valoracionEventoRepository;
    private final EventoOperativoService eventoOperativoService;
    private final CloudStorageService cloudStorageService;
    private final VecinoNotificacionService vecinoNotificacionService;
    private static final ZoneId ZONA_LIMA = ZoneId.of("America/Lima");

    public Page<EventoPanelAdministrativoDto> obtenerEventosPanelAdministrativo(
            String texto,
            String estadoCodigo,
            Integer categoriaId,
            boolean sinCategoria,
            String ordenFechaInicio,
            int page,
            int size
    ) {
        int pageSize = Math.max(1, Math.min(size, 50));
        Sort sort = switch (ordenFechaInicio == null ? "" : ordenFechaInicio.toUpperCase()) {
            case "ASC" -> Sort.by(Sort.Direction.ASC, "fechaHoraInicio").and(Sort.by(Sort.Direction.ASC, "id"));
            case "DESC" -> Sort.by(Sort.Direction.DESC, "fechaHoraInicio").and(Sort.by(Sort.Direction.DESC, "id"));
            default -> Sort.by(Sort.Direction.DESC, "eventoActualizadoEn").and(Sort.by(Sort.Direction.DESC, "id"));
        };
        PageRequest pageable = PageRequest.of(Math.max(page, 0), pageSize, sort);

        return eventoRepository.findAllPanelAdministrativo(
                texto,
                estadoCodigo,
                categoriaId,
                sinCategoria,
                pageable
        ).map(this::toPanelAdministrativoDto);
    }

    @Transactional(readOnly = true)
    public Page<EventoPortalPublicoDto> obtenerEventosPortalPublico(String texto, Integer categoriaId, int page, int size) {
        String textoNormalizado = normalizarTexto(texto);
        int pageSize = Math.max(1, Math.min(size, 50));
        PageRequest pageable = PageRequest.of(Math.max(page, 0), pageSize);

        return eventoRepository.findAllPortalPublico(textoNormalizado, categoriaId, pageable)
                .map(this::toPortalPublicoDto);
    }

    @Transactional(readOnly = true)
    public EventoPortalPublicoDto obtenerProximoEventoPortalPublico() {
        Instant ahora = ahoraLima();
        PageRequest primero = PageRequest.of(0, 1);

        Evento eventoDestacado = eventoRepository.findEventosEnCursoPortalPublico(ahora, primero)
                .stream()
                .findFirst()
                .orElseGet(() -> eventoRepository.findNextPortalPublico(ahora, primero)
                        .stream()
                        .findFirst()
                        .orElse(null));

        return eventoDestacado != null ? toPortalPublicoDto(eventoDestacado) : null;
    }
    public Page<EventoRevisionDirectivaResumenDto> obtenerEventosRevisionDirectiva(
            String estado,
            int page
    ) {
        List<String> estados = obtenerEstadosFiltroRevisionDirectiva(estado);
        PageRequest pageable = PageRequest.of(
                Math.max(page, 0),
                5,
                Sort.by(Sort.Direction.ASC, "eventoActualizadoEn")
                        .and(Sort.by(Sort.Direction.ASC, "id"))
        );

        return eventoRepository.findAllRevisionDirectiva(estados, pageable)
                .map(this::toRevisionDirectivaResumenDto);
    }

    @Transactional(readOnly = true)
    public List<EventoReporteDirectivoDto> obtenerReportesDirectivosFinalizados() {
        return eventoRepository.findAllReportesDirectivosFinalizados(List.of("FINALIZADO")).stream()
                .map(this::toReporteDirectivoDto)
                .toList();
    }

    private EventoReporteDirectivoDto toReporteDirectivoDto(Evento evento) {
        List<Inscripcion> inscripciones = inscripcionRepository.findByEventoId(evento.getId());
        List<Integer> inscripcionIds = inscripciones.stream().map(Inscripcion::getId).toList();
        List<Asistencia> asistencias = inscripcionIds.isEmpty()
                ? List.of()
                : asistenciaRepository.findByInscripcionIdIn(inscripcionIds);
        List<Asistencia> asistenciasValidas = asistencias.stream()
                .filter(this::esAsistenciaValidaParaReporte)
                .toList();
        int totalInscritos = inscripciones.size();
        int totalAsistentes = asistenciasValidas.size();
        int totalQr = (int) asistenciasValidas.stream()
                .filter(asistencia -> "QR".equalsIgnoreCase(asistencia.getMetodoValidacion()))
                .count();
        int totalManual = totalAsistentes - totalQr;
        boolean requiereControl = requiereControlAsistencia(evento);
        Integer tasaAsistencia = requiereControl && totalInscritos > 0
                ? Math.round((totalAsistentes * 100f) / totalInscritos)
                : null;
        Integer adopcionQr = requiereControl && totalAsistentes > 0
                ? Math.round((totalQr * 100f) / totalAsistentes)
                : null;
        List<ValoracionEvento> valoracionesRespondidas = valoracionEventoRepository.findByEventoId(evento.getId()).stream()
                .filter(valoracion -> ("RESPONDIDA".equalsIgnoreCase(valoracion.getEstado()) || "RESPONDIDO".equalsIgnoreCase(valoracion.getEstado())))
                .filter(valoracion -> valoracion.getPuntuacion() != null)
                .toList();
        int totalValoraciones = valoracionesRespondidas.size();
        Double promedioSatisfaccion = totalValoraciones > 0
                ? valoracionesRespondidas.stream()
                        .mapToInt(valoracion -> valoracion.getPuntuacion().intValue())
                        .average()
                        .orElse(0)
                : null;

        return new EventoReporteDirectivoDto(
                evento.getId(),
                evento.getTitulo(),
                evento.getCategoria() != null ? evento.getCategoria().getNombre() : null,
                evento.getUbicacion() != null ? evento.getUbicacion().getNombre() : null,
                toLocalDateTime(evento.getFechaHoraInicio()),
                toLocalDateTime(evento.getFechaHoraFin()),
                toLocalDateTime(evento.getEventoActualizadoEn() != null ? evento.getEventoActualizadoEn() : evento.getTiempoActualizado()),
                evento.getEstadoEvento() != null ? evento.getEstadoEvento().getCodigo() : null,
                requiereInscripcion(evento),
                requiereControl,
                evento.getEncuestaSatisfaccionHabilitado() != null && evento.getEncuestaSatisfaccionHabilitado() == 1,
                totalInscritos,
                totalAsistentes,
                tasaAsistencia,
                totalQr,
                totalManual,
                adopcionQr,
                promedioSatisfaccion,
                totalValoraciones,
                evento.getCostoReferencial(),
                requierePago(evento),
                evento.getCostoVecinal(),
                evento.getInstruccionesPago(),
                evento.getAforoMaximo(),
                evento.getMetaTipo(),
                evento.getMetaValor()
        );
    }

    private boolean esAsistenciaValidaParaReporte(Asistencia asistencia) {
        if (asistencia == null || asistencia.getEstado() == null) {
            return false;
        }

        String estado = asistencia.getEstado().trim().toUpperCase(Locale.ROOT);
        return "VALIDADA".equals(estado) || "ASISTIO".equals(estado) || "CONFIRMADA".equals(estado);
    }
    public ConteosRevisionDirectivaDto obtenerConteosRevisionDirectiva() {
        int pendientes = eventoRepository.countByEstadoEventoCodigo("PARA_REVISION");
        int observados = eventoRepository.countByEstadoEventoCodigo("OBSERVADO");
        return new ConteosRevisionDirectivaDto(pendientes + observados, pendientes, observados);
    }

    @Transactional(readOnly = true)
    public List<BitacoraEventoDto> obtenerHistorialEvento(Integer id) {
        eventoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento no encontrado"));
        return bitacoraAccionService.listarHistorialEvento(id);
    }

    public EventoRevisionDirectivaDetalleDto obtenerDetalleRevisionDirectiva(Integer id) {
        Evento evento = eventoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento no encontrado"));
        String estado = evento.getEstadoEvento() != null ? evento.getEstadoEvento().getCodigo() : "";

        if (!List.of("PARA_REVISION", "OBSERVADO").contains(estado)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "El evento no esta disponible en revision directiva");
        }

        return toRevisionDirectivaDetalleDto(evento);
    }

    private List<String> obtenerEstadosFiltroRevisionDirectiva(String estado) {
        String filtro = hasText(estado) ? estado.trim().toUpperCase() : "TODOS";

        return switch (filtro) {
            case "TODOS" -> List.of("PARA_REVISION", "OBSERVADO");
            case "PENDIENTES", "PARA_REVISION" -> List.of("PARA_REVISION");
            case "OBSERVADOS", "OBSERVADO" -> List.of("OBSERVADO");
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Filtro de revision no valido");
        };
    }

    private EventoPanelAdministrativoDto toPanelAdministrativoDto(Evento evento) {
        return new EventoPanelAdministrativoDto(
                evento.getId(),
                evento.getTitulo(),
                evento.getDescripcionBreve(),
                evento.getDescripcion(),
                toLocalDateTime(evento.getFechaHoraInicio()),
                toLocalDateTime(evento.getFechaHoraFin()),
                evento.getUbicacion() != null ? evento.getUbicacion().getId() : null,
                evento.getUbicacion() != null ? evento.getUbicacion().getNombre() : null,
                evento.getEstadoEvento() != null ? evento.getEstadoEvento().getCodigo() : null,
                evento.getAreaMunicipal() != null ? evento.getAreaMunicipal().getId() : null,
                evento.getAreaMunicipal() != null ? evento.getAreaMunicipal().getNombre() : null,
                toCategoriaPanelAdministrativoDto(evento),
                evento.getCostoReferencial(),
                requierePago(evento),
                evento.getCostoVecinal(),
                evento.getInstruccionesPago(),
                evento.getAforoMaximo(),
                calcularCuposDisponibles(evento),
                evento.getEdadMin(),
                evento.getEdadMax(),
                requiereInscripcion(evento),
                requiereControlAsistencia(evento),
                evento.getMetaTipo(),
                evento.getMetaValor(),
                evento.getEncuestaSatisfaccionHabilitado() != null && evento.getEncuestaSatisfaccionHabilitado() == 1,
                toLocalDateTime(evento.getEventoActualizadoEn() != null ? evento.getEventoActualizadoEn() : evento.getTiempoActualizado()),
                evento.getMotivoCancelacion(),
                toLocalDateTime(evento.getFechaCancelacion()),
                evento.getUsuarioCancelacion() != null ? evento.getUsuarioCancelacion().getId() : null,
                calcularCompletitud(evento),
                construirAlertasFichaEventoPanelAdministrativoDto(evento),
                construirCriteriosFicha(evento),
                obtenerAgendaDto(evento),
                obtenerRequisitosDto(evento),
                obtenerRecursosDto(evento),
                eventoOperativoService.listarOperativosAsignados(evento),
                obtenerUltimaObservacionDirectivaDto(evento)
        );
    }

    private EventoPortalPublicoDto toPortalPublicoDto(Evento evento) {
        Ubicacion ubicacion = evento.getUbicacion();

        return new EventoPortalPublicoDto(
                evento.getId(),
                evento.getTitulo(),
                evento.getEstadoEvento() != null ? evento.getEstadoEvento().getCodigo() : null,
                evento.getDescripcionBreve(),
                evento.getDescripcion(),
                toLocalDateTime(evento.getFechaHoraInicio()),
                toLocalDateTime(evento.getFechaHoraFin()),
                evento.getCategoria() != null ? evento.getCategoria().getId() : null,
                evento.getCategoria() != null ? evento.getCategoria().getNombre() : null,
                evento.getAreaMunicipal() != null ? evento.getAreaMunicipal().getNombre() : null,
                ubicacion != null ? ubicacion.getId() : null,
                ubicacion != null ? ubicacion.getNombre() : null,
                ubicacion != null ? ubicacion.getDireccion() : null,
                ubicacion != null ? ubicacion.getReferencia() : null,
                ubicacion != null ? ubicacion.getLatitud() : null,
                ubicacion != null ? ubicacion.getLongitud() : null,
                evento.getCostoReferencial(),
                evento.getRequierePago() != null && evento.getRequierePago() == 1,
                evento.getCostoVecinal(),
                evento.getInstruccionesPago(),
                evento.getAforoMaximo(),
                evento.getEdadMin(),
                evento.getEdadMax(),
                requiereInscripcion(evento),
                requiereControlAsistencia(evento),
                obtenerAgendaPublicaDto(evento),
                obtenerRequisitosPublicosDto(evento),
                obtenerRecursosPublicosDto(evento)
        );
    }
    private EventoPanelAdministrativoDto.ObservacionDirectivaPanelAdministrativoDto obtenerUltimaObservacionDirectivaDto(Evento evento) {
        if (evento == null || evento.getId() == null) {
            return null;
        }

        return observacionEventoRepository.findTopByEventoIdOrderByFechaObservacionDesc(evento.getId())
                .map(observacion -> new EventoPanelAdministrativoDto.ObservacionDirectivaPanelAdministrativoDto(
                        observacion.getId(),
                        observacion.getObservacion(),
                        observacion.getEstado(),
                        toLocalDateTime(observacion.getFechaObservacion()),
                        observacion.getUsuario() != null ? observacion.getUsuario().getNombre() : null
                ))
                .orElse(null);
    }
    private EventoRevisionDirectivaResumenDto toRevisionDirectivaResumenDto(Evento evento) {
        return new EventoRevisionDirectivaResumenDto(
                evento.getId(),
                evento.getTitulo(),
                evento.getEstadoEvento() != null ? evento.getEstadoEvento().getCodigo() : null,
                evento.getCategoria() != null ? evento.getCategoria().getNombre() : null,
                toLocalDateTime(evento.getFechaHoraInicio()),
                toLocalDateTime(evento.getFechaHoraFin()),
                evento.getUbicacion() != null ? evento.getUbicacion().getNombre() : null,
                toLocalDateTime(evento.getEventoActualizadoEn() != null
                        ? evento.getEventoActualizadoEn()
                        : evento.getTiempoActualizado())
        );
    }

    private EventoRevisionDirectivaDetalleDto toRevisionDirectivaDetalleDto(Evento evento) {
        Ubicacion ubicacion = evento.getUbicacion();
        EventoRevisionDirectivaDetalleDto.UbicacionDetalleDto ubicacionDto = ubicacion == null
                ? null
                : new EventoRevisionDirectivaDetalleDto.UbicacionDetalleDto(
                        ubicacion.getId(),
                        ubicacion.getNombre(),
                        ubicacion.getDireccion(),
                        ubicacion.getReferencia(),
                        ubicacion.getLatitud(),
                        ubicacion.getLongitud()
                );
        EventoRevisionDirectivaDetalleDto.ObservacionDetalleDto observacionDto =
                observacionEventoRepository.findTopByEventoIdOrderByFechaObservacionDesc(evento.getId())
                        .map(observacion -> new EventoRevisionDirectivaDetalleDto.ObservacionDetalleDto(
                                observacion.getId(),
                                observacion.getObservacion(),
                                observacion.getEstado(),
                                toLocalDateTime(observacion.getFechaObservacion()),
                                observacion.getUsuario() != null ? observacion.getUsuario().getNombre() : null
                        ))
                        .orElse(null);

        return new EventoRevisionDirectivaDetalleDto(
                evento.getId(),
                evento.getTitulo(),
                evento.getDescripcionBreve(),
                evento.getDescripcion(),
                toLocalDateTime(evento.getFechaHoraInicio()),
                toLocalDateTime(evento.getFechaHoraFin()),
                evento.getEstadoEvento() != null ? evento.getEstadoEvento().getCodigo() : null,
                evento.getCategoria() != null ? evento.getCategoria().getNombre() : null,
                evento.getAreaMunicipal() != null ? evento.getAreaMunicipal().getNombre() : null,
                evento.getCostoReferencial(),
                requierePago(evento),
                evento.getCostoVecinal(),
                evento.getInstruccionesPago(),
                evento.getAforoMaximo(),
                evento.getEdadMin(),
                evento.getEdadMax(),
                requiereInscripcion(evento),
                requiereControlAsistencia(evento),
                toLocalDateTime(evento.getEventoActualizadoEn() != null
                        ? evento.getEventoActualizadoEn()
                        : evento.getTiempoActualizado()),
                ubicacionDto,
                obtenerAgendaDto(evento),
                obtenerRequisitosDto(evento),
                obtenerRecursosDto(evento),
                eventoOperativoService.listarOperativosAsignados(evento),
                observacionDto
        );
    }

    public Integer obtenerNumeroEventosActivosDesdeHoy() {
        Instant ahora = ahoraLima();
        return eventoRepository.countByEstadoEvento_CodigoAndFechaHoraFinGreaterThanEqual(
                "PUBLICADO",
                ahora
        );
    }

    public Integer obtenerNumeroEventosBorradores(){
        return eventoRepository.countByEstadoEventoCodigo("BORRADOR");
    }

    public Integer obtenerNumeroEventosParaRevision(){
        return eventoRepository.countByEstadoEventoCodigo("PARA_REVISION");
    }

    public Integer obtenerNumeroEventosObservados(){
        return eventoRepository.countByEstadoEventoCodigo("OBSERVADO");
    }

    public ResumenCardsDirectivoDto obtenerResumenCardsDirectivo() {
        RangoMesActual rangoMesActual = obtenerRangoMesActual();

        return new ResumenCardsDirectivoDto(
                obtenerNumeroEventosParaRevision(),
                obtenerNumeroEventosObservados(),
                toIntegerCount(eventoRepository.countByEstadoCodigoInAndFechaActualizacionBetween(
                        List.of("PUBLICADO"),
                        rangoMesActual.inicio(),
                        rangoMesActual.fin()
                )),
                toIntegerCount(eventoRepository.countByEstadoCodigoInAndFechaActualizacionBetween(
                        List.of("FINALIZADO"),
                        rangoMesActual.inicio(),
                        rangoMesActual.fin()
                ))
        );
    }

    @Transactional
    public EventoPanelAdministrativoDto registrarEvento(EventoRegistroRequest request, HttpServletRequest httpServletRequest) {
        validarSolicitudEvento(request);

        Categoria categoria = obtenerCategoriaOpcional(request.categoriaId());
        AreaMunicipal areaMunicipal = obtenerAreaMunicipalOpcional(request.areaMunicipalId());
        Ubicacion ubicacion = obtenerUbicacionOpcional(request.ubicacionId());
        Usuario usuario = usuarioAutenticadoService.obtenerUsuarioAutenticado();
        validarEnvioRevisionConOperativos(request, usuario, null, httpServletRequest);
        String estadoCodigo = Boolean.TRUE.equals(request.enviarRevision()) && estaCompletoParaRevision(request)
                ? "PARA_REVISION"
                : "BORRADOR";
        EstadoEvento estadoEvento = obtenerEstadoEvento(estadoCodigo);
        Instant ahora = ahoraLima();

        Evento evento = new Evento();
        evento.setTitulo(normalizarTexto(request.titulo(), 100));
        evento.setDescripcionBreve(normalizarTexto(request.descripcionBreve(), 45));
        evento.setDescripcion(normalizarTexto(request.descripcion()));
        evento.setCategoria(categoria);
        evento.setAreaMunicipal(areaMunicipal);
        evento.setFechaHoraInicio(toInstant(request.fechaHoraInicio()));
        evento.setFechaHoraFin(toInstant(request.fechaHoraFin()));
        evento.setCostoReferencial(request.costoReferencial());
        boolean requiereInscripcion = requiereInscripcion(request);
        aplicarConfiguracionPago(evento, request);
        evento.setRequiereInscripcion(requiereInscripcion ? (byte) 1 : (byte) 0);
        evento.setEstadoEvento(estadoEvento);
        evento.setUbicacion(ubicacion);
        evento.setAforoMaximo(requiereInscripcion ? normalizarAforoMaximo(request.aforoMaximo()) : null);
        evento.setMetaTipo(requiereInscripcion ? normalizarTexto(request.metaTipo()) : null);
        evento.setMetaValor(requiereInscripcion ? request.metaValor() : null);
        evento.setEncuestaSatisfaccionHabilitado(requiereInscripcion ? (Boolean.TRUE.equals(request.encuestaSatisfaccionHabilitado()) ? (byte) 1 : (byte) 0) : null);
        evento.setRequiereControlAsistencia(requiereControlAsistencia(request) ? (byte) 1 : (byte) 0);
        evento.setTiempoCreado(ahora);
        evento.setTiempoActualizado(ahora);
        evento.setEventoActualizadoEn(ahora);
        evento.setUsuario(usuario);
        evento.setEdadMin(esPublicoObjetivo(request) ? request.edadMin() : null);
        evento.setEdadMax(esPublicoObjetivo(request) ? request.edadMax() : null);

        Evento eventoGuardado = eventoRepository.save(evento);
        guardarAgenda(eventoGuardado, request.agenda());
        guardarRequisitos(eventoGuardado, request.requisitos());
        eventoOperativoService.sincronizarOperativos(
                eventoGuardado,
                requiereControlAsistencia(request) ? request.operativosAsignadosIds() : List.of(),
                usuario,
                httpServletRequest
        );

        BitacoraAccion bitacoraAccion = bitacoraAccionService.guardarAccion(
                "CREAR_EVENTO",
                "EVENTO",
                eventoGuardado.getId(),
                "Se creo el evento \"" + valorDetalle(eventoGuardado.getTitulo()) + "\" con estado " + estadoCodigo,
                usuario,
                httpServletRequest
        );
        notificacionService.notificarEventoCreadoAdministradores(eventoGuardado, usuario, bitacoraAccion);
        if (esEstadoRevision(estadoCodigo)) {
            notificacionService.notificarEventoPendienteRevisionDirectivos(eventoGuardado, usuario, bitacoraAccion);
        }

        return toPanelAdministrativoDto(eventoGuardado);
    }

    @Transactional
    public void eliminarEvento(Integer id, HttpServletRequest httpServletRequest) {
        Usuario usuario = usuarioAutenticadoService.obtenerUsuarioAutenticado();
        Evento evento = eventoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento no encontrado"));

        if (!esBorrador(evento)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Solo se pueden eliminar eventos en estado borrador"
            );
        }

        String titulo = valorDetalle(evento.getTitulo());
        Integer eventoId = evento.getId();

        observacionEventoRepository.deleteAll(observacionEventoRepository.findByEventoId(eventoId));
        agendaEventoRepository.deleteAll(agendaEventoRepository.findByEvento(evento));
        requisitoEventoRepository.deleteAll(requisitoEventoRepository.findByEvento(evento));
        eventoRepository.delete(evento);

        bitacoraAccionService.guardarAccion(
                "ELIMINAR_EVENTO",
                "EVENTO",
                eventoId,
                "Se elimino el evento \"" + titulo + "\"",
                usuario,
                httpServletRequest
        );
    }

    @Transactional
    public EventoPanelAdministrativoDto actualizarEvento(
            Integer id,
            EventoRegistroRequest request,
            HttpServletRequest httpServletRequest
    ) {
        validarSolicitudEvento(request);

        Usuario usuario = usuarioAutenticadoService.obtenerUsuarioAutenticado();

        Evento evento = eventoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento no encontrado"));
        if ("FINALIZADO".equals(evento.getEstadoEvento() != null ? evento.getEstadoEvento().getCodigo() : "")) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No se puede modificar un evento finalizado");
        }
        Categoria categoria = obtenerCategoriaOpcional(request.categoriaId());
        AreaMunicipal areaMunicipal = obtenerAreaMunicipalOpcional(request.areaMunicipalId());
        Ubicacion ubicacion = obtenerUbicacionOpcional(request.ubicacionId());
        String estadoAnterior = evento.getEstadoEvento() != null ? evento.getEstadoEvento().getCodigo() : "";
        boolean requeriaControlAnterior = requiereControlAsistencia(evento);
        validarEnvioRevisionConOperativos(request, usuario, evento, httpServletRequest);
        String estadoCodigo = obtenerEstadoActualizacion(evento, request);
        EstadoEvento estadoEvento = obtenerEstadoEvento(estadoCodigo);
        Instant ahora = ahoraLima();

        evento.setTitulo(normalizarTexto(request.titulo(), 100));
        evento.setDescripcionBreve(normalizarTexto(request.descripcionBreve(), 45));
        evento.setDescripcion(normalizarTexto(request.descripcion()));
        evento.setCategoria(categoria);
        evento.setAreaMunicipal(areaMunicipal);
        evento.setFechaHoraInicio(toInstant(request.fechaHoraInicio()));
        evento.setFechaHoraFin(toInstant(request.fechaHoraFin()));
        evento.setCostoReferencial(request.costoReferencial());
        boolean requiereInscripcion = requiereInscripcion(request);
        aplicarConfiguracionPago(evento, request);
        evento.setRequiereInscripcion(requiereInscripcion ? (byte) 1 : (byte) 0);
        evento.setEstadoEvento(estadoEvento);
        evento.setUbicacion(ubicacion);
        evento.setAforoMaximo(requiereInscripcion ? normalizarAforoMaximo(request.aforoMaximo()) : null);
        evento.setMetaTipo(requiereInscripcion ? normalizarTexto(request.metaTipo()) : null);
        evento.setMetaValor(requiereInscripcion ? request.metaValor() : null);
        evento.setEncuestaSatisfaccionHabilitado(requiereInscripcion ? (Boolean.TRUE.equals(request.encuestaSatisfaccionHabilitado()) ? (byte) 1 : (byte) 0) : null);
        evento.setRequiereControlAsistencia(requiereControlAsistencia(request) ? (byte) 1 : (byte) 0);
        evento.setTiempoActualizado(ahora);
        evento.setEventoActualizadoEn(ahora);
        evento.setEdadMin(esPublicoObjetivo(request) ? request.edadMin() : null);
        evento.setEdadMax(esPublicoObjetivo(request) ? request.edadMax() : null);

        agendaEventoRepository.deleteAll(agendaEventoRepository.findByEvento(evento));
        requisitoEventoRepository.deleteAll(requisitoEventoRepository.findByEvento(evento));

        Evento eventoGuardado = eventoRepository.save(evento);
        if ("OBSERVADO".equals(estadoAnterior) && esEstadoRevision(estadoCodigo)) {
            atenderObservacionesPendientes(eventoGuardado);
        }
        guardarAgenda(eventoGuardado, request.agenda());
        guardarRequisitos(eventoGuardado, request.requisitos());
        eventoOperativoService.sincronizarOperativos(
                eventoGuardado,
                requiereControlAsistencia(request) ? request.operativosAsignadosIds() : List.of(),
                usuario,
                httpServletRequest
        );

        if (requeriaControlAnterior != requiereControlAsistencia(eventoGuardado)) {
            bitacoraAccionService.guardarAccion(
                    requiereControlAsistencia(eventoGuardado) ? "ACTIVAR_CONTROL_ASISTENCIA" : "DESACTIVAR_CONTROL_ASISTENCIA",
                    "EVENTO",
                    eventoGuardado.getId(),
                    (requiereControlAsistencia(eventoGuardado) ? "Se activo" : "Se desactivo")
                            + " el control de asistencia del evento \"" + valorDetalle(eventoGuardado.getTitulo()) + "\"",
                    usuario,
                    httpServletRequest
            );
        }

        BitacoraAccion bitacoraAccion = bitacoraAccionService.guardarAccion(
                "ACTUALIZAR_EVENTO",
                "EVENTO",
                eventoGuardado.getId(),
                "Se actualizo el evento \"" + valorDetalle(eventoGuardado.getTitulo()) + "\" de estado "
                        + valorDetalle(estadoAnterior) + " a " + estadoCodigo,
                usuario,
                httpServletRequest
        );
        notificarRevisionDirectivaSiCorresponde(eventoGuardado, usuario, bitacoraAccion, estadoAnterior, estadoCodigo);

        return toPanelAdministrativoDto(eventoGuardado);
    }

    @Transactional
    public EventoPanelAdministrativoDto finalizarEventoYGenerarValoraciones(Integer id, HttpServletRequest httpServletRequest) {
        Usuario usuario = usuarioAutenticadoService.obtenerUsuarioAutenticado();
        Evento evento = eventoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento no encontrado"));
        String estadoAnterior = evento.getEstadoEvento() != null ? evento.getEstadoEvento().getCodigo() : "";
        String estadoFinal = obtenerCodigoEstadoFinalEvento();
        EstadoEvento estadoEvento = obtenerEstadoEvento(estadoFinal);
        Instant ahora = ahoraLima();

        evento.setEstadoEvento(estadoEvento);
        evento.setTiempoActualizado(ahora);
        evento.setEventoActualizadoEn(ahora);
        Evento eventoGuardado = eventoRepository.save(evento);

        bitacoraAccionService.guardarAccion(
                "FINALIZAR_EVENTO",
                "EVENTO",
                eventoGuardado.getId(),
                "Se cambio el evento \"" + valorDetalle(eventoGuardado.getTitulo()) + "\" de estado "
                        + valorDetalle(estadoAnterior) + " a " + estadoFinal,
                usuario,
                httpServletRequest
        );

        valoracionEventoService.generarValoracionesParaEventoFinalizado(
                eventoGuardado.getId(),
                usuario,
                httpServletRequest
        );

        return toPanelAdministrativoDto(eventoGuardado);
    }

    @Transactional
    public EventoPanelAdministrativoDto aprobarEventoDirectivo(Integer id, HttpServletRequest httpServletRequest) {
        Usuario usuario = usuarioAutenticadoService.obtenerUsuarioAutenticado();
        Evento evento = eventoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento no encontrado"));
        String estadoAnterior = evento.getEstadoEvento() != null ? evento.getEstadoEvento().getCodigo() : "";

        if ("PUBLICADO".equals(estadoAnterior)) {
            return toPanelAdministrativoDto(evento);
        }

        validarEstadoDecisionDirectiva(estadoAnterior);

        EstadoEvento estadoPublicado = obtenerEstadoEvento("PUBLICADO");
        Instant ahora = ahoraLima();
        evento.setEstadoEvento(estadoPublicado);
        evento.setTiempoActualizado(ahora);
        evento.setEventoActualizadoEn(ahora);

        Evento eventoGuardado = eventoRepository.save(evento);
        BitacoraAccion bitacoraAccion = bitacoraAccionService.guardarAccion(
                "PUBLICAR_EVENTO",
                "EVENTO",
                eventoGuardado.getId(),
                "Publico el evento \"" + valorDetalle(eventoGuardado.getTitulo()) + "\"",
                usuario,
                httpServletRequest
        );

        notificacionService.notificarEventoPublicadoAdministradores(eventoGuardado, usuario, bitacoraAccion);
        notificacionService.notificarEventoPublicadoDirectivos(eventoGuardado, usuario, bitacoraAccion);

        return toPanelAdministrativoDto(eventoGuardado);
    }

    @Transactional
    public EventoPanelAdministrativoDto observarEventoDirectivo(
            Integer id,
            String observacion,
            HttpServletRequest httpServletRequest
    ) {
        String observacionNormalizada = normalizarTexto(observacion);
        if (!hasText(observacionNormalizada)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La observacion es obligatoria");
        }

        Usuario usuario = usuarioAutenticadoService.obtenerUsuarioAutenticado();
        Evento evento = eventoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento no encontrado"));
        String estadoAnterior = evento.getEstadoEvento() != null ? evento.getEstadoEvento().getCodigo() : "";
        validarEstadoDecisionDirectiva(estadoAnterior);

        EstadoEvento estadoObservado = obtenerEstadoEvento("OBSERVADO");
        Instant ahora = ahoraLima();
        evento.setEstadoEvento(estadoObservado);
        evento.setTiempoActualizado(ahora);
        evento.setEventoActualizadoEn(ahora);
        Evento eventoGuardado = eventoRepository.save(evento);

        ObservacionEvento observacionEvento = new ObservacionEvento();
        observacionEvento.setEvento(eventoGuardado);
        observacionEvento.setUsuario(usuario);
        observacionEvento.setObservacion(observacionNormalizada);
        observacionEvento.setFechaObservacion(ahora);
        observacionEvento.setEstado("PENDIENTE");
        observacionEventoRepository.save(observacionEvento);

        BitacoraAccion bitacoraAccion = bitacoraAccionService.guardarAccion(
                "OBSERVAR_EVENTO",
                "EVENTO",
                eventoGuardado.getId(),
                "Observo el evento \"" + valorDetalle(eventoGuardado.getTitulo()) + "\". Observacion: " + observacionNormalizada,
                usuario,
                httpServletRequest
        );

        notificacionService.notificarEventoObservadoAdministradores(eventoGuardado, usuario, bitacoraAccion);
        notificacionService.notificarEventoObservadoDirectivos(eventoGuardado, usuario, bitacoraAccion);

        return toPanelAdministrativoDto(eventoGuardado);
    }

    @Transactional
    public EventoPanelAdministrativoDto cancelarEventoAdministrativo(
            Integer id,
            CancelarEventoRequestDto request,
            HttpServletRequest httpServletRequest
    ) {
        String motivoNormalizado = validarMotivoCancelacion(request != null ? request.motivo() : null);
        return cancelarEvento(
                id,
                motivoNormalizado,
                "CANCELAR_EVENTO_ADMINISTRADOR",
                httpServletRequest
        );
    }

    @Transactional
    public EventoPanelAdministrativoDto cancelarEventoDirectivo(
            Integer id,
            String motivo,
            HttpServletRequest httpServletRequest
    ) {
        String motivoNormalizado = validarMotivoCancelacion(motivo);
        return cancelarEvento(
                id,
                motivoNormalizado,
                "CANCELAR_EVENTO_DIRECTIVO",
                httpServletRequest
        );
    }

    private EventoPanelAdministrativoDto cancelarEvento(
            Integer id,
            String motivoNormalizado,
            String accionBitacora,
            HttpServletRequest httpServletRequest
    ) {
        Usuario usuario = usuarioAutenticadoService.obtenerUsuarioAutenticado();
        Evento evento = eventoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento no encontrado"));
        String estadoAnterior = evento.getEstadoEvento() != null ? evento.getEstadoEvento().getCodigo() : "";

        if ("FINALIZADO".equals(estadoAnterior)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No se puede cancelar un evento finalizado");
        }

        if ("CANCELADO".equals(estadoAnterior)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El evento ya se encuentra cancelado");
        }

        List<Inscripcion> inscripcionesConfirmadas = inscripcionRepository.findByEventoIdAndEstadoInscripcion(
                evento.getId(),
                EstadoInscripcion.CONFIRMADA
        );

        EstadoEvento estadoCancelado = obtenerEstadoEvento("CANCELADO");
        Instant ahora = ahoraLima();
        evento.setEstadoEvento(estadoCancelado);
        evento.setMotivoCancelacion(motivoNormalizado);
        evento.setFechaCancelacion(ahora);
        evento.setUsuarioCancelacion(usuario);
        evento.setTiempoActualizado(ahora);
        evento.setEventoActualizadoEn(ahora);

        int codigosQrRevocados = codigoQrRepository.revocarActivosPorEvento(evento.getId());
        int inscripcionesCanceladas = inscripcionRepository.cancelarConfirmadasPorEvento(evento.getId());

        Evento eventoGuardado = eventoRepository.save(evento);
        BitacoraAccion bitacoraAccion = bitacoraAccionService.guardarAccion(
                accionBitacora,
                "EVENTO",
                eventoGuardado.getId(),
                "Se cancelo el evento \"" + valorDetalle(eventoGuardado.getTitulo()) + "\" de estado "
                        + valorDetalle(estadoAnterior)
                        + ". Motivo: " + motivoNormalizado
                        + ". Inscripciones canceladas: " + inscripcionesCanceladas
                        + ". QR revocados: " + codigosQrRevocados,
                usuario,
                httpServletRequest
        );

        notificacionService.notificarEventoCanceladoAdministradores(eventoGuardado, usuario, bitacoraAccion);
        notificacionService.notificarEventoCanceladoDirectivos(eventoGuardado, usuario, bitacoraAccion);
        notificarVecinosEventoCancelado(inscripcionesConfirmadas, motivoNormalizado);

        return toPanelAdministrativoDto(eventoGuardado);
    }

    private String validarMotivoCancelacion(String motivo) {
        String motivoNormalizado = normalizarTexto(motivo);
        if (!hasText(motivoNormalizado)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El motivo de cancelacion es obligatorio");
        }
        return motivoNormalizado;
    }

    private void notificarVecinosEventoCancelado(List<Inscripcion> inscripcionesConfirmadas, String motivoNormalizado) {
        for (Inscripcion inscripcion : inscripcionesConfirmadas) {
            vecinoNotificacionService.enviarCorreoEventoCancelado(inscripcion, motivoNormalizado);
        }
    }

    private Integer calcularCuposDisponibles(Evento evento) {
        if (evento == null || evento.getId() == null || evento.getAforoMaximo() == null) {
            return 0;
        }

        long inscritosActivos = inscripcionRepository.countActivasByEventoId(evento.getId());
        return Math.max(0, evento.getAforoMaximo() - (int) inscritosActivos);
    }

    private Integer calcularCompletitud(Evento evento) {
        if (evento == null) {
            return 0;
        }

        int total = 7;
        int completos = 0;

        //Parte 1:Datos generales (1/6)
        if (tieneDatosGeneralesCompletos(evento)) completos++;
        //Parte 2:Programación o Aforo (2/6)
        if (tieneProgramacionValida(evento)) completos++;
        //Parte 3:Agenda (3/6)
        boolean tieneAgenda = agendaEventoRepository.findByEvento(evento).size() != 0;
        if (tieneAgenda) completos++;
        //Parte 4: Requisitos (4/6)
        boolean tieneRequisitos = requisitoEventoRepository.findByEvento(evento).size() != 0;
        if (tieneRequisitos) completos++;
        //Parte 5: Ubicación (5/6)
        if (evento.getUbicacion() != null) completos++;
        //Parte 6: Recursos Adjuntos (6/6)
        if (tienePortada(evento)) completos++;
        if (personalOperativoCompleto(evento)) completos++;

        return Math.round((completos * 100f) / total);
    }



    private void validarSolicitudEvento(EventoRegistroRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La solicitud del evento es obligatoria");
        }

        if (request.aforoMaximo() != null && request.aforoMaximo() < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El aforo maximo no puede ser negativo"
            );
        }

        if (request.fechaHoraInicio() != null
                && request.fechaHoraFin() != null
                && !request.fechaHoraFin().isAfter(request.fechaHoraInicio())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La fecha de fin del evento debe ser posterior a la fecha de inicio"
            );
        }
        boolean requiereInscripcion = requiereInscripcion(request);

        if (Boolean.FALSE.equals(request.requiereInscripcion()) && Boolean.TRUE.equals(request.requiereControlAsistencia())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El control de asistencia solo esta disponible para eventos con inscripcion previa"
            );
        }

        if (Boolean.FALSE.equals(request.requiereInscripcion()) && Boolean.TRUE.equals(request.requierePago())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Un evento con pago por inscripcion debe requerir inscripcion previa"
            );
        }

        if (Boolean.TRUE.equals(request.requierePago()) && !requiereInscripcion) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Un evento con pago por inscripcion debe requerir inscripcion previa"
            );
        }
        if (Boolean.TRUE.equals(request.requierePago())) {
            if (request.costoVecinal() == null || request.costoVecinal() <= 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "El monto de pago por inscripcion debe ser mayor a cero"
                );
            }

            if (!hasText(request.instruccionesPago())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Las instrucciones de pago son obligatorias"
                );
            }
        }
    }

    private void aplicarConfiguracionPago(Evento evento, EventoRegistroRequest request) {
        boolean requiereInscripcion = requiereInscripcion(request);
        boolean requierePago = requiereInscripcion && Boolean.TRUE.equals(request.requierePago());
        evento.setRequierePago(requierePago ? (byte) 1 : (byte) 0);
        evento.setCostoVecinal(requierePago ? request.costoVecinal() : null);
        evento.setInstruccionesPago(requierePago ? normalizarTexto(request.instruccionesPago()) : null);
    }

    private boolean requierePago(Evento evento) {
        return evento.getRequierePago() != null && evento.getRequierePago() == 1;
    }

    private boolean requiereInscripcion(Evento evento) {
        if (evento == null) {
            return true;
        }
        if (evento.getRequiereInscripcion() != null) {
            return evento.getRequiereInscripcion() == 1;
        }
        return requiereControlAsistencia(evento) || requierePago(evento);
    }

    private boolean requiereInscripcion(EventoRegistroRequest request) {
        if (request == null) {
            return true;
        }

        return request.requiereInscripcion() == null || Boolean.TRUE.equals(request.requiereInscripcion());
    }

    private Categoria obtenerCategoriaOpcional(Integer categoriaId) {
        if (categoriaId == null) {
            return null;
        }

        return categoriaRepository.findById(categoriaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "La categoria seleccionada no existe"));
    }

    private AreaMunicipal obtenerAreaMunicipalOpcional(Integer areaMunicipalId) {
        if (areaMunicipalId == null) {
            return null;
        }

        return areaMunicipalRepository.findById(areaMunicipalId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "El area municipal seleccionada no existe"));
    }

    private Ubicacion obtenerUbicacionOpcional(Integer ubicacionId) {
        if (ubicacionId == null) {
            return null;
        }

        return ubicacionRepository.findById(ubicacionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "La ubicacion seleccionada no existe"));
    }

    private boolean estaCompletoParaRevision(EventoRegistroRequest request) {
        return hasText(request.titulo())
                && request.titulo().length() <= 100
                && hasText(request.descripcionBreve())
                && request.descripcionBreve().length() <= 45
                && hasText(request.descripcion())
                && request.categoriaId() != null
                && request.areaMunicipalId() != null
                && request.fechaHoraInicio() != null
                && request.fechaHoraFin() != null
                && request.fechaHoraFin().isAfter(request.fechaHoraInicio())
                && request.costoReferencial() != null
                && request.costoReferencial() >= 0
                && request.ubicacionId() != null
                && tieneAforoValido(request)
                && tienePublicoValido(request)
                && tieneItemsValidos(request.agenda())
                && tieneItemsValidos(request.requisitos())
                && tieneRecursoPrincipal(request.recursos())
                && personalOperativoCompleto(request);
    }

    private boolean estaCompletoParaRevision(EventoRegistroRequest request, Evento evento) {
        return hasText(request.titulo())
                && request.titulo().length() <= 100
                && hasText(request.descripcionBreve())
                && request.descripcionBreve().length() <= 45
                && hasText(request.descripcion())
                && request.categoriaId() != null
                && request.areaMunicipalId() != null
                && request.fechaHoraInicio() != null
                && request.fechaHoraFin() != null
                && request.fechaHoraFin().isAfter(request.fechaHoraInicio())
                && request.costoReferencial() != null
                && request.costoReferencial() >= 0
                && request.ubicacionId() != null
                && tieneAforoValido(request)
                && tienePublicoValido(request)
                && tieneItemsValidos(request.agenda())
                && tieneItemsValidos(request.requisitos())
                && (tieneRecursoPrincipal(request.recursos()) || tienePortada(evento))
                && personalOperativoCompleto(request);
    }
    private boolean tieneAforoValido(EventoRegistroRequest request) {
        return !requiereInscripcion(request) || request.aforoMaximo() == null || request.aforoMaximo() >= 0;
    }

    private Integer normalizarAforoMaximo(Integer aforoMaximo) {
        return aforoMaximo;
    }

    private String obtenerEstadoActualizacion(Evento evento, EventoRegistroRequest request) {
        if (Boolean.TRUE.equals(request.enviarRevision())) {
            return estaCompletoParaRevision(request, evento) ? "PARA_REVISION" : "BORRADOR";
        }

        if (evento.getEstadoEvento() == null || !hasText(evento.getEstadoEvento().getCodigo())) {
            return "BORRADOR";
        }

        return evento.getEstadoEvento().getCodigo();
    }

    private boolean tieneDatosGeneralesCompletos(Evento evento) {
        return evento != null
                && hasText(evento.getTitulo())
                && hasText(evento.getDescripcion())
                && evento.getAreaMunicipal() != null
                && hasText(evento.getDescripcionBreve())
                && evento.getCategoria() != null;
    }

    private boolean tieneProgramacionValida(Evento evento) {
        return evento != null
                && evento.getFechaHoraInicio() != null
                && evento.getFechaHoraFin() != null
                && evento.getFechaHoraFin().isAfter(evento.getFechaHoraInicio())
                && evento.getCostoReferencial() != null;
    }

    private boolean tienePublicoValido(EventoRegistroRequest request) {
        if (!esPublicoObjetivo(request)) {
            return true;
        }

        if (request.edadMin() == null || request.edadMax() == null) {
            return false;
        }

        return request.edadMin() >= 0 && request.edadMax() > request.edadMin() && request.edadMax() <= 120;
    }

    private boolean esPublicoObjetivo(EventoRegistroRequest request) {
        return request != null && "OBJETIVO".equals(request.publicoTipo());
    }

    private boolean tieneItemsValidos(List<EventoRegistroRequest.ItemOrdenadoRequest> items) {
        return items != null && items.stream().anyMatch(item -> item != null && hasText(item.descripcion()));
    }

    private boolean tieneRecursoPrincipal(List<EventoRegistroRequest.RecursoRequest> recursos) {
        if (recursos == null) {
            return false;
        }

        return recursos.stream().anyMatch(recurso ->
                recurso != null
                        && "IMAGEN_PORTADA".equals(recurso.tipoRecurso())
                        && (hasText(recurso.objectPath()) || hasText(recurso.nombreOriginal()))
        );
    }

    private boolean tienePortada(Evento evento) {
        if (evento == null) {
            return false;
        }

        return recursoEventoRepository.findByEvento(evento).stream()
                .anyMatch(recurso -> recurso != null && "IMAGEN_PORTADA".equals(recurso.getTipoRecurso()));
    }

    private boolean requiereControlAsistencia(Evento evento) {
        return evento == null
                || evento.getRequiereControlAsistencia() == null
                || evento.getRequiereControlAsistencia() == 1;
    }

    private boolean requiereControlAsistencia(EventoRegistroRequest request) {
        return requiereInscripcion(request)
                && (request == null
                || request.requiereControlAsistencia() == null
                || Boolean.TRUE.equals(request.requiereControlAsistencia()));
    }

    private boolean personalOperativoCompleto(Evento evento) {
        return !requiereControlAsistencia(evento) || eventoOperativoService.tieneOperativosActivos(evento);
    }

    private boolean personalOperativoCompleto(EventoRegistroRequest request) {
        return !requiereControlAsistencia(request)
                || (request.operativosAsignadosIds() != null
                && request.operativosAsignadosIds().stream().anyMatch(id -> id != null));
    }

    private void validarEnvioRevisionConOperativos(
            EventoRegistroRequest request,
            Usuario usuario,
            Evento evento,
            HttpServletRequest httpServletRequest
    ) {
        boolean tieneOperativosEnRequest = personalOperativoCompleto(request);
        boolean puedeUsarAsignacionesExistentes = evento != null
                && request.operativosAsignadosIds() == null
                && personalOperativoCompleto(evento);

        if (!Boolean.TRUE.equals(request.enviarRevision()) || tieneOperativosEnRequest || puedeUsarAsignacionesExistentes) {
            return;
        }

        bitacoraAccionService.guardarAccion(
                "INTENTO_REVISION_SIN_OPERATIVO",
                "EVENTO",
                evento != null ? evento.getId() : null,
                "Se intento enviar a revision un evento que requiere control de asistencia sin personal operativo",
                usuario,
                httpServletRequest
        );

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Este evento requiere control de asistencia. Asigna al menos un operativo antes de enviarlo a revision."
        );
    }

    private boolean esBorrador(Evento evento) {
        return evento != null
                && evento.getEstadoEvento() != null
                && "BORRADOR".equals(evento.getEstadoEvento().getCodigo());
    }

    private void notificarRevisionDirectivaSiCorresponde(
            Evento evento,
            Usuario usuario,
            BitacoraAccion bitacoraAccion,
            String estadoAnterior,
            String estadoCodigo
    ) {
        if (!esEstadoRevision(estadoCodigo) || esEstadoRevision(estadoAnterior)) {
            return;
        }

        if ("OBSERVADO".equals(estadoAnterior)) {
            notificacionService.notificarEventoCorregidoRevisionDirectivos(evento, usuario, bitacoraAccion);
            return;
        }

        notificacionService.notificarEventoPendienteRevisionDirectivos(evento, usuario, bitacoraAccion);
    }

    private void validarEstadoDecisionDirectiva(String estadoCodigo) {
        if (!"PARA_REVISION".equals(estadoCodigo)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Solo se pueden revisar eventos en estado PARA_REVISION"
            );
        }
    }
    private void atenderObservacionesPendientes(Evento evento) {
        observacionEventoRepository.findByEventoId(evento.getId()).stream()
                .filter(this::esObservacionPendiente)
                .forEach(observacion -> {
                    observacion.setEstado("ATENDIDA");
                    observacionEventoRepository.save(observacion);
                });
    }
    private boolean esEstadoRevision(String estadoCodigo) {
        return "PARA_REVISION".equals(estadoCodigo);
    }

    private String valorDetalle(String valor) {
        return hasText(valor) ? valor.trim() : "Sin título";
    }

    private EstadoEvento obtenerEstadoEvento(String codigo) {
        return estadoEventoRepository.findByCodigo(codigo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "No existe el estado " + codigo));
    }

    private String obtenerCodigoEstadoFinalEvento() {
        if (estadoEventoRepository.findByCodigo("FINALIZADO").isPresent()) {
            return "FINALIZADO";
        }

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "No existe el estado FINALIZADO para finalizar el evento"
        );
    }

    private Instant toInstant(LocalDateTime localDateTime) {
        return localDateTime == null ? null : localDateTime.atZone(ZONA_LIMA).toInstant();
    }

    private String normalizarTexto(String value) {
        return hasText(value) ? value.trim() : null;
    }

    private String normalizarTexto(String value, int maxLength) {
        String normalizado = normalizarTexto(value);
        if (normalizado == null || normalizado.length() <= maxLength) {
            return normalizado;
        }

        return normalizado.substring(0, maxLength);
    }

    private void guardarAgenda(Evento evento, List<EventoRegistroRequest.ItemOrdenadoRequest> items) {
        if (items == null) {
            return;
        }

        items.stream()
                .filter(item -> item != null && hasText(item.descripcion()))
                .forEach(item -> {
                    AgendaEvento agenda = new AgendaEvento();
                    agenda.setEvento(evento);
                    agenda.setOrden(item.orden());
                    agenda.setDescripcion(normalizarTexto(item.descripcion(), 45));
                    agendaEventoRepository.save(agenda);
                });
    }

    private void guardarRequisitos(Evento evento, List<EventoRegistroRequest.ItemOrdenadoRequest> items) {
        if (items == null) {
            return;
        }

        items.stream()
                .filter(item -> item != null && hasText(item.descripcion()))
                .forEach(item -> {
                    RequisitoEvento requisito = new RequisitoEvento();
                    requisito.setEvento(evento);
                    requisito.setOrden(item.orden());
                    requisito.setDescripcion(item.descripcion().trim());
                    requisitoEventoRepository.save(requisito);
                });
    }

    private void guardarRecursos(Evento evento, List<EventoRegistroRequest.RecursoRequest> recursos) {
        if (recursos == null) {
            return;
        }

        recursos.stream()
                .filter(recurso -> recurso != null && hasText(recurso.tipoRecurso()))
                .forEach(recurso -> {
                    RecursoEvento recursoEvento = new RecursoEvento();
                    recursoEvento.setEvento(evento);
                    recursoEvento.setTipoRecurso(normalizarTexto(recurso.tipoRecurso(), 45));
                    recursoEvento.setObjectPath(normalizarTexto(recurso.objectPath(), 500));
                    recursoEvento.setNombreOriginal(normalizarTexto(recurso.nombreOriginal(), 255));
                    recursoEvento.setMimeType(normalizarTexto(recurso.mimeType(), 100));
                    recursoEvento.setSizeBytes(recurso.sizeBytes());
                    recursoEvento.setFechaSubida(ahoraLima());
                    recursoEventoRepository.save(recursoEvento);
                });
    }

    private void eliminarRecursosEvento(Evento evento) {
        recursoEventoRepository.findByEvento(evento).forEach(recurso -> {
            cloudStorageService.eliminar(recurso.getObjectPath());
            recursoEventoRepository.delete(recurso);
        });
    }
    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private LocalDateTime toLocalDateTime(Instant instant) {
        return instant == null ? null : LocalDateTime.ofInstant(instant, ZONA_LIMA);
    }

    private Integer toIntegerCount(Long value) {
        return value == null ? 0 : Math.toIntExact(value);
    }

    private RangoMesActual obtenerRangoMesActual() {
        ZonedDateTime inicioMes = ZonedDateTime.now(ZONA_LIMA)
                .withDayOfMonth(1)
                .toLocalDate()
                .atStartOfDay(ZONA_LIMA);
        ZonedDateTime inicioMesSiguiente = inicioMes.plusMonths(1);

        return new RangoMesActual(inicioMes.toInstant(), inicioMesSiguiente.toInstant());
    }

    private record RangoMesActual(Instant inicio, Instant fin) {}

    private EventoPanelAdministrativoDto.CategoriaEventoPanelAdministrativoDto toCategoriaPanelAdministrativoDto(Evento evento) {
        if (evento == null || evento.getCategoria() == null) {
            return null;
        }

        return new EventoPanelAdministrativoDto.CategoriaEventoPanelAdministrativoDto(
                evento.getCategoria().getId(),
                evento.getCategoria().getNombre()
        );
    }

    private List<EventoPanelAdministrativoDto.ItemOrdenadoEventoPanelAdministrativoDto> obtenerAgendaDto(Evento evento) {
        return agendaEventoRepository.findByEvento(evento).stream()
                .sorted(Comparator.comparing(AgendaEvento::getOrden, Comparator.nullsLast(Integer::compareTo)))
                .map(item -> new EventoPanelAdministrativoDto.ItemOrdenadoEventoPanelAdministrativoDto(
                        item.getOrden(),
                        item.getDescripcion()
                ))
                .toList();
    }

    private List<EventoPanelAdministrativoDto.ItemOrdenadoEventoPanelAdministrativoDto> obtenerRequisitosDto(Evento evento) {
        return requisitoEventoRepository.findByEvento(evento).stream()
                .sorted(Comparator.comparing(RequisitoEvento::getOrden, Comparator.nullsLast(Integer::compareTo)))
                .map(item -> new EventoPanelAdministrativoDto.ItemOrdenadoEventoPanelAdministrativoDto(
                        item.getOrden(),
                        item.getDescripcion()
                ))
                .toList();
    }

    private List<EventoPanelAdministrativoDto.RecursoEventoPanelAdministrativoDto> obtenerRecursosDto(Evento evento) {
        return recursoEventoRepository.findByEvento(evento).stream()
                .map(recurso -> new EventoPanelAdministrativoDto.RecursoEventoPanelAdministrativoDto(
                        recurso.getId(),
                        recurso.getTipoRecurso(),
                        recurso.getObjectPath(),
                        recurso.getNombreOriginal(),
                        recurso.getMimeType(),
                        recurso.getSizeBytes(),
                        cloudStorageService.generarSignedUrl(recurso.getObjectPath())
                ))
                .toList();
    }

    private List<EventoPortalPublicoDto.ItemOrdenadoPublicoDto> obtenerAgendaPublicaDto(Evento evento) {
        return agendaEventoRepository.findByEvento(evento).stream()
                .sorted(Comparator.comparing(AgendaEvento::getOrden, Comparator.nullsLast(Integer::compareTo)))
                .map(item -> new EventoPortalPublicoDto.ItemOrdenadoPublicoDto(
                        item.getOrden(),
                        item.getDescripcion()
                ))
                .toList();
    }

    private List<EventoPortalPublicoDto.ItemOrdenadoPublicoDto> obtenerRequisitosPublicosDto(Evento evento) {
        return requisitoEventoRepository.findByEvento(evento).stream()
                .sorted(Comparator.comparing(RequisitoEvento::getOrden, Comparator.nullsLast(Integer::compareTo)))
                .map(item -> new EventoPortalPublicoDto.ItemOrdenadoPublicoDto(
                        item.getOrden(),
                        item.getDescripcion()
                ))
                .toList();
    }

    private List<EventoPortalPublicoDto.RecursoPublicoDto> obtenerRecursosPublicosDto(Evento evento) {
        return recursoEventoRepository.findByEvento(evento).stream()
                .map(recurso -> new EventoPortalPublicoDto.RecursoPublicoDto(
                        recurso.getId(),
                        recurso.getTipoRecurso(),
                        recurso.getObjectPath(),
                        recurso.getNombreOriginal(),
                        recurso.getMimeType(),
                        recurso.getSizeBytes(),
                        cloudStorageService.generarSignedUrl(recurso.getObjectPath())
                ))
                .toList();
    }
    private List<EventoPanelAdministrativoDto.CriterioFichaEventoPanelAdministrativoDto> construirCriteriosFicha(Evento evento) {
        boolean requiereControl = requiereControlAsistencia(evento);
        boolean operativoCompleto = personalOperativoCompleto(evento);

        return List.of(
                criterioFicha("DATOS_GENERALES", "Datos generales", tieneDatosGeneralesCompletos(evento), true),
                criterioFicha("PROGRAMACION", "Programacion y aforo", tieneProgramacionValida(evento), true),
                criterioFicha("AGENDA", "Agenda del evento", agendaEventoRepository.findByEvento(evento).size() != 0, true),
                criterioFicha("REQUISITOS", "Requisitos", requisitoEventoRepository.findByEvento(evento).size() != 0, true),
                criterioFicha("UBICACION", "Ubicacion", evento.getUbicacion() != null, true),
                criterioFicha("RECURSOS", "Recursos", tienePortada(evento), true),
                new EventoPanelAdministrativoDto.CriterioFichaEventoPanelAdministrativoDto(
                        "PERSONAL_OPERATIVO",
                        "Personal operativo asignado",
                        operativoCompleto,
                        requiereControl,
                        requiereControl ? (operativoCompleto ? "Completo" : "Pendiente") : "No requerido"
                )
        );
    }

    private EventoPanelAdministrativoDto.CriterioFichaEventoPanelAdministrativoDto criterioFicha(
            String codigo,
            String nombre,
            boolean completo,
            boolean requerido
    ) {
        return new EventoPanelAdministrativoDto.CriterioFichaEventoPanelAdministrativoDto(
                codigo,
                nombre,
                completo,
                requerido,
                completo ? "Completo" : "Pendiente"
        );
    }

    private List<EventoPanelAdministrativoDto.AlertaFichaEventoPanelAdministrativoDto> construirAlertasFichaEventoPanelAdministrativoDto(Evento evento) {
        if (evento == null) {
            return List.of();
        }

        List<EventoPanelAdministrativoDto.AlertaFichaEventoPanelAdministrativoDto> alertas = new ArrayList<>();

        agregarAlertasObservacionesDirectivo(evento, alertas);
        agregarAlertasCamposPendientes(evento, alertas);

        return alertas;
    }

    private void agregarAlertasObservacionesDirectivo(
            Evento evento,
            List<EventoPanelAdministrativoDto.AlertaFichaEventoPanelAdministrativoDto> alertas
    ) {
        if (evento.getId() == null) {
            return;
        }

        long numeroObservacionesPendientes = observacionEventoRepository.findByEventoId(evento.getId()).stream()
                .filter(this::esObservacionPendiente)
                .count();

        if(numeroObservacionesPendientes>0){
            alertas.add(new EventoPanelAdministrativoDto.AlertaFichaEventoPanelAdministrativoDto(
                    "OBSERVACION_DIRECTIVO",
                    numeroObservacionesPendientes == 1 ? "1 observación del directivo": numeroObservacionesPendientes + " observaciones del directivo."));

        }
    }

    private boolean esObservacionPendiente(ObservacionEvento observacion) { //Los únicos estados que tiene observación son: ATENDIDA y PENDIENTE
        if (observacion == null) {
            return false;
        }

        String estado = observacion.getEstado();
        if ("ATENDIDA".equals(estado)) {
            return false;
        } else if ("PENDIENTE".equals(estado) || !hasText(estado)) {
            return true;
        }
        else {
            return true;
        }
    }

    private void agregarAlertasCamposPendientes(
            Evento evento,
            List<EventoPanelAdministrativoDto.AlertaFichaEventoPanelAdministrativoDto> alertas
    ) {

        //Parte 1:Datos generales (1/6)
        if (!hasText(evento.getTitulo()) || !hasText(evento.getDescripcion()) || evento.getAreaMunicipal() == null || !hasText(evento.getDescripcionBreve()) || evento.getCategoria() == null){
            agregarAlertaCampoPendiente(alertas, "Completar datos generales del evento");
        }
        //Parte 2:Programación (2/6)
        if (!tieneProgramacionValida(evento)){
            agregarAlertaCampoPendiente(alertas, "Completar programación del evento");

        }
        //Parte 3:Agenda (3/6)
        boolean tieneAgenda = agendaEventoRepository.findByEvento(evento).size() != 0;
        if (!tieneAgenda) {
            agregarAlertaCampoPendiente(alertas, "Definir agenda del evento");
        }
        //Parte 4: Requisitos (4/6)
        boolean tieneRequisitos = requisitoEventoRepository.findByEvento(evento).size() != 0;
        if (!tieneRequisitos) {
            agregarAlertaCampoPendiente(alertas, "Definir requisitos del evento");
        }
        //Parte 5: Ubicación (5/6)
        if (evento.getUbicacion() == null){
            agregarAlertaCampoPendiente(alertas, "Agregar ubicación del evento");
        }
        //Parte 6: Recursos Adjuntos (6/6)
        if (!tienePortada(evento)){
            agregarAlertaCampoPendiente(alertas, "Agregar imagen de portada del evento");
        }
        if (!personalOperativoCompleto(evento)) {
            agregarAlertaCampoPendiente(alertas, "Asignar personal operativo al evento");
        }

    }

    private void agregarAlertaCampoPendiente(
            List<EventoPanelAdministrativoDto.AlertaFichaEventoPanelAdministrativoDto> alertas,
            String mensaje
    ) {
        alertas.add(new EventoPanelAdministrativoDto.AlertaFichaEventoPanelAdministrativoDto(
                "CAMPO_PENDIENTE",
                mensaje
        ));
    }


}

