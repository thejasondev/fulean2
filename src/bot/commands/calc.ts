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

  const parts = args.trim().split(" ");
  if (parts.length < 2) {
    return ctx.reply("❌ Falta información.\nEjemplo: `/calc 100 USD`", {
      parse_mode: "Markdown",
    });
  }

  const amount = parseFloat(parts[0]);
  let currencyInput = parts[1].toUpperCase();

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

  if (!meta) {
    return ctx.reply(
      `❌ Moneda no soportada: ${currencyInput}\nPrueba con: USD, EUR, MLC, ZELLE, etc.`,
    );
  }

  const rate = DEFAULT_RATES[currencyCode];
  const total = amount * rate;

  // Format numbers
  const fmtAmount = amount.toLocaleString("es-CU");
  const fmtTotal = total.toLocaleString("es-CU");
  const fmtRate = rate.toLocaleString("es-CU");

  await ctx.reply(
    `${meta.flag} *Cambio de Divisas*\n\n` +
      `💵 *Entrada:* ${fmtAmount} ${meta.code}\n` +
      `💰 *Salida:* ${fmtTotal} CUP\n` +
      `📊 *Tasa:* ${fmtRate}\n\n` +
      `_Calculado con Fulean2_`,
    { parse_mode: "Markdown" },
  );
}
