import amqplib from 'amqplib';

const RABBIT_URL = 'amqp://localhost';

async function setupQueues() {
  const connection = await amqplib.connect(RABBIT_URL);
  const channel = await connection.createChannel();

  // 1. Dead Letter Exchange (direct)
  await channel.assertExchange('dlx_exchange', 'direct', { durable: true });

  // 2. Dead Letter Queue
  await channel.assertQueue('dead_letter_queue', { durable: true });

  // 3. Привязка DLQ к DLX
  await channel.bindQueue('dead_letter_queue', 'dlx_exchange', 'dead');

  // 4. Основная очередь с политикой DLX и TTL (опционально)
  await channel.assertQueue('tasks_queue', {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': 'dlx_exchange',
      'x-dead-letter-routing-key': 'dead',
      // 'x-message-ttl': 60000,  // время жизни сообщения (не обязательно)
    },
  });

  console.log('✅ Очереди настроены: tasks_queue (основная), dead_letter_queue (DLQ)');
  await channel.close();
  await connection.close();
}

setupQueues().catch(console.error);