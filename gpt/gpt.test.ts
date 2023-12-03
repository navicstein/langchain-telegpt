import { expect, test } from "vitest";
import { GPT } from "./gpt";

const gpt = new GPT();

test("", async () => {
  const filepath = await gpt.TTS("hello world");

  expect(filepath)
});
