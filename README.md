# Test

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.1.3.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

# Project

This repository contains an Angular application. The document below summarizes how to build, test, and contribute following the project's conventions.

## Development server

Start the dev server (local development):

```bash
npm start
```

Open http://localhost:4200/ in your browser. The app reloads on file changes.

## Build

Create a production build:

```bash
npm run build
```

To build with a specific Angular configuration:

```bash
npm run build -- --configuration production
```

Built artifacts are placed in the `dist/` folder.

## Linting & formatting

Run linters and format checks:

```bash
npm run lint
npm run format
```

Note: `lint` uses `@angular-eslint`; `husky` + `lint-staged` run checks on pre-commit.

## Unit tests (Jest)

This project uses Jest for unit tests. Run tests with coverage:

```bash
npm test
```

Quick coverage report (open in browser):

```bash
# run tests (creates coverage/) then open coverage/lcov-report/index.html
npm test
```

Enforce an 80% global coverage threshold locally (example):

```bash
npx jest --coverage --coverageThreshold='{"global":{"branches":80,"functions":80,"lines":80,"statements":80}}'
```

Recommended: add the same `coverageThreshold` to `jest.config.js` so CI fails when thresholds are not met.

## End-to-end tests (Playwright)

E2E tests use Playwright. Run them with:

```bash
npm run e2e
# or
npx playwright test
```

Run headed (visible browser) mode:

```bash
npx playwright test --headed
```

## Commit messages & hooks

This repository enforces Conventional Commits. Use the format:

```
type(scope): short description
```

Examples: `feat(auth): add login button`, `fix(api): handle 500`. Husky and `commitlint` enforce this on commit.

If hooks are not installed, run:

```bash
npm run prepare
```

## CI / Coverage policy

- CI should run `npm ci`, `npm test`, and `npm run e2e`.
- Ensure `jest.config.js` contains a `coverageThreshold` entry to enforce the 80% global coverage gate.

Example `jest.config.js` fragment to enforce thresholds:

```js
module.exports = {
  preset: "jest-preset-angular",
  setupFilesAfterEnv: ["<rootDir>/setup-jest.ts"],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

## Troubleshooting

- If tests fail after switching to Jest, ensure `jest`, `jest-preset-angular`, `ts-jest`, and `@types/jest` are installed.
- If Playwright tests fail, run `npx playwright install` to install browser binaries.

## Quick commands

```bash
npm ci            # install clean dependencies (CI)
npm install       # install locally
npm start         # dev server
npm run build     # production build
npm test          # unit tests (Jest) with coverage
npm run e2e       # run Playwright end-to-end tests
npm run lint      # lint the codebase
npm run prepare   # install git hooks
```
