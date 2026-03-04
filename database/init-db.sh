#!/bin/bash
# Database initialization script
# This script runs when the PostgreSQL container starts

set -e

echo "Starting database initialization..."

# Wait for PostgreSQL to be ready
until pg_isready -U postgres -h localhost; do
  echo "Waiting for PostgreSQL to be ready..."
  sleep 2
done

echo "PostgreSQL is ready. Loading backup data..."

# Check if backup file exists and load it
if [ -f /docker-entrypoint-initdb.d/backup_intelliquiz.sql ]; then
  echo "Loading backup_intelliquiz.sql..."
  psql -U postgres -d intelliquiz < /docker-entrypoint-initdb.d/backup_intelliquiz.sql
  echo "Backup data loaded successfully!"
else
  echo "No backup file found. Database will start with schema only."
fi

echo "Database initialization complete!"
