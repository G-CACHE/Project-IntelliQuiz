#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo
echo "==============================================="
echo "  IntelliQuiz Docker Compose Builder"
echo "==============================================="
echo

# Check if Docker is installed
echo "[1] Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker is not installed${NC}"
    echo
    echo "Please install Docker from: https://www.docker.com/products/docker-desktop"
    exit 1
else
    docker --version
    echo -e "${GREEN}✓ Docker is installed${NC}"
fi

# Check if Docker Daemon is running
echo "[2] Checking Docker daemon..."
if ! docker ps > /dev/null 2>&1; then
    echo -e "${RED}✗ Docker daemon is not running${NC}"
    echo "Please start Docker Desktop or the Docker service"
    exit 1
else
    echo -e "${GREEN}✓ Docker daemon is running${NC}"
fi

# Navigate to project root
PROJECT_ROOT="$(dirname "$(dirname "$(readlink -f "$0")")")"
cd "$PROJECT_ROOT" || exit 1

echo "[3] Using project root: $PROJECT_ROOT"

# Check if docker-compose.yml exists
echo "[4] Checking docker-compose.yml..."
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}✗ docker-compose.yml not found${NC}"
    exit 1
else
    echo -e "${GREEN}✓ docker-compose.yml found${NC}"
fi

# Build and start containers
echo
echo "[5] Building and starting containers..."
echo "    Building backend image..."
echo "    Starting PostgreSQL (port 5434)..."
echo "    Starting Backend (port 8090)..."
echo

docker-compose up --build -d

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Containers started successfully${NC}"
    echo
    echo "==============================================="
    echo "  Services are running!"
    echo "==============================================="
    echo
    echo -e "${BLUE}PostgreSQL Database:${NC}"
    echo "  Host:     localhost"
    echo "  Port:     5434"
    echo "  User:     postgres"
    echo "  Password: mysecretpassword"
    echo "  Database: intelliquiz"
    echo
    echo -e "${BLUE}Spring Boot Backend:${NC}"
    echo "  URL:      http://localhost:8090"
    echo "  Swagger:  http://localhost:8090/swagger-ui.html (if configured)"
    echo "  Health:   http://localhost:8090/actuator/health"
    echo
    echo -e "${BLUE}Useful Commands:${NC}"
    echo "  View logs:              docker-compose logs -f"
    echo "  View backend logs:      docker-compose logs -f backend"
    echo "  View database logs:     docker-compose logs -f db"
    echo "  Stop containers:        docker-compose down"
    echo "  Stop and remove volumes: docker-compose down -v"
    echo
    echo "Waiting for services to be ready..."
    sleep 10
    
    echo -e "${BLUE}Checking service health...${NC}"
    
    # Check database
    echo -n "  Database: "
    if docker-compose exec -T db pg_isready -U postgres > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Ready${NC}"
    else
        echo -e "${YELLOW}⊘ Starting...${NC}"
    fi
    
    # Check backend
    echo -n "  Backend: "
    if curl -s http://localhost:8090/actuator/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Ready${NC}"
    else
        echo -e "${YELLOW}⊘ Starting...${NC}"
    fi
    
    echo
    echo "Backend is compiling and starting. This may take a few moments..."
    echo "Monitor progress with: docker-compose logs -f backend"
else
    echo -e "${RED}✗ Failed to start containers${NC}"
    docker-compose logs
    exit 1
fi
