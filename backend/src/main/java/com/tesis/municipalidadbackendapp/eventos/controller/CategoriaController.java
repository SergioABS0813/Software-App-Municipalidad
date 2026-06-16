package com.tesis.municipalidadbackendapp.eventos.controller;

import com.tesis.municipalidadbackendapp.common.UsuarioAutenticadoService;
import com.tesis.municipalidadbackendapp.eventos.dto.CategoriaConfiguracionDto;
import com.tesis.municipalidadbackendapp.eventos.dto.CategoriaRequest;
import com.tesis.municipalidadbackendapp.eventos.dto.CategoriaResponse;
import com.tesis.municipalidadbackendapp.eventos.entity.Categoria;
import com.tesis.municipalidadbackendapp.eventos.service.CategoriaService;
import com.tesis.municipalidadbackendapp.usuariosinternos.entity.Usuario;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/categoria")
public class CategoriaController {

    private final CategoriaService categoriaService;
    private final UsuarioAutenticadoService usuarioAutenticadoService;

    @GetMapping("admin/operacion")
    public List<Categoria> obtenerCategorias(){
        return categoriaService.obtenerCategorias();
    }

    @GetMapping("admin/configuracion")
    public Page<CategoriaConfiguracionDto> obtenerCategoriasConfiguracion(
            @RequestParam(required = false) String texto,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size
    ){
        return categoriaService.obtenerCategoriasConfiguracion(texto, page, size);
    }

    @PostMapping("admin/guardar_categoria")
    public CategoriaResponse guardarCategoria(@RequestBody CategoriaRequest request,
                                              HttpServletRequest httpServletRequest
                                              ){
        Usuario usuario = usuarioAutenticadoService.obtenerUsuarioAutenticado();
        return categoriaService.guardarCategoria(request, usuario, httpServletRequest);
    }

    @DeleteMapping("admin/{id}")
    public ResponseEntity<Void> eliminarCategoria(
            @PathVariable Integer id,
            HttpServletRequest httpServletRequest
    ){
        Usuario usuario = usuarioAutenticadoService.obtenerUsuarioAutenticado();
        categoriaService.eliminarCategoria(id, usuario, httpServletRequest);
        return ResponseEntity.noContent().build();
    }

}
