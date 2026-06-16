package com.tesis.municipalidadbackendapp.usuariosinternos.repository;

import com.tesis.municipalidadbackendapp.usuariosinternos.entity.Usuario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario,Integer> {

    Optional<Usuario> findByKeycloakId(String keycloakId);

    boolean existsByDni(String dni);

    boolean existsByEmail(String email);

    boolean existsByEmailAndIdNot(String email, Integer id);

    @Query("""
        SELECT u
        FROM Usuario u
        WHERE UPPER(COALESCE(u.rol.codigo, u.rol.nombre)) = UPPER(:rol)
    """)
    List<Usuario> findByRolCodigoOrNombre(@Param("rol") String rol);

    @Query("""
        SELECT u
        FROM Usuario u
        WHERE (:rolId IS NULL OR u.rol.id = :rolId)
        AND (:texto IS NULL OR :texto = ''
            OR LOWER(u.nombre) LIKE LOWER(CONCAT('%', :texto, '%'))
            OR LOWER(u.email) LIKE LOWER(CONCAT('%', :texto, '%'))
            OR LOWER(u.rol.nombre) LIKE LOWER(CONCAT('%', :texto, '%'))
            OR LOWER(u.rol.codigo) LIKE LOWER(CONCAT('%', :texto, '%'))
        )
    """)
    Page<Usuario> buscarPorNombreCorreoORol(
            @Param("texto") String texto,
            @Param("rolId") Integer rolId,
            Pageable pageable
    );



}
