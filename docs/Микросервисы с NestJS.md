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

На словах — то, с чем сталкиваются почти все:

- **Нет одной общей БД.** В монолите `JOIN users + orders` — одна SQL. В микросервисах данные у разных сервисов: либо два запроса, либо дублирование, либо отдельный «read model».
- **Нет одной транзакции на всё.** «Создать пользователя и списать деньги» атомарно нельзя через два сервиса. Приходится жить с **согласованностью «чуть позже»** (eventual consistency) или паттернами вроде saga/outbox (согласование шагов без одной общей транзакции БД).
- **Логи разъезжаются.** Ошибка «где-то в цепочке» — без correlation id искать иголку в стоге.
- **Сеть врёт.** Таймауты, частичные ответы, «запрос ушёл, ответ не пришёл» → нужны **повторы (retry)**, **идемпотентность** (повтор не ломает результат), таймауты.
- **Ошибки проектирования дороже.** Неверный разрез границ сервисов потом чинится месяцами, не рефакторингом модуля.
- **Разные команды / стеки** — плюс для скорости, минус для единого стиля и онбординга.

## Микросервисы. Паттерны

- **Domain-Driven Design (DDD).** Проектирование микросервисов вокруг доменной модели.
- **Service registry / discovery.** Сервисы автоматически находят друг друга в динамически меняющемся окружении.
- **API Gateway.** Один из сервисов — точка входа для других.
- **Retry requests.** Защита от невыполненных запросов.
- **Event sourcing.** Сохранение изменений состояния как последовательности событий.
- **Request Correlation ID.** Запрос затрагивает несколько микросервисов — формируется id запроса.

### Паттерн API Gateway

Клиент не должен знать про Users, Mailer, Hash и их протоколы.

```text
Клиент ──HTTP──► API Gateway ──Redis──► Users
                      │
                      ├──Redis──► … 
                      └──gRPC───► Hash
```

**Зачем:**

- одна точка входа (URL, auth, CORS, rate limit);
- скрывает внутреннюю топологию;
- собирает orchestration: «зарегистрировать» = users + mailer;
- единое место для correlation id и retry.

В демо: `apps/api-gateway` — единственный HTTP-сервис на `:3000`.

### Паттерн Service registry / discovery

Проблема: Users сейчас на `host A`, через минуту — на `host B`. Как Mailer / Gateway узнают адрес?

**Идея discovery:** сервис при старте **регистрируется** («я users, вот мой адрес»), клиенты **спрашивают registry**, а не хардкодят IP.

В проде: Consul, Eureka, Kubernetes DNS (`users.default.svc`), service mesh.

**В нашем демо упрощено:**

- Redis — общая «точка встречи» для Nest Redis-transport (не полноценный registry);
- gRPC Hash — фиксированный `GRPC_URL=127.0.0.1:50051`.

Для учебного старта так нормально; в проде адреса не зашивают в код.

### Паттерн Retry requests

Сеть и соседний сервис иногда «моргают». Один failed request ≠ бизнес-ошибка.

**Идея:** повторить вызов N раз с паузой (backoff). Важно: операция должна быть **идемпотентной** или защищена ключом, иначе дважды отправите письмо.

В демо — `withRetry` на gateway:

```typescript
// libs/common/src/retry.ts — до 3 попыток
return withRetry(
  () => lastValueFrom(this.users.send({ cmd: 'users.create' }, dto).pipe(timeout(8000))),
  { label: 'users.create' },
);
```

Смотрите логи gateway при недоступном Redis/users: будут `failed (attempt 1/3)`.

### Паттерн Event sourcing (lite)

Обычно хранят **текущее состояние** (`User { email, name }`).  
Event sourcing хранит **факты изменений**: `UserCreated`, `EmailChanged`, …

Состояние = результат применения событий по порядку.

**Зачем:** аудит «что было», replay, разные проекции из одной ленты событий.

**В демо (упрощение):** пишем и snapshot в `UserRepository`, и событие в `EventStore` — чтобы увидеть идею, без полного rebuild из событий.

```typescript
// apps/users — при создании
this.users.save(user);
this.events.append({
  type: 'UserCreated',
  aggregateId: user.id,
  payload: { email, name },
  correlationId,
  occurredAt: new Date().toISOString(),
});
```

```bash
curl http://127.0.0.1:3000/users/<id>/events
```

### Паттерн DDD (развёрнуто)

DDD — не про Nest и не про Redis. Про то, **как нарезать систему по смыслу бизнеса**.

**1. Bounded context (ограниченный контекст)**

Одно и то же слово в разных частях системы может означать **разные данные и правила**.

Пример: сущность «пользователь»

- при **регистрации** нужны email и имя;
- при **оплате** нужны тариф и способ оплаты;
- при **рассылке** нужен только адрес письма.

Если сделать одну общую модель `User` на всё приложение, в неё начнут попадать поля «на всякий случай», и сервисы будут знать лишнее друг о друге.

**Ограниченный контекст** — явно заданная граница: внутри неё у терминов и модели **одно** значение. Снаружи границы — другая модель (даже если слово звучит так же). На практике граница часто совпадает с **отдельным микросервисом** и его кодовой базой.

**Где это в нашем демо** (три контекста = три приложения):

| Контекст | Код | Что входит в модель | Чего в модели нет |
| --- | --- | --- | --- |
| **Users** | `apps/users` | id, email, name, события `UserCreated` | текст письма, SMTP |
| **Mailer** | `apps/mailer` | кому писать, тема, тело письма | хранение пользователя как сущности |
| **Hash** | `apps/hash` | id + data → hash (gRPC) | пользователи и письма |

Users **не** импортирует код Mailer и не знает, как устроено письмо. Mailer получает только нужные поля (`email`, `name`) по сообщению `{ cmd: 'user-create' }`. Это и есть раздельные bounded contexts: общие слова (`email`) передаются через контракт сообщения, а не через одну общую сущность.

Gateway (`apps/api-gateway`) — не доменный контекст, а **точка входа**: склеивает вызовы, не владеет бизнес-моделью пользователя.

**2. Ubiquitous language (единый язык)**  
Внутри одного контекста одни и те же термины в речи и в коде: создание пользователя — `users.create` / событие `UserCreated`, а не чужое имя вроде `pay()`.

**3. Слои внутри контекста Users**

```text
domain/          — события, сущности (что произошло в бизнесе)
application/     — сценарий использования (use case): UsersService.create
infrastructure/  — UserRepository, EventStore (как храним)
interface/       — UsersController (@MessagePattern) — вход снаружи
```

В коде:

```text
apps/users/src/
  domain/events.ts
  infrastructure/user.repository.ts
  infrastructure/event-store.ts
  users.service.ts      ← application
  users.controller.ts   ← вход Redis
```

**4. Зачем DDD микросервисам**  
Границы сервисов берут из **смысла и модели** (контекстов), а не из «вынесли каждый Controller в отдельный репозиторий». Иначе получите **распределённый монолит**: много процессов, одна запутанная общая модель.

### Мини-словарь англицизмов (по ходу вебинара)

| Термин | По-русски / смысл |
| --- | --- |
| **API Gateway** | единая HTTP-точка входа для клиентов |
| **Service discovery / registry** | сервис регистрации адресов: кто где сейчас доступен |
| **Retry** | повтор запроса при сбое |
| **Backoff** | пауза между повторами (часто увеличивается) |
| **Idempotent / идемпотентность** | повтор того же запроса не ломает результат (письмо не уйдёт дважды) |
| **Event sourcing** | храним историю событий, а не только «как сейчас» |
| **Snapshot** | снимок текущего состояния (ускоряет чтение) |
| **Replay** | проиграть события заново |
| **Payload** | полезная нагрузка сообщения (данные внутри) |
| **Broker** | посредник сообщений (Redis, Kafka, RabbitMQ…) |
| **Pub/Sub** | publish/subscribe: опубликовал — кто слушал, тот получил |
| **Fire-and-forget** | отправил и не ждёшь ответа |
| **Consumer / producer** | читатель / писатель сообщений |
| **Offset** | закладка «до какого места в журнале дочитал» |
| **Ack** | «обработал, можно считать доставленным» |
| **Eventual consistency** | «станет согласованно чуть позже», не в ту же миллисекунду |
| **Saga / outbox** | способы согласовать изменения между сервисами без одной общей транзакции |
| **Orchestration** | координация шагов вызова нескольких сервисов (часто gateway) |
| **Throughput** | пропускная способность (сколько сообщений в секунду) |
| **Retention** | сколько журнал хранит старые сообщения |
| **CDC** | захват изменений из БД в поток событий |
| **Service mesh** | инфраструктурный слой для сетевого общения сервисов (mTLS, retry, routing) |
| **CORS / rate limit** | правила браузерного доступа к API / ограничение частоты запросов |
| **Transport** | способ доставки в Nest (Redis, TCP, gRPC…) |
| **Use case** | сценарий «что система делает для пользователя» |
| **Tracing** | сквозной след запроса по сервисам |

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
- Описание в виде схемы (контракт между сервисами)

**Зачем, если есть JSON/HTTP:**

- строгий контракт в `.proto` — клиент и сервер «договариваются» до деплоя;
- бинарный формат и HTTP/2 — обычно компактнее и быстрее на частых внутренних вызовах;
- удобно для **синхронного** RPC между сервисами (как «вызов метода»), пока брокеры — про асинхрон.

**В демо:** отдельный сценарий, не в цепочке регистрации.

```text
curl POST /hash  →  API Gateway  →  gRPC TaskService.GenerateHash  →  apps/hash
```

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

```bash
curl -s -X POST http://127.0.0.1:3000/hash \
  -H 'content-type: application/json' \
  -d '{"id":1,"data":"hello-otus"}'
```

Nest: сервер — `Transport.GRPC` + `@GrpcMethod`; клиент на gateway — `ClientGrpc` / `getService('TaskService')`.

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
