package com.tesis.municipalidadbackendapp.eventos.entity;

import com.tesis.municipalidadbackendapp.organizacion.entity.AreaMunicipal;
import com.tesis.municipalidadbackendapp.ubicacion.entity.Ubicacion;
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
@Table(name = "evento")
public class Evento {
    @Id
    @Column(name = "evento_id", nullable = false)
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Size(max = 100)
    @Column(name = "titulo", length = 100)
    private String titulo;

    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoria_id")
    private Categoria categoria;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="area_municipal_id")
    private AreaMunicipal areaMunicipal;

    @Column(name = "fecha_hora_inicio")
    private Instant fechaHoraInicio;

    @Column(name = "fecha_hora_fin")
    private Instant fechaHoraFin;

    @Column(name = "costo_referencial")
    private Float costoReferencial;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estado_evento_id", nullable = false)
    private EstadoEvento estadoEvento;

    @ManyToOne(fetch = FetchType.LAZY, optional=false)
    @JoinColumn(name="ubicacion_id")
    private Ubicacion ubicacion;

    @Column(name = "aforo_maximo")
    private Integer aforoMaximo;

    @Size(max = 45)
    @Column(name = "meta_tipo", length = 45)
    private String metaTipo;

    @Column(name = "meta_valor")
    private Float metaValor;

    @Column(name = "encuesta_satisfaccion_habilitado")
    private Byte encuestaSatisfaccionHabilitado;

    @Column(name = "tiempo_creado")
    private Instant tiempoCreado;

    @Column(name = "tiempo_actualizado")
    private Instant tiempoActualizado;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional=false)
    @JoinColumn(name="usuario_id",  nullable = false)
    private Usuario usuario;

    @Column(name = "edad_min")
    private Byte edadMin;

    @Column(name = "edad_max")
    private Byte edadMax;

    @Column(name = "evento_actualizado_en")
    private Instant eventoActualizadoEn;

    @Size(max = 45)
    @Column(name = "descripcion_breve", length = 45)
    private String descripcionBreve;

    @Column(name = "requiere_control_asistencia", nullable = false)
    private Byte requiereControlAsistencia = 1;

    @Column(name = "requiere_inscripcion", nullable = false)
    private Byte requiereInscripcion = 1;

    @Column(name = "motivo_cancelacion", columnDefinition = "TEXT")
    private String motivoCancelacion;

    @Column(name = "fecha_cancelacion")
    private Instant fechaCancelacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_cancelacion_id")
    private Usuario usuarioCancelacion;

    @Column(name="requiere_pago")
    private Byte requierePago;

    @Column(name="costo_vecinal")
    private Float costoVecinal;

    @Column(name="instrucciones_pago", columnDefinition = "TEXT")
    private String instruccionesPago;


}
