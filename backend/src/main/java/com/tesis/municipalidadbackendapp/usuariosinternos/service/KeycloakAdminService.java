package com.tesis.municipalidadbackendapp.usuariosinternos.service;

import com.tesis.municipalidadbackendapp.config.KeycloakAdminProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class KeycloakAdminService {
    private static final List<String> ACTIVACION_USUARIO_INTERNO_ACTIONS = List.of("UPDATE_PASSWORD");
    private static final String ROL_VECINO = "VECINO";

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
            sanearRolesVecinoParaUsuarioInterno(restClient, token, keycloakId);
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

    public String crearVecino(String nombre, String email, String dni, String celular, String fechaNacimiento) {
        String token = obtenerAccessToken();
        RestClient restClient = restClientBuilder.baseUrl(normalizedServerUrl()).build();

        Map<String, Object> atributos = new HashMap<>();
        atributos.put("dni", List.of(dni));
        atributos.put("celular", List.of(celular));
        atributos.put("fechaNacimiento", List.of(fechaNacimiento));
        atributos.put("rol", List.of(ROL_VECINO));

        Map<String, Object> request = new HashMap<>();
        request.put("username", email);
        request.put("email", email);
        request.put("firstName", nombre);
        request.put("enabled", true);
        request.put("emailVerified", false);
        request.put("requiredActions", ACTIVACION_USUARIO_INTERNO_ACTIONS);
        request.put("attributes", atributos);

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
            asignarRolRealm(restClient, token, keycloakId, ROL_VECINO);
            enviarCorreoAccionesRequeridas(restClient, token, keycloakId, email);
            log.info("Vecino creado en Keycloak. email={}, keycloakId={}, rol={}", email, keycloakId, ROL_VECINO);
            return keycloakId;
        } catch (RestClientResponseException exception) {
            log.warn("Error al crear vecino en Keycloak. email={}, status={}, body={}",
                    email, exception.getStatusCode(), exception.getResponseBodyAsString());
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "No se pudo crear la cuenta en Keycloak",
                    exception
            );
        }
    }

    public boolean existeUsuarioPorEmail(String email) {
        if (!StringUtils.hasText(email)) {
            return false;
        }

        String token = obtenerAccessToken();
        RestClient restClient = restClientBuilder.baseUrl(normalizedServerUrl()).build();

        try {
            List<Map<String, Object>> usuarios = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/admin/realms/{realm}/users")
                            .queryParam("username", email)
                            .queryParam("exact", true)
                            .build(properties.getRealm()))
                    .header(HttpHeaders.AUTHORIZATION, bearer(token))
                    .retrieve()
                    .body(List.class);

            if (usuarios != null && usuarios.stream().anyMatch(usuario -> email.equalsIgnoreCase(String.valueOf(usuario.get("username"))))) {
                return true;
            }

            usuarios = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/admin/realms/{realm}/users")
                            .queryParam("email", email)
                            .queryParam("exact", true)
                            .build(properties.getRealm()))
                    .header(HttpHeaders.AUTHORIZATION, bearer(token))
                    .retrieve()
                    .body(List.class);

            return usuarios != null && !usuarios.isEmpty();
        } catch (RestClientResponseException exception) {
            log.warn("Error al consultar usuario en Keycloak por email. email={}, status={}, body={}",
                    email, exception.getStatusCode(), exception.getResponseBodyAsString());
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "No se pudo validar el correo en Keycloak",
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
            log.info("Usuario eliminado de Keycloak por compensacion. keycloakId={}", keycloakId);
        } catch (RestClientResponseException exception) {
            log.error("No se pudo eliminar usuario de Keycloak durante compensacion. keycloakId={}, status={}, body={}",
                    keycloakId, exception.getStatusCode(), exception.getResponseBodyAsString());
        }
    }

    public void actualizarCorreoUsuario(String keycloakId, String nombre, String email) {
        String token = obtenerAccessToken();
        RestClient restClient = restClientBuilder.baseUrl(normalizedServerUrl()).build();

        try {
            Map<String, Object> request = new HashMap<>(obtenerUsuarioKeycloak(restClient, token, keycloakId));
            request.put("username", email);
            request.put("email", email);
            request.put("firstName", nombre);
            request.put("emailVerified", true);

            restClient.put()
                    .uri("/admin/realms/{realm}/users/{userId}", properties.getRealm(), keycloakId)
                    .header(HttpHeaders.AUTHORIZATION, bearer(token))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .toBodilessEntity();
            log.info("Correo actualizado en Keycloak. keycloakId={}, email={}", keycloakId, email);
        } catch (RestClientResponseException exception) {
            log.warn("Error al actualizar correo en Keycloak. keycloakId={}, status={}, body={}",
                    keycloakId, exception.getStatusCode(), exception.getResponseBodyAsString());
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "No se pudo actualizar el correo en Keycloak",
                    exception
            );
        }
    }

    public void actualizarEstadoUsuario(String keycloakId, boolean enabled) {
        String token = obtenerAccessToken();
        RestClient restClient = restClientBuilder.baseUrl(normalizedServerUrl()).build();

        try {
            restClient.put()
                    .uri("/admin/realms/{realm}/users/{userId}", properties.getRealm(), keycloakId)
                    .header(HttpHeaders.AUTHORIZATION, bearer(token))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("enabled", enabled))
                    .retrieve()
                    .toBodilessEntity();

            if (!enabled) {
                cerrarSesionesUsuario(restClient, token, keycloakId);
            }

            log.info("Estado actualizado en Keycloak. keycloakId={}, enabled={}", keycloakId, enabled);
        } catch (RestClientResponseException exception) {
            log.warn("Error al actualizar estado en Keycloak. keycloakId={}, status={}, body={}",
                    keycloakId, exception.getStatusCode(), exception.getResponseBodyAsString());
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "No se pudo actualizar el estado en Keycloak",
                    exception
            );
        }
    }

    public void actualizarRolUsuario(String keycloakId, String rolAnterior, String rolNuevo) {
        if (!StringUtils.hasText(rolNuevo) || rolNuevo.equals(rolAnterior)) {
            return;
        }

        String token = obtenerAccessToken();
        RestClient restClient = restClientBuilder.baseUrl(normalizedServerUrl()).build();

        try {
            if (StringUtils.hasText(rolAnterior)) {
                Map<String, Object> rolAnteriorRepresentation = obtenerRolRealm(restClient, token, rolAnterior);
                restClient.method(HttpMethod.DELETE)
                        .uri("/admin/realms/{realm}/users/{userId}/role-mappings/realm", properties.getRealm(), keycloakId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(List.of(rolAnteriorRepresentation))
                        .retrieve()
                        .toBodilessEntity();
            }

            asignarRolRealm(restClient, token, keycloakId, rolNuevo);
            sanearRolesVecinoParaUsuarioInterno(restClient, token, keycloakId);
            cerrarSesionesUsuario(restClient, token, keycloakId);
            log.info("Rol actualizado en Keycloak. keycloakId={}, rolAnterior={}, rolNuevo={}",
                    keycloakId, rolAnterior, rolNuevo);
        } catch (RestClientResponseException exception) {
            log.warn("Error al actualizar rol en Keycloak. keycloakId={}, rolNuevo={}, status={}, body={}",
                    keycloakId, rolNuevo, exception.getStatusCode(), exception.getResponseBodyAsString());
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "No se pudo actualizar el rol en Keycloak",
                    exception
            );
        }
    }

    public void enviarCorreoRecuperacionContrasena(String keycloakId){
        String token = obtenerAccessToken();
        RestClient restClient = restClientBuilder.baseUrl(normalizedServerUrl()).build();

        try{
            restClient.put()
                    .uri(uriBuilder -> {
                        var builder = uriBuilder.path("/admin/realms/{realm}/users/{userId}/reset-password-email");
                        if (StringUtils.hasText(properties.getActivationClientId())) {
                            builder.queryParam("client_id", properties.getActivationClientId());
                        }
                        if (StringUtils.hasText(properties.getActivationRedirectUri())) {
                            builder.queryParam("redirect_uri", properties.getActivationRedirectUri());
                        }
                        builder.queryParam("lifespan", 300);
                        return builder.build(properties.getRealm(), keycloakId);
                    })
                    .header(HttpHeaders.AUTHORIZATION, bearer(token))
                    .retrieve()
                    .toBodilessEntity();

        } catch (RuntimeException e) {
            throw new RuntimeException(e);
        }

    }

    private void asignarRolRealm(RestClient restClient, String token, String keycloakId, String rolKeycloak) {
        try {
            Map<String, Object> roleRepresentation = obtenerRolRealm(restClient, token, rolKeycloak);

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

    private void sanearRolesVecinoParaUsuarioInterno(RestClient restClient, String token, String keycloakId) {
        List<Map<String, Object>> rolesDirectos = obtenerRolesRealmDirectos(restClient, token, keycloakId);
        if (rolesDirectos.isEmpty()) {
            return;
        }

        String defaultRoleName = "default-roles-" + properties.getRealm();
        List<Map<String, Object>> rolesARemover = new ArrayList<>();

        rolesDirectos.stream()
                .filter(rol -> ROL_VECINO.equalsIgnoreCase(String.valueOf(rol.get("name"))))
                .findFirst()
                .ifPresent(rolesARemover::add);

        if (tieneRolEfectivo(restClient, token, keycloakId, ROL_VECINO)) {
            Optional<Map<String, Object>> defaultRole = rolesDirectos.stream()
                    .filter(rol -> defaultRoleName.equalsIgnoreCase(String.valueOf(rol.get("name"))))
                    .findFirst();
            defaultRole.ifPresent(rolesARemover::add);
        }

        if (rolesARemover.isEmpty()) {
            return;
        }

        try {
            restClient.method(HttpMethod.DELETE)
                    .uri("/admin/realms/{realm}/users/{userId}/role-mappings/realm", properties.getRealm(), keycloakId)
                    .header(HttpHeaders.AUTHORIZATION, bearer(token))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(rolesARemover)
                    .retrieve()
                    .toBodilessEntity();
            log.info("Rol VECINO/default role removido para usuario interno. keycloakId={}, rolesRemovidos={}",
                    keycloakId, rolesARemover.stream().map(rol -> rol.get("name")).toList());
        } catch (RestClientResponseException exception) {
            log.warn("Error al remover rol VECINO de usuario interno. keycloakId={}, status={}, body={}",
                    keycloakId, exception.getStatusCode(), exception.getResponseBodyAsString());
            eliminarUsuario(keycloakId);
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "No se pudo sanear los roles del usuario en Keycloak",
                    exception
            );
        }
    }

    private List<Map<String, Object>> obtenerRolesRealmDirectos(RestClient restClient, String token, String keycloakId) {
        List<Map<String, Object>> roles = restClient.get()
                .uri("/admin/realms/{realm}/users/{userId}/role-mappings/realm", properties.getRealm(), keycloakId)
                .header(HttpHeaders.AUTHORIZATION, bearer(token))
                .retrieve()
                .body(List.class);

        return roles == null ? List.of() : roles;
    }

    private boolean tieneRolEfectivo(RestClient restClient, String token, String keycloakId, String rolBuscado) {
        List<Map<String, Object>> roles = restClient.get()
                .uri("/admin/realms/{realm}/users/{userId}/role-mappings/realm/composite", properties.getRealm(), keycloakId)
                .header(HttpHeaders.AUTHORIZATION, bearer(token))
                .retrieve()
                .body(List.class);

        return roles != null && roles.stream()
                .anyMatch(rol -> rolBuscado.equalsIgnoreCase(String.valueOf(rol.get("name"))));
    }

    private Map<String, Object> obtenerRolRealm(RestClient restClient, String token, String rolKeycloak) {
        return restClient.get()
                .uri("/admin/realms/{realm}/roles/{roleName}", properties.getRealm(), rolKeycloak)
                .header(HttpHeaders.AUTHORIZATION, bearer(token))
                .retrieve()
                .body(Map.class);
    }

    private Map<String, Object> obtenerUsuarioKeycloak(RestClient restClient, String token, String keycloakId) {
        Map<String, Object> usuario = restClient.get()
                .uri("/admin/realms/{realm}/users/{userId}", properties.getRealm(), keycloakId)
                .header(HttpHeaders.AUTHORIZATION, bearer(token))
                .retrieve()
                .body(Map.class);

        if (usuario == null || usuario.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Keycloak no devolvio el usuario");
        }

        return usuario;
    }

    private void cerrarSesionesUsuario(RestClient restClient, String token, String keycloakId) {
        try {
            restClient.post()
                    .uri("/admin/realms/{realm}/users/{userId}/logout", properties.getRealm(), keycloakId)
                    .header(HttpHeaders.AUTHORIZATION, bearer(token))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException exception) {
            log.warn("No se pudieron cerrar sesiones de Keycloak. keycloakId={}, status={}, body={}",
                    keycloakId, exception.getStatusCode(), exception.getResponseBodyAsString());
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

            log.info("Correo UPDATE_PASSWORD solicitado a Keycloak. keycloakId={}, email={}", keycloakId, email);
        } catch (RestClientResponseException exception) {
            log.warn("Error al solicitar correo de activacion en Keycloak. keycloakId={}, email={}, status={}, body={}",
                    keycloakId, email, exception.getStatusCode(), exception.getResponseBodyAsString());
            eliminarUsuario(keycloakId);
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "No se pudo enviar el correo de activacion desde Keycloak",
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
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Keycloak no devolvio access_token");
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
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Keycloak no devolvio la ubicacion del usuario creado");
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
