package com.tesis.municipalidadbackendapp.vecinos.dto;

import com.tesis.municipalidadbackendapp.vecinos.entity.EstadoVecino;

public record VecinoDirectorioDto (Integer id,
                                   String nombre,
                                   String dni,
                                   String email,
                                   EstadoVecinoDirectorioDto estadoVecino
                                    ) {
}
