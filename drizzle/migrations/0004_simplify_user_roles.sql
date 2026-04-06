-- Migration: Simplify user roles (remove owner/photographer, add user)
-- All existing owner and photographer users become "user"

CREATE TYPE user_role_new AS ENUM ('super_admin', 'user');

ALTER TABLE users
  ALTER COLUMN role DROP DEFAULT,
  ALTER COLUMN role TYPE user_role_new
    USING (CASE
      WHEN role::text = 'super_admin' THEN 'super_admin'::user_role_new
      ELSE 'user'::user_role_new
    END),
  ALTER COLUMN role SET DEFAULT 'user'::user_role_new;

DROP TYPE user_role;

ALTER TYPE user_role_new RENAME TO user_role;
