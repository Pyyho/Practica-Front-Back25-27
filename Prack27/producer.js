import express from 'express';
import amqplib from 'amqplib';

const RABBIT_URL = 'amqp://localhost';
const QUEUE = 'tasks_queue';

const app = express();
app.use(express.json());

async function publishTask(task) {
  const connection = await amqplib.connect(RABBIT_URL);
  const channel = await connection.createChannel();
  await channel.assertQueue(QUEUE, { durable: true });

  const message = JSON.stringify(task);
  channel.sendToQueue(QUEUE, Buffer.from(message), { persistent: true });
  console.log(`[Producer] Задача опубликована: ${message}`);

  setTimeout(() => connection.close(), 500);
}

app.post('/tasks', (req, res) => {
  const task = req.body;
  if (!task.type || !task.payload) {
    return res.status(400).json({ error: 'Необходимы поля type и payload' });
  }
  publishTask(task);
  res.status(202).json({ status: 'accepted', task });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Producer API запущен на http://localhost:${PORT}`);
});