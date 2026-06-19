CREATE TABLE IF NOT EXISTS evento_operativo (
    evento_operativo_id INT AUTO_INCREMENT PRIMARY KEY,
    evento_id INT NOT NULL,
    usuario_id INT NOT NULL,
    fecha_asignacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    asignado_por INT NULL,
    activo TINYINT NOT NULL DEFAULT 1,
    CONSTRAINT fk_evento_operativo_evento FOREIGN KEY (evento_id) REFERENCES evento (evento_id),
    CONSTRAINT fk_evento_operativo_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (usuario_id),
    CONSTRAINT fk_evento_operativo_asignado_por FOREIGN KEY (asignado_por) REFERENCES usuario (usuario_id),
    INDEX idx_evento_operativo_evento (evento_id),
    INDEX idx_evento_operativo_usuario (usuario_id),
    INDEX idx_evento_operativo_activo (activo)
);
