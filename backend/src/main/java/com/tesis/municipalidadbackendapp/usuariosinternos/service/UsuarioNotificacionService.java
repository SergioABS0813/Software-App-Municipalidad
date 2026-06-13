package com.tesis.municipalidadbackendapp.usuariosinternos.service;

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

@Slf4j
@Service
@RequiredArgsConstructor
public class UsuarioNotificacionService {
    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${app.mail.from:}")
    private String from;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    public void notificarCorreoAccesoSeleccionado(String email, String nombre) {
        enviarCorreoHtml(
                email,
                "Correo seleccionado para acceso a la plataforma institucional",
                construirPlantillaHtml(
                        "Correo seleccionado para acceso",
                        """
                        <p>Hola <strong>%s</strong>,</p>
                        <p>Se ha registrado este correo electronico como medio de acceso a la plataforma institucional de eventos de la Municipalidad de San Miguel.</p>
                        <p>Si no reconoces esta accion o no perteneces a la entidad, comunicate con la Municipalidad de San Miguel para revisar el caso.</p>
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
                        <p>Hola <strong>%s</strong>,</p>
                        <p>Te informamos que este correo electronico dejo de estar asociado como medio de acceso a la plataforma institucional de eventos de la Municipalidad de San Miguel.</p>
                        <p>El nuevo correo seleccionado para el acceso es:</p>
                        <p><strong>%s</strong></p>
                        <p>Si no reconoces esta accion o no perteneces a la entidad, comunicate con la Municipalidad de San Miguel para revisar el caso.</p>
                        """.formatted(escapeHtml(nombre), escapeHtml(emailNuevo))
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
                helper.setFrom(from);
            }
            helper.setTo(email);
            helper.setSubject(subject);
            helper.setText(html, true);

            mailSender.send(message);
            log.info("Notificacion de cambio de correo enviada. email={}", email);
        } catch (MailException | MessagingException exception) {
            log.warn("No se pudo enviar notificacion de cambio de correo. email={}", email, exception);
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
                                <div style="margin-top:14px;font-size:16px;font-weight:700;">Sistema de Gestion de Eventos</div>
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
                                Este mensaje fue generado automaticamente. Si no solicitaste esta operacion, puedes comunicarte con la Municipalidad de San Miguel.
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
