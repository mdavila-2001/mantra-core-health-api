# ADR-0004: Autenticación — JWT propio

## Estado
Aceptado.

## Contexto
La API necesita autenticar tanto usuarios humanos (120 roles distintos) como llamadas
servicio-a-servicio (20 workers vía `/internal/*`), sin depender de un proveedor de identidad
externo obligatorio.

## Fuerzas y restricciones
- Guard global (`JwtAuthGuard`) — todo endpoint nace protegido salvo `@Public()` explícito.
- Necesidad de emitir tokens para workers (credenciales de servicio) además de usuarios finales.
- `auth_providers` existe como módulo propio, sugiriendo soporte a más de un proveedor de
  identidad en el futuro, sin que sea el mecanismo primario hoy.

## Opciones consideradas
OAuth2/OIDC de terceros vs. JWT propio: sin registro histórico de la comparación original. El
código implementa JWT propio (`@nestjs/jwt`, `TokenService`) como mecanismo primario.

## Decisión
JWT Bearer emitido y validado por el propio backend (`TokenService`, `JwtAuthGuard` global),
con `@Public()` como única forma de exención explícita.

## Consecuencias positivas
- Control total sobre TTL (`JWT_ACCESS_TTL`, `JWT_REFRESH_TTL_DAYS`), bloqueo de cuenta
  (`ACCOUNT_LOCK_THRESHOLD`) y revocación.
- Mismo mecanismo sirve para usuarios humanos y credenciales de servicio (workers).
- Guard global por defecto-cerrado: un endpoint nuevo nace protegido, olvidar el guard no abre
  acceso accidentalmente.

## Consecuencias negativas
- El backend asume la responsabilidad completa de gestión de credenciales (hashing, rotación,
  bloqueo), en vez de delegarla a un proveedor especializado.
- `auth_providers` sugiere federación futura no completamente resuelta hoy.

## Riesgos
Gestión de secretos del propio JWT (`JWT_SECRET`) — ver `docs/security/secrets-management.md`
(Fase 13).

## Evidencia
`src/common/auth/{jwt-auth.guard,public.decorator}.ts`, `src/modules/iam/controllers/iam-auth.controller.ts`,
[autenticación](../api/authentication.md).

## Plan de revisión
Revisar si se requiere SSO/OIDC federado para integraciones B2B futuras.
