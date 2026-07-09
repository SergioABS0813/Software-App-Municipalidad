package com.tesis.municipalidadbackendapp.usuariosinternos.service;

import com.tesis.municipalidadbackendapp.eventos.entity.Evento;
import com.tesis.municipalidadbackendapp.usuariosinternos.entity.Usuario;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.io.UnsupportedEncodingException;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
@RequiredArgsConstructor
public class UsuarioNotificacionService {
    private static final ZoneId LIMA_ZONE = ZoneId.of("America/Lima");
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").withZone(LIMA_ZONE);
    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${app.mail.from:}")
    private String from;

    @Value("${app.mail.from-name:}")
    private String fromName;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    public void notificarCorreoAccesoSeleccionado(String email, String nombre) {
        enviarCorreoHtml(
                email,
                "Correo seleccionado para acceso a la plataforma institucional",
                construirPlantillaHtml(
                        "Correo seleccionado para acceso",
                        """
                        <p style="margin:0 0 14px;">Hola <strong>%s</strong>,</p>
                        <p>Se ha registrado este correo electrónico como medio de acceso a la plataforma institucional de eventos de la Municipalidad de San Miguel.</p>
                        """.formatted(escapeHtml(nombre))
                )
        );
    }

    public void notificarCorreoAnteriorReemplazado(String emailAnterior, String emailNuevo, String nombre) {
        enviarCorreoHtml(
                emailAnterior,
                "Cambio de correo de acceso a la plataforma institucional",
                construirPlantillaHtml(
                        "Correo de acceso actualizado",
                        """
                        <p style="margin:0 0 14px;">Hola <strong>%s</strong>,</p>
                        <p style="margin:0 0 14px;">Le informamos que este correo electrónico dejó de estar asociado como medio de acceso a la plataforma institucional de eventos de la Municipalidad de San Miguel.</p>
                        <p style="margin:0 0 14px;">El nuevo correo seleccionado para el acceso es:</p>
                        <p style="margin:0 0 0px; text-align:center"><strong>%s</strong></p>
                        """.formatted(escapeHtml(nombre), escapeHtml(emailNuevo))
                )
        );
    }

    public void notificarActualizacionCuenta(String email, String nombre, String cambios) {
        enviarCorreoHtml(
                email,
                "Actualización de cuenta institucional",
                construirPlantillaHtml(
                        "Cuenta institucional actualizada",
                        """
                        <p style="margin:0 0 14px;">Hola <strong>%s</strong>,</p>
                        <p style="margin:0 0 14px;">Te informamos que se actualizaron los siguientes datos de tu cuenta institucional:</p>
                        <p style="margin:0 0 0px; text-align:center"><strong>%s</strong></p>
                        """.formatted(escapeHtml(nombre), escapeHtml(cambios))
                )
        );
    }


    public void enviarRecordatorioEventoUnaHora(Usuario operativo, Evento evento) {
        if (operativo == null || evento == null || !StringUtils.hasText(operativo.getEmail())) {
            return;
        }

        String fechaEvento = formatDateTime(evento.getFechaHoraInicio());
        String ubicacion = evento.getUbicacion() != null && StringUtils.hasText(evento.getUbicacion().getNombre())
                ? evento.getUbicacion().getNombre()
                : "Por confirmar";
        String direccion = evento.getUbicacion() != null && StringUtils.hasText(evento.getUbicacion().getDireccion())
                ? evento.getUbicacion().getDireccion()
                : "Por confirmar";

        enviarCorreoHtml(
                operativo.getEmail(),
                "Recordatorio operativo: evento inicia en 1 hora - " + evento.getTitulo(),
                construirPlantillaHtml(
                        "Evento asignado inicia en 1 hora",
                        """
                        <h1 style="margin:0 0 16px;font-size:18px;line-height:1.3;font-weight:700;color:#0f172a;">Evento asignado inicia en 1 hora</h1>
                        <p style="margin:0 0 14px;">Hola <strong>%s</strong>,</p>
                        <p style="margin:0 0 14px;">Te recordamos que tienes asignado el control del evento <strong>%s</strong>, que inicia aproximadamente en 1 hora.</p>
                        <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%%;margin:18px 0;border-collapse:collapse;font-size:14px;background:#ffffff;">
                          <tr><td style="padding:8px 0;color:#526b85;width:145px;">Fecha y hora</td><td style="padding:8px 0;color:#0f172a;">%s</td></tr>
                          <tr><td style="padding:8px 0;color:#526b85;">Lugar</td><td style="padding:8px 0;color:#0f172a;">%s</td></tr>
                          <tr><td style="padding:8px 0;color:#526b85;">Direccion</td><td style="padding:8px 0;color:#0f172a;">%s</td></tr>
                        </table>
                        <p style="margin:0;">Ingresa al panel operativo para validar asistencia mediante QR o busqueda manual cuando corresponda.</p>
                        """.formatted(
                                escapeHtml(operativo.getNombre()),
                                escapeHtml(evento.getTitulo()),
                                escapeHtml(fechaEvento),
                                escapeHtml(ubicacion),
                                escapeHtml(direccion)
                        )
                )
        );
    }
    private void enviarCorreoHtml(String email, String subject, String html) {
        if (!mailEnabled) {
            log.info("Notificacion de cambio de correo omitida porque app.mail.enabled=false. email={}", email);
            return;
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            log.warn("No hay JavaMailSender disponible para enviar notificacion de cambio de correo. email={}", email);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            if (StringUtils.hasText(from)) {
                helper.setFrom(from, fromName);
            }
            helper.setTo(email);
            helper.setSubject(subject);
            helper.setText(html, true);

            mailSender.send(message);
            log.info("Notificacion de cambio de correo enviada. email={}", email);
        } catch (MailException | MessagingException exception) {
            log.warn("No se pudo enviar notificacion de cambio de correo. email={}", email, exception);
        } catch (UnsupportedEncodingException e) {
            throw new RuntimeException(e);
        }
    }

    private String formatDateTime(Instant instant) {
        if (instant == null) {
            return "Por confirmar";
        }

        return DATE_TIME_FORMATTER.format(instant);
    }
    private String construirPlantillaHtml(String titulo, String contenido) {
        return """
                <!doctype html>
                <html lang="es">
                  <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>%s</title>
                  </head>
                  <body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
                    <table role="presentation" width="100%%" cellspacing="0" cellpadding="0";style="padding:28px 14px;">
                      <tr>
                        <td align="center">
                          <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:550px;background:#ffffff;border:1px solid #1f8bf2;border-radius:10px;overflow:hidden;">
                            <tr>
                              <td style="background:#1f86e8;padding:24px 22px 22px;text-align:center;color:#ffffff;">
                                <div style="font-size:24px;line-height:1.2;font-weight:800;letter-spacing:.2px;">
                                  <span style="color:#084c8d;">Municipalidad</span> de San Miguel
                                </div>
                                <div style="margin-top:5px;font-size:18px;font-weight:700;">Sistema de Gestión de Eventos</div>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:20px 32px 24px;font-size:14px;line-height:1.65;">
                                %s
                              </td>
                            </tr>
                            <tr>
                              <td style="background:#f8fbfd;border-top:1px solid #e2edf5;padding:17px 32px;color:#2f5276;font-size:12.5px;line-height:1.5;">
                                Este mensaje fue generado automáticamente. Si no solicitaste esta operación, puedes comunicarte con la Municipalidad de San Miguel.
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </body>
                </html>
                """.formatted(escapeHtml(titulo), contenido);
    }

    private String escapeHtml(String value) {
        if (value == null) {
            return "";
        }

        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
