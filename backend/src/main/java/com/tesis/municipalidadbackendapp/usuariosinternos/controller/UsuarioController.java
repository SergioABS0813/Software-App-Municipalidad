package com.tesis.municipalidadbackendapp.usuariosinternos.controller;

import com.tesis.municipalidadbackendapp.common.UsuarioAutenticadoService;
import com.tesis.municipalidadbackendapp.eventos.dto.UsuarioOperativoDto;
import com.tesis.municipalidadbackendapp.usuariosinternos.dto.UsuarioConfiguracionDto;
import com.tesis.municipalidadbackendapp.usuariosinternos.dto.UsuarioRequest;
import com.tesis.municipalidadbackendapp.usuariosinternos.dto.UsuarioResponse;
import com.tesis.municipalidadbackendapp.usuariosinternos.dto.UsuarioEstadoRequest;
import com.tesis.municipalidadbackendapp.usuariosinternos.dto.UsuarioResponseVerDto;
import com.tesis.municipalidadbackendapp.usuariosinternos.dto.UsuarioUpdateRequest;
import com.tesis.municipalidadbackendapp.usuariosinternos.entity.Usuario;
import com.tesis.municipalidadbackendapp.usuariosinternos.service.UsuarioService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/usuario")
public class UsuarioController {

    private final UsuarioService usuarioService;
    private final UsuarioAutenticadoService usuarioAutenticadoService;

    //Guarda nuevo usuario en administrador
    @PostMapping("admin/guardar_usuario")
    public UsuarioResponse guardarUsuario (
            @RequestBody UsuarioRequest usuarioRequest,
            HttpServletRequest httpServletRequest,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Usuario usuarioautenticado = usuarioService.obtenerPorKeycloakId(jwt.getSubject());
        return usuarioService.guardarUsuario(usuarioRequest, httpServletRequest, usuarioautenticado);
    }

    //Muestra datos de los usuarios en la tabla de usuarios internos
    @GetMapping("admin/obtener_usuarios_internos")
    public Page<UsuarioConfiguracionDto> obtenerUsuarios(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) String texto,
            @RequestParam(required = false) Integer rolId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ){
        String keycloakId = jwt.getSubject();
        usuarioService.obtenerPorKeycloakId(keycloakId);
        return usuarioService.buscarUsuariosInternos(texto, rolId, page, size);
    }

    @GetMapping("admin/buscar_usuarios_internos")
    public Page<UsuarioConfiguracionDto> buscarUsuariosInternos(
            @RequestParam(required = false) String texto,
            @RequestParam(required = false) Integer rolId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ){
        usuarioAutenticadoService.obtenerUsuarioAutenticado();
        return usuarioService.buscarUsuariosInternos(texto, rolId, page, size);
    }

    @GetMapping("admin/operativos")
    public List<UsuarioOperativoDto> listarOperativosActivos(){
        usuarioAutenticadoService.obtenerUsuarioAutenticado();
        return usuarioService.listarOperativosActivos();
    }

    //Muestra datos de usuario en Editar usuario
    @GetMapping("admin/obtener_usuario_interno/{id}")
    public UsuarioResponseVerDto obtenerUsuarioInterno(@PathVariable Integer id){
        usuarioAutenticadoService.obtenerUsuarioAutenticado();
        return usuarioService.obtenerUsuarioInternoPorId(id);
    }

    @PutMapping("admin/{id}")
    public UsuarioResponseVerDto actualizarUsuarioInterno(
            @PathVariable Integer id,
            @RequestBody UsuarioUpdateRequest request,
            HttpServletRequest httpServletRequest
    ){
        Usuario usuario = usuarioAutenticadoService.obtenerUsuarioAutenticado();
        return usuarioService.actualizarUsuarioInterno(id, request, usuario, httpServletRequest);
    }

    @PatchMapping("admin/{id}/estado")
    public UsuarioResponseVerDto actualizarEstadoUsuarioInterno(
            @PathVariable Integer id,
            @RequestBody UsuarioEstadoRequest request,
            HttpServletRequest httpServletRequest
    ){
        Usuario usuario = usuarioAutenticadoService.obtenerUsuarioAutenticado();
        return usuarioService.actualizarEstadoUsuarioInterno(id, request.estado(), usuario, httpServletRequest);
    }




}
