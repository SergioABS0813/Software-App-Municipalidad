package com.tesis.municipalidadbackendapp.usuariosinternos.repository;

import com.tesis.municipalidadbackendapp.usuariosinternos.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario,Integer> {

    Optional<Usuario>
}
