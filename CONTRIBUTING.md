# Contributing to Open Charity

## Code Style and formatting

- Prettier + ESLint are used for code formatting.
- Run `yarn lint`, `yarn lint:fix` and `yarn format` before committing.

## Git Guidelines

- Branch naming: `feature/<name>`, `bugfix/<name>`
- Commit messages: Use conventional commits (`feat:`, `fix:`, `chore:`)

## Pull Requests

- Create branches from `main`
- Always open PRs against `develop` branch.
- PRs must include description and testing instructions.

## Testing

- Unit tests: `yarn test:unit`
- Integration tests: `yarn test:integration`
- Run all tests: `yarn test`

## Documentation

- Use `DEVELOPMENT.md` as setup reference.
- Keep README.md and `.env.example` up to date.

## Code of Conduct

- See `CODE_OF_CONDUCT.md`

## License

- AGPLv3 — contributions are under the same license.
