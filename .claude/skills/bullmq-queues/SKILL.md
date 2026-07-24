---
name: bullmq-queues
description: "Background jobs and async processing in this backend using @nestjs/bullmq + BullMQ over Redis (ioredis). Use when adding a queue, producer, or worker/processor, scheduling jobs, handling retries/backoff, or debugging job failures and concurrency."
---

# bullmq-queues

Colas y trabajo asíncrono con **@nestjs/bullmq** (BullMQ 5) sobre **Redis** (ioredis).
Consulta el grafo por trabajo existente: `graphify query "queue processor bullmq"`.

## Registrar una cola en un módulo

```ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { FooProcessor } from './foo.processor';
import { FooService } from './foo.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'foo' })],
  providers: [FooService, FooProcessor],
})
export class FooModule {}
```

La conexión Redis se configura una vez con `BullModule.forRoot(...)` (revisar dónde en el árbol de módulos:
`graphify query "BullModule forRoot redis connection"`).

## Producir un job

```ts
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class FooService {
  constructor(@InjectQueue('foo') private readonly queue: Queue) {}

  async encolar(payload: { id: string }) {
    await this.queue.add('procesar', payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: 1000,
      removeOnFail: 5000,
    });
  }
}
```

## Consumir (worker/processor)

```ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('foo')
export class FooProcessor extends WorkerHost {
  async process(job: Job): Promise<void> {
    switch (job.name) {
      case 'procesar':
        // lógica idempotente
        break;
    }
  }
}
```

## Reglas

- **Idempotencia**: los jobs pueden reintentarse; diseña `process` para ser seguro ante reejecución.
- Configura `attempts` + `backoff` en cada `add`; no dejes reintentos infinitos.
- `removeOnComplete`/`removeOnFail` para no llenar Redis.
- No metas payloads gigantes en el job; pasa IDs y recarga desde la BD.
- Maneja errores dentro de `process` y deja que BullMQ gestione el retry. **Logging** (regla
  base, ver `project-conventions`): `PinoLogger` inyectado, nunca `console`; los fallos de job
  → `error` con campos (`jobId`, `queue`, `attemptsMade`), en español y sin volcar el payload
  si lleva PII.
- Para jobs periódicos usa repeatable jobs (`{ repeat: { pattern: '...' } }`).
- Comentarios en **español**.
