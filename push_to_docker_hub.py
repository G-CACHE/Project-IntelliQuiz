#!/usr/bin/env python3
"""
Push IntelliQuiz Backend Docker image to Docker Hub
Usage: python push_to_docker_hub.py
"""

import subprocess
import sys
import os

DOCKER_USERNAME = "gm1026"
IMAGE_NAME = "intelliquiz-backend"
LOCAL_IMAGE = "project-cache-in-backend:latest"
DOCKER_HUB_IMAGE = f"{DOCKER_USERNAME}/{IMAGE_NAME}:latest"

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
    print("  IntelliQuiz Backend - Push to Docker Hub")
    print("=" * 70)
    print(f"\nConfiguration:")
    print(f"  Docker Hub Username: {DOCKER_USERNAME}")
    print(f"  Image Name: {IMAGE_NAME}")
    print(f"  Docker Hub Image: {DOCKER_HUB_IMAGE}")
    print(f"  Local Image: {LOCAL_IMAGE}")
    
    # Step 1: Check if Docker is running
    print("\n[1] Checking Docker daemon...")
    if not run_command(["docker", "ps"], "Docker daemon check"):
        print("✗ Docker daemon is not running!")
        print("  Please start Docker Desktop and try again.")
        sys.exit(1)
    
    # Step 2: Check if local image exists
    print("\n[2] Checking if local image exists...")
    try:
        result = subprocess.run(
            ["docker", "image", "inspect", LOCAL_IMAGE],
            capture_output=True,
            text=True,
            check=True
        )
        print(f"✓ Found local image: {LOCAL_IMAGE}")
    except subprocess.CalledProcessError:
        print(f"✗ Local image not found: {LOCAL_IMAGE}")
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
    
    # Step 4: Tag the image
    print(f"\n[4] Tagging image as {DOCKER_HUB_IMAGE}...")
    if not run_command(
        ["docker", "tag", LOCAL_IMAGE, DOCKER_HUB_IMAGE],
        "Tagging image"
    ):
        sys.exit(1)
    
    # Step 5: Push to Docker Hub
    print(f"\n[5] Pushing image to Docker Hub...")
    print("  (This may take a few minutes depending on image size and internet speed)")
    if not run_command(
        ["docker", "push", DOCKER_HUB_IMAGE],
        "Pushing to Docker Hub"
    ):
        print("\n✗ Push failed!")
        print("  Make sure you are logged in and have internet connection.")
        sys.exit(1)
    
    # Step 6: Verify on Docker Hub
    print("\n[6] Image successfully pushed!")
    print("=" * 70)
    print("\n✓ Success! Your image is now on Docker Hub")
    print(f"\nImage URL: https://hub.docker.com/r/{DOCKER_USERNAME}/{IMAGE_NAME}")
    print(f"\nYour team can now pull it with:")
    print(f"  docker pull {DOCKER_HUB_IMAGE}")
    print(f"\nOr use the updated docker-compose.yml which pulls from Docker Hub automatically.")
    print("\n" + "=" * 70)

if __name__ == "__main__":
    main()
