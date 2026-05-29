# Scripts

Run from `my-app/`.

Local: `USE_LOCAL_BLOB=true node --env-file=.env.local --experimental-strip-types scripts/<name>.ts`

Supabase: `USE_LOCAL_BLOB=false node --env-file=.env.local --experimental-strip-types scripts/<name>.ts`

Note: always ask the user before running against Supabase.
