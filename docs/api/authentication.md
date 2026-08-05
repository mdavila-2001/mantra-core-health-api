# Autenticación

> Fase 5. Derivado de `src/common/auth/{jwt-auth.guard,public.decorator}.ts`, `src/main.ts` y
> `src/modules/iam/controllers/iam-auth.controller.ts`.

## Mecanismo

JWT Bearer propio (no OAuth/OIDC de terceros). `JwtAuthGuard` (`AuthGuard('jwt')` de Passport) se
aplica **globalmente** a nivel de aplicación: toda ruta nueva nace protegida por defecto — olvidar
el guard cierra el acceso, no lo abre (comentario de diseño explícito en el código fuente).

```
Authorization: Bearer <token>
```

## Endpoints de autenticación (públicos, `@Public()`)

| Método | Ruta | Propósito |
|---|---|---|
| `POST` | `/iam/auth/activate` | Activación de cuenta |
| `POST` | `/iam/auth/login` | Emisión de token de acceso + refresh |
| `POST` | `/iam/auth/token/refresh` | Renovación de token de acceso |

`POST /iam/auth/logout-all` y `POST /iam/auth/sessions/purge` **sí** requieren autenticación
(no están decorados `@Public()`).

## Cómo se marca un endpoint como público

`@Public()` (`src/common/auth/public.decorator.ts`) en el handler o la clase controller hace que
`JwtAuthGuard.canActivate()` retorne `true` sin validar el token (vía `Reflector` + metadata
`IS_PUBLIC_KEY`). En todo el backend hay **9 operaciones públicas** verificadas — la lista completa,
con archivo y línea de cada `@Public()`, está en
`docs/reports/openapi-generation-notes.md` §5. Cualquier endpoint nuevo que deba ser público debe:

1. Decorarse `@Public()` en el código.
2. Añadirse a `KNOWN_PUBLIC_OPERATIONS` en `tools/openapi/generate-openapi.mjs` (o el lint de
   Redocly `security-defined` vuelve a fallar al regenerar el contrato).

## Ciclo de vida del token

- Configurable por entorno: `JWT_ACCESS_TTL` (default `15m`), `JWT_REFRESH_TTL_DAYS` (default `30`).
- `ACCOUNT_LOCK_THRESHOLD` (default `5`): intentos fallidos antes de bloquear la cuenta.
- Emisor: `TokenService` (`src/common/auth/`).

## Bloqueo de cuenta y sesiones

`POST /iam/auth/logout-all` invalida todas las sesiones activas del usuario autenticado;
`POST /iam/auth/sessions/purge` es una operación administrativa de purga de sesiones (requiere rol,
ver `docs/api/authorization.md`).

## Brecha conocida

`SwaggerModule`/Scalar (`/docs`, `/reference`) están deshabilitados en `NODE_ENV=production` sin
una alternativa de exposición protegida definida — ver `SEC-002` en
`docs/governance/traceability-matrix.md`. La estrategia de despliegue de la documentación
interactiva en producción es una decisión pendiente, no una omisión de esta fase.
