# Revisión del módulo `integration_contracts` — ALOVIDA

## Alcance y evidencia

Se revisaron contratos B2B, versiones, perfiles, suscripciones, intercambios, intentos, cursores y evidencia de webhook. `corepack yarn test src/modules/integration_contracts --runInBand --silent` aprobó **6 suites y 48 pruebas**.

## Hallazgo confirmado

### ICON-01 — Crítica — Contratos y recursos hijos se cargan por UUID sin comprobar el tenant activo

Todos los endpoints administrativos exigen `SECURITY_ADMIN`, pero pasan el UUID de ruta y actor sin un tenant resuelto ([`integration-contracts.controller.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/integration_contracts/controllers/integration-contracts.controller.ts#L47-L195), [`integration-exchanges.controller.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/integration_contracts/controllers/integration-exchanges.controller.ts#L31-L64)). Los servicios buscan contrato, versión, perfil, suscripción e intercambio mediante `findById` y actúan sobre su estado sin cotejar el tenant: contratos ([`integration-contracts.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/integration_contracts/services/integration-contracts.service.ts#L125-L280)), perfiles ([`integration-auth-profiles.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/integration_contracts/services/integration-auth-profiles.service.ts#L57-L139)), webhooks ([`integration-webhooks.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/integration_contracts/services/integration-webhooks.service.ts#L74-L205)) e intercambios/reintentos ([`integration-exchanges.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/integration_contracts/services/integration-exchanges.service.ts#L89-L307)).

El interceptor sólo compara el `tenantId` enviado en DTO; no puede autorizar el contrato resuelto por UUID. Sin RLS estricta, un administrador de A que conozca IDs de B puede publicar/retirar contrato, girar credenciales, registrar o reintentar intercambios, avanzar cursores y generar evidencia de entrega para B.

**Plan:** derivar tenant del contexto y cambiar todos los resolvers a `id + tenantId`; resolver la cadena versión/perfil/suscripción/intercambio → contrato → tenant antes de cualquier transición. El alta debe ignorar o rechazar un `tenantId` discrepante. Responder 404 uniforme fuera de alcance y probar dos tenants en cada familia de rutas.

| Caso | Prueba dirigida | Resultado esperado |
| --- | --- | --- |
| Correcto | Admin de A publica versión, perfil y suscripción de contrato A | `200/201`; cambios y outbox sólo en A |
| Límite | Reintento concurrente de un intercambio fallido propio | un solo intento nuevo y cursor/estado consistente |
| Error | Admin de A rota perfil, entrega webhook o avanza cursor de contrato B | `404`; no cambia estado, secreto ni evidencia de B |
| Falla catalogada | UUID inexistente o de otro tenant | `404/RESOURCE_NOT_FOUND/INTEGRATION_RESOURCE_OUT_OF_SCOPE` |

## Controles verificados

Las transacciones, versionado, idempotencia, cursor monótono y requisitos de suscripción activa están implementados. Las pruebas cubren transiciones y delegación, pero no un actor de A frente a recursos de B.
