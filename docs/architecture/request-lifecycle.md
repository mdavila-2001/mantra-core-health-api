# Ciclo de vida de una request

> Fase 10. Reconstruido leyendo `src/main.ts` y `src/app.module.ts` en el orden real de registro
> de middleware/guards/interceptors/filtros — no es una descripción genérica de NestJS.

```mermaid
sequenceDiagram
  participant C as Cliente
  participant MW as helmet + json/urlencoded (Express)
  participant Throttle as ThrottlerGuard
  participant Auth as JwtAuthGuard
  participant Roles as RolesGuard
  participant Tenant as TenantContextInterceptor
  participant Ctrl as Controller
  participant Svc as Service
  participant Repo as Repository
  participant DB as PostgreSQL/Mongo/Redis/OpenSearch/MinIO
  participant Filter as AllExceptionsFilter

  C->>MW: HTTP request
  MW->>Throttle: cabeceras de seguridad + payload ≤1MB
  Throttle->>Auth: límite de tasa OK (salvo RATE_LIMIT_DISABLED)
  Auth->>Roles: JWT válido o @Public()
  Roles->>Tenant: rol suficiente o sin @Roles()
  Tenant->>Ctrl: X-Tenant-Id validado; RLS_ENFORCE=true fija app.current_tenant_id
  Ctrl->>Ctrl: ValidationPipe (whitelist, forbidNonWhitelisted, transform)
  Ctrl->>Svc: DTO validado
  Svc->>Repo: lógica de negocio, transacción
  Repo->>DB: SQL/comando
  DB-->>Repo: resultado
  Repo-->>Svc: entidad/proyección
  Svc-->>Ctrl: resultado de dominio
  Ctrl-->>C: 2xx + body
  Note over Svc,Filter: si Svc lanza DomainException o error no controlado
  Svc-->>Filter: excepción
  Filter-->>C: {code, message, correlationId, details, timestamp, path}
```

## Puntos de decisión reales, no genéricos

1. **`ThrottlerGuard`** — global (`APP_GUARD` en `app.module.ts`), aplica a toda ruta. Desactivable
   con `RATE_LIMIT_DISABLED` (usado en pruebas de integración y generación de documentación).
2. **`JwtAuthGuard`** — global, definido en `AuthModule` (`src/common`). Se salta con `@Public()`
   (9 rutas en todo el sistema, ver [autenticación](../api/authentication.md)).
3. **`RolesGuard`** — corre después del anterior, asume `request.user` poblado. Sin `@Roles(...)`
   en el handler, no añade restricción.
4. **`TenantContextInterceptor`** — único interceptor global del sistema. Valida `X-Tenant-Id`
   contra la membresía real del actor y, con `RLS_ENFORCE=true`, fija `app.current_tenant_id`
   para que las políticas RLS de PostgreSQL lo apliquen a nivel de fila.
5. **`ValidationPipe`** — global, `whitelist: true` + `forbidNonWhitelisted: true` cierran
   mass-assignment: cualquier propiedad no declarada en el DTO se rechaza.
6. **`AllExceptionsFilter`** — global (`APP_FILTER`), único punto de salida para cualquier error.
   Ver [modelo de error](../api/error-model.md) para la forma exacta del cuerpo.

## Límite de payload

`json({ limit: '1mb' })` — cargas grandes (imágenes, DICOM) van por `object_storage`
(MinIO/S3), nunca por el body JSON de una request normal.
