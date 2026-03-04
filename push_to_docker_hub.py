#!/usr/bin/env python3
"""
Push IntelliQuiz Docker images to Docker Hub (Backend + Database)
Usage: python push_to_docker_hub.py
"""

import subprocess
import sys
import os
from pathlib import Path

DOCKER_USERNAME = "gm1026"
BACKEND_IMAGE_NAME = "intelliquiz-backend"
DB_IMAGE_NAME = "intelliquiz-db"
LOCAL_BACKEND_IMAGE = "project-cache-in-backend:latest"
DOCKER_HUB_BACKEND_IMAGE = f"{DOCKER_USERNAME}/{BACKEND_IMAGE_NAME}:latest"
DOCKER_HUB_DB_IMAGE = f"{DOCKER_USERNAME}/{DB_IMAGE_NAME}:latest"

def run_command(cmd, description):
    """Run a shell command and handle errors"""
    print(f"\n▶ {description}")
    print(f"  Command: {' '.join(cmd)}")
    
    try:
        result = subprocess.run(cmd, capture_output=False, text=True, check=True)
        print(f"✓ {description} - Success!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ {description} - Failed!")
        print(f"  Error: {e}")
        return False
    except FileNotFoundError:
        print(f"✗ {description} - Command not found!")
        return False

def main():
    print("=" * 70)
    print("  IntelliQuiz - Push to Docker Hub (Backend + Database)")
    print("=" * 70)
    print(f"\nConfiguration:")
    print(f"  Docker Hub Username: {DOCKER_USERNAME}")
    print(f"  Backend Image: {DOCKER_HUB_BACKEND_IMAGE}")
    print(f"  Database Image: {DOCKER_HUB_DB_IMAGE}")
    
    # Get project root
    project_root = Path(__file__).parent.absolute()
    
    # Step 1: Check if Docker is running
    print("\n[1] Checking Docker daemon...")
    if not run_command(["docker", "ps"], "Docker daemon check"):
        print("✗ Docker daemon is not running!")
        print("  Please start Docker Desktop and try again.")
        sys.exit(1)
    
    # Step 2: Check if local backend image exists
    print("\n[2] Checking if local backend image exists...")
    try:
        result = subprocess.run(
            ["docker", "image", "inspect", LOCAL_BACKEND_IMAGE],
            capture_output=True,
            text=True,
            check=True
        )
        print(f"✓ Found local image: {LOCAL_BACKEND_IMAGE}")
    except subprocess.CalledProcessError:
        print(f"✗ Local backend image not found: {LOCAL_BACKEND_IMAGE}")
        print("\n  Please run 'python setup_and_run_docker.py' first to build the image.")
        sys.exit(1)
    
    # Step 3: Docker login
    print("\n[3] Logging in to Docker Hub...")
    print(f"  Username: {DOCKER_USERNAME}")
    print("  You will be prompted to enter your Docker Hub password.")
    
    if not run_command(["docker", "login"], "Docker Hub login"):
        print("✗ Docker Hub login failed!")
        print("  Make sure you have a Docker Hub account and correct credentials.")
        sys.exit(1)
    
    # Step 4: Build and push database image
    print("\n" + "=" * 70)
    print("  Building and Pushing Database Image")
    print("=" * 70)
    
    db_dockerfile = project_root / "database" / "Dockerfile"
    if not db_dockerfile.exists():
        print(f"✗ Database Dockerfile not found: {db_dockerfile}")
        sys.exit(1)
    
    print(f"\n[4] Building database image from {db_dockerfile}...")
    if not run_command(
        ["docker", "build", "-t", DOCKER_HUB_DB_IMAGE, str(project_root / "database")],
        "Building database image"
    ):
        sys.exit(1)
    
    print(f"\n[5] Pushing database image to Docker Hub...")
    print("  (This may take a few minutes depending on image size and internet speed)")
    if not run_command(
        ["docker", "push", DOCKER_HUB_DB_IMAGE],
        "Pushing database image to Docker Hub"
    ):
        print("\n✗ Database push failed!")
        sys.exit(1)
    
    # Step 6: Tag and push backend image
    print("\n" + "=" * 70)
    print("  Tagging and Pushing Backend Image")
    print("=" * 70)
    
    print(f"\n[6] Tagging backend image as {DOCKER_HUB_BACKEND_IMAGE}...")
    if not run_command(
        ["docker", "tag", LOCAL_BACKEND_IMAGE, DOCKER_HUB_BACKEND_IMAGE],
        "Tagging backend image"
    ):
        sys.exit(1)
    
    print(f"\n[7] Pushing backend image to Docker Hub...")
    print("  (This may take a few minutes depending on image size and internet speed)")
    if not run_command(
        ["docker", "push", DOCKER_HUB_BACKEND_IMAGE],
        "Pushing backend image to Docker Hub"
    ):
        print("\n✗ Backend push failed!")
        sys.exit(1)
    
    # Step 8: Success summary
    print("\n" + "=" * 70)
    print("✓ Success! Both images are now on Docker Hub")
    print("=" * 70)
    print(f"\nBackend Image:")
    print(f"  URL: https://hub.docker.com/r/{DOCKER_USERNAME}/{BACKEND_IMAGE_NAME}")
    print(f"  Pull: docker pull {DOCKER_HUB_BACKEND_IMAGE}")
    
    print(f"\nDatabase Image (with pre-populated data):")
    print(f"  URL: https://hub.docker.com/r/{DOCKER_USERNAME}/{DB_IMAGE_NAME}")
    print(f"  Pull: docker pull {DOCKER_HUB_DB_IMAGE}")
    
    print(f"\nYour team can now run:")
    print(f"  python run_docker_prod.py")
    print(f"\nThis will pull both images and start the complete stack with all data!")
    print("\n" + "=" * 70)

if __name__ == "__main__":
    main()
