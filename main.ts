import "dotenv/config";

import { EventEmitter } from "node:events";
import { createReadStream } from "node:fs";
import TelegramBot from "node-telegram-bot-api";
import { logger } from "./logger/logger";
import { GPT } from "./gpt/gpt";
import { AppDataSource } from "./database/datasource";

const telegramToken = process.env.TELEGRAM_API_KEY as string;

export class NaviAI extends EventEmitter {
  private readonly logger = logger(NaviAI.name);
  private readonly gpt = new GPT();

  private readonly telegramClient = new TelegramBot(telegramToken, {
    polling: true,
  });

  constructor() {
    super();
  }

  /**
   * proxy function
   * @param text
   * @returns
   */
  public async queryAI(text: string): Promise<string> {
    return this.gpt.getLLMText(text, null);
  }

  /**
   * main handler for telegram
   */
  public registerAndServe() {
    this.telegramClient.on("message", async (msg: TelegramBot.Message) => {
      const chatId = msg.chat.id;
      const isAudio = Object.keys(msg.voice || ({} as Object)).length > 0;

      if (isAudio) {
        this.telegramClient.sendMessage(
          chatId,
          "sorry, i can't listen to the audio note at the moment, can you try sending it as text intead?"
        );
        return;
      }

      if (!msg.text) {
        return;
      }

      const response = await this.gpt.getLLMText(msg.text as string, String(chatId));
      this.logger.silly("[response]:", response);
      this.telegramClient.sendMessage(chatId, response);
    });

    this.logger.silly("initiallzed telegram client");
  }
}

try {
  let ai = new NaviAI();
  ai.registerAndServe();
} catch (err) {
  throw err;
}
