import { ExchangePerilDead } from "../routing/routing.js";

export enum SimpleQueueType {
  Durable,
  Transient,
}

export async function declareAndBind(
  conn: amqp.ChannelModel,
  exchange: string,
  queueName: string,
  key: string,
  queueType: SimpleQueueType,
): Promise<[Channel, amqp.Replies.AssertQueue]>
{
  const channel = await conn.createChannel();
  const queue = await channel.assertQueue(
    queueName,
    {
      "exclusive": (queueType === SimpleQueueType.Transient),
      "durable": (queueType === SimpleQueueType.Durable),
      "autoDelete": (queueType === SimpleQueueType.Transient),
      "arguments": {
        "x-dead-letter-exchange": `${ExchangePerilDead}`,
      },
    }
  );
  await channel.bindQueue(queueName, exchange, key);
  return {
    channel: channel,
    queue: queue,
  };
}

