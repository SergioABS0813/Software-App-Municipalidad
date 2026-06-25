package com.tesis.municipalidadbackendapp.apiDni.dto;

public record DniResponseDto (boolean success,
                              String message,
                              JsonApiDniData data){

    public record JsonApiDniData(String numero,
                                 String nombre_completo,
                                 String nombres,
                                 String apellido_paterno,
                                 String apellido_materno,
                                 Integer codigo_verificacion){}
}
