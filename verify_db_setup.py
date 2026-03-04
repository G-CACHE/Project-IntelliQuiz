#!/usr/bin/env python3
"""
Verify that the IntelliQuiz database has been properly initialized with data
Usage: python verify_db_setup.py
"""

import subprocess
import sys
from pathlib import Path

def run_command(cmd):
    """Run a shell command and return output"""
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return True, result.stdout.strip()
    except subprocess.CalledProcessError as e:
        return False, e.stderr.strip()
    except FileNotFoundError:
        return False, f"Command not found: {cmd[0]}"

def print_header(title):
    """Print a formatted header"""
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)

def print_status(status, message):
    """Print a formatted status message"""
    icon = "✓" if status else "✗"
    print(f"{icon} {message}")

def check_table_count(table_name):
    """Check row count in a table"""
    cmd = [
        "docker-compose", "-f", "docker-compose.prod.yml", "exec", "-T", "db",
        "psql", "-U", "postgres", "-d", "intelliquiz",
        "-c", f"SELECT COUNT(*) FROM \"{table_name}\";"
    ]
    success, output = run_command(cmd)
    if success:
        # Extract the count from output
        lines = output.split('\n')
        for line in lines:
            if line.strip().isdigit():
                return int(line.strip())
    return None

def main():
    print_header("IntelliQuiz Database Verification")
    
    project_root = Path(__file__).parent.absolute()
    
    # Check if docker-compose.prod.yml exists
    compose_file = project_root / "docker-compose.prod.yml"
    if not compose_file.exists():
        print_status(False, "docker-compose.prod.yml not found")
        sys.exit(1)
    
    # Check if containers are running
    print("\n[1] Checking if containers are running...")
    cmd = ["docker-compose", "-f", str(compose_file), "ps"]
    success, output = run_command(cmd)
    if not success:
        print_status(False, "Docker containers are not running")
        print("  Run: python run_docker_prod.py")
        sys.exit(1)
    
    if "intelliquiz_db" in output and "Up" in output:
        print_status(True, "Database container is running")
    else:
        print_status(False, "Database container is not running")
        sys.exit(1)
    
    # Check database connectivity
    print("\n[2] Checking database connectivity...")
    cmd = [
        "docker-compose", "-f", str(compose_file), "exec", "-T", "db",
        "pg_isready", "-U", "postgres"
    ]
    success, output = run_command(cmd)
    if success:
        print_status(True, "Database is accessible")
    else:
        print_status(False, "Cannot connect to database")
        sys.exit(1)
    
    # Check key tables
    print("\n[3] Checking database tables...")
    
    tables_to_check = {
        "user": "User accounts",
        "quiz": "Quiz content",
        "question": "Quiz questions",
        "team": "Teams",
        "game_session": "Game sessions"
    }
    
    all_tables_exist = True
    for table_name, description in tables_to_check.items():
        count = check_table_count(table_name)
        if count is not None:
            print_status(True, f"{description} ({table_name}): {count} rows")
        else:
            print_status(False, f"{description} ({table_name}): Not found")
            all_tables_exist = False
    
    if not all_tables_exist:
        print("\n⚠ Warning: Some tables are missing!")
        print("  The database may not have been initialized properly.")
        sys.exit(1)
    
    # Print summary
    print_header("✓ Database Verification Complete!")
    print("""
Your database is properly initialized with all data!

📊 Database Connection Details:
   Host:     localhost
   Port:     5434
   User:     postgres
   Password: mysecretpassword
   Database: intelliquiz

🔍 To manually check the database:
   docker-compose -f docker-compose.prod.yml exec db psql -U postgres -d intelliquiz

📋 To view specific tables:
   Users:    docker-compose -f docker-compose.prod.yml exec db psql -U postgres -d intelliquiz -c "SELECT * FROM \\"user\\";"
   Quizzes:  docker-compose -f docker-compose.prod.yml exec db psql -U postgres -d intelliquiz -c "SELECT * FROM quiz;"
   Teams:    docker-compose -f docker-compose.prod.yml exec db psql -U postgres -d intelliquiz -c "SELECT * FROM team;"

✓ You're all set! Start developing.
    """)

if __name__ == "__main__":
    main()
