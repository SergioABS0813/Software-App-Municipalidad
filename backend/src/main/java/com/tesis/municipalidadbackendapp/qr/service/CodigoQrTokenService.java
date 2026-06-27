package com.tesis.municipalidadbackendapp.qr.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class CodigoQrTokenService {

    private static final String PREFIJO_QR = "MUNI-SM:QR:";
    private final SecureRandom secureRandom = new SecureRandom();

    public String generarTokenSeguro() {
        byte[] bytes = new byte[16];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(bytes);
    }

    public String construirContenidoQr(String token) {
        return PREFIJO_QR + token;
    }

    public String extraerTokenDesdeContenidoQr(String contenidoQr){
        if (contenidoQr == null || !contenidoQr.startsWith(PREFIJO_QR)) {
            throw new IllegalArgumentException("Formato de QR inválido");
        }

        return contenidoQr.substring(PREFIJO_QR.length());
    }

    public String calcularHashSha256(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(token.getBytes(StandardCharsets.UTF_8));

            StringBuilder hex = new StringBuilder();

            for (byte b : hashBytes) {
                String valor = Integer.toHexString(0xff & b);

                if (valor.length() == 1) {
                    hex.append('0');
                }

                hex.append(valor);
            }

            return hex.toString();

        } catch (Exception e) {
            throw new RuntimeException("No se pudo calcular el hash del token QR", e);
        }
    }





}
