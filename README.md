# Simple Local Image Printer

A browser-based tool to compose and export images on A4 pages — no server, no uploads, fully local.

## What it does

Load images from your device, arrange them in a grid, optionally label each one, then export the result as a PDF or JPG. Everything runs in the browser; no data ever leaves your machine.

**Features:**

- Select multiple images from your device
- Optionally add a **title** (displayed bold above the image) and a **subtext** (displayed below the image) to each image
- Choose grid columns (1, 2, or 3 per row)
- Reorder images via drag-and-drop
- Automatic page breaks when images overflow a single A4 page
- Preview the composed A4 pages in real time
- Export to PDF (multi-page) or JPG (one image per page, downloaded as zip)

**Browser support:** Chrome, Firefox, Edge, Safari (latest 2 versions).

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
| Drag-and-drop | [SortableJS 1.15](https://sortablejs.github.io/Sortable/) (CDN, pinned) | Lightweight, no dependencies |
| PDF export | [jsPDF 2.5](https://github.com/parallax/jsPDF) + [html2canvas 1.4](https://html2canvas.hertzen.com/) (CDN, pinned) | Fully client-side, well maintained |
| JPG export | html2canvas (same lib) + [JSZip 3.10](https://stuk.github.io/jszip/) (CDN, pinned) | Reuses the PDF rendering pipeline; zip for multi-page output |
| Container | nginx:1.27-alpine (pinned) | Minimal image to serve static files |
| CI/CD | GitHub Actions | PR validation + image publish on merge/tag |

> **Note:** All CDN libraries are loaded with pinned major.minor versions to prevent breaking changes.

### UX principles

**Language: German**

The entire UI is in German from the start. All labels, buttons, placeholders, tooltips, and error messages use German text. There is no language switcher — German is the only language.

**Ease of use: sensible defaults**

The app should be usable immediately after adding images, with zero configuration required. Every setting has a sensible default so the user can go straight from "add images" to "export" without touching anything else.

| Setting | Default | Rationale |
|---|---|---|
| Grid columns | 2 | Good balance between detail and overview |
| Title | _(empty / hidden)_ | Title row is not rendered unless the user types one |
| Subtext | _(empty / hidden)_ | Subtext row is not rendered unless the user types one |
| JPG quality | 0.92 | High quality without excessive file size |
| html2canvas scale | 2 (192 DPI) | Crisp output for print |

If title and subtext are both empty for an image, the cell shows only the image — no blank space is reserved for the labels. This means the default experience (no labels) maximizes image size.

---

### Design decisions

**Layout: side-by-side editor + preview**

The UI uses a two-panel layout: editor on the left, live A4 preview on the right. On narrow viewports (< 900px), the panels stack vertically with a toggle to switch between editor ("Editor") and preview ("Vorschau").

```
┌──────────────────────────────┬──────────────────────────────┐
│  EDITOR                      │  VORSCHAU                    │
│                              │                              │
│  [+ Bilder hinzufügen]  [Alle│  ┌────────────────────────┐  │
│   entfernen]                 │  │  Seite 1               │  │
│  Spalten: [1] [2] [3]       │  │  ┌──────┐ ┌──────┐     │  │
│                              │  │  │Titel │ │Titel │     │  │
│  ┌────────────────────────┐  │  │  │ Bild │ │ Bild │     │  │
│  │ Bild-1 Vorschau        │  │  │  │Unter │ │Unter │     │  │
│  │ [Titel________]        │  │  │  └──────┘ └──────┘     │  │
│  │ [Untertext____]        │  │  │  ┌──────┐ ┌──────┐     │  │
│  │               [x]      │  │  │  │Titel │ │Titel │     │  │
│  └────────────────────────┘  │  │  │ Bild │ │ Bild │     │  │
│  ┌────────────────────────┐  │  │  │Unter │ │Unter │     │  │
│  │ Bild-2 Vorschau        │  │  │  └──────┘ └──────┘     │  │
│  │ [Titel________]        │  │  └────────────────────────┘  │
│  │ [Untertext____]        │  │  ┌────────────────────────┐  │
│  │               [x]      │  │  │  Seite 2               │  │
│  └────────────────────────┘  │  │  ...                    │  │
│  ...                         │  └────────────────────────┘  │
├──────────────────────────────┴──────────────────────────────┤
│  [PDF exportieren]  [JPG exportieren]                       │
└─────────────────────────────────────────────────────────────┘
```

**Grid column control**

The user selects 1, 2, or 3 columns via toggle buttons in the toolbar. Default: 2 columns. This avoids guessing logic and gives the user full control.

**Multi-page handling**

When images exceed the capacity of a single A4 page, a new page is created automatically. The preview panel renders each page as a separate A4 div stacked vertically. Capacity per page depends on column count, image aspect ratios, and whether titles/subtexts are present. The layout engine calculates remaining vertical space and breaks to a new page when the next image cell would overflow.

- **PDF export**: each page becomes a separate PDF page via `jsPDF.addPage()`
- **JPG export**: each page is rendered as a separate JPG; if there are multiple pages, all JPGs are bundled into a zip file using JSZip and downloaded as `bilder-YYYY-MM-DD.zip`. If there's only one page, the JPG is downloaded directly.

**Image handling**

- Images are loaded using `URL.createObjectURL()` (no base64 encoding, lower memory footprint)
- Images exceeding 10 MB are rejected with a user-visible warning
- Supported formats: JPEG, PNG, GIF, WebP. Note: TIFF and HEIC are not reliably supported by html2canvas and should be listed as unsupported in the UI.
- Adding more images later appends to the existing set

**UI strings reference (German)**

All user-visible text in one place for consistency during implementation:

| Key | Text |
|---|---|
| page_title | Bilder-Drucker |
| add_images | Bilder hinzufügen |
| clear_all | Alle entfernen |
| columns_label | Spalten |
| title_placeholder | Titel |
| subtext_placeholder | Untertext |
| drop_zone | Bilder hierher ziehen oder klicken |
| export_pdf | PDF exportieren |
| export_jpg | JPG exportieren |
| exporting | Wird exportiert... |
| error_file_too_large | Datei zu groß (max. 10 MB) |
| error_unsupported_format | Format nicht unterstützt (JPEG, PNG, GIF, WebP) |
| page_label | Seite {n} |

---

### Phase 1 — Project scaffolding, Docker & CI/CD

- [ ] Create `src/` directory with `index.html` (`<html lang="de">`), `style.css`, `app.js`
- [ ] Add `.eslintrc.json` with a minimal config for vanilla JS (browser globals)
- [ ] Add `.dockerignore`
- [ ] Add `Dockerfile`:
  ```dockerfile
  FROM nginx:1.27-alpine
  COPY src/ /usr/share/nginx/html
  ```
- [ ] Add `.github/workflows/validate.yml` — triggered on PRs targeting `main`:
  1. Checkout code
  2. `docker build .` — fails the check if the build breaks
  3. Run `npx html-validate src/index.html`
  4. Run `npx eslint src/app.js`
- [ ] Add `.github/workflows/publish.yml` — triggered on push to `main` or tag `v*`:
  1. Checkout code
  2. Log in to GHCR (`ghcr.io`) using `GITHUB_TOKEN`
  3. Build and push image with tags:
     - `ghcr.io/mstroppel/simple-local-image-printer:latest` (on `main`)
     - `ghcr.io/mstroppel/simple-local-image-printer:vX.Y.Z` (on version tag)

---

### Phase 2 — Core UI

- [ ] **Two-panel layout**: editor panel on the left, preview panel on the right. On viewports < 900px, stack vertically with a toggle between "Editor" and "Vorschau"
- [ ] **Empty state**: before any images are added, show a drop zone / prompt ("Bilder hierher ziehen oder klicken")
- [ ] File input (accepts multiple images, `accept="image/jpeg,image/png,image/gif,image/webp"`)
- [ ] **Drag-and-drop file upload**: handle `dragover`/`drop` events on the drop zone to accept dropped image files (separate from SortableJS reordering)
- [ ] File size validation: reject files > 10 MB with inline error message ("Datei zu groß (max. 10 MB)")
- [ ] Image card component: thumbnail, editable title input (placeholder: "Titel"), editable subtext input (placeholder: "Untertext"), remove button
- [ ] Drag-and-drop reordering of cards using SortableJS
- [ ] **Column selector**: toggle buttons for 1 / 2 / 3 columns (label: "Spalten", default: 2)
- [ ] **Clear all** button ("Alle entfernen"): removes all images and resets the editor
- [ ] Adding more images appends to the existing set

---

### Phase 3 — A4 layout & rendering

The A4 preview is a `div` styled at `794px x 1123px` (96 DPI equivalent of 210 x 297 mm).

**Page dimensions and spacing:**

| Property | Value |
|---|---|
| Page size | 794 x 1123 px |
| Page margins | 20 mm (76 px) on all sides |
| Usable content area | 642 x 971 px |
| Cell gap | 8 px horizontal, 12 px vertical |
| Cell padding | 4 px |
| Max image height (1 col) | 800 px | Images scale down with `object-fit: contain` within this limit |
| Max image height (2 col) | 380 px | |
| Max image height (3 col) | 240 px | |

**Typography:**

| Element | Style |
|---|---|
| Title | `font-family: sans-serif; font-size: 14px; font-weight: 700; text-align: center;` max 2 lines, overflow hidden with ellipsis |
| Subtext | `font-family: sans-serif; font-size: 11px; font-weight: 400; text-align: center;` max 2 lines, overflow hidden with ellipsis |

**Layout tasks:**

- [ ] CSS grid layout with user-selected column count (1, 2, or 3)
- [ ] Each cell: bold title (`<strong>`) above image, subtext below image, centered
- [ ] Images scale to fill their cell while preserving aspect ratio (`object-fit: contain`)
- [ ] **Page break logic**: use a JS-driven layout that places cells sequentially, tracking the current Y offset. When the next cell (image height + title + subtext + gap) would exceed the usable content height (971 px), create a new A4 page div and reset Y to 0. Do not rely on CSS overflow detection — calculate placement explicitly.
- [ ] Render multiple A4 page divs stacked vertically in the preview panel
- [ ] Print-friendly CSS (`@media print`) as a fallback

---

### Phase 4 — Export

- [ ] **Export PDF** ("PDF exportieren"): render each A4 page div with html2canvas (`scale: 2` for 192 DPI output), add each canvas to a jsPDF document as a separate page at A4 dimensions, trigger download as `bilder-YYYY-MM-DD.pdf`
- [ ] **Export JPG** ("JPG exportieren"): render each A4 page div with html2canvas (`scale: 2`), call `canvas.toDataURL('image/jpeg', 0.92)`. If single page, download directly as `seite-1.jpg`. If multiple pages, bundle all JPGs into a zip using JSZip and download as `bilder-YYYY-MM-DD.zip`.
- [ ] Show a loading spinner / progress indicator during export ("Wird exportiert...")

> **Risk:** html2canvas has known issues rendering CSS grid layouts. Test export early in development. If grid rendering is broken, use absolute positioning or flexbox for the A4 page divs targeted by html2canvas, even if the live preview uses CSS grid.

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
├── .eslintrc.json
├── Dockerfile
├── .dockerignore
├── LICENSE
└── README.md
```

---

## License

MIT — see [LICENSE](LICENSE).
