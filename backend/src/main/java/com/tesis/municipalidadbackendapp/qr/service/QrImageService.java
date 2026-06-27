package com.tesis.municipalidadbackendapp.qr.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import com.google.zxing.qrcode.encoder.ByteMatrix;
import com.google.zxing.qrcode.encoder.Encoder;
import com.google.zxing.qrcode.encoder.QRCode;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.geom.Ellipse2D;
import java.awt.geom.RoundRectangle2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class QrImageService {

    public byte[] generarQrPngProfesional(String contenidoQr) {
        try {
            int qrSize = 700;

            Map<EncodeHintType, Object> hints = Map.of(
                    EncodeHintType.CHARACTER_SET, "UTF-8"
            );

            QRCode qrCode = Encoder.encode(
                    contenidoQr,
                    ErrorCorrectionLevel.H,
                    hints
            );

            ByteMatrix matrix = qrCode.getMatrix();

            Color colorQr = new Color(0, 96, 160); // azul oscuro institucional
            BufferedImage qrImage = renderizarQrPersonalizado(matrix, qrSize, colorQr);

            ClassPathResource logoResource = new ClassPathResource("qr/municipalidad-logo.png");
            BufferedImage logoImage = ImageIO.read(logoResource.getInputStream());

            BufferedImage qrConLogo = agregarLogoAlCentro(qrImage, logoImage);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            ImageIO.write(qrConLogo, "PNG", outputStream);

            return outputStream.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("No se pudo generar el código QR profesional", e);
        }

    }

    private BufferedImage renderizarQrPersonalizado(
            ByteMatrix matrix,
            int qrSize,
            Color colorQr
    ) {
        int quietZone = 4;
        System.out.println("asadsadasdasdasd");

        int matrixWidth = matrix.getWidth();
        int matrixHeight = matrix.getHeight();

        int totalModules = matrixWidth + quietZone * 2;
        int moduleSize = qrSize / totalModules;

        int actualQrSize = moduleSize * totalModules;
        int offset = (qrSize - actualQrSize) / 2;

        BufferedImage image = new BufferedImage(
                qrSize,
                qrSize,
                BufferedImage.TYPE_INT_RGB
        );

        Graphics2D graphics = image.createGraphics();

        graphics.setColor(Color.WHITE);
        graphics.fillRect(0, 0, qrSize, qrSize);

        graphics.setRenderingHint(
                RenderingHints.KEY_ANTIALIASING,
                RenderingHints.VALUE_ANTIALIAS_ON
        );

        graphics.setColor(colorQr);

        for (int y = 0; y < matrixHeight; y++) {
            for (int x = 0; x < matrixWidth; x++) {
                if (matrix.get(x, y) == 1) {
                    int moduleX = offset + (x + quietZone) * moduleSize;
                    int moduleY = offset + (y + quietZone) * moduleSize;

                    float radius = moduleSize * 0.35f;

                    graphics.fill(new RoundRectangle2D.Float(
                            moduleX,
                            moduleY,
                            moduleSize,
                            moduleSize,
                            radius,
                            radius
                    ));
                }
            }
        }

        graphics.dispose();

        return image;
    }

    private BufferedImage agregarLogoAlCentro(
            BufferedImage qrImage,
            BufferedImage logoImage
    ) {
        int qrWidth = qrImage.getWidth();
        int qrHeight = qrImage.getHeight();

        int maxLogoWidth = (int) (qrWidth * 0.22);
        int maxLogoHeight = (int) (qrHeight * 0.22);

        int logoOriginalWidth = logoImage.getWidth();
        int logoOriginalHeight = logoImage.getHeight();

        double escala = Math.min(
                (double) maxLogoWidth / logoOriginalWidth,
                (double) maxLogoHeight / logoOriginalHeight
        );

        int logoFinalWidth = (int) (logoOriginalWidth * escala);
        int logoFinalHeight = (int) (logoOriginalHeight * escala);

        int logoX = (qrWidth - logoFinalWidth) / 2;
        int logoY = (qrHeight - logoFinalHeight) / 2;

        int padding = (int) (qrWidth * 0.02);

        int fondoSize = Math.max(logoFinalWidth, logoFinalHeight) + padding * 2;
        int fondoX = (qrWidth - fondoSize) / 2;
        int fondoY = (qrHeight - fondoSize) / 2;

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
        graphics.fill(new Ellipse2D.Float(
                fondoX,
                fondoY,
                fondoSize,
                fondoSize
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
