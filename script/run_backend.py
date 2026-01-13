#!/usr/bin/env python3
"""
IntelliQuiz Backend Runner
===========================
This script compiles and runs the Spring Boot backend application.

Usage:
    python run_backend.py [--help] [--clean-only] [--compile-only] [--no-tests] [--offline]

Features:
    - Clean packages
    - Install/update dependencies
    - Compile Spring Boot project
    - Run the application
"""

import os
import sys
import subprocess
import platform
from pathlib import Path
from typing import Tuple


class BackendRunner:
    """Handle Spring Boot backend compilation and execution"""
    
    def __init__(self):
        self.os_type = platform.system()
        self.script_dir = Path(__file__).parent
        self.project_root = self.script_dir.parent
        self.backend_dir = self.project_root / "backend"
        
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
    
    def run_command(self, command: list, capture_output: bool = False, 
                   show_output: bool = True) -> Tuple[bool, str]:
        """
        Execute a shell command
        
        Args:
            command: List of command arguments
            capture_output: Whether to capture output
            show_output: Whether to print output in real-time
            
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
    
    def check_maven_installed(self) -> bool:
        """Check if Maven is installed"""
        self.print_step(1, "Checking Maven installation...")
        
        success, output = self.run_command(["mvn", "--version"], capture_output=True)
        
        if success:
            # Extract version info
            version_line = output.split('\n')[0] if output else ""
            self.print_success(f"Maven is installed - {version_line}")
            return True
        else:
            self.print_error("Maven is not installed")
            return False
    
    def install_maven(self) -> bool:
        """Guide user to install Maven"""
        self.print_info("Please install Maven:")
        
        if self.os_type == "Windows":
            print("  Option 1 (Chocolatey): choco install maven")
            print("  Option 2 (Manual):     https://maven.apache.org/download.cgi")
        elif self.os_type == "Darwin":  # macOS
            print("  Using Homebrew: brew install maven")
            print("  Or download:    https://maven.apache.org/download.cgi")
        elif self.os_type == "Linux":
            print("  Ubuntu/Debian:  sudo apt install maven")
            print("  CentOS/RHEL:    sudo yum install maven")
            print("  Or download:    https://maven.apache.org/download.cgi")
        
        return False
    
    def check_backend_directory(self) -> bool:
        """Check if backend directory exists"""
        self.print_step(2, "Locating backend directory...")
        
        if not self.backend_dir.exists():
            self.print_error(f"Backend directory not found: {self.backend_dir}")
            return False
        
        if not (self.backend_dir / "pom.xml").exists():
            self.print_error("pom.xml not found in backend directory")
            return False
        
        self.print_success(f"Backend directory found: {self.backend_dir}")
        return True
    
    def clean_packages(self) -> bool:
        """Clean Maven packages"""
        self.print_step(3, "Cleaning packages...")
        
        self.print_info("Running: mvn clean")
        
        success, output = self.run_command(
            ["mvn", "clean"],
            capture_output=False
        )
        
        if success:
            self.print_success("Packages cleaned successfully")
            return True
        else:
            self.print_error("Package clean failed")
            return False
    
    def install_dependencies(self) -> bool:
        """Install/update Maven dependencies"""
        self.print_step(4, "Installing/updating dependencies...")
        
        self.print_info("Running: mvn dependency:resolve")
        
        success, output = self.run_command(
            ["mvn", "dependency:resolve"],
            capture_output=False
        )
        
        if success:
            self.print_success("Dependencies installed/updated successfully")
            return True
        else:
            self.print_error("Dependency installation failed")
            return False
    
    def compile_project(self, skip_tests: bool = True) -> bool:
        """Compile the Spring Boot project"""
        self.print_step(5, "Compiling Spring Boot project...")
        
        command = ["mvn", "clean", "package"]
        if skip_tests:
            command.append("-DskipTests")
        
        self.print_info(f"Running: {' '.join(command)}")
        
        success, output = self.run_command(command, capture_output=False)
        
        if success:
            self.print_success("Compilation successful")
            return True
        else:
            self.print_error("Compilation failed")
            return False
    
    def find_jar_file(self) -> Path or None:
        """Find the compiled JAR file"""
        target_dir = self.backend_dir / "target"
        
        if not target_dir.exists():
            return None
        
        # Find JAR files, excluding original-*.jar
        jar_files = [
            f for f in target_dir.glob("*.jar")
            if not f.name.startswith("original-")
        ]
        
        if not jar_files:
            return None
        
        # Return the latest JAR file (by modification time)
        return max(jar_files, key=lambda f: f.stat().st_mtime)
    
    def run_application(self) -> bool:
        """Run the Spring Boot application"""
        self.print_step(6, "Starting Spring Boot application...")
        
        jar_file = self.find_jar_file()
        
        if not jar_file:
            self.print_error("No JAR file found in target directory")
            return False
        
        self.print_success(f"Found JAR: {jar_file.name}")
        
        print("\n" + "=" * 70)
        print("  Application is running...")
        print("  Press Ctrl+C to stop")
        print("=" * 70 + "\n")
        
        try:
            subprocess.run(["java", "-jar", str(jar_file)], check=True)
            return True
        except KeyboardInterrupt:
            print("\n\nApplication stopped by user")
            return True
        except Exception as e:
            self.print_error(f"Failed to run application: {e}")
            return False
    
    def run_full_pipeline(self, skip_tests: bool = True, offline: bool = False) -> bool:
        """Run complete pipeline: clean, install, compile, run"""
        self.print_header("IntelliQuiz Backend Runner")
        
        print(f"OS: {self.os_type}")
        print(f"Backend: {self.backend_dir}")
        print(f"Skip Tests: {skip_tests}")
        
        # Step 1: Check Maven
        if not self.check_maven_installed():
            self.install_maven()
            return False
        
        # Step 2: Check backend directory
        if not self.check_backend_directory():
            return False
        
        # Step 3: Change to backend directory
        os.chdir(self.backend_dir)
        
        # Step 4: Clean packages
        if not self.clean_packages():
            return False
        
        # Step 5: Install dependencies
        if not self.install_dependencies():
            return False
        
        # Step 6: Compile
        if not self.compile_project(skip_tests=skip_tests):
            return False
        
        # Step 7: Run application
        if not self.run_application():
            return False
        
        return True
    
    def clean_only(self) -> bool:
        """Run only clean step"""
        self.print_header("IntelliQuiz Backend - Clean Only")
        
        if not self.check_backend_directory():
            return False
        
        os.chdir(self.backend_dir)
        return self.clean_packages()
    
    def compile_only(self, skip_tests: bool = True) -> bool:
        """Run clean and compile only (no run)"""
        self.print_header("IntelliQuiz Backend - Compile Only")
        
        if not self.check_maven_installed():
            self.install_maven()
            return False
        
        if not self.check_backend_directory():
            return False
        
        os.chdir(self.backend_dir)
        
        if not self.clean_packages():
            return False
        
        if not self.install_dependencies():
            return False
        
        if not self.compile_project(skip_tests=skip_tests):
            return False
        
        self.print_header("Compilation Complete")
        jar_file = self.find_jar_file()
        if jar_file:
            self.print_success(f"JAR file ready: {jar_file.name}")
            self.print_info(f"Location: {jar_file}")
        
        return True


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Compile and run IntelliQuiz Spring Boot backend",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python run_backend.py                    # Full pipeline: clean, install, compile, run
  python run_backend.py --clean-only       # Only clean packages
  python run_backend.py --compile-only     # Clean and compile, don't run
  python run_backend.py --no-tests         # Skip tests during compilation
  python run_backend.py --offline          # Use cached dependencies (offline mode)
        """
    )
    
    parser.add_argument(
        "--clean-only",
        action="store_true",
        help="Only clean packages (don't compile or run)"
    )
    parser.add_argument(
        "--compile-only",
        action="store_true",
        help="Clean and compile, don't run the application"
    )
    parser.add_argument(
        "--no-tests",
        action="store_true",
        default=True,
        help="Skip tests during compilation (default: True)"
    )
    parser.add_argument(
        "--run-tests",
        action="store_false",
        dest="no_tests",
        help="Run tests during compilation"
    )
    parser.add_argument(
        "--offline",
        action="store_true",
        help="Use offline mode (cached dependencies only)"
    )
    
    args = parser.parse_args()
    
    runner = BackendRunner()
    
    try:
        if args.clean_only:
            success = runner.clean_only()
        elif args.compile_only:
            success = runner.compile_only(skip_tests=args.no_tests)
        else:
            success = runner.run_full_pipeline(skip_tests=args.no_tests)
        
        sys.exit(0 if success else 1)
    
    except KeyboardInterrupt:
        print("\n\nOperation cancelled by user")
        sys.exit(130)
    except Exception as e:
        print(f"\nUnexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
