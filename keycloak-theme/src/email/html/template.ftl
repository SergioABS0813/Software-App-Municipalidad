<#--
  WARNING: Before modifying this file, run the following command:
  
  $ npx keycloakify own --path "email/html/template.ftl"
  
  This file is provided by @keycloakify/email-native version 260007.0.0.
  It was copied into your repository by the postinstall script: `keycloakify sync-extensions`.
-->

<#macro emailLayout>
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Municipalidad de San Miguel</title>
  </head>

  <body style="margin:0;padding:0;background:#f5f8fc;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f8fc;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border:1px solid #d7e8fb;border-radius:10px;overflow:hidden;">
            <tr>
              <td style="background:#2388e8;padding:22px 20px 20px;text-align:center;color:#ffffff;">
                <div style="font-size:24px;line-height:1.16;font-weight:800;letter-spacing:0;">
                  <span style="background:#f8d96b;color:#111827;padding:0 3px;">Municipalidad</span> de San Miguel
                </div>
                <div style="margin-top:6px;font-size:17px;line-height:1.25;font-weight:700;">
                  Sistema de Gesti&oacute;n de Eventos
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:24px 32px 26px;font-size:14px;line-height:1.58;color:#111827;">
                <#nested>
              </td>
            </tr>

            <tr>
              <td style="background:#f8fbfe;border-top:1px solid #e2edf5;padding:14px 32px;color:#385b7c;font-size:12px;line-height:1.45;">
                Este mensaje fue generado autom&aacute;ticamente. Si no solicitaste esta operaci&oacute;n, puedes comunicarte con la Municipalidad de San Miguel.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
</#macro>