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
  lastUpdate: Date;
}

/**
 * Parse El Toque API response
 *
 * API returns: { tasas: { USD, ECU, MLC, CAD, ZELLE, CLA, ... } }
 *
 * Mappings:
 * - ECU or EUR -> EUR (El Toque uses "ECU" for Euro)
 * - CLA -> CLASICA (our app name)
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

  return {
    USD: Math.round(usd),
    EUR: Math.round(eur),
    MLC: Math.round(mlc),
    CAD: Math.round(cad),
    CLASICA: Math.round(cla), // Map CLA -> CLASICA
    ZELLE: Math.round(zelle),
    lastUpdate: new Date(),
  };
}

/**
 * Fetch rates from our API proxy
 */
export async function fetchElToqueRates(): Promise<ElToqueRates | null> {
  try {
    const response = await fetch("/api/rates");

    if (!response.ok) {
      console.warn("El Toque API error:", response.status);
      return null;
    }

    const data = await response.json();

    if (data.error) {
      console.warn("El Toque API error:", data.error);
      return null;
    }

    return parseElToqueRates(data);
  } catch (error) {
    console.error("Failed to fetch El Toque rates:", error);
    return null;
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
