#!/usr/bin/env python3
"""
Final checkpoint - Ensure all tests pass
Runs all property tests and verification scripts to confirm the fix is complete
"""

import subprocess
import sys
import os
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
    print_header("Final Checkpoint: Database Initialization Fix")
    
    project_root = Path(__file__).parent.parent.absolute()
    os.chdir(project_root)
    
    all_passed = True
    
    # Test 1: Verify backup file validity
    print("\n[1] Testing backup file validity...")
    if Path("database/test_backup_validity.py").exists():
        success, output = run_command(["python", "database/test_backup_validity.py"])
        if success:
            print_status(True, "Backup file validity test passed")
        else:
            print_status(False, "Backup file validity test failed")
            print(f"  Output: {output[:200]}")
            all_passed = False
    else:
        print_status(False, "Backup validity test file not found")
        all_passed = False
    
    # Test 2: Verify schema completeness
    print("\n[2] Testing schema completeness...")
    if Path("database/test_schema_completeness.py").exists():
        success, output = run_command(["python", "database/test_schema_completeness.py"])
        if success:
            print_status(True, "Schema completeness test passed")
        else:
            print_status(False, "Schema completeness test failed")
            print(f"  Output: {output[:200]}")
            all_passed = False
    else:
        print_status(False, "Schema completeness test file not found")
        all_passed = False
    
    # Test 3: Verify data presence
    print("\n[3] Testing data presence...")
    if Path("database/test_data_presence.py").exists():
        success, output = run_command(["python", "database/test_data_presence.py"])
        if success:
            print_status(True, "Data presence test passed")
        else:
            print_status(False, "Data presence test failed")
            print(f"  Output: {output[:200]}")
            all_passed = False
    else:
        print_status(False, "Data presence test file not found")
        all_passed = False
    
    # Test 4: Verify backup locally
    print("\n[4] Testing backup file locally...")
    if Path("database/test_backup_locally.py").exists():
        success, output = run_command(["python", "database/test_backup_locally.py"])
        if success:
            print_status(True, "Local backup test passed")
        else:
            print_status(False, "Local backup test failed")
            print(f"  Output: {output[:200]}")
            all_passed = False
    else:
        print_status(False, "Local backup test file not found")
        all_passed = False
    
    # Test 5: Verify verification script accuracy
    print("\n[5] Testing verification script accuracy...")
    if Path("database/test_verification_script_accuracy.py").exists():
        success, output = run_command(["python", "database/test_verification_script_accuracy.py"])
        if success:
            print_status(True, "Verification script accuracy test passed")
        else:
            print_status(False, "Verification script accuracy test failed")
            print(f"  Output: {output[:200]}")
            all_passed = False
    else:
        print_status(False, "Verification script accuracy test file not found")
        all_passed = False
    
    # Test 6: Verify initialization idempotence
    print("\n[6] Testing initialization idempotence...")
    if Path("database/test_initialization_idempotence.py").exists():
        success, output = run_command(["python", "database/test_initialization_idempotence.py"])
        if success:
            print_status(True, "Initialization idempotence test passed")
        else:
            print_status(False, "Initialization idempotence test failed")
            print(f"  Output: {output[:200]}")
            all_passed = False
    else:
        print_status(False, "Initialization idempotence test file not found")
        all_passed = False
    
    # Test 7: Run verification script
    print("\n[7] Running verification script...")
    success, output = run_command(["python", "verify_db_setup.py"])
    if success:
        print_status(True, "Verification script passed")
    else:
        print_status(False, "Verification script failed")
        print(f"  Output: {output[:200]}")
        all_passed = False
    
    # Test 8: Run checkpoint verification
    print("\n[8] Running checkpoint verification...")
    if Path("database/checkpoint_verification.py").exists():
        success, output = run_command(["python", "database/checkpoint_verification.py"])
        if success:
            print_status(True, "Checkpoint verification passed")
        else:
            print_status(False, "Checkpoint verification failed")
            print(f"  Output: {output[:200]}")
            all_passed = False
    else:
        print_status(False, "Checkpoint verification file not found")
        all_passed = False
    
    # Summary
    print_header("Final Checkpoint Summary")
    
    if all_passed:
        print("""
✓ All tests passed!

The database initialization fix is complete and working correctly:

✓ Backup file is valid and can be loaded
✓ All required tables are created
✓ Data is present in tables
✓ Backup loads correctly locally
✓ Verification script works accurately
✓ Initialization is idempotent
✓ All components work together

Your teammates can now run:
  python run_docker_prod.py
  python verify_db_setup.py

And the database will initialize correctly with all tables and data.
        """)
        return True
    else:
        print("""
✗ Some tests failed!

Please review the failures above and:
1. Check database logs: docker compose logs db
2. Verify backup file: head -50 database/backup_intelliquiz.sql
3. Restart containers: docker compose down -v && docker compose up
4. Run this script again

For detailed troubleshooting, see DEVELOPER_GUIDE.md
        """)
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
