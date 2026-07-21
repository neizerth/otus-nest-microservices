# Микросервисы с NestJS — демо-проект

Сквозной учебный проект к вебинару OTUS «Микросервисы с NestJS».  
Продуктовая задача простая и понятная: **онбординг пользователя** — регистрация, welcome-письмо и генерация хэша данных.

Конспект: [`docs/Микросервисы с NestJS.md`](docs/Микросервисы%20с%20NestJS.md)  
Презентация (Reveal.js / VS Code): [`docs/slides.md`](docs/slides.md) — расширение [vscode-reveal](https://marketplace.visualstudio.com/items?itemName=evilz.vscode-reveal): открыть файл → **Revealjs: Open presentation to the Side**

---

## Продуктовая задача

Новый пользователь регистрируется в учебном приложении:

1. Клиент вызывает **API Gateway** (`POST /users`)
2. **Users** создаёт пользователя, пишет доменное событие (упрощённый event sourcing)
3. **Mailer** по Redis получает команду `{ cmd: 'user-create' }` и «отправляет» welcome-письмо (в лог)
4. По желанию клиент вызывает **Hash** через gRPC (`POST /hash`) — тот же `TaskService.GenerateHash`, что в презентации

```text
HTTP-клиент
    │
    ▼
┌──────────────┐   Redis    ┌──────────┐   Redis    ┌──────────┐
│ API Gateway  │ ─────────► │  Users   │ ─────────► │  Mailer  │
│ (HTTP :3000) │            │  (DDD)   │            │          │
└──────┬───────┘            └──────────┘            └──────────┘
       │ gRPC
       ▼
┌──────────────┐
│    Hash      │  proto/task.proto
│ (:50051)     │
└──────────────┘
         ▲
      Redis :6379  (брокер / «service discovery» для демо)
```

---

## Что из презентации показано в коде

| Тема презентации | Где в проекте |
| --- | --- |
| Монолит vs микросервисы | отдельные приложения в `apps/*`, общий вход — gateway |
| DDD (контекст, репозиторий, сервис) | `apps/users` — domain / infrastructure / service |
| API Gateway | `apps/api-gateway` |
| Redis как брокер | `Transport.REDIS`, `docker-compose.yml` |
| ClientProxy + `@MessagePattern` | gateway → users, users → mailer |
| gRPC + Protocol Buffers | `proto/task.proto`, `apps/hash` |
| Retry requests | `libs/common/src/retry.ts` |
| Request Correlation ID | middleware `x-correlation-id`, прокидывается в payload |
| Event sourcing (lite) | append-only `EventStore` в users |
| Service discovery (идея) | сервисы находят друг друга через общий Redis / фиксированный gRPC URL |

---

## Требования

- Node.js 20+
- npm
- Docker (для Redis)

---

## Быстрый старт

```bash
# 1. Зависимости
npm install

# 2. Redis
npm run start:redis

# 3. Все сервисы в одном терминале
npm run start:all
```

Дождитесь логов:

- `Mailer microservice listening on Redis...`
- `Users microservice listening on Redis...`
- `Hash gRPC microservice listening on...`
- `API Gateway listening on http://127.0.0.1:3000`

Или по отдельности (4 терминала после Redis):

```bash
npm run start:mailer
npm run start:users
npm run start:hash
npm run start:gateway
```

Порядок: сначала **mailer** и **hash**, затем **users**, затем **gateway**.

---

## Проверка API

### Health

```bash
curl -s http://127.0.0.1:3000/health
```

### Регистрация пользователя (Redis-цепочка gateway → users → mailer)

```bash
curl -s -X POST http://127.0.0.1:3000/users \
  -H 'content-type: application/json' \
  -H 'x-correlation-id: demo-001' \
  -d '{"email":"anna@example.com","name":"Anna"}'
```

В ответе будут `user` и результат mailer (`mail.letter`).  
В логах mailer — welcome-письмо; во всех сервисах — один и тот же `correlationId`.

### Получить пользователя и события

```bash
# подставьте id из ответа create
curl -s http://127.0.0.1:3000/users/<USER_ID>
curl -s http://127.0.0.1:3000/users/<USER_ID>/events
```

### gRPC GenerateHash через gateway

```bash
curl -s -X POST http://127.0.0.1:3000/hash \
  -H 'content-type: application/json' \
  -d '{"id":1,"data":"hello-otus"}'
```

Ответ вида `{ "id": 1, "hash": "<sha256...>" }`.

---

## Структура репозитория

```text
apps/
  api-gateway/   # HTTP-вход, retry, correlation id, клиенты Redis + gRPC
  users/         # Redis MS, DDD-слои, event store, вызов mailer
  mailer/        # Redis MS, MessagePattern { cmd: 'user-create' }
  hash/          # gRPC MS, TaskService.GenerateHash
libs/
  common/        # константы, типы, withRetry
proto/
  task.proto     # схема из презентации
docs/
  Микросервисы с NestJS.md
docker-compose.yml
```

---

## Переменные окружения (опционально)

| Переменная | По умолчанию | Назначение |
| --- | --- | --- |
| `PORT` | `3000` | HTTP-порт API Gateway |
| `REDIS_HOST` | `127.0.0.1` | Redis |
| `REDIS_PORT` | `6379` | Redis |
| `GRPC_URL` | `127.0.0.1:50051` | адрес Hash-сервиса |

---

## Остановка

```bash
# Ctrl+C в терминале start:all
docker compose down
```
