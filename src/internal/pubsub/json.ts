import { declareAndBind } from "./queue.js";

export async function publishJSON<T>(
  ch: ConfirmChannel,
  exchange: string,
  routingKey: string,
  value: T,
): Promise<void>
{
  const content = JSON.stringify(value);
  const buffer = Buffer.from(content);
  await ch.publish(
    exchange, routingKey, buffer, {"contentType": "application/json"}
  );
}

export async function subscribeJSON<T>(
  conn: amqp.ChannelModel,
  exchange: string,
  queueName: string,
  key: string,
  queueType: SimpleQueueType,
  handler: (data: T) => void,
): Promise<void> {
  const {channel, _} = await declareAndBind(
    conn,
    exchange,
    queueName,
    key,
    queueType
  );
  const callback = async function (
    message: amqp.ConsumeMessage | null
  ): Promise<void> {
    if (!message) {
      return;
    }
    try {
      const content = await JSON.parse(message.content.toString());
      handler(content);
      channel.ack(message);
    } catch (err) {
      console.error("Error parsing message:", err);
      return;
    }
  };
  await channel.consume(queueName, callback);
}

