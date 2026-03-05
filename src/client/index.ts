import amqp from "amqplib";

import { clientWelcome } from "../internal/gamelogic/gamelogic.js";
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

  const {channel, queue} = await declareAndBind(
    conn,
    ExchangePerilDirect,
    `pause.${username}`,
    PauseKey,
    SimpleQueueType.Transient
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
