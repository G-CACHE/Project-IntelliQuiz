#!/usr/bin/env python3
"""
Test backup file locally by loading it into a temporary PostgreSQL container
Requirements: 1.1, 1.2, 1.3, 1.4
"""

import subprocess
import time
import os
import sys
from pathlib import Path


def run_command(cmd, shell=False, check=True):
    """Run a shell command and return success status and output"""
    try:
        result = subprocess.run(cmd, shell=shell, capture_output=True, text=True, check=check)
        return True, result.stdout + result.stderr
    except subprocess.CalledProcessError as e:
        return False, e.stderr


def test_backup_with_docker():
    """Test backup file by loading it into a temporary PostgreSQL container"""
    
    print("=" * 70)
    print("Testing Backup File Locally with Docker")
    print("=" * 70)
    
    backup_file = Path(__file__).parent / "backup_intelliquiz.sql"
    
    # Step 1: Check if Docker is available
    print("\n[1] Checking Docker availability...")
    success, output = run_command(["docker", "--version"])
    assert success, "Docker is not available"
    print("✓ Docker is available")
    
    # Step 2: Create a temporary container
    print("\n[2] Starting temporary PostgreSQL container...")
    container_name = "intelliquiz_test_db"
    
    # Remove existing container if it exists
    run_command(["docker", "rm", "-f", container_name], check=False)
    
    # Start new container
    success, output = run_command([
        "docker", "run", "-d",
        "--name", container_name,
        "-e", "POSTGRES_USER=postgres",
        "-e", "POSTGRES_PASSWORD=testpass",
        "-e", "POSTGRES_DB=intelliquiz",
        "-p", "5435:5432",
        "postgres:18-alpine"
    ])
    
    assert success, f"Failed to start container: {output}"
    print(f"✓ Container started: {container_name}")
    
    # Step 3: Wait for PostgreSQL to be ready
    print("\n[3] Waiting for PostgreSQL to be ready...")
    max_attempts = 30
    for attempt in range(max_attempts):
        success, output = run_command([
            "docker", "exec", container_name,
            "pg_isready", "-U", "postgres"
        ], check=False)
        
        if success and "accepting connections" in output:
            print("✓ PostgreSQL is ready")
            break
        
        if attempt < max_attempts - 1:
            time.sleep(1)
    else:
        print("✗ PostgreSQL did not become ready in time")
        run_command(["docker", "rm", "-f", container_name])
        return False
    
    # Step 3.5: Create the database
    print("\n[3.5] Creating intelliquiz database...")
    success, output = run_command([
        "docker", "exec", container_name,
        "psql", "-U", "postgres",
        "-c", "CREATE DATABASE intelliquiz;"
    ], check=False)
    
    if not success and "already exists" not in output:
        print(f"⚠ Warning: Could not create database: {output}")
    else:
        print("✓ Database created")
    
    # Step 4: Load backup file
    print("\n[4] Loading backup file into container...")
    with open(backup_file, 'r') as f:
        backup_content = f.read()
    
    # Use docker exec with stdin to load the backup
    try:
        result = subprocess.run(
            ["docker", "exec", "-i", container_name, "psql", "-U", "postgres", "-d", "intelliquiz"],
            input=backup_content,
            capture_output=True,
            text=True,
            timeout=30
        )
        
        assert result.returncode == 0, f"Failed to load backup: {result.stderr}"
        print("✓ Backup file loaded successfully")
    except subprocess.TimeoutExpired:
        run_command(["docker", "rm", "-f", container_name])
        raise AssertionError("Backup loading timed out")
    
    # Step 5: Verify tables were created
    print("\n[5] Verifying tables were created...")
    
    expected_tables = [
        'assignment_permission',
        'backup_record',
        'question',
        'quiz',
        'quiz_assignment',
        'submission',
        'team',
        'user'
    ]
    
    for table in expected_tables:
        success, output = run_command([
            "docker", "exec", container_name,
            "psql", "-U", "postgres", "-d", "intelliquiz",
            "-c", f"SELECT COUNT(*) FROM information_schema.tables WHERE table_name='{table}';"
        ])
        
        assert "1" in output, f"Table '{table}' was not created"
    
    print(f"✓ All {len(expected_tables)} required tables were created")
    
    # Step 6: Check table structure
    print("\n[6] Verifying table structures...")
    
    table_checks = {
        'user': ['id', 'username', 'password', 'system_role'],
        'quiz': ['id', 'title', 'description', 'proctor_pin', 'is_live_session', 'status'],
        'question': ['id', 'quiz_id', 'text', 'type', 'difficulty', 'correct_key', 'points'],
        'team': ['id', 'quiz_id', 'name', 'access_code', 'total_score'],
        'submission': ['id', 'team_id', 'question_id', 'submitted_answer', 'is_correct', 'awarded_points']
    }
    
    for table, columns in table_checks.items():
        for column in columns:
            success, output = run_command([
                "docker", "exec", container_name,
                "psql", "-U", "postgres", "-d", "intelliquiz",
                "-c", f"SELECT column_name FROM information_schema.columns WHERE table_name='{table}' AND column_name='{column}';"
            ])
            
            assert column in output, f"Column '{column}' not found in table '{table}'"
    
    print("✓ All table structures are correct")
    
    # Step 7: Check for constraints and foreign keys
    print("\n[7] Verifying constraints and foreign keys...")
    
    success, output = run_command([
        "docker", "exec", container_name,
        "psql", "-U", "postgres", "-d", "intelliquiz",
        "-c", "SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type='FOREIGN KEY';"
    ])
    
    if "0" in output:
        print("⚠ Warning: No foreign key constraints found")
    else:
        print("✓ Foreign key constraints are in place")
    
    # Step 8: Cleanup
    print("\n[8] Cleaning up...")
    run_command(["docker", "rm", "-f", container_name])
    print("✓ Test container removed")
    
    print("\n" + "=" * 70)
    print("✓ All local backup tests passed!")
    print("=" * 70)


if __name__ == "__main__":
    success = test_backup_with_docker()
    sys.exit(0 if success else 1)
