package com.tesis.municipalidadbackendapp.usuariosinternos.service;

import com.tesis.municipalidadbackendapp.usuariosinternos.dto.RolConfiguracionDto;
import com.tesis.municipalidadbackendapp.usuariosinternos.entity.Rol;
import com.tesis.municipalidadbackendapp.usuariosinternos.repository.RolRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RolService {
    private final RolRepository rolRepository;

    public List<RolConfiguracionDto> findAll() {
        return rolRepository.findAll().stream().map(rol -> new RolConfiguracionDto(
                rol.getId(),
                rol.getNombre()
        )).toList();
    }

    public Rol findById(Integer id) {
        return rolRepository.findById(id).orElse(null);
    }
}
