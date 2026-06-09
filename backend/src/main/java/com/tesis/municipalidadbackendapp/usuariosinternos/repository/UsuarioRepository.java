package com.tesis.municipalidadbackendapp.usuariosinternos.repository;

import com.tesis.municipalidadbackendapp.usuariosinternos.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsuarioRepository extends JpaRepository<Usuario,Integer> {
}
