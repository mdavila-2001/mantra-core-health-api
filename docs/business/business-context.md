# Contexto de negocio

> Fase 9. Síntesis a partir de `src/modules/README.md`, `ESTADO-Y-PENDIENTES.md` y el inventario
> real de 60 módulos / 1184 entidades / 841 operaciones (`docs/reports/system-inventory.md`).

## Qué es REDESA Health

REDESA es el backend de un ecosistema de salud operado por Mantra Core Technologies: una única
API que sostiene la operación clínica, administrativa y financiera de una red de práctica médica
(clínicas, consultorios, centros quirúrgicos, farmacias) — no un producto de nicho, sino una
plataforma horizontal que cubre desde el registro de un paciente hasta la contabilidad de la
organización, pasando por citas, procedimientos, facturación, farmacia, cumplimiento normativo y
analítica.

El modelo de datos ("modelo canónico SALUD v4.0.x", según `src/modules/README.md`) organiza el
dominio en **60 schemas PostgreSQL**, cada uno con su módulo NestJS 1:1 — el límite de módulo en
código *es* el límite de schema en base de datos, una decisión de diseño deliberada que hace el
límite de dominio verificable mecánicamente (`tools/redesa/coverage-report.mjs`,
`DIRECT_CROSS_DOMAIN_ACCESS`).

## Por qué existe cada gran bloque

| Bloque | Módulos representativos | Problema de negocio que resuelve |
|---|---|---|
| Identidad y acceso | `iam`, `authz`, `auth_providers`, `identity_assurance`, `consent`, `delegated_access` | Quién es cada actor, qué puede hacer, y bajo qué consentimiento/relación asistencial puede tocar datos de salud de un paciente concreto |
| Atención clínica | `clinical`, `clinical_ext`, `diagnostics`, `diagnostic_units`, `procedures_perioperative`, `pharmacy` | Registrar y coordinar la atención real: historia clínica, diagnósticos, cirugía, medicación |
| Operación de práctica | `practice`, `scheduling`, `directory`, `organization_extensions`, `geo` | Agendar, ubicar y coordinar recursos humanos y físicos de la práctica |
| Financiero | `billing`, `accounting`, `payments`, `insurance`, `erp` | Cobrar, pagar, conciliar y reportar financieramente la operación |
| Cumplimiento y gobierno | `audit`, `authz`, `consent`, `terminology` | Sostener trazabilidad, consentimiento y vocabulario clínico controlado — no opcional en salud |
| Comercial y relación | `crm`, `marketing`, `ads`, `promotions`, `community`, `education` | Adquisición y fidelización de pacientes/clientes, educación |
| Plataforma de datos | `read_models`, `lakehouse`, `vector_rag`, `graph_intelligence`, `time_series`, `polyglot_storage`, `search_platform` | Analítica, IA aplicada y proyecciones de lectura de alto rendimiento sobre el mismo dominio |
| Infraestructura operativa | `messaging`, `integrations`, `integration_contracts`, `object_storage`, `document_store`, `redis_runtime`, `workflow`, `automation`, `platform_ops`, `system_ops`, `qa_lab`, `cross_store_consistency` | Que el sistema funcione, se integre con terceros y se mantenga consistente entre 5 almacenes de datos distintos |

Catálogo completo con métricas reales de cada uno de los 60: [catálogo de módulos](../modules/index.md).

## Por qué la arquitectura es así

Tres decisiones de negocio explican gran parte de las decisiones técnicas documentadas en
`docs/architecture/`:

1. **Multi-tenant desde el diseño** — la plataforma sirve a múltiples organizaciones de salud
   sobre la misma base de datos, aislada por `RLS_ENFORCE` (Row-Level Security). No es
   una app de una sola clínica con "tenant" añadido después.
2. **Terminología clínica gobernada, no enums de código** — los valores cerrados del dominio
   (estados, tipos, categorías) se resuelven contra `terminology.catalog_concepts`. Añadir un
   valor de negocio nuevo es un `INSERT`, no un despliegue — relevante para la velocidad con la
   que el negocio puede evolucionar sin depender de un ciclo de release.
3. **Auditoría y PDP clínico no son una capa añadida, son estructurales** — cada entidad lleva
   campos de auditoría compartidos (`createdBy`, `touch()`), y el acceso a PHI exige rol *y*
   alcance clínico vigente. Es una decisión de negocio (cumplimiento regulatorio en salud), no
   solo una preferencia técnica.

## Estado y hoja de ruta real

`ESTADO-Y-PENDIENTES.md` (mantenido junto al código, fuente de verdad operativa) documenta
prioridades vigentes: terminar y operar los 20 workers, validar aislamiento por tenant en cada
entorno, ampliar integración real contra almacenes reales, y revisar las entidades candidatas a
huérfanas. Este portal no duplica ese documento — lo referencia como la fuente viva de
prioridades de negocio a corto plazo.
