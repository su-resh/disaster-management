# Security Policy

## Supported versions

This project is under active development. Security fixes are applied to the latest `main` branch.

## Reporting a vulnerability

**Do not open a public issue for security vulnerabilities.**

This repository has **private vulnerability reporting** enabled:

1. Go to the **Security** tab of the repository.
2. Click **Report a vulnerability**.
3. Provide a description, reproduction steps, and impact assessment.

You can also use GitHub's [security advisories](https://github.com/su-resh/disaster-management/security/advisories) page. Reports are reviewed promptly and you will receive a response.

## Scope

Please report anything affecting:

* Authentication, authorization, or Row Level Security (RLS) policies in `supabase/`
* Exposure of emergency responder or affected-population data
* Injection or cross-site scripting in the dashboard or mobile app
* Secrets accidentally committed to the repository (also see note below)

## Security practices

* Secret scanning and push protection are enabled on this repository.
* Dependabot monitors dependency vulnerabilities for npm, pub, and GitHub Actions.
* Supabase Row Level Security protects data access — see [docs/security.md](./docs/security.md).

If you accidentally commit a secret, revoke/rotate it immediately at the provider and then contact the maintainers privately.
