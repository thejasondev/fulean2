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

  const officialRows = [
    `🇺🇸 USD   ${formatter.format(rates.USD)}`,
    `🇪🇺 EUR   ${formatter.format(rates.EUR)}`,
    `💳 MLC   ${formatter.format(rates.MLC)}`,
    `🪙 USDT  ${formatter.format(rates.USDT_TRC20)}`,
  ];

  const estimatedRows = [
    `🇨🇦 CAD   ${formatter.format(rates.CAD)}`,
    `📱 Zelle ${formatter.format(rates.ZELLE)}`,
  ];

  await ctx.reply(
    `📊 *Tasas de Cambio Actuales*\n` +
      `📅 _${date} - ${time}_\n\n` +
      `*Oficiales (El Toque):*\n` +
      `\`\`\`\n` +
      officialRows.join("\n") +
      `\n\`\`\`\n` +
      `*Otras (Estimadas):*\n` +
      `\`\`\`\n` +
      estimatedRows.join("\n") +
      `\n\`\`\`\n` +
      `\n_Fuente: El Toque (Oficiales) & Fulean2 (Estimadas)_`,
    { parse_mode: "Markdown" },
  );
}
