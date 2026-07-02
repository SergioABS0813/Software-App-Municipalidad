ALTER TABLE evento
  ADD COLUMN requiere_inscripcion TINYINT(1) NOT NULL DEFAULT 1 AFTER encuesta_satisfaccion_habilitado;

UPDATE evento
SET requiere_inscripcion = 1
WHERE requiere_control_asistencia = 1
   OR requiere_pago = 1;

UPDATE evento
SET requiere_pago = 0,
    costo_vecinal = NULL,
    instrucciones_pago = NULL
WHERE requiere_inscripcion = 0;