# Repository Guidelines

## Project Structure & Module Organization
Routes live in `src/pages` and reuse layouts from `src/layouts` plus UI blocks inside `src/components`. Data-only modules in `src/config` hold metadata, FAQs, screenshots, and social links so copy updates stay code-free. Tailwind lives in `tailwind.config.cjs`, and static media belong in `public/` (for example, `public/assets/screenshots/iphone15.webp`) before being referenced through the config entry points.

## Build, Test, and Development Commands
- `npm install`: sync dependencies pinned by `package-lock.json`.
- `npm run dev`: start the Astro dev server with hot reload for local UI work.
- `npm run build`: type-check, SSR-compile, and emit the production bundle into `dist/`.
- `npm run preview`: serve the built output to smoke-test before merging or deploying.
- `npx astro check`: run Astro diagnostics and TypeScript validation before opening a pull request.

## Coding Style & Naming Conventions
Prettier (`prettier.config.cjs`) enforces tabs (width two), 80-character lines, semicolons, and Astro/Tailwind plugins that auto-sort class lists. Run `npx prettier --write "src/**/*.{astro,ts,tsx}"` before committing. Name components/layouts in PascalCase (`AppHero.astro`), hooks/utilities in camelCase, and keep text + URLs inside the `src/config` exports instead of hard-coding.

## Testing Guidelines
No automated suite exists yet, so treat `npm run build` and `npx astro check` as mandatory gates. For UI or copy work, document manual coverage (hero animation, store buttons, locale variants) and attach screenshots captured from `npm run preview` in the pull request.

## Commit & Pull Request Guidelines
Git history follows Conventional Commit prefixes (`feat`, `fix`, `chore`), so keep using them and limit the subject to 72 characters. Pull requests must state the problem, outline the solution, link issues, list verification commands/browsers, and attach before/after visuals when UI changes. Request review only after rebasing on `main` and confirming build + preview success.

## Content & Assets Tips
Update marketing copy or download URLs inside `src/config` (for example, `appInfo.ts` for store badges or `screenshots.ts` for the carousel) so shared components stay synchronized. Place large binaries in `public/`, prefer optimized WebP assets, and reference them through the config layer instead of importing files ad hoc.
