# IntelliQuiz Backend
# Pre-built JAR approach: run `./mvnw clean package -DskipTests` locally first
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Install PostgreSQL client tools for backup/restore functionality
# Note: Must match or exceed the PostgreSQL server version (16)
RUN apk add --no-cache postgresql16-client

# Create backup directory
RUN mkdir -p /app/backups

# Copy the pre-built JAR (build locally with: ./mvnw clean package -DskipTests)
COPY target/*.jar app.jar

# Copy .env file for environment variables
COPY .env .

# Expose port 8082 (will be mapped to 8090 in docker-compose)
EXPOSE 8082

# Set environment variables for Spring Boot
ENV JAVA_OPTS="-Xmx512m -Xms256m"

# Health check - uses OpenAPI endpoint (public, no auth required)
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=5 \
  CMD wget --quiet --tries=1 --spider http://localhost:8082/v3/api-docs || exit 1

# Run the application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
