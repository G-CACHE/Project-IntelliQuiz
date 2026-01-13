## Submodule Usage

If you are using this backend as a git submodule in another repository:

1. **Clone with submodules:**
   ```bash
   git clone --recurse-submodules <main-repo-url>
   ```

2. **Initialize submodules after cloning (if not done above):**
   ```bash
   git submodule update --init --recursive
   ```

3. **Update submodule to latest commit:**
   ```bash
   git submodule update --remote backend
   ```

4. **Switch submodule to a different branch:**
   ```bash
   cd backend
   git fetch
   git switch <branch-name>
   git pull origin <branch-name>
   cd ..
   git add backend
   git commit -m "Update backend submodule to <branch-name>"
   ```

This ensures your backend submodule is up to date and on the correct branch.

# Backend Developer Notes

Local Development with Postgres & Flyway

1. Configure your local Postgres connection in .env or export environment variables:
   - DB_URL=jdbc:postgresql://localhost:5432/intelliquiz_db
   - DB_USERNAME=intelliquiz
   - DB_PASSWORD=intellipass

2. Flyway Migrations

- Flyway will run automatically when you start the Spring Boot application. The config in `src/main/resources/application.properties` enables Flyway and sets migration locations to `classpath:db/migration`.
- If you already applied the schema manually or the database contains tables, set `spring.flyway.baseline-on-migrate=true` (present in application.properties) so Flyway can mark the current schema as baseline and not attempt to re-apply the existing migrations.

3. Running migrations manually (optional)

If you prefer to run migrations using the Maven plugin rather than starting the app:

```
./mvnw -DDB_URL=jdbc:postgresql://localhost:5432/intelliquiz_db -DDB_USERNAME=intelliquiz -DDB_PASSWORD=intellipass flyway:migrate
```

Note: We've aligned the Flyway plugin and starter versions to avoid the "No Flyway database plugin found" errors on local setups. If you continue to see plugin errors, run the migrations from the running app instead.

4. Notes

- Migrations are idempotent (seed files use "ON CONFLICT DO NOTHING" where applicable) and safe for repeated runs.
- If you have previously applied schema via `psql` or other tooling, prefer `baseline-on-migrate=true` so Flyway marks the existing schema without re-applying migration files.
