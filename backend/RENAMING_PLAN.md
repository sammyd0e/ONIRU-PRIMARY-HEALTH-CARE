# Full App Rename Plan (orders->appointments, products->services, reviews->feedback)

This document explains a careful, low-risk procedure to fully rename
app folders, AppConfig names, and migrations when you're ready to move
beyond UI-only changes. This plan assumes you have access to the
production database and can schedule a maintenance window.

High-level options

A. In-place rename with DB table renames
   - Change folder names and AppConfig.name values.
   - Update all imports and migration dependencies.
   - Use SQL to rename DB tables to the new app label names (or use
     Django migrations with RunSQL).
   - Update the `django_migrations` table to reflect new app labels OR
     create no-op migrations with `replaces` to keep history.

B. New app + data migration (safer)
   - Create new apps `appointments`, `services`, `feedback` alongside
     the old apps.
   - Create new models which match existing schema.
   - Write data migrations (management commands or Django migrations)
     to copy rows from old tables to new tables.
   - After verification, remove old apps and migrations.

Recommended path: Option B (new apps + data move). It's longer but
safer and preserves history.

Detailed Steps (Option B)

1. Backup
   - Dump DB: `sqlite3 db.sqlite3 .dump > dump.sql` (or use `pg_dump`
     for Postgres).
   - Export a copy of the repository and database.

2. Create new apps
   - `python manage.py startapp appointments`
   - `python manage.py startapp services`
   - `python manage.py startapp feedback`

3. Implement models
   - Copy model definitions from `orders/models.py` into
     `appointments/models.py` (preserving field names and db_table if
     you want). Prefer using the same `db_table` names only if you plan
     to drop/rename old tables; otherwise use new table names.

4. Make migrations for new apps
   - `python manage.py makemigrations appointments services feedback`
   - `python manage.py migrate --run-syncdb` (if needed)

5. Data migration
   - Write migration or management command to copy data from old
     tables to new tables. Handle FK remapping (users -> patients)
     carefully.
   - Run copy in a test environment and validate counts and referential
     integrity.

6. Swap traffic (maintenance window)
   - Take service offline (or disable writes).
   - Run final sync to copy incremental changes.
   - Point code to new apps (update INSTALLED_APPS, imports, remove
     old apps), run migrations on new apps.

7. Cleanup
   - Remove old apps and migrations after validation.
   - Update README and docs.

Caveats and warnings
- Migrations are sensitive; don't delete or rename migration files
  without a clear migration plan.
- If you keep the same `db_table` names, be careful about model
  Meta.db_table conflicts.
- Test the entire plan in a staging environment first.

If you'd like, I can scaffold the new apps and produce the data-copy
management commands and an automated migration checklist. Tell me if you
prefer Option A (in-place table renames) or Option B (new apps + copy).
