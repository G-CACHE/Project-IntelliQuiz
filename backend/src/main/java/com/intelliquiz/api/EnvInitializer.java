package com.intelliquiz.api;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;

public class EnvInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {
    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        // Skip dotenv loading in Docker (env vars passed via docker-compose)
        String disableDotenv = System.getenv("DISABLE_DOTENV");
        if ("true".equals(disableDotenv)) {
            return;
        }
        
        try {
            Dotenv dotenv = Dotenv.load();
            
            // Handle null values gracefully
            String dbUrl = dotenv.get("DB_URL");
            String dbUsername = dotenv.get("DB_USERNAME");
            String dbPassword = dotenv.get("DB_PASSWORD");
            
            if (dbUrl != null) System.setProperty("DB_URL", dbUrl);
            if (dbUsername != null) System.setProperty("DB_USERNAME", dbUsername);
            if (dbPassword != null) System.setProperty("DB_PASSWORD", dbPassword);
        } catch (Exception e) {
            // Silently ignore if .env not found (in Docker it's not needed)
            System.err.println("Warning: Could not load .env file: " + e.getMessage());
        }
    }
}
