package com.tesis.municipalidadbackendapp.storage;

import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URL;
import java.text.Normalizer;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class CloudStorageService {
    private static final Map<String, String> CARPETAS_POR_TIPO = Map.of(
            "IMAGEN_PORTADA", "portada",
            "AFICHE", "afiche",
            "VIDEO", "video",
            "DOCUMENTO", "documentos",
            "EVIDENCIA", "evidencias"
    );
    private static final Set<String> TIPOS_IMAGEN = Set.of("IMAGEN_PORTADA", "EVIDENCIA");
    private static final long MAX_IMAGE_BYTES = 10L * 1024L * 1024L;
    private static final long MAX_VIDEO_BYTES = 200L * 1024L * 1024L;
    private static final long MAX_DOCUMENT_BYTES = 25L * 1024L * 1024L;

    private final Storage storage;
    private final StorageProperties properties;

    public UploadedObject subir(Integer eventoId, String tipoRecurso, MultipartFile archivo) {
        String tipoNormalizado = normalizarTipo(tipoRecurso);
        validarArchivo(tipoNormalizado, archivo);

        String nombreOriginal = StringUtils.cleanPath(
                StringUtils.hasText(archivo.getOriginalFilename()) ? archivo.getOriginalFilename() : "recurso"
        );
        String objectPath = construirObjectPath(eventoId, tipoNormalizado, nombreOriginal);
        BlobInfo blobInfo = BlobInfo.newBuilder(BlobId.of(obtenerBucketRecursos(), objectPath))
                .setContentType(archivo.getContentType())
                .build();

        try {
            storage.create(blobInfo, archivo.getBytes());
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se pudo leer el archivo", exception);
        } catch (RuntimeException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "No se pudo subir el archivo a Google Cloud Storage", exception);
        }

        return new UploadedObject(
                objectPath,
                nombreOriginal,
                archivo.getContentType(),
                archivo.getSize()
        );
    }

    public UploadedObject subirComprobantePago(Integer inscripcionId, MultipartFile archivo) {
        validarComprobantePago(archivo);

        String nombreOriginal = StringUtils.cleanPath(
                StringUtils.hasText(archivo.getOriginalFilename()) ? archivo.getOriginalFilename() : "comprobante"
        );
        String nombreSeguro = normalizarNombreArchivo(nombreOriginal);
        String objectPath = "inscripciones/%d/comprobantes/%s-%s".formatted(inscripcionId, UUID.randomUUID(), nombreSeguro);
        BlobInfo blobInfo = BlobInfo.newBuilder(BlobId.of(obtenerBucketInscripciones(), objectPath))
                .setContentType(archivo.getContentType())
                .build();

        try {
            storage.create(blobInfo, archivo.getBytes());
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se pudo leer el comprobante", exception);
        } catch (RuntimeException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "No se pudo subir el comprobante a Google Cloud Storage", exception);
        }

        return new UploadedObject(
                objectPath,
                nombreOriginal,
                archivo.getContentType(),
                archivo.getSize()
        );
    }

    public void eliminar(String objectPath) {
        if (!StringUtils.hasText(objectPath)) {
            return;
        }
        storage.delete(BlobId.of(obtenerBucketRecursos(), objectPath));
    }

    public String generarSignedUrl(String objectPath) {
        return generarSignedUrl(objectPath, obtenerBucketRecursos());
    }

    public String generarSignedUrlInscripcion(String objectPath) {
        return generarSignedUrl(objectPath, obtenerBucketInscripciones());
    }

    private String generarSignedUrl(String objectPath, String bucketName) {
        if (!StringUtils.hasText(objectPath)) {
            return null;
        }
        BlobInfo blobInfo = BlobInfo.newBuilder(BlobId.of(bucketName, objectPath)).build();
        URL signedUrl = storage.signUrl(
                blobInfo,
                Math.max(1, properties.getSignedUrlMinutes()),
                TimeUnit.MINUTES,
                Storage.SignUrlOption.withV4Signature()
        );
        return signedUrl.toString();
    }

    public String normalizarTipo(String tipoRecurso) {
        String tipoNormalizado = tipoRecurso == null ? "" : tipoRecurso.trim().toUpperCase(Locale.ROOT);
        if (!CARPETAS_POR_TIPO.containsKey(tipoNormalizado)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de recurso no permitido");
        }
        return tipoNormalizado;
    }

    public boolean esTipoUnico(String tipoRecurso) {
        String tipoNormalizado = normalizarTipo(tipoRecurso);
        return Set.of("IMAGEN_PORTADA", "AFICHE", "VIDEO").contains(tipoNormalizado);
    }

    private String construirObjectPath(Integer eventoId, String tipoRecurso, String nombreOriginal) {
        if (eventoId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El evento es obligatorio para subir recursos");
        }

        String carpeta = CARPETAS_POR_TIPO.get(tipoRecurso);
        String nombreSeguro = normalizarNombreArchivo(nombreOriginal);
        return "eventos/%d/%s/%s-%s".formatted(eventoId, carpeta, UUID.randomUUID(), nombreSeguro);
    }

    private void validarComprobantePago(MultipartFile archivo) {
        if (archivo == null || archivo.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El comprobante es obligatorio");
        }

        String contentType = archivo.getContentType();
        boolean permitido = "application/pdf".equals(contentType)
                || "image/jpeg".equals(contentType)
                || "image/png".equals(contentType);
        if (!permitido) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El comprobante debe ser PDF, JPG o PNG");
        }
        if (archivo.getSize() > MAX_DOCUMENT_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El comprobante no debe superar 25 MB");
        }
    }

    private void validarArchivo(String tipoRecurso, MultipartFile archivo) {
        if (archivo == null || archivo.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El archivo es obligatorio");
        }

        String contentType = archivo.getContentType();
        if (!StringUtils.hasText(contentType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El archivo no tiene tipo MIME");
        }

        if (TIPOS_IMAGEN.contains(tipoRecurso)) {
            if (!contentType.startsWith("image/")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El recurso debe ser una imagen");
            }
            if (archivo.getSize() > MAX_IMAGE_BYTES) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La imagen no debe superar 10 MB");
            }
            return;
        }

        if ("AFICHE".equals(tipoRecurso)) {
            boolean afichePermitido = contentType.equals("application/pdf")
                    || contentType.equals("image/jpeg")
                    || contentType.equals("image/png");
            if (!afichePermitido) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El afiche debe ser PDF, JPG o PNG");
            }
            if (archivo.getSize() > MAX_DOCUMENT_BYTES) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El afiche no debe superar 25 MB");
            }
            return;
        }

        if ("VIDEO".equals(tipoRecurso)) {
            if (!contentType.startsWith("video/")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El recurso VIDEO debe ser un archivo de video");
            }
            if (archivo.getSize() > MAX_VIDEO_BYTES) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El video no debe superar 200 MB");
            }
            return;
        }

        if ("DOCUMENTO".equals(tipoRecurso)) {
            boolean documentoPermitido = contentType.equals("application/pdf")
                    || contentType.startsWith("application/vnd.openxmlformats-officedocument")
                    || contentType.startsWith("application/msword")
                    || contentType.startsWith("text/");
            if (!documentoPermitido) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El documento debe ser PDF, Word o texto");
            }
            if (archivo.getSize() > MAX_DOCUMENT_BYTES) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El documento no debe superar 25 MB");
            }
        }
    }

    private String obtenerBucketRecursos() {
        if (!StringUtils.hasText(properties.getBucketRecursos())) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No se configuro GCS_BUCKET_RECURSOS");
        }
        return properties.getBucketRecursos();
    }

    private String obtenerBucketInscripciones() {
        if (!StringUtils.hasText(properties.getBucketInscripciones())) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "No se configuró GCS_BUCKET_INSCRIPCIONES"
            );
        }
        return properties.getBucketInscripciones();
    }

    private String normalizarNombreArchivo(String nombreArchivo) {
        String normalizado = Normalizer.normalize(nombreArchivo, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replaceAll("[^A-Za-z0-9._-]+", "-")
                .replaceAll("-{2,}", "-")
                .replaceAll("(^-|-$)", "");

        if (!StringUtils.hasText(normalizado)) {
            return "recurso";
        }
        return normalizado.length() <= 160 ? normalizado : normalizado.substring(normalizado.length() - 160);
    }

    public record UploadedObject(String objectPath, String nombreOriginal, String mimeType, Long sizeBytes) {}
}