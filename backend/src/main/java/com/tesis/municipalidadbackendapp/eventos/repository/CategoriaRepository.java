package com.tesis.municipalidadbackendapp.eventos.repository;

import com.tesis.municipalidadbackendapp.eventos.entity.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoriaRepository extends JpaRepository<Categoria, Integer> {
}
