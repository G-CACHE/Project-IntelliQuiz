# Checking Database Tables

After running `python run_docker.py`, here are ways to inspect the PostgreSQL database:

## Option 1: Using psql (Command Line) - **Easiest**

### On Windows (PowerShell/CMD):
```bash
# Connect to the database
psql -h localhost -p 5434 -U postgres -d intelliquiz

# When prompted, enter password: mysecretpassword
```

### On macOS/Linux:
```bash
psql -h localhost -p 5434 -U postgres -d intelliquiz
```

### Useful psql Commands:

Once connected, use these commands:

```sql
-- List all tables
\dt

-- List all schemas
\dn

-- Show table structure
\d table_name

-- List all databases
\l

-- Show current database
SELECT current_database();

-- Count rows in a table
SELECT COUNT(*) FROM table_name;

-- See all tables with row counts
SELECT schemaname, tablename FROM pg_tables WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema';

-- Exit psql
\q
```

**Example session:**
```
psql -h localhost -p 5434 -U postgres -d intelliquiz
Password for user postgres: mysecretpassword

intelliquiz=# \dt
                 List of relations
 Schema |        Name        | Type  | Owner
--------+--------------------+-------+--------
 public | events             | table | postgres
 public | users              | table | postgres
 public | teams              | table | postgres
 public | questions          | table | postgres
(4 rows)

intelliquiz=# SELECT COUNT(*) FROM events;
 count
-------
    15
(1 row)

intelliquiz=# \q
```

---

## Option 2: Using Python Script

Create a file `check_db.py` in the root folder:

```python
#!/usr/bin/env python3
import psycopg2
import sys
from tabulate import tabulate

def check_database():
    """Connect to PostgreSQL and display tables information"""
    
    try:
        # Connection parameters
        conn = psycopg2.connect(
            host="localhost",
            port=5434,
            database="intelliquiz",
            user="postgres",
            password="mysecretpassword"
        )
        
        cursor = conn.cursor()
        
        # Get all tables
        cursor.execute("""
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public'
            ORDER BY tablename
        """)
        
        tables = cursor.fetchall()
        
        if not tables:
            print("❌ No tables found in the database")
            return
        
        print("\n✅ Tables in 'intelliquiz' database:")
        print("=" * 50)
        
        for table_name in tables:
            table = table_name[0]
            
            # Get column information
            cursor.execute(f"""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = '{table}'
                ORDER BY ordinal_position
            """)
            
            columns = cursor.fetchall()
            
            # Get row count
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            row_count = cursor.fetchone()[0]
            
            print(f"\n📋 Table: {table} ({row_count} rows)")
            print("-" * 50)
            
            if columns:
                headers = ["Column", "Type", "Nullable"]
                print(tabulate(columns, headers=headers, tablefmt="grid"))
            
        cursor.close()
        conn.close()
        print("\n✅ Database check completed successfully!")
        
    except psycopg2.OperationalError as e:
        print(f"❌ Connection Error: {e}")
        print("\n💡 Make sure:")
        print("   1. Docker containers are running: python run_docker.py")
        print("   2. Wait a few seconds for PostgreSQL to start")
        print("   3. Check your connection parameters")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    check_database()
```

**Install required package:**
```bash
pip install psycopg2-binary tabulate
```

**Run it:**
```bash
python check_db.py
```

**Output example:**
```
✅ Tables in 'intelliquiz' database:
==================================================

📋 Table: events (15 rows)
--------------------------------------------------
╒════════════════╤══════════════╤════════════╕
│ Column         │ Type         │ Nullable   │
╞════════════════╪══════════════╪════════════╡
│ id             │ bigint       │ NO         │
│ title          │ varchar(255) │ NO         │
│ description    │ text         │ YES        │
│ created_at     │ timestamp    │ YES        │
│ updated_at     │ timestamp    │ YES        │
╘════════════════╩══════════════╩════════════╛

...more tables...
```

---

## Option 3: Using GUI Tools (pgAdmin)

### Add pgAdmin to Docker Compose

Edit `docker-compose.yml` and add this service:

```yaml
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: intelliquiz-pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@example.com
      PGADMIN_DEFAULT_PASSWORD: admin
      PGADMIN_CONFIG_SERVER_MODE: 'False'
    ports:
      - "5050:80"
    networks:
      - intelliquiz_network
    depends_on:
      - db
```

Then access pgAdmin at: **http://localhost:5050**
- Email: `admin@example.com`
- Password: `admin`

**To add the database connection in pgAdmin:**
1. Click "Add New Server"
2. Name: `intelliquiz`
3. Hostname: `db` (Docker service name)
4. Port: `5432`
5. Username: `postgres`
6. Password: `mysecretpassword`

---

## Option 4: DBeaver GUI (Local Installation)

1. **Download & install** [DBeaver](https://dbeaver.io/)
2. Click **"New Database Connection"**
3. Select **PostgreSQL** → Next
4. Enter connection details:
   - **Host:** localhost
   - **Port:** 5434
   - **Database:** intelliquiz
   - **Username:** postgres
   - **Password:** mysecretpassword
5. Test Connection → Finish
6. Browse tables in the left panel

---

## Option 5: Check via Backend API

If the Spring Boot backend is running and tables are populated, you can also verify data through the API:

```bash
# Check if backend is running
curl http://localhost:8090/actuator/health

# Get events from database (via backend)
curl http://localhost:8090/api/events

# Get users from database (via backend)
curl http://localhost:8090/api/users
```

If you get valid JSON responses, the database is working!

---

## Troubleshooting

### "psql: command not found"
- **Windows:** Install PostgreSQL client tools or use Docker:
  ```bash
  docker exec intelliquiz-db psql -U postgres -d intelliquiz -c "\dt"
  ```
- **macOS:** `brew install libpq`
- **Linux:** `sudo apt install postgresql-client`

### "Connection refused"
- Make sure containers are running: `python run_docker.py`
- Wait 5-10 seconds for PostgreSQL to fully start
- Check port 5434 is accessible

### "FATAL: database 'intelliquiz' does not exist"
- Database might not be created yet (depends on your backend DDL)
- Check backend logs: `docker logs intelliquiz-backend`

---

## Quick Reference Table

| Method | Ease | Speed | Requirements |
|--------|------|-------|--------------|
| psql CLI | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | PostgreSQL client |
| Python Script | ⭐⭐⭐ | ⭐⭐⭐⭐ | psycopg2, tabulate |
| pgAdmin Web | ⭐⭐⭐⭐ | ⭐⭐⭐ | Docker container |
| DBeaver GUI | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Installed locally |
| Backend API | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | None (already running) |

---

## Credentials Reference

```
Host: localhost
Port: 5434
Database: intelliquiz
Username: postgres
Password: mysecretpassword
```

Use these when any tool asks for connection details.
