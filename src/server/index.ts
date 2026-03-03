import amqp from "amqplib";

async function main() {
  const rabbitConnString = "amqp://guest:guest@localhost:5672/";
  const conn = await amqp.connect(rabbitConnString);
  console.log("Peril server connected to RabbitMQ");
  process.on("SIGINT", async () => {
    try{
      await conn.close();
      console.log("Peril server closed connection to RabbitMQ");
    } catch (err) {
      console.log("Error closing RabbitMQ connection: ", err);
    } finally {
      process.exit(0);
    }
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
