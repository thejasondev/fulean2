// ============================================
// Constants - Fulean2 Core Configuration
// ============================================

// Bill denominations available in Cuban Peso (CUP)
export const DENOMINATIONS = [1000, 500, 200, 100, 50, 20] as const;

export type Denomination = (typeof DENOMINATIONS)[number];

// ============================================
// Currency System: The 6 Pillars
// ============================================

// All supported currencies
export const CURRENCIES = [
  "USD",
  "EUR",
  "CAD",
  "MLC",
  "CLASICA",
  "ZELLE",
  "BTC",
  "USDT_TRC20",
] as const;

export type Currency = (typeof CURRENCIES)[number];

// Currency categories
export type CurrencyCategory = "cash" | "digital";

// Currency metadata with display info
export interface CurrencyMeta {
  code: Currency;
  name: string;
  symbol: string;
  flag: string;
  category: CurrencyCategory;
  color: string; // Tailwind color class
}

export const CURRENCY_META: Record<Currency, CurrencyMeta> = {
  USD: {
    code: "USD",
    name: "Dólar",
    symbol: "$",
    flag: "🇺🇸",
    category: "cash",
    color: "emerald",
  },
  EUR: {
    code: "EUR",
    name: "Euro",
    symbol: "€",
    flag: "🇪🇺",
    category: "cash",
    color: "blue",
  },
  CAD: {
    code: "CAD",
    name: "Canadiense",
    symbol: "C$",
    flag: "🇨🇦",
    category: "cash",
    color: "red",
  },
  MLC: {
    code: "MLC",
    name: "MLC",
    symbol: "M$",
    flag: "💳",
    category: "digital",
    color: "purple",
  },
  CLASICA: {
    code: "CLASICA",
    name: "Clásica",
    symbol: "₵",
    flag: "💳",
    category: "digital",
    color: "cyan",
  },
  ZELLE: {
    code: "ZELLE",
    name: "Zelle",
    symbol: "Z$",
    flag: "📱",
    category: "digital",
    color: "violet",
  },
  BTC: {
    code: "BTC",
    name: "Bitcoin",
    symbol: "₿",
    flag: "₿",
    category: "digital",
    color: "orange",
  },
  USDT_TRC20: {
    code: "USDT_TRC20",
    name: "USDT TRC20",
    symbol: "₮",
    flag: "💵",
    category: "digital",
    color: "teal",
  },
};

// Helper to get currencies by category
export const CASH_CURRENCIES = CURRENCIES.filter(
  (c) => CURRENCY_META[c].category === "cash",
);
export const DIGITAL_CURRENCIES = CURRENCIES.filter(
  (c) => CURRENCY_META[c].category === "digital",
);

// Default exchange rates (CUP per 1 unit of currency)
export const DEFAULT_RATES: Record<Currency, number> = {
  USD: 450,
  EUR: 500,
  CAD: 380,
  MLC: 350,
  CLASICA: 350,
  ZELLE: 400,
  BTC: 450,
  USDT_TRC20: 500,
};

// Number of bills in a "Fajo" (bundle)
export const FAJO_COUNT = 100;

// App metadata
export const APP_NAME = "Fulean2";
export const APP_DESCRIPTION = "Contador de Efectivo CUP";
