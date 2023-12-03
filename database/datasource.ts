import "reflect-metadata"

import { DataSource } from "typeorm";
import { Chat } from "./models/chat_model";

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: "database.sqlite3",
  synchronize: true,
  logging: true,
  entities: [Chat],
  subscribers: [],
  migrations: [],
});
