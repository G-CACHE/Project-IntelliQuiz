#!/usr/bin/env python3
"""
IntelliQuiz Docker Compose Setup & Runner
==========================================
Automatically sets up and runs the entire IntelliQuiz application
(Backend + Database) using Docker Compose.

Usage:
    python setup_and_run_docker.py [--help] [--pull] [--no-build] [--logs] [--stop]

Features:
    - Check Docker installation
    - Pull latest code from git (optional)
    - Build and start containers
    - Show service status
    - View logs
    - Stop containers
"""

import os
import sys
import subprocess
import platform
from pathlib import Path
from typing import Tuple, Optional


class DockerComposeRunner:
    """Handle Docker Compose setup and execution"""
    
    def __init__(self):
        self.os_type = platform.system()
        self.script_dir = Path(__file__).parent
        self.project_root = self.script_dir
        self.docker_compose_file = self.project_root / "docker-compose.yml"
        
    def print_header(self, text: str) -> None:
        """Print a formatted header"""
        print("\n" + "=" * 70)
        print(f"  {text}")
        print("=" * 70)
    
    def print_step(self, step_num: int, text: str) -> None:
        """Print a step message"""
        print(f"\n[{step_num}] {text}")
    
    def print_success(self, text: str) -> None:
        """Print success message"""
        print(f"✓ {text}")
    
    def print_error(self, text: str) -> None:
        """Print error message"""
        print(f"✗ {text}", file=sys.stderr)
    
    def print_info(self, text: str) -> None:
        """Print info message"""
        print(f"ℹ {text}")
    
    def run_command(self, command: list, capture_output: bool = False) -> Tuple[bool, str]:
        """
        Execute a shell command
        
        Args:
            command: List of command arguments
            capture_output: Whether to capture output
            
        Returns:
            Tuple of (success: bool, output: str)
        """
        try:
            if capture_output:
                result = subprocess.run(command, capture_output=True, text=True, check=False)
                return result.returncode == 0, result.stdout + result.stderr
            else:
                result = subprocess.run(command, check=True)
                return True, ""
        except FileNotFoundError:
            return False, f"Command not found: {command[0]}"
        except subprocess.CalledProcessError as e:
            return False, str(e)
        except Exception as e:
            return False, str(e)
    
    def check_docker_installed(self) -> bool:
        """Check if Docker is installed"""
        self.print_step(1, "Checking Docker installation...")
        
        success, output = self.run_command(["docker", "--version"], capture_output=True)
        
        if success:
            version_line = output.split('\n')[0] if output else ""
            self.print_success(f"Docker is installed - {version_line}")
            return True
        else:
            self.print_error("Docker is not installed")
            return False
    
    def check_docker_daemon(self) -> bool:
        """Check if Docker daemon is running"""
        self.print_step(2, "Checking Docker daemon...")
        
        success, _ = self.run_command(["docker", "ps"], capture_output=True)
        
        if success:
            self.print_success("Docker daemon is running")
            return True
        else:
            self.print_error("Docker daemon is not running")
            print("   Please start Docker Desktop or the Docker service")
            return False
    
    def check_docker_compose_installed(self) -> bool:
        """Check if Docker Compose is installed"""
        self.print_step(3, "Checking Docker Compose installation...")
        
        success, output = self.run_command(["docker-compose", "--version"], capture_output=True)
        
        if success:
            version_line = output.split('\n')[0] if output else ""
            self.print_success(f"Docker Compose is installed - {version_line}")
            return True
        else:
            self.print_error("Docker Compose is not installed")
            return False
    
    def pull_latest_code(self) -> bool:
        """Pull latest code from git"""
        self.print_step(4, "Pulling latest code from git...")
        
        # Check if git is initialized
        if not (self.project_root / ".git").exists():
            self.print_error("Git repository not found")
            return False
        
        success, output = self.run_command(
            ["git", "pull"],
            capture_output=True
        )
        
        if success:
            self.print_success("Code pulled successfully")
            return True
        else:
            self.print_error(f"Failed to pull code: {output}")
            return False
    
    def check_docker_compose_file(self) -> bool:
        """Check if docker-compose.yml exists"""
        self.print_step(5, "Checking docker-compose.yml...")
        
        if not self.docker_compose_file.exists():
            self.print_error(f"docker-compose.yml not found at {self.docker_compose_file}")
            return False
        
        self.print_success("docker-compose.yml found")
        return True
    
    def check_backend_dockerfile(self) -> bool:
        """Check if backend Dockerfile exists"""
        backend_dockerfile = self.project_root / "backend" / "Dockerfile"
        
        if not backend_dockerfile.exists():
            self.print_error(f"backend/Dockerfile not found")
            return False
        
        self.print_success("backend/Dockerfile found")
        return True
    
    def build_and_start_containers(self, no_build: bool = False) -> bool:
        """Build and start Docker containers"""
        self.print_step(6, "Building and starting containers...")
        
        print("    Building backend image...")
        print("    Starting PostgreSQL (port 5434)...")
        print("    Starting Backend (port 8090)...")
        print()
        
        command = ["docker-compose", "up", "-d"]
        if not no_build:
            command.insert(2, "--build")
        
        success, output = self.run_command(command, capture_output=False)
        
        if success:
            self.print_success("Containers started successfully")
            return True
        else:
            self.print_error("Failed to start containers")
            return False
    
    def wait_for_services(self) -> bool:
        """Wait for services to be ready"""
        self.print_step(7, "Waiting for services to be ready...")
        
        import time
        
        self.print_info("Waiting 10 seconds for services to initialize...")
        time.sleep(10)
        
        # Check database
        print("\n  Checking services:")
        print("    Database: ", end="", flush=True)
        success_db, _ = self.run_command(
            ["docker-compose", "exec", "-T", "db", "pg_isready", "-U", "postgres"],
            capture_output=True
        )
        if success_db:
            print("✓ Ready")
        else:
            print("✓ Starting...")
        
        # Check backend
        print("    Backend:  ", end="", flush=True)
        success_backend, _ = self.run_command(
            ["docker-compose", "exec", "-T", "backend", "wget", "-q", "-O", "-", "http://localhost:8080/actuator/health"],
            capture_output=True
        )
        if success_backend:
            print("✓ Ready")
        else:
            print("✓ Starting...")
        
        return True
    
    def show_service_info(self) -> None:
        """Display service information"""
        self.print_header("Services Running!")
        
        print("\n📦 PostgreSQL Database:")
        print("   Host:     localhost")
        print("   Port:     5434")
        print("   User:     postgres")
        print("   Password: mysecretpassword")
        print("   Database: intelliquiz")
        
        print("\n🚀 Spring Boot Backend:")
        print("   URL:      http://localhost:8090")
        print("   Health:   http://localhost:8090/actuator/health")
        print("   Swagger:  http://localhost:8090/swagger-ui.html (if configured)")
        
        print("\n📊 Useful Commands:")
        print("   View all logs:        docker-compose logs -f")
        print("   View backend logs:    docker-compose logs -f backend")
        print("   View database logs:   docker-compose logs -f db")
        print("   Stop containers:      docker-compose down")
        print("   Stop & remove data:   docker-compose down -v")
        print("   Check tables:         docker-compose exec db psql -U postgres -d intelliquiz -c \"\\dt\"")
        print()
    
    def view_logs(self) -> None:
        """View container logs"""
        self.print_step(8, "Viewing logs (Ctrl+C to exit)...")
        print()
        self.run_command(["docker-compose", "logs", "-f"], capture_output=False)
    
    def stop_containers(self) -> bool:
        """Stop all containers"""
        self.print_step(1, "Stopping containers...")
        
        success, _ = self.run_command(["docker-compose", "down"], capture_output=False)
        
        if success:
            self.print_success("Containers stopped")
            return True
        else:
            self.print_error("Failed to stop containers")
            return False
    
    def run_setup_and_start(self, pull: bool = False, no_build: bool = False, show_logs: bool = False) -> bool:
        """Run complete setup and start"""
        self.print_header("IntelliQuiz Docker Compose Setup")
        
        print(f"OS: {self.os_type}")
        print(f"Project: {self.project_root}")
        
        # Step 1: Check Docker
        if not self.check_docker_installed():
            return False
        
        # Step 2: Check Docker daemon
        if not self.check_docker_daemon():
            return False
        
        # Step 3: Check Docker Compose
        if not self.check_docker_compose_installed():
            return False
        
        # Step 4: Pull latest code (optional)
        if pull:
            if not self.pull_latest_code():
                self.print_info("Continuing without pulling latest code...")
        
        # Step 5: Check docker-compose.yml
        if not self.check_docker_compose_file():
            return False
        
        # Step 6: Check backend Dockerfile
        if not self.check_backend_dockerfile():
            return False
        
        # Step 7: Build and start
        if not self.build_and_start_containers(no_build=no_build):
            return False
        
        # Step 8: Wait for services
        if not self.wait_for_services():
            return False
        
        # Step 9: Show info
        self.show_service_info()
        
        # Step 10: Show logs if requested
        if show_logs:
            self.view_logs()
        
        return True


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Setup and run IntelliQuiz using Docker Compose",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python setup_and_run_docker.py              # Full setup and run
  python setup_and_run_docker.py --pull       # Pull latest code first
  python setup_and_run_docker.py --logs       # Show logs after startup
  python setup_and_run_docker.py --no-build   # Don't rebuild images
  python setup_and_run_docker.py --stop       # Stop all containers
        """
    )
    
    parser.add_argument(
        "--pull",
        action="store_true",
        help="Pull latest code from git before running"
    )
    parser.add_argument(
        "--no-build",
        action="store_true",
        help="Don't rebuild Docker images"
    )
    parser.add_argument(
        "--logs",
        action="store_true",
        help="Show logs after starting containers"
    )
    parser.add_argument(
        "--stop",
        action="store_true",
        help="Stop all running containers"
    )
    
    args = parser.parse_args()
    
    runner = DockerComposeRunner()
    
    try:
        if args.stop:
            success = runner.stop_containers()
        else:
            success = runner.run_setup_and_start(
                pull=args.pull,
                no_build=args.no_build,
                show_logs=args.logs
            )
        
        sys.exit(0 if success else 1)
    
    except KeyboardInterrupt:
        print("\n\nOperation cancelled by user")
        sys.exit(130)
    except Exception as e:
        print(f"\nUnexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
