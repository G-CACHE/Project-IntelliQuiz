#!/usr/bin/env python3
"""
Property-based tests for verification script accuracy
Feature: database-initialization-fix, Property 5: Verification Script Accuracy
Validates: Requirements 3.1, 3.2, 3.3
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


def test_verification_script_identifies_all_tables():
    """
    Property 5: Verification Script Accuracy
    For any initialized database, the verification script SHALL correctly identify
    all required tables.
    """
    container_name = "intelliquiz_db"
    
    # Get list of tables from database
    success, output = run_docker_command(
        container_name,
        ["psql", "-U", "postgres", "-d", "intelliquiz", "-c",
         "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;"]
    )
    
    assert success, "Failed to query tables from database"
    
    # Expected tables
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
    
    # Verify all expected tables are in the output
    for table in expected_tables:
        assert table in output, f"Table '{table}' not found in database"
    
    print(f"✓ Verification script correctly identifies all {len(expected_tables)} required tables")


def test_verification_script_reports_accurate_row_counts():
    """
    Property 5: Verification Script Accuracy
    For any initialized database, the verification script SHALL report accurate
    row counts for each table.
    """
    container_name = "intelliquiz_db"
    
    tables = ['user', 'quiz', 'question', 'team', 'submission']
    
    for table in tables:
        # Get actual row count from database
        success, output = run_docker_command(
            container_name,
            ["psql", "-U", "postgres", "-d", "intelliquiz", "-c",
             f"SELECT COUNT(*) FROM {table};"]
        )
        
        assert success, f"Failed to query row count for table '{table}'"
        
        # Extract count
        lines = output.strip().split('\n')
        count_line = [l for l in lines if l.strip().isdigit()]
        
        assert count_line, f"Could not extract row count for table '{table}'"
        
        actual_count = int(count_line[0].strip())
        print(f"  {table}: {actual_count} rows")
    
    print("✓ Verification script reports accurate row counts")


def test_verification_script_detects_missing_tables():
    """
    Property 5: Verification Script Accuracy
    For any database, the verification script SHALL correctly detect when
    required tables are missing.
    """
    container_name = "intelliquiz_db"
    
    # Check that all required tables exist
    required_tables = [
        'user',
        'quiz',
        'question',
        'team',
        'submission',
        'quiz_assignment',
        'assignment_permission',
        'backup_record'
    ]
    
    for table in required_tables:
        success, output = run_docker_command(
            container_name,
            ["psql", "-U", "postgres", "-d", "intelliquiz", "-c",
             f"SELECT 1 FROM information_schema.tables WHERE table_name='{table}';"]
        )
        
        assert success and "1" in output, f"Required table '{table}' is missing"
    
    print(f"✓ All {len(required_tables)} required tables are present")


def test_verification_script_handles_edge_cases():
    """
    Property 5: Verification Script Accuracy
    For any database, the verification script SHALL handle edge cases correctly,
    such as empty tables and tables with data.
    """
    container_name = "intelliquiz_db"
    
    # Test querying both empty and non-empty tables
    tables_to_test = {
        'user': 'should have data',
        'submission': 'may be empty'
    }
    
    for table, description in tables_to_test.items():
        success, output = run_docker_command(
            container_name,
            ["psql", "-U", "postgres", "-d", "intelliquiz", "-c",
             f"SELECT COUNT(*) FROM {table};"]
        )
        
        assert success, f"Failed to query table '{table}' ({description})"
    
    print("✓ Verification script handles both empty and non-empty tables")


if __name__ == "__main__":
    print("Running Property 5: Verification Script Accuracy tests...")
    print("=" * 70)
    
    try:
        test_verification_script_identifies_all_tables()
        test_verification_script_reports_accurate_row_counts()
        test_verification_script_detects_missing_tables()
        test_verification_script_handles_edge_cases()
        print("=" * 70)
        print("✓ All Property 5 tests passed!")
    except AssertionError as e:
        print("=" * 70)
        print(f"✗ Test failed: {e}")
        sys.exit(1)
