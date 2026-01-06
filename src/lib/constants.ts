// Bill denominations available in Cuban Peso (CUP)
export const DENOMINATIONS = [1000, 500, 200, 100, 50, 20] as const;

export type Denomination = (typeof DENOMINATIONS)[number];

// Default exchange rates (CUP per 1 unit of foreign currency)
export const DEFAULT_RATES = {
  USD: 320,
  EUR: 335,
  CAD: 280,
} as const;

export type Currency = keyof typeof DEFAULT_RATES;

// Number of bills in a "Fajo" (bundle)
export const FAJO_COUNT = 100;

// App metadata
export const APP_NAME = "Fulean2";
export const APP_DESCRIPTION = "Contador de Efectivo CUP";
