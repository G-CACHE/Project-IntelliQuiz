-- Migration: Convert deprecated ADMIN role to EXAMINER
-- Date: 2026-05-29
-- Description: Converts all existing users with ADMIN role to EXAMINER role
--              since ADMIN is no longer supported in the system

-- Check for users with ADMIN role
SELECT COUNT(*) as admin_user_count
FROM "user"
WHERE system_role = 'ADMIN';

-- Perform the migration
UPDATE "user"
SET system_role = 'EXAMINER'
WHERE system_role = 'ADMIN';

-- Verify migration
SELECT COUNT(*) as admin_user_count_after
FROM "user"
WHERE system_role = 'ADMIN';

-- Show all migrated users (should be empty now)
SELECT id, username, system_role
FROM "user"
WHERE system_role IN ('ADMIN', 'EXAMINER')
ORDER BY id;

