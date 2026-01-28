import { Bot } from "grammy";
import { getBotToken } from "./config";

import { calcCommand } from "./commands/calc";
import { receiptCommand } from "./commands/receipt";
import { ratesCommand } from "./commands/rates";
import { inlineQueryHandler } from "./handlers/inline";

// Singleton to avoid multiple instances in dev mode
let botInstance: Bot | null = null;
let commandsRegistered = false;

// Command definitions for Telegram autocomplete
const BOT_COMMANDS = [
  { command: "start", description: "🚀 Iniciar el bot" },
  { command: "tasas", description: "📊 Ver tasas de cambio actuales" },
  { command: "calc", description: "🧮 Calculadora: /calc 100 USD [tasa]" },
  { command: "recibo", description: "🧾 Generar comprobante de operación" },
  { command: "help", description: "❓ Ver comandos disponibles" },
];

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

    // Register commands with Telegram API for autocomplete (once)
    if (!commandsRegistered && token !== "dummy_token") {
      bot.api
        .setMyCommands(BOT_COMMANDS)
        .then(() => {
          console.log("✅ Bot commands registered with Telegram");
          commandsRegistered = true;
        })
        .catch((e) => console.warn("Failed to register commands:", e));
    }

    // Register Commands
    bot.command("start", (ctx) =>
      ctx.reply(
        "¡Hola! Soy el bot de Fulean2. 🇨🇺\n\nEstoy aquí para ayudarte con tasas de cambio y comprobantes.\n\nComandos:\n/tasas - Ver tasas del día\n/recibo - Crear comprobante\n/calc - Calculadora rápida",
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🌐 Abrir App Fulean2",
                  url: "https://fulean2.vercel.app",
                },
                { text: "🔄 Consultar Tasas", callback_data: "check_rates" },
              ],
            ],
          },
        },
      ),
    );

    bot.command("help", (ctx) =>
      ctx.reply(
        "📋 *Comandos disponibles:*\n\n" +
          "/tasas - Ver tasas de cambio actuales\n" +
          "/calc `<monto>` `<moneda>` `[tasa]` - Calculadora\n" +
          "/recibo `<tipo>` `<monto>` `<moneda>` `<tasa>` - Generar comprobante\n\n" +
          "_También puedes usar inline: @fulean2_bot 100 USD_",
        { parse_mode: "Markdown" },
      ),
    );

    bot.command("calc", calcCommand);
    bot.command("recibo", receiptCommand);
    bot.command("tasas", ratesCommand);

    // Inline Query
    bot.on("inline_query", inlineQueryHandler);

    // Callback Query for "Consultar Tasas" button
    bot.callbackQuery("check_rates", async (ctx) => {
      await ctx.answerCallbackQuery();
      await ratesCommand(ctx);
    });

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
