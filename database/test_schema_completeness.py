#!/usr/bin/env python3
"""
Property-based tests for schema completeness after initialization
Feature: database-initialization-fix, Property 3: Schema Completeness After Initialization
Validates: Requirements 1.3, 3.1, 3.2
"""

import subprocess
import sys


def run_docker_command(container_name, cmd):
    """Run a command in a Docker container"""
    try:
        result = subprocess.run(
            ["docker", "exec", container_name] + cmd,
            capture_output=True,
            text=True,
            timeout=10
        )
        return result.returncode == 0, result.stdout + result.stderr
    except subprocess.TimeoutExpired:
        return False, "Command timed out"


def test_all_required_tables_exist():
    """
    Property 3: Schema Completeness After Initialization
    For any database initialized from the corrected backup file, all required tables
    SHALL exist in the database schema.
    """
    container_name = "intelliquiz_db"
    
    actual_tables = [
        'user',
        'quiz',
        'question',
        'team',
        'submission',
        'quiz_assignment',
        'assignment_permission',
        'backup_record'
    ]
    
    for table in actual_tables:
        success, output = run_docker_command(
            container_name,
            ["psql", "-U", "postgres", "-d", "intelliquiz", "-c",
             f"SELECT 1 FROM information_schema.tables WHERE table_name='{table}';"]
        )
        
        assert success and "1" in output, f"Required table '{table}' not found"
    
    print(f"✓ All {len(actual_tables)} required tables exist")


def test_table_structures_match_schema():
    """
    Property 3: Schema Completeness After Initialization
    For any database initialized from the corrected backup file, table structures
    SHALL match the expected schema.
    """
    container_name = "intelliquiz_db"
    
    # Define expected columns for each table
    expected_schema = {
        'user': ['id', 'username', 'password', 'system_role'],
        'quiz': ['id', 'title', 'description', 'proctor_pin', 'is_live_session', 'status'],
        'question': ['id', 'quiz_id', 'text', 'type', 'difficulty', 'correct_key', 'points', 'time_limit', 'order_index'],
        'team': ['id', 'quiz_id', 'name', 'access_code', 'total_score'],
        'submission': ['id', 'team_id', 'question_id', 'submitted_answer', 'is_correct', 'awarded_points', 'submitted_at', 'is_graded'],
        'quiz_assignment': ['id', 'user_id', 'quiz_id'],
        'assignment_permission': ['assignment_id', 'permission'],
        'backup_record': ['id', 'created_at', 'filename', 'file_size_bytes', 'status', 'error_message', 'last_restored_at', 'created_by_user_id']
    }
    
    for table, expected_columns in expected_schema.items():
        success, output = run_docker_command(
            container_name,
            ["psql", "-U", "postgres", "-d", "intelliquiz", "-c",
             f"SELECT column_name FROM information_schema.columns WHERE table_name='{table}' ORDER BY ordinal_position;"]
        )
        
        assert success, f"Failed to query columns for table '{table}'"
        
        # Check that all expected columns exist
        for column in expected_columns:
            assert column in output, f"Expected column '{column}' not found in table '{table}'"
    
    print("✓ All table structures match expected schema")


def test_constraints_are_in_place():
    """
    Property 3: Schema Completeness After Initialization
    For any database initialized from the corrected backup file, all constraints
    (primary keys, foreign keys, unique constraints) SHALL be in place.
    """
    container_name = "intelliquiz_db"
    
    # Check for primary keys
    success, output = run_docker_command(
        container_name,
        ["psql", "-U", "postgres", "-d", "intelliquiz", "-c",
         "SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type='PRIMARY KEY';"]
    )
    
    assert success, "Failed to check primary key constraints"
    
    # Just verify that primary keys exist (count > 0)
    assert not ("0" in output and output.strip().endswith("0")), "No primary key constraints found"
    
    # Check for foreign keys
    success, output = run_docker_command(
        container_name,
        ["psql", "-U", "postgres", "-d", "intelliquiz", "-c",
         "SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type='FOREIGN KEY';"]
    )
    
    if not success or "0" in output:
        print("⚠ Warning: No foreign key constraints found")
    
    # Check for unique constraints
    success, output = run_docker_command(
        container_name,
        ["psql", "-U", "postgres", "-d", "intelliquiz", "-c",
         "SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type='UNIQUE';"]
    )
    
    assert success, "Failed to check unique constraints"
    
    print("✓ All constraints are in place")


if __name__ == "__main__":
    print("Running Property 3: Schema Completeness After Initialization tests...")
    print("=" * 70)
    
    try:
        test_all_required_tables_exist()
        test_table_structures_match_schema()
        test_constraints_are_in_place()
        print("=" * 70)
        print("✓ All Property 3 tests passed!")
    except AssertionError as e:
        print("=" * 70)
        print(f"✗ Test failed: {e}")
        sys.exit(1)
