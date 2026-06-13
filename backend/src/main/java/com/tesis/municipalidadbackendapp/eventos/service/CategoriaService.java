package com.tesis.municipalidadbackendapp.eventos.service;

import com.tesis.municipalidadbackendapp.bitacora.service.BitacoraAccionService;
import com.tesis.municipalidadbackendapp.eventos.dto.CategoriaConfiguracionDto;
import com.tesis.municipalidadbackendapp.eventos.dto.CategoriaRequest;
import com.tesis.municipalidadbackendapp.eventos.dto.CategoriaResponse;
import com.tesis.municipalidadbackendapp.eventos.entity.Categoria;
import com.tesis.municipalidadbackendapp.eventos.repository.CategoriaRepository;
import com.tesis.municipalidadbackendapp.usuariosinternos.entity.Usuario;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoriaService {

    private final CategoriaRepository categoriaRepository;
    private final BitacoraAccionService bitacoraAccionService;


    public List<Categoria> obtenerCategorias(){
        return categoriaRepository.findAll();
    }

    public Page<CategoriaConfiguracionDto> obtenerCategoriasConfiguracion(String texto, int page) {
        PageRequest pageable = PageRequest.of(page, 5, Sort.by("nombre").ascending());
        return categoriaRepository.findAllConfiguracion(texto, pageable);
    }

    public CategoriaResponse guardarCategoria(CategoriaRequest request, Usuario usuario, HttpServletRequest httpServletRequest){
        Categoria categoria = new Categoria();
        categoria.setNombre(request.nombre());
        Categoria categoriaGuardada = categoriaRepository.save(categoria);

        //Guardar en bitacora_accion
        bitacoraAccionService.guardarAccion(
                "CREAR_CATEGORIA",
                "CATEGORIA",
                categoriaGuardada.getId(),
                "Se creó la categoría con nombre: " + categoriaGuardada.getNombre(),
                usuario,
                httpServletRequest
        );

        CategoriaResponse response = new CategoriaResponse(categoriaGuardada.getId(), categoriaGuardada.getNombre());
        return  response;
    }
}
