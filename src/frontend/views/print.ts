import type { PriceBand, QuickQuoteData } from '../types';
import { PRODUCTS } from '../data/catalog';
import {
  fmtBand,
  fmtCurrency,
  getGrandTotal,
  getItemQuantity,
  getItemSubtotal,
  getUnitPrice,
} from '../core/calculator';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, m - 1, d + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function generatePrintHTML(data: QuickQuoteData, band: PriceBand, logoUrl: string): string {
  const activeItems = data.items.filter(i => i.productId && i.color && getItemQuantity(i) > 0);
  const totalQty = activeItems.reduce((s, i) => s + getItemQuantity(i), 0);
  const grandTotal = getGrandTotal(activeItems, band);
  const validUntil = fmtDate(addDays(data.date, 7));

  const detailSections = activeItems
    .map((item, idx) => {
      const product = PRODUCTS.find(p => p.id === item.productId)!;
      const effectiveBand = item.specialBand ?? band;
      const itemQty = getItemQuantity(item);
      const itemSubtotal = getItemSubtotal(item, band);

      const extra = item.extra ?? 0;
      const sizeRows = Object.entries(item.quantities)
        .filter(([, q]) => q > 0)
        .map(([size, qty]) => {
          const unit = getUnitPrice(product, size, effectiveBand) + extra;
          return `<tr>
          <td>${size}</td>
          <td class="num">${qty}</td>
          <td class="num">${fmtCurrency(unit)}</td>
          <td class="num">${fmtCurrency(unit * qty)}</td>
        </tr>`;
        })
        .join('');

      const noteRow = product.note
        ? `<tr class="note-row"><td colspan="4">${esc(product.note)}</td></tr>`
        : '';

      const specialNote = item.specialBand ? ` &nbsp;·&nbsp; <em>condição especial</em>` : '';

      return `
    <div class="product-block">
      <div class="product-header">
        <span class="product-index">${String(idx + 1).padStart(2, '0')}</span>
        <div class="product-info">
          <span class="product-name">${esc(product.name)}</span>
          <span class="product-meta">Cor: ${esc(item.color)} &nbsp;·&nbsp; ${itemQty} ${itemQty === 1 ? 'peça' : 'peças'} &nbsp;·&nbsp; Faixa ${fmtBand(effectiveBand)}${extra > 0 ? ` &nbsp;·&nbsp; +${fmtCurrency(extra)}/peça` : ''}${specialNote}</span>
        </div>
        <span class="product-subtotal">${fmtCurrency(itemSubtotal)}</span>
      </div>
      <table>
        <thead>
          <tr><th>Tamanho</th><th class="num">Qtd</th><th class="num">Unit.</th><th class="num">Subtotal</th></tr>
        </thead>
        <tbody>
          ${sizeRows}
          ${noteRow}
        </tbody>
      </table>
    </div>`;
    })
    .join('');

  const summaryRows = activeItems
    .map(item => {
      const product = PRODUCTS.find(p => p.id === item.productId)!;
      const effectiveBand = item.specialBand ?? band;
      const quantity = getItemQuantity(item);
      const sub = getItemSubtotal(item, band);
      const itemExtra = item.extra ?? 0;
      const extraNote =
        itemExtra > 0
          ? `<tr class="note-row"><td colspan="5">+ ${fmtCurrency(itemExtra)}/peça (adicional)</td></tr>`
          : '';
      const specialNote = item.specialBand
        ? `<tr class="note-row"><td colspan="5"><em>Condição especial — faixa ${fmtBand(item.specialBand)}</em></td></tr>`
        : '';
      return `<tr>
      <td>${esc(product.name)}</td>
      <td>${esc(item.color)}</td>
      <td class="num">${quantity}</td>
      <td class="num">${fmtCurrency(product.prices[effectiveBand] + itemExtra)}</td>
      <td class="num">${fmtCurrency(sub)}</td>
    </tr>${extraNote}${specialNote}`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Orçamento ${esc(data.number)} — ${esc(data.clientName)}</title>
<style>
  /* ── PAGE ──────────────────────────────── */
  @page { size: A4 portrait; margin: 0; }
  /* First page: no top margin — repeat header overlaps doc-header (both #111, invisible) */

  /* ── SCREEN VIEW ───────────────────────── */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-size: 10pt;
    color: #111;
    -webkit-font-smoothing: antialiased;
  }

  /* ── PRINT LAYOUT TABLE ─────────────────── */
  /* thead repeats natively on every printed page; tbody holds all content.
     On screen: thead is hidden, tbody renders as block. */
  .plt { width: 100%; border-collapse: collapse; }
  .plt > thead > tr > td,
  .plt > tbody > tr > td { padding: 0; vertical-align: top; border: none; }

  @media screen {
    .plt,
    .plt > tbody,
    .plt > tbody > tr,
    .plt > tbody > tr > td { display: block; }
    .plt > thead { display: none; }
  }

  /* ── REPEAT PAGE HEADER ─────────────────── */
  /* .phr-wrapper controls total thead height: 1.3cm bar + 0.4cm gap below it on pages 2+ */
  .phr-wrapper { height: 1.7cm; }

  .page-header-repeat {
    display: flex;
    height: 1.3cm;
    background: #111;
    color: #fff;
    align-items: center;
    justify-content: space-between;
    padding: 0 1.4cm;
  }

  /* ── REPEAT HEADER INTERNALS ────────────── */
  .phr-left { display: flex; align-items: center; gap: 0.45cm; }

  .phr-logo {
    height: 26px;
    width: 26px;
    object-fit: contain;
    filter: brightness(0) invert(1);
    flex-shrink: 0;
  }

  .phr-divider {
    width: 1px;
    height: 18px;
    background: rgba(255,255,255,0.2);
    flex-shrink: 0;
  }

  .phr-name {
    display: block;
    font-size: 8.5pt;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    line-height: 1.1;
  }

  .phr-sub {
    display: block;
    font-size: 5.5pt;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    opacity: 0.4;
  }

  .phr-docref {
    font-size: 7pt;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    opacity: 0.5;
  }

  /* ── SCREEN VIEW ───────────────────────── */
  @media screen {
    body { background: #d0d0d0; padding: 32px 24px 60px; }

    .screen-toolbar {
      max-width: 21cm;
      margin: 0 auto 14px;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    .doc-page {
      max-width: 21cm;
      margin: 0 auto;
      background: #fff;
      box-shadow: 0 8px 48px rgba(0,0,0,0.25);
      border-radius: 3px;
      overflow: hidden;
    }
  }

  @media print {
    body { background: #fff; }
    .doc-page { width: 100%; }
    .screen-toolbar { display: none !important; }
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* Pull doc-header up to cover the compact header on page 1.
       position:relative + z-index ensure it paints above the thead (which normally
       paints last in the table paint order). Both share #111 so they merge invisibly.
       The -1.7cm matches .phr-wrapper height (1.3cm bar + 0.4cm gap). */
    .doc-header {
      margin-top: -1.7cm;
      position: relative;
      z-index: 9999;
    }
  }

  /* ── TOOLBAR BUTTONS ────────────────────── */
  .toolbar-btn {
    padding: 10px 22px;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    letter-spacing: 0.03em;
    transition: opacity 0.15s;
  }

  .toolbar-btn-primary {
    background: #111;
    color: #fff;
    box-shadow: 0 2px 12px rgba(0,0,0,0.3);
  }

  .toolbar-btn-ghost {
    background: rgba(255,255,255,0.7);
    color: #111;
    box-shadow: 0 1px 4px rgba(0,0,0,0.15);
  }

  .toolbar-btn:hover { opacity: 0.75; }

  /* ── HEADER ─────────────────────────────── */
  .doc-header {
    background: #111;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1cm 1.4cm;
    border-bottom: 3px solid #fff;
    gap: 1cm;
  }

  .doc-header-left { display: flex; align-items: center; gap: 0.7cm; }

  .doc-logo {
    height: 72px;
    width: 72px;
    object-fit: contain;
    filter: brightness(0) invert(1);
    flex-shrink: 0;
  }

  .doc-company { display: flex; flex-direction: column; gap: 4px; }

  .doc-company-name {
    font-size: 15pt;
    font-weight: 900;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    line-height: 1;
  }

  .doc-company-sub {
    font-size: 7.5pt;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    opacity: 0.45;
    font-weight: 500;
  }

  .doc-header-divider {
    width: 1px;
    height: 48px;
    background: rgba(255,255,255,0.15);
    flex-shrink: 0;
  }

  .doc-header-right { text-align: right; flex-shrink: 0; }

  .doc-type {
    display: block;
    font-size: 22pt;
    font-weight: 900;
    letter-spacing: 0.1em;
    line-height: 1;
    text-transform: uppercase;
  }

  .doc-number {
    display: block;
    font-size: 7.5pt;
    opacity: 0.4;
    letter-spacing: 0.2em;
    margin-top: 6px;
    text-transform: uppercase;
  }

  /* ── BODY ───────────────────────────────── */
  .doc-body { padding: 1.1cm 1.4cm 1.4cm; }

  /* ── META GRID ──────────────────────────── */
  .doc-meta {
    display: grid;
    grid-template-columns: 1.5fr 1fr 1fr 1fr;
    border: 1.5px solid #111;
    margin-bottom: 1cm;
  }

  .meta-item {
    padding: 0.45cm 0.6cm;
    border-right: 1.5px solid #111;
  }
  .meta-item:last-child { border-right: none; }

  .meta-label {
    display: block;
    font-size: 6.5pt;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #999;
    margin-bottom: 4px;
  }

  .meta-value {
    display: block;
    font-size: 10.5pt;
    font-weight: 700;
    color: #111;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ── PRODUCT BLOCKS ─────────────────────── */
  .product-block {
    margin-bottom: 0.9cm;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .product-header {
    display: flex;
    align-items: baseline;
    gap: 0.4cm;
    padding-bottom: 0.3cm;
    border-bottom: 1.5px solid #111;
    margin-bottom: 0;
  }

  .product-index {
    font-size: 20pt;
    font-weight: 900;
    color: #ddd;
    line-height: 1;
    flex-shrink: 0;
    letter-spacing: -0.02em;
  }

  .product-info { flex: 1; }

  .product-name {
    display: block;
    font-size: 12pt;
    font-weight: 800;
    color: #111;
    line-height: 1.2;
  }

  .product-meta {
    display: block;
    font-size: 8pt;
    color: #777;
    margin-top: 2px;
  }

  .product-subtotal {
    font-size: 12pt;
    font-weight: 800;
    color: #111;
    flex-shrink: 0;
    letter-spacing: -0.01em;
  }

  /* ── TABLES (scoped to doc-body to not affect layout table) ── */
  .doc-body table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9pt;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .doc-body th {
    font-size: 6.5pt;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #999;
    padding: 7px 8px;
    border-bottom: 1px solid #ddd;
    text-align: left;
  }

  .doc-body td { padding: 6px 8px; border-bottom: 1px solid #f0f0f0; }

  .doc-body tr {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .doc-body td.num, .doc-body th.num { text-align: right; }

  .doc-body .note-row td {
    font-size: 7.5pt;
    color: #aaa;
    font-style: italic;
    border-bottom: none;
    padding-top: 2px;
  }

  /* ── SUMMARY SECTION ────────────────────── */
  .summary-section {
    padding-top: 0.5cm;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .summary-label {
    font-size: 18pt;
    font-weight: 900;
    letter-spacing: -0.01em;
    color: #111;
    display: block;
    margin-bottom: 0.4cm;
    padding-bottom: 0.35cm;
    border-bottom: 1.5px solid #111;
  }

  /* ── TOTAL BLOCK ────────────────────────── */
  .total-block {
    background: #111;
    color: #fff;
    padding: 0.7cm 1cm;
    margin-top: 0.5cm;
    display: flex;
    align-items: center;
    justify-content: space-between;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .total-left { display: flex; flex-direction: column; gap: 3px; }

  .total-label-text {
    font-size: 7pt;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    opacity: 0.4;
  }

  .total-qty-text {
    font-size: 9pt;
    opacity: 0.6;
  }

  .total-amount {
    font-size: 22pt;
    font-weight: 900;
    letter-spacing: -0.02em;
  }

  /* ── FOOTER ─────────────────────────────── */
  .doc-footer {
    margin-top: 0.8cm;
    padding-top: 0.4cm;
    border-top: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    font-size: 7.5pt;
    color: #bbb;
  }
</style>
</head>
<body>

<table class="plt">
  <thead>
    <tr><td>
      <!-- phr-wrapper: 1.3cm black bar + 0.4cm transparent gap below it on pages 2+ -->
      <div class="phr-wrapper">
        <div class="page-header-repeat">
          <div class="phr-left">
            <img src="${logoUrl}" class="phr-logo" alt="Umbrella Custom">
            <div class="phr-divider"></div>
            <div>
              <span class="phr-name">Umbrella Custom</span>
              <span class="phr-sub">Camisetas Personalizadas</span>
            </div>
          </div>
          <span class="phr-docref">Orçamento &nbsp;·&nbsp; ${esc(data.number)}</span>
        </div>
      </div>
    </td></tr>
  </thead>
  <tbody>
    <tr><td>

      <div class="screen-toolbar">
        <button class="toolbar-btn toolbar-btn-ghost" onclick="window.close()">✕ Fechar</button>
        <button class="toolbar-btn toolbar-btn-primary" onclick="window.print()">⬇ Salvar / Imprimir PDF</button>
      </div>

      <div class="doc-page">

        <header class="doc-header">
          <div class="doc-header-left">
            <img src="${logoUrl}" class="doc-logo" alt="Umbrella Custom">
            <div class="doc-header-divider"></div>
            <div class="doc-company">
              <span class="doc-company-name">Umbrella Custom</span>
              <span class="doc-company-sub">Camisetas Personalizadas</span>
            </div>
          </div>
          <div class="doc-header-right">
            <span class="doc-type">Orçamento</span>
            <span class="doc-number">${esc(data.number)}</span>
          </div>
        </header>

        <div class="doc-body">

          <!-- META GRID -->
          <div class="doc-meta">
            <div class="meta-item">
              <span class="meta-label">Cliente</span>
              <span class="meta-value">${esc(data.clientName)}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Data</span>
              <span class="meta-value">${fmtDate(data.date)}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Faixa · Peças</span>
              <span class="meta-value">${fmtBand(band)} · ${totalQty}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Válido até</span>
              <span class="meta-value">${validUntil}</span>
            </div>
          </div>

          <!-- DETAIL -->
          ${detailSections}

          <!-- SUMMARY -->
          <div class="summary-section">
            <span class="summary-label">Resumo do Pedido</span>

            <table>
              <thead>
                <tr>
                  <th>Modelagem</th><th>Cor</th>
                  <th class="num">Qtd</th><th class="num">Unit.</th><th class="num">Subtotal</th>
                </tr>
              </thead>
              <tbody>${summaryRows}</tbody>
            </table>

            <!-- TOTAL -->
            <div class="total-block">
              <div class="total-left">
                <span class="total-label-text">Total Geral</span>
                <span class="total-qty-text">${totalQty} peças &nbsp;·&nbsp; faixa ${fmtBand(band)}</span>
              </div>
              <span class="total-amount">${fmtCurrency(grandTotal)}</span>
            </div>

            <div class="doc-footer">
              <span>Umbrella Custom — Catálogo 2026</span>
              <span>Orçamento válido até ${validUntil}</span>
            </div>
          </div>

        </div><!-- /doc-body -->
      </div><!-- /doc-page -->

    </td></tr>
  </tbody>
</table>

</body>
</html>`;
}
