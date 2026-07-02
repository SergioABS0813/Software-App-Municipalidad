ALTER TABLE evento
  ADD COLUMN requiere_inscripcion TINYINT(1) NOT NULL DEFAULT 1 AFTER encuesta_satisfaccion_habilitado;

UPDATE evento
SET requiere_inscripcion = 1
WHERE requiere_control_asistencia = 1
   OR requiere_pago = 1;

ALTER TABLE evento
  MODIFY COLUMN aforo_maximo INT NULL,
  MODIFY COLUMN meta_tipo VARCHAR(45) NULL,
  MODIFY COLUMN meta_valor FLOAT NULL,
  MODIFY COLUMN encuesta_satisfaccion_habilitado TINYINT(1) NULL;

UPDATE evento
SET requiere_control_asistencia = 0,
    requiere_pago = 0,
    costo_vecinal = NULL,
    instrucciones_pago = NULL,
    aforo_maximo = NULL,
    meta_tipo = NULL,
    meta_valor = NULL,
    encuesta_satisfaccion_habilitado = NULL
WHERE requiere_inscripcion = 0;