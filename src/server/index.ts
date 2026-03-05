import amqp from "amqplib";

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
  const playingState: PlayingState = { isPaused: true };
  publishJSON<PlayingState>(
    channel,
    ExchangePerilDirect,
    PauseKey,
    playingState
  );

  ["SIGINT", "SIGTERM"].forEach((signal) =>
    process.on(signal, async () => {
      try{
        await conn.close();
        console.log("Peril server closed connection to RabbitMQ");
      } catch (err) {
        console.log("Error closing RabbitMQ connection: ", err);
      } finally {
        process.exit(0);
      }
    })
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
