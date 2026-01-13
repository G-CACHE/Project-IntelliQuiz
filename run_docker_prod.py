#!/usr/bin/env python3
"""
Setup and run IntelliQuiz Docker containers from Docker Hub
For team members - simple one-command setup
Usage: python run_docker_prod.py
"""

import subprocess
import sys
import os
import time
from pathlib import Path

def run_command(cmd, shell=False):
    """Run a shell command"""
    try:
        result = subprocess.run(cmd, shell=shell, capture_output=True, text=True, check=True)
        return True, result.stdout
    except subprocess.CalledProcessError as e:
        return False, e.stderr
    except FileNotFoundError:
        return False, f"Command not found: {cmd[0] if isinstance(cmd, list) else cmd}"

def print_header(title):
    """Print a formatted header"""
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)

def print_status(status, message):
    """Print a formatted status message"""
    icon = "✓" if status else "✗"
    print(f"{icon} {message}")

def main():
    print_header("IntelliQuiz Docker Setup (from Docker Hub)")
    
    # Get project root
    project_root = Path(__file__).parent.absolute()
    os.chdir(project_root)
    
    # Step 1: Check Docker
    print("\n[1] Checking Docker installation...")
    success, output = run_command(["docker", "--version"])
    if success:
        print_status(True, output.strip())
    else:
        print_status(False, "Docker is not installed!")
        print("\n  Please install Docker Desktop from: https://www.docker.com/products/docker-desktop")
        sys.exit(1)
    
    # Step 2: Check Docker daemon
    print("\n[2] Checking Docker daemon...")
    success, output = run_command(["docker", "ps"])
    if success:
        print_status(True, "Docker daemon is running")
    else:
        print_status(False, "Docker daemon is not running!")
        print("\n  Please start Docker Desktop and try again.")
        sys.exit(1)
    
    # Step 3: Check Docker Compose
    print("\n[3] Checking Docker Compose...")
    success, output = run_command(["docker-compose", "--version"])
    if success:
        print_status(True, output.strip())
    else:
        print_status(False, "Docker Compose is not installed!")
        sys.exit(1)
    
    # Step 4: Check docker-compose.prod.yml
    print("\n[4] Checking docker-compose configuration...")
    compose_file = project_root / "docker-compose.prod.yml"
    if compose_file.exists():
        print_status(True, f"Found: docker-compose.prod.yml")
    else:
        print_status(False, f"Missing: docker-compose.prod.yml")
        print("\n  Please make sure you're in the correct directory.")
        sys.exit(1)
    
    # Step 5: Pull latest images
    print("\n[5] Pulling latest images from Docker Hub...")
    success, output = run_command(
        ["docker-compose", "-f", str(compose_file), "pull"],
        shell=False
    )
    if success:
        print_status(True, "Images pulled successfully")
    else:
        print_status(False, "Failed to pull images")
        print(f"\n  Error: {output}")
        sys.exit(1)
    
    # Step 6: Start containers
    print("\n[6] Starting containers...")
    success, output = run_command(
        ["docker-compose", "-f", str(compose_file), "up", "-d"],
        shell=False
    )
    if success:
        print_status(True, "Containers started")
    else:
        print_status(False, "Failed to start containers")
        print(f"\n  Error: {output}")
        sys.exit(1)
    
    # Step 7: Wait for services
    print("\n[7] Waiting for services to be ready...")
    print("  (waiting 10 seconds for initialization)")
    time.sleep(10)
    
    # Step 8: Check service health
    print("\n[8] Checking service status...")
    
    # Check database
    success, output = run_command(
        ["docker-compose", "-f", str(compose_file), "exec", "-T", "db", 
         "pg_isready", "-U", "postgres"],
        shell=False
    )
    if success:
        print_status(True, "PostgreSQL: Ready")
    else:
        print_status(False, "PostgreSQL: Not ready yet (wait a few more seconds)")
    
    # Check backend
    success, output = run_command(
        ["docker", "ps", "--filter", "name=intelliquiz_backend", "--format", "{{.Status}}"],
        shell=False
    )
    if success and "Up" in output:
        print_status(True, "Backend: Running")
    else:
        print_status(False, "Backend: Starting...")
    
    # Print summary
    print_header("Services Ready!")
    
    print("""
📦 PostgreSQL Database:
   Host:     localhost
   Port:     5434
   User:     postgres
   Password: mysecretpassword
   Database: intelliquiz

🚀 Spring Boot Backend:
   URL:      http://localhost:8090
   Health:   http://localhost:8090/actuator/health

📊 Useful Commands:
   View logs:       docker-compose -f docker-compose.prod.yml logs -f
   Backend logs:    docker-compose -f docker-compose.prod.yml logs -f backend
   Database logs:   docker-compose -f docker-compose.prod.yml logs -f db
   Stop containers: docker-compose -f docker-compose.prod.yml down
   Check tables:    docker-compose -f docker-compose.prod.yml exec db psql -U postgres -d intelliquiz -c "\\dt"

✓ Setup complete! You're ready to develop.
    """)

if __name__ == "__main__":
    main()
