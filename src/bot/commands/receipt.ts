import { InputFile } from "grammy";
import type { Context } from "grammy";
import { generateReceiptImage } from "../utils/renderReceipt";
import { DEFAULT_RATES, CURRENCIES, type Currency } from "../../lib/constants";

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
  // Simple check
  if (
    !CURRENCIES.includes(currencyStr as Currency) &&
    !["USDT", "TRC20"].includes(currencyStr)
  ) {
    return ctx.reply(`❌ Moneda no soportada: ${currencyStr}`);
  }

  await ctx.replyWithChatAction("upload_photo");

  try {
    const imageBuffer = await generateReceiptImage({
      type,
      amount,
      currency: currencyStr,
      rate,
      total: amount * rate,
      date: new Date(),
    });

    await ctx.replyWithPhoto(new InputFile(imageBuffer, "recibo.png"), {
      caption: `🧾 *Comprobante Generado* con Fulean2`,
      parse_mode: "Markdown",
    });
  } catch (error) {
    console.error(error);
    await ctx.reply("❌ Error generando la imagen. Intenta de nuevo.");
  }
}
