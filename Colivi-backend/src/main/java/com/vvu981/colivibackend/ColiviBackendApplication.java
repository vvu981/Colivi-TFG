package com.vvu981.colivibackend;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import java.util.TimeZone;

@SpringBootApplication
public class ColiviBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(ColiviBackendApplication.class, args);
    }

    @PostConstruct
    public void init() {
        // Fuerza a la JVM a operar siempre en UTC
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
    }

}
