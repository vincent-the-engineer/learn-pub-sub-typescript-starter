import amqp from "amqplib";

import { handlerPause } from "./handlers.js";
import {
  clientWelcome,
  commandStatus,
  getInput,
  printClientHelp,
} from "../internal/gamelogic/gamelogic.js";
import { GameState } from "../internal/gamelogic/gamestate.js";
import { commandMove } from "../internal/gamelogic/move.js";
import { commandSpawn } from "../internal/gamelogic/spawn.js";
import { subscribeJSON } from "../internal/pubsub/json.js";
import {
  SimpleQueueType,
  declareAndBind,
} from "../internal/pubsub/queue.js";
import {
  ExchangePerilDirect,
  PauseKey,
} from "../internal/routing/routing.js";


async function main() {
  const rabbitConnString = "amqp://guest:guest@localhost:5672/";
  const conn = await amqp.connect(rabbitConnString);
  console.log("Peril client connected to RabbitMQ");

  ["SIGINT", "SIGTERM"].forEach((signal) =>
    process.on(signal, async () => {
      try {
        await conn.close();
        console.log("Peril client closed connection to RabbitMQ");
      } catch (err) {
        console.error("Error closing RabbitMQ connection: ", err);
      } finally {
        process.exit(0);
      }
    })
  );

  const username = await clientWelcome();
  const gameState = new GameState(username);

  await subscribeJSON<PlayingState>(
    conn,
    ExchangePerilDirect,
    `pause.${username}`,
    PauseKey,
    SimpleQueueType.Transient,
    handlerPause(gameState)
  );

  while (true) {
    const inputWords = await getInput();
    if (!inputWords || inputWords.length === 0) {
      continue;
    }
    const command = inputWords[0];
    if (command === "spawn") {
      try {
        commandSpawn(gameState, inputWords);
      } catch (err) {
        console.log(err.message);
      }
      continue;
    } else if (command === "move") {
      try {
        commandMove(gameState, inputWords);
      } catch (err) {
        console.log(err.message);
      }
      continue;
    } else if (command === "status") {
      try {
        commandStatus(gameState);
      } catch (err) {
        console.log(err.message);
      }
      continue;
    } else if (command === "help") {
      try {
        printClientHelp();
      } catch (err) {
        console.log(err.message);
      }
      continue;
    } else if (command === "spam") {
      console.log("Spamming not allowed yet!");
      continue;
    } else if (command === "quit") {
      process.exit(0);
    }
    console.log("Unknown command");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
