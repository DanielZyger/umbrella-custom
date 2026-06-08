import type { PriceBand, Product, QuoteItem } from '../types';
import { PRODUCTS } from '../data/catalog';

export function getPriceBand(total: number): PriceBand | null {
  if (total < 25) return null;
  if (total <= 49) return '25-49';
  if (total <= 99) return '50-99';
  if (total <= 199) return '100-199';
  if (total <= 499) return '200-499';
  return '500+';
}

export function getItemQuantity(item: QuoteItem): number {
  return Object.values(item.quantities).reduce((s, q) => s + (q || 0), 0);
}

export function getTotalQuantity(items: QuoteItem[]): number {
  return items.reduce((s, item) => s + getItemQuantity(item), 0);
}

export function getUnitPrice(product: Product, size: string, band: PriceBand): number {
  const base = product.prices[band];
  if (product.sizeSurcharge?.sizes.includes(size)) {
    return base + product.sizeSurcharge.amount;
  }
  return base;
}

export function getItemSubtotal(item: QuoteItem, band: PriceBand): number {
  const product = PRODUCTS.find(p => p.id === item.productId);
  if (!product) return 0;
  return Object.entries(item.quantities).reduce((sum, [size, qty]) => {
    return sum + (qty > 0 ? getUnitPrice(product, size, band) * qty : 0);
  }, 0);
}

export function getGrandTotal(items: QuoteItem[], band: PriceBand): number {
  return items.reduce((s, item) => s + getItemSubtotal(item, band), 0);
}

export function fmtCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function fmtBand(band: PriceBand): string {
  return band === '500+' ? '500 ou mais' : band;
}
