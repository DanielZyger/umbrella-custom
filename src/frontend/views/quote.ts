import type { QuickQuoteData } from '../types';
import { getItems, reset, setItems } from '../core/state';
import { getVal, setField, showErrors, clearErrors } from '../utils/form';
import { getItemQuantity, getPriceBand, getTotalQuantity } from '../core/calculator';
import { generatePrintHTML } from './print';
import { renderItems, updateSummary } from '../components/items';
import {
  deleteSavedQuote,
  getSavedNames,
  loadSavedQuote,
  saveCurrentQuote,
} from '../utils/savedQuotes';

const ERROR_BOX = 'error-box';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getNextQuoteNumber(): string {
  const year = new Date().getFullYear();
  const key = `umbrella_quote_${year}`;
  const n = parseInt(localStorage.getItem(key) ?? '0') + 1;
  localStorage.setItem(key, n.toString());
  return `UC-${year}-${n.toString().padStart(4, '0')}`;
}

function validate(): string[] {
  const errors: string[] = [];
  const items = getItems();

  if (!getVal('client-name')) errors.push('Nome do cliente é obrigatório.');

  const active = items.filter(i => i.productId && i.color && getItemQuantity(i) > 0);
  if (active.length === 0) errors.push('Adicione pelo menos um produto com quantidade.');

  return errors;
}

function generateQuote(): void {
  clearErrors(ERROR_BOX);
  const errors = validate();
  if (errors.length > 0) {
    showErrors(errors, ERROR_BOX);
    return;
  }

  const items = getItems();
  const data: QuickQuoteData = {
    number: getNextQuoteNumber(),
    date: new Date().toISOString().split('T')[0],
    clientName: getVal('client-name'),
    items,
  };

  saveCurrentQuote(data.clientName, items);

  const band = getPriceBand(getTotalQuantity(items))!;
  const logoUrl = `${window.location.origin}/logo.png`;
  const html = generatePrintHTML(data, band, logoUrl);
  const blob = new Blob([html], { type: 'text/html; charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, '_blank', 'noopener,noreferrer');
  setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
}

function clearForm(): void {
  if (!confirm('Limpar todos os dados do formulário?')) return;
  clearErrors(ERROR_BOX);
  setField('client-name', '');
  reset();
  renderItems();
  updateSummary();
}

// ── Autocomplete de orçamentos salvos ────────────────────────────────────────

function setupAutocomplete(): void {
  const input = document.getElementById('client-name') as HTMLInputElement;
  const dropdown = document.getElementById('saved-quotes-dropdown')!;
  let closeTimer: ReturnType<typeof setTimeout> | null = null;

  function positionDropdown(): void {
    const rect = input.getBoundingClientRect();
    dropdown.style.position = 'fixed';
    dropdown.style.top = `${rect.bottom + 4}px`;
    dropdown.style.left = `${rect.left}px`;
    dropdown.style.width = `${rect.width}px`;
  }

  function renderDropdown(filter: string): void {
    const names = getSavedNames();
    const q = filter.trim().toLowerCase();
    const filtered = q ? names.filter(n => n.toLowerCase().includes(q)) : names;

    if (filtered.length === 0) {
      dropdown.style.display = 'none';
      return;
    }

    dropdown.innerHTML = filtered
      .map(name => {
        const raw = loadSavedQuote(name)?.savedAt ?? '';
        const date = raw ? raw.split('-').reverse().join('/') : '';
        return `
        <div class="sq-option" data-name="${esc(name)}">
          <div class="sq-info">
            <span class="sq-name">${esc(name)}</span>
            ${date ? `<span class="sq-date">${date}</span>` : ''}
          </div>
          <button type="button" class="sq-delete" data-delete="${esc(name)}" title="Excluir">✕</button>
        </div>`;
      })
      .join('');

    positionDropdown();
    dropdown.style.display = '';
  }

  function hideDropdown(): void {
    dropdown.style.display = 'none';
  }

  input.addEventListener('input', () => renderDropdown(input.value));

  input.addEventListener('focus', () => {
    if (closeTimer) clearTimeout(closeTimer);
    renderDropdown(input.value);
  });

  input.addEventListener('blur', () => {
    closeTimer = setTimeout(hideDropdown, 150);
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') hideDropdown();
  });

  dropdown.addEventListener('mousedown', e => {
    e.preventDefault();
    if (closeTimer) clearTimeout(closeTimer);
    const target = e.target as HTMLElement;

    const deleteBtn = target.closest('[data-delete]') as HTMLElement | null;
    if (deleteBtn) {
      const name = deleteBtn.dataset.delete!;
      if (confirm(`Excluir orçamento salvo de "${name}"?`)) {
        deleteSavedQuote(name);
        renderDropdown(input.value);
      }
      return;
    }

    const option = target.closest('[data-name]') as HTMLElement | null;
    if (option) {
      const name = option.dataset.name!;
      const saved = loadSavedQuote(name);
      if (!saved) return;
      clearErrors(ERROR_BOX);
      setField('client-name', saved.clientName);
      setItems(saved.items);
      renderItems();
      updateSummary();
      hideDropdown();
    }
  });
}

export function setupQuoteForm(): void {
  document.getElementById('generate-btn')!.addEventListener('click', generateQuote);
  document.getElementById('clear-btn')!.addEventListener('click', clearForm);
  setupAutocomplete();
}
