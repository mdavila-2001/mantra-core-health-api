---
name: api-design
description: "REST API conventions for this NestJS backend: controllers, DTO validation with class-validator/class-transformer, Swagger docs, versioning, and error handling. Use when adding or reviewing HTTP endpoints, DTOs, request/response shapes, or OpenAPI annotations."
---

# api-design

Convenciones REST para este backend NestJS 11. Consulta el grafo antes de tocar controladores:
`graphify query "<dominio> controller endpoints"`.

## Controlador

```ts
import { Controller, Get, Post, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FooService } from './foo.service';
import { CreateFooDto } from './dto/create-foo.dto';

@ApiTags('foo')
@Controller('foo')
export class FooController {
  constructor(private readonly service: FooService) {}

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateFooDto) {
    return this.service.create(dto);
  }
}
```

## DTOs y validación

Usa `class-validator` + `class-transformer`. El `ValidationPipe` global debe tener
`whitelist: true` y `transform: true` (revisar `src/main.ts`).

```ts
import { IsUUID, IsString, IsOptional, IsInt, Min } from 'class-validator';

export class CreateFooDto {
  @IsString() nombre!: string;
  @IsOptional() @IsUUID() organizacionId?: string;
  @IsOptional() @IsInt() @Min(0) cantidad?: number;
}
```

- DTOs viven en `src/modules/<dominio>/dto/`.
- Para updates parciales usa `PartialType` de `@nestjs/mapped-types` o `@nestjs/swagger`.
- Nunca aceptes entidades MikroORM directamente como body; siempre DTO.

## Swagger

`@nestjs/swagger` está instalado. Anota controladores con `@ApiTags` y DTOs con `@ApiProperty`
cuando el campo no sea inferible. El documento se monta en `src/main.ts` (verificar el path de `/docs`).

## Reglas

- Rutas en `kebab-case`, plurales para colecciones (`/health-records`).
- IDs de ruta validados con `ParseUUIDPipe` (el dominio usa UUIDs).
- No filtres lógica de negocio al controlador: el controlador orquesta, el service decide.
- Errores: usa las excepciones de Nest (`NotFoundException`, `BadRequestException`, …); no lances `Error` crudo.
- Respeta multi-tenancy/consent: muchos endpoints requieren authz CASL (ver skill `authz-casl`).
- **Logging** (regla base, ver `project-conventions`): el logging de peticiones es automático
  (nestjs-pino, mensajes en español). En controllers usa `PinoLogger` inyectado, nunca
  `console`. No registres cuerpos con datos sensibles: las cabeceras y campos secretos ya van
  redactados en `src/logging/pino-options.ts`; si añades uno nuevo, inclúyelo allí.
- Comentarios en **español**.
