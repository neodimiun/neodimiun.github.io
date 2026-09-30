# joseqc.com

Personal site for Jose A. Fernandez Abreu, Senior Engineer, Materials & Process Technologies at Collins Aerospace Landing Systems.

Source lives in `site/` (React, TypeScript, Vite, Tailwind). GitHub Pages serves the built files from the repository root.

```bash
cd site
npm install
npm run dev          # local, client-rendered
npm run build        # client build, SSR build, prerender into dist/index.html
npm run build:pages  # build, then copy index.html and assets/ to the repo root
```

Commit the root `index.html` and `assets/` after `build:pages`; that is what Pages deploys.

## Layout

- `site/src/chapters.tsx` holds the career chapters: label row, headline, prose, spec rows, figure. Edit copy there.
- `site/src/components/GearSequence.tsx` is the scroll-scrubbed landing gear sequence before chapter 05. Frames live in `media/gear/{1280,640}/` and were cut from `site/media-src/gear.mp4` with:

  ```bash
  ffmpeg -i site/media-src/gear.mp4 -vf "fps=48/10,scale=1280:-1" -frames:v 48 -c:v libwebp -quality 72 media/gear/1280/f-%02d.webp
  ffmpeg -i site/media-src/gear.mp4 -vf "fps=48/10,scale=640:-1"  -frames:v 48 -c:v libwebp -quality 70 media/gear/640/f-%02d.webp
  ```

- `fonts/` and `media/` sit at the root and are symlinked from `site/public/`, so the dev server and the deployed site share them.
- Fonts are Geist Sans and Geist Mono (SIL Open Font License, see `fonts/LICENSE-geist.txt`), latin subset, self-hosted.
- `site/scripts/prerender.mjs` renders the app to static HTML at build time so crawlers and link previews see content; `main.tsx` hydrates it.

## House style

No em-dashes anywhere. En-dashes only for ranges. Chronological, oldest first.
