package com.tesis.municipalidadbackendapp.usuariosinternos.controller;

import com.tesis.municipalidadbackendapp.usuariosinternos.dto.RolConfiguracionDto;
import com.tesis.municipalidadbackendapp.usuariosinternos.entity.Rol;
import com.tesis.municipalidadbackendapp.usuariosinternos.service.RolService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/rol")
public class RolController {

    private final RolService rolService;

    @GetMapping("admin/find_all")
    public List<RolConfiguracionDto> findAll() {
        return rolService.findAll();
    }

    @GetMapping("find_by_id")
    public Rol findById(Integer id) {
        return rolService.findById(id);
    }
}
