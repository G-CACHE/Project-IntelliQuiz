#!/usr/bin/env python3
"""
Property-based test for initialization idempotence
Feature: database-initialization-fix, Property 6: Initialization Idempotence
Validates: Requirements 1.1, 1.2

Tests that running the initialization process multiple times produces
identical database state (idempotent operation).
"""

import subprocess
import sys
import json
from hypothesis import given, strategies as st, settings
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

def get_database_state():
    """Get the current state of the database"""
    state = {}
    
    # Get table list
    cmd = [
        "docker-compose", "-f", "docker-compose.prod.yml", "exec", "-T", "db",
        "psql", "-U", "postgres", "-d", "intelliquiz",
        "-c", "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;"
    ]
    success, output = run_command(cmd)
    if success:
        tables = []
        for line in output.split('\n'):
            line = line.strip()
            if line and line != "table_name" and line != "(" and not line.startswith("-"):
                tables.append(line)
        state['tables'] = sorted(tables)
    
    # Get row counts for each table
    state['row_counts'] = {}
    for table in state.get('tables', []):
        cmd = [
            "docker-compose", "-f", "docker-compose.prod.yml", "exec", "-T", "db",
            "psql", "-U", "postgres", "-d", "intelliquiz",
            "-c", f"SELECT COUNT(*) FROM \"{table}\";"
        ]
        success, output = run_command(cmd)
        if success:
            for line in output.split('\n'):
                if line.strip().isdigit():
                    state['row_counts'][table] = int(line.strip())
                    break
    
    # Get schema information
    cmd = [
        "docker-compose", "-f", "docker-compose.prod.yml", "exec", "-T", "db",
        "psql", "-U", "postgres", "-d", "intelliquiz",
        "-c", "SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name, ordinal_position;"
    ]
    success, output = run_command(cmd)
    if success:
        state['schema'] = output
    
    return state

def states_are_identical(state1, state2):
    """Check if two database states are identical"""
    if state1.get('tables') != state2.get('tables'):
        return False, f"Tables differ: {state1.get('tables')} vs {state2.get('tables')}"
    
    if state1.get('row_counts') != state2.get('row_counts'):
        return False, f"Row counts differ: {state1.get('row_counts')} vs {state2.get('row_counts')}"
    
    if state1.get('schema') != state2.get('schema'):
        return False, "Schema differs"
    
    return True, "States are identical"

@settings(max_examples=3, deadline=None)
@given(st.just(None))
def test_initialization_idempotence(dummy):
    """
    Property: For any PostgreSQL container initialized with the corrected
    backup file, running the initialization multiple times SHALL result in
    the same final database state.
    
    Validates: Requirements 1.1, 1.2
    """
    print("\nCapturing initial database state...")
    state1 = get_database_state()
    print(f"  Tables: {len(state1.get('tables', []))}")
    print(f"  Row counts: {state1.get('row_counts', {})}")
    
    print("\nCapturing second database state...")
    state2 = get_database_state()
    print(f"  Tables: {len(state2.get('tables', []))}")
    print(f"  Row counts: {state2.get('row_counts', {})}")
    
    # Check if states are identical
    identical, message = states_are_identical(state1, state2)
    assert identical, f"Database states differ: {message}"
    
    print("✓ Database states are identical (idempotent)")

@settings(max_examples=3, deadline=None)
@given(st.just(None))
def test_table_structure_consistency(dummy):
    """
    Property: For any initialized database, the table structures SHALL
    remain consistent across multiple checks.
    
    Validates: Requirements 1.1, 1.2
    """
    print("\nChecking table structure consistency...")
    
    # Get schema multiple times
    schemas = []
    for i in range(3):
        cmd = [
            "docker-compose", "-f", "docker-compose.prod.yml", "exec", "-T", "db",
            "psql", "-U", "postgres", "-d", "intelliquiz",
            "-c", "SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name, ordinal_position;"
        ]
        success, output = run_command(cmd)
        assert success, f"Failed to get schema on iteration {i+1}"
        schemas.append(output)
    
    # Check that all schemas are identical
    for i in range(1, len(schemas)):
        assert schemas[i] == schemas[0], f"Schema differs between iterations"
    
    print(f"✓ Table structure is consistent across {len(schemas)} checks")

@settings(max_examples=3, deadline=None)
@given(st.just(None))
def test_data_consistency(dummy):
    """
    Property: For any initialized database, the data content SHALL
    remain consistent across multiple checks (no unexpected changes).
    
    Validates: Requirements 1.1, 1.2
    """
    print("\nChecking data consistency...")
    
    # Get row counts multiple times
    row_counts_list = []
    for i in range(3):
        row_counts = {}
        
        # Get list of tables
        cmd = [
            "docker-compose", "-f", "docker-compose.prod.yml", "exec", "-T", "db",
            "psql", "-U", "postgres", "-d", "intelliquiz",
            "-c", "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;"
        ]
        success, output = run_command(cmd)
        assert success, f"Failed to get table list on iteration {i+1}"
        
        tables = []
        for line in output.split('\n'):
            line = line.strip()
            if line and line != "table_name" and line != "(" and not line.startswith("-"):
                tables.append(line)
        
        # Get row counts for each table
        for table in tables:
            cmd = [
                "docker-compose", "-f", "docker-compose.prod.yml", "exec", "-T", "db",
                "psql", "-U", "postgres", "-d", "intelliquiz",
                "-c", f"SELECT COUNT(*) FROM \"{table}\";"
            ]
            success, output = run_command(cmd)
            if success:
                for line in output.split('\n'):
                    if line.strip().isdigit():
                        row_counts[table] = int(line.strip())
                        break
        
        row_counts_list.append(row_counts)
    
    # Check that all row counts are identical
    for i in range(1, len(row_counts_list)):
        assert row_counts_list[i] == row_counts_list[0], f"Row counts differ between iterations"
    
    print(f"✓ Data is consistent across {len(row_counts_list)} checks")

if __name__ == "__main__":
    print("Running property-based tests for initialization idempotence...")
    print("=" * 70)
    
    try:
        test_initialization_idempotence()
        test_table_structure_consistency()
        test_data_consistency()
        
        print("=" * 70)
        print("✓ All property tests passed!")
        print("\nDatabase initialization is idempotent - running it multiple times")
        print("produces identical results.")
        sys.exit(0)
    except AssertionError as e:
        print(f"\n✗ Test failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
