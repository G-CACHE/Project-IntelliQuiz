#!/usr/bin/env python3
"""
IntelliQuiz Docker Automation
==============================
Automated Docker container management triggered by Git pull operations.

Usage:
    python docker_automation.py [OPTIONS]

Options:
    --rebuild         Force stop, rebuild, and start containers
    --stop            Stop all containers
    --logs            Show logs after starting
    --force           Force rebuild even if no relevant changes
    --skip-pull       Don't pull git changes (for manual triggers)
    --post-merge      Called from post-merge hook (internal use)
    --install-hook    Install the Git post-merge hook
    --uninstall-hook  Remove the Git post-merge hook
    --help            Show help message
"""

import os
import sys
import subprocess
import platform
import argparse
import logging
import fnmatch
from pathlib import Path
from dataclasses import dataclass, field
from typing import List, Tuple, Optional
from datetime import datetime


# =============================================================================
# Configuration
# =============================================================================

REBUILD_PATTERNS = [
    "backend/**",
    "backend/*",
    "Dockerfile",
    "docker-compose.yml",
    "docker-compose.*.yml",
    "pom.xml",
    "backend/pom.xml",
    "backend/Dockerfile",
]

SKIP_PATTERNS = [
    "frontend/**",
    "frontend/*",
    "*.md",
    "*.txt",
    ".gitignore",
    "script/**",
    "script/*",
    "document/**",
    "document/*",
]


@dataclass
class AutomationConfig:
    """Configuration for the automation script"""
    project_root: Path
    docker_compose_file: str = "docker-compose.yml"
    log_file: str = "docker_automation.log"
    rebuild_patterns: List[str] = field(default_factory=lambda: REBUILD_PATTERNS.copy())
    skip_patterns: List[str] = field(default_factory=lambda: SKIP_PATTERNS.copy())
    health_check_timeout: int = 60
    health_check_interval: int = 5


@dataclass
class OperationResult:
    """Result of an automation operation"""
    success: bool
    message: str
    step: str
    duration: float = 0.0


# =============================================================================
# Pattern Matching Functions
# =============================================================================

def file_matches_pattern(filepath: str, pattern: str) -> bool:
    """Check if a file path matches a glob pattern"""
    filepath = filepath.replace("\\", "/")
    pattern = pattern.replace("\\", "/")
    
    if "**" in pattern:
        base_pattern = pattern.replace("**", "")
        if filepath.startswith(base_pattern.rstrip("/")):
            return True
        parts = pattern.split("**")
        if len(parts) == 2:
            prefix, suffix = parts
            if filepath.startswith(prefix.rstrip("/")) and (not suffix or filepath.endswith(suffix.lstrip("/"))):
                return True
    
    return fnmatch.fnmatch(filepath, pattern)


def should_rebuild(changed_files: List[str], rebuild_patterns: List[str] = None, skip_patterns: List[str] = None) -> bool:
    """Determine if rebuild is needed based on changed files"""
    if rebuild_patterns is None:
        rebuild_patterns = REBUILD_PATTERNS
    if skip_patterns is None:
        skip_patterns = SKIP_PATTERNS
    
    if not changed_files:
        return False
    
    for filepath in changed_files:
        for pattern in rebuild_patterns:
            if file_matches_pattern(filepath, pattern):
                return True
    
    return False


# =============================================================================
# Docker Automation Class
# =============================================================================

class DockerAutomation:
    """Main class for Docker automation operations"""
    
    def __init__(self, project_root: Path = None):
        self.project_root = project_root or Path(__file__).parent
        self.config = AutomationConfig(project_root=self.project_root)
        self.os_type = platform.system()
        self.logger = self._setup_logging()
    
    def _setup_logging(self) -> logging.Logger:
        """Setup logging to file"""
        logger = logging.getLogger("docker_automation")
        logger.setLevel(logging.DEBUG)
        
        log_path = self.project_root / self.config.log_file
        handler = logging.FileHandler(log_path, encoding="utf-8")
        handler.setLevel(logging.DEBUG)
        
        formatter = logging.Formatter(
            "%(asctime)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        handler.setFormatter(formatter)
        
        if not logger.handlers:
            logger.addHandler(handler)
        
        return logger

    # =========================================================================
    # Output Methods
    # =========================================================================
    
    def print_header(self, text: str) -> None:
        """Print a formatted header"""
        print("\n" + "=" * 70)
        print(f"  {text}")
        print("=" * 70)
    
    def print_step(self, step_num: int, text: str) -> None:
        """Print a step message"""
        msg = f"[{step_num}] {text}"
        print(f"\n{msg}")
        self.logger.info(msg)
    
    def print_success(self, text: str) -> None:
        """Print success message"""
        msg = f"✓ {text}"
        print(msg)
        self.logger.info(msg)
    
    def print_error(self, text: str) -> None:
        """Print error message"""
        msg = f"✗ {text}"
        print(msg, file=sys.stderr)
        self.logger.error(msg)
    
    def print_info(self, text: str) -> None:
        """Print info message"""
        msg = f"ℹ {text}"
        print(msg)
        self.logger.info(msg)
    
    def print_warning(self, text: str) -> None:
        """Print warning message"""
        msg = f"⚠ {text}"
        print(msg)
        self.logger.warning(msg)
    
    # =========================================================================
    # Command Execution
    # =========================================================================
    
    def run_command(self, command: List[str], capture: bool = False) -> Tuple[bool, str]:
        """Execute a shell command"""
        cmd_str = " ".join(command)
        self.logger.debug(f"Running command: {cmd_str}")
        
        try:
            if capture:
                result = subprocess.run(
                    command, 
                    capture_output=True, 
                    text=True, 
                    check=False,
                    cwd=self.project_root
                )
                output = result.stdout + result.stderr
                success = result.returncode == 0
                self.logger.debug(f"Command output: {output[:500]}")
                return success, output
            else:
                result = subprocess.run(command, check=True, cwd=self.project_root)
                return True, ""
        except FileNotFoundError:
            error_msg = f"Command not found: {command[0]}"
            self.logger.error(error_msg)
            return False, error_msg
        except subprocess.CalledProcessError as e:
            self.logger.error(f"Command failed: {e}")
            return False, str(e)
        except Exception as e:
            self.logger.error(f"Unexpected error: {e}")
            return False, str(e)
    
    # =========================================================================
    # Docker Prerequisite Checks
    # =========================================================================
    
    def check_docker_installed(self) -> bool:
        """Check if Docker is installed"""
        print("Checking Docker... ", end="", flush=True)
        success, output = self.run_command(["docker", "--version"], capture=True)
        
        if success:
            version = output.split('\n')[0] if output else "unknown"
            print(f"✓ ({version.strip()})")
            return True
        else:
            print("✗")
            self.print_error("Docker is not installed")
            return False
    
    def check_docker_daemon(self) -> bool:
        """Check if Docker daemon is running"""
        print("Checking Docker daemon... ", end="", flush=True)
        success, _ = self.run_command(["docker", "ps"], capture=True)
        
        if success:
            print("✓")
            return True
        else:
            print("✗")
            self.print_error("Docker daemon is not running. Please start Docker Desktop.")
            return False
    
    def check_docker_compose(self) -> bool:
        """Check if Docker Compose is installed"""
        print("Checking Docker Compose... ", end="", flush=True)
        success, output = self.run_command(["docker-compose", "--version"], capture=True)
        
        if success:
            version = output.split('\n')[0] if output else "unknown"
            print(f"✓ ({version.strip()})")
            return True
        else:
            print("✗")
            self.print_error("Docker Compose not found. Please install Docker Desktop.")
            return False
    
    def check_prerequisites(self) -> bool:
        """Check all Docker prerequisites"""
        self.print_step(1, "Checking prerequisites...")
        
        if not self.check_docker_installed():
            return False
        if not self.check_docker_daemon():
            return False
        if not self.check_docker_compose():
            return False
        
        return True

    # =========================================================================
    # Container Lifecycle Methods
    # =========================================================================
    
    def stop_containers(self) -> OperationResult:
        """Stop all running project containers (preserves volumes)"""
        start_time = datetime.now()
        self.print_step(2, "Stopping containers...")
        
        # Use docker-compose down WITHOUT -v to preserve volumes
        success, output = self.run_command(
            ["docker-compose", "down"],
            capture=False
        )
        
        duration = (datetime.now() - start_time).total_seconds()
        
        if success:
            self.print_success("Containers stopped (volumes preserved)")
            return OperationResult(True, "Containers stopped", "stop", duration)
        else:
            self.print_error(f"Failed to stop containers: {output}")
            return OperationResult(False, output, "stop", duration)
    
    def build_containers(self) -> OperationResult:
        """Rebuild Docker images"""
        start_time = datetime.now()
        self.print_step(3, "Building containers...")
        
        print("    Building backend image...")
        
        success, output = self.run_command(
            ["docker-compose", "build"],
            capture=False
        )
        
        duration = (datetime.now() - start_time).total_seconds()
        
        if success:
            self.print_success(f"Images built successfully ({duration:.1f}s)")
            return OperationResult(True, "Images built", "build", duration)
        else:
            self.print_error(f"Failed to build images: {output}")
            return OperationResult(False, output, "build", duration)
    
    def start_containers(self) -> OperationResult:
        """Start Docker containers"""
        start_time = datetime.now()
        self.print_step(4, "Starting containers...")
        
        print("    Starting PostgreSQL (port 5434)...")
        print("    Starting Backend (port 8090)...")
        
        success, output = self.run_command(
            ["docker-compose", "up", "-d"],
            capture=False
        )
        
        duration = (datetime.now() - start_time).total_seconds()
        
        if success:
            self.print_success("Containers started")
            return OperationResult(True, "Containers started", "start", duration)
        else:
            self.print_error(f"Failed to start containers: {output}")
            return OperationResult(False, output, "start", duration)
    
    def wait_for_health(self) -> OperationResult:
        """Wait for services to be healthy"""
        import time
        
        start_time = datetime.now()
        self.print_step(5, "Waiting for services to be healthy...")
        
        timeout = self.config.health_check_timeout
        interval = self.config.health_check_interval
        elapsed = 0
        
        while elapsed < timeout:
            # Check database
            db_ready, _ = self.run_command(
                ["docker-compose", "exec", "-T", "db", "pg_isready", "-U", "postgres"],
                capture=True
            )
            
            if db_ready:
                duration = (datetime.now() - start_time).total_seconds()
                self.print_success(f"Services are healthy ({duration:.1f}s)")
                return OperationResult(True, "Services healthy", "health", duration)
            
            time.sleep(interval)
            elapsed += interval
            print(f"    Waiting... ({elapsed}s/{timeout}s)")
        
        duration = (datetime.now() - start_time).total_seconds()
        self.print_warning("Health check timed out, but services may still be starting")
        return OperationResult(True, "Health check timed out", "health", duration)
    
    def show_status(self) -> None:
        """Display service status and connection info"""
        self.print_header("🎉 Services are Running!")
        
        print("\n📱 API ENDPOINT:")
        print("   Base URL: http://localhost:8090")
        print("   Health Check: http://localhost:8090/actuator/health")
        print("   Swagger/API Docs: http://localhost:8090/swagger-ui.html")
        
        print("\n🗄️  DATABASE ACCESS:")
        print("   Host: localhost")
        print("   Port: 5434")
        print("   Username: postgres")
        print("   Password: mysecretpassword")
        print("   Database: intelliquiz")
        
        print("\n💡 QUICK COMMANDS:")
        print("   View logs: docker-compose logs -f")
        print("   Stop all: docker-compose down")
        print("   Restart: docker-compose restart")
        print()

    # =========================================================================
    # Git Operations
    # =========================================================================
    
    def get_changed_files(self) -> List[str]:
        """Get list of files changed in the last merge/pull"""
        # Try to get files changed between HEAD@{1} and HEAD
        success, output = self.run_command(
            ["git", "diff", "--name-only", "HEAD@{1}", "HEAD"],
            capture=True
        )
        
        if success and output.strip():
            files = [f.strip() for f in output.strip().split('\n') if f.strip()]
            self.logger.info(f"Changed files: {files}")
            return files
        
        # Fallback: get files changed in last commit
        success, output = self.run_command(
            ["git", "diff", "--name-only", "HEAD~1", "HEAD"],
            capture=True
        )
        
        if success and output.strip():
            files = [f.strip() for f in output.strip().split('\n') if f.strip()]
            self.logger.info(f"Changed files (fallback): {files}")
            return files
        
        self.logger.warning("Could not determine changed files")
        return []
    
    # =========================================================================
    # Hook Management
    # =========================================================================
    
    def get_hook_path(self) -> Path:
        """Get the path to the post-merge hook"""
        return self.project_root / ".git" / "hooks" / "post-merge"
    
    def get_hook_content(self) -> str:
        """Generate the post-merge hook script content"""
        return '''#!/bin/bash
# IntelliQuiz Post-Merge Hook
# Automatically rebuilds Docker containers after git pull with changes

echo ""
echo "🔄 Git pull detected changes - checking if Docker rebuild needed..."
echo ""

# Get the repository root directory
REPO_ROOT="$(git rev-parse --show-toplevel)"

# Run the automation script
python "$REPO_ROOT/docker_automation.py" --post-merge

exit $?
'''
    
    def install_hook(self) -> bool:
        """Install the post-merge Git hook"""
        self.print_header("Installing Git Post-Merge Hook")
        
        hook_path = self.get_hook_path()
        hooks_dir = hook_path.parent
        
        # Ensure hooks directory exists
        if not hooks_dir.exists():
            self.print_error(f"Git hooks directory not found: {hooks_dir}")
            self.print_info("Make sure you're in a Git repository")
            return False
        
        # Check if hook already exists
        if hook_path.exists():
            self.print_warning(f"Hook already exists at {hook_path}")
            response = input("Overwrite existing hook? (y/N): ").strip().lower()
            if response != 'y':
                self.print_info("Installation cancelled")
                return False
        
        # Write hook content
        try:
            hook_content = self.get_hook_content()
            hook_path.write_text(hook_content, encoding="utf-8")
            self.logger.info(f"Hook written to {hook_path}")
        except Exception as e:
            self.print_error(f"Failed to write hook: {e}")
            return False
        
        # Make hook executable
        try:
            if self.os_type != "Windows":
                os.chmod(hook_path, 0o755)
                self.print_success("Hook made executable (chmod +x)")
            else:
                # On Windows, Git Bash handles execution
                self.print_info("On Windows, Git Bash will handle hook execution")
            
            self.logger.info("Hook permissions set")
        except Exception as e:
            self.print_warning(f"Could not set executable permission: {e}")
        
        self.print_success(f"Hook installed at {hook_path}")
        self.print_info("The hook will run automatically after 'git pull' with changes")
        
        return True
    
    def uninstall_hook(self) -> bool:
        """Remove the post-merge Git hook"""
        self.print_header("Uninstalling Git Post-Merge Hook")
        
        hook_path = self.get_hook_path()
        
        if not hook_path.exists():
            self.print_info("No hook found to uninstall")
            return True
        
        try:
            hook_path.unlink()
            self.print_success(f"Hook removed from {hook_path}")
            self.logger.info("Hook uninstalled")
            return True
        except Exception as e:
            self.print_error(f"Failed to remove hook: {e}")
            return False

    # =========================================================================
    # Main Workflow
    # =========================================================================
    
    def run(self, 
            mode: str = "auto",
            force: bool = False,
            skip_pull: bool = False,
            post_merge: bool = False,
            show_logs: bool = False) -> bool:
        """Execute the automation workflow"""
        
        self.logger.info(f"Starting automation - mode={mode}, force={force}, post_merge={post_merge}")
        
        # Check for SKIP_DOCKER_REBUILD environment variable
        if os.environ.get("SKIP_DOCKER_REBUILD") == "1":
            self.print_info("SKIP_DOCKER_REBUILD=1 is set - skipping Docker rebuild")
            self.logger.info("Skipped due to SKIP_DOCKER_REBUILD environment variable")
            return True
        
        self.print_header("IntelliQuiz Docker Automation")
        
        # Handle stop mode
        if mode == "stop":
            result = self.stop_containers()
            return result.success
        
        # Check prerequisites
        if not self.check_prerequisites():
            return False
        
        # Determine if rebuild is needed
        rebuild_needed = force
        changed_files = []
        
        if post_merge and not force:
            self.print_step(2, "Checking changed files...")
            changed_files = self.get_changed_files()
            
            if changed_files:
                self.print_info(f"Found {len(changed_files)} changed file(s)")
                for f in changed_files[:5]:
                    print(f"    - {f}")
                if len(changed_files) > 5:
                    print(f"    ... and {len(changed_files) - 5} more")
                
                rebuild_needed = should_rebuild(
                    changed_files,
                    self.config.rebuild_patterns,
                    self.config.skip_patterns
                )
                
                if rebuild_needed:
                    self.print_info("Backend/Docker changes detected - rebuild required")
                else:
                    self.print_info("No backend/Docker changes - skipping rebuild")
                    self.print_success("No rebuild needed. Containers unchanged.")
                    return True
            else:
                self.print_info("No changed files detected")
                return True
        elif mode == "rebuild" or force:
            rebuild_needed = True
            self.print_info("Force rebuild requested")
        else:
            # Default auto mode - always rebuild
            rebuild_needed = True
        
        if not rebuild_needed:
            self.print_success("No rebuild needed")
            return True
        
        # Execute rebuild workflow: stop -> build -> start -> health
        self.logger.info("Starting rebuild workflow")
        
        # Stop containers
        result = self.stop_containers()
        if not result.success:
            self.print_warning("Stop failed, attempting to continue...")
        
        # Build containers
        result = self.build_containers()
        if not result.success:
            self.print_error(f"Build failed at step: {result.step}")
            return False
        
        # Start containers
        result = self.start_containers()
        if not result.success:
            self.print_error(f"Start failed at step: {result.step}")
            return False
        
        # Wait for health
        result = self.wait_for_health()
        
        # Show status
        self.show_status()
        
        # Show logs if requested
        if show_logs:
            self.print_info("Showing logs (Ctrl+C to exit)...")
            self.run_command(["docker-compose", "logs", "-f"])
        
        self.logger.info("Automation completed successfully")
        return True


# =============================================================================
# CLI Entry Point
# =============================================================================

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="IntelliQuiz Docker Automation - Auto-rebuild after git pull",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python docker_automation.py                  # Auto mode (rebuild)
  python docker_automation.py --rebuild        # Force rebuild
  python docker_automation.py --stop           # Stop containers
  python docker_automation.py --force          # Force rebuild even if no changes
  python docker_automation.py --install-hook   # Install git post-merge hook
  python docker_automation.py --uninstall-hook # Remove git post-merge hook

Environment Variables:
  SKIP_DOCKER_REBUILD=1    Skip the rebuild process
        """
    )
    
    parser.add_argument("--rebuild", action="store_true",
                        help="Force stop, rebuild, and start containers")
    parser.add_argument("--stop", action="store_true",
                        help="Stop all containers")
    parser.add_argument("--logs", action="store_true",
                        help="Show logs after starting")
    parser.add_argument("--force", action="store_true",
                        help="Force rebuild even if no relevant changes")
    parser.add_argument("--skip-pull", action="store_true",
                        help="Don't pull git changes (for manual triggers)")
    parser.add_argument("--post-merge", action="store_true",
                        help="Called from post-merge hook (internal use)")
    parser.add_argument("--install-hook", action="store_true",
                        help="Install the Git post-merge hook")
    parser.add_argument("--uninstall-hook", action="store_true",
                        help="Remove the Git post-merge hook")
    
    args = parser.parse_args()
    
    automation = DockerAutomation()
    
    try:
        # Handle hook management
        if args.install_hook:
            success = automation.install_hook()
            sys.exit(0 if success else 1)
        
        if args.uninstall_hook:
            success = automation.uninstall_hook()
            sys.exit(0 if success else 1)
        
        # Determine mode
        mode = "auto"
        if args.stop:
            mode = "stop"
        elif args.rebuild:
            mode = "rebuild"
        
        # Run automation
        success = automation.run(
            mode=mode,
            force=args.force,
            skip_pull=args.skip_pull,
            post_merge=args.post_merge,
            show_logs=args.logs
        )
        
        sys.exit(0 if success else 1)
    
    except KeyboardInterrupt:
        print("\n\nOperation cancelled by user")
        sys.exit(130)
    except Exception as e:
        print(f"\nUnexpected error: {e}")
        automation.logger.exception("Unexpected error")
        sys.exit(1)


if __name__ == "__main__":
    main()
