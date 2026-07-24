---
name: testing-jest
description: "Testing conventions for this NestJS backend: Jest unit tests (*.spec.ts next to code, rootDir src), e2e tests with supertest, Nest TestingModule, and testcontainers for PostgreSQL integration. Use when writing or reviewing tests, mocking providers, or setting up integration tests."
---

# testing-jest

Jest configurado en `package.json` (`rootDir: src`, `testRegex: .*\\.spec\\.ts$`, `ts-jest`).
E2E aparte en `test/` con `jest-e2e.json`. Integración real de Postgres con `@testcontainers/postgresql`.

```bash
yarn test          # unit (*.spec.ts junto al código)
yarn test:watch
yarn test:cov      # cobertura -> ../coverage
yarn test:e2e      # test/jest-e2e.json
```

## Unit test de un service (TestingModule + repo mock)

```ts
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { FooService } from './foo.service';
import { Foo } from './entities';

describe('FooService', () => {
  let service: FooService;
  const repo = { findOne: jest.fn(), persistAndFlush: jest.fn() };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        FooService,
        { provide: getRepositoryToken(Foo), useValue: repo },
        { provide: 'EntityManager', useValue: { flush: jest.fn(), transactional: jest.fn() } },
      ],
    }).compile();
    service = moduleRef.get(FooService);
  });

  it('devuelve un Foo por id', async () => {
    repo.findOne.mockResolvedValue({ id: 'x' });
    await expect(service.findOne('x')).resolves.toEqual({ id: 'x' });
  });
});
```

## Controlador

Testea el controlador con el service mockeado (no levantes toda la app para unit).

## E2E con supertest

```ts
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Foo (e2e)', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });
  afterAll(() => app.close());

  it('/foo (GET)', () => request(app.getHttpServer()).get('/foo').expect(200));
});
```

## Integración con Postgres real (testcontainers)

Usa `@testcontainers/postgresql` para levantar una BD efímera y correr MikroORM contra ella;
ideal para probar queries/migraciones sin mockear el ORM. Arranca el contenedor en `beforeAll`,
apunta la config de MikroORM a sus credenciales, y ciérralo en `afterAll`.

## Reglas

- Unit tests junto al código (`foo.service.spec.ts`); e2e en `test/`.
- Mockea el repositorio/EM en unit; usa testcontainers solo en integración.
- Nombres de `describe`/`it` en **español**, coherentes con el dominio.
- Cubre casos de authz/consent cuando el endpoint los exija.
- No dependas de una BD externa para unit tests (deben correr en CI sin infra).
- **Logging** (regla base, ver `project-conventions`): mockea el logger (`PinoLogger`) en los
  providers bajo prueba; no aserciones sobre `console`. Para silenciar pino en tests, corre
  con `LOG_LEVEL=silent`. Si un test verifica que se registró un evento (p. ej. una denegación
  de authz), espía el método del `PinoLogger` mockeado, no la salida estándar.
