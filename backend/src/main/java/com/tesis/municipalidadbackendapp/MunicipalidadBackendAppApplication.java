package com.tesis.municipalidadbackendapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class MunicipalidadBackendAppApplication {

    public static void main(String[] args) {
        SpringApplication.run(MunicipalidadBackendAppApplication.class, args);
    }

}
