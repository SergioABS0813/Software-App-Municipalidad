package com.tesis.municipalidadbackendapp.eventos.controller;

import com.tesis.municipalidadbackendapp.eventos.dto.CategoriaRequest;
import com.tesis.municipalidadbackendapp.eventos.dto.CategoriaResponse;
import com.tesis.municipalidadbackendapp.eventos.entity.Categoria;
import com.tesis.municipalidadbackendapp.eventos.service.CategoriaService;
import com.tesis.municipalidadbackendapp.usuariosinternos.entity.Usuario;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/categoria")
public class CategoriaController {

    private final CategoriaService categoriaService;

    @GetMapping("admin/operacion")
    public List<Categoria> obtenerCategorias(){
        return categoriaService.obtenerCategorias();
    }

    @PostMapping
    public CategoriaResponse guardarCategoria(@RequestBody CategoriaRequest request, HttpServletRequest httpServletRequest){
        Usuario usuario = null; // Hasta tener login con JWT CORREGIR
        return categoriaService.guardarCategoria(request, usuario, httpServletRequest);
    }


}
