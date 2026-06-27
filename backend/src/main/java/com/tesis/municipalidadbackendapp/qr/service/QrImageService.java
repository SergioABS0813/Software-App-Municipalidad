package com.tesis.municipalidadbackendapp.qr.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.geom.RoundRectangle2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class QrImageService {

    public byte[] generarQrPngConLogo(String contenidoQr) {
        try {

            int qrSize = 400;

            Map<EncodeHintType, Object> hints = Map.of(
                    EncodeHintType.CHARACTER_SET, "UTF-8",
                    EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.H,
                    EncodeHintType.MARGIN, 2
            );

            QRCodeWriter qrCodeWriter = new QRCodeWriter();

            BitMatrix bitMatrix = qrCodeWriter.encode(
                    contenidoQr,
                    BarcodeFormat.QR_CODE,
                    qrSize,
                    qrSize,
                    hints
            );

            BufferedImage qrImage = MatrixToImageWriter.toBufferedImage(bitMatrix);

            ClassPathResource logoResource = new ClassPathResource("qr/municipalidad-logo.png");
            BufferedImage logoImage = ImageIO.read(logoResource.getInputStream());

            BufferedImage qrConLogo = agregarLogoAlCentro(qrImage, logoImage);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            ImageIO.write(qrConLogo, "PNG", outputStream);

            return outputStream.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("No se pudo generar el código QR con logo", e);
        }
    }

    private BufferedImage agregarLogoAlCentro(BufferedImage qrImage, BufferedImage logoImage) {
        int qrWidth = qrImage.getWidth();
        int qrHeight = qrImage.getHeight();

        int logoOriginalWidth = logoImage.getWidth();
        int logoOriginalHeight = logoImage.getHeight();

        int logoSize = Math.min(qrWidth, qrHeight) / 5;

        double escala = Math.min((double) qrWidth / 5 / logoOriginalWidth, (double) qrHeight / 5 / logoOriginalHeight);
        int logoFinalWidth = (int) (logoOriginalWidth * escala);
        int logoFinalHeight = (int) (logoOriginalHeight * escala);


        int logoX = (qrWidth - logoFinalWidth) / 2;
        int logoY = (qrHeight - logoFinalHeight) / 2;

        int padding = qrWidth / 35;
        int fondoX = logoX - padding;
        int fondoY = logoY - padding;
        int fondoSize = logoSize + padding * 2;

        BufferedImage imagenFinal = new BufferedImage(
                qrWidth,
                qrHeight,
                BufferedImage.TYPE_INT_RGB
        );

        Graphics2D graphics = imagenFinal.createGraphics();

        graphics.drawImage(qrImage, 0, 0, null);

        graphics.setRenderingHint(
                RenderingHints.KEY_ANTIALIASING,
                RenderingHints.VALUE_ANTIALIAS_ON
        );

        graphics.setRenderingHint(
                RenderingHints.KEY_INTERPOLATION,
                RenderingHints.VALUE_INTERPOLATION_BICUBIC
        );

        graphics.setColor(Color.WHITE);
        graphics.fill(new RoundRectangle2D.Float(
                fondoX,
                fondoY,
                fondoSize,
                fondoSize,
                24,
                24
        ));

        graphics.drawImage(
                logoImage,
                logoX,
                logoY,
                logoFinalWidth,
                logoFinalHeight,
                null
        );

        graphics.dispose();

        return imagenFinal;
    }

}
