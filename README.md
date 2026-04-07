# Simple Local Image Printer

A browser-based tool to compose and export images on A4 pages — no server, no uploads, fully local.

## What it does

Load images from your device, arrange them in a grid, optionally label each one, then export the result as a PDF or JPG. Everything runs in the browser; no data ever leaves your machine.

**Features:**

- Select multiple images from your device
- Optionally add a **title** (displayed bold above the image) and a **subtext** (displayed below the image) to each image
- Reorder images via drag-and-drop
- Preview the composed A4 page in real time
- Export to PDF or JPG

## Usage

### With Docker (recommended)

```bash
docker pull ghcr.io/mstroppel/simple-local-image-printer:latest
docker run -p 8080:80 ghcr.io/mstroppel/simple-local-image-printer:latest
```

Open `http://localhost:8080` in your browser.

### Local development

No build step required. Serve the `src/` directory with any static file server:

```bash
npx serve src/
# or
python3 -m http.server 8080 --directory src/
```

---

## Implementation Plan

### Tech stack

| Concern | Choice | Rationale |
|---|---|---|
| Frontend | Vanilla JS + HTML + CSS | No build step, zero framework overhead, served as static files |
| Drag-and-drop | [SortableJS](https://sortablejs.github.io/Sortable/) (CDN) | Lightweight, no dependencies |
| PDF export | [jsPDF](https://github.com/parallax/jsPDF) + [html2canvas](https://html2canvas.hertzen.com/) (CDN) | Fully client-side, well maintained |
| JPG export | html2canvas (same lib) | Reuses the PDF rendering pipeline |
| Container | nginx:alpine | Minimal image to serve static files |
| CI/CD | GitHub Actions | PR validation + image publish on merge/tag |

---

### Phase 1 — Project scaffolding

- [ ] Create `src/` directory with `index.html`, `style.css`, `app.js`
- [ ] Add `Dockerfile` (nginx:alpine serving `src/`)
- [ ] Add `.dockerignore`
- [ ] Add `.github/workflows/validate.yml` — runs on every PR, builds the Docker image to verify it builds cleanly
- [ ] Add `.github/workflows/publish.yml` — runs on push to `main` and on new version tags (`v*`), builds and pushes the image to GHCR

---

### Phase 2 — Core UI

```
┌──────────────────────────────────────────────┐
│  [+ Add images]                              │  ← toolbar
├──────────────────────────────────────────────┤
│  ┌──────┐  ┌──────┐  ┌──────┐               │
│  │ img1 │  │ img2 │  │ img3 │  ← drag cards │
│  │      │  │      │  │      │               │
│  │Title │  │Title │  │Title │               │
│  │Sub   │  │Sub   │  │Sub   │               │
│  └──────┘  └──────┘  └──────┘               │
├──────────────────────────────────────────────┤
│  [Export PDF]  [Export JPG]                  │  ← actions
└──────────────────────────────────────────────┘
```

- [ ] File input (accepts multiple images, `accept="image/*"`)
- [ ] Image card component: thumbnail, editable title field, editable subtext field, remove button
- [ ] Drag-and-drop reordering of cards using SortableJS
- [ ] Live A4 preview panel that mirrors the card order and labels

---

### Phase 3 — A4 layout & rendering

The A4 preview is a `div` styled at `794px × 1123px` (96 dpi equivalent of 210 × 297 mm).

- [ ] CSS grid layout that auto-fills columns (1, 2, or 3 per row depending on image count)
- [ ] Each cell: bold title (`<strong>`) above image, subtext below image
- [ ] Images scale to fill their cell while preserving aspect ratio (`object-fit: contain`)
- [ ] Print-friendly CSS (`@media print`) as a fallback

---

### Phase 4 — Export

- [ ] **Export PDF**: render the A4 preview `div` with html2canvas, add the resulting canvas to a jsPDF document at A4 dimensions, trigger download
- [ ] **Export JPG**: render the A4 preview `div` with html2canvas, call `canvas.toDataURL('image/jpeg')`, trigger download

---

### Phase 5 — Docker & CI/CD

**`Dockerfile`**
```dockerfile
FROM nginx:alpine
COPY src/ /usr/share/nginx/html
```

**`.github/workflows/validate.yml`** — triggered on PRs targeting `main`:
1. Checkout code
2. `docker build .` — fails the check if the build breaks

**`.github/workflows/publish.yml`** — triggered on push to `main` or tag `v*`:
1. Checkout code
2. Log in to GHCR (`ghcr.io`) using `GITHUB_TOKEN`
3. Build and push image with tags:
   - `ghcr.io/mstroppel/simple-local-image-printer:latest` (on `main`)
   - `ghcr.io/mstroppel/simple-local-image-printer:vX.Y.Z` (on version tag)

---

### File structure (target)

```
simple-local-image-printer/
├── src/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── .github/
│   └── workflows/
│       ├── validate.yml
│       └── publish.yml
├── Dockerfile
├── .dockerignore
├── LICENSE
└── README.md
```

---

## License

MIT — see [LICENSE](LICENSE).
