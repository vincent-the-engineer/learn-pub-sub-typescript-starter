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

