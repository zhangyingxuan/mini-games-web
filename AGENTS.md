# Repository Guidelines

## Project Structure & Module Organization

This pnpm workspace contains four React 18, TypeScript and Vite applications under `packages/`. `main-app` is the micro-frontend host: its `src/pages/` defines routes and `src/layout/` contains the shared layout. `home-app`, `games-app` and `user-app` are independently served micro-apps. Game components and their LESS styles live in `packages/games-app/src/components/`. Each app has its own `index.html`, Vite config and `src/` entry point. Keep app-specific assets with the app that uses them.

## Build, Test, and Development Commands

- `pnpm install`: install workspace dependencies using `pnpm-lock.yaml`.
- `pnpm start` or `pnpm dev:main`: start the host on port 3000.
- `pnpm dev:home`, `pnpm dev:games`, `pnpm dev:user`: start individual micro-apps. Run the relevant child servers alongside the host when checking integrated pages.
- `pnpm build`: type-check and build all four apps. Use `pnpm build:games` (or `build:main`, `build:home`, `build:user`) for one app.
- `pnpm --filter games-app preview`: preview that app's production build.

## Coding Style & Naming Conventions

Follow the existing two-space indentation, single-quoted imports and semicolon-free TypeScript style. Use PascalCase for React component files and components, such as `GomokuGame.tsx`; keep related LESS files beside their components. Prefer functional components and Hooks, with correct dependency arrays. TypeScript strict mode is enabled. Add Chinese comments to core logic, explaining why where the reasoning is not obvious. No repository lint or formatting script is currently configured.

## Testing Guidelines

No test framework, test script or coverage threshold is currently configured. For changes, run the relevant build and manually exercise affected routes and game interactions in the browser. If adding tests, place them near the code and document their command and naming convention when introducing the test tooling.

## Commit & Pull Request Guidelines

Git history is unavailable in this checkout, so no existing commit convention can be verified. Write concise, descriptive commit subjects. Pull requests should explain the change, list validation performed, link relevant issues and include screenshots for visible UI changes. Do not commit or push unless explicitly requested.

## Agent Instructions

Use UTF-8 and remove temporary files created during the task, including any images in `mcp-screenshots/`.
