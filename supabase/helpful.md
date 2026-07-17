# Remote Pulling

npx supabase db dump --schema racee > supabase/migrations/00000000000000_init_custom_schema.sql

- (npx supabase db pull --schema racee) wouldn't work

# Reset DB

npx supabase db reset
