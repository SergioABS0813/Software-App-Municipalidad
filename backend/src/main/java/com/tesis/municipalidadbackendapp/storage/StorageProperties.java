package com.tesis.municipalidadbackendapp.storage;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.storage")
public class StorageProperties {
    private String bucketRecursos;
    private int signedUrlMinutes = 30;

    public String getBucketRecursos() {
        return bucketRecursos;
    }

    public void setBucketRecursos(String bucketRecursos) {
        this.bucketRecursos = bucketRecursos;
    }

    public int getSignedUrlMinutes() {
        return signedUrlMinutes;
    }

    public void setSignedUrlMinutes(int signedUrlMinutes) {
        this.signedUrlMinutes = signedUrlMinutes;
    }
}