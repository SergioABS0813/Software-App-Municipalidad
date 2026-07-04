package com.tesis.municipalidadbackendapp.qr.service;

import com.google.zxing.*;
import com.google.zxing.client.j2se.BufferedImageLuminanceSource;
import com.google.zxing.common.HybridBinarizer;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.util.*;

@Service
public class QrImageDecoderService {
    private static final Set<String> TIPOS_PERMITIDOS = Set.of(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
    );

    public String decodificarQr(MultipartFile archivo) {
        if (archivo == null || archivo.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecciona una imagen de QR");
        }

        String contentType = archivo.getContentType() != null
                ? archivo.getContentType().toLowerCase(Locale.ROOT)
                : "";
        if (!TIPOS_PERMITIDOS.contains(contentType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Solo se permiten imagenes JPG, PNG o WebP");
        }

        try {
            BufferedImage image = ImageIO.read(archivo.getInputStream());
            if (image == null) {
                System.out.println("No se pudo leer la imagen del QR");
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se pudo leer la imagen del QR");
            }

            System.out.println("Imagen leída correctamente");
            System.out.println("Ancho: " + image.getWidth());
            System.out.println("Alto: " + image.getHeight());

            BinaryBitmap bitmap = new BinaryBitmap(new HybridBinarizer(new BufferedImageLuminanceSource(image)));
            Map<DecodeHintType, Object> hints = new EnumMap<>(DecodeHintType.class);
            hints.put(DecodeHintType.TRY_HARDER, Boolean.TRUE);
            hints.put(DecodeHintType.POSSIBLE_FORMATS, List.of(BarcodeFormat.QR_CODE));
            hints.put(DecodeHintType.CHARACTER_SET, "UTF-8");
            Result result = new MultiFormatReader().decode(bitmap, hints);
            System.out.println(result);
            System.out.println("Texto decodificado del QR: " + result.getText());
            return result.getText();
        } catch (NotFoundException exception) {
            System.out.println("ZXing no encontró un QR legible en la imagen");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se encontro un codigo QR legible en la imagen");
        } catch (IOException exception) {
            System.out.println("No se pudo procesar la imagen del QR");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se pudo procesar la imagen del QR", exception);
        }
    }
}