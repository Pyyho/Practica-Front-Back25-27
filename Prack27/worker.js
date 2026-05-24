import amqplib from 'amqplib';
import { randomInt } from 'crypto';

const RABBIT_URL = 'amqp://localhost';
const QUEUE = 'tasks_queue';
const MAX_RETRIES = 3;

const WORKER_ID = process.env.WORKER_ID || `worker-${randomInt(1000, 9999)}`;

async function startWorker() {
  const connection = await amqplib.connect(RABBIT_URL);
  const channel = await connection.createChannel();
  await channel.assertQueue(QUEUE, { durable: true });

  // Каждый воркер берёт не более 1 задачи за раз
  channel.prefetch(1);

  console.log(`[${WORKER_ID}] Ожидание задач...`);

  channel.consume(QUEUE, async (msg) => {
    if (!msg) return;

    const task = JSON.parse(msg.content.toString());
    const retryCount = msg.properties.headers?.['x-retry-count'] || 0;

    console.log(`[${WORKER_ID}] Получена задача: ${JSON.stringify(task)}, попытка ${retryCount + 1}/${MAX_RETRIES}`);

    try {
      // Имитация обработки (успех с вероятностью 30%)
      await processTask(task);
      console.log(`[${WORKER_ID}] ✅ Задача выполнена успешно`);
      channel.ack(msg);
    } catch (err) {
      console.error(`[${WORKER_ID}] ❌ Ошибка: ${err.message}`);

      if (retryCount < MAX_RETRIES - 1) {
        // Экспоненциальная задержка перед повторной отправкой
        const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
        console.log(`[${WORKER_ID}] Повтор через ${delay} мс (попытка ${retryCount + 2})`);

        // Отклоняем текущее сообщение (не возвращаем в очередь)
        channel.nack(msg, false, false);

        // Публикуем новое сообщение с увеличенным счётчиком retry
        const newHeaders = { 'x-retry-count': retryCount + 1 };
        await new Promise(resolve => setTimeout(resolve, delay));
        channel.sendToQueue(QUEUE, msg.content, {
          persistent: true,
          headers: newHeaders,
        });
      } else {
        // Исчерпаны все попытки – сообщение будет отправлено в DLX
        console.error(`[${WORKER_ID}] 💀 Задача отправлена в Dead Letter Queue (DLQ)`);
        channel.nack(msg, false, false); // без повторной отправки
      }
    }
  });
}

// Имитация обработки задачи (случайный успех/неудача)
async function processTask(task) {
  console.log(`[Worker] Обработка: ${task.type} -> ${JSON.stringify(task.payload)}`);
  // Имитация задержки (выполнение задачи)
  await new Promise(resolve => setTimeout(resolve, 500));

  // 70% ошибка, 30% успех – для демонстрации retry
  if (Math.random() < 0.7) {
    throw new Error('Временная ошибка обработки (имитация)');
  }
  return true;
}

startWorker().catch(console.error);