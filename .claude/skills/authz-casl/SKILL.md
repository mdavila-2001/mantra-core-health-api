---
name: authz-casl
description: "Authorization and authentication patterns for this backend: CASL abilities (@casl/ability), JWT/Passport guards, MFA (otplib), and consent/delegated-access checks. Use when adding guards, defining permissions/abilities, protecting endpoints, or reviewing access control and multi-tenant authorization."
---

# authz-casl

AuthN con **JWT/Passport** (+ MFA vía otplib, argon2 para hashing) y AuthZ con **CASL** (`@casl/ability`).
Módulos clave: `iam` (identidad/sesiones/credenciales), `authz` (permisos), `consent`,
`delegated_access`, `identity_assurance`. Antes de tocar: `graphify query "authz ability guard"`
y `graphify path "IamModule" "AuthzModule"`.

## Autenticación (JWT)

- Estrategia Passport JWT en el dominio `iam`/`auth_providers`. Protege rutas con un `AuthGuard('jwt')`
  o el guard propio del repo (búscalo: `graphify query "jwt auth guard strategy"`).
- MFA con otplib (TOTP); factores en `iam/entities/mfa_factors.entity.ts`.
- Nunca compares contraseñas en claro: usa `argon2.verify`.

## Autorización (CASL)

Patrón típico: una `AbilityFactory` construye la `Ability` del usuario a partir de sus roles/permisos,
y un guard la evalúa contra la acción+recurso del endpoint.

```ts
import { AbilityBuilder, PureAbility } from '@casl/ability';

export type Action = 'manage' | 'create' | 'read' | 'update' | 'delete';

export function defineAbilityFor(user: { roles: string[]; orgId: string }) {
  const { can, cannot, build } = new AbilityBuilder<PureAbility>(PureAbility);
  if (user.roles.includes('admin')) can('manage', 'all');
  else {
    can('read', 'Foo', { orgId: user.orgId }); // scope por organización (multi-tenant)
    cannot('delete', 'Foo');
  }
  return build();
}
```

Aplícalo con un guard + decorador de política:

```ts
@UseGuards(JwtAuthGuard, PoliciesGuard)
@CheckPolicies((ab) => ab.can('read', 'Foo'))
@Get()
findAll() { /* ... */ }
```

## Reglas

- **Scope multi-tenant siempre**: la mayoría de recursos se filtran por organización/tenant; una ability
  sin condición `{ orgId }` es un bug de seguridad.
- Respeta `consent` y `delegated_access`: acceso a datos de salud puede requerir consentimiento vigente
  o delegación explícita, además del permiso CASL.
- No dupliques la lógica de permisos en el controlador; céntrala en las abilities/guards.
- Registra eventos sensibles en `audit` / `security_events` (dominio iam).
- **Logging** (regla base, ver `project-conventions`): denegaciones y eventos de seguridad se
  registran con `PinoLogger` (`warn`), en español y con campos (`userId`, `action`, `subject`,
  `tenantId`); nunca `console`. No registres el token ni credenciales: la redacción de
  `src/logging` los quita de las cabeceras, pero no vuelques su valor a mano en un mensaje.
- No expongas por qué se denegó (evita fuga de información); responde `ForbiddenException` genérica.
- Cambios de authz → añade tests (skill `testing-jest`) que cubran allow y deny.
- Comentarios en **español**.
