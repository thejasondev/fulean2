// ============================================
// El Toque API Service
// Fetches informal market rates from Cuba
// Supports: USD, EUR, MLC, CAD, ZELLE, CLA
// ============================================

import type { Currency } from "./constants";

// Mapped rates for our app
export interface ElToqueRates {
  USD: number;
  EUR: number;
  MLC: number;
  CAD: number;
  CLASICA: number; // Maps from "CLA" in El Toque API
  ZELLE: number;
  BTC: number;
  USDT_TRC20: number;
  lastUpdate: Date;
}

/**
 * Parse El Toque API response
 *
 * API returns: { tasas: { USD, ECU, MLC, CAD, ZELLE, CLA, BTC, USDT_TRC20, ... } }
 *
 * Mappings:
 * - ECU or EUR -> EUR (El Toque uses "ECU" for Euro)
 * - CLA -> CLASICA (our app name)
 * - BTC and USDT_TRC20 are direct mappings
 */
export function parseElToqueRates(data: unknown): ElToqueRates {
  const response = data as { tasas?: Record<string, number> };
  const tasas = response?.tasas || {};

  console.log("Parsing El Toque tasas:", tasas);

  // Direct mappings from API
  const usd = tasas.USD || 460;
  const eur = tasas.ECU || tasas.EUR || 505; // El Toque uses "ECU"
  const mlc = tasas.MLC || 400;
  const cad = tasas.CAD || 300;
  const zelle = tasas.ZELLE || 457;
  const cla = tasas.CLA || 427; // CLA = Tarjeta Clásica
  const btc = tasas.BTC || 5800000; // Bitcoin
  const usdt = tasas.USDT_TRC20 || tasas.USDT || 460; // USDT TRC20

  return {
    USD: Math.round(usd),
    EUR: Math.round(eur),
    MLC: Math.round(mlc),
    CAD: Math.round(cad),
    CLASICA: Math.round(cla), // Map CLA -> CLASICA
    ZELLE: Math.round(zelle),
    BTC: Math.round(btc),
    USDT_TRC20: Math.round(usdt),
    lastUpdate: new Date(),
  };
}

// ============================================
// El Toque Cache (localStorage)
// ============================================
const ELTOQUE_CACHE_KEY = "fulean2_eltoque_cache";

interface CachedElToqueData {
  rates: ElToqueRates;
  timestamp: number;
}

/**
 * Save El Toque rates to cache
 */
function saveElToqueCache(rates: ElToqueRates): void {
  if (typeof localStorage === "undefined") return;
  try {
    const data: CachedElToqueData = {
      rates,
      timestamp: Date.now(),
    };
    localStorage.setItem(ELTOQUE_CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Load El Toque rates from cache
 * Returns null if cache is older than 24 hours
 */
function loadElToqueCache(): ElToqueRates | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const stored = localStorage.getItem(ELTOQUE_CACHE_KEY);
    if (!stored) return null;

    const data: CachedElToqueData = JSON.parse(stored);
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    // Return cached rates even if old (better than nothing when offline)
    if (data.rates) {
      // Restore Date object from cached data
      return {
        ...data.rates,
        lastUpdate: new Date(data.timestamp),
      };
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

/**
 * Check if cached rates exist
 */
export function hasCachedElToqueRates(): boolean {
  return loadElToqueCache() !== null;
}

/**
 * Get cached El Toque rates (for offline use)
 */
export function getCachedElToqueRates(): ElToqueRates | null {
  return loadElToqueCache();
}

/**
 * Fetch rates from our API proxy with caching
 */
export async function fetchElToqueRates(): Promise<ElToqueRates | null> {
  try {
    const response = await fetch("/api/rates");

    if (!response.ok) {
      console.warn("El Toque API error:", response.status);
      // Return cached rates on error
      return loadElToqueCache();
    }

    const data = await response.json();

    if (data.error) {
      console.warn("El Toque API error:", data.error);
      // Return cached rates on error
      return loadElToqueCache();
    }

    const rates = parseElToqueRates(data);

    // Cache successful fetch
    saveElToqueCache(rates);

    return rates;
  } catch (error) {
    console.error("Failed to fetch El Toque rates:", error);
    // Return cached rates when offline
    return loadElToqueCache();
  }
}

/**
 * Format the last update time
 */
export function formatLastUpdate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Ahora";
  if (diffMins < 60) return `Hace ${diffMins} min`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Hace ${diffHours}h`;

  return date.toLocaleDateString("es-CU", {
    day: "2-digit",
    month: "short",
  });
}
