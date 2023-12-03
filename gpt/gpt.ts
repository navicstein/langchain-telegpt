import { Embeddings } from "langchain/dist/embeddings/base";
import { logger } from "../logger/logger";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { ConversationChain } from "langchain/chains";
import { BufferMemory, ChatMessageHistory } from "langchain/memory";
import { ChatOllama } from "langchain/chat_models/ollama";
import { resolve } from "node:path";
import { writeFile, readFile } from "node:fs/promises";
import OpenAI from "openai";
import { snakeCase } from "lodash";
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
  MessagesPlaceholder,
} from "langchain/prompts";
import { ConsoleCallbackHandler } from "langchain/callbacks";
import { AIMessage, HumanMessage } from "langchain/schema";
import { SimpleChatModel } from "langchain/dist/chat_models/base";
import { AppDataSource } from "../database/datasource";
import { chatRepository } from "../database/repositories";
import { Chat, ChatMessageRole } from "../database/models/chat_model";

export class GPT {
  private readonly logger = logger(GPT.name);
  private readonly openai = new OpenAI();
  private readonly memory = new BufferMemory({
    returnMessages: true,
    memoryKey: "history",
    chatHistory: new ChatMessageHistory([
      new HumanMessage("My name's Jonas"),
      new AIMessage("Nice to meet you, Jonas!"),
    ]),
  });

  private messages: Array<OpenAI.ChatCompletionMessageParam> = [];

  private readonly model: SimpleChatModel | ChatOpenAI;
  private conversationChain: ConversationChain;
  constructor() {
    const modelName = process.env.MODEL_NAME;
    if (modelName === "openai") {
      this.model = new ChatOpenAI();
    } else if (modelName === "ollama") {
      this.model = new ChatOllama({
        baseUrl: "http://localhost:11434",
        model: "llama2",
      });
    } else {
      throw new Error("unrecognized model");
    }

    this.conversationChain = new ConversationChain({
      llm: this.model,
      memory: this.memory,
    });

    AppDataSource.initialize()
      .then(() => {
        this.logger.info("[AppDataSource] database initialized");
      })
      .catch((error) => console.log(error));
  }

  /**
   *
   * @param msg
   * @param role
   * @param teleChatId
   */
  private async createChatMessage(
    msg: string,
    role: string | ChatMessageRole,
    teleChatId: string
  ): Promise<Chat> {
    return chatRepository.save({
      messageText: msg,
      role: role as ChatMessageRole,
      teleChatId: teleChatId,
      createdAt: new Date(),
    });
  }
  /**
   *  Text to speech
   * @param text
   */
  async TTS(text: string): Promise<string> {
    const path = process.cwd();
    const filePath = resolve(path, "audios", `${snakeCase(text)}.mp3`);
    const f = await this.openai.audio.speech.create({
      model: "tts-1",
      voice: "onyx",
      input: text,
    });

    const b = Buffer.from(await f.arrayBuffer());
    await writeFile(filePath, b);

    this.logger.debug("Wrote file to:", { filePath });
    return filePath;
  }

  /**
   * Speech to text
   * @param text
   */
  async STT(audioPath: string): Promise<string> {
    return "";
  }

  // public async getLLMTextV2(text: string): Promise<string> {
  //   this.logger.silly("[getLLMText]", { text });

  //   this.messages.push({
  //     content: text,
  //     role: "user",
  //   });
  //   const chatCompletion = await this.openai.chat.completions.create({
  //     messages: this.messages,
  //     model: "gpt-3.5-turbo",
  //   });

  //   this.messages.push({
  //     content: chatCompletion.choices[0].message.content,
  //     role: "assistant",
  //   });

  //   const response = chatCompletion.choices[0].message.content as string;
  //   return response;
  // }

  /**
   *
   * @param text
   * @returns
   */
  public async getLLMText(
    text: string,
    chatId: string | null
  ): Promise<string> {
    this.logger.silly("[getLLMText]", { text });

    await this.createChatMessage(text, ChatMessageRole.HUMAN, chatId as string);
    const personaPath = resolve(process.cwd(), "prompts", "persona.txt");

    const f = await readFile(personaPath, { encoding: "utf-8" });
    const systemInstruction = f.toString();

    const chatPrompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(systemInstruction),
      HumanMessagePromptTemplate.fromTemplate(`{chat_message}`),
    ]);

    this.conversationChain.prompt = chatPrompt;

    const { response } = await this.conversationChain.call({
      chat_message: text,
    });

    await this.createChatMessage(
      response,
      ChatMessageRole.AI,
      chatId as string
    );

    return response;
  }
}
