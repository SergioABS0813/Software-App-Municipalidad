package com.tesis.municipalidadbackendapp.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final KeycloakRoleConverter keycloakRoleConverter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        JwtAuthenticationConverter jwtConverter = new JwtAuthenticationConverter();
        jwtConverter.setJwtGrantedAuthoritiesConverter(keycloakRoleConverter);

        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/public/**").permitAll()
                        .requestMatchers("/api/auth/forgot-password").permitAll()
                        .requestMatchers("/api/valoraciones/validar").permitAll()
                        .requestMatchers("/api/valoraciones/responder").permitAll()
                        .requestMatchers("/api/eventos/*/recursos").permitAll()
                        .requestMatchers("/api/eventos/*/historial").hasAnyRole("ADMINISTRADOR", "DIRECTIVO")
                        .requestMatchers("/api/valoraciones/admin/**").hasAnyRole("ADMINISTRADOR", "DIRECTIVO")
                        .requestMatchers("/api/eventos/admin/operacion/*/finalizar").hasAnyRole("ADMINISTRADOR", "DIRECTIVO")
                        .requestMatchers("/api/eventos/directivo/**").hasRole("DIRECTIVO")
                        .requestMatchers("/api/eventos/admin/**").hasRole("ADMINISTRADOR")
                        .requestMatchers("/api/estado_evento/admin/**").hasRole("ADMINISTRADOR")
                        .requestMatchers("/api/notificacion/**").hasAnyRole("ADMINISTRADOR", "DIRECTIVO", "OPERATIVO")
                        .requestMatchers("/api/operativo/**").hasRole("OPERATIVO")
                        .requestMatchers("/api/admin/**").hasRole("ADMINISTRADOR")
                        .requestMatchers("/api/usuario/admin/**").hasRole("ADMINISTRADOR")
                        .requestMatchers("/api/rol/admin/**").hasRole("ADMINISTRADOR")
                        .requestMatchers("/api/vecino/admin/**").hasRole("ADMINISTRADOR")
                        .requestMatchers("/api/area_municipal/**").hasRole("DIRECTIVO")
                        .requestMatchers("/api/categoria/admin/**").hasRole("ADMINISTRADOR")
                        .requestMatchers("/api/categoria/**").hasRole("OPERATIVO")
                        .requestMatchers("/api/ubicacion/admin/**").hasRole("ADMINISTRADOR")
                        .anyRequest().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtConverter))
                );
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration corsConfiguration = new CorsConfiguration();

        corsConfiguration.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://localhost:7000"
        ));

        corsConfiguration.setAllowedMethods(List.of("*"));
        corsConfiguration.setAllowedHeaders(List.of("*"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfiguration);
        return source;
    }
}
