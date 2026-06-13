package com.tesis.municipalidadbackendapp.usuariosinternos.service;

import com.tesis.municipalidadbackendapp.config.KeycloakAdminProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class KeycloakAdminService {
    private static final List<String> ACTIVACION_USUARIO_INTERNO_ACTIONS = List.of("UPDATE_PASSWORD");

    private final KeycloakAdminProperties properties;
    private final RestClient.Builder restClientBuilder;

    public String crearUsuarioInterno(String nombre, String email, String rolKeycloak) {
        String token = obtenerAccessToken();
        RestClient restClient = restClientBuilder.baseUrl(normalizedServerUrl()).build();

        Map<String, Object> request = Map.of(
                "username", email,
                "email", email,
                "firstName", nombre,
                "enabled", true,
                "emailVerified", false,
                "requiredActions", ACTIVACION_USUARIO_INTERNO_ACTIONS
        );

        try {
            String location = restClient.post()
                    .uri("/admin/realms/{realm}/users", properties.getRealm())
                    .header(HttpHeaders.AUTHORIZATION, bearer(token))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .toBodilessEntity()
                    .getHeaders()
                    .getFirst(HttpHeaders.LOCATION);

            String keycloakId = obtenerIdDesdeLocation(location);
            asignarRolRealm(restClient, token, keycloakId, rolKeycloak);
            enviarCorreoAccionesRequeridas(restClient, token, keycloakId, email);
            log.info("Usuario creado en Keycloak. email={}, keycloakId={}, rol={}", email, keycloakId, rolKeycloak);
            return keycloakId;
        } catch (RestClientResponseException exception) {
            log.warn("Error al crear usuario en Keycloak. email={}, status={}, body={}",
                    email, exception.getStatusCode(), exception.getResponseBodyAsString());
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "No se pudo crear el usuario en Keycloak",
                    exception
            );
        }
    }

    public void eliminarUsuario(String keycloakId) {
        try {
            String token = obtenerAccessToken();
            restClientBuilder.baseUrl(normalizedServerUrl()).build()
                    .delete()
                    .uri("/admin/realms/{realm}/users/{userId}", properties.getRealm(), keycloakId)
                    .header(HttpHeaders.AUTHORIZATION, bearer(token))
                    .retrieve()
                    .toBodilessEntity();
            log.info("Usuario eliminado de Keycloak por compensación. keycloakId={}", keycloakId);
        } catch (RestClientResponseException exception) {
            log.error("No se pudo eliminar usuario de Keycloak durante compensación. keycloakId={}, status={}, body={}",
                    keycloakId, exception.getStatusCode(), exception.getResponseBodyAsString());
        }
    }

    private void asignarRolRealm(RestClient restClient, String token, String keycloakId, String rolKeycloak) {
        try {
            Map<String, Object> roleRepresentation = restClient.get()
                    .uri("/admin/realms/{realm}/roles/{roleName}", properties.getRealm(), rolKeycloak)
                    .header(HttpHeaders.AUTHORIZATION, bearer(token))
                    .retrieve()
                    .body(Map.class);

            restClient.post()
                    .uri("/admin/realms/{realm}/users/{userId}/role-mappings/realm", properties.getRealm(), keycloakId)
                    .header(HttpHeaders.AUTHORIZATION, bearer(token))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(List.of(roleRepresentation))
                    .retrieve()
                    .toBodilessEntity();
            log.info("Rol asignado en Keycloak. keycloakId={}, rol={}", keycloakId, rolKeycloak);
        } catch (RestClientResponseException exception) {
            log.warn("Error al asignar rol en Keycloak. keycloakId={}, rol={}, status={}, body={}",
                    keycloakId, rolKeycloak, exception.getStatusCode(), exception.getResponseBodyAsString());
            eliminarUsuario(keycloakId);
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "No se pudo asignar el rol en Keycloak",
                    exception
            );
        }
    }

    private void enviarCorreoAccionesRequeridas(RestClient restClient, String token, String keycloakId, String email) {
        try {
            restClient.put()
                    .uri(uriBuilder -> {
                        var builder = uriBuilder.path("/admin/realms/{realm}/users/{userId}/execute-actions-email");

                        if (StringUtils.hasText(properties.getActivationClientId())) {
                            builder.queryParam("client_id", properties.getActivationClientId());
                        }

                        if (StringUtils.hasText(properties.getActivationRedirectUri())) {
                            builder.queryParam("redirect_uri", properties.getActivationRedirectUri());
                        }

                        return builder.build(properties.getRealm(), keycloakId);
                    })
                    .header(HttpHeaders.AUTHORIZATION, bearer(token))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(ACTIVACION_USUARIO_INTERNO_ACTIONS)
                    .retrieve()
                    .toBodilessEntity();

            // TODO personalizar visualmente este correo mediante theme de Keycloak/email templates.
            log.info("Correo de activación solicitado a Keycloak. keycloakId={}, email={}", keycloakId, email);
        } catch (RestClientResponseException exception) {
            log.warn("Error al solicitar correo de activación en Keycloak. keycloakId={}, email={}, status={}, body={}",
                    keycloakId, email, exception.getStatusCode(), exception.getResponseBodyAsString());
            eliminarUsuario(keycloakId);
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "No se pudo enviar el correo de activación desde Keycloak",
                    exception
            );
        }
    }

    private String obtenerAccessToken() {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "client_credentials");
        form.add("client_id", properties.getClientId());
        form.add("client_secret", properties.getClientSecret());

        try {
            Map<String, Object> response = restClientBuilder.baseUrl(normalizedServerUrl()).build()
                    .post()
                    .uri("/realms/{realm}/protocol/openid-connect/token", properties.getRealm())
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(Map.class);

            Object accessToken = response == null ? null : response.get("access_token");
            if (!(accessToken instanceof String token) || token.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Keycloak no devolvió access_token");
            }
            return token;
        } catch (RestClientResponseException exception) {
            log.warn("Error al autenticar cliente admin en Keycloak. status={}, body={}",
                    exception.getStatusCode(), exception.getResponseBodyAsString());
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "No se pudo autenticar con Keycloak",
                    exception
            );
        }
    }

    private String obtenerIdDesdeLocation(String location) {
        if (location == null || location.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Keycloak no devolvió la ubicación del usuario creado");
        }
        int lastSlash = location.lastIndexOf('/');
        if (lastSlash < 0 || lastSlash == location.length() - 1) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "No se pudo obtener el ID del usuario creado en Keycloak");
        }
        return location.substring(lastSlash + 1);
    }

    private String normalizedServerUrl() {
        return properties.getServerUrl().replaceAll("/+$", "");
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }
}
