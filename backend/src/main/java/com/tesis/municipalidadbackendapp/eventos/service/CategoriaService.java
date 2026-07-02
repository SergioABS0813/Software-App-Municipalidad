package com.tesis.municipalidadbackendapp.eventos.service;

import com.tesis.municipalidadbackendapp.bitacora.service.BitacoraAccionService;
import com.tesis.municipalidadbackendapp.eventos.dto.CategoriaConfiguracionDto;
import com.tesis.municipalidadbackendapp.eventos.dto.CategoriaPublicaDto;
import com.tesis.municipalidadbackendapp.eventos.dto.CategoriaRequest;
import com.tesis.municipalidadbackendapp.eventos.dto.CategoriaResponse;
import com.tesis.municipalidadbackendapp.eventos.entity.Categoria;
import com.tesis.municipalidadbackendapp.eventos.repository.CategoriaRepository;
import com.tesis.municipalidadbackendapp.eventos.repository.EventoRepository;
import com.tesis.municipalidadbackendapp.usuariosinternos.entity.Usuario;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoriaService {
    private static final int MAX_NOMBRE_CATEGORIA = 45;

    private final CategoriaRepository categoriaRepository;
    private final EventoRepository eventoRepository;
    private final BitacoraAccionService bitacoraAccionService;


    public List<CategoriaPublicaDto> obtenerCategoriasPublicas() {
        return categoriaRepository.findAll(Sort.by("nombre").ascending()).stream()
                .map(categoria -> new CategoriaPublicaDto(categoria.getId(), categoria.getNombre()))
                .toList();
    }
    public List<Categoria> obtenerCategorias(){
        return categoriaRepository.findAll();
    }

    public Page<CategoriaConfiguracionDto> obtenerCategoriasConfiguracion(String texto, int page, int size) {
        int pageSize = Math.max(1, Math.min(size, 200));
        PageRequest pageable = PageRequest.of(page, pageSize, Sort.by("nombre").ascending());
        return categoriaRepository.findAllConfiguracion(texto, pageable);
    }

    public CategoriaResponse guardarCategoria(CategoriaRequest request, Usuario usuario, HttpServletRequest httpServletRequest){
        validarCategoria(request);

        Categoria categoria = new Categoria();
        categoria.setNombre(request.nombre().trim());
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

    public void eliminarCategoria(Integer id, Usuario usuario, HttpServletRequest httpServletRequest) {
        Categoria categoria = categoriaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Categoría no encontrada"
                ));
        Long eventosAsociados = eventoRepository.countByCategoriaId(id);

        if (eventosAsociados > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No se puede eliminar la categoría porque tiene eventos asociados"
            );
        }

        categoriaRepository.delete(categoria);

        bitacoraAccionService.guardarAccion(
                "ELIMINAR_CATEGORIA",
                "CATEGORIA",
                categoria.getId(),
                "Se eliminó la categoría con nombre: " + categoria.getNombre(),
                usuario,
                httpServletRequest
        );
    }

    private void validarCategoria(CategoriaRequest request) {
        if (request == null || request.nombre() == null || request.nombre().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre de la categoría es requerido");
        }

        String nombre = request.nombre().trim();

        if (nombre.length() > MAX_NOMBRE_CATEGORIA) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El nombre de la categoría no debe exceder los " + MAX_NOMBRE_CATEGORIA + " caracteres"
            );
        }

        if (categoriaRepository.existsByNombreIgnoreCase(nombre)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe una categoría con ese nombre");
        }
    }
}
