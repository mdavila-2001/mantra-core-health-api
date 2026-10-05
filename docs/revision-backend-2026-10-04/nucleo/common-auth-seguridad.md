# Revisión de núcleo: autenticación, seguridad, tenant y verificación

## 1. Fecha, alcance y cobertura real

Fecha: 2026-10-05. Se leyeron `src/common/auth`, `security`, `tenant` y `verification`, incluidos guards, estrategia JWT, sesión, rate limit y sus specs. `corepack yarn test src/common/auth src/common/tenant src/common/security src/common/verification --runInBand --silent` terminó en **13 suites y 115 pruebas aprobadas**; emitió un warning esperado del doble de Redis que degrada a memoria. No se iniciaron Redis, PostgreSQL ni Socket.IO; las conclusiones se limitan a código y pruebas unitarias.

## 2. Resumen ejecutivo

| Severidad | Cantidad | Lente |
| --- | ---: | --- |
| Crítica | 0 | — |
| Alta | 1 | contrato de autenticación/tenant |
| Media | 1 | contrato WebSocket |
| Baja | 0 | — |

## 3. Mapa de la unidad

| Superficie | Control confirmado |
| --- | --- |
| HTTP JWT | algoritmo fijado y sesión viva en `jwt.strategy.ts:38-60` |
| Tenant | membresía y conflicto cotejados en `tenant-resolution.ts:32-103` y `tenant-context.interceptor.ts:111-145` |
| Roles | roles scoped comparados contra tenant resuelto en `roles.guard.ts:79-86` |
| Socket | firma, algoritmo y sesión en `ws-jwt.guard.ts:48-71` |
| Bypass DEV | producción aborta en `verification-bypass.env.ts:52-63` |

No se revisaron políticas de controladores de dominio ni RLS en una base real; corresponden a módulos y a `authz-transversal`.

## 4. Hallazgos confirmados y plan

### CAS-01 — Alta — Rechazos centrales de auth y tenant no emiten un `reason` estable

**Evidencia y veredicto.** `RolesGuard` lanza texto libre ([`roles.guard.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/common/auth/roles.guard.ts#L83-L85)). La falta de membresía, declaración privilegiada contradictoria y conflicto del interceptor repiten el patrón ([`tenant-resolution.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/common/tenant/tenant-resolution.ts#L36-L40), [`tenant-resolution.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/common/tenant/tenant-resolution.ts#L81-L85), [`tenant-context.interceptor.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/common/tenant/tenant-context.interceptor.ts#L191-L196)). El filtro sólo preserva `details` de una respuesta objeto ([`all-exceptions.filter.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/common/filters/all-exceptions.filter.ts#L270-L283)). Hallazgo confirmado; coincide con CMM-01 del informe agrupado.

**Impacto.** El cliente recibe `403/FORBIDDEN` sin separar rol insuficiente, membresía ausente y conflicto de tenant; además el mensaje del interceptor incluye UUIDs declarados.

**Plan.** 1. Crear `ROLE_INSUFFICIENT`, `TENANT_MEMBERSHIP_REQUIRED` y `TENANT_SCOPE_CONFLICT`. 2. Añadir excepción de dominio de autorización. 3. Sustituir los `ForbiddenException` citados y no serializar IDs ajenos. 4. Actualizar OpenAPI y consumidores. Riesgo: comparación de textos actual; sin DDL.

| Caso | Tipo / spec propuesto | Preparación e entrada exacta | Resultado esperado |
| --- | --- | --- | --- |
| Correcto | unit `tenant-scope.guard.spec.ts` | miembro A, `X-Tenant-Id: A`, rol requerido | continúa con `resolvedTenantId=A` |
| Límite | unit `roles.guard.spec.ts` | rol scoped sólo en A, tenant A | autorización positiva |
| Error | unit `tenant-context.interceptor.spec.ts` | actor A y `body.tenantId=B` | rechazo antes del handler, sin UUID B |
| Falla catalogada | e2e protegido | rol ausente o cabecera B ajena | HTTP **403**, `FORBIDDEN`, reason exacto |

### CAS-02 — Media — Autenticación WebSocket y sesión también responde texto libre

**Evidencia y veredicto.** `WsJwtGuard` rechaza token ausente, inválido o de tipo incorrecto con `UnauthorizedException` textual ([`ws-jwt.guard.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/common/auth/ws-jwt.guard.ts#L48-L67)). `SessionValidator` hace lo mismo sin `sid` o sesión activa ([`session-validator.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/common/auth/session-validator.ts#L41-L58)); `JwtStrategy` repite el tipo inválido ([`jwt.strategy.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/common/auth/jwt.strategy.ts#L53-L60)). Firma y sesión sí se verifican, por lo que no se afirma aceptación de tokens inválidos.

**Plan.** 1. Declarar `ACCESS_TOKEN_REQUIRED`, `ACCESS_TOKEN_INVALID`, `ACCESS_TOKEN_TYPE_INVALID` y `SESSION_INACTIVE`. 2. Emitir errores de dominio 401 desde estrategia, validador y guard. 3. Adaptar el gateway para preservar code/reason sin JWT. 4. Probar HTTP y handshake. Riesgo: adaptar el protocolo Socket.IO; sin DDL.

| Caso | Tipo / spec propuesto | Preparación e entrada exacta | Resultado esperado |
| --- | --- | --- | --- |
| Correcto | unit `ws-jwt.guard.spec.ts` | JWT access firmado y sesión activa | devuelve sujeto mapeado |
| Límite | unit `session-validator.spec.ts` | sesión vence exactamente en `now()` | no autoriza |
| Error | unit `ws-jwt.guard.spec.ts` | `handshake.auth.token` ausente | no conecta ni consulta DB |
| Falla catalogada | integración Socket.IO + HTTP | refresh token como access | **401**, `UNAUTHENTICATED`, `ACCESS_TOKEN_TYPE_INVALID` |

## 5. Matriz de pruebas de la unidad completa

| Superficie | Correcto | Límite | Error | Falla catalogada |
| --- | --- | --- | --- | --- |
| JWT/sesión | firma y sesión activas | expiración exacta | `sid` ausente | 401 + code + reason |
| Tenant/roles | miembro y rol | múltiples tenants | tenant ajeno | 403 + code + reason |
| Socket | token access válido | sesión revocada | token ausente | 401 + reason |
| Bypass | DEV/TEST habilitado | `false` explícito | `true` en producción | aborto seguro |
| Throttling | identificador hasheado | NAT con dos cuentas | ráfaga excedida | 429 `RATE_LIMITED` |

## 6. Catálogo de errores

Crear los reasons de CAS-01 y CAS-02 bajo `403/FORBIDDEN` y `401/UNAUTHENTICATED`. Ningún reason se declaró huérfano en este recorte.

## 7. Dependencias y riesgos

Depende de `common/errors`, `AllExceptionsFilter`, gateway y `catalogo-errores`. No incluir token, UUID ajeno ni detalle de sesión en la respuesta.

## 8. Olas y esfuerzo

| Ola | Hallazgo | Esfuerzo | Criterio de salida |
| --- | --- | --- | --- |
| 0 | CAS-01 | M | rechazos de rol/tenant con reason estable y sin IDs ajenos |
| 1 | CAS-02 | M | HTTP y Socket.IO comparten reasons 401 probados |

## 9. Trabajo pendiente de integrar

`fa74b78c` modifica el catálogo de reasons; contrastar nombres antes de implementarlos. Esta revisión no modifica código, esquema ni secretos.
