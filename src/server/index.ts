import amqp from "amqplib";

import {
  getInput,
  printServerHelp,
} from "../internal/gamelogic/gamelogic.js";
import { type PlayingState } from "../internal/gamelogic/gamestate.js";
import { publishJSON } from "../internal/pubsub/json.js";
import {
  ExchangePerilDirect,
  PauseKey,
} from "../internal/routing/routing.js";


async function main() {
  const rabbitConnString = "amqp://guest:guest@localhost:5672/";
  const conn = await amqp.connect(rabbitConnString);
  console.log("Peril server connected to RabbitMQ");
  const channel = await conn.createConfirmChannel();

  ["SIGINT", "SIGTERM"].forEach((signal) =>
    process.on(signal, async () => {
      try{
        await conn.close();
        console.log("Peril server closed connection to RabbitMQ");
      } catch (err) {
        console.log("Error closing RabbitMQ connection:", err);
      } finally {
        process.exit(0);
      }
    })
  );

  printServerHelp();

  while (true) {
    const inputWords = await getInput();
    if (!inputWords || inputWords.length === 0) {
      continue;
    }
    if (inputWords[0] === "pause") {
      console.log("Pausing");
      try {
        await publishJSON<PlayingState>(
          channel,
          ExchangePerilDirect,
          PauseKey,
          { isPaused: true }
        );
      } catch (err) {
        console.error("Error publishing pause message:", err);
      }
    } else if (inputWords[0] === "resume") {
      console.log("Resuming");
      try {
        await publishJSON<PlayingState>(
          channel,
          ExchangePerilDirect,
          PauseKey,
          { isPaused: false }
        );
      } catch (err) {
        console.error("Error publishing resume message:", err);
      }
    } else if (inputWords[0] === "quit") {
      console.log("Exiting");
      process.exit(0);
    } else {
      console.log("Unknown command");
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
