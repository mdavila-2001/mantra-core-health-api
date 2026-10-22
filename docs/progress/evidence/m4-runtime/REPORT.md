# Reporte — verificación de runtime de M4 (B10, B12, B13) contra una base real

> **AVANCE: 21 / 21 comprobaciones de runtime en PASS** (20 en la primera corrida + el retiro, re-verificado con el arreglo). Estas comprobaciones suben a **`VERIFIED`** lo que
> los carriles B10, B12 y B13 habían dejado en `TESTED`. El único FAIL de la primera corrida fue un defecto
> real (el retiro de un horario con citas reprogramadas): se corrigió en esta misma rama y se re-verificó
> en runtime.

- Fecha: 2026-09-26 · Máquina: **M4 · Dell Inspiron 2**
- API: `origin/test` @ `435cd290`, que ya incluye #470, #471 y #472. Compilada con `yarn build` y levantada
  con `node dist/src/main.js` en `:3099`. El retiro se re-verificó con el build de esta rama.
- **Base aislada, no compartida:** proyecto de docker `m4verify` (Postgres `timescaledb-ha:pg18` en `:5439`,
  Redis en `:6390`), con el DDL vendorizado (`database/SQL`) aplicado por `postgres-init`. El `.env` de la
  corrida **no** apunta ni a Neon ni al VPS, porque las pruebas escriben citas y cotizaciones.
- Datos: seeds de arranque, más `seed-dev-data.mjs` (médicos, agendas, 160 cupos, 19 citas, 6 pacientes) y
  `seed-farmacias-marketplace.mjs` (8 farmacias, 85 productos). Todo sintético.
- Script: [`m4-verify.mjs`](./m4-verify.mjs). Recorre la API por HTTP y confirma cada escritura con un
  `SELECT`.

## Completado (`VERIFIED`)

| Carril | Comprobación | Resultado |
|---|---|---|
| B12 | Arranque: `Mapped {/public/profiles/o/:slug/services, GET}` y `Mapped {/public/profiles/f/:slug/products, GET}` | PASS ([`mapped-rutas.txt`](./mapped-rutas.txt)) |
| B12 | `f/:slug/products` sin token, recorrido completo con `limit=3`: **11 productos en 4 páginas = 11 activos en la base**, sin repetidos | PASS |
| B12 | Precio como texto (`"62.32"`), `inStock` booleano, `therapeuticGroup` presente, sin campos internos | PASS |
| B12 | Slug de farmacia pedido como `o/` → el **mismo 404** que un slug inexistente | PASS |
| B12 | `limit=0`, `city=…` y `cursor=basura` → 400 | PASS |
| B12 | `o/:slug/services`: el servicio dado de alta por la API con `150.50` viaja `"150.50"`/`BOB`; el sembrado en `0.00` viaja `null`/`null` (Q-05) | PASS |
| B13 | `POST /quotations` con **el body del front** (importes `number`) → **201**; `SELECT` → `1500 \| 300 \| 3` y cuotas `400,400,400` | PASS |
| B13 | `offeredPrice: 1.005` → 400 (no se redondea en silencio) | PASS |
| B13 | `GET /quotations?patientProfileId=` → cada cotización con **sus** cuotas | PASS |
| B10 | Reprogramar una cita encima de **otro turno confirmado del mismo paciente**, en otro consultorio → **422** («El paciente ya tiene un turno confirmado a esa hora en «Consultorio Cardiología…»»), y la cita **no se mueve** (`SELECT` antes = después) | PASS |
| B10 | Reprogramar a un cupo libre → 200; `SELECT` → la cita queda en el cupo nuevo **y** `resource_id` = el del cupo; fila en `booking_reschedules` | PASS |
| B10 | Regla madre con `resource_id` **NULL** (dato legado, fixture): una cita directa que la pisa → **422** («El profesional ya tiene a … de 13:30 a 14:00…»). El `JOIN` por el cupo la ve | PASS |
| B10 | `close-slots` con un id **uuid5** → ya no es 400 de validación (404 «ninguno de esos cupos es de esta agenda») | PASS |
| B10 | Retirar un horario con **6 citas vivas** → **200** `{releasedSlots: 68, keptSlots: 12, liveBookings: 6, liveBookingIds: […]}`; las 6 siguen vivas en la base; plantilla `TPL_RETIRED` | **FAIL → arreglado → PASS** |

## El defecto que destapó el runtime y se corrigió en esta rama

La primera corrida del retiro respondió **422 «La petición referencia un recurso que no existe»**. El log
(`log-422-antes-del-arreglo.txt`) muestra `fk_booking_reschedules_from_slot_id`: un cupo del que se
**reprogramó** una cita ya no tiene cita, pero `booking_reschedules` lo sigue referenciando. El retiro lo
contaba como libre e intentaba borrarlo.

**No lo introdujo B10.** Antes de B10 ocurría igual al retirar un horario **sin** citas vivas en el que alguna
vez se hubiera reprogramado una cita. B10 lo volvió más frecuente, porque ahora el retiro también corre con
citas vivas.

**Arreglo:** `SchedulingCatalogRepository.retireTemplate` conserva, además de los cupos con cita, los que
aparecen como origen o destino de una reprogramación. Prueba roja → verde en
`scheduling-catalog.repository.spec.ts` y re-verificación en runtime
([`salida-retiro-con-arreglo.txt`](./salida-retiro-con-arreglo.txt)).

## Hallazgos para otras máquinas (no se tocaron)

- **Para M1:** en una base **nueva**, `postgres-init` sale con código **3**. El patch de datos
  `2026-09-19_v4221_aseguradoras_codigo_unico.sql` exige 17 aseguradoras sembradas, y el init sólo saltea en
  base nueva los patches cuyo nombre contiene `backfill` (`docker/db-init/init-postgres.sh:168`). Cualquier
  reconstrucción desde cero del VPS se cae ahí. Para esta verificación se aplicó a mano el único patch
  posterior (`v4223`).
- **Para M1:** el front de `test` (`https://test.173.249.39.237.sslip.io`) responde **503 «no available
  server»** a todo, porque no hay backend vivo detrás. Por eso esta verificación se hizo en local.
- **Para quien mantenga los seeders:** `seed-dev-data.mjs` y `seed-vitrina-publica.mjs` están desfasados
  respecto de la API. No mandan `nationalId` ni `issuerAdministrativeAreaConceptId`, que hoy son
  obligatorios, así que no crean médicos con login ni clínicas.

## No cubierto

- **La regla madre del profesional al reprogramar**, con un profesional que tenga **dos** recursos: la
  semilla no los tiene. Esta corrida verificó el choque del paciente y la atribución del recurso. El guardia
  del profesional en el alta directa quedó verificado con el caso de `resource_id` NULL.
- **Las fichas contra datos importados en el VPS** y **el throttle 429**.
- **El paciente reprogramando su propio turno con su propia sesión:** los pacientes sembrados no tienen
  login, así que se reprogramó como administrador.
- **El flujo de usuario en el navegador (UI):** esto es API, y el front es de M5.

## Fixtures declarados

- Un perfil público de organización (`clinica-m4-verificacion`), creado por SQL para el tenant que tiene la
  práctica sembrada. La semilla no crea ninguno para ese tenant.
- `resource_id = NULL` en una cita durante una sola comprobación (dato legado), restaurado al terminar.
- Una médica sintética (`medica.m4@alovida.test`), creada **por la API** (alta asistida, activación y
  vínculo a la práctica).
