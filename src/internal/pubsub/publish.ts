import { encode } from "@msgpack/msgpack";

export function publishMsgPack<T>(
  ch: ConfirmChannel,
  exchange: string,
  routingKey: string,
  value: T,
): Promise<void>
{
  const encoded = encode(value);
  const buffer = Buffer.from(encoded);
  return new Promise((resolve, reject) => {
    ch.publish(
      exchange,
      routingKey,
      buffer,
      { "contentType": "application/x-msgpack" },
      (err) => {
        if (err !== null) {
          reject(new Error("Message failed"));
        } else {
          resolve();
        }
      }
    )
  });
}

