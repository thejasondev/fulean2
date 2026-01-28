import { webhookCallback } from "grammy";
import type { APIRoute } from "astro";
import { initBot } from "../../bot/index";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const bot = initBot();
    if (bot.token === "dummy_token") {
      return new Response("Bot not configured", { status: 503 });
    }

    const handler = webhookCallback(bot, "std/http");
    return await handler(request);
  } catch (e) {
    console.error(e);
    return new Response("Error handling webhook", { status: 500 });
  }
};

export const GET: APIRoute = async () => {
  return new Response("Fulean2 Bot is active!", { status: 200 });
};
