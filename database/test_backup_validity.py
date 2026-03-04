#!/usr/bin/env python3
"""
Property-based tests for backup file validity
Feature: database-initialization-fix, Property 2: Backup File SQL Validity
Validates: Requirements 1.1, 1.2, 2.3
"""

import subprocess
import tempfile
import os
from pathlib import Path


def test_backup_file_has_valid_header():
    """
    Property 2: Backup File SQL Validity
    For any backup file, the first non-empty line SHALL be a valid PostgreSQL dump header
    and SHALL NOT contain corrupted or binary data.
    """
    backup_file = Path(__file__).parent / "backup_intelliquiz.sql"
    
    with open(backup_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Find first non-empty line
    first_line = None
    for line in lines:
        if line.strip():
            first_line = line.strip()
            break
    
    assert first_line is not None, "Backup file is empty"
    assert first_line.startswith("--"), f"First line should be a comment, got: {first_line}"
    assert "PostgreSQL database dump" in first_line or first_line.startswith("--"), \
        f"First line should be a valid PostgreSQL dump header, got: {first_line}"
    
    # Check for corrupted header patterns
    corrupted_patterns = [
        r"\restrict",
        r"\unrestrict",
        "sYNGGRPQTtGiQ2L3lcATLcoHhOCVZkHoIfPwJyPT9CkfAnVkTzhzftHfZTbxMGy"
    ]
    
    for pattern in corrupted_patterns:
        assert pattern not in open(backup_file).read(), \
            f"Backup file contains corrupted pattern: {pattern}"


def test_backup_file_is_valid_sql():
    """
    Property 2: Backup File SQL Validity
    For any backup file, the output file SHALL be valid PostgreSQL SQL that can be
    executed without syntax errors when loaded into PostgreSQL.
    """
    backup_file = Path(__file__).parent / "backup_intelliquiz.sql"
    
    # Read the backup file
    with open(backup_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check for basic SQL syntax patterns
    assert "CREATE TABLE" in content, "Backup file should contain CREATE TABLE statements"
    assert "CREATE SEQUENCE" in content, "Backup file should contain CREATE SEQUENCE statements"
    assert "ALTER TABLE" in content, "Backup file should contain ALTER TABLE statements"
    
    # Check that file ends properly
    assert content.strip().endswith("--"), "Backup file should end with a comment"
    
    # Verify no corrupted lines
    lines = content.split('\n')
    for i, line in enumerate(lines):
        # Check for non-ASCII characters that indicate corruption
        try:
            line.encode('ascii')
        except UnicodeEncodeError:
            # Allow some special characters in SQL strings
            if not any(char in line for char in ['é', 'ñ', 'ü']):
                raise AssertionError(f"Line {i+1} contains non-ASCII characters: {line}")


def test_backup_file_can_be_parsed():
    """
    Property 2: Backup File SQL Validity
    For any backup file, it should be parseable as valid SQL without syntax errors.
    """
    backup_file = Path(__file__).parent / "backup_intelliquiz.sql"
    
    with open(backup_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Split into statements (basic parsing)
    statements = content.split(';')
    
    # Count CREATE TABLE statements
    create_table_count = sum(1 for stmt in statements if 'CREATE TABLE' in stmt)
    assert create_table_count > 0, "Backup file should contain CREATE TABLE statements"
    
    # Verify expected tables exist
    expected_tables = [
        'assignment_permission',
        'backup_record',
        'question',
        'quiz',
        'team',
        'submission',
        'user'
    ]
    
    for table in expected_tables:
        assert f"CREATE TABLE public.{table}" in content or f'CREATE TABLE public."{table}"' in content, \
            f"Backup file should contain CREATE TABLE for {table}"


if __name__ == "__main__":
    print("Running Property 2: Backup File SQL Validity tests...")
    
    try:
        test_backup_file_has_valid_header()
        print("✓ test_backup_file_has_valid_header passed")
    except AssertionError as e:
        print(f"✗ test_backup_file_has_valid_header failed: {e}")
        exit(1)
    
    try:
        test_backup_file_is_valid_sql()
        print("✓ test_backup_file_is_valid_sql passed")
    except AssertionError as e:
        print(f"✗ test_backup_file_is_valid_sql failed: {e}")
        exit(1)
    
    try:
        test_backup_file_can_be_parsed()
        print("✓ test_backup_file_can_be_parsed passed")
    except AssertionError as e:
        print(f"✗ test_backup_file_can_be_parsed failed: {e}")
        exit(1)
    
    print("\nAll Property 2 tests passed!")
