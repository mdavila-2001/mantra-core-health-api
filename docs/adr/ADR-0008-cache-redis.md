# ADR-0008: Caché — Redis como módulo de infraestructura dedicado

## Estado
Aceptado.

## Contexto
Ciertas operaciones (evaluación de decisión del PDP clínico, entre otras) se benefician de caché
para no recalcular contra PostgreSQL en cada request, con necesidad de invalidación explícita al
cambiar el estado subyacente (revocar consentimiento, cambiar un rol).

## Fuerzas y restricciones
- La caché debe ser invalidable de forma dirigida (`InvalidateCacheDto` en `authz`), no solo por
  TTL — una decisión de autorización obsoleta es un riesgo de seguridad, no solo de rendimiento.
- Necesidad de un almacén compartido entre réplicas de `api` (no caché en memoria de proceso).

## Opciones consideradas
Caché en memoria de proceso vs. Redis compartido: el código usa Redis (`redis_runtime`,
`ioredis`), compartido entre réplicas.

## Decisión
Redis como almacén de caché/estado efímero compartido, encapsulado en el módulo `redis_runtime`
(sin entidades ORM propias — no es un almacén transaccional de negocio).

## Consecuencias positivas
- Invalidación de caché consistente entre todas las réplicas de `api`.
- Separación clara: `redis_runtime` es infraestructura, no un dominio de negocio con entidades.

## Consecuencias negativas
- Redis es una dependencia de disponibilidad adicional — si cae, hay que definir si el sistema
  degrada a "sin caché" o falla (no verificado en esta fase, ver `docs/operations/health-checks.md`, Fase 14).

## Riesgos
Sin verificación en esta fase del comportamiento del sistema ante indisponibilidad de Redis.

## Evidencia
`docker-compose.yml` (`redis`), `package.json` (`ioredis`), `src/modules/redis_runtime/`,
`InvalidateCacheDto` en `src/modules/authz/dto/`.

## Plan de revisión
Verificar comportamiento de degradación ante caída de Redis en Fase 14.
