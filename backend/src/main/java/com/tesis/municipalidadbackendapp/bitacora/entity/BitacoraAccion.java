package com.tesis.municipalidadbackendapp.bitacora.entity;

import com.tesis.municipalidadbackendapp.usuariosinternos.entity.Usuario;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "bitacora_accion")
public class BitacoraAccion {
    @Id
    @Column(name = "bitacora_accion_id", nullable = false)
    private Integer id;

    @Size(max = 45)
    @Column(name = "accion", length = 45)
    private String accion;

    @Size(max = 45)
    @Column(name = "entidad_afectada", length = 45)
    private String entidadAfectada;

    @Size(max = 45)
    @Column(name = "entidad_id", length = 45)
    private Integer entidadId;

    @Column(name = "fecha_hora")
    private Instant fechaHora;

    @Size(max = 45)
    @Column(name = "ip_origen", length = 45)
    private String ipOrigen;

    @Column(name = "detalle", columnDefinition = "TEXT")
    private String detalle;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;


}
