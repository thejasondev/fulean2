import type { Context } from "grammy";
import { getLiveRates } from "../services/rates";
import {
  DEFAULT_RATES,
  CURRENCY_META,
  type Currency,
} from "../../lib/constants";

export async function inlineQueryHandler(ctx: Context) {
  const query = ctx.inlineQuery?.query.trim();

  // Fallback if empty
  if (!query) {
    // We could offer generic list, but for now just return empty or help
    return;
  }

  // Parse Input: "100 USD" or "50 EUR"
  const parts = query.split(/\s+/);
  if (parts.length < 2) return;

  const amount = parseFloat(parts[0]);
  const currencyInput = parts[1].toUpperCase();

  if (isNaN(amount)) return;

  // Resolve Currency
  const aliases: Record<string, Currency> = {
    USDT: "USDT_TRC20",
    TRC20: "USDT_TRC20",
    ZELE: "ZELLE",
  };
  const currencyCode = (aliases[currencyInput] || currencyInput) as Currency;
  const meta = CURRENCY_META[currencyCode];

  if (!meta) return;

  // Get Rate
  const rates = await getLiveRates();
  // Map to El Toque keys ref
  const keyMap: Record<Currency, keyof typeof rates> = {
    USD: "USD",
    EUR: "EUR",
    MLC: "MLC",
    CAD: "CAD",
    ZELLE: "ZELLE",
    CLASICA: "CLASICA",
    BTC: "BTC",
    USDT_TRC20: "USDT_TRC20",
  };

  const rateKey = keyMap[currencyCode];
  const rate =
    rateKey && rates[rateKey]
      ? (rates[rateKey] as number)
      : DEFAULT_RATES[currencyCode];

  const total = amount * rate;

  // Formats
  const fmtAmount = new Intl.NumberFormat("es-CU", {
    style: "decimcal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  const fmtTotal = new Intl.NumberFormat("es-CU", {
    style: "currency",
    currency: "CUP",
  }).format(total); // Adds CUP symbol
  const fmtRate = new Intl.NumberFormat("es-CU").format(rate);

  // Create Result
  await ctx.answerInlineQuery(
    [
      {
        type: "article",
        id: `calc-${Date.now()}`,
        title: `Vender ${fmtAmount} ${meta.code}`,
        description: `Recibes: ${fmtTotal} (Tasa: ${fmtRate})`,
        thumbnail_url:
          "https://fulean2.vercel.app/web-app-manifest-192x192.png", // Generic logo
        input_message_content: {
          message_text:
            `${meta.flag} *Cambio de Divisas*\n\n` +
            `💵 *Venta:* ${fmtAmount} ${meta.code}\n` +
            `💰 *Recibes:* ${fmtTotal}\n` +
            `📊 *Tasa:* ${fmtRate} CUP\n\n` +
            `_Calculado con @Fulean2_Bot_`,
          parse_mode: "Markdown",
        },
      },
    ],
    {
      cache_time: 0, // No cache provided by Telegram for query results to ensure live rates
    },
  );
}
