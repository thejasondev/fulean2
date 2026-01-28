import type { Context } from "grammy";
import { parseElToqueRates, type ElToqueRates } from "../../lib/eltoque-api";
import { DEFAULT_RATES } from "../../lib/constants";

const ELTOQUE_API_URL = "https://tasas.eltoque.com/v1/trmi";

async function getRates(): Promise<ElToqueRates> {
  const token =
    import.meta.env.ELTOQUE_API_TOKEN || process.env.ELTOQUE_API_TOKEN;

  if (!token || token === "your_token_here") {
    // Fallback to constants if no token
    return {
      ...DEFAULT_RATES,
      USDT_TRC20: DEFAULT_RATES.USDT,
      lastUpdate: new Date(),
    } as unknown as ElToqueRates;
  }

  try {
    const response = await fetch(ELTOQUE_API_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) throw new Error("API Error");
    const data = await response.json();
    return parseElToqueRates(data);
  } catch (e) {
    console.error("Error fetching rates:", e);
    // Fallback
    return {
      ...DEFAULT_RATES,
      USDT_TRC20: DEFAULT_RATES.USDT,
      lastUpdate: new Date(),
    } as unknown as ElToqueRates;
  }
}

export async function ratesCommand(ctx: Context) {
  const rates = await getRates();
  const date = new Date(rates.lastUpdate).toLocaleDateString("es-CU");
  const time = new Date(rates.lastUpdate).toLocaleTimeString("es-CU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  await ctx.reply(
    `📊 *Tasas de Cambio Actuales*\n` +
      `📅 _${date} - ${time}_\n\n` +
      `🇺🇸 *USD:* ${rates.USD} CUP\n` +
      `🇪🇺 *EUR:* ${rates.EUR} CUP\n` +
      `💳 *MLC:* ${rates.MLC} CUP\n\n` +
      `_Fuente: El Toque_`,
    { parse_mode: "Markdown" },
  );
}
