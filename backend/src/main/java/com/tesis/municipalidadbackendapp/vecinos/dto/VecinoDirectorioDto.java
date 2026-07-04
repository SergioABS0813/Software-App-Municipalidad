package com.tesis.municipalidadbackendapp.vecinos.dto;

public record VecinoDirectorioDto (Integer id,
                                   String nombre,
                                   String dni,
                                   String email,
                                   EstadoVecinoDirectorioDto estadoVecino
                                    ) {
}
