import { declareAndBind } from "./queue.js";

export enum AckType {
  Ack,
  NackRequeue,
  NackDiscard,
}

export async function publishJSON<T>(
  ch: ConfirmChannel,
  exchange: string,
  routingKey: string,
  value: T,
): Promise<void>
{
  const content = JSON.stringify(value);
  const buffer = Buffer.from(content);
  return new Promise((resolve, reject) => {
    ch.publish(
      exchange,
      routingKey,
      buffer,
      { "contentType": "application/json" },
      (err) => {
        if (err !== null) {
          reject(new Error("Message error"));
        } else {
          resolve();
        }
      }
    );
  });
}

export async function subscribeJSON<T>(
  conn: amqp.ChannelModel,
  exchange: string,
  queueName: string,
  key: string,
  queueType: SimpleQueueType,
  handler: (data: T) => Promise<AckType> | AckType,
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
      const awkType = await handler(content);
      if (awkType === AckType.Ack) {
        channel.ack(message);
      } else if (awkType === AckType.NackRequeue) {
        channel.nack(message, false, true);
      } else if (awkType === AckType.NackDiscard) {
        channel.nack(message, false, false);
      }
    } catch (err) {
      console.error("Error parsing message:", err);
      return;
    }
  };
  await channel.consume(queueName, callback);
}

