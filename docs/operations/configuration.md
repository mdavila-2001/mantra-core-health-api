# Configuración

> Fase 14. Ver [variables de entorno](../getting-started/environment-variables.md) para el
> inventario completo. Esta página cubre cómo se valida y aplica esa configuración.

## Validación al arranque, no en el primer uso

Cada superficie de configuración (`ormEnvSchema`, `authEnvSchema`, `loggingEnvSchema`,
`workerEnvSchema`) es un esquema Joi que `ConfigModule.forRoot()` aplica sobre `process.env` antes
de que la aplicación sirva ninguna request. Una variable ausente o mal formada aborta el proceso
en el arranque — nunca falla silenciosamente en la primera consulta que la necesita.

## Configuración por servicio, no un único archivo monolítico

`api` y los 20 workers comparten la misma imagen pero **no la misma configuración completa**:
cada worker valida `workerEnvSchema` (que incluye `WORKER_API_BASE_URL`,
`WORKER_HTTP_TIMEOUT_MS`, `MESSAGING_QUEUE_CODES`) además de los esquemas comunes de auth/logging
— la API no necesita esas variables porque no llama a `/internal/*`, las expone.

## Configuración de negocio vs. configuración de infraestructura

Dos niveles distintos, no uno solo:

1. **Variables de entorno** — infraestructura (conexiones, secretos, flags de comportamiento).
2. **Datos gobernados** — reglas de negocio configurables sin desplegar código, vía
   `terminology.catalog_concepts` y tablas de política (`authz.access_policies`,
   `system_ops.entity_registry`, etc.) — ver [reglas de negocio](../business/business-rules.md)
   §4.

## Ver también

- [Variables de entorno](../getting-started/environment-variables.md)
- [Ambientes](environments.md)
- [Configurar Gmail como proveedor real de email](gmail-provider-setup.md)
- [Configurar Google Analytics 4 como analítica web](google-analytics-setup.md)
