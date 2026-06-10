package com.tesis.municipalidadbackendapp.usuariosinternos.service;

import com.tesis.municipalidadbackendapp.bitacora.service.BitacoraAccionService;
import com.tesis.municipalidadbackendapp.organizacion.service.AreaMunicipalService;
import com.tesis.municipalidadbackendapp.usuariosinternos.dto.*;
import com.tesis.municipalidadbackendapp.usuariosinternos.entity.Usuario;
import com.tesis.municipalidadbackendapp.usuariosinternos.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UsuarioService {
    private final UsuarioRepository usuarioRepository;
    private final AreaMunicipalService areaMunicipalService;
    private final RolService rolService;
    private final PasswordEncoder passwordEncoder;
    private final BitacoraAccionService bitacoraAccionService;

    public UsuarioResponse guardarUsuario (UsuarioRequest usuarioRequest, HttpServletRequest httpServletRequest, Usuario usuarioautenticado) {
        Usuario usuario = new Usuario();
        usuario.setNombre(usuarioRequest.nombre());
        usuario.setDni(usuarioRequest.dni());
        usuario.setEmail(usuarioRequest.email());
        //Area Municipal
        usuario.setAreaMunicipal(areaMunicipalService.obtenerAreaMunicipalporId(usuarioRequest.areaMunicipalId()));
        //Rol
        usuario.setRol(rolService.findById(usuarioRequest.rolId()));
        usuario.setPassword(passwordEncoder.encode(usuarioRequest.password()));

        Usuario guardado = usuarioRepository.save(usuario);

        //Guardar en bitacora_accion
        bitacoraAccionService.guardarAccion(
                "CREAR_USUARIO",
                "USUARIO",
                guardado.getId(),
                "Se creó el usuario con nombre: " + guardado.getNombre(),
                usuarioautenticado,
                httpServletRequest
        );

        return new UsuarioResponse(
                guardado.getId(),
                guardado.getNombre(),
                guardado.getEmail(),
                guardado.getAreaMunicipal().getNombre(),
                guardado.getRol().getNombre());
    }

    public List<UsuarioConfiguracionDto> obtenerUsuariosInternos(){
        return usuarioRepository.findAll().stream()
                .map(usuario -> new UsuarioConfiguracionDto(
                        usuario.getId(),
                        usuario.getNombre(),
                        usuario.getEmail(),
                        new RolConfiguracionDto(usuario.getRol().getId(), usuario.getRol().getNombre()),
                        usuario.getActivo()
                ))
                .toList();
    }

    public UsuarioResponseVerDto obtenerUsuarioInternoPorId(Integer id){

        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        return  new UsuarioResponseVerDto(
                usuario.getDni(),
                usuario.getNombre(),
                usuario.getActivo(),
                usuario.getEmail(),
                usuario.getAreaMunicipal().getId(),
                usuario.getRol().getId());
    }


}
