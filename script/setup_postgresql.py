#!/usr/bin/env python3
"""
PostgreSQL Setup Script for IntelliQuiz Backend
================================================
This script helps team members set up PostgreSQL on their local environment
for backend development and testing.

Usage:
    python setup_postgresql.py [--help] [--skip-install] [--db-name NAME] [--db-user USER] [--db-password PASSWORD]

Requirements:
    - Python 3.7+
    - PostgreSQL 12+ (will be installed if not present)
    - pip packages: psycopg2-binary, click (will be installed automatically)
"""

import os
import sys
import subprocess
import platform
import json
from pathlib import Path
from typing import Dict, Optional, Tuple
import shutil

try:
    import psycopg2
    from psycopg2 import sql
except ImportError as e:
    psycopg2 = None
    sql = None


class PostgreSQLSetup:
    """Handle PostgreSQL setup for local development"""
    
    def __init__(self, db_name: str = "intelliquiz", db_user: str = "postgres", 
                 db_password: str = "postgres", db_host: str = "localhost", 
                 db_port: int = 5432):
        self.db_name = db_name
        self.db_user = db_user
        self.db_password = db_password
        self.db_host = db_host
        self.db_port = db_port
        self.os_type = platform.system()
        self.project_root = Path(__file__).parent.parent
        self.ddl_dir = self.project_root / "document" / "ddl"
        
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
    
    def check_postgresql_installed(self) -> bool:
        """Check if PostgreSQL is installed"""
        self.print_step(1, "Checking PostgreSQL installation...")
        
        if self.os_type == "Windows":
            success, _ = self.run_command(["psql", "--version"], capture_output=True)
        else:
            success, _ = self.run_command(["which", "psql"], capture_output=True)
        
        if success:
            self.print_success("PostgreSQL is installed")
            return True
        else:
            self.print_error("PostgreSQL is not installed")
            return False
    
    def install_postgresql(self) -> bool:
        """Install PostgreSQL based on OS"""
        self.print_step(2, "Installing PostgreSQL...")
        
        try:
            if self.os_type == "Windows":
                return self._install_postgresql_windows()
            elif self.os_type == "Darwin":  # macOS
                return self._install_postgresql_macos()
            elif self.os_type == "Linux":
                return self._install_postgresql_linux()
            else:
                self.print_error(f"Unsupported OS: {self.os_type}")
                return False
        except Exception as e:
            self.print_error(f"Installation failed: {e}")
            return False
    
    def _install_postgresql_windows(self) -> bool:
        """Install PostgreSQL on Windows"""
        self.print_info("Windows detected. Please download PostgreSQL from:")
        print("  https://www.postgresql.org/download/windows/")
        self.print_info("Run the installer and ensure:")
        print("  - Port is set to 5432")
        print("  - Password is set (remember it for configuration)")
        print("  - pgAdmin is optional")
        
        input("\nPress Enter after PostgreSQL installation is complete...")
        return self.check_postgresql_installed()
    
    def _install_postgresql_macos(self) -> bool:
        """Install PostgreSQL on macOS using Homebrew"""
        # Check if Homebrew is installed
        brew_installed, _ = self.run_command(["which", "brew"], capture_output=True)
        
        if not brew_installed:
            self.print_error("Homebrew is not installed. Please install it first:")
            print("  /bin/bash -c \"$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\"")
            return False
        
        self.print_info("Installing PostgreSQL via Homebrew...")
        success, output = self.run_command(["brew", "install", "postgresql"], capture_output=True)
        
        if success:
            self.print_success("PostgreSQL installed successfully")
            self.print_info("Starting PostgreSQL service...")
            self.run_command(["brew", "services", "start", "postgresql"], capture_output=True)
            self.print_success("PostgreSQL service started")
            return True
        else:
            self.print_error(f"Failed to install PostgreSQL: {output}")
            return False
    
    def _install_postgresql_linux(self) -> bool:
        """Install PostgreSQL on Linux"""
        distro_cmds = {
            "apt": ["sudo", "apt", "update"] and ["sudo", "apt", "install", "-y", "postgresql", "postgresql-contrib"],
            "yum": ["sudo", "yum", "install", "-y", "postgresql-server", "postgresql-contrib"],
            "dnf": ["sudo", "dnf", "install", "-y", "postgresql-server", "postgresql-contrib"],
        }
        
        # Detect package manager
        for pm in ["apt", "yum", "dnf"]:
            pm_installed, _ = self.run_command(["which", pm], capture_output=True)
            if pm_installed:
                self.print_info(f"Installing PostgreSQL via {pm}...")
                if pm == "apt":
                    self.run_command(["sudo", "apt", "update"], capture_output=True)
                    success, output = self.run_command(
                        ["sudo", "apt", "install", "-y", "postgresql", "postgresql-contrib"],
                        capture_output=True
                    )
                else:
                    success, output = self.run_command(
                        ["sudo", pm, "install", "-y", "postgresql-server", "postgresql-contrib"],
                        capture_output=True
                    )
                
                if success:
                    self.print_success("PostgreSQL installed successfully")
                    return True
                else:
                    self.print_error(f"Failed to install PostgreSQL: {output}")
                    return False
        
        self.print_error("No supported package manager found (apt, yum, dnf)")
        return False
    
    def install_python_dependencies(self) -> bool:
        """Install required Python packages"""
        self.print_step(3, "Installing Python dependencies...")
        
        packages = ["psycopg2-binary", "click"]
        for package in packages:
            self.print_info(f"Installing {package}...")
            success, output = self.run_command(
                [sys.executable, "-m", "pip", "install", package],
                capture_output=True
            )
            if success:
                self.print_success(f"{package} installed")
            else:
                self.print_error(f"Failed to install {package}: {output}")
                return False
        
        return True
    
    def check_database_exists(self, connection) -> bool:
        """Check if the database already exists"""
        try:
            cursor = connection.cursor()
            cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", (self.db_name,))
            exists = cursor.fetchone() is not None
            cursor.close()
            return exists
        except Exception as e:
            self.print_error(f"Error checking database: {e}")
            return False
    
    def create_database(self) -> bool:
        """Create the IntelliQuiz database"""
        self.print_step(4, "Creating database...")
        
        try:
            # Connect to default postgres database
            connection = psycopg2.connect(
                host=self.db_host,
                port=self.db_port,
                user=self.db_user,
                password=self.db_password,
                database="postgres"
            )
            connection.autocommit = True
            
            # Check if database exists
            if self.check_database_exists(connection):
                self.print_info(f"Database '{self.db_name}' already exists")
                connection.close()
                return True
            
            # Create database
            cursor = connection.cursor()
            cursor.execute(sql.SQL("CREATE DATABASE {}").format(
                sql.Identifier(self.db_name)
            ))
            cursor.close()
            connection.close()
            
            self.print_success(f"Database '{self.db_name}' created successfully")
            return True
            
        except psycopg2.Error as e:
            self.print_error(f"Failed to create database: {e}")
            return False
    
    def execute_sql_file(self, filepath: Path, db_connection) -> bool:
        """Execute SQL file against the database"""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                sql_content = f.read()
            
            cursor = db_connection.cursor()
            cursor.execute(sql_content)
            db_connection.commit()
            cursor.close()
            return True
        except Exception as e:
            self.print_error(f"Error executing {filepath.name}: {e}")
            return False
    
    def setup_schema(self) -> bool:
        """Setup database schema from DDL files"""
        self.print_step(5, "Setting up database schema...")
        
        try:
            connection = psycopg2.connect(
                host=self.db_host,
                port=self.db_port,
                user=self.db_user,
                password=self.db_password,
                database=self.db_name
            )
            
            # Execute DDL files
            ddl_files = [
                self.ddl_dir / "complete_schema.sql",
            ]
            
            for ddl_file in ddl_files:
                if ddl_file.exists():
                    self.print_info(f"Executing {ddl_file.name}...")
                    if not self.execute_sql_file(ddl_file, connection):
                        connection.close()
                        return False
                    self.print_success(f"{ddl_file.name} executed")
                else:
                    self.print_info(f"Skipping {ddl_file.name} (not found)")
            
            connection.close()
            return True
            
        except psycopg2.Error as e:
            self.print_error(f"Database connection failed: {e}")
            return False
    
    def save_configuration(self) -> bool:
        """Save database configuration to a .env file"""
        self.print_step(6, "Saving configuration...")
        
        env_file = self.project_root / ".env.local"
        
        config = {
            "DATABASE_HOST": self.db_host,
            "DATABASE_PORT": self.db_port,
            "DATABASE_NAME": self.db_name,
            "DATABASE_USER": self.db_user,
            "DATABASE_PASSWORD": self.db_password,
            "DATABASE_URL": f"postgresql://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"
        }
        
        try:
            # Save as .env format
            with open(env_file, 'w', encoding='utf-8') as f:
                f.write("# IntelliQuiz Database Configuration\n")
                f.write("# Auto-generated by setup_postgresql.py\n\n")
                for key, value in config.items():
                    f.write(f"{key}={value}\n")
            
            self.print_success(f"Configuration saved to {env_file.name}")
            
            # Also save as JSON for reference
            json_file = self.project_root / ".env.local.json"
            with open(json_file, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=2)
            
            return True
        except Exception as e:
            self.print_error(f"Failed to save configuration: {e}")
            return False
    
    def test_connection(self) -> bool:
        """Test database connection"""
        self.print_step(7, "Testing database connection...")
        
        try:
            connection = psycopg2.connect(
                host=self.db_host,
                port=self.db_port,
                user=self.db_user,
                password=self.db_password,
                database=self.db_name
            )
            
            cursor = connection.cursor()
            cursor.execute("SELECT version();")
            version = cursor.fetchone()
            cursor.close()
            connection.close()
            
            self.print_success("Database connection successful!")
            if version:
                self.print_info(f"PostgreSQL version: {version[0].split(',')[0]}")
            
            return True
        except psycopg2.Error as e:
            self.print_error(f"Connection test failed: {e}")
            return False
    
    def run_setup(self, skip_install: bool = False) -> bool:
        """Run complete setup"""
        self.print_header("IntelliQuiz PostgreSQL Setup")
        
        print(f"\nOS: {self.os_type}")
        print(f"Database: {self.db_name}")
        print(f"User: {self.db_user}")
        print(f"Host: {self.db_host}:{self.db_port}")
        
        # Step 1: Check PostgreSQL
        if not self.check_postgresql_installed():
            if skip_install:
                self.print_error("PostgreSQL not installed and --skip-install was specified")
                return False
            if not self.install_postgresql():
                return False
        
        # Step 2: Install Python dependencies
        if not self.install_python_dependencies():
            return False
        
        # Step 3: Create database
        if not self.create_database():
            return False
        
        # Step 4: Setup schema
        if not self.setup_schema():
            return False
        
        # Step 5: Save configuration
        if not self.save_configuration():
            return False
        
        # Step 6: Test connection
        if not self.test_connection():
            return False
        
        self.print_header("Setup Complete!")
        print(f"\nYour PostgreSQL environment is ready for IntelliQuiz backend development.")
        print(f"\nDatabase Details:")
        print(f"  Host:     {self.db_host}")
        print(f"  Port:     {self.db_port}")
        print(f"  Database: {self.db_name}")
        print(f"  User:     {self.db_user}")
        print(f"\nConfiguration saved to: .env.local")
        print(f"\nNext Steps:")
        print(f"  1. Update your backend application with these credentials")
        print(f"  2. Start your backend server")
        print(f"  3. Begin testing!")
        
        return True


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Setup PostgreSQL for IntelliQuiz backend development",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python setup_postgresql.py                          # Default setup
  python setup_postgresql.py --db-password mypass     # Custom password
  python setup_postgresql.py --skip-install           # Skip PostgreSQL installation
  python setup_postgresql.py --db-name mydb --db-user myuser  # Custom DB/User
        """
    )
    
    parser.add_argument(
        "--skip-install",
        action="store_true",
        help="Skip PostgreSQL installation check"
    )
    parser.add_argument(
        "--db-name",
        default="intelliquiz",
        help="Database name (default: intelliquiz)"
    )
    parser.add_argument(
        "--db-user",
        default="postgres",
        help="Database user (default: postgres)"
    )
    parser.add_argument(
        "--db-password",
        default="postgres",
        help="Database password (default: postgres)"
    )
    parser.add_argument(
        "--db-host",
        default="localhost",
        help="Database host (default: localhost)"
    )
    parser.add_argument(
        "--db-port",
        type=int,
        default=5432,
        help="Database port (default: 5432)"
    )
    
    args = parser.parse_args()
    
    setup = PostgreSQLSetup(
        db_name=args.db_name,
        db_user=args.db_user,
        db_password=args.db_password,
        db_host=args.db_host,
        db_port=args.db_port
    )
    
    success = setup.run_setup(skip_install=args.skip_install)
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
