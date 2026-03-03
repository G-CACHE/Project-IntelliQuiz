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

            // Also load SERVER_PORT and JWT_SECRET from .env
            String serverPort = dotenv.get("SERVER_PORT");
            String jwtSecret = dotenv.get("JWT_SECRET");
            
            if (dbUrl != null) System.setProperty("DB_URL", dbUrl);
            if (dbUsername != null) System.setProperty("DB_USERNAME", dbUsername);
            if (dbPassword != null) System.setProperty("DB_PASSWORD", dbPassword);

            if (serverPort != null) System.setProperty("SERVER_PORT", serverPort);
            if (jwtSecret != null) System.setProperty("JWT_SECRET", jwtSecret);
        } catch (Exception e) {
            // Silently ignore if .env not found (in Docker it's not needed)
            System.err.println("Warning: Could not load .env file: " + e.getMessage());
        }
    }
}
