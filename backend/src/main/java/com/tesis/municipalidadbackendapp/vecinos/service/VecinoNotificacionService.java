package com.tesis.municipalidadbackendapp.vecinos.service;

import com.tesis.municipalidadbackendapp.eventos.entity.Evento;
import com.tesis.municipalidadbackendapp.inscripciones.entity.Inscripcion;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Base64;

@Slf4j
@Service
@RequiredArgsConstructor
public class VecinoNotificacionService {
    private record InlineImage(String contentId, byte[] bytes, String contentType) {
    }

    private static final ZoneId LIMA_ZONE = ZoneId.of("America/Lima");
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").withZone(LIMA_ZONE);

    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${app.mail.from:}")
    private String from;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${app.frontend.base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    public void notificarCambioContacto(
            String emailDestino,
            String nombre,
            String correoActual,
            String celularActual,
            boolean cambioCorreo,
            boolean cambioCelular
    ) {
        if (!StringUtils.hasText(emailDestino)) {
            return;
        }

        String detalleCambio = construirDetalleCambio(correoActual, celularActual, cambioCorreo, cambioCelular);

        enviarCorreoHtml(
                emailDestino,
                "Actualización de datos de contacto",
                construirPlantillaHtml(
                        "Datos de contacto actualizados",
                        """
                        <p>Hola <strong>%s</strong>,</p>
                        <p>Te informamos que un administrador de la Municipalidad de San Miguel actualizó datos sensibles de tu cuenta vecinal.</p>
                        %s
                        <p>Si no reconoces esta actualización, comunícate con la Municipalidad de San Miguel para revisar el caso.</p>
                        """.formatted(escapeHtml(nombre), detalleCambio)
                )
        );
    }

    public void notificarCambiosCuenta(
            String emailDestino,
            String nombre,
            boolean cambioCelular,
            boolean cambioFechaNacimiento,
            boolean cambioAceptacionDatos
    ) {
        if (!StringUtils.hasText(emailDestino)) {
            return;
        }

        enviarCorreoHtml(
                emailDestino,
                "Cambios en tu cuenta vecinal",
                construirPlantillaHtml(
                        "Cambios en tu cuenta",
                        """
                        <p style="margin:0 0 14px;">Hola <strong>%s</strong>,</p>
                        <p style="margin:0 0 14px;">Te informamos que se realizaron cambios en los datos de tu cuenta vecinal.</p>
                        %s
                        <p style="margin:0;">Si no reconoces esta actualizacion, comunicate con la Municipalidad de San Miguel.</p>
                        """.formatted(escapeHtml(nombre), construirDetalleCambiosCuenta(cambioCelular, cambioFechaNacimiento, cambioAceptacionDatos))
                )
        );
    }

    public void enviarConstanciaInscripcion(Inscripcion inscripcion) {
        enviarConstanciaInscripcion(inscripcion, null);
    }

    public void enviarConstanciaInscripcion(Inscripcion inscripcion, String qrDataUrl) {
        if (inscripcion == null || inscripcion.getVecino() == null || inscripcion.getEvento() == null) {
            return;
        }

        String emailDestino = inscripcion.getVecino().getEmail();
        if (!StringUtils.hasText(emailDestino)) {
            return;
        }

        Evento evento = inscripcion.getEvento();
        String fechaEvento = formatDateTime(evento.getFechaHoraInicio());
        String ubicacion = evento.getUbicacion() != null && StringUtils.hasText(evento.getUbicacion().getNombre())
                ? evento.getUbicacion().getNombre()
                : "Por confirmar";
        String direccion = evento.getUbicacion() != null && StringUtils.hasText(evento.getUbicacion().getDireccion())
                ? evento.getUbicacion().getDireccion()
                : "Por confirmar";
        String qrContentId = "qrInscripcion" + inscripcion.getId();
        InlineImage qrImage = construirQrInlineImage(qrDataUrl, qrContentId);
        if (qrImage == null) {
            log.warn("No se adjunto QR en correo de inscripcion. inscripcionId={}", inscripcion.getId());
        }
        String qrHtml = construirQrInscripcionHtml(qrImage);

        enviarCorreoHtml(
                emailDestino,
                "Constancia de inscripcion - " + evento.getTitulo(),
                construirPlantillaHtml(
                        "Inscripcion confirmada",
                        """
                        <p>Hola <strong>%s</strong>,</p>
                        <p>Tu inscripcion al evento <strong>%s</strong> fue registrada correctamente.</p>
                        <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%%;margin:22px 0;border-collapse:collapse;font-size:16px;">
                          <tr><td style="padding:10px 0;color:#526b85;width:170px;">Codigo</td><td style="padding:10px 0;font-weight:800;color:#0f172a;">%s</td></tr>
                          <tr><td style="padding:10px 0;color:#526b85;">Fecha y hora</td><td style="padding:10px 0;">%s</td></tr>
                          <tr><td style="padding:10px 0;color:#526b85;">Lugar</td><td style="padding:10px 0;">%s</td></tr>
                          <tr><td style="padding:10px 0;color:#526b85;">Direccion</td><td style="padding:10px 0;">%s</td></tr>
                        </table>
                        <p>Presenta este codigo o el QR el dia del evento para validar tu participacion.</p>
                        %s
                        """.formatted(
                                escapeHtml(StringUtils.hasText(inscripcion.getVecino().getNombre()) ? inscripcion.getVecino().getNombre() : "vecino"),
                                escapeHtml(evento.getTitulo()),
                                escapeHtml(inscripcion.getCodigoInscripcion()),
                                escapeHtml(fechaEvento),
                                escapeHtml(ubicacion),
                                escapeHtml(direccion),
                                qrHtml
                        )
                ),
                qrImage
        );
    }

    public void enviarCorreoEventoCancelado(Inscripcion inscripcion, String motivo) {
        if (inscripcion == null || inscripcion.getVecino() == null || inscripcion.getEvento() == null) {
            return;
        }

        String emailDestino = inscripcion.getVecino().getEmail();
        if (!StringUtils.hasText(emailDestino)) {
            return;
        }

        Evento evento = inscripcion.getEvento();
        String fechaEvento = formatDateTime(evento.getFechaHoraInicio());
        String ubicacion = evento.getUbicacion() != null && StringUtils.hasText(evento.getUbicacion().getNombre())
                ? evento.getUbicacion().getNombre()
                : "Por confirmar";

        enviarCorreoHtml(
                emailDestino,
                "Evento cancelado - " + evento.getTitulo(),
                construirPlantillaHtml(
                        "Evento cancelado",
                        """
                        <p style="margin:0 0 14px;">Hola <strong>%s</strong>,</p>
                        <p style="margin:0 0 14px;">Te informamos que el evento <strong>%s</strong> fue cancelado.</p>
                        <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%%;margin:18px 0;border-collapse:collapse;font-size:14px;">
                          <tr><td style="padding:8px 0;color:#526b85;width:145px;">Fecha y hora</td><td style="padding:8px 0;color:#0f172a;">%s</td></tr>
                          <tr><td style="padding:8px 0;color:#526b85;">Lugar</td><td style="padding:8px 0;color:#0f172a;">%s</td></tr>
                          <tr><td style="padding:8px 0;color:#526b85;">Motivo</td><td style="padding:8px 0;color:#0f172a;">%s</td></tr>
                        </table>
                        <p style="margin:0;">Tu inscripcion y el codigo QR asociado quedaron cancelados automaticamente.</p>
                        """.formatted(
                                escapeHtml(StringUtils.hasText(inscripcion.getVecino().getNombre()) ? inscripcion.getVecino().getNombre() : "vecino"),
                                escapeHtml(evento.getTitulo()),
                                escapeHtml(fechaEvento),
                                escapeHtml(ubicacion),
                                escapeHtml(motivo)
                        )
                )
        );
    }

    public void enviarCorreoValoracionEvento(
            String emailDestino,
            String nombre,
            String tituloEvento,
            String token
    ) {
        if (!StringUtils.hasText(emailDestino) || !StringUtils.hasText(token)) {
            return;
        }

        String enlaceValoracion = construirEnlaceValoracion(token);

        enviarCorreoHtml(
                emailDestino,
                "Ayúdanos a mejorar: puntúa el evento al que asististe",
                construirPlantillaHtml(
                        "Valora tu experiencia",
                        """
                        <p>Hola <strong>%s</strong>,</p>
                        <p>Gracias por asistir al evento <strong>%s</strong>. Tu opiniÃ³n nos ayuda a mejorar las prÃ³ximas actividades municipales.</p>
                        <p style="margin:28px 0;text-align:center;">
                          <a href="%s" style="display:inline-block;background:#0a56c2;color:#ffffff;text-decoration:none;font-weight:800;border-radius:8px;padding:14px 24px;">
                            PuntÃºa el evento
                          </a>
                        </p>
                        <p style="color:#2f5276;">La valoraciÃ³n solo toma unos segundos.</p>
                        """.formatted(
                                escapeHtml(StringUtils.hasText(nombre) ? nombre : "vecino"),
                                escapeHtml(tituloEvento),
                                escapeHtml(enlaceValoracion)
                        )
                )
        );
    }

    private InlineImage construirQrInlineImage(String qrDataUrl, String contentId) {
        if (!StringUtils.hasText(qrDataUrl)) {
            return null;
        }

        String prefix = "data:image/png;base64,";
        if (!qrDataUrl.startsWith(prefix)) {
            log.warn("No se pudo incrustar QR en correo: formato de data URL no soportado.");
            return null;
        }

        try {
            byte[] bytes = Base64.getDecoder().decode(qrDataUrl.substring(prefix.length()));
            return new InlineImage(contentId, bytes, "image/png");
        } catch (IllegalArgumentException exception) {
            log.warn("No se pudo decodificar QR para correo de inscripcion.", exception);
            return null;
        }
    }

    private String construirQrInscripcionHtml(InlineImage qrImage) {
        if (qrImage == null) {
            return "";
        }

        return """
                <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%%;margin:22px 0 8px;border-collapse:collapse;">
                  <tr>
                    <td align="center" style="text-align:center;">
                      <p style="margin:0 0 12px;color:#526b85;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;">Codigo QR de acceso</p>
                      <img src="cid:%s" width="184" height="184" alt="Codigo QR de inscripcion" style="display:block;width:184px;height:184px;margin:0 auto;border:1px solid #d8e5f0;border-radius:10px;background:#ffffff;padding:8px;">
                    </td>
                  </tr>
                </table>
                """.formatted(qrImage.contentId());
    }

    private String formatDateTime(Instant instant) {
        if (instant == null) {
            return "Por confirmar";
        }

        return DATE_TIME_FORMATTER.format(instant);
    }

    private String construirEnlaceValoracion(String token) {
        String baseUrl = StringUtils.hasText(frontendBaseUrl)
                ? frontendBaseUrl.stripTrailing()
                : "http://localhost:5173";

        return baseUrl + "/valorar-evento?token=" + URLEncoder.encode(token, StandardCharsets.UTF_8);
    }

    private String construirDetalleCambio(String correoActual, String celularActual, boolean cambioCorreo, boolean cambioCelular) {
        StringBuilder detalle = new StringBuilder("<ul style=\"margin:18px 0 18px 22px;padding:0;\">");

        if (cambioCorreo) {
            detalle.append("<li>Correo actualizado: <strong>")
                    .append(escapeHtml(correoActual))
                    .append("</strong></li>");
        }

        if (cambioCelular) {
            detalle.append("<li>Celular actualizado: <strong>")
                    .append(escapeHtml(celularActual))
                    .append("</strong></li>");
        }

        detalle.append("</ul>");
        return detalle.toString();
    }

    private String construirDetalleCambiosCuenta(boolean cambioCelular, boolean cambioFechaNacimiento, boolean cambioAceptacionDatos) {
        StringBuilder detalle = new StringBuilder("<ul style=\"margin:16px 0 16px 20px;padding:0;\">");

        if (cambioCelular) {
            detalle.append("<li>Celular actualizado.</li>");
        }

        if (cambioFechaNacimiento) {
            detalle.append("<li>Fecha de nacimiento actualizada.</li>");
        }

        if (cambioAceptacionDatos) {
            detalle.append("<li>Preferencia de tratamiento de datos actualizada.</li>");
        }

        detalle.append("</ul>");
        return detalle.toString();
    }

    private void enviarCorreoHtml(String email, String subject, String html) {
        enviarCorreoHtml(email, subject, html, null);
    }

    private void enviarCorreoHtml(String email, String subject, String html, InlineImage inlineImage) {
        if (!mailEnabled) {
            log.info("Notificacion vecinal omitida porque app.mail.enabled=false. email={}", email);
            return;
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            log.warn("No hay JavaMailSender disponible para enviar notificacion vecinal. email={}", email);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = inlineImage != null
                    ? new MimeMessageHelper(message, MimeMessageHelper.MULTIPART_MODE_RELATED, "UTF-8")
                    : new MimeMessageHelper(message, false, "UTF-8");
            if (StringUtils.hasText(from)) {
                helper.setFrom(from);
            }
            helper.setTo(email);
            helper.setSubject(subject);
            helper.setText(html, true);

            if (inlineImage != null) {
                helper.addInline(
                        inlineImage.contentId(),
                        new ByteArrayResource(inlineImage.bytes()),
                        inlineImage.contentType()
                );
            }

            mailSender.send(message);
            log.info("Notificacion vecinal enviada. email={}", email);
        } catch (MailException | MessagingException exception) {
            log.warn("No se pudo enviar notificacion vecinal. email={}", email, exception);
        }
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
                  <body style="margin:0;padding:0;background:#eef6fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
                    <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background:#eef6fb;padding:28px 14px;">
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
                                <h1 style="margin:0 0 16px;font-size:18px;line-height:1.3;font-weight:700;color:#0f172a;">%s</h1>
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
                """.formatted(escapeHtml(titulo), escapeHtml(titulo), contenido);
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
