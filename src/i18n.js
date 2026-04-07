/* eslint-env browser */
'use strict';

const translations = {
  de: {
    page_title: 'Bilder-Drucker',
    add_images: 'Bilder hinzufügen',
    clear_all: 'Alle entfernen',
    columns_label: 'Spalten',
    title_placeholder: 'Titel',
    subtext_placeholder: 'Untertext',
    drop_zone: 'Bilder hierher ziehen oder klicken',
    export_pdf: 'PDF exportieren',
    export_jpg: 'JPG exportieren',
    exporting: 'Wird exportiert...',
    error_file_too_large: 'Datei zu groß (max. 10 MB)',
    error_unsupported_format: 'Format nicht unterstützt (JPEG, PNG, GIF, WebP)',
    page_label: 'Seite {n}',
    editor_tab: 'Editor',
    preview_tab: 'Vorschau',
    orientation_label: 'Ausrichtung',
    portrait: 'Hochformat',
    landscape: 'Querformat',
  },
  en: {
    page_title: 'Image Printer',
    add_images: 'Add images',
    clear_all: 'Clear all',
    columns_label: 'Columns',
    title_placeholder: 'Title',
    subtext_placeholder: 'Subtext',
    drop_zone: 'Drag images here or click',
    export_pdf: 'Export PDF',
    export_jpg: 'Export JPG',
    exporting: 'Exporting...',
    error_file_too_large: 'File too large (max. 10 MB)',
    error_unsupported_format: 'Unsupported format (JPEG, PNG, GIF, WebP)',
    page_label: 'Page {n}',
    editor_tab: 'Editor',
    preview_tab: 'Preview',
    orientation_label: 'Orientation',
    portrait: 'Portrait',
    landscape: 'Landscape',
  },
};

const lang = navigator.language && navigator.language.startsWith('de') ? 'de' : 'en';

/**
 * Returns the translated string for the given key.
 * Supports {n} placeholder substitution via an optional params object.
 * @param {string} key
 * @param {Object} [params]
 * @returns {string}
 */
function t(key, params) {
  let str = (translations[lang] && translations[lang][key]) || translations['en'][key] || key;
  if (params) {
    Object.keys(params).forEach(function (k) {
      str = str.replace('{' + k + '}', params[k]);
    });
  }
  return str;
}
