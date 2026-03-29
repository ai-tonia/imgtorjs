# ImgTor

![License MIT](http://img.shields.io/badge/license-MIT-blue.svg)
[![CI](https://github.com/ai-tonia/imgtorjs/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/ai-tonia/imgtorjs/actions/workflows/ci.yml)

**ImgTor** is a maintained canvas image editor, hosted at [github.com/ai-tonia/imgtorjs](https://github.com/ai-tonia/imgtorjs). The npm package name is **`imgtor`**. This line modernizes the build (**Vite** + **Lightning CSS** for styles), targets **Node.js 22+**, and exposes the editor as global **`imgtor`** (constructor).

### Install from npm

```bash
npm install imgtor
```

The package ships **`build/imgtor.js`** and **`build/imgtor.css`**. The editor is **Canvas 2D** (HTML `<canvas>`).

**Optional toolbar plugins** (filter, finetune, resize, frame, fill, redact, annotate, decorate, retouch) are loaded with the bundle but **disabled by default** in the demo. Enable them with a **map** — **`plugins: { filter: {}, … }`** — or turn one off with **`plugins: { filter: false }`**. You can also pass an **ordered list** (whitelist): **`plugins: ['history', 'rotate', 'crop', { id: 'save' }]`** — only listed plugins load, in that order; **`plugins: []`** loads none.

**TypeScript:** ambient types live in **`types/imgtor.d.ts`**. Use `/// <reference types="imgtor" />` (or include that file); the global **`imgtor`** constructor is declared there.

Upstream history: [DarkroomJS](https://github.com/MattKetmo/darkroomjs) by Matthieu Moquet. **Thank you, Matthieu** — your original library was the icebreaker that made browser-side canvas editing approachable for so many of us; **ImgTor** exists to carry that idea forward with a modern toolchain.

## What changed in this fork

- **Name:** **ImgTor** (npm package **`imgtor`**, repository **ai-tonia/imgtorjs**). Use global **`imgtor`** in application code.
- **Build:** **Vite** (IIFE bundle) and **Lightning CSS** minify `lib/css/imgtor.css` → `build/imgtor.css` (no Dart Sass).
- **Tooling:** ESLint, Prettier, and Vitest smoke tests (`npm test`).
- **Demo:** third-party analytics were removed from the sample page.

## ⚠️ Upstream notice (historical)

The original project this line descends from is discontinued and **no longer maintained** by the original author. **ImgTor** carries the codebase forward with a modern toolchain and tests.

## Requirements

- **Node.js 22+** and npm

## Building

```bash
npm install
npm run build
```

The published npm tarball includes **`build/imgtor.js`** and **`build/imgtor.css`** (`package.json` `files`, `main`, `style`). **`npm publish`** runs **`prepublishOnly`** → **`npm run build`** first.

Built files go to `build/` (not committed). The demo loads **`./build/...`** under `demo/`, so **`npm start`** runs **`npm run build`**, copies **`build/`** into **`demo/build/`** (`npm run sync:demo`), then serves the demo on port **2222**.

- `npm start` — build, sync demo assets, serve `demo/` on port **2222**
- `npm run develop` — watch JS (Vite) and CSS (parallel watchers; stop with Ctrl+C)

## Usage

Instantiate the editor with a reference to the image element:

```html
<img src="some-image.jpg" id="target" />
<script src="path/to/build/imgtor.js"></script>
<script>
  new imgtor('#target');
</script>
```

You can also pass options:

```javascript
new imgtor('#target', {
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

It's easy to get a JavaScript snippet to crop an image on a page. If you want rotation or more canvas work, you often build it yourself. This library uses **HTML5 canvas** (Canvas 2D) without jQuery.

## The concept

The core turns the target image into canvas surfaces and an empty toolbar. Features live in plugins; each plugin can add toolbar buttons and behavior.

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
    this.imgtor.selfDestroy();
    const newImage = this.imgtor.canvas.toDataURL();
    fileStorageLocation = newImage;
  },
},
```

## License

Released under the MIT License. See [LICENSE](LICENSE).
