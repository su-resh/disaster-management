# Contributing to the Rescue Platform

Thank you for contributing! This platform supports real emergency response work, so reliability matters — every contribution is reviewed carefully.

Also see the in-depth [development guide](./docs/development.md) and [contributing notes](./docs/contributing.md).

## Code of Conduct

By participating in this project you agree to abide by the [Code of Conduct](./CODE_OF_CONDUCT.md).

## Development setup

1. Clone the repository.
2. **Dashboard** (Next.js + Supabase):
   ```bash
   cd dashboard
   npm install
   cp your-env-vars into dashboard/.env.local   # NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
   npm run dev
   ```
3. **Mobile** (Flutter): install the [Flutter SDK](https://docs.flutter.dev/get-started/install), then:
   ```bash
   cd mobile
   flutter pub get
   flutter run
   ```
4. **Database**: Supabase migrations live in `supabase/migrations/`.

## Branch workflow

All work happens through pull requests into `main`:

```text
main
  ↑
Pull Request
  ↑
feature/fix/docs branch
```

Name your branches:

| Type        | Prefix       | Example                    |
|-------------|--------------|----------------------------|
| New feature | `feature/`   | `feature/offline-maps`     |
| Bug fix     | `fix/`       | `fix/map-marker-crash`     |
| Docs        | `docs/`      | `docs/deployment-guide`    |
| Refactor    | `refactor/`  | `refactor/realtime-hooks`  |
| Chore       | `chore/`     | `chore/upgrade-nextjs`     |
| Tests       | `test/`      | `test/rls-policies`        |

## Pull request expectations

- PRs must target `main`; at least **one approving review** is required.
- All conversations must be resolved before merging.
- CI must pass: dashboard `npm run lint` + `npm run build`, mobile `flutter analyze` + `flutter test`.
- Keep PRs focused; use **squash and merge** (head branches are deleted automatically).
- Use the pull request template provided.

## Code quality

- Follow the existing code style (ESLint for the dashboard, `analysis_options.yaml` for Flutter).
- Add or update tests where practical.
- Never commit secrets, API keys, or `.env` files. Push protection is enabled and will block attempts.

## Reporting issues

Open an issue using the appropriate template ([bug report](.github/ISSUE_TEMPLATE/bug_report.md), [feature request](.github/ISSUE_TEMPLATE/feature_request.md), or [question](.github/ISSUE_TEMPLATE/question.md)). Security vulnerabilities are handled differently — see [SECURITY.md](./SECURITY.md).

## License

By contributing, you agree that your contributions will be licensed under the [AGPL-3.0 License](./LICENSE).
