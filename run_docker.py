#!/usr/bin/env python3
"""
IntelliQuiz Frontend Developer - Docker Setup
==============================================
Simple script for frontend developers to quickly pull and run
the backend API and database locally.

Usage:
    python run_docker.py [--help] [--logs] [--stop] [--restart]

This script:
    - Pulls latest code from git
    - Builds and starts Backend (port 8090) and Database (port 5434)
    - Displays connection details for API testing
"""

import subprocess
import platform
import sys
from pathlib import Path
from typing import Tuple


class FrontendDockerSetup:
    """Simple Docker setup for frontend developers"""
    
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.os_type = platform.system()
    
    def print_header(self, text: str) -> None:
        """Print header"""
        print("\n" + "=" * 70)
        print(f"  {text}")
        print("=" * 70 + "\n")
    
    def print_success(self, text: str) -> None:
        """Print success"""
        print(f"✓ {text}")
    
    def print_error(self, text: str) -> None:
        """Print error"""
        print(f"✗ {text}", file=sys.stderr)
    
    def print_info(self, text: str) -> None:
        """Print info"""
        print(f"ℹ {text}")
    
    def run_command(self, command: list, capture: bool = False) -> Tuple[bool, str]:
        """Execute command"""
        try:
            if capture:
                result = subprocess.run(command, capture_output=True, text=True, check=False)
                return result.returncode == 0, result.stdout + result.stderr
            else:
                subprocess.run(command, check=True)
                return True, ""
        except FileNotFoundError:
            return False, f"{command[0]} not found"
        except Exception as e:
            return False, str(e)
    
    def check_docker(self) -> bool:
        """Check Docker is installed and running"""
        print("Checking Docker... ", end="", flush=True)
        
        success, _ = self.run_command(["docker", "ps"], capture=True)
        if success:
            print("✓")
            return True
        else:
            print("✗")
            self.print_error("Docker is not running. Please start Docker Desktop.")
            return False
    
    def check_docker_compose(self) -> bool:
        """Check Docker Compose is installed"""
        print("Checking Docker Compose... ", end="", flush=True)
        
        success, _ = self.run_command(["docker-compose", "--version"], capture=True)
        if success:
            print("✓")
            return True
        else:
            print("✗")
            self.print_error("Docker Compose not found. Please install Docker Desktop.")
            return False
    
    def pull_latest_code(self) -> bool:
        """Pull latest code from git"""
        print("Pulling latest code... ", end="", flush=True)
        
        success, output = self.run_command(["git", "pull"], capture=True)
        if success:
            print("✓")
            return True
        else:
            print("⚠")
            self.print_info(f"Could not pull latest code (already up to date or network issue)")
            return True  # Don't fail on this
    
    def start_containers(self) -> bool:
        """Start Docker containers"""
        print("\nStarting containers...\n")
        
        success, _ = self.run_command(["docker-compose", "up", "-d", "--build"])
        if success:
            return True
        else:
            self.print_error("Failed to start containers")
            return False
    
    def wait_and_show_status(self) -> None:
        """Wait a moment and show service status"""
        import time
        
        print("\nWaiting for services to start (10 seconds)...\n")
        time.sleep(10)
        
        self.print_header("🎉 Services are Running!")
        
        print("📱 FRONTEND API ENDPOINT:")
        print("   Base URL: http://localhost:8090")
        print("   Health Check: http://localhost:8090/actuator/health")
        print("   Swagger/API Docs: http://localhost:8090/swagger-ui.html")
        
        print("\n🗄️  DATABASE ACCESS (if needed):")
        print("   Host: localhost")
        print("   Port: 5434")
        print("   Username: postgres")
        print("   Password: mysecretpassword")
        print("   Database: intelliquiz")
        
        print("\n💡 QUICK COMMANDS:")
        print("   View logs: docker-compose logs -f")
        print("   Stop all: docker-compose down")
        print("   Restart: docker-compose restart")
        
        print("\n✨ You're all set! Start your frontend development.\n")
    
    def show_logs(self) -> None:
        """Show real-time logs"""
        self.print_info("Showing logs (Ctrl+C to exit)...\n")
        try:
            self.run_command(["docker-compose", "logs", "-f"])
        except KeyboardInterrupt:
            print("\n\nLogs stopped.")
    
    def stop_containers(self) -> bool:
        """Stop containers"""
        print("Stopping containers... ", end="", flush=True)
        success, _ = self.run_command(["docker-compose", "down"], capture=True)
        if success:
            print("✓")
            self.print_success("Containers stopped")
            return True
        else:
            print("✗")
            return False
    
    def restart_containers(self) -> bool:
        """Restart containers"""
        print("Restarting containers... ", end="", flush=True)
        success, _ = self.run_command(["docker-compose", "restart"], capture=True)
        if success:
            print("✓")
            self.print_success("Containers restarted")
            import time
            time.sleep(5)
            self.wait_and_show_status()
            return True
        else:
            print("✗")
            return False
    
    def run(self, show_logs: bool = False, stop: bool = False, restart: bool = False) -> bool:
        """Run the setup"""
        self.print_header("IntelliQuiz Backend & Database Setup")
        print("For Frontend Developers\n")
        
        # Handle different modes
        if stop:
            return self.stop_containers()
        
        if restart:
            return self.restart_containers()
        
        # Normal startup mode
        print("Quick Checks:")
        if not self.check_docker():
            return False
        
        if not self.check_docker_compose():
            return False
        
        if not self.pull_latest_code():
            pass  # Don't fail on this
        
        if not self.start_containers():
            return False
        
        self.wait_and_show_status()
        
        if show_logs:
            self.show_logs()
        
        return True


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Run backend & database for frontend development",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Quick Start:
  python run_docker.py                # Pull code and start services

Options:
  python run_docker.py --logs         # Start and show logs
  python run_docker.py --restart      # Restart containers
  python run_docker.py --stop         # Stop all containers

That's it! Your backend API will be ready at http://localhost:8090
        """
    )
    
    parser.add_argument("--logs", action="store_true", help="Show logs after startup")
    parser.add_argument("--stop", action="store_true", help="Stop containers")
    parser.add_argument("--restart", action="store_true", help="Restart containers")
    
    args = parser.parse_args()
    
    setup = FrontendDockerSetup()
    
    try:
        success = setup.run(
            show_logs=args.logs,
            stop=args.stop,
            restart=args.restart
        )
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\nSetup cancelled by user")
        sys.exit(130)


if __name__ == "__main__":
    main()
