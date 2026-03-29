# ImgTor (DarkroomJS fork)

![License MIT](http://img.shields.io/badge/license-MIT-blue.svg)
[![CI](https://github.com/ai-tonia/imgtorjs/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/ai-tonia/imgtorjs/actions/workflows/ci.yml)

**ImgTor** is the maintained fork of **DarkroomJS**, hosted at [github.com/ai-tonia/imgtorjs](https://github.com/ai-tonia/imgtorjs). The npm package name is **`imgtor`**. The original author’s project is discontinued; this fork modernizes the build (**Vite** + **Lightning CSS** for styles), targets **Node.js 22+**, and keeps the **`Darkroom`** global for backward compatibility (also exposed as **`ImgTor`**).

> **Maintainers — pull requests:** GitHub’s “Compare & pull request” button often targets **upstream** [`MattKetmo/darkroomjs`](https://github.com/MattKetmo/darkroomjs). **Do not use that for ImgTor work.** From your feature branch, run **`npm run pr:create`** (uses GitHub CLI with `--repo ai-tonia/imgtorjs --base main`) or open **[compare on this repo only](https://github.com/ai-tonia/imgtorjs/compare)** and set **base = `main`**, **head = your branch**. See **CONTRIBUTING.md**.

### Install from npm

```bash
npm install imgtor
```

The package ships **`build/darkroom.js`** and **`build/darkroom.css`**. You still need **Fabric.js 1.4.x** on the page before loading ImgTor.

**TypeScript:** ambient types live in **`types/darkroom.d.ts`**. Use `/// <reference types="imgtor" />` (or include that file); globals **`ImgTor`** and **`Darkroom`** are both declared. Fabric remains `any`-ish in these typings.

Upstream history: [DarkroomJS](https://github.com/MattKetmo/darkroomjs) by Matthieu Moquet.

## What changed in this fork

- **Name:** **ImgTor** (npm package **`imgtor`**, repository **ai-tonia/imgtorjs**). Use global **`ImgTor`** in new code; **`Darkroom`** remains as an alias for older snippets.
- **Build:** **Vite** (IIFE bundle) and **Lightning CSS** minify `lib/css/darkroom.css` → `build/darkroom.css` (no Dart Sass).
- **Tooling:** ESLint, Prettier, and Vitest smoke tests (`npm test`).
- **Demo:** third-party analytics were removed from the sample page.

## ⚠️ Upstream notice (historical)

The upstream **DarkroomJS** library has been discontinued and is **no longer maintained** by the original author. **ImgTor** carries the codebase forward with a modern toolchain and tests.

## Requirements

- **Node.js 22+** and npm

## Fabric.js

The library targets **Fabric.js 1.4.x** (same era as the original DarkroomJS). The demo loads **`demo/vendor/fabric.js`**. Newer Fabric major versions change APIs widely; upgrading is a separate, breaking effort. See **CONTRIBUTING.md** for maintainer notes.

## Building

```bash
npm install
npm run build
```

The published npm tarball includes **`build/darkroom.js`** and **`build/darkroom.css`** (`package.json` `files`, `main`, `style`). **`npm publish`** runs **`prepublishOnly`** → **`npm run build`** first.

Built files go to `build/` (not committed). The demo loads **`./build/...`** under `demo/`, so **`npm start`** runs **`npm run build`**, copies **`build/`** into **`demo/build/`** (`npm run sync:demo`), then serves the demo on port **2222**.

- `npm start` — build, sync demo assets, serve `demo/` on port **2222**
- `npm run develop` — watch JS (Vite) and SCSS (parallel watchers; stop with Ctrl+C)

## Usage

Instantiate **ImgTor** with a reference to the image element:

```html
<img src="some-image.jpg" id="target" />
<script src="path/to/fabric.js"></script>
<script src="path/to/build/darkroom.js"></script>
<script>
  new ImgTor('#target');
</script>
```

You can also pass options:

```javascript
new ImgTor('#target', {
  minWidth: 100,
  minHeight: 100,
  maxWidth: 500,
  maxHeight: 500,
  plugins: {
    crop: {
      minHeight: 50,
      minWidth: 50,
      ratio: 1,
    },
    save: false,
  },
  initialize: function () {
    this.plugins['crop'].requireFocus();
    this.addEventListener('core:transformation', function () {
      /* ... */
    });
  },
});
```

## Why?

It's easy to get a JavaScript snippet to crop an image on a page. If you want rotation or more canvas work, you often build it yourself. This library uses **HTML5 canvas** (via Fabric.js) without jQuery.

## The concept

The core turns the target image into a Fabric canvas and an empty toolbar. Features live in plugins; each plugin can add toolbar buttons and behavior.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for layout, tests, and workflow.

```bash
npm run develop
```

Run checks:

```bash
npm test
npm run test:e2e
npm run lint
```

See [RELEASING.md](RELEASING.md) for publish steps and [SECURITY.md](SECURITY.md) to report vulnerabilities.

## FAQ

How can I access the edited image?

Ask the canvas for data inside your save callback (or another hook):

```javascript
save: {
  callback: function () {
    this.darkroom.selfDestroy();
    const newImage = dkrm.canvas.toDataURL();
    fileStorageLocation = newImage;
  },
},
```

## License

Released under the MIT License. See [LICENSE](LICENSE).
