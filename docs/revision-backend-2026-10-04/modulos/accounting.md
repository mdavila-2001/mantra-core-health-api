# Revisión del módulo `accounting` — ALOVIDA

## 1. Alcance, método y límites

- Fecha: 2026-10-05. Unidad: `src/modules/accounting` y `database/SQL/16_accounting`.
- Lectura: 94 archivos TypeScript no spec (16.203 líneas), 43 specs, 9 controladores, DTO, servicios, repositorios, entidades, índices y FK de asientos, subledger, activos, pasivos, devengos y ejercicio fiscal.
- Evidencia dinámica: `corepack yarn test src/modules/accounting --runInBand --silent` terminó con **16 suites y 150 tests pasando**. Son pruebas unitarias con dobles; no prueban PostgreSQL, RLS, carreras ni dos tenants por HTTP.
- No cubierto: banco/pasarela real, datos de producción, migraciones sobre una base desplegada y cada combinación de concepto contable. No se afirma que se haya ejecutado un asiento real.

## 2. Resumen ejecutivo

| Severidad | Total | Hallazgos |
|---|---:|---|
| Crítica | 1 | ACC-01: escrituras y referencias contables no se atan a la práctica/tenant autorizado. |
| Alta | 1 | ACC-02: la clave de asiento prometida por práctica tiene un índice global. |
| Media | 2 | ACC-03: conversión monetaria por `Number`; ACC-04: arrays operativos sin máximo. |

El flujo de borradores sí consulta la asignación activa de un `PRACTITIONER` antes de crear, clasificar, transitar o adjuntar ([ledger.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/accounting/services/ledger.service.ts#L128-L162), [#L290-L296](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/accounting/services/ledger.service.ts#L290-L296)). Esa comprobación no resuelve la autorización de `SECURITY_ADMIN`/`ACCOUNTING_APPROVER` por práctica ni valida las relaciones entre recursos usados para escribir.

## 3. Mapa de la unidad

| Superficie | Rutas y comandos | Roles observados | Datos mutados |
|---|---|---|---|
| Mayor | cuentas, borrador, posteo, aprobación, reversa, adjuntos | `SECURITY_ADMIN`; partes del flujo también `PRACTITIONER` y `ACCOUNTING_APPROVER` | cuentas, asientos, líneas, asignaciones y archivos. |
| Subledger | partida abierta y clearing | `SECURITY_ADMIN` | partidas, documentos de clearing y asiento bancario. |
| Operación | fiscal, devengos, activos, pasivos, FX | `SECURITY_ADMIN` y rutas especializadas | periodos, cronogramas, activos, pasivos, pagos y tipos de cambio. |
| Lecturas | cockpit y mayor | administración, aprobación y profesional | ninguna. |

`journal_transactions` tiene `practice_id`, pero no `tenant_id` ([entidad](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/accounting/entities/journal_transactions.entity.ts#L15-L25)); el DDL lo confirma ([tabla](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/database/SQL/16_accounting/02_tables.sql#L120-L143)). La política RLS genérica revisada en el informe transversal sólo cubre tablas con `tenant_id`, por lo que no sustituye una relación explícita de práctica a tenant para estos writes.

## 4. Hallazgos confirmados

### ACC-01 — Crítica — los writes y referencias financieras no validan el alcance de práctica/tenant

**Evidencia.** `POST /accounting/journal-transactions` exige `SECURITY_ADMIN` ([controlador](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/accounting/controllers/accounting-ledger.controller.ts#L178-L190)), pero `postJournal` persiste el `dto.practiceId`, el periodo y las cuentas de las líneas sin resolver que correspondan entre sí ni con el actor ([servicio](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/accounting/services/ledger.service.ts#L179-L256)); `writeLines` inserta directamente cada `accountId` ([#L789-L825](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/accounting/services/ledger.service.ts#L789-L825)). `createAccount` tiene el mismo `practiceId` suministrado por request ([#L743-L782](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/accounting/services/ledger.service.ts#L743-L782)). En clearing, las partidas se buscan sólo por ID, y el asiento usa `dto.practiceId`, `dto.tenantId` y `dto.bankAccountId` sin comprobar que formen el mismo ámbito ([subledger.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/accounting/services/subledger.service.ts#L96-L207)).

**Refutación intentada.** El rol protege las rutas y los borradores de profesional sí validan afiliación. La búsqueda de número de asiento además filtra por práctica ([journal.repository.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/accounting/repositories/journal.repository.ts#L226-L231)). Ninguno de esos controles une práctica, tenant, periodo, cuenta, partida abierta o banco antes del `flush`; las FK sólo prueban existencia. El escenario se mantiene si un actor autorizado para T1 conoce IDs de T2 o mezcla una cuenta de otra práctica.

**Impacto y plan.** Puede producir asientos y clearing cruzados, alterar partidas ajenas o contaminar el mayor. Crear una política de alcance contable que resuelva el tenant de la práctica del comando y cargue cada recurso con ese alcance; usarla dentro de cada servicio antes de mutar. Rechazar como no disponible los recursos ajenos y añadir relaciones/constraints compuestas cuando el modelo lo permita. Revisar también reversa, pasivos, activos, devengos y tipos de cambio.

### ACC-02 — Alta — la idempotencia de número de asiento contradice el índice global

**Evidencia.** El servicio anuncia y consulta unicidad por práctica (`findByTransactionNumber(practiceId, number)`) ([ledger.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/accounting/services/ledger.service.ts#L217-L230), [repositorio](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/accounting/repositories/journal.repository.ts#L226-L231)). El DDL instala en cambio `uq_journal_transactions_transaction_number` sobre sólo `transaction_number` ([04_indexes.sql](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/database/SQL/16_accounting/04_indexes.sql#L573-L575)).

**Refutación intentada.** La clave global evita duplicados absolutos y no genera dos asientos iguales. No cumple la semántica expuesta por el servicio: dos prácticas distintas con el mismo número pasan la lectura previa y fallan después como error de base, sin conflicto de dominio controlado. La carrera dentro de una misma práctica conserva el mismo problema de traducción.

**Plan.** Decidir si la clave es global o por práctica. Si es por práctica, reemplazarla por `(practice_id, transaction_number)` tras estudiar datos; si es global, consultar global y corregir mensaje/contrato. Traducir `unique_violation` a conflicto catalogado y relectura idempotente si el contrato lo requiere.

### ACC-03 — Media — la conversión de dinero usa coma flotante pese a existir una alternativa decimal

**Evidencia.** `toCents` convierte texto con `Number()` y redondea con `Math.round(n * 100)` ([money.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/accounting/services/money.ts#L10-L22)); balance, clearing y otros flujos lo consumen ([ledger.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/accounting/services/ledger.service.ts#L985-L1014), [subledger.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/accounting/services/subledger.service.ts#L123-L130)). El mismo archivo ya contiene `aCentimos`/`aTexto` con `BigInt` ([money.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/accounting/services/money.ts#L58-L75)), pero no es la ruta usada por aquellos cálculos.

**Impacto y plan.** Valores de escala no acordada, muy grandes o representables de forma imprecisa pueden redondear una centésima inesperadamente; el `Error` genérico ante texto no numérico tampoco se ajusta al catálogo de errores. Fijar formato, escala y rango del contrato; migrar operaciones a enteros decimales/`BigInt` y traducir invalidez a una excepción catalogada. La validación HTTP no alcanza los callers internos ni valores ya persistidos.

### ACC-04 — Media — lotes anidados no tienen límite explícito

**Evidencia.** Las líneas de asiento, periodos fiscales, cronograma de devengo e ítems de clearing exigen array y mínimo, pero no `@ArrayMaxSize` ([journal.dto.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/accounting/dto/journal.dto.ts#L212-L222), [fiscal.dto.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/accounting/dto/fiscal.dto.ts#L77-L87), [accrual.dto.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/accounting/dto/accrual.dto.ts#L120-L130), [subledger.dto.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/accounting/dto/subledger.dto.ts#L182-L193)). Clearing hace consultas y writes por cada ítem dentro de una transacción ([subledger.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/accounting/services/subledger.service.ts#L104-L225)).

**Plan.** Definir máximos por operación, deduplicar identificadores, imponer límite antes de abrir transacción y derivar importaciones grandes a un job paginado. Medir el máximo real y proteger la ruta frente a N+1 y agotamiento de conexión.

## 5. Pruebas de cuatro puntos

| ID | Correcto | Límite | Error | Falla catalogada propuesta |
|---|---|---|---|---|
| ACC-01 | Admin T1 crea asiento con práctica, periodo y cuentas T1. | Dos prácticas válidas del mismo tenant. | T1 usa cuenta, partida, banco o periodo T2; cero mutaciones. | `404/RESOURCE_NOT_FOUND/ACCOUNTING_RESOURCE_NOT_AVAILABLE`. |
| ACC-02 | Número se crea y el reintento se resuelve según contrato. | Mismo número en prácticas distintas, si esa es la semántica aprobada. | Carrera de dos requests iguales. | `409/CONFLICT/ACCOUNTING_DUPLICATE_TRANSACTION_NUMBER`. |
| ACC-03 | `0.10 + 0.20` conserva exactamente 30 centavos. | máximo/rango y dos decimales admitidos. | escala excesiva, texto o monto fuera de rango. | `400/VALIDATION_FAILED/ACCOUNTING_AMOUNT_INVALID`. |
| ACC-04 | lote al máximo persiste de modo atómico. | IDs repetidos se rechazan. | máximo+1 no abre transacción. | `400/VALIDATION_FAILED/ACCOUNTING_BATCH_TOO_LARGE`. |

Las razones son propuestas: no existe aún un catálogo uniforme de `accounting`. Los casos de alcance y carrera requieren PostgreSQL temporal con dos tenants, no mocks.

## 6. Matriz de superficie revisada

| Grupo | Correcto | Límite | Error | Falla catalogada |
|---|---|---|---|---|
| Mayor y cuentas | asiento balanceado en práctica propia | flujo borrador/aprobación | cuenta, periodo o práctica ajena | `ACCOUNTING_RESOURCE_NOT_AVAILABLE`. |
| Subledger y clearing | partidas del mismo ámbito | múltiples ítems válidos | item/banco/tenant mezclado | `ACCOUNTING_RESOURCE_NOT_AVAILABLE`. |
| Fiscal, activos, pasivos, devengos | recurso y periodo propios | cronograma/lote máximo | relación ajena, duplicado o lote excesivo | reason por operación a catalogar. |
| Dinero | decimal exacto | rango máximo | signo/escala/formato inválido | `ACCOUNTING_AMOUNT_INVALID`. |

## 7. Catálogo propuesto

| Reason | Estado/código | Uso |
|---|---|---|
| `ACCOUNTING_RESOURCE_NOT_AVAILABLE` | `404 / RESOURCE_NOT_FOUND` | Práctica, cuenta, periodo, partida, banco o documento fuera de alcance. |
| `ACCOUNTING_DUPLICATE_TRANSACTION_NUMBER` | `409 / CONFLICT` | Colisión de clave de negocio. |
| `ACCOUNTING_AMOUNT_INVALID` | `400 / VALIDATION_FAILED` | Monto fuera de formato, escala o rango. |
| `ACCOUNTING_BATCH_TOO_LARGE` | `400 / VALIDATION_FAILED` | Array sobre el máximo permitido. |

## 8. Olas de corrección

| Ola | Hallazgos | Esfuerzo | Dependencia/riesgo |
|---|---|---|---|
| 0 | ACC-01 | L | Política común de práctica/recurso, relaciones existentes y datos históricos. |
| 1 | ACC-02, ACC-03 | M | Decidir clave e idempotencia; migrar datos/escala antes de cambiar índice o cálculo. |
| 2 | ACC-04 | M | Fijar límites de negocio y convertir cargas grandes en jobs. |

## 9. Trabajo pendiente de integrar y cierre

El plan externo menciona cambios de catálogo y DTO fuera de `origin/dev`; deben compararse antes de acreditarles una corrección. No se editaron fuentes, SQL ni datos. Los 150 tests verdes validan lógica aislada, pero no la composición de tenant, constraints ni carreras descritas aquí.
