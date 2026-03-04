#!/usr/bin/env python3
"""
Verify that the IntelliQuiz database has been properly initialized with data
Enhanced with better diagnostics and troubleshooting
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
    # Use ASCII-safe characters for Windows compatibility
    try:
        print(f"{icon} {message}")
    except UnicodeEncodeError:
        # Fallback to ASCII characters
        icon = "[OK]" if status else "[FAIL]"
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

def check_table_exists(table_name):
    """Check if a table exists in the database"""
    cmd = [
        "docker-compose", "-f", "docker-compose.prod.yml", "exec", "-T", "db",
        "psql", "-U", "postgres", "-d", "intelliquiz",
        "-c", f"SELECT 1 FROM information_schema.tables WHERE table_name='{table_name}';"
    ]
    success, output = run_command(cmd)
    return success and "1" in output

def get_container_logs(container_name, lines=50):
    """Get recent logs from a container"""
    cmd = ["docker-compose", "-f", "docker-compose.prod.yml", "logs", "--tail", str(lines), container_name]
    success, output = run_command(cmd)
    return output if success else None

def main():
    print_header("IntelliQuiz Database Verification (Enhanced)")
    
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
        print("\n  Troubleshooting:")
        print("  1. Run: python run_docker_prod.py")
        print("  2. Wait for containers to start (may take 30 seconds)")
        print("  3. Run this script again")
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
        print("\n  Troubleshooting:")
        print("  1. Check if PostgreSQL is fully initialized (wait 10-15 seconds)")
        print("  2. View logs: docker-compose -f docker-compose.prod.yml logs db")
        print("  3. Restart containers: docker-compose -f docker-compose.prod.yml restart")
        sys.exit(1)
    
    # Check key tables
    print("\n[3] Checking database tables...")
    
    tables_to_check = {
        "user": "User accounts",
        "quiz": "Quiz content",
        "question": "Quiz questions",
        "team": "Teams",
        "submission": "Submissions",
        "quiz_assignment": "Quiz assignments",
        "assignment_permission": "Assignment permissions",
        "backup_record": "Backup records"
    }
    
    all_tables_exist = True
    missing_tables = []
    
    for table_name, description in tables_to_check.items():
        if check_table_exists(table_name):
            count = check_table_count(table_name)
            if count is not None:
                print_status(True, f"{description} ({table_name}): {count} rows")
            else:
                print_status(True, f"{description} ({table_name}): Found (unable to count rows)")
        else:
            print_status(False, f"{description} ({table_name}): Not found")
            all_tables_exist = False
            missing_tables.append(table_name)
    
    if not all_tables_exist:
        print("\n⚠ Warning: Some tables are missing!")
        print(f"  Missing tables: {', '.join(missing_tables)}")
        print("\n  Troubleshooting:")
        print("  1. Check database initialization logs:")
        print("     docker-compose -f docker-compose.prod.yml logs db | tail -50")
        print("  2. Verify backup file is valid:")
        print("     python database/test_backup_validity.py")
        print("  3. Restart with fresh database:")
        print("     docker-compose -f docker-compose.prod.yml down -v")
        print("     python run_docker_prod.py")
        sys.exit(1)
    
    # Check for game_session table specifically (was missing in original issue)
    print("\n[4] Checking for game_session table (critical)...")
    if check_table_exists("game_session"):
        count = check_table_count("game_session")
        print_status(True, f"Game sessions (game_session): {count} rows" if count is not None else "Game sessions (game_session): Found")
    else:
        print_status(False, "Game sessions (game_session): Not found")
        print("\n  Note: game_session table is not in the current schema.")
        print("  This may be expected if it's not part of the current database design.")
    
    # Verify backup was loaded successfully
    print("\n[5] Verifying backup file was loaded...")
    cmd = [
        "docker-compose", "-f", str(compose_file), "exec", "-T", "db",
        "psql", "-U", "postgres", "-d", "intelliquiz",
        "-c", "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"
    ]
    success, output = run_command(cmd)
    if success:
        lines = output.split('\n')
        for line in lines:
            if line.strip().isdigit():
                table_count = int(line.strip())
                if table_count >= 8:
                    print_status(True, f"Backup loaded successfully ({table_count} tables found)")
                else:
                    print_status(False, f"Incomplete backup ({table_count} tables, expected at least 8)")
                break
    else:
        print_status(False, "Could not verify backup")
    
    # Print summary
    print_header("✓ Database Verification Complete!")
    print("""
Your database is properly initialized!

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

📝 To view database logs:
   docker-compose -f docker-compose.prod.yml logs db

✓ You're all set! Start developing.
    """)

if __name__ == "__main__":
    main()

if __name__ == "__main__":
    main()
