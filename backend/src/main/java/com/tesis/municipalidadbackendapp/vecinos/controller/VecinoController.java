package com.tesis.municipalidadbackendapp.vecinos.controller;

import com.tesis.municipalidadbackendapp.vecinos.dto.VecinoContactoUpdateRequest;
import com.tesis.municipalidadbackendapp.vecinos.dto.VecinoCuentaVecinalDto;
import com.tesis.municipalidadbackendapp.vecinos.dto.VecinoDetalleDto;
import com.tesis.municipalidadbackendapp.vecinos.dto.VecinoDirectorioDto;
import com.tesis.municipalidadbackendapp.vecinos.dto.VecinoPerfilDto;
import com.tesis.municipalidadbackendapp.vecinos.dto.VecinoPerfilUpdateRequest;
import com.tesis.municipalidadbackendapp.vecinos.service.VecinoService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/vecino")
public class VecinoController {

    private final VecinoService vecinoService;

    @GetMapping("perfil")
    public VecinoPerfilDto obtenerPerfilVecino(@AuthenticationPrincipal Jwt jwt) {
        return vecinoService.obtenerPerfilVecinoAutenticado(
                jwt.getSubject(),
                jwt.getClaimAsString("email")
        );
    }

    @PutMapping("perfil")
    public VecinoPerfilDto actualizarPerfilVecino(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody VecinoPerfilUpdateRequest request
    ) {
        return vecinoService.actualizarPerfilVecinoAutenticado(
                jwt.getSubject(),
                jwt.getClaimAsString("email"),
                request
        );
    }

    @GetMapping("admin/obtener_vecinos")
    public List<VecinoDirectorioDto> obtenerVecinos() {
        return vecinoService.obtenerTodosVecinos();
    }

    @GetMapping("admin/cuentas_vecinales")
    public Page<VecinoCuentaVecinalDto> obtenerCuentasVecinales(
            @RequestParam(required = false) String texto,
            @RequestParam(required = false) String estado,
            @RequestParam(defaultValue = "0") int page
    ) {
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                5,
                Sort.by(Sort.Direction.ASC, "nombre")
        );
        return vecinoService.listarCuentasVecinales(texto, estado, pageable);
    }

    @GetMapping("admin/cuentas_vecinales/{id}")
    public VecinoDetalleDto obtenerDetalleCuentaVecinal(@PathVariable Integer id) {
        return vecinoService.obtenerDetalleCuentaVecinal(id);
    }

    @PutMapping("admin/cuentas_vecinales/{id}/contacto")
    public VecinoDetalleDto actualizarContactoCuentaVecinal(
            @PathVariable Integer id,
            @RequestBody VecinoContactoUpdateRequest request
    ) {
        return vecinoService.actualizarContactoCuentaVecinal(id, request);
    }

    @GetMapping("page")
    public Page<VecinoDirectorioDto> listarDirectorio(
            @RequestParam(required = false) String texto,
            @RequestParam(required = false) Integer estadoId,
            @PageableDefault(size = 10, sort = "nombre") Pageable pageable
    ) {
        return vecinoService.listarDirectorio(texto, estadoId, pageable);
    }
}
