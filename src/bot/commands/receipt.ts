import type { Context } from "grammy";
import { CURRENCIES, CURRENCY_META, type Currency } from "../../lib/constants";

// ============================================
// Receipt Command - Text-based Receipt Generator
// Uses formatted Markdown instead of image generation
// for maximum reliability in serverless environments
// ============================================

export async function receiptCommand(ctx: Context) {
  const args = ctx.match as string;

  // Usage: /recibo compra 100 USD 325
  if (!args) {
    return ctx.reply(
      "📝 *Generador de Comprobantes*\n\n" +
        "Uso: `/recibo <tipo> <monto> <moneda> <tasa>`\n\n" +
        "Ejemplo:\n`/recibo compra 100 USD 325`\n`/recibo venta 50 EUR 340`",
      { parse_mode: "Markdown" },
    );
  }

  const parts = args.trim().split(/\s+/);
  if (parts.length < 4) {
    return ctx.reply("❌ Faltan datos. Ejemplo: `/recibo compra 100 USD 325`", {
      parse_mode: "Markdown",
    });
  }

  const typeStr = parts[0].toLowerCase();
  const amountStr = parts[1];
  const currencyStr = parts[2].toUpperCase();
  const rateStr = parts[3];

  // Validate Type
  let type: "COMPRA" | "VENTA";
  if (typeStr.startsWith("comp") || typeStr === "buy") type = "COMPRA";
  else if (typeStr.startsWith("vent") || typeStr === "sell") type = "VENTA";
  else return ctx.reply("❌ Tipo inválido. Usa 'compra' o 'venta'.");

  // Validate Numbers
  const amount = parseFloat(amountStr);
  const rate = parseFloat(rateStr);

  if (isNaN(amount) || isNaN(rate)) {
    return ctx.reply("❌ Monto o tasa inválidos. Asegúrate de usar números.");
  }

  // Validate Currency
  const normalizedCurrency =
    currencyStr === "USDT" || currencyStr === "TRC20"
      ? "USDT_TRC20"
      : currencyStr;

  if (!CURRENCIES.includes(normalizedCurrency as Currency)) {
    return ctx.reply(`❌ Moneda no soportada: ${currencyStr}`);
  }

  // Calculate total
  const total = amount * rate;

  // Get currency metadata for flag
  const currencyMeta = CURRENCY_META[normalizedCurrency as Currency];
  const flag = currencyMeta?.flag || "💵";

  // Format numbers with locale
  const fmtAmount = amount.toLocaleString("es-CU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const fmtRate = rate.toLocaleString("es-CU");
  const fmtTotal = total.toLocaleString("es-CU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  // Format date/time
  const now = new Date();
  const dateStr = now.toLocaleDateString("es-CU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("es-CU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Build receipt message with Unicode block characters
  const isBuy = type === "COMPRA";
  const statusEmoji = isBuy ? "🟢" : "🟡";
  const actionVerb = isBuy ? "Pagado" : "Recibido";

  const receipt = `
┌─────────────────────────┐
│      *Fulean2* 🇨🇺       │
│   ${dateStr} • ${timeStr}   │
├─────────────────────────┤
│                         │
│   ${statusEmoji} *${type}*                │
│                         │
│  ${flag} Monto: *${fmtAmount} ${currencyStr}*    │
│  📊 Tasa: ${fmtRate} CUP        │
│                         │
├─────────────────────────┤
│                         │
│  💰 ${actionVerb}:              │
│  *${fmtTotal} CUP*              │
│                         │
└─────────────────────────┘
      _Comprobante Digital_
`;

  await ctx.reply(receipt.trim(), { parse_mode: "Markdown" });
}
