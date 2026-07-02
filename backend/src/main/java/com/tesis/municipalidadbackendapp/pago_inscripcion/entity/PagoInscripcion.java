package com.tesis.municipalidadbackendapp.pago_inscripcion.entity;

import com.tesis.municipalidadbackendapp.inscripciones.entity.Inscripcion;
import com.tesis.municipalidadbackendapp.usuariosinternos.entity.Usuario;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "pago_inscripcion")
public class PagoInscripcion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "inscripcion_id", nullable = false)
    private Inscripcion inscripcion;

    @NotNull
    @Column(name = "monto", nullable = false, precision = 10, scale = 2)
    private BigDecimal monto;

    @Size(max = 50)
    @Column(name = "medio_pago", length = 50)
    private String medioPago;

    @Size(max = 100)
    @Column(name = "numero_operacion", length = 100)
    private String numeroOperacion;

    @Column(name = "fecha_pago")
    private LocalDate fechaPago;

    @Lob
    @Column(name = "url_comprobante", columnDefinition = "TEXT")
    private String urlComprobante;

    @Size(max = 30)
    @NotNull
    @Column(name = "estado_pago", nullable = false, length = 30)
    private String estadoPago;

    @Lob
    @Column(name = "observacion", columnDefinition = "TEXT")
    private String observacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "validado_por_usuario_id")
    private Usuario validadoPorUsuario;

    @NotNull
    @Column(name = "fecha_registro", nullable = false)
    private Instant fechaRegistro;

    @Column(name = "fecha_validacion")
    private Instant fechaValidacion;


}