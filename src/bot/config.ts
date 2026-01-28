import { Bot } from "grammy";

export const getBotToken = () => {
  // Check both standard Node process.env (for Vercel) and Astro import.meta.env
  const token =
    import.meta.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not set in environment variables.");
  }
  return token;
};
