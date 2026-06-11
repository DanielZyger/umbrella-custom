import type { QuoteItem } from '../types';
import { CATEGORIES, PRODUCTS } from '../data/catalog';
import {
  fmtBand,
  fmtCurrency,
  getItemQuantity,
  getItemSubtotal,
  getPriceBand,
  getTotalQuantity,
} from '../core/calculator';
import { getItems, pushNewItem, removeItem } from '../core/state';

function productOptionsHTML(selectedId: string): string {
  const grouped = CATEGORIES.map(cat => {
    const prods = PRODUCTS.filter(p => p.category === cat);
    const opts = prods
      .map(
        p => `<option value="${p.id}"${p.id === selectedId ? ' selected' : ''}>${p.name}</option>`,
      )
      .join('');
    return `<optgroup label="${cat}">${opts}</optgroup>`;
  }).join('');
  return `<option value="">Selecione o produto...</option>${grouped}`;
}

function renderItem(item: QuoteItem, index: number): string {
  const product = PRODUCTS.find(p => p.id === item.productId);

  const colorSection = product
    ? `
    <div class="field-group">
      <label>Cor *</label>
      <select data-action="color" data-item-id="${item.id}" class="select-input">
        <option value="">Selecione a cor...</option>
        ${product.colors
          .map(c => `<option value="${c}"${c === item.color ? ' selected' : ''}>${c}</option>`)
          .join('')}
      </select>
    </div>
    <div class="field-group field-sm">
      <label>Adicional/peça (R$)</label>
      <input type="number" min="0" step="0.50" placeholder="0,00"
        value="${item.extra > 0 ? item.extra : ''}"
        data-action="extra" data-item-id="${item.id}"
        class="qty-input">
    </div>`
    : '';

  const sizeSection =
    product && item.color
      ? `
    <div class="size-section">
      <p class="size-label">Quantidades por Tamanho</p>
      <div class="size-grid">
        ${product.sizes
          .map(
            size => `
          <div class="size-cell">
            <label class="size-tag">${size}</label>
            <input type="number" min="0" step="1"
              value="${item.quantities[size] || 0}"
              data-action="qty" data-item-id="${item.id}" data-size="${size}"
              class="qty-input">
          </div>`,
          )
          .join('')}
      </div>
      ${product.note ? `<p class="item-note">${product.note}</p>` : ''}
    </div>`
      : '';

  return `
  <div class="item-card" data-item-id="${item.id}">
    <div class="item-header">
      <span class="item-number">Produto ${index + 1}</span>
      <button type="button" data-action="remove" data-item-id="${item.id}" class="btn-remove" title="Remover">✕</button>
    </div>
    <div class="item-body">
      <div class="field-group">
        <label>Produto *</label>
        <select data-action="product" data-item-id="${item.id}" class="select-input">
          ${productOptionsHTML(item.productId)}
        </select>
      </div>
      ${colorSection}
      ${sizeSection}
    </div>
  </div>`;
}

export function renderItems(): void {
  const container = document.getElementById('items-list')!;
  const items = getItems();
  if (items.length === 0) {
    container.innerHTML = '<p class="empty-msg">Nenhum produto adicionado.</p>';
    return;
  }
  container.innerHTML = items.map((item, i) => renderItem(item, i)).join('');
}

export function updateSummary(): void {
  const items = getItems();
  const total = getTotalQuantity(items);
  const band = getPriceBand(total);

  document.getElementById('total-qty-display')!.textContent = String(total);

  const bandEl = document.getElementById('band-display')!;
  const genBtn = document.getElementById('generate-btn') as HTMLButtonElement;
  const bandSection = document.getElementById('band-section')!;

  if (total === 0) {
    bandSection.style.display = 'none';
    genBtn.disabled = true;
    return;
  }

  bandSection.style.display = '';

  if (band === null) {
    const missing = 25 - total;
    bandEl.textContent = `Mínimo não atingido — faltam ${missing} peça${missing !== 1 ? 's' : ''}`;
    bandEl.className = 'band-value band-warn';
    genBtn.disabled = true;
  } else {
    bandEl.textContent = `Faixa ${fmtBand(band)} peças`;
    bandEl.className = 'band-value band-ok';
    genBtn.disabled = false;

    items.forEach(item => {
      const qty = getItemQuantity(item);
      if (!item.productId || !item.color || qty === 0) return;
      const sub = getItemSubtotal(item, band);
      const el = document.querySelector<HTMLElement>(`[data-item-id="${item.id}"] .item-subtotal`);
      if (el) {
        el.innerHTML = `${qty} peça${qty !== 1 ? 's' : ''} — subtotal: <strong>${fmtCurrency(sub)}</strong>`;
      }
    });
  }
}

export function setupItemsContainer(): void {
  const container = document.getElementById('items-list')!;

  container.addEventListener('change', e => {
    const target = e.target as HTMLElement;
    const id = (target.closest('[data-item-id]') as HTMLElement | null)?.dataset.itemId;
    if (!id) return;
    const item = getItems().find(i => i.id === id);
    if (!item) return;

    if (target.matches('[data-action="product"]')) {
      item.productId = (target as HTMLSelectElement).value;
      item.color = '';
      item.quantities = {};
      renderItems();
      updateSummary();
    } else if (target.matches('[data-action="color"]')) {
      item.color = (target as HTMLSelectElement).value;
      renderItems();
      updateSummary();
    } else if (target.matches('[data-action="qty"]')) {
      const size = (target as HTMLInputElement).dataset.size!;
      item.quantities[size] = parseInt((target as HTMLInputElement).value) || 0;
      updateSummary();
    } else if (target.matches('[data-action="extra"]')) {
      item.extra = parseFloat((target as HTMLInputElement).value) || 0;
      updateSummary();
    }
  });

  container.addEventListener('click', e => {
    const target = e.target as HTMLElement;
    if (target.matches('[data-action="remove"]')) {
      const id = (target.closest('[data-item-id]') as HTMLElement | null)?.dataset.itemId;
      if (id) {
        removeItem(id);
        renderItems();
        updateSummary();
      }
    }
  });
}

export function setupAddItemButton(): void {
  document.getElementById('add-item-btn')!.addEventListener('click', () => {
    pushNewItem();
    renderItems();
    updateSummary();
    const cards = document.querySelectorAll('.item-card');
    cards[cards.length - 1]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
}
