import Readline from "node:readline/promises";
import { NaviAI } from "../main";

const readline = Readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

(async () => {
  let ai = new NaviAI();

  do {
    const question = await readline.question(`\n Your question: `);
    
    if (question == "exit") {
      process.exit(0);
    }

    const answer = await ai.queryAI(question);
    console.log("[CMD]:", answer);
  } while (true);
})();
