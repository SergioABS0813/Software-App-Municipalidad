package com.tesis.municipalidadbackendapp.usuariosinternos.controller;

import com.tesis.municipalidadbackendapp.usuariosinternos.dto.UsuarioConfiguracionDto;
import com.tesis.municipalidadbackendapp.usuariosinternos.dto.UsuarioRequest;
import com.tesis.municipalidadbackendapp.usuariosinternos.dto.UsuarioResponse;
import com.tesis.municipalidadbackendapp.usuariosinternos.dto.UsuarioResponseVerDto;
import com.tesis.municipalidadbackendapp.usuariosinternos.entity.Usuario;
import com.tesis.municipalidadbackendapp.usuariosinternos.service.UsuarioService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/usuario")
public class UsuarioController {

    private final UsuarioService usuarioService;

    //Guarda nuevo usuario en administrador
    @PostMapping("admin/guardar_usuario")
    public UsuarioResponse guardarUsuario (@RequestBody UsuarioRequest usuarioRequest, HttpServletRequest httpServletRequest) {
        Usuario usuarioautenticado = new Usuario(); // CORREGIR CON LOGIN
        return usuarioService.guardarUsuario(usuarioRequest, httpServletRequest, usuarioautenticado);
    }

    //Muestra datos de los usuarios en la tabla de usuarios internos
    @GetMapping("admin/obtener_usuarios_internos")
    public List<UsuarioConfiguracionDto> obtenerUsuarios(){
        return usuarioService.obtenerUsuariosInternos();
    }

    //Muestra datos de usuario en Editar usuario
    @GetMapping("admin/obtener_usuario_interno/{id}")
    public UsuarioResponseVerDto obtenerUsuarioInterno(@PathVariable Integer id){
        return usuarioService.obtenerUsuarioInternoPorId(id);
    }






}
