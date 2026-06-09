package com.tesis.municipalidadbackendapp.asistencias.entity;

import com.tesis.municipalidadbackendapp.inscripciones.entity.Inscripcion;
import com.tesis.municipalidadbackendapp.usuariosinternos.entity.Usuario;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "asistencia")
public class Asistencia {
    @Id
    @Column(name = "asistencia_id", nullable = false)
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Size(max = 45)
    @Column(name = "fecha_hora_validacion", length = 45)
    private String fechaHoraValidacion;

    @NotNull
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "inscripcion_id", nullable = false)
    private Inscripcion inscripcion;

    @Size(max = 45)
    @Column(name = "estado", length = 45)
    private String estado;

    @Size(max = 45)
    @Column(name = "metodo_validacion", length = 45)
    private String metodoValidacion;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "validado_por_usuario_id", nullable = false)
    private Usuario validadoPorUsuario;

    @Column(name = "motivo", columnDefinition = "TEXT")
    private String motivo;


}