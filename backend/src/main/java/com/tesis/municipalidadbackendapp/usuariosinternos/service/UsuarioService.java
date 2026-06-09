package com.tesis.municipalidadbackendapp.usuariosinternos.service;

import com.tesis.municipalidadbackendapp.organizacion.service.AreaMunicipalService;
import com.tesis.municipalidadbackendapp.usuariosinternos.dto.UsuarioRequest;
import com.tesis.municipalidadbackendapp.usuariosinternos.dto.UsuarioResponse;
import com.tesis.municipalidadbackendapp.usuariosinternos.entity.Usuario;
import com.tesis.municipalidadbackendapp.usuariosinternos.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UsuarioService {
    private final UsuarioRepository usuarioRepository;
    private final AreaMunicipalService areaMunicipalService;
    private final RolService rolService;
    private final PasswordEncoder passwordEncoder;

    public UsuarioResponse guardarUsuario (UsuarioRequest usuarioRequest) {
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

        return new UsuarioResponse(
                guardado.getId(),
                guardado.getNombre(),
                guardado.getEmail(),
                guardado.getAreaMunicipal().getNombre(),
                guardado.getRol().getNombre());
    }


}
