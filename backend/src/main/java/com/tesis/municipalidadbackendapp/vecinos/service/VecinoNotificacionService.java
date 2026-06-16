package com.tesis.municipalidadbackendapp.vecinos.service;

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

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Slf4j
@Service
@RequiredArgsConstructor
public class VecinoNotificacionService {
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

    private void enviarCorreoHtml(String email, String subject, String html) {
        if (!mailEnabled) {
            log.info("Notificación de cambio de contacto vecinal omitida porque app.mail.enabled=false. email={}", email);
            return;
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            log.warn("No hay JavaMailSender disponible para enviar notificación vecinal. email={}", email);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            if (StringUtils.hasText(from)) {
                helper.setFrom(from);
            }
            helper.setTo(email);
            helper.setSubject(subject);
            helper.setText(html, true);

            mailSender.send(message);
            log.info("Notificación de cambio de contacto vecinal enviada. email={}", email);
        } catch (MailException | MessagingException exception) {
            log.warn("No se pudo enviar notificación de cambio de contacto vecinal. email={}", email, exception);
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
                          <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:814px;background:#ffffff;border:1px solid #1f8bf2;border-radius:10px;overflow:hidden;">
                            <tr>
                              <td style="background:#1f86e8;padding:38px 24px 34px;text-align:center;color:#ffffff;">
                                <div style="font-size:31px;line-height:1.2;font-weight:800;letter-spacing:.2px;">
                                  <span style="color:#084c8d;">Municipalidad</span> de San Miguel
                                </div>
                                <div style="margin-top:14px;font-size:16px;font-weight:700;">Sistema de Gestión de Eventos</div>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:38px 36px 42px;font-size:18px;line-height:1.55;">
                                <h1 style="margin:0 0 24px;font-size:20px;line-height:1.3;font-weight:500;color:#0f172a;">%s</h1>
                                %s
                              </td>
                            </tr>
                            <tr>
                              <td style="background:#f8fbfd;border-top:1px solid #e2edf5;padding:22px 36px;color:#2f5276;font-size:14px;line-height:1.45;">
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
