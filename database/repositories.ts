import { AppDataSource } from "./datasource";
import { Chat } from "./models/chat_model";

export const chatRepository = AppDataSource.getRepository(Chat);
