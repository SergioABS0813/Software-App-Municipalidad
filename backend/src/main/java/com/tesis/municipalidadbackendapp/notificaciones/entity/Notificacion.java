package com.tesis.municipalidadbackendapp.notificaciones.entity;

import com.tesis.municipalidadbackendapp.bitacora.entity.BitacoraAccion;
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
@Table(name = "notificacion")
public class Notificacion {
    @Id
    @Column(name = "notificacion_id", nullable = false)
    private Integer id;

    @Size(max = 100)
    @Column(name = "titulo", length = 100)
    private String titulo;

    @Column(name = "mensaje", columnDefinition = "TEXT")
    private String mensaje;

    @Size(max = 45)
    @Column(name = "tipo", length = 45)
    private String tipo;

    @Column(name = "leida")
    private Byte leida;

    @Column(name = "fecha_creacion")
    private Instant fechaCreacion;

    @Column(name = "fecha_lectura")
    private Instant fechaLectura;

    @Size(max = 100)
    @Column(name = "url_destino", length = 100)
    private String urlDestino;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_origen_id", nullable = false)
    private Usuario usuarioOrigen;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_destino_id", nullable = false)
    private Usuario usuarioDestino;

    @Column(name = "fecha_expiracion")
    private Instant fechaExpiracion;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "bitacora_accion_id", nullable = false)
    private BitacoraAccion bitacoraAccion;


}