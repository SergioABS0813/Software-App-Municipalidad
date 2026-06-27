package com.tesis.municipalidadbackendapp.vecinos.repository;
import com.tesis.municipalidadbackendapp.vecinos.entity.EstadoVecino;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EstadoVecinoRepository extends JpaRepository<EstadoVecino,Integer> {

    Optional<EstadoVecino> findByNombre(String nombre);

}