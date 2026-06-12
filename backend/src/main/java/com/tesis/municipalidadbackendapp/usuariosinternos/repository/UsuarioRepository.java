package com.tesis.municipalidadbackendapp.usuariosinternos.repository;

import com.tesis.municipalidadbackendapp.usuariosinternos.entity.Usuario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario,Integer> {

    Optional<Usuario> findByKeycloakId(String keycloakId);

    boolean existsByDni(String dni);

    boolean existsByEmail(String email);

    @Query("""
        SELECT u
        FROM Usuario u
        WHERE (:texto IS NULL OR :texto = ''
            OR LOWER(u.nombre) LIKE LOWER(CONCAT('%', :texto, '%'))
            OR LOWER(u.email) LIKE LOWER(CONCAT('%', :texto, '%'))
            OR LOWER(u.rol.nombre) LIKE LOWER(CONCAT('%', :texto, '%'))
        )
    """)
    Page<Usuario> buscarPorNombreCorreoORol(
            @Param("texto") String texto,
            Pageable pageable
    );



}
