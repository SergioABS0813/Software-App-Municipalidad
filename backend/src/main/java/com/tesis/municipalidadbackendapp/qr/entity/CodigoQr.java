package com.tesis.municipalidadbackendapp.qr.entity;

import com.tesis.municipalidadbackendapp.inscripciones.entity.Inscripcion;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "codigo_qr")
public class CodigoQr {
    @Id
    @Column(name = "codigo_qr_id", nullable = false)
    private Integer id;

    @Size(max = 45)
    @Column(name = "token_hash", length = 45)
    private String tokenHash;

    @Column(name = "generado_en")
    private Instant generadoEn;

    @Column(name = "usado_en")
    private Instant usadoEn;

    @Column(name = "fecha_expiracion")
    private Instant fechaExpiracion;

    @Size(max = 45)
    @Column(name = "estado_qr", length = 45)
    private String estadoQr;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "inscripcion_id", nullable = false)
    private Inscripcion inscripcion;


}