package com.tesis.municipalidadbackendapp.auth.controller;

import com.tesis.municipalidadbackendapp.auth.dto.ForgotPasswordRequest;
import com.tesis.municipalidadbackendapp.auth.service.PasswordResetService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/auth")
@RequiredArgsConstructor
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    /*Usuario solicita reset de contraseña enviando correo y dni*/
    @PostMapping("forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request){
        try {
            passwordResetService.requestPasswordReset(request.correo(), request.dni());
            return ResponseEntity.ok("Email de recuperación enviado correctamente.");
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("No encontramos una cuenta con los datos ingresados.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al procesar solicitud.");
        }
    }


}
