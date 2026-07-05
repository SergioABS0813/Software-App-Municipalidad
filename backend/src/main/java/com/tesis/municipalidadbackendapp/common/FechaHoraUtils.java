package com.tesis.municipalidadbackendapp.common;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;

public final class FechaHoraUtils {
    public static final ZoneId ZONA_LIMA = ZoneId.of("America/Lima");

    private FechaHoraUtils() {
    }

    public static Instant ahoraLima() {
        return ZonedDateTime.now(ZONA_LIMA).toInstant();
    }

    public static LocalDate fechaActualLima() {
        return LocalDate.now(ZONA_LIMA);
    }

    public static LocalDateTime fechaHoraActualLima() {
        return LocalDateTime.now(ZONA_LIMA);
    }
}
