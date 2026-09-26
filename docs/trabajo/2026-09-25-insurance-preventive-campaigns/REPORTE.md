> **AVANCE (API): 17 / 20 microtareas — 85 %.** 1 a medias (cobertura global bajo umbral, ya bajo en `dev`), 1 descartada con causa (`orm:catalog`) y 1 en este cierre (reporte + PR).

# Reporte — Tarea 4 · campañas preventivas de la aseguradora (API)

- **Repos:** `mantra-core-health-model` (PR #31), `mantra-core-health-api` (este PR), `mantra-core-health` (PR aparte).
- **Rama:** `marcelo/feat-insurance-preventive-campaigns-api` sobre `origin/dev` @ `f78b241a`.
- **Contrato:** [`docs/contracts/insurer-preventive-campaigns.md`](../../contracts/insurer-preventive-campaigns.md).
- **Plan:** [`PLAN.md`](PLAN.md).

## Completado

| Hito | Qué quedó |
|---|---|
| H1 · modelo | Dos tablas nuevas, dos CHECK y el parche `v4223` en el repo del modelo (PR #31). El parche se aplicó dos veces sobre Postgres 16 desechable: 2 tablas, 14 índices, 12 FK y 2 CHECK, y los tres casos negativos fallaron donde debían |
| H2 · datos | Entidades generadas por `gen_entities.py`; 15 conceptos nuevos en `insurance.concepts.ts`; copia de `database/SQL` idéntica byte a byte a la del modelo, solo con los archivos de esta tarea |
| H2 · dominio | DTO con validaciones, repositorio con SQL acotado por aseguradora, servicio y controlador con cinco rutas bajo `/insurance-campaigns` |
| H2 · pruebas | 34 casos del servicio y 3 del controlador. Se hicieron dos mutaciones a propósito (permitir `DRAFT → PAUSED` y quitar la titularidad del afiliado) y el spec se puso rojo en ambas |
| H2 · documentos | Contrato, sección del README del módulo y artefactos regenerados: OpenAPI, endpoints, Postman y documentación de módulos |

## A medias

- **`yarn test:cov` no cumple los umbrales globales.** Pasan las 8767 pruebas, pero la cobertura queda en 73,56 % de sentencias frente a 74 % exigido. `origin/dev` limpio, medido en un worktree descartable, da 73,53 %: el problema es anterior y esta rama lo deja ligeramente mejor. El CI puede estar rojo en `dev` por ese motivo.

## Pendiente

- Nada del alcance. Revisión humana de los tres PR y merge en orden: modelo, API, front.

## Evidencia

En [`evidencia/`](evidencia/):

- `patch-v4223.txt`: aplicación doble del parche, conteos y casos negativos.
- `typecheck.txt`, `lint.txt`, `guardrails.txt`: 0 errores, 0 avisos y 0 hallazgos bloqueantes nuevos.
- `test-insurance.txt`: 47 suites y 590 pruebas del módulo de seguros y de semillas.
- `test-cov.txt`: cobertura de la rama y de `origin/dev` limpio.
- `pr/`: estado de los PR según GitHub.

## No cubierto

- **Integración HTTP real.** Las pruebas de integración de este repo no arrancan en esta máquina (error de metadatos de MikroORM con `CatalogConcepts`, ajeno a esta tarea), así que la API no se ejercitó contra HTTP con base real. Lo cubren pruebas unitarias con `EntityManager` doble y la aplicación del parche sobre Postgres real.
- **Consultas SQL del repositorio contra datos reales.** Están probadas por su forma y por el servicio, no ejecutadas contra un esquema completo con datos.
- **Cron de vencimiento.** No existe: el vencimiento efectivo lo da la fecha en la consulta del afiliado.

## Desvíos respecto del plan

1. **`database/SQL` no se refrescó con `db:vendor`.** En `origin/dev` la copia de la API ya difería del modelo: tiene 4 parches propios y 2 archivos distintos. Un espejo con `--delete` los habría borrado. Se copiaron solo los siete archivos de esta tarea.
2. **`yarn orm:catalog` no se regeneró.** Lee la bóveda documental, que no tiene fichas de las tablas nuevas y trae deriva ajena; regenerarlo borraba catálogos de otros módulos.
3. **Sin etiquetas en `terminology-designations.es.ts`.** Esa tabla solo admite conceptos de un conjunto de valores publicado y su prueba rechaza los sobrantes. El front rotula con su propio mapa.
4. **`PreconditionFailedException` responde 422, no 412.** El plan decía 412; el contrato y los mensajes dicen 422.
5. **`gen_entities.py` reescribió 29 entidades existentes** y `gen_integrity.py` los `05_constraints.sql` de otros módulos. Se revirtieron: solo entran las dos entidades nuevas y el barril.
6. **Un actor sin tenant activo que no es plataforma recibe 403** en lugar de 422, para que un paciente nunca vea otro código al intentar mutar.

## Riesgos

| Riesgo | Estado |
|---|---|
| `database/` de este PR refleja la rama del modelo hasta que el PR #31 se integre | Declarado en el cuerpo del PR |
| `PartnerTenantId` sin FK física | Decisión registrada, precedente `provider_entity_id` |
| Un afiliado con cobertura de vigencia desconocida no ve campañas | Decisión conservadora registrada (A15) |
| `db:vendor:check` seguirá reportando la deriva previa de `database/SQL` | Anterior a esta tarea |

## Decisiones

- **D4 (consentimiento).** La campaña se anuncia a todos los afiliados con cobertura vigente; la patología CIE-10 la describe y nunca filtra afiliados por historia clínica.
- **Tablas nuevas.** No se reutilizó `marketing.marketing_campaigns` ni `promotions.promotions`: son de comercio, sin aseguradora ni bonificación de copago.
- **Autoridad por membresía.** Mutan OWNER/ADMIN de la aseguradora o plataforma, leen los miembros; el claim `tenantTypes` no autoriza nada.
- **PR a nombre de la cuenta de la máquina.** El push y los PR salen con la credencial guardada en esta máquina, que es de `PabloArauzCaballero`. GitHub no permite pedirle revisión al autor, así que el revisor pedido es `jsaldias39`.
