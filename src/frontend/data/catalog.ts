import type { Product } from '../types';

export const PRODUCTS: Product[] = [
  // ── OVERSIZED ────────────────────────────────────────────────
  {
    id: 'cropped-heavy',
    name: 'Cropped Heavy',
    category: 'Oversized',
    sizes: ['Único'],
    colors: ['Off White', 'Marrom', 'Preto'],
    prices: { '25-49': 74.9, '50-99': 72.9, '100-199': 69.9, '200-499': 67.9, '500+': 66.9 },
  },
  {
    id: 'oversized-heavy',
    name: 'Oversized Heavy',
    category: 'Oversized',
    sizes: ['PP', 'P', 'M', 'G', 'GG'],
    colors: ['Branco', 'Off White', 'Grafite', 'Roxo', 'Bordô', 'Verde Moraceo', 'Marrom', 'Preto'],
    prices: { '25-49': 84.9, '50-99': 82.9, '100-199': 79.9, '200-499': 77.9, '500+': 76.9 },
  },
  {
    id: 'oversized-stone',
    name: 'Oversized Stone 20.1',
    category: 'Oversized',
    sizes: ['P', 'M', 'G', 'GG'],
    colors: ['Off White', 'Preto', 'Grafite', 'Petróleo', 'Azul Marinho', 'Caqui'],
    prices: { '25-49': 89.9, '50-99': 87.9, '100-199': 85.9, '200-499': 84.9, '500+': 83.9 },
  },

  // ── STREETWEAR ────────────────────────────────────────────────
  {
    id: 'streetwear-comfort',
    name: 'Streetwear Comfort',
    category: 'Streetwear',
    sizes: ['P', 'M', 'G', 'GG'],
    colors: ['Branco', 'Off White', 'Cinza Mescla', 'Roxo', 'Marrom', 'Preto'],
    prices: { '25-49': 69.9, '50-99': 67.9, '100-199': 65.9, '200-499': 64.9, '500+': 63.9 },
  },
  {
    id: 'streetwear-premium',
    name: 'Streetwear Premium',
    category: 'Streetwear',
    sizes: ['PP', 'P', 'M', 'G', 'GG', 'XG', 'G2', 'G3'],
    colors: ['Branco', 'Off White', 'Bege Costeiro', 'Marrom Chocolate', 'Preto'],
    prices: { '25-49': 99.9, '50-99': 97.9, '100-199': 95.9, '200-499': 94.9, '500+': 93.9 },
    note: 'Marrom Chocolate: verificar disponibilidade.',
  },

  // ── CAMISETAS ────────────────────────────────────────────────
  {
    id: 'slim-basic-uv',
    name: 'Slim Basic UV',
    category: 'Camisetas',
    sizes: ['P', 'M', 'G', 'GG'],
    colors: ['Branco', 'Marrom', 'Preto'],
    prices: { '25-49': 49.9, '50-99': 47.9, '100-199': 46.9, '200-499': 45.9, '500+': 44.9 },
    note: 'Personalização disponível apenas na frente.',
  },
  {
    id: 'regular-comfort',
    name: 'Regular Comfort',
    category: 'Camisetas',
    sizes: ['PP', 'P', 'M', 'G', 'GG', 'G1', 'G2', 'G3', 'G4'],
    colors: [
      'Branco',
      'Off White',
      'Areia',
      'Cinza Mescla',
      'Verde Bandeira',
      'Verde Moraceo',
      'Rosa',
      'Violeta',
      'Marrom',
      'Azul Turquesa',
      'Azul Royal',
      'Azul Marinho',
      'Amarelo Canário',
      'Caramelo',
      'Laranja',
      'Vermelho',
      'Bordô',
      'Preto',
    ],
    prices: { '25-49': 67.9, '50-99': 65.9, '100-199': 64.9, '200-499': 63.9, '500+': 62.9 },
    sizeSurcharge: { sizes: ['G1', 'G2', 'G3', 'G4'], amount: 5 },
    note: 'G1 ao G4: acréscimo de R$5 por peça.',
  },
  {
    id: 'regular-premium',
    name: 'Regular Premium',
    category: 'Camisetas',
    sizes: ['P', 'M', 'G', 'GG', 'XG'],
    colors: [
      'Branco',
      'Off White',
      'Bege Costeiro',
      'Marrom',
      'Azul Marinho Profundo',
      'Preto',
      'Vermelho',
    ],
    prices: { '25-49': 99.9, '50-99': 97.9, '100-199': 95.9, '200-499': 94.9, '500+': 93.9 },
  },

  // ── BABYLOOK ─────────────────────────────────────────────────
  {
    id: 'babylook-comfort',
    name: 'Babylook Comfort',
    category: 'Babylook',
    sizes: ['P', 'M', 'G', 'GG', 'G1', 'G2'],
    colors: ['Branco', 'Off White', 'Azul Marinho', 'Bordô', 'Verde Moraceo', 'Marrom', 'Preto'],
    prices: { '25-49': 67.9, '50-99': 65.9, '100-199': 64.9, '200-499': 63.9, '500+': 62.9 },
    sizeSurcharge: { sizes: ['G1', 'G2'], amount: 5 },
    note: 'G1 e G2: acréscimo de R$5 por peça.',
  },

  // ── GOLA POLO ────────────────────────────────────────────────
  {
    id: 'gola-polo-masculina',
    name: 'Gola Polo Masculina',
    category: 'Gola Polo',
    sizes: ['P', 'M', 'G', 'GG', 'G1'],
    colors: [
      'Branco',
      'Off White',
      'Cinza Mescla',
      'Rosa Claro',
      'Verde Bandeira',
      'Rosa Pink',
      'Vermelho',
      'Azul Royal',
      'Azul Marinho',
      'Preto',
    ],
    prices: { '25-49': 87.9, '50-99': 85.9, '100-199': 84.9, '200-499': 83.9, '500+': 82.9 },
  },

  // ── INFANTIL ─────────────────────────────────────────────────
  {
    id: 'camiseta-infantil',
    name: 'Camiseta Infantil',
    category: 'Infantil',
    sizes: ['2', '4', '6', '8', '10', '12', '14'],
    colors: [
      'Branco',
      'Off White',
      'Rosa Claro',
      'Cinza Mescla',
      'Salmão',
      'Verde Moraceo',
      'Vermelho',
      'Azul Marinho',
      'Marrom',
      'Preto',
    ],
    prices: { '25-49': 54.9, '50-99': 52.9, '100-199': 51.9, '200-499': 50.9, '500+': 49.9 },
  },

  // ── AGASALHOS ────────────────────────────────────────────────
  {
    id: 'moletom-careca',
    name: 'Moletom Careca',
    category: 'Agasalhos',
    sizes: ['PP', 'P', 'M', 'G', 'GG', 'XG', 'G2', 'G3'],
    colors: ['Branco', 'Off White', 'Preto', 'Azul Naval', 'Marrom', 'Chumbo'],
    prices: { '25-49': 144.9, '50-99': 142.9, '100-199': 141.9, '200-499': 140.9, '500+': 139.9 },
    note: 'A grade pode variar dependendo da cor.',
  },
  {
    id: 'canguru-2-cabos',
    name: 'Canguru 2 Cabos',
    category: 'Agasalhos',
    sizes: ['PP', 'P', 'M', 'G', 'GG', 'XG', 'G2', 'G3'],
    colors: ['Branco', 'Off White', 'Preto', 'Azul Naval', 'Marrom', 'Chumbo'],
    prices: { '25-49': 174.9, '50-99': 172.9, '100-199': 171.9, '200-499': 170.9, '500+': 169.9 },
    note: 'A grade pode variar dependendo da cor.',
  },
  {
    id: 'canguru-3-cabos',
    name: 'Canguru 3 Cabos',
    category: 'Agasalhos',
    sizes: ['PP', 'P', 'M', 'G', 'GG', 'XG', 'G2', 'G3'],
    colors: ['Off White', 'Preto', 'Marrom', 'Chumbo'],
    prices: { '25-49': 184.9, '50-99': 182.9, '100-199': 181.9, '200-499': 180.9, '500+': 179.9 },
    note: 'A grade pode variar dependendo da cor.',
  },
];

export const CATEGORIES = [...new Set(PRODUCTS.map(p => p.category))];
