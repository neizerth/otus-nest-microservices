# Микросервисы с NestJS

> Презентация для VS Code Reveal: [`slides.md`](slides.md) (расширение `evilz.vscode-reveal`)

**Вебинар OTUS** · [otus.ru](https://otus.ru)

**Спикер:** Владимир Языков  
Powertech. Tech Lead / Principal Engineer

**О себе:**

- в IT 10+ лет
- последние несколько лет Tech Lead в Digital Advertising High-Load проекте
- пишу на TS / Golang; PostgreSQL и MongoDB
- в OTUS — 3 года, более 150 вебинаров и более 1000 студентов
- преподаватель курсов Node.JS / MongoDB / PostgresDBA / NoSQL и др. в OTUS

**Блог:** https://medium.com/@nlapshin1989

---

## Правила вебинара

- Активно участвуем
- Off-topic обсуждаем в Telegram
- Задаём вопросы в чат или голосом
- Вопросы в чате видны, ответ может быть не сразу

**Условные обозначения:** индивидуально · время на активность · пишем в чат · говорим голосом · документ · ответьте себе или задайте вопрос

---

## Цели вебинара

После занятия вы сможете:

1. Сравнить монолиты и микросервисы
2. Написать первый микросервис на NestJS

## Маршрут вебинара

1. Монолиты и микросервисы
2. Микросервисы с NestJS
3. Рефлексия

---

# Микросервисная архитектура

## Монолитная архитектура

- **Быстрый старт и простота разработки.** Проще проектировать, нет необходимости настраивать взаимодействие между сервисами.
- **Взаимодействие между модулями внутри приложения.** Работа с транзакциями и объединениями проще.
- **Единое развёртывание.** Развёртывается один сервис полностью.
- **Единые технологии.** Один стек технологий.
- **Цельная архитектура.** Одинаковый подход при создании модулей.

### Схема

![Монолитная архитектура](ppt/media/image16.png)

Все поддомены (`A`, `B`, `C`) живут внутри одного приложения; system operations вызывают методы напрямую.

---

## Микросервисная архитектура

- **Модульность.** Каждый сервис — отдельная функция или набор функций с чётко изолированным интерфейсом.
- **Взаимодействие между сервисами.** Для получения информации из чужой области видимости идёт запрос к специальному сервису.
- **Каждый микросервис развёртывается отдельно.**
- **Гибкие технологии.** Для каждого сервиса может быть свой стек.
- **Гибкость требований.** Разные сервисы имеют разные технологические требования.

### Схема

![Микросервисная архитектура](ppt/media/image10.png)

Поддомены вынесены в отдельные сервисы; system operations и сервисы общаются через порты/интерфейсы.

---

## Микросервисы. Преимущества

- **Linux way.** Каждый сервис — отдельная функция или набор функций с чётко изолированным интерфейсом.
- **Гибкость разработки.** Можно использовать инструменты и собирать команду под задачу.
- **Независимость развёртывания.** Каждый сервис деплоится отдельно.

## Микросервисы. Сложности

- Сложности при работе с разными микросервисами: транзакции, join, логирование.
- Тщательное проектирование — ошибки могут быть дорогими.
- Разные подходы при реализации отдельных сервисов.
- Свой набор паттернов.
- **Сеть.** Задержка между серверами не равна нулю; сеть нестабильна и ненадёжна.

## Микросервисы. Паттерны

- **Domain-Driven Design (DDD).** Проектирование микросервисов вокруг доменной модели.
- **Service registry / discovery.** Сервисы автоматически находят друг друга в динамически меняющемся окружении.
- **API Gateway.** Один из сервисов — точка входа для других.
- **Retry requests.** Защита от невыполненных запросов.
- **Event sourcing.** Сохранение изменений состояния как последовательности событий.
- **Request Correlation ID.** Запрос затрагивает несколько микросервисов — формируется id запроса.

### Паттерн Request Correlation ID

Один HTTP-запрос проходит через несколько сервисов. Чтобы связать логи и события, всем участникам передаём один и тот же `correlationId`.

```text
Клиент                Gateway              Users               Mailer
  │                      │                   │                   │
  │  x-correlation-id    │                   │                   │
  │  demo-001 ──────────►│                   │                   │
  │                      │  payload + id     │                   │
  │                      │ ─────────────────►│                   │
  │                      │                   │  payload + id     │
  │                      │                   │ ─────────────────►│
  │  header в ответе     │                   │  лог + letter     │
  │◄─────────────────────│                   │                   │
```

### Correlation ID. Где это полезно

Без общего id в логах Users, Mailer и Gateway — три разных потока. С id — одна «нить» от клика пользователя до письма.

- **Отладка и поддержка.** Пользователь пишет «не пришло письмо» — по `correlationId` из ответа API находите цепочку gateway → users → mailer за секунды.
- **Распределённый трейсинг (лёгкий).** Пока нет полного OpenTelemetry — correlation id уже связывает логи нескольких сервисов (ELK, Loki, CloudWatch).
- **Инциденты в проде.** В алерте и в тикете один и тот же id: меньше «а в каком сервисе смотреть?».
- **Аудит и compliance.** В event store / audit log видно, какой внешний запрос породил изменение (`UserCreated` с тем же id).
- **Ретраи и идемпотентность.** При retry можно отличить «тот же запрос клиента» от нового и не плодить дубликаты (вместе с idempotency-key).
- **Сквозные метрики.** Считаете latency/ошибки не по сервису, а по бизнес-операции «регистрация» целиком.

**Когда особенно нужен:** цепочка из 2+ сервисов, async/брокер, разные команды смотрят разные логи.

**Когда можно обойтись:** один монолит, один лог-файл, нет межсервисных вызовов.

**1. Middleware** — взять id из заголовка или сгенерировать:

```typescript
// apps/api-gateway/src/correlation.middleware.ts
const incoming = req.header('x-correlation-id');
const correlationId = incoming?.trim() || randomUUID();
res.setHeader('x-correlation-id', correlationId);
```

**2. Gateway** — прокинуть id в payload микросервиса:

```typescript
// apps/api-gateway/src/api-gateway.controller.ts
@Post('users')
createUser(
  @Body() body: { email: string; name: string },
  @Headers('x-correlation-id') correlationId: string,
) {
  return this.gateway.createUser({ ...body, correlationId });
}
```

**3. Users → Mailer** — тот же id уходит дальше и пишется в событие:

```typescript
// apps/users/src/users.service.ts
this.events.append({ type: 'UserCreated', correlationId: dto.correlationId, ... });
this.mailer.send({ cmd: 'user-create' }, { email, name, correlationId: dto.correlationId });
```

**Проверка:**

```bash
curl -i -X POST http://127.0.0.1:3000/users \
  -H 'content-type: application/json' \
  -H 'x-correlation-id: demo-001' \
  -d '{"email":"anna@example.com","name":"Anna"}'
```

В ответе будет заголовок `x-correlation-id: demo-001`, в логах Users/Mailer — тот же id, в `GET /users/:id/events` — поле `correlationId`.

### Паттерн DDD

- **DDD** — способ проектирования ПО вокруг доменной модели предметной области и разделение архитектуры на слои.
- Разбиваем систему на контексты, каждый со своей моделью.
- Для каждой модели формируем уровни абстракции через паттерны: репозиторий, сервис, агрегатор и пр.

## Взаимодействие между сервисами

- Для взаимодействия используются **брокеры сообщений**.
- Основные брокеры: RabbitMQ, Apache Kafka, NATS, Redis (Pub/Sub).
- Возможно взаимодействие через HTTP или **gRPC**.

### Брокеры. В чём разница

Брокер — посредник между сервисами: отправитель не знает, кто и когда обработает сообщение.

- **Redis Pub/Sub**
  - Модель: Pub/Sub (часто fire-and-forget)
  - Хранение: по умолчанию **не хранит** (сообщение «пролетело»)
  - Порядок: не гарантирует строго
  - Масштаб: просто, для небольшой/средней нагрузки
  - Когда брать: демо, кэш + простая сигнализация, NestJS-примеры
- **Apache Kafka**
  - Модель: лог событий (commit log)
  - Хранение: **хранит** долго, можно перечитать
  - Порядок: внутри partition
  - Масштаб: высокий throughput, стриминг
  - Когда брать: аудит, event streaming, много consumers
- **RabbitMQ**
  - Модель: очереди + маршрутизация
  - Хранение: до ack (или TTL)
  - Порядок: в пределах очереди
  - Масштаб: классические очереди задач
  - Когда брать: RPC-подобные задачи, routing
- **NATS**
  - Модель: лёгкий messaging
  - Хранение: опционально (JetStream)
  - Порядок: зависит от режима
  - Масштаб: очень быстрый, cloud-native
  - Когда брать: микросервисы с низкой задержкой

**Коротко:** Redis — «сейчас всем, кто слушает». Kafka — «запиши в лог, прочитай когда нужно (и сколько раз нужно)».

### Redis vs Kafka

- **Что это в первую очередь**
  - Redis: in-memory store + Pub/Sub
  - Kafka: платформа потоков событий
- **Гарантия доставки**
  - Redis: слабая — подписчик offline → сообщение потеряно*
  - Kafka: сильная — сообщение в топике, consumer догонит
- **Replay истории**
  - Redis: нет (Pub/Sub)
  - Kafka: да — offset / consumer group
- **Сложность эксплуатации**
  - Redis: низкая (один контейнер)
  - Kafka: выше (брокеры, топики, partitions, retention)
- **Типичный сценарий**
  - Redis: уведомления, кэш, учебный NestJS transport
  - Kafka: аналитика, CDC, event-driven архитектура
- **В этом демо**
  - Redis: ✅ `Transport.REDIS`
  - Kafka: ✗ не используем (намеренно проще для старта)

\*у Redis есть и Streams (ближе к Kafka по идее), но NestJS `Transport.REDIS` опирается на Pub/Sub.

**Правило выбора:**

- нужен **быстрый старт / учебный пример / эфемерные команды** → Redis;
- нужен **журнал событий, несколько независимых читателей, replay** → Kafka.

### Как работает Kafka: журнал, читатели, replay

Представьте топик `user.created` как **тетрадь**, в которую только дописывают строки. Никто не стирает чужие записи «потому что письмо уже ушло» — письмо ушло у Mailer, а Analytics ещё может прочитать ту же строку.

```text
Users (producer) ──writes──►  [ user.created log ]
                              offset 0: Anna
                              offset 1: Boris
                              offset 2: Clara
                                     │
          ┌──────────────────────────┼──────────────────────────┐
          ▼                          ▼                          ▼
   group: mailer              group: analytics            group: audit
   (свой курсор/offset)       (свой курсор/offset)        (свой курсор)
```

**1. Журнал событий (commit log)**  
Сообщение не «забирается из очереди и исчезает», а **дописывается** в топик и живёт по retention (часы/дни/недели). Producer пишет, consumers читают.

**2. Несколько независимых читателей (consumer groups)**  
Разные сервисы = разные `groupId`. Каждый group ведёт **свой offset** (где остановился). Mailer на offset 5, Analytics ещё на 2 — друг другу не мешают. Одно и то же событие обрабатывается всеми группами.

**3. Replay**  
Новый сервис или багфикс: выставить offset в начало (или на нужный момент) и **прочитать историю заново**. В Redis Pub/Sub этого нет — кто был offline, тот событие потерял.

#### Пример: один producer, два независимых consumer (kafkajs)

```typescript
import { Kafka } from 'kafkajs';

const kafka = new Kafka({ brokers: ['localhost:9092'] });

// Users — пишет в журнал
const producer = kafka.producer();
await producer.connect();
await producer.send({
  topic: 'user.created',
  messages: [
    { key: 'anna', value: JSON.stringify({ email: 'anna@example.com' }) },
  ],
});

// Mailer — своя group, читает «для писем»
const mailer = kafka.consumer({ groupId: 'mailer' });
await mailer.connect();
await mailer.subscribe({ topic: 'user.created', fromBeginning: false });
await mailer.run({
  eachMessage: async ({ message, partition, offset }) => {
    console.log('[mailer]', offset, message.value?.toString());
    // send welcome email...
  },
});

// Analytics — другая group, то же событие, свой прогресс
const analytics = kafka.consumer({ groupId: 'analytics' });
await analytics.connect();
await analytics.subscribe({ topic: 'user.created', fromBeginning: false });
await analytics.run({
  eachMessage: async ({ message, offset }) => {
    console.log('[analytics]', offset, message.value?.toString());
    // increment registrations counter...
  },
});
```

#### Replay: прочитать журнал с начала

```typescript
// Новый сервис Audit подключился позже — хочет всю историю
const audit = kafka.consumer({ groupId: 'audit-rebuild-v2' });
await audit.connect();
await audit.subscribe({
  topic: 'user.created',
  fromBeginning: true, // ← replay с offset 0
});
await audit.run({
  eachMessage: async ({ message, offset }) => {
    console.log('[audit replay]', offset, message.value?.toString());
  },
});
```

Или уже работающей группе сбросить курсор (осторожно, в проде осознанно):

```typescript
await consumer.seek({ topic: 'user.created', partition: 0, offset: '0' });
```

**Vs Redis Pub/Sub в нашем демо:** сообщение увидели только те, кто был подписан *в момент* publish. Kafka хранит и отдаёт опоздавшим / повторно.

### Node.js экосистема: популярные пакеты

NestJS `@nestjs/microservices` — удобная обёртка. «Под капотом» и вне Nest часто используют эти пакеты напрямую:

- **amqplib** → клиент для **RabbitMQ**.
  Сервис кладёт сообщение в очередь («отправь welcome-письмо»), другой сервис забирает и подтверждает обработку (`ack`). Удобно, когда нужна классическая очередь задач с маршрутизацией.
- **bullmq** → очереди **фоновых jobs на Redis** (не просто Pub/Sub).
  Примеры на словах:
  - зарегистрировали пользователя → в очередь job «отправить welcome-email» (можно с delay 5 минут);
  - сгенерировать PDF/отчёт ночью, не блокируя HTTP-запрос;
  - ресайз картинки / импорт CSV пачками с concurrency = 5 воркеров;
  - если SMTP упал — job сам уйдёт в retry с backoff, а не потеряется в логах.
  Отличие от Nest `Transport.REDIS`: BullMQ про **отложенную работу и ретраи jobs**, Redis-transport в Nest — про **запрос–ответ / pub-sub между сервисами**.
- **kafkajs** → клиент для **Apache Kafka**.
  На словах: это не «очередь задач один раз обработал и забыл», а **лента событий**.
  Пример: событие `user.created` попало в топик. Его могут независимо прочитать:
  - Mailer — чтобы отправить письмо;
  - Analytics — чтобы посчитать регистрации;
  - Audit — чтобы записать в журнал.
  Каждый читает со своей скоростью (consumer group), можно перемотать и прочитать историю заново. Поэтому Kafka любят для event-driven и стриминга, а не для «просто отложи письмо на 5 минут» (для этого чаще BullMQ/RabbitMQ).

В этом демо: Nest `Transport.REDIS` (ioredis). Ниже — минимальные примеры «как выглядит без Nest».

#### amqplib (RabbitMQ)

```typescript
import amqp from 'amqplib';

const conn = await amqp.connect('amqp://localhost');
const ch = await conn.createChannel();
await ch.assertQueue('welcome.email');

// producer
ch.sendToQueue('welcome.email', Buffer.from(JSON.stringify({ email: 'anna@example.com' })));

// consumer
ch.consume('welcome.email', (msg) => {
  if (!msg) return;
  console.log(JSON.parse(msg.content.toString()));
  ch.ack(msg);
});
```

#### bullmq (очереди на Redis)

```typescript
import { Queue, Worker } from 'bullmq';

const connection = { host: '127.0.0.1', port: 6379 };
const mailQueue = new Queue('mail', { connection });

await mailQueue.add('welcome', { email: 'anna@example.com' });

new Worker(
  'mail',
  async (job) => {
    console.log('send welcome to', job.data.email);
  },
  { connection },
);
```

#### kafkajs (Apache Kafka)

```typescript
import { Kafka } from 'kafkajs';

const kafka = new Kafka({ brokers: ['localhost:9092'] });
const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'mailer' });

await producer.connect();
await producer.send({
  topic: 'user.created',
  messages: [{ value: JSON.stringify({ email: 'anna@example.com' }) }],
});

await consumer.connect();
await consumer.subscribe({ topic: 'user.created' });
await consumer.run({
  eachMessage: async ({ message }) => {
    console.log(message.value?.toString());
  },
});
```

**Как соотносится с Nest:**

- RabbitMQ → `Transport.RMQ` (+ amqplib внутри)
- Kafka → `Transport.KAFKA` (+ kafkajs)
- BullMQ → чаще отдельно (`@nestjs/bullmq`), не как transport микросервисов
- Redis Pub/Sub → `Transport.REDIS` (как в нашем демо)

### gRPC

- Использует HTTP/2.0
- Формат Protocol Buffer — бинарные данные
- Описание в виде схемы

```protobuf
syntax = "proto3";

package task;

service TaskService {
  rpc GenerateHash (GenerateHashRequest) returns (GenerateHashResponse) {}
}

message GenerateHashRequest {
  int32 id = 1;
  string data = 2;
}

message GenerateHashResponse {
  int32 id = 1;
  string hash = 2;
}
```

---

# NestJS. Микросервисы

- Реализовано через пакет `@nestjs/microservices`
- Взаимодействие — клиент–сервер
- Клиент подключает модуль для отправки запросов и регистрирует его как клиентский
- Сервер регистрирует модуль для обработки запросов
- Сервисы договариваются о способе обмена и выбирают транспорт: TCP / HTTP / Redis / RabbitMQ / и т.д.

## Сервис для обработки запросов

Создание микросервиса (транспорт Redis):

```typescript
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.REDIS,
  options: {
    host: '0.0.0.0',
    port: 6379,
  },
});
app.listen();
```

Обработчик сообщений:

```typescript
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern({ cmd: 'user-create' })
  pay(user: any) {
    return this.appService.userCreate(user);
  }
}
```

## Сервис для отправки запросов

Регистрация клиента в модуле:

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AppService } from './app.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'MAILER_SERVICE',
        transport: Transport.REDIS,
        options: {
          host: '0.0.0.0',
          port: 6379,
        },
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

Отправка сообщения через `ClientProxy`:

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class AppService {
  constructor(
    @Inject('MAILER_SERVICE') private readonly mailerService: ClientProxy,
  ) {}

  async createUser(user: any) {
    const pattern = { cmd: 'user-create' };
    const payload = user;

    const mailRes = await lastValueFrom(
      this.mailerService.send<any>(pattern, payload),
    );

    return { success: true };
  }
}
```

---

## Рефлексия

С какими впечатлениями уходите с вебинара?

Заполните, пожалуйста, опрос о занятии по ссылке в чате.

---

**Спасибо за внимание!**  
Владимир Языков
