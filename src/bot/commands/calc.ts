import type { Context } from "grammy";
import {
  DEFAULT_RATES,
  CURRENCY_META,
  type Currency,
} from "../../lib/constants";

export async function calcCommand(ctx: Context) {
  const args = ctx.match as string; // in grammy, ctx.match holds the regex match or text after command

  if (!args) {
    return ctx.reply("❌ Uso incorrecto.\nEjemplo: `/calc 100 USD`", {
      parse_mode: "Markdown",
    });
  }

  // Handle formats:
  // 1. /calc 100 USD (Default rate)
  // 2. /calc 100 USD 500 (Direct custom rate)
  // 3. /calc 100 USD x 500 ("x" separator)

  const originalArgs = args.trim();
  // Remove "x" or "X" if used as separator
  // Regex: replace " x " with " ", or " X " with " "
  const cleanArgs = originalArgs.replace(/\s+[xX]\s+/g, " ");

  const parts = cleanArgs.split(/\s+/);

  if (parts.length < 2) {
    return ctx.reply(
      "❌ Falta información.\nEjemplo: `/calc 100 USD` o `/calc 100 USD x 500`",
      {
        parse_mode: "Markdown",
      },
    );
  }

  const amount = parseFloat(parts[0]);
  let currencyInput = parts[1].toUpperCase();
  let customRate: number | undefined;

  // Check for custom rate in 3rd argument
  if (parts.length >= 3) {
    customRate = parseFloat(parts[2]);
    if (isNaN(customRate)) {
      return ctx.reply("❌ La tasa personalizada no es válida.");
    }
  }

  if (isNaN(amount)) {
    return ctx.reply("❌ El monto no es válido.");
  }

  // Basic normalization (e.g. "USDT" -> "USDT_TRC20" if needed, but keeping simple for now)
  // Check if currency exists in constants
  // We might need to map common aliases
  const aliases: Record<string, Currency> = {
    USDT: "USDT_TRC20",
    TRC20: "USDT_TRC20",
    ZELE: "ZELLE",
  };

  const currencyCode = (aliases[currencyInput] || currencyInput) as Currency;
  const meta = CURRENCY_META[currencyCode];

  // If currency not found but user provided custom rate, we can still calc but generic
  // But for now strict to supported currencies for consistent UI
  // ... (validation code above remains same)

  // If currency not found but user provided custom rate, we can still calc but generic
  // But for now strict to supported currencies for consistent UI
  if (!meta) {
    return ctx.reply(
      `❌ Moneda no soportada: ${currencyInput}\nPrueba con: USD, EUR, MLC, ZELLE, etc.`,
    );
  }

  let rate = customRate;
  let rateSource = customRate ? "Personalizada" : "El Toque";

  if (!rate) {
    // Fetch live rate
    // Notify user we are fetching? (Maybe too verbose, cleaner to just do it)
    await ctx.replyWithChatAction("typing");

    // Lazy load the fetcher
    const { getLiveRates } = await import("../services/rates");
    const rates = await getLiveRates();

    // Map internal currency keys to El Toque keys in our interface
    // ElToqueRates keys: USD, EUR, TLC, CAD, ZELLE, CLASICA, BTC, USDT_TRC20
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

    const targetKey = keyMap[currencyCode];
    if (targetKey && rates[targetKey]) {
      rate = rates[targetKey] as number;
      // Check if this key is considered "Official" by El Toque
      const isOfficial = ["USD", "EUR", "MLC", "BTC", "USDT_TRC20"].includes(
        targetKey,
      );
      rateSource = isOfficial ? "El Toque" : "Fulean2 (Estimado)";
    } else {
      // Fallback to strict default if API fails or key missing
      rate = DEFAULT_RATES[currencyCode];
      rateSource = "Fulean2 (Offline)";
    }
  }

  const total = amount * rate;

  // Format numbers
  const fmtAmount = amount.toLocaleString("es-CU");
  const fmtTotal = total.toLocaleString("es-CU");
  const fmtRate = rate.toLocaleString("es-CU");

  await ctx.reply(
    `${meta.flag} *Cambio de Divisas*\n\n` +
      `💵 *Entrada:* ${fmtAmount} ${meta.code}\n` +
      `💰 *Salida:* ${fmtTotal} CUP\n` +
      `📊 *Tasa:* ${fmtRate} _(${rateSource})_\n\n` +
      `_Calculado con Fulean2_`,
    { parse_mode: "Markdown" },
  );
}
