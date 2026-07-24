---
name: nestjs-module
description: "Scaffold and structure NestJS 11 feature modules following this repo's per-domain convention (module + controller + service + entities barrel, MikroOrmModule.forFeature). Use when creating a new domain module, adding a controller/service/provider, wiring dependency injection, or reviewing module boundaries."
---

# nestjs-module

Convención de este repo: **un módulo NestJS por dominio de negocio** bajo `src/modules/<dominio>/`.
Antes de tocar código, consulta el grafo: `graphify query "<dominio> module structure"`.

## Layout obligatorio por módulo

```
src/modules/<dominio>/
  <dominio>.module.ts       # declara el módulo
  <dominio>.controller.ts   # rutas HTTP
  <dominio>.service.ts      # lógica de negocio + acceso a datos
  entities/
    index.ts                # barrel: re-exporta todas las entidades
    <tabla>.entity.ts       # una entidad por tabla (generada por introspección)
```

## Plantilla de módulo (patrón real del repo)

```ts
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { FooController } from './foo.controller';
import { FooService } from './foo.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [FooController],
  providers: [FooService],
  exports: [FooService], // solo si otro módulo lo consume
})
export class FooModule {}
```

Registra el módulo en `src/app.module.ts` (import + entrada en el array `imports`), respetando el orden alfabético existente.

## Service

```ts
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Foo } from './entities';

@Injectable()
export class FooService {
  constructor(
    @InjectRepository(Foo) private readonly repo: EntityRepository<Foo>,
    private readonly em: EntityManager,
  ) {}
  // Usa em.flush() tras mutaciones. Prefiere transacciones (em.transactional) para operaciones multi-entidad.
}
```

## Reglas

- **No acoplar dominios**: si `FooModule` necesita lógica de `BarModule`, importa `BarModule` y consume su service exportado; no importes entidades de otro dominio a la ligera.
- Comentarios en **español**, coherentes con el resto del repo.
- Providers globales/transversales van en `CommonModule`; no los dupliques.
- Para inyectar configuración usa `@nestjs/config` (`ConfigService`); las env se validan con Joi en `src/config`.
- **Logging** (regla base, ver `project-conventions`): inyecta `PinoLogger` de `nestjs-pino`
  en services y controllers (`constructor(private readonly logger: PinoLogger)`); **nunca**
  `console.log`. `LoggingModule` es global: no reimportes ni reconfigures nada. Mensajes en
  español y datos como campos, no interpolados.
- Tras crear/editar módulos, ejecuta `graphify update .` para refrescar el grafo.

## Checklist al añadir un módulo

1. Crear carpeta y los 4 artefactos (module/controller/service/entities).
2. `MikroOrmModule.forFeature(Object.values(entities))` en imports.
3. Registrar en `app.module.ts`.
4. Añadir DTOs con `class-validator` (ver skill `api-design`).
5. Añadir `*.spec.ts` (ver skill `testing-jest`).
6. `yarn lint && yarn build`.
