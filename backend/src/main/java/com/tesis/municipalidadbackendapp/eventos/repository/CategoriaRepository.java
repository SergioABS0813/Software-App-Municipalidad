package com.tesis.municipalidadbackendapp.eventos.repository;

import com.tesis.municipalidadbackendapp.eventos.dto.CategoriaConfiguracionDto;
import com.tesis.municipalidadbackendapp.eventos.entity.Categoria;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CategoriaRepository extends JpaRepository<Categoria, Integer> {
    @Query(
            value = """
            select new com.tesis.municipalidadbackendapp.eventos.dto.CategoriaConfiguracionDto(
                categoria.id,
                categoria.nombre,
                count(evento.id)
            )
            from Categoria categoria
            left join Evento evento on evento.categoria = categoria
            where (:texto is null or :texto = ''
                or lower(categoria.nombre) like lower(concat('%', :texto, '%'))
            )
            group by categoria.id, categoria.nombre
            order by categoria.nombre asc
            """,
            countQuery = """
            select count(categoria)
            from Categoria categoria
            where (:texto is null or :texto = ''
                or lower(categoria.nombre) like lower(concat('%', :texto, '%'))
            )
            """
    )
    Page<CategoriaConfiguracionDto> findAllConfiguracion(
            @Param("texto") String texto,
            Pageable pageable
    );
}
