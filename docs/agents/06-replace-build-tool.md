# Sub-agent 6: Replace or remove the build tool

**Goal:** Remove legacy Gulp (and native `node-sass`) in favor of Vite or esbuild.

## Instructions for the agent

1. Map current Gulp pipeline: JS concat order, SVG sprite inject into `bootstrap.js`, SCSS → CSS, source maps, minify in prod.
2. Implement equivalent with **Vite** (recommended for dev server + lib build) or **esbuild** CLI.
3. Preserve output paths expected by consumers: typically `build/darkroom.js` and `build/darkroom.css`.
4. Update `package.json` scripts: `npm run build`, `npm run dev` (or `develop`), `npm start` for demo.
5. Remove `gulpfile.js` and Gulp-related devDependencies once parity is verified.

## Deliverables

- New config file(s): `vite.config.js` (and plugins if needed)
- Updated scripts and README build instructions
- Deleted Gulp artifacts

## Base branch

Stack on the branch merged from sub-agent 5.
