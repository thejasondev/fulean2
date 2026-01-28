import { Bot } from "grammy";
import { getBotToken } from "./config";

import { calcCommand } from "./commands/calc";
import { receiptCommand } from "./commands/receipt";
import { ratesCommand } from "./commands/rates";

// Singleton to avoid multiple instances in dev mode
let botInstance: Bot | null = null;

export const initBot = () => {
  if (botInstance) return botInstance;

  try {
    const token = getBotToken();
    const bot = new Bot(token);

    // Register Middlewares
    bot.use(async (ctx, next) => {
      const start = Date.now();
      await next();
      const ms = Date.now() - start;
      console.log(`Response time: ${ms}ms`);
    });

    // Register Commands
    bot.command("start", (ctx) =>
      ctx.reply(
        "¡Hola! Soy el bot de Fulean2. 🇨🇺\n\nEstoy aquí para ayudarte con tasas de cambio y comprobantes.\n\nComandos:\n/tasas - Ver tasas del día\n/recibo - Crear comprobante\n/calc - Calculadora rápida",
      ),
    );

    bot.command("help", (ctx) =>
      ctx.reply(
        "Comandos disponibles:\n/recibo - Generar comprobante\n/calc - Calculadora\n/tasas - Ver tasas",
      ),
    );

    bot.command("calc", calcCommand);
    bot.command("recibo", receiptCommand);
    bot.command("tasas", ratesCommand);

    // Error handling
    bot.catch((err) => {
      console.error(`Error while handling update ${err.ctx.update.update_id}:`);
      console.error(err.error);
    });

    botInstance = bot;
    return bot;
  } catch (error) {
    console.error("Failed to initialize bot:", error);
    // Fallback for build time where env might be missing
    return new Bot("dummy_token");
  }
};
