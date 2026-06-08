import type { QuoteItem } from '../types';

let _items: QuoteItem[] = [];
let _nextId = 1;

function newItem(): QuoteItem {
  return { id: String(_nextId++), productId: '', color: '', quantities: {} };
}

export function getItems(): QuoteItem[] {
  return _items;
}

export function pushNewItem(): void {
  _items.push(newItem());
}

export function removeItem(id: string): void {
  _items = _items.filter(i => i.id !== id);
}

export function reset(): void {
  _items = [newItem()];
}

export function init(): void {
  _items = [newItem()];
}
