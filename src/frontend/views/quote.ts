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

  const total = getTotalQuantity(items);
  if (total > 0 && total < 25) errors.push(`Pedido mínimo: 25 peças. Total atual: ${total}.`);

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
  refreshSavedQuotesUI();

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
  resetSavedSelect();
}

// ── Saved quotes UI ─────────────────────────────────────────────────────────

function refreshSavedQuotesUI(): void {
  const names = getSavedNames();
  const section = document.getElementById('saved-quotes-section')!;
  const select = document.getElementById('saved-quotes-select') as HTMLSelectElement;
  const datalist = document.getElementById('saved-quotes-datalist')!;

  datalist.innerHTML = names.map(n => `<option value="${n}"></option>`).join('');

  select.innerHTML =
    `<option value="">— carregar orçamento salvo —</option>` +
    names
      .map(n => {
        const entry = loadSavedQuote(n);
        const date = entry ? ` · ${entry.savedAt}` : '';
        return `<option value="${n}">${n}${date}</option>`;
      })
      .join('');

  section.style.display = names.length > 0 ? '' : 'none';
}

function resetSavedSelect(): void {
  const select = document.getElementById('saved-quotes-select') as HTMLSelectElement;
  const deleteBtn = document.getElementById('delete-saved-btn') as HTMLButtonElement;
  select.value = '';
  deleteBtn.style.display = 'none';
}

function loadQuoteFromSelect(name: string): void {
  const saved = loadSavedQuote(name);
  if (!saved) return;
  clearErrors(ERROR_BOX);
  setField('client-name', saved.clientName);
  setItems(saved.items);
  renderItems();
  updateSummary();
  document.getElementById('delete-saved-btn')!.style.display = '';
}

// ── Setup ────────────────────────────────────────────────────────────────────

export function setupQuoteForm(): void {
  document.getElementById('generate-btn')!.addEventListener('click', generateQuote);
  document.getElementById('clear-btn')!.addEventListener('click', clearForm);

  // Load from select
  const select = document.getElementById('saved-quotes-select') as HTMLSelectElement;
  select.addEventListener('change', () => {
    const name = select.value;
    const deleteBtn = document.getElementById('delete-saved-btn') as HTMLButtonElement;
    if (!name) {
      deleteBtn.style.display = 'none';
      return;
    }
    loadQuoteFromSelect(name);
  });

  // Delete saved quote
  document.getElementById('delete-saved-btn')!.addEventListener('click', () => {
    const name = (document.getElementById('saved-quotes-select') as HTMLSelectElement).value;
    if (!name || !confirm(`Excluir orçamento salvo de "${name}"?`)) return;
    deleteSavedQuote(name);
    refreshSavedQuotesUI();
    document.getElementById('delete-saved-btn')!.style.display = 'none';
  });

  refreshSavedQuotesUI();
}
