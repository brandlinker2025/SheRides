# SheRides security

## Supported runtime

- Node.js 22 or newer
- Dependencies must be installed with `npm ci` so `package-lock.json` is respected.

## Required Supabase migration

Application security depends on both the Next.js code and Supabase row-level security.
After deploying this revision, link the correct Supabase project and apply:

```bash
npx supabase migration up --linked
```

The migration in `supabase/migrations/20260830081647_security_hardening.sql`:

- prevents browser clients from promoting administrators;
- prevents riders from changing `role` or `verified`;
- limits profiles, posts, events, messages, and social data to authenticated members;
- removes public execution of the welcome-message function;
- removes recursive conversation-membership policies;
- maintains like counters in the database;
- creates a private `verifications` bucket for driving licences and motorcycle registrations;
- allows verification documents to be read only by their owner or an administrator.

Never place a Supabase service-role or secret key in a `NEXT_PUBLIC_` environment variable.
Only the publishable/anon key belongs in browser configuration.

## Verification documents

Driving licences and registration papers are sensitive personal documents. They must use the
private `verifications` bucket and signed URLs. Do not place them in `avatars`, `posts`, a public
bucket, or a permanent public URL.

## Reporting a vulnerability

Do not open a public issue containing personal information, credentials, tokens, or verification
documents. Contact the repository owner privately and include the affected route, impact, and safe
reproduction steps.
