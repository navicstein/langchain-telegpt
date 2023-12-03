import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Chat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  messageText: string;

  @Column()
  teleChatId: string;

  @Column()
  role: ChatMessageRole;

  @Column({ nullable: true, type: "datetime" })
  createdAt: Date;
}

export enum ChatMessageRole {
  HUMAN = "human",
  AI = "ai",
}
