import type { Address, ClientType, OrderRegistration } from '../types';
import { PRODUCTS } from '../data/catalog';
import { getGrandTotal, getItemQuantity, getPriceBand, getTotalQuantity } from '../core/calculator';
import { getItems } from '../core/state';
import { getVal, showErrors, clearErrors } from '../utils/form';
import { setupCEPLookup } from '../utils/cep';

const ERROR_BOX = 'reg-error-box';

function getClientType(): ClientType {
  const el = document.querySelector<HTMLInputElement>('[name="reg-client-type"]:checked');
  return (el?.value as ClientType) ?? 'pf';
}

function applyClientType(): void {
  const isPJ = getClientType() === 'pj';
  document.getElementById('reg-doc-label')!.textContent = isPJ ? 'CNPJ' : 'CPF';
  (document.getElementById('reg-document') as HTMLInputElement).placeholder = isPJ
    ? '00.000.000/0000-00'
    : '000.000.000-00';
}

function collectAddress(prefix: string): Address {
  return {
    cep: getVal(`${prefix}-cep`),
    logradouro: getVal(`${prefix}-logradouro`),
    numero: getVal(`${prefix}-numero`),
    complemento: getVal(`${prefix}-complemento`),
    bairro: getVal(`${prefix}-bairro`),
    cidade: getVal(`${prefix}-cidade`),
    uf: getVal(`${prefix}-uf`),
  };
}

function showSuccess(): void {
  const el = document.getElementById('reg-success-box')!;
  el.style.display = '';
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => {
    el.style.display = 'none';
  }, 5000);
}

async function submitOrder(): Promise<void> {
  clearErrors(ERROR_BOX);

  const clientName = getVal('reg-client-name');
  const errors: string[] = [];
  if (!clientName) errors.push('Nome do cliente é obrigatório.');
  if (!getVal('reg-phone')) errors.push('Telefone é obrigatório.');

  const items = getItems();
  const total = getTotalQuantity(items);
  const band = getPriceBand(total);
  const activeItems = items.filter(i => i.productId && i.color && getItemQuantity(i) > 0);
  if (activeItems.length === 0 || !band) {
    errors.push('Adicione itens no orçamento (aba Orçamento) antes de cadastrar.');
  }

  if (errors.length > 0) {
    showErrors(errors, ERROR_BOX);
    return;
  }

  const grandTotal = getGrandTotal(activeItems, band!);
  const itemsSummary = activeItems
    .map(item => {
      const product = PRODUCTS.find(p => p.id === item.productId)!;
      const sizes = Object.entries(item.quantities)
        .filter(([, q]) => q > 0)
        .map(([s, q]) => `${s}:${q}`)
        .join(', ');
      return `${product.name} (${item.color}) — ${sizes}`;
    })
    .join('\n');

  const sameAddress = (document.getElementById('reg-same-address') as HTMLInputElement).checked;
  const paidPercentage = Math.min(
    100,
    Math.max(0, parseInt((document.getElementById('reg-paid-pct') as HTMLInputElement).value) || 0),
  );
  const totalItems =
    parseInt((document.getElementById('reg-total-items') as HTMLInputElement).value) || total;
  const order: OrderRegistration = {
    clientName,
    clientType: getClientType(),
    document: getVal('reg-document'),
    phone: getVal('reg-phone'),
    email: getVal('reg-email'),
    notes: getVal('reg-notes'),
    itemsSummary,
    totalAmount: grandTotal,
    totalItems,
    paidPercentage,
    billingAddress: collectAddress('reg-billing'),
    deliveryAddress: sameAddress ? undefined : collectAddress('reg-delivery'),
  };

  const btn = document.getElementById('submit-notion-btn') as HTMLButtonElement;
  btn.disabled = true;
  btn.textContent = 'Enviando...';

  try {
    const fileInput = document.getElementById('reg-pdf-file') as HTMLInputElement;
    const formData = new FormData();
    formData.append('data', JSON.stringify(order));
    if (fileInput.files?.[0]) formData.append('orcamento', fileInput.files[0]);

    const res = await fetch('/api/notion/order', { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
    showSuccess();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    showErrors([`Erro ao salvar no Notion: ${msg}`], ERROR_BOX);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Cadastrar Pedido no Notion';
  }
}

export function syncFromQuoteTab(): void {
  const quoteName = (document.getElementById('client-name') as HTMLInputElement).value;
  const regName = document.getElementById('reg-client-name') as HTMLInputElement;
  if (quoteName && !regName.value) regName.value = quoteName;

  const total = getTotalQuantity(getItems());
  const totalItemsInput = document.getElementById('reg-total-items') as HTMLInputElement;
  if (total > 0 && !totalItemsInput.value) totalItemsInput.value = String(total);
}

export function setupRegisterForm(): void {
  document
    .querySelectorAll('[name="reg-client-type"]')
    .forEach(el => el.addEventListener('change', applyClientType));
  applyClientType();

  setupCEPLookup('reg-billing');
  setupCEPLookup('reg-delivery');

  const sameAddressCb = document.getElementById('reg-same-address') as HTMLInputElement;
  sameAddressCb?.addEventListener('change', () => {
    document.getElementById('reg-delivery-address-section')!.style.display = sameAddressCb.checked
      ? 'none'
      : '';
  });

  const fileInput = document.getElementById('reg-pdf-file') as HTMLInputElement;
  const fileDisplay = document.getElementById('reg-file-name')!;
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    fileDisplay.textContent = file ? `✓ ${file.name}` : '';
    fileDisplay.style.display = file ? '' : 'none';
  });

  document.getElementById('submit-notion-btn')!.addEventListener('click', submitOrder);
}
