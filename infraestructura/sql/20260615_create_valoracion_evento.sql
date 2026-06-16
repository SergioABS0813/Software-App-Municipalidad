CREATE TABLE IF NOT EXISTS valoracion_evento (
    valoracion_evento_id INT AUTO_INCREMENT PRIMARY KEY,
    evento_id INT NOT NULL,
    inscripcion_id INT NOT NULL,
    vecino_id INT NOT NULL,
    token VARCHAR(120) NOT NULL,
    puntuacion TINYINT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    fecha_generacion DATETIME(6) NOT NULL,
    fecha_expiracion DATETIME(6) NULL,
    fecha_respuesta DATETIME(6) NULL,
    CONSTRAINT uk_valoracion_evento_inscripcion UNIQUE (inscripcion_id),
    CONSTRAINT uk_valoracion_evento_token UNIQUE (token),
    CONSTRAINT chk_valoracion_evento_puntuacion CHECK (puntuacion IS NULL OR puntuacion BETWEEN 1 AND 5),
    CONSTRAINT fk_valoracion_evento_evento FOREIGN KEY (evento_id) REFERENCES evento (evento_id),
    CONSTRAINT fk_valoracion_evento_inscripcion FOREIGN KEY (inscripcion_id) REFERENCES inscripcion (inscripcion_id),
    CONSTRAINT fk_valoracion_evento_vecino FOREIGN KEY (vecino_id) REFERENCES vecino (vecino_id)
);
