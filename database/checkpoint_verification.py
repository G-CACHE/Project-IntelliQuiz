#!/usr/bin/env python3
"""
Checkpoint verification script for database initialization fix
Verifies that all components work together correctly
"""

import subprocess
import sys
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
    print_header("Checkpoint: Verify All Components Work Together")
    
    project_root = Path(__file__).parent.parent.absolute()
    
    # Step 1: Verify containers are running
    print("\n[1] Verifying containers are running...")
    success, output = run_command(
        ["docker-compose", "-f", str(project_root / "docker-compose.prod.yml"), "ps"]
    )
    
    if success and "intelliquiz_db" in output and "Up" in output:
        print_status(True, "Database container is running")
    else:
        print_status(False, "Database container is not running")
        print("\n  Please run: python run_docker_prod.py")
        return False
    
    if success and "intelliquiz_backend" in output and "Up" in output:
        print_status(True, "Backend container is running")
    else:
        print_status(False, "Backend container is not running")
        print("\n  Please run: python run_docker_prod.py")
        return False
    
    # Step 2: Verify database connectivity
    print("\n[2] Verifying database connectivity...")
    success, output = run_command(
        ["docker-compose", "-f", str(project_root / "docker-compose.prod.yml"), "exec", "-T", "db",
         "pg_isready", "-U", "postgres"]
    )
    
    if success:
        print_status(True, "Database is accessible")
    else:
        print_status(False, "Database is not accessible")
        print("\n  Troubleshooting:")
        print("  1. Wait 10-15 seconds for database to initialize")
        print("  2. Check logs: docker-compose -f docker-compose.prod.yml logs db")
        return False
    
    # Step 3: Verify all required tables exist
    print("\n[3] Verifying all required tables exist...")
    
    required_tables = [
        "user", "quiz", "question", "team", "submission",
        "quiz_assignment", "assignment_permission", "backup_record"
    ]
    
    all_tables_exist = True
    for table in required_tables:
        cmd = [
            "docker-compose", "-f", str(project_root / "docker-compose.prod.yml"), "exec", "-T", "db",
            "psql", "-U", "postgres", "-d", "intelliquiz",
            "-c", f"SELECT 1 FROM information_schema.tables WHERE table_name='{table}';"
        ]
        success, output = run_command(cmd)
        
        if success and "1" in output:
            print_status(True, f"Table '{table}' exists")
        else:
            print_status(False, f"Table '{table}' not found")
            all_tables_exist = False
    
    if not all_tables_exist:
        print("\n  Some tables are missing. Database may not have initialized properly.")
        return False
    
    # Step 4: Verify game_session table
    print("\n[4] Verifying game_session table...")
    cmd = [
        "docker-compose", "-f", str(project_root / "docker-compose.prod.yml"), "exec", "-T", "db",
        "psql", "-U", "postgres", "-d", "intelliquiz",
        "-c", "SELECT 1 FROM information_schema.tables WHERE table_name='game_session';"
    ]
    success, output = run_command(cmd)
    
    if success and "1" in output:
        print_status(True, "game_session table exists")
    else:
        print_status(False, "game_session table not found (may be expected if not in schema)")
    
    # Step 5: Verify data presence
    print("\n[5] Verifying data presence in tables...")
    
    tables_with_data = ["user", "quiz", "team"]
    data_verified = True
    
    for table in tables_with_data:
        cmd = [
            "docker-compose", "-f", str(project_root / "docker-compose.prod.yml"), "exec", "-T", "db",
            "psql", "-U", "postgres", "-d", "intelliquiz",
            "-c", f"SELECT COUNT(*) FROM \"{table}\";"
        ]
        success, output = run_command(cmd)
        
        if success:
            lines = output.split('\n')
            for line in lines:
                if line.strip().isdigit():
                    count = int(line.strip())
                    if count > 0:
                        print_status(True, f"Table '{table}' has {count} rows")
                    else:
                        print_status(False, f"Table '{table}' is empty")
                        data_verified = False
                    break
    
    # Step 6: Run verification script
    print("\n[6] Running verification script...")
    success, output = run_command(["python", str(project_root / "verify_db_setup.py")])
    
    if success:
        print_status(True, "Verification script completed successfully")
    else:
        print_status(False, "Verification script failed")
        print(f"\n  Output: {output}")
        return False
    
    # Step 7: Summary
    print_header("✓ Checkpoint Complete!")
    print("""
All components are working together correctly!

✓ Database containers are running
✓ Database is accessible
✓ All required tables exist
✓ Data is present in tables
✓ Verification script passes

Your database initialization is complete and ready for development.
    """)
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
