export const PRICE_BANDS = ['25-49', '50-99', '100-199', '200-499', '500+'] as const;
export type PriceBand = (typeof PRICE_BANDS)[number];

export type ClientType = 'pf' | 'pj';

export interface Product {
  id: string;
  name: string;
  category: string;
  sizes: string[];
  colors: string[];
  prices: Record<PriceBand, number>;
  sizeSurcharge?: { sizes: string[]; amount: number };
  note?: string;
}

export interface Address {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export interface QuoteItem {
  id: string;
  productId: string;
  color: string;
  quantities: Record<string, number>;
  extra: number;
  specialBand?: PriceBand;
}

export interface QuickQuoteData {
  number: string;
  date: string;
  clientName: string;
  items: QuoteItem[];
}

export interface OrderRegistration {
  clientName: string;
  clientType: ClientType;
  document: string;
  phone: string;
  email: string;
  notes: string;
  itemsSummary: string;
  totalAmount: number;
  totalItems: number;
  paidPercentage: number;
  billingAddress: Address;
  deliveryAddress?: Address;
}
