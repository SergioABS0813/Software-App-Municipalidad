package com.tesis.municipalidadbackendapp.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "keycloak.admin")
public class KeycloakAdminProperties {
    private String serverUrl;
    private String realm;
    private String clientId;
    private String clientSecret;
    private String activationClientId;
    private String activationRedirectUri;
}
