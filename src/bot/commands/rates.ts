import type { Context } from "grammy";
import { getLiveRates } from "../services/rates";

export async function ratesCommand(ctx: Context) {
  const rates = await getLiveRates();

  const formatter = new Intl.NumberFormat("es-CU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  const date = new Date(rates.lastUpdate).toLocaleDateString("es-CU");
  const time = new Date(rates.lastUpdate).toLocaleTimeString("es-CU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Table format using monospace code block
  // 🇺🇸 USD   325.00
  // 🇪🇺 EUR   340.00
  // ...

  const rows = [
    `🇺🇸 USD   ${formatter.format(rates.USD)}`,
    `🇪🇺 EUR   ${formatter.format(rates.EUR)}`,
    `💳 MLC   ${formatter.format(rates.MLC)}`,
    `🇨🇦 CAD   ${formatter.format(rates.CAD)}`,
    `📱 Zelle ${formatter.format(rates.ZELLE)}`,
    `🪙 USDT  ${formatter.format(rates.USDT_TRC20)}`,
  ];

  await ctx.reply(
    `📊 *Tasas de Cambio Actuales*\n` +
      `📅 _${date} - ${time}_\n\n` +
      `\`\`\`\n` + // Start code block for alignment
      rows.join("\n") +
      `\n\`\`\`` +
      `\n\n_Fuente: El Toque_`,
    { parse_mode: "Markdown" },
  );
}
