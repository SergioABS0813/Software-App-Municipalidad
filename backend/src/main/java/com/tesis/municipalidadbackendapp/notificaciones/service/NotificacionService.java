package com.tesis.municipalidadbackendapp.notificaciones.service;

import static com.tesis.municipalidadbackendapp.common.FechaHoraUtils.ahoraLima;

import com.tesis.municipalidadbackendapp.bitacora.entity.BitacoraAccion;
import com.tesis.municipalidadbackendapp.common.UsuarioAutenticadoService;
import com.tesis.municipalidadbackendapp.eventos.entity.Evento;
import com.tesis.municipalidadbackendapp.notificaciones.dto.NotificacionResponseDto;
import com.tesis.municipalidadbackendapp.notificaciones.dto.NotificacionesPanelDto;
import com.tesis.municipalidadbackendapp.notificaciones.entity.Notificacion;
import com.tesis.municipalidadbackendapp.notificaciones.repository.NotificacionRepository;
import com.tesis.municipalidadbackendapp.usuariosinternos.entity.Usuario;
import com.tesis.municipalidadbackendapp.usuariosinternos.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificacionService {
    private static final ZoneId ZONA_LIMA = ZoneId.of("America/Lima");
    private static final DateTimeFormatter FORMATO_HORA = DateTimeFormatter.ofPattern("HH:mm");

    private final NotificacionRepository notificacionRepository;
    private final UsuarioRepository usuarioRepository;
    private final UsuarioAutenticadoService usuarioAutenticadoService;

    public NotificacionesPanelDto obtenerPanelNotificaciones(boolean soloNoLeidas) {
        Integer usuarioDestinoId = resolverUsuarioDestinoId();
        Instant ahora = ahoraLima();
        List<Notificacion> notificaciones = soloNoLeidas
                ? notificacionRepository.findNoLeidasVigentesByUsuarioDestinoIdOrderByFechaCreacionDesc(usuarioDestinoId, ahora)
                : notificacionRepository.findVigentesByUsuarioDestinoIdOrderByFechaCreacionDesc(usuarioDestinoId, ahora);

        Integer total = notificacionRepository.countVigentesByUsuarioDestinoId(usuarioDestinoId, ahora);
        Integer noLeidas = notificacionRepository.countNoLeidasVigentesByUsuarioDestinoId(usuarioDestinoId, ahora);

        List<NotificacionResponseDto> notificacionesDTO = notificaciones.stream()
                .map(this::mapToDTO)
                .toList();

        return new NotificacionesPanelDto(total, noLeidas, notificacionesDTO);
    }

    public void marcarComoLeida(Integer notificacionId) {
        Integer usuarioDestinoId = resolverUsuarioDestinoId();
        Notificacion notificacion = notificacionRepository
                .findById(notificacionId)
                .orElseThrow(() -> new RuntimeException("Notificacion no encontrada"));

        if (!notificacion.getUsuarioDestino().getId().equals(usuarioDestinoId)) {
            throw new RuntimeException("No tienes permiso para modificar esta notificacion");
        }

        notificacion.setLeida((byte) 1);
        notificacion.setFechaLectura(ahoraLima());
        notificacionRepository.save(notificacion);
    }

    public void notificarEventoObservadoAdministradores(Evento evento, Usuario directivo, BitacoraAccion bitacoraAccion) {
        notificarAdministradores(
                "Evento observado",
                "%s observÃ³ \"%s\".".formatted(nombreUsuario(directivo), tituloEvento(evento)),
                "EVENTO_OBSERVADO",
                "/admin/eventos/%d/editar".formatted(evento.getId()),
                directivo,
                bitacoraAccion
        );
    }

    public void notificarEventoCreadoAdministradores(Evento evento, Usuario administrador, BitacoraAccion bitacoraAccion) {
        notificarAdministradores(
                "Nuevo evento creado",
                "%s cre\u00f3 el evento \"%s\".".formatted(nombreUsuario(administrador), tituloEvento(evento)),
                "EVENTO_CREADO",
                "/admin/eventos/%d/editar".formatted(evento.getId()),
                administrador,
                bitacoraAccion,
                true
        );
    }

    public void notificarEventoPendienteRevisionDirectivos(Evento evento, Usuario administrador, BitacoraAccion bitacoraAccion) {
        notificarDirectivos(
                "Evento pendiente de revision",
                "%s envio \"%s\" a revision directiva.".formatted(nombreUsuario(administrador), tituloEvento(evento)),
                "EVENTO_PENDIENTE_REVISION",
                "/directivo/eventos/%d/revision".formatted(evento.getId()),
                administrador,
                bitacoraAccion
        );
    }

    public void notificarEventoCorregidoRevisionDirectivos(Evento evento, Usuario administrador, BitacoraAccion bitacoraAccion) {
        notificarDirectivos(
                "Evento corregido para nueva revision",
                "%s corrigio \"%s\" y lo envio nuevamente a revision.".formatted(nombreUsuario(administrador), tituloEvento(evento)),
                "EVENTO_CORREGIDO_REVISION",
                "/directivo/eventos/%d/revision".formatted(evento.getId()),
                administrador,
                bitacoraAccion
        );
    }

    public void notificarEventoPublicadoDirectivos(Evento evento, Usuario directivo, BitacoraAccion bitacoraAccion) {
        notificarDirectivos(
                "Evento publicado por otro directivo",
                "%s publico el evento \"%s\".".formatted(nombreUsuario(directivo), tituloEvento(evento)),
                "EVENTO_PUBLICADO_DIRECTIVO",
                "/directivo/eventos/%d/reporte".formatted(evento.getId()),
                directivo,
                bitacoraAccion,
                true
        );
    }

    public void notificarEventoObservadoDirectivos(Evento evento, Usuario directivo, BitacoraAccion bitacoraAccion) {
        notificarDirectivos(
                "Evento observado por otro directivo",
                "%s observo el evento \"%s\".".formatted(nombreUsuario(directivo), tituloEvento(evento)),
                "EVENTO_OBSERVADO_DIRECTIVO",
                "/directivo/eventos/%d/revision".formatted(evento.getId()),
                directivo,
                bitacoraAccion,
                true
        );
    }

    public void notificarEventoCanceladoDirectivos(Evento evento, Usuario usuario, BitacoraAccion bitacoraAccion) {
        notificarDirectivos(
                "Evento cancelado",
                "%s cancelo el evento \"%s\".".formatted(nombreUsuario(usuario), tituloEvento(evento)),
                "EVENTO_CANCELADO_DIRECTIVO",
                "/directivo/eventos/%d/reporte".formatted(evento.getId()),
                usuario,
                bitacoraAccion,
                true
        );
    }

    public void notificarEventoProximoIniciarDirectivos(Evento evento, Usuario sistema, BitacoraAccion bitacoraAccion) {
        notificarDirectivos(
                "Evento proximo a iniciar",
                "\"%s\" inicia pronto a las %s.".formatted(tituloEvento(evento), horaInicio(evento)),
                "EVENTO_PROXIMO_INICIAR",
                "/directivo/eventos/%d/reporte".formatted(evento.getId()),
                sistema,
                bitacoraAccion
        );
    }

    public void notificarEventoPublicadoAdministradores(Evento evento, Usuario directivo, BitacoraAccion bitacoraAccion) {
        notificarAdministradores(
                "Evento publicado",
                "%s publico el evento \"%s\".".formatted(nombreUsuario(directivo), tituloEvento(evento)),
                "EVENTO_PUBLICADO",
                "/admin/eventos/%d/detalle".formatted(evento.getId()),
                directivo,
                bitacoraAccion
        );
    }

    public void notificarEventoCanceladoAdministradores(Evento evento, Usuario usuario, BitacoraAccion bitacoraAccion) {
        notificarAdministradores(
                "Evento cancelado",
                "%s cancelo el evento \"%s\".".formatted(nombreUsuario(usuario), tituloEvento(evento)),
                "EVENTO_CANCELADO",
                "/admin/eventos/%d/detalle".formatted(evento.getId()),
                usuario,
                bitacoraAccion,
                true
        );
    }

    public void notificarEventoIniciaMananaAdministradores(Evento evento, Usuario sistema, BitacoraAccion bitacoraAccion) {
        notificarAdministradores(
                "Evento inicia maÃ±ana",
                "\"%s\" inicia maÃ±ana a las %s.".formatted(tituloEvento(evento), horaInicio(evento)),
                "EVENTO_INICIA_MANANA",
                "/admin/eventos/%d/detalle".formatted(evento.getId()),
                sistema,
                bitacoraAccion
        );
    }

    public void notificarUsuarioCreadoAdministradores(Usuario usuarioCreado, Usuario administrador, BitacoraAccion bitacoraAccion) {
        notificarAdministradores(
                "Nuevo usuario registrado",
                "Se registrÃ³ el usuario interno %s.".formatted(nombreUsuario(usuarioCreado)),
                "USUARIO_CREADO",
                "/admin/usuarios-internos/%d/detalle".formatted(usuarioCreado.getId()),
                administrador,
                bitacoraAccion
        );
    }

    public void notificarUsuarioDesactivadoAdministradores(Usuario usuarioDesactivado, Usuario administrador, BitacoraAccion bitacoraAccion) {
        notificarAdministradores(
                "Usuario desactivado",
                "%s fue desactivado.".formatted(nombreUsuario(usuarioDesactivado)),
                "USUARIO_DESACTIVADO",
                "/admin/usuarios-internos/%d/detalle".formatted(usuarioDesactivado.getId()),
                administrador,
                bitacoraAccion
        );
    }

    public void notificarErrorRecursoEventoAdministradores(Evento evento, Usuario usuario, BitacoraAccion bitacoraAccion) {
        notificarAdministradores(
                "Error al cargar recurso",
                "Error al cargar recursos de \"%s\".".formatted(tituloEvento(evento)),
                "ERROR_RECURSO_EVENTO",
                "/admin/eventos/%d/editar".formatted(evento.getId()),
                usuario,
                bitacoraAccion
        );
    }

    private NotificacionResponseDto mapToDTO(Notificacion notificacion) {
        boolean esLeida = notificacion.getLeida() != null && notificacion.getLeida() == 1;
        return new NotificacionResponseDto(
                notificacion.getId(),
                notificacion.getTitulo(),
                notificacion.getMensaje(),
                notificacion.getTipo(),
                esLeida,
                notificacion.getUrlDestino(),
                notificacion.getFechaCreacion()
        );
    }

    private void notificarAdministradores(
            String titulo,
            String mensaje,
            String tipo,
            String urlDestino,
            Usuario usuarioOrigen,
            BitacoraAccion bitacoraAccion
    ) {
        notificarAdministradores(titulo, mensaje, tipo, urlDestino, usuarioOrigen, bitacoraAccion, false);
    }

    private void notificarAdministradores(
            String titulo,
            String mensaje,
            String tipo,
            String urlDestino,
            Usuario usuarioOrigen,
            BitacoraAccion bitacoraAccion,
            boolean excluirUsuarioOrigen
    ) {
        notificarRol("ADMINISTRADOR", titulo, mensaje, tipo, urlDestino, usuarioOrigen, bitacoraAccion, excluirUsuarioOrigen);
    }

    private void notificarDirectivos(
            String titulo,
            String mensaje,
            String tipo,
            String urlDestino,
            Usuario usuarioOrigen,
            BitacoraAccion bitacoraAccion
    ) {
        notificarDirectivos(titulo, mensaje, tipo, urlDestino, usuarioOrigen, bitacoraAccion, false);
    }

    private void notificarDirectivos(
            String titulo,
            String mensaje,
            String tipo,
            String urlDestino,
            Usuario usuarioOrigen,
            BitacoraAccion bitacoraAccion,
            boolean excluirUsuarioOrigen
    ) {
        notificarRol("DIRECTIVO", titulo, mensaje, tipo, urlDestino, usuarioOrigen, bitacoraAccion, excluirUsuarioOrigen);
    }

    private void notificarRol(
            String rol,
            String titulo,
            String mensaje,
            String tipo,
            String urlDestino,
            Usuario usuarioOrigen,
            BitacoraAccion bitacoraAccion,
            boolean excluirUsuarioOrigen
    ) {
        if (usuarioOrigen == null || bitacoraAccion == null) {
            return;
        }

        usuarioRepository.findByRolCodigoOrNombre(rol).forEach(usuarioDestino -> {
            if (excluirUsuarioOrigen && usuarioOrigen.getId() != null && usuarioOrigen.getId().equals(usuarioDestino.getId())) {
                return;
            }

            Instant fechaCreacion = ahoraLima();
            Notificacion notificacion = new Notificacion();
            notificacion.setTitulo(titulo);
            notificacion.setMensaje(mensaje);
            notificacion.setTipo(tipo);
            notificacion.setUrlDestino(urlDestino);
            notificacion.setLeida((byte) 0);
            notificacion.setFechaCreacion(fechaCreacion);
            notificacion.setFechaExpiracion(fechaCreacion.plus(28, ChronoUnit.DAYS));
            notificacion.setUsuarioOrigen(usuarioOrigen);
            notificacion.setUsuarioDestino(usuarioDestino);
            notificacion.setBitacoraAccion(bitacoraAccion);
            notificacionRepository.save(notificacion);
        });
    }

    private String nombreUsuario(Usuario usuario) {
        if (usuario == null || usuario.getNombre() == null || usuario.getNombre().isBlank()) {
            return "Usuario";
        }

        return usuario.getNombre().trim();
    }

    private Integer resolverUsuarioDestinoId() {
        return usuarioAutenticadoService.obtenerUsuarioAutenticado().getId();
    }

    private String tituloEvento(Evento evento) {
        if (evento == null || evento.getTitulo() == null || evento.getTitulo().isBlank()) {
            return "Sin titulo";
        }

        return evento.getTitulo().trim();
    }

    private String horaInicio(Evento evento) {
        if (evento == null || evento.getFechaHoraInicio() == null) {
            return "--:--";
        }

        return LocalDateTime.ofInstant(evento.getFechaHoraInicio(), ZONA_LIMA).format(FORMATO_HORA);
    }
}

