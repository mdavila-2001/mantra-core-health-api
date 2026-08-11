<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/lakehouse/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `lakehouse`

**Fuente:** [`src/modules/lakehouse/README.md`](https://github.com/mdavila-2001/mantra-core-health-redesa-api/blob/master/src/modules/lakehouse/README.md)
· 2 controllers · 3 services · 3 repositories · 18 entidades · 1 DTO

---

# Módulo 63 — Lakehouse, productos de datos analíticos y releases de investigación

Zonas del lago, metastores, productos de datos con contrato versionado, datasets físicos con su
esquema, corridas de transformación que materializan particiones inmutables con su linaje, control de
calidad que cuarentena lo que no cumple, y releases de investigación de-identificados **que siempre
caducan**.

## Casos de uso cubiertos (12)

| UC | Endpoint | Descripción |
| --- | --- | --- |
| UC-63-01 | `POST /lakehouse/zones` | Zona del data lake |
| UC-63-02 | `POST /lakehouse/catalogs` | Catálogo / metastore |
| UC-63-03 | `POST /lakehouse/data-products/:id/versions` | Producto y versión con contrato y SLO |
| UC-63-04 | `POST /lakehouse/datasets` | Dataset y versión de esquema |
| UC-63-05 | `POST /lakehouse/transformations/:defId/runs` | Corrida: particiones y archivos |
| UC-63-06 | (dentro del commit de UC-63-05) | Linaje de la corrida |
| UC-63-07 | `POST /lakehouse/ingestion/curated-runs` | Ingesta de salud de-identificada |
| UC-63-08 | `POST /lakehouse/datasets/:id/quality-runs` | Calidad y hallazgos |
| UC-63-09 | `POST /research/projects/:id/cohorts` | Proyecto y cohorte |
| UC-63-10 | `POST /research/dataset-releases` | Solicitar release |
| UC-63-11 | `POST /research/dataset-releases/:id/approve` | Aprobar y materializar |
| UC-63-12 | `POST /research/dataset-releases/:id/revoke` | Expirar o revocar |

11 endpoints para 12 casos de uso: UC-63-06 no tiene endpoint propio — el caso de uso lo declara
explícitamente como *interno, parte del commit de UC-63-05*, y así se implementa.

## Estados en `varchar`, en minúsculas

Como los demás esquemas analíticos, éste no usa `*_concept_id`. Todo vive en
`constants/lakehouse.constants.ts`.

**Excepción**: `health_deidentification_runs` pertenece a `health_data`, que sí es concept-driven; su
estado se escribe con `CONCEPTS.DEID_COMPLETED`.

## Flujo general

```
CATÁLOGO
  zones ──────────────> raw · standardized · curated · research
  catalogs ───────────> metastore con formato por defecto
  data-products/:id/versions ──> upsert del producto + versión ACTIVE
                                 la vigente anterior queda SUPERSEDED
                                 del SLO salen las reglas de calidad
  datasets ───────────> exige versión de producto ACTIVA + zona y catálogo activos
                        + esquema 1 con su huella

EJECUCIÓN
  transformations/:defId/runs ──> una sola corrida viva por definición
        partición cuya huella ya existe ⇒ se salta
        archivo cuyo hash ya existe ⇒ se salta
        linaje en la MISMA transacción (UC-63-06)
  ingestion/curated-runs ───────> destino obligatoriamente en zona CURATED
                                  corrida de de-identificación en la misma tx
  datasets/:id/quality-runs ────> regla blocking incumplida ⇒ dataset QUARANTINED

INVESTIGACIÓN
  projects/:id/cohorts ─────────> upsert del proyecto + cohorte
                                  ventana ética coherente y vigente
  dataset-releases ─────────────> ventana ética comprobada AL SOLICITAR
                                  PHI ⇒ cohorte con perfil de de-identificación
    └─ /approve ────────────────> deid run + manifiesto + released, misma tx
                                  expiresAt NUNCA sobrevive a la aprobación ética
    └─ /revoke ─────────────────> expired (fin de plazo) ≠ revoked (decisión)
```

## Reglas de negocio

- **La zona no es una etiqueta descriptiva, es una frontera.** `curated` sólo admite dato ya
  de-identificado, y es lo que impide que dato clínico en claro acabe en una zona desde la que se
  sirven releases.
- **Un producto tiene una sola versión vigente.** Dos activas dejarían sin decidir qué contrato
  promete el producto, que es lo único que un consumidor puede asumir.
- **Las reglas de calidad salen del SLO** de la versión, en la misma transacción: un contrato que
  promete calidad sin reglas que la comprueben no promete nada.
- **Un dataset se registra contra una versión activa.** Atarlo a un contrato superseded sería
  materializar almacenamiento para una promesa que ya no rige.
- **Una sola corrida viva por definición.** Dos escribiendo el mismo objetivo producirían particiones
  que se pisan, y el checkpoint dejaría de decir hasta dónde se procesó.
- **Las correcciones no reescriben.** Una partición con la misma huella ya existe y se salta;
  corregir es materializar una partición nueva. Es lo que permite reconstruir qué se sabía en cada
  momento.
- **Los archivos son inmutables.** Si el contenido cambia, es otro archivo con otro hash.
- **El linaje va en la misma transacción que la corrida.** Un linaje que se escribe después puede no
  escribirse nunca, y entonces nadie puede decir de dónde salió un dato.
- **No se escribe en un dataset en cuarentena**: añadiría datos a algo que ya se sabe que está mal, y
  acotar el problema después sería más difícil.
- **Sólo una regla `blocking` cuarentena.** Es la diferencia entre "esto está mal y hay que mirarlo"
  y "esto está tan mal que no se puede servir".
- **Una regla bloqueante sin umbral no tolera nada**: declararla bloqueante sin decir cuánto se
  tolera es decir que no se tolera.
- **La ventana ética se comprueba al solicitar, no sólo al aprobar.** Dejar entrar solicitudes de un
  proyecto caducado llenaría la cola de gobernanza de peticiones que sólo pueden rechazarse.
- **Un producto con PHI exige que la cohorte declare perfil de de-identificación.** Sin él no hay
  forma de materializar el release sin exponer el dato tal cual.
- **Un manifiesto por solicitud.** Materializar dos veces daría dos copias de-identificadas del mismo
  dato con caducidades distintas, y revocar una no revocaría la otra.
- **El acceso siempre caduca, y nunca sobrevive a la aprobación ética.** Si el plazo pedido rebasa la
  ventana del comité, se recorta a ella: el comité aprobó un estudio con final.
- **Expirar y revocar se distinguen.** Uno es el fin del plazo previsto y el otro una decisión de
  gobernanza; auditarlas juntas escondería la segunda, que es la que hay que poder explicar.

## Lo que este módulo no hace

**No transforma nada y no de-identifica nada.** Recibe del worker lo que ya escribió en el almacén y
lo registra. Lo que aporta es que el registro sea idempotente, que el linaje y la prueba de
de-identificación queden en la misma transacción que el dato, y que un dato malo deje de servirse.

## Las dos escrituras fuera del esquema

`health_data.health_deidentification_runs`, en UC-63-07 y UC-63-11. El caso de uso las declara en la
misma transacción, y tiene que ser así: dato curado sin prueba de qué perfil lo produjo, o un
manifiesto de release sin ella, es lo primero que pregunta un auditor.

El módulo registra las dos entidades de `health_data` y reutiliza su `DataReleaseRepository` en vez
de duplicar el contrato de una corrida de de-identificación.

## El upsert con id en la ruta

UC-63-03 y UC-63-09 declaran `data_products — UPSERT` y `research_projects — UPSERT` y a la vez ponen
el id del agregado en la ruta. La lectura que respeta ambas cosas: si existe se actualiza, y si no,
se crea **con ese id**. Es lo que permite publicar la primera versión de un producto nuevo, o definir
la primera cohorte de un proyecto nuevo, sin una llamada previa que el modelo no declara.

Si el código ya lo tiene otro agregado, se rechaza: la clave natural manda sobre el id de la ruta.

## Permisos

`DATA_PLATFORM_ENGINEER` define zonas, catálogos y datasets. `DATA_PRODUCT_OWNER` publica versiones
de producto. `TRANSFORMATION_WORKER` y `DEIDENTIFICATION_WORKER` ejecutan. `DATA_STEWARD` evalúa
calidad. `PRINCIPAL_INVESTIGATOR` define cohortes y solicita releases. `RESEARCH_GOVERNANCE` / `DPO`
aprueban y revocan. `PLATFORM_ADMIN` cubre todo.

**Quien pide el release no lo aprueba.** `PRINCIPAL_INVESTIGATOR` aparece en `/dataset-releases` pero
no en `/approve` ni en `/revoke`: el investigador que necesita los datos no puede ser quien decide
que se le den.

**Quien transforma no evalúa la calidad de lo que produjo.** `TRANSFORMATION_WORKER` no aparece en
`/quality-runs`.

Ninguna ruta es pública.

## Concurrencia

`FOR UPDATE` sobre el producto y el proyecto al hacer upsert, sobre la versión vigente que se
supersede, sobre el dataset al evaluar calidad —porque puede quedar en cuarentena—, sobre la
solicitud de release y sobre su manifiesto.

`FOR UPDATE SKIP LOCKED` en uno solo: `findLiveRunByTargetForUpdate`. No es una cola — el segundo
disparo tiene que ver que ya hay una corrida y rendirse, no bloquearse hasta que termine la primera y
entonces abrir otra.

## Logs

`operation: 'lakehouse.<área>.<acción>'`. Nivel `warn` en cuarentena de dataset, materialización de
release y su cierre — los tres momentos en que algo deja de servirse o alguien accede a datos de
pacientes. No se loguean valores de partición, contratos ni expresiones de cohorte.

## Pruebas

`yarn test --testPathPatterns=modules/lakehouse` — 70 pruebas (18 catálogo + 18 transformación +
23 investigación + 11 de delegación de los dos controladores).

## Divergencias con el caso de uso v3.9

- **UC-63-06 no tiene endpoint.** El caso de uso lo declara *interno, parte del commit de UC-63-05*,
  y así está: el linaje se registra dentro de `runTransformation`.
- **UC-63-03 y UC-63-09 crean el agregado si no existe.** Ver "El upsert con id en la ruta".

## Pendiente

- **Ejecución real de la transformación y de la de-identificación**: las hacen los workers. Este
  módulo registra lo que ya ocurrió.
- **`authz.resource_scope_grants` (UC-63-10) y `authz.clinical_access_grants` (UC-63-11, 12)**: el
  caso de uso pide crear y revocar el permiso temporal del investigador. Se publica por outbox —
  `DatasetReleaseMaterialized` lleva `grantToUserId` y `expiresAt`, y `DatasetReleaseRevoked` lleva el
  manifiesto— pero el alta y la baja del permiso son del módulo 05, que es de la parte de Pablo.
- **`health_data.health_ingestion_batches` (UC-63-07)**: el caso de uso lo toma con `SKIP LOCKED`
  para saber qué lote de-identificar. Aquí el worker lo indica; encadenarlo al batch pendiente exige
  coordinar con el módulo 52.
- **Barrido de releases vencidos (UC-63-12)**: el índice por `expires_at` está pensado para que un
  worker cierre los caducados. El endpoint existe y es idempotente; quien lo llama en bucle es el
  worker.
- **Purga física del `object_manifest_id`** al revocar: se publica el evento; la purga es del módulo
  60.
- **Alta de `transformation_definitions`**: la tabla se lee pero ningún caso de uso del módulo 63 le
  da un endpoint de alta. No se ha inventado uno.
- **`audit.audit_events` y las tablas `*_history`**: el caso de uso las declara en los doce. El
  registro de auditoría es del módulo 06.

