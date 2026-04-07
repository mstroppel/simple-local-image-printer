/* eslint-env browser */
'use strict';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// A4 layout constants (pixels at 96 DPI)
const PAGE_W = 794;
const PAGE_H = 1123;
const MARGIN = 76; // 20 mm
const CONTENT_W = PAGE_W - 2 * MARGIN; // 642
const CONTENT_H = PAGE_H - 2 * MARGIN; // 971
const CELL_GAP_H = 8;
const CELL_GAP_V = 12;
const CELL_PAD = 4;
const TITLE_LINE_H = Math.ceil(14 * 1.3); // ~19 px
const TITLE_MAX_LINES = 2;
const SUBTEXT_LINE_H = Math.ceil(11 * 1.3); // ~15 px
const SUBTEXT_MAX_LINES = 2;
const TITLE_MARGIN_B = 3;
const SUBTEXT_MARGIN_T = 3;

/** Max image heights per column count */
const MAX_IMG_H = { 1: 800, 2: 380, 3: 240 };

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/** @type {{ id: string, url: string, title: string, subtext: string, naturalW: number, naturalH: number }[]} */
let images = [];
let columns = 2;

// ---------------------------------------------------------------------------
// DOM references
// ---------------------------------------------------------------------------

const fileInput = document.getElementById('file-input');
const btnAddImages = document.getElementById('btn-add-images');
const btnClearAll = document.getElementById('btn-clear-all');
const btnExportPdf = document.getElementById('btn-export-pdf');
const btnExportJpg = document.getElementById('btn-export-jpg');
const dropZone = document.getElementById('drop-zone');
const dropZoneText = document.getElementById('drop-zone-text');
const errorContainer = document.getElementById('error-container');
const cardList = document.getElementById('card-list');
const previewPages = document.getElementById('preview-pages');
const exportOverlay = document.getElementById('export-overlay');
const exportOverlayText = document.getElementById('export-overlay-text');
const colButtons = document.querySelectorAll('.btn-col');
const tabButtons = document.querySelectorAll('.tab-btn');
const panelEditor = document.getElementById('panel-editor');
const panelPreview = document.getElementById('panel-preview');

// ---------------------------------------------------------------------------
// i18n bootstrap
// ---------------------------------------------------------------------------

function applyI18n() {
  document.documentElement.lang = lang;
  document.title = t('page_title');
  btnAddImages.textContent = t('add_images');
  btnClearAll.textContent = t('clear_all');
  btnExportPdf.textContent = t('export_pdf');
  btnExportJpg.textContent = t('export_jpg');
  dropZoneText.textContent = t('drop_zone');
  exportOverlayText.textContent = t('exporting');
  document.getElementById('columns-label').textContent = t('columns_label') + ':';
  tabButtons.forEach(function (btn) {
    btn.textContent = t(btn.dataset.panel === 'editor' ? 'editor_tab' : 'preview_tab');
  });
}

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

function showError(msg) {
  const el = document.createElement('div');
  el.className = 'error-message';
  el.innerHTML =
    '<span>' +
    escapeHtml(msg) +
    '</span><button type="button" aria-label="Dismiss">&times;</button>';
  el.querySelector('button').addEventListener('click', function () {
    el.remove();
  });
  errorContainer.appendChild(el);
  // Auto-remove after 6 s
  setTimeout(function () {
    if (el.parentNode) {
      el.remove();
    }
  }, 6000);
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// File handling
// ---------------------------------------------------------------------------

function handleFiles(files) {
  Array.from(files).forEach(function (file) {
    if (!ACCEPTED_MIME.includes(file.type)) {
      showError(file.name + ': ' + t('error_unsupported_format'));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      showError(file.name + ': ' + t('error_file_too_large'));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = function () {
      const entry = {
        id: 'img-' + Date.now() + '-' + Math.random().toString(36).slice(2),
        url: url,
        title: '',
        subtext: '',
        naturalW: img.naturalWidth,
        naturalH: img.naturalHeight,
      };
      images.push(entry);
      renderCard(entry);
      renderPreview();
      updateDropZoneVisibility();
    };
    img.src = url;
  });
  // Reset so same files can be re-added after removal
  fileInput.value = '';
}

// ---------------------------------------------------------------------------
// Card rendering
// ---------------------------------------------------------------------------

function renderCard(entry) {
  const card = document.createElement('div');
  card.className = 'image-card';
  card.dataset.id = entry.id;

  const thumb = document.createElement('img');
  thumb.className = 'card-thumbnail';
  thumb.src = entry.url;
  thumb.alt = '';

  const fields = document.createElement('div');
  fields.className = 'card-fields';

  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.placeholder = t('title_placeholder');
  titleInput.value = entry.title;
  titleInput.addEventListener('input', function () {
    entry.title = titleInput.value;
    renderPreview();
  });

  const subtextInput = document.createElement('input');
  subtextInput.type = 'text';
  subtextInput.placeholder = t('subtext_placeholder');
  subtextInput.value = entry.subtext;
  subtextInput.addEventListener('input', function () {
    entry.subtext = subtextInput.value;
    renderPreview();
  });

  fields.appendChild(titleInput);
  fields.appendChild(subtextInput);

  const removeBtn = document.createElement('button');
  removeBtn.className = 'card-remove';
  removeBtn.type = 'button';
  removeBtn.textContent = '\u00d7'; // ×
  removeBtn.setAttribute('aria-label', 'Remove');
  removeBtn.addEventListener('click', function () {
    removeImage(entry.id);
  });

  card.appendChild(thumb);
  card.appendChild(fields);
  card.appendChild(removeBtn);
  cardList.appendChild(card);
}

function removeImage(id) {
  const idx = images.findIndex(function (img) {
    return img.id === id;
  });
  if (idx !== -1) {
    URL.revokeObjectURL(images[idx].url);
    images.splice(idx, 1);
  }
  const card = cardList.querySelector('[data-id="' + id + '"]');
  if (card) {
    card.remove();
  }
  renderPreview();
  updateDropZoneVisibility();
}

function clearAll() {
  images.forEach(function (img) {
    URL.revokeObjectURL(img.url);
  });
  images = [];
  cardList.innerHTML = '';
  renderPreview();
  updateDropZoneVisibility();
}

function updateDropZoneVisibility() {
  if (images.length === 0) {
    dropZone.classList.remove('hidden');
  } else {
    dropZone.classList.add('hidden');
  }
}

// ---------------------------------------------------------------------------
// SortableJS reordering
// ---------------------------------------------------------------------------

// eslint-disable-next-line no-undef
new Sortable(cardList, {
  animation: 150,
  ghostClass: 'sortable-ghost',
  chosenClass: 'sortable-chosen',
  onEnd: function (evt) {
    const movedItem = images.splice(evt.oldIndex, 1)[0];
    images.splice(evt.newIndex, 0, movedItem);
    renderPreview();
  },
});

// ---------------------------------------------------------------------------
// Column selector
// ---------------------------------------------------------------------------

colButtons.forEach(function (btn) {
  btn.addEventListener('click', function () {
    columns = parseInt(btn.dataset.cols, 10);
    colButtons.forEach(function (b) {
      b.classList.toggle('active', b === btn);
    });
    renderPreview();
  });
});

// ---------------------------------------------------------------------------
// A4 Preview rendering
// ---------------------------------------------------------------------------

/**
 * Computes the rendered height of a cell (excl. outer gap).
 * @param {Object} entry
 * @param {number} cellW  - available cell content width (after padding)
 * @returns {number}
 */
function cellHeight(entry, cellW) {
  let h = CELL_PAD * 2;

  // Title (only if non-empty)
  if (entry.title && entry.title.trim()) {
    h += TITLE_LINE_H * TITLE_MAX_LINES + TITLE_MARGIN_B;
  }

  // Image
  const maxH = MAX_IMG_H[columns];
  const imgContentW = cellW - CELL_PAD * 2;
  const aspect = entry.naturalH / entry.naturalW;
  let imgH = imgContentW * aspect;
  if (imgH > maxH) imgH = maxH;
  h += imgH;

  // Subtext (only if non-empty)
  if (entry.subtext && entry.subtext.trim()) {
    h += SUBTEXT_MARGIN_T + SUBTEXT_LINE_H * SUBTEXT_MAX_LINES;
  }

  return h;
}

/**
 * Calculates cell width for a given column count.
 * @param {number} cols
 * @returns {number}
 */
function cellWidth(cols) {
  return (CONTENT_W - (cols - 1) * CELL_GAP_H) / cols;
}

/**
 * Creates and returns a new A4 page div (not yet appended).
 * @returns {{ pageDiv: HTMLElement, contentDiv: HTMLElement }}
 */
function createPageDiv(pageNumber) {
  const wrapper = document.createElement('div');
  wrapper.className = 'page-wrapper';

  const label = document.createElement('div');
  label.className = 'page-label';
  label.textContent = t('page_label', { n: pageNumber });

  const page = document.createElement('div');
  page.className = 'a4-page';

  const content = document.createElement('div');
  content.className = 'a4-content';
  page.appendChild(content);

  wrapper.appendChild(label);
  wrapper.appendChild(page);

  return { wrapper: wrapper, page: page, content: content };
}

/**
 * Re-renders all A4 preview pages from scratch.
 */
function renderPreview() {
  previewPages.innerHTML = '';

  if (images.length === 0) {
    return;
  }

  const cols = columns;
  const cW = cellWidth(cols);

  let pageNumber = 1;
  let currentPageData = createPageDiv(pageNumber);
  previewPages.appendChild(currentPageData.wrapper);

  let currentY = 0; // Y offset within content area
  let colIdx = 0;   // current column position (0-based)
  let rowY = currentY; // Y start of current row
  let rowMaxH = 0;  // max cell height in current row

  // We place cells row by row.
  // When a row would exceed the page, break to a new page.

  for (let i = 0; i < images.length; i++) {
    const entry = images[i];
    const cH = cellHeight(entry, cW);

    // If starting a new row, check if it fits on the current page
    if (colIdx === 0) {
      const neededH = cH + (currentY > 0 ? CELL_GAP_V : 0);
      if (currentY > 0 && currentY + (currentY > 0 ? CELL_GAP_V : 0) + cH > CONTENT_H) {
        // New page
        pageNumber++;
        currentPageData = createPageDiv(pageNumber);
        previewPages.appendChild(currentPageData.wrapper);
        currentY = 0;
      }
      rowY = currentY + (currentY > 0 ? CELL_GAP_V : 0);
      rowMaxH = 0;
    }

    // Place the cell
    const x = colIdx * (cW + CELL_GAP_H);
    const y = rowY;

    const cellDiv = document.createElement('div');
    cellDiv.className = 'a4-cell';
    cellDiv.style.left = x + 'px';
    cellDiv.style.top = y + 'px';
    cellDiv.style.width = cW + 'px';

    // Title
    if (entry.title && entry.title.trim()) {
      const titleEl = document.createElement('div');
      titleEl.className = 'a4-cell-title';
      titleEl.textContent = entry.title;
      cellDiv.appendChild(titleEl);
    }

    // Image
    const imgContentW = cW - CELL_PAD * 2;
    const maxH = MAX_IMG_H[cols];
    const aspect = entry.naturalH / entry.naturalW;
    let imgH = imgContentW * aspect;
    if (imgH > maxH) imgH = maxH;

    const imgEl = document.createElement('img');
    imgEl.className = 'a4-cell-img';
    imgEl.src = entry.url;
    imgEl.alt = entry.title || '';
    imgEl.style.height = Math.round(imgH) + 'px';
    cellDiv.appendChild(imgEl);

    // Subtext
    if (entry.subtext && entry.subtext.trim()) {
      const subtextEl = document.createElement('div');
      subtextEl.className = 'a4-cell-subtext';
      subtextEl.textContent = entry.subtext;
      cellDiv.appendChild(subtextEl);
    }

    currentPageData.content.appendChild(cellDiv);

    if (cH > rowMaxH) rowMaxH = cH;
    colIdx++;

    if (colIdx >= cols) {
      // Row complete
      currentY = rowY + rowMaxH;
      colIdx = 0;
    }
  }

  // Scale preview to fit panel
  scalePreview();
}

// ---------------------------------------------------------------------------
// Preview scaling
// ---------------------------------------------------------------------------

function scalePreview() {
  const panelW = panelPreview.clientWidth - 32; // 16px padding each side
  const scale = Math.min(1, panelW / PAGE_W);
  document.querySelectorAll('.a4-page').forEach(function (page) {
    page.style.transform = 'scale(' + scale + ')';
    page.style.marginBottom = (PAGE_H * scale - PAGE_H) + 'px';
  });
}

window.addEventListener('resize', scalePreview);

// ---------------------------------------------------------------------------
// Mobile tab switching
// ---------------------------------------------------------------------------

tabButtons.forEach(function (btn) {
  btn.addEventListener('click', function () {
    tabButtons.forEach(function (b) {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');

    const target = btn.dataset.panel;
    if (target === 'editor') {
      panelEditor.classList.remove('hidden-mobile');
      panelPreview.classList.add('hidden-mobile');
    } else {
      panelEditor.classList.add('hidden-mobile');
      panelPreview.classList.remove('hidden-mobile');
      scalePreview();
    }
  });
});

// ---------------------------------------------------------------------------
// Drop zone events
// ---------------------------------------------------------------------------

dropZone.addEventListener('click', function () {
  fileInput.click();
});

dropZone.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' || e.key === ' ') {
    fileInput.click();
  }
});

// Drag-and-drop on the whole editor panel
panelEditor.addEventListener('dragover', function (e) {
  e.preventDefault();
  dropZone.classList.add('drag-over');
  dropZone.classList.remove('hidden');
});

panelEditor.addEventListener('dragleave', function (e) {
  if (!panelEditor.contains(e.relatedTarget)) {
    dropZone.classList.remove('drag-over');
    updateDropZoneVisibility();
  }
});

panelEditor.addEventListener('drop', function (e) {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  updateDropZoneVisibility();
  const files = e.dataTransfer && e.dataTransfer.files;
  if (files && files.length) {
    handleFiles(files);
  }
});

// ---------------------------------------------------------------------------
// Toolbar events
// ---------------------------------------------------------------------------

btnAddImages.addEventListener('click', function () {
  fileInput.click();
});

fileInput.addEventListener('change', function () {
  handleFiles(fileInput.files);
});

btnClearAll.addEventListener('click', clearAll);

// ---------------------------------------------------------------------------
// Export helpers
// ---------------------------------------------------------------------------

function dateStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

function showExportOverlay() {
  exportOverlayText.textContent = t('exporting');
  exportOverlay.classList.remove('hidden');
}

function hideExportOverlay() {
  exportOverlay.classList.add('hidden');
}

function getPageDivs() {
  return Array.from(document.querySelectorAll('.a4-page'));
}

/**
 * Temporarily resets transform for html2canvas capture, then restores.
 */
function capturePageCanvas(pageDiv) {
  return new Promise(function (resolve) {
    const origTransform = pageDiv.style.transform;
    const origMarginBottom = pageDiv.style.marginBottom;
    pageDiv.style.transform = 'none';
    pageDiv.style.marginBottom = '0';

    // eslint-disable-next-line no-undef
    html2canvas(pageDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      width: PAGE_W,
      height: PAGE_H,
      windowWidth: PAGE_W,
      windowHeight: PAGE_H,
    }).then(function (canvas) {
      pageDiv.style.transform = origTransform;
      pageDiv.style.marginBottom = origMarginBottom;
      resolve(canvas);
    });
  });
}

// ---------------------------------------------------------------------------
// Export PDF
// ---------------------------------------------------------------------------

async function exportPdf() {
  if (images.length === 0) return;
  showExportOverlay();

  // Small delay so overlay is painted
  await new Promise(function (r) { setTimeout(r, 50); });

  try {
    const pageDivs = getPageDivs();
    // eslint-disable-next-line no-undef
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [PAGE_W, PAGE_H] });

    for (let i = 0; i < pageDivs.length; i++) {
      if (i > 0) pdf.addPage([PAGE_W, PAGE_H], 'portrait');
      const canvas = await capturePageCanvas(pageDivs[i]);
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', 0, 0, PAGE_W, PAGE_H, '', 'FAST');
    }

    pdf.save('images-' + dateStr() + '.pdf');
  } finally {
    hideExportOverlay();
  }
}

// ---------------------------------------------------------------------------
// Export JPG / ZIP
// ---------------------------------------------------------------------------

async function exportJpg() {
  if (images.length === 0) return;
  showExportOverlay();

  await new Promise(function (r) { setTimeout(r, 50); });

  try {
    const pageDivs = getPageDivs();

    if (pageDivs.length === 1) {
      const canvas = await capturePageCanvas(pageDivs[0]);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      downloadDataUrl(dataUrl, 'page-1.jpg');
    } else {
      // eslint-disable-next-line no-undef
      const zip = new JSZip();
      for (let i = 0; i < pageDivs.length; i++) {
        const canvas = await capturePageCanvas(pageDivs[i]);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        const base64 = dataUrl.split(',')[1];
        zip.file('page-' + (i + 1) + '.jpg', base64, { base64: true });
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(blob, 'images-' + dateStr() + '.zip');
    }
  } finally {
    hideExportOverlay();
  }
}

function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
}

// ---------------------------------------------------------------------------
// Export button events
// ---------------------------------------------------------------------------

btnExportPdf.addEventListener('click', exportPdf);
btnExportJpg.addEventListener('click', exportJpg);

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

applyI18n();
updateDropZoneVisibility();
renderPreview();
