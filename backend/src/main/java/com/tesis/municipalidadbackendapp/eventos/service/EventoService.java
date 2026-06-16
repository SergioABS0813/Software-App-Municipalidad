package com.tesis.municipalidadbackendapp.eventos.service;

import com.tesis.municipalidadbackendapp.common.UsuarioAutenticadoService;
import com.tesis.municipalidadbackendapp.bitacora.entity.BitacoraAccion;
import com.tesis.municipalidadbackendapp.bitacora.service.BitacoraAccionService;
import com.tesis.municipalidadbackendapp.eventos.dto.EventoPanelAdministrativoDto;
import com.tesis.municipalidadbackendapp.eventos.dto.EventoRegistroRequest;
import com.tesis.municipalidadbackendapp.eventos.entity.AgendaEvento;
import com.tesis.municipalidadbackendapp.eventos.entity.Categoria;
import com.tesis.municipalidadbackendapp.eventos.entity.EstadoEvento;
import com.tesis.municipalidadbackendapp.eventos.entity.Evento;
import com.tesis.municipalidadbackendapp.eventos.entity.ObservacionEvento;
import com.tesis.municipalidadbackendapp.eventos.entity.RecursoEvento;
import com.tesis.municipalidadbackendapp.eventos.entity.RequisitoEvento;
import com.tesis.municipalidadbackendapp.eventos.repository.*;
import com.tesis.municipalidadbackendapp.notificaciones.service.NotificacionService;
import com.tesis.municipalidadbackendapp.organizacion.entity.AreaMunicipal;
import com.tesis.municipalidadbackendapp.organizacion.repository.AreaMunicipalRepository;
import com.tesis.municipalidadbackendapp.ubicacion.entity.Ubicacion;
import com.tesis.municipalidadbackendapp.ubicacion.repository.UbicacionRepository;
import com.tesis.municipalidadbackendapp.usuariosinternos.entity.Usuario;
import com.tesis.municipalidadbackendapp.valoraciones.service.ValoracionEventoService;
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
import java.util.ArrayList;
import java.util.Comparator;
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
    private final ValoracionEventoService valoracionEventoService;
    private static final ZoneId ZONA_LIMA = ZoneId.of("America/Lima");

    public Page<EventoPanelAdministrativoDto> obtenerEventosPanelAdministrativo(
            String texto,
            String estadoCodigo,
            Integer categoriaId,
            boolean sinCategoria,
            int page,
            int size
    ) {
        int pageSize = Math.max(1, Math.min(size, 50));
        PageRequest pageable = PageRequest.of(
                Math.max(page, 0),
                pageSize,
                Sort.by(Sort.Direction.DESC, "eventoActualizadoEn").and(Sort.by(Sort.Direction.DESC, "id"))
        );

        return eventoRepository.findAllPanelAdministrativo(
                texto,
                estadoCodigo,
                categoriaId,
                sinCategoria,
                pageable
        ).map(this::toPanelAdministrativoDto);
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
                evento.getAforoMaximo(),
                evento.getEdadMin(),
                evento.getEdadMax(),
                toLocalDateTime(evento.getEventoActualizadoEn() != null ? evento.getEventoActualizadoEn() : evento.getTiempoActualizado()),
                calcularCompletitud(evento),
                construirAlertasFichaEventoPanelAdministrativoDto(evento),
                obtenerAgendaDto(evento),
                obtenerRequisitosDto(evento),
                obtenerRecursosDto(evento)
        );
    }

    public Integer obtenerNumeroEventosActivosDesdeHoy() {
        Instant ahora = Instant.now();
        return eventoRepository.countByEstadoEvento_CodigoAndFechaHoraFinGreaterThanEqual(
                "PUBLICADO",
                ahora
        );
    }

    public Integer obtenerNumeroEventosBorradores(){
        return eventoRepository.countByEstadoEventoCodigo("BORRADOR");
    }

    public Integer obtenerNumeroEventosParaRevision(){
        return eventoRepository.countByEstadoEventoCodigoIn(List.of("PARA_REVISION", "EN_REVISION", "OBSERVADO_EN_REVISION"));
    }

    public Integer obtenerNumeroEventosObservados(){
        return eventoRepository.countByEstadoEventoCodigo("OBSERVADO");
    }

    @Transactional
    public EventoPanelAdministrativoDto registrarEvento(EventoRegistroRequest request, HttpServletRequest httpServletRequest) {
        validarSolicitudEvento(request);

        Categoria categoria = obtenerCategoriaOpcional(request.categoriaId());
        AreaMunicipal areaMunicipal = obtenerAreaMunicipalOpcional(request.areaMunicipalId());
        Ubicacion ubicacion = obtenerUbicacionOpcional(request.ubicacionId());
        Usuario usuario = usuarioAutenticadoService.obtenerUsuarioAutenticado();
        String estadoCodigo = Boolean.TRUE.equals(request.enviarRevision()) && estaCompletoParaRevision(request)
                ? "PARA_REVISION"
                : "BORRADOR";
        EstadoEvento estadoEvento = obtenerEstadoEvento(estadoCodigo);
        Instant ahora = Instant.now();

        Evento evento = new Evento();
        evento.setTitulo(normalizarTexto(request.titulo(), 100));
        evento.setDescripcionBreve(normalizarTexto(request.descripcionBreve(), 45));
        evento.setDescripcion(normalizarTexto(request.descripcion()));
        evento.setCategoria(categoria);
        evento.setAreaMunicipal(areaMunicipal);
        evento.setFechaHoraInicio(toInstant(request.fechaHoraInicio()));
        evento.setFechaHoraFin(toInstant(request.fechaHoraFin()));
        evento.setCostoReferencial(request.costoReferencial());
        evento.setEstadoEvento(estadoEvento);
        evento.setUbicacion(ubicacion);
        evento.setAforoMaximo(normalizarAforoMaximo(request.aforoMaximo()));
        evento.setMetaTipo(normalizarTexto(request.metaTipo()));
        evento.setMetaValor(request.metaValor());
        evento.setEncuestaSatisfaccionHabilitado(Boolean.TRUE.equals(request.encuestaSatisfaccionHabilitado()) ? (byte) 1 : (byte) 0);
        evento.setTiempoCreado(ahora);
        evento.setTiempoActualizado(ahora);
        evento.setEventoActualizadoEn(ahora);
        evento.setUsuario(usuario);
        evento.setEdadMin(esPublicoObjetivo(request) ? request.edadMin() : null);
        evento.setEdadMax(esPublicoObjetivo(request) ? request.edadMax() : null);

        Evento eventoGuardado = eventoRepository.save(evento);
        guardarAgenda(eventoGuardado, request.agenda());
        guardarRequisitos(eventoGuardado, request.requisitos());
        guardarRecursos(eventoGuardado, request.recursos());

        BitacoraAccion bitacoraAccion = bitacoraAccionService.guardarAccion(
                "CREAR_EVENTO",
                "EVENTO",
                eventoGuardado.getId(),
                "Se creo el evento \"" + valorDetalle(eventoGuardado.getTitulo()) + "\" con estado " + estadoCodigo,
                usuario,
                httpServletRequest
        );
        notificacionService.notificarEventoCreadoAdministradores(eventoGuardado, usuario, bitacoraAccion);

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
        recursoEventoRepository.deleteAll(recursoEventoRepository.findByEvento(evento));
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
        Categoria categoria = obtenerCategoriaOpcional(request.categoriaId());
        AreaMunicipal areaMunicipal = obtenerAreaMunicipalOpcional(request.areaMunicipalId());
        Ubicacion ubicacion = obtenerUbicacionOpcional(request.ubicacionId());
        String estadoAnterior = evento.getEstadoEvento() != null ? evento.getEstadoEvento().getCodigo() : "";
        String estadoCodigo = obtenerEstadoActualizacion(evento, request);
        EstadoEvento estadoEvento = obtenerEstadoEvento(estadoCodigo);
        Instant ahora = Instant.now();

        evento.setTitulo(normalizarTexto(request.titulo(), 100));
        evento.setDescripcionBreve(normalizarTexto(request.descripcionBreve(), 45));
        evento.setDescripcion(normalizarTexto(request.descripcion()));
        evento.setCategoria(categoria);
        evento.setAreaMunicipal(areaMunicipal);
        evento.setFechaHoraInicio(toInstant(request.fechaHoraInicio()));
        evento.setFechaHoraFin(toInstant(request.fechaHoraFin()));
        evento.setCostoReferencial(request.costoReferencial());
        evento.setEstadoEvento(estadoEvento);
        evento.setUbicacion(ubicacion);
        evento.setAforoMaximo(normalizarAforoMaximo(request.aforoMaximo()));
        evento.setMetaTipo(normalizarTexto(request.metaTipo()));
        evento.setMetaValor(request.metaValor());
        evento.setEncuestaSatisfaccionHabilitado(Boolean.TRUE.equals(request.encuestaSatisfaccionHabilitado()) ? (byte) 1 : (byte) 0);
        evento.setTiempoActualizado(ahora);
        evento.setEventoActualizadoEn(ahora);
        evento.setEdadMin(esPublicoObjetivo(request) ? request.edadMin() : null);
        evento.setEdadMax(esPublicoObjetivo(request) ? request.edadMax() : null);

        agendaEventoRepository.deleteAll(agendaEventoRepository.findByEvento(evento));
        requisitoEventoRepository.deleteAll(requisitoEventoRepository.findByEvento(evento));
        recursoEventoRepository.deleteAll(recursoEventoRepository.findByEvento(evento));

        Evento eventoGuardado = eventoRepository.save(evento);
        guardarAgenda(eventoGuardado, request.agenda());
        guardarRequisitos(eventoGuardado, request.requisitos());
        guardarRecursos(eventoGuardado, request.recursos());

        bitacoraAccionService.guardarAccion(
                "ACTUALIZAR_EVENTO",
                "EVENTO",
                eventoGuardado.getId(),
                "Se actualizo el evento \"" + valorDetalle(eventoGuardado.getTitulo()) + "\" de estado "
                        + valorDetalle(estadoAnterior) + " a " + estadoCodigo,
                usuario,
                httpServletRequest
        );

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
        Instant ahora = Instant.now();

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

    private Integer calcularCompletitud(Evento evento) {
        if (evento == null) {
            return 0;
        }

        int total = 6; //Son 6 partes para colocar información sí o sí del evento
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
                && tieneRecursoPrincipal(request.recursos());
    }

    private boolean tieneAforoValido(EventoRegistroRequest request) {
        return request.aforoMaximo() == null || request.aforoMaximo() >= 0;
    }

    private Integer normalizarAforoMaximo(Integer aforoMaximo) {
        return aforoMaximo == null ? 0 : aforoMaximo;
    }

    private String obtenerEstadoActualizacion(Evento evento, EventoRegistroRequest request) {
        if (Boolean.TRUE.equals(request.enviarRevision())) {
            return estaCompletoParaRevision(request) ? "PARA_REVISION" : "BORRADOR";
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
                        && (hasText(recurso.nombreArchivo()) || hasText(recurso.urlRecurso()))
        );
    }

    private boolean tienePortada(Evento evento) {
        if (evento == null) {
            return false;
        }

        return recursoEventoRepository.findByEvento(evento).stream()
                .anyMatch(recurso -> recurso != null && "IMAGEN_PORTADA".equals(recurso.getTipoRecurso()));
    }

    private boolean esBorrador(Evento evento) {
        return evento != null
                && evento.getEstadoEvento() != null
                && "BORRADOR".equals(evento.getEstadoEvento().getCodigo());
    }

    private String valorDetalle(String valor) {
        return hasText(valor) ? valor.trim() : "Sin título";
    }

    private EstadoEvento obtenerEstadoEvento(String codigo) {
        return estadoEventoRepository.findByCodigo(codigo)
                .orElseGet(() -> {
                    if ("PARA_REVISION".equals(codigo)) {
                        return estadoEventoRepository.findByCodigo("EN_REVISION")
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "No existe el estado PARA_REVISION"));
                    }

                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No existe el estado " + codigo);
                });
    }

    private String obtenerCodigoEstadoFinalEvento() {
        if (estadoEventoRepository.findByCodigo("FINALIZADO").isPresent()) {
            return "FINALIZADO";
        }

        if (estadoEventoRepository.findByCodigo("CERRADO").isPresent()) {
            return "CERRADO";
        }

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "No existe un estado FINALIZADO o CERRADO para cerrar el evento"
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
                    recursoEvento.setUrlRecurso(normalizarTexto(recurso.urlRecurso(), 45));
                    recursoEvento.setNombreArchivo(normalizarTexto(recurso.nombreArchivo(), 45));
                    recursoEvento.setFechaSubida(Instant.now());
                    recursoEventoRepository.save(recursoEvento);
                });
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private LocalDateTime toLocalDateTime(Instant instant) {
        return instant == null ? null : LocalDateTime.ofInstant(instant, ZONA_LIMA);
    }

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
                        recurso.getTipoRecurso(),
                        recurso.getUrlRecurso(),
                        recurso.getNombreArchivo()
                ))
                .toList();
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
                    numeroObservacionesPendientes == 1 ? "1 observación del directivo": numeroObservacionesPendientes + "observaciones del directivo."));

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
