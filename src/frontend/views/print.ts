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

export function generatePrintHTML(data: QuickQuoteData, band: PriceBand, logoUrl: string): string {
  const activeItems = data.items.filter(i => i.productId && i.color && getItemQuantity(i) > 0);
  const totalQty = activeItems.reduce((s, i) => s + getItemQuantity(i), 0);
  const grandTotal = getGrandTotal(activeItems, band);

  const detailSections = activeItems
    .map((item, idx) => {
      const product = PRODUCTS.find(p => p.id === item.productId)!;
      const itemQty = getItemQuantity(item);
      const itemSubtotal = getItemSubtotal(item, band);

      const sizeRows = Object.entries(item.quantities)
        .filter(([, q]) => q > 0)
        .map(([size, qty]) => {
          const unit = getUnitPrice(product, size, band);
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

      return `
    <div class="product-block">
      <div class="product-header">
        <span class="product-index">${String(idx + 1).padStart(2, '0')}</span>
        <div class="product-info">
          <span class="product-name">${esc(product.name)}</span>
          <span class="product-meta">Cor: ${esc(item.color)} &nbsp;·&nbsp; ${itemQty} ${itemQty === 1 ? 'peça' : 'peças'} &nbsp;·&nbsp; Faixa ${fmtBand(band)}</span>
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
      const quantity = getItemQuantity(item);
      const sub = getItemSubtotal(item, band);
      return `<tr>
      <td>${esc(product.name)}</td>
      <td>${esc(item.color)}</td>
      <td class="num">${quantity}</td>
      <td class="num">${fmtCurrency(product.prices[band])}</td>
      <td class="num">${fmtCurrency(sub)}</td>
    </tr>`;
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

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-size: 10pt;
    color: #111;
    -webkit-font-smoothing: antialiased;
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
    /* Força o browser a imprimir cores de fundo (header, total block, etc.) */
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
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
    padding: 0.9cm 1.4cm;
    border-bottom: 3px solid #fff;
    gap: 1cm;
  }

  .doc-header-left { display: flex; align-items: center; gap: 0.7cm; }

  .doc-logo {
    height: 56px;
    width: 56px;
    object-fit: contain;
    filter: brightness(0) invert(1);
    flex-shrink: 0;
  }

  .doc-company { display: flex; flex-direction: column; gap: 3px; }

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
    height: 40px;
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
    grid-template-columns: 2fr 1fr 1fr;
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
  .product-block { margin-bottom: 0.9cm; break-inside: avoid; }

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

  /* ── TABLES ─────────────────────────────── */
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9pt;
  }

  th {
    font-size: 6.5pt;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #999;
    padding: 7px 8px;
    border-bottom: 1px solid #ddd;
    text-align: left;
  }

  td { padding: 6px 8px; border-bottom: 1px solid #f0f0f0; }

  td.num, th.num { text-align: right; }

  .note-row td {
    font-size: 7.5pt;
    color: #aaa;
    font-style: italic;
    border-bottom: none;
    padding-top: 2px;
  }

  /* ── SUMMARY SECTION ────────────────────── */
  .summary-section { break-before: page; padding-top: 0.2cm; }

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

  /* ── NOTES ──────────────────────────────── */
  .notes-block {
    margin-top: 0.6cm;
    padding: 0.5cm 0.6cm;
    border-left: 3px solid #111;
    background: #fafafa;
    font-size: 9pt;
    line-height: 1.7;
    color: #333;
  }

  .notes-label {
    font-size: 6.5pt;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #999;
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

<div class="screen-toolbar">
  <button class="toolbar-btn toolbar-btn-ghost" onclick="window.close()">✕ Fechar</button>
  <button class="toolbar-btn toolbar-btn-primary" onclick="window.print()">⬇ Salvar / Imprimir PDF</button>
</div>

<div class="doc-page">

  <!-- HEADER -->
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
      </div>
    </div>

  </div><!-- /doc-body -->
</div><!-- /doc-page -->

</body>
</html>`;
}
