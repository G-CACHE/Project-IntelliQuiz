# Multi-stage build for IntelliQuiz Backend
# Stage 1: Build the application
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /app

# Copy backend project files
COPY pom.xml .
COPY src ./src
COPY .mvn ./.mvn
COPY mvnw* ./

# Build the application (skip tests for faster build)
RUN chmod +x mvnw && ./mvnw clean package -DskipTests -q

# Stage 2: Run the application
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Install PostgreSQL client tools for backup/restore functionality
# Note: Must match or exceed the PostgreSQL server version (16)
RUN apk add --no-cache postgresql16-client

# Create backup directory
RUN mkdir -p /app/backups

# Copy the JAR file from builder stage
COPY --from=builder /app/target/*.jar app.jar

# Copy .env file for environment variables
COPY .env .

# Expose port 8080 (will be mapped to 8090 in docker-compose)
EXPOSE 8080

# Set environment variables for Spring Boot
ENV JAVA_OPTS="-Xmx512m -Xms256m"

# Health check - simplified to just check if port is open
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=5 \
  CMD wget --quiet --tries=1 --spider http://localhost:8082/ || exit 1

# Run the application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
