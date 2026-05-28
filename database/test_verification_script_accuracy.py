#!/usr/bin/env python3
"""
Property-based test for verification script accuracy
Feature: database-initialization-fix, Property 5: Verification Script Accuracy
Validates: Requirements 3.1, 3.2, 3.3

Tests that the verification script correctly identifies all required tables
and provides accurate row counts for each table.
"""

import subprocess
import sys
from hypothesis import given, strategies as st, settings
from pathlib import Path

# Required tables that should exist
REQUIRED_TABLES = {
    "user",
    "quiz",
    "question",
    "team",
    "submission",
    "quiz_assignment",
    "assignment_permission",
    "backup_record"
}

def run_command(cmd):
    """Run a shell command and return output"""
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return True, result.stdout.strip()
    except subprocess.CalledProcessError as e:
        return False, e.stderr.strip()
    except FileNotFoundError:
        return False, f"Command not found: {cmd[0]}"

def check_table_exists(table_name):
    """Check if a table exists in the database"""
    cmd = [
        "docker-compose", "-f", "docker-compose.prod.yml", "exec", "-T", "db",
        "psql", "-U", "postgres", "-d", "intelliquiz",
        "-c", f"SELECT 1 FROM information_schema.tables WHERE table_name='{table_name}';"
    ]
    success, output = run_command(cmd)
    return success and "1" in output

def get_table_row_count(table_name):
    """Get the row count for a table"""
    cmd = [
        "docker-compose", "-f", "docker-compose.prod.yml", "exec", "-T", "db",
        "psql", "-U", "postgres", "-d", "intelliquiz",
        "-c", f"SELECT COUNT(*) FROM \"{table_name}\";"
    ]
    success, output = run_command(cmd)
    if success:
        lines = output.split('\n')
        for line in lines:
            if line.strip().isdigit():
                return int(line.strip())
    return None

def run_verification_script():
    """Run the verification script and capture output"""
    cmd = ["python", "verify_db_setup.py"]
    success, output = run_command(cmd)
    return success, output

@settings(max_examples=5)
@given(st.just(None))
def test_verification_script_identifies_all_tables(dummy):
    """
    Property: For any initialized database, the verification script SHALL
    correctly identify all required tables.
    
    Validates: Requirements 3.1
    """
    # Run verification script
    success, output = run_verification_script()
    
    # Check that script ran successfully
    assert success, f"Verification script failed: {output}"
    
    # Check that all required tables are mentioned in output
    for table in REQUIRED_TABLES:
        assert table in output.lower(), f"Table {table} not mentioned in verification output"
    
    print(f"✓ Verification script correctly identified all {len(REQUIRED_TABLES)} required tables")

@settings(max_examples=5)
@given(st.just(None))
def test_verification_script_finds_game_session(dummy):
    """
    Property: For any initialized database, the verification script SHALL
    report whether the game_session table exists.
    
    Validates: Requirements 3.2
    """
    # Run verification script
    success, output = run_verification_script()
    
    # Check that script ran successfully
    assert success, f"Verification script failed: {output}"
    
    # Check that game_session is mentioned (either found or not found)
    assert "game_session" in output.lower(), "Verification script did not check for game_session table"
    
    print("✓ Verification script correctly checks for game_session table")

@settings(max_examples=5)
@given(st.just(None))
def test_verification_script_reports_accurate_row_counts(dummy):
    """
    Property: For any initialized database, the verification script SHALL
    report accurate row counts for all tables.
    
    Validates: Requirements 3.3
    """
    # Get actual row counts from database
    actual_counts = {}
    for table in REQUIRED_TABLES:
        if check_table_exists(table):
            count = get_table_row_count(table)
            if count is not None:
                actual_counts[table] = count
    
    # Run verification script
    success, output = run_verification_script()
    
    # Check that script ran successfully
    assert success, f"Verification script failed: {output}"
    
    # Verify that row counts are reported in output
    for table, expected_count in actual_counts.items():
        # Check that the count is mentioned in output
        assert str(expected_count) in output, f"Row count {expected_count} for table {table} not found in output"
    
    print(f"✓ Verification script reports accurate row counts for {len(actual_counts)} tables")

@settings(max_examples=5)
@given(st.just(None))
def test_verification_script_consistency(dummy):
    """
    Property: For any initialized database, running the verification script
    multiple times SHALL produce consistent results.
    
    Validates: Requirements 3.1, 3.2, 3.3
    """
    # Run verification script multiple times
    outputs = []
    for i in range(3):
        success, output = run_verification_script()
        assert success, f"Verification script failed on run {i+1}: {output}"
        outputs.append(output)
    
    # Check that all outputs are identical
    for i in range(1, len(outputs)):
        assert outputs[i] == outputs[0], f"Verification script output differs between runs"
    
    print("✓ Verification script produces consistent results across multiple runs")

if __name__ == "__main__":
    print("Running property-based tests for verification script accuracy...")
    print("=" * 70)
    
    try:
        test_verification_script_identifies_all_tables()
        test_verification_script_finds_game_session()
        test_verification_script_reports_accurate_row_counts()
        test_verification_script_consistency()
        
        print("=" * 70)
        print("✓ All property tests passed!")
        sys.exit(0)
    except AssertionError as e:
        print(f"\n✗ Test failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        sys.exit(1)
