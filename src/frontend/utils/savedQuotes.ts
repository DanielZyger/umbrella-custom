import type { QuoteItem } from '../types';

const STORAGE_KEY = 'umbrella_saved_quotes';

interface SavedQuoteEntry {
  clientName: string;
  items: QuoteItem[];
  savedAt: string;
}

function getAll(): Record<string, SavedQuoteEntry> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function setAll(data: Record<string, SavedQuoteEntry>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getSavedNames(): string[] {
  return Object.keys(getAll()).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export function loadSavedQuote(name: string): SavedQuoteEntry | null {
  return getAll()[name] ?? null;
}

export function saveCurrentQuote(name: string, items: QuoteItem[]): void {
  const trimmed = name.trim();
  if (!trimmed) return;
  const all = getAll();
  all[trimmed] = {
    clientName: trimmed,
    items,
    savedAt: new Date().toISOString().split('T')[0],
  };
  setAll(all);
}

export function deleteSavedQuote(name: string): void {
  const all = getAll();
  delete all[name];
  setAll(all);
}
