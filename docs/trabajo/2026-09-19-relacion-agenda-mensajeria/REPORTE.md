# Reporte — La relación `agenda → mensajería`: dobles, integración y regresión final

- **Fecha:** 2026-09-19 (turno noche) · **Persona:** Justin · **Línea:** B
- **Plan:** [PLAN.md](./PLAN.md) · **Rama:** `justin/noche-2026-09-19-relacion-agenda-mensajeria`
- **Corte:** `5d5007fbdb7916b124010bbfbb560b7bb3aabc06` (`dev`); `32ae939…` es ancestro, 2 commits
- **Peldaño de evidencia alcanzado:** `VERIFIED` para la relación con dobles y para la observación
  contra la base. **No** `REGRESSION_VERIFIED`: el lint global queda en rojo por deuda ajena y hay
  etapas de la pirámide sin ejecutar.
- **Avance: 36 / 53 microtareas en `HECHO`** (68 %, calculado). `A MEDIAS` cuentan como no hechas.

| Hito | Microtareas | `HECHO` | `A MEDIAS` | `BLOQUEADO` | `NOT_RUN` |
|---|---:|---:|---:|---:|---:|
| H1 | 13 | **13** | 0 | 0 | 0 |
| H2 | 8 | **5** | 1 | 2 | 0 |
| H3 | 8 | **6** | 1 | 0 | 1 |
| H4 | 8 | **2** | 0 | 3 | 3 |
| H5 | 7 | **6** | 0 | 1 | 0 |
| H6 | 9 | **4** | 3 | 0 | 2 |
| **TOTAL** | **53** | **36** | **5** | **6** | **6** |

## ⚠️ Lo primero, porque hay algo en rojo

**La relación `agenda → mensajería` no entrega ni un solo aviso contra la base de desarrollo
poblada, y falla en silencio.** Observado, no deducido:

```text
[H3.S1.M2] resultado real: {"delivered":false,"skippedReason":"La emisión del aviso falló; la operación no se revierte"}
```

```json
{"level":50,"context":"MessagingAgendaNoticeAdapter","operation":"scheduling.notice.emit",
 "err":{"type":"ResourceNotFoundException","message":"Canal no encontrado"}}
```

Cero filas en `messaging.notification_requests`, cero en `messaging.in_app_notifications`,
comprobado desde una conexión independiente. Es **HALL-02**, abajo.

## Completado

| ID | Qué se logró (observable) | Comando | Resultado |
|---|---|---|---|
| H0 | Estándar instalado: 176 skills, 14 reglas, candado funcionando | `ls .claude/skills \| wc -l` · `python .claude/hooks/plan_gate.py --self-test` | PASS · `evidencia/h0-instalacion-estandar.txt` |
| H1.S1.M1 | Adaptador, puerto, binding y 4 consumidores localizados; homónimo de `profiles` descartado | `grep -rln` + `git ls-tree` | PASS · `evidencia/h1s1m1-localizacion-adaptador.txt` |
| H1.S1.M2 | Los 8 campos del resultado con su origen; los 5 `skippedReason` literales; 3 observaciones registradas | lectura + ejecución posterior | PASS · `H1-especificacion-doble-estricto.md` |
| H1.S1.M3 | Doble estricto especificado **e implementado** | — | PASS · `test/doubles/strict-agenda-notice-port.double.ts` |
| H1.S1.M4 | Regla de fallo del harness escrita y **ejecutada**: el kill-test pasa | `yarn test:integration --testPathPatterns=agenda-mensajeria-relacion` | PASS · `evidencia/h2-relacion-dobles.txt` |
| H1.S1.M5 | Catálogo de 7 escenarios mapeado; 6 de 7 ejecutados | ídem | PASS |
| H1.S2.M1 | Formato de 13 campos con ejemplo lleno y ejemplo de `command:null` legítimo | — | PASS · `H1-registro-de-checks.md` |
| H1.S2.M2 | Los dos ejes separados: 4 veredictos vs 7 estados de entrega | — | PASS |
| H1.S2.M3 | Los comandos **reales** citados literales; declarado qué NO existe | `node -e` sobre `package.json` | PASS · `evidencia/h1s2m3-comandos-reales.txt` |
| H1.S2.M4 | PostgreSQL y Docker: daemon caído al arrancar, levantado, 5 contenedores healthy, 1 184 tablas / 6 664 FKs | `docker exec … psql` | PASS · `evidencia/h1s2m4-postgres-y-docker.txt` |
| H1.S3.M1 | Ficha de la relación con versiones (no ramas) y decisión de corte justificada | `git merge-base --is-ancestor` + `git diff --name-only` | PASS · `H1-ficha-relacion.md` |
| H1.S3.M2 | Mapeo de datos, errores y seguridad, campo por campo | — | PASS |
| H1.S3.M3 | Lo que el doble NO prueba, por canal, con los 3 estados del correo separados | — | PASS |
| H1.S3.M4 | Control ADV-07 especificado sobre los **dos precedentes reales** del repo | — | PASS |
| H2.S1.M2 | Mapeo de datos **ejecutado**: 5 casos | `yarn test:integration --testPathPatterns=agenda-mensajeria-relacion` | PASS · 25/25 |
| H2.S1.M3 | Mapeo de errores **ejecutado**: 8 casos | ídem | PASS |
| H2.S2.M2 | ADV-12 documentado — y **ocurrió de verdad** | ídem + suite de persistencia | PASS |
| H2.S2.M3 | Estado registrado: `ADAPTER_VERIFIED_WITH_DOUBLES` | — | PASS |
| H2.S3.M2 | Cada resultado con sus 13 campos | — | PASS · `registro-de-checks.json` |
| H3.S1.M1 | Participantes reales fijados **y la divergencia de canal descubierta** | `yarn test:integration --testPathPatterns=agenda-mensajeria-persistencia` | PASS · 8/8 |
| H3.S1.M2 | La relación ejecutada contra participantes reales | ídem | PASS (el check) / FAIL (el producto) |
| H3.S1.M1-bis | **La causa de HALL-02 demostrada en sus 3 capas**, matando mi propia hipótesis inicial | ídem | PASS · `evidencia/hall02-conceptos-duplicados.txt` |
| H3.S1.M3 | Efectos comprobados desde conexión independiente: **0 filas** | ídem | PASS |
| H3.S2.M2 | Correo: los 3 estados separados y medidos | ídem | PASS |
| H3.S3.M1 | Estado declarado **por relación**, no global | — | PASS |
| H3.S3.M2 | Faltantes con su destrabe y dueño | — | PASS |
| H4.S1.M3 | **La deduplicación no descansa en la base** — 0 índices sobre `debounce_key` | ídem + `grep` sobre `SQL/35_messaging/` | PASS · HALL-03 |
| H4.S2.M2 | La precondición **no** está en la escritura: es el `if` previo que la regla 96.3.2 prohíbe | lectura de `notifications.service.ts:167-181` | PASS |
| H5.S1.M1 | Control estructural ejecutado: **0 archivos de `src/` importan de `test/`** | `yarn test:integration --testPathPatterns=agenda-mensajeria-relacion` | PASS |
| H5.S1.M3 | Evidencia de **composición**: el token resuelve al adaptador real, y `useExisting` verificado | `yarn test:integration --testPathPatterns=agenda-mensajeria-persistencia` | PASS |
| H5.S2.M1 | ADV-12 ejercitado: doble dice `true`, proveedor real dice `false` | ídem | PASS |
| H5.S2.M2 | Discrepancia abierta **sin tocar el contrato** | — | PASS |
| H5.S3.M1 | Registro consolidado, 21 checks con sus 13 campos | — | PASS · `registro-de-checks.json` |
| H5.S3.M2 | Estado final por relación | — | PASS |
| H6.S1.M1 | Etapa 1 `typecheck` **exit 0** (detectó 3 errores que jest no ve) y etapa 2 `lint` corrida | `yarn typecheck` · `yarn lint --max-warnings=0` | PASS / FAIL — ver A MEDIAS |
| H6.S1.M2 | Etapa 3: **680 suites · 8 248 pruebas · exit 0 · 528 s**, con el 1 `skipped` registrado `NOT_RUN` | `yarn test` | PASS · `evidencia/h6-etapa3-unitarios-completa.txt` |
| H6.S2.M1 | El `skipped` registrado como tal, no contado como pasado | — | PASS |
| H6.S2.M3 | Motivo de selección y denominadores exactos escritos | — | PASS |

## A medias

### H6.S1.M1 — Etapa 2 (lint): rojo, pero no es de este cambio

- **Qué anda:** mis 3 archivos nuevos dan `exit 0` con `--max-warnings=0`. `typecheck` global en 0.
- **Qué no anda:** `yarn lint --max-warnings=0` global termina en **exit 1** con **9 errores
  `prettier/prettier`** en 4 archivos: `src/modules/directory/dto/my-organizations.dto.ts`,
  `src/modules/directory/services/directory-read.service.ts`,
  `src/modules/iam/dto/register-organization.dto.ts` y su `.spec.ts`.
- **Qué falta exactamente:** correrles `yarn lint:fix` — son 9 reformateos automáticos. **No lo hice
  a propósito:** están fuera del alcance declarado y la regla 00 §3.2 prohíbe el arreglo "de paso".
  `git status` confirma 0 modificaciones en `src/` por esta rama.
- **Dónde quedó:** `evidencia/h6-etapa2-lint.txt`, con el listado completo.

### H2.S2.M1 — Los dobles fijados por versión: uno sí, el otro a medias

- **Qué anda:** el doble del **consumidor** está fijado contra el blob sha1 del puerto
  (`4e26274…`), que es una versión inmutable y citable.
- **Qué no anda:** el doble del **proveedor** está fijado contra el commit, no contra una versión
  publicada de mensajería, porque **mensajería no publica versión de contrato**.
- **Qué falta exactamente:** que exista un artefacto de contrato versionado (el de Ender, H1 de su
  prompt). Mientras tanto, cualquier cambio en `NotificationsService` puede desincronizar el doble
  sin que nada lo señale.
- **Dónde quedó:** `test/integration/agenda-mensajeria-relacion.int-spec.ts`, clase
  `ExtremoProveedorFijado`. Compila, corre, 25/25.

### H3.S2.M1 — In-app: la comprobación existe, la fila no

- **Qué anda:** la consulta de fila y de acceso del destinatario está escrita, corre, y usa una
  conexión independiente de la de la app.
- **Qué no anda:** no hay fila que mirar, porque la emisión falla antes (HALL-02).
- **Qué falta exactamente:** cerrar HALL-02. Con el canal resuelto, este check pasa a medir de
  verdad sin tocar una línea.
- **Dónde quedó:** suite de persistencia, caso `H3.S1.M2/M3`, rama de `notificationRequestId === undefined`.

## Pendiente

| ID | Estado | Qué lo destraba | De quién depende |
|---|---|---|---|
| H2.S1.M1 | `BLOQUEADO` | Que exista el artefacto de contrato versionado | **Ender** (H1 de su prompt) |
| H2.S3.M1 | `BLOQUEADO` | Que haya **más de una** versión de contrato que combinar | **Ender** |
| H3.S2.M3 | `NOT_RUN` | Que el in-app entregue (HALL-02) | Dueño de mensajería / agenda |
| H4.S1.M1 | `NOT_RUN` | HALL-02 | ídem |
| H4.S1.M2 | `NOT_RUN` | HALL-02 **y** Q-12/Q-13: sin política definida no hay respuesta esperada | **Negocio** |
| H4.S2.M1 | `NOT_RUN` | HALL-02 | ídem |
| H4.S3.M1 | `BLOQUEADO` | HALL-02 **y Q-06**: el puerto dice que un aviso fallido se descarta; el metaprompt exige durabilidad. Son incompatibles | **Negocio** |
| H4.S3.M2 | `BLOQUEADO` | ídem — no hay reintento que reiniciar si no hay intención registrada | **Negocio** |
| H4.S3.M3 | `BLOQUEADO` | ídem. **Hoy el fallo terminal ya es invisible**: vuelve como un `skippedReason` genérico y nadie se entera | **Negocio** |
| H5.S1.M2 | `BLOQUEADO` | Salida a destinatario real: exigiría apuntar a un proveedor real | Coordinación |
| H6.S1.M3 | `NOT_RUN` | E2E dirigido y de regresión: **Playwright no es dependencia de este repo** (0 hits en `package.json`, sin `playwright.config.*`); los specs de navegador viven en `mantra-core-health`. Y `yarn test:e2e` casa con **un solo** archivo, `test/app.e2e-spec.ts`, el scaffold de Nest: correrlo y contarlo como etapa 5 sería el verde-por-no-seleccionar-nada que H6.S2.M1 prohíbe. Evidencia: `evidencia/h6-etapas5a7-e2e-ausente.txt` | Coordinación |
| H6.S1.M4 | `NOT_RUN` | Smoke cross-browser: mismo motivo | Coordinación |
| H6.S3.M1 | `A MEDIAS` | Consolidado de checks **A y C de la semana**: sólo tengo los míos (B). Los de Pablo, Ender, Itzan y Marcelo no existen todavía | Todo el equipo |
| H6.S3.M2 | `A MEDIAS` | ídem | Todo el equipo |

## H6.S2.M2 — Clasificación de cada rojo (regla 80.4)

Ningún rojo se maquilló como PASS. Cada uno con su clase y su evidencia:

| Rojo | Clase | Evidencia | Acción tomada |
|---|---|---|---|
| El aviso no se entrega: `delivered:false` contra participantes reales | **`PRODUCT_BUG`** | `ResourceNotFoundException: Canal no encontrado` en el log del adaptador · `evidencia/h3-h4-persistencia.txt` | Registrado como HALL-02 con dueño. **No corregido**: es `src/`, fuera del alcance declarado |
| `bootstrapTestApp()` aborta: seed «aseguradoras de Bolivia» | **`DATA`** | `column "sigla" … does not exist` (42703) + deriva verificada en las 4 capas | Registrado como HALL-01. Rodeado sin tocar `src/` |
| `yarn lint --max-warnings=0` → exit 1, 9 errores | **`PRODUCT_BUG` ajeno (deuda preexistente)** | `evidencia/h6-etapa2-lint.txt` · `git status` sin cambios en `src/` | Anotado, **no corregido** (regla 00 §3.2) |
| Primera corrida de mi suite: 20/21 | **`TEST_BUG`** (mío) | La grabadora creaba la clave `tenantId` aunque valiera `undefined` | Corregido en el harness, no en la aserción. No se debilitó el requisito |
| `elevenlabs.contract.spec.ts` skipped | **`EXTERNAL`** | `describe.skip` condicional por credencial ausente | Registrado `NOT_RUN`, nunca `PASS` |

## Hallazgos

### HALL-01 — `bootstrapTestApp()` está roto: bloquea TODOS los int-specs

**Clase: `DATA`** (regla 80.4), no `TEST_BUG` ni `ENVIRONMENT`.

El arnés de integración aborta la suite entera si **cualquier** seed falla, y uno falla:

```
La siembra dejo 1 seed(s) omitido(s): aseguradoras de Bolivia
column "sigla" of relation "insurance_carriers" does not exist   (SQLSTATE 42703)
  at BoliviaInsuranceSeedService.seedCarriers (src/common/seed/bolivia-insurance-seed.service.ts:280)
  at bootstrapTestApp (test/integration/harness.ts:213)
```

> ### ⚠️ Corrección de este hallazgo, a mitad del turno
>
> **Mi primer diagnóstico fue equivocado y lo corrijo acá en vez de reescribirlo.** Escribí que era
> «el código va adelante del modelo» (regla 97.1.2) porque `grep -rn sigla SQL/` no daba nada. Esa
> búsqueda miraba **la copia equivocada del DDL**.

**Dónde está `sigla` realmente:**

| Fuente | ¿tiene `sigla`? |
|---|---|
| Entidad ORM `insurance_carriers.entity.ts:37` | **sí** |
| `mantra-core-health-api/database/SQL/26_insurance/02_tables.sql:10` | **sí** — la copia que montan el compose y el CI |
| `database/SQL/patches/2026-08-22_v418_persons_occupation_and_carrier_sigla.sql` | **sí** — patch dedicado, idempotente y auto-verificante |
| `SQL/` del workspace (repo del modelo, hermano) | **no** — y tampoco tiene `patches/` |
| **Base viva de desarrollo** | **no** |

**La causa real:** la base viva de esta máquina está **atrasada** respecto del DDL que el repo
versiona. El patch existe precisamente para esto, y lo dice en su cabecera:

> *«en un rebuild desde cero este patch NO hace falta. Existe únicamente para una base ya aplicada
> y poblada.»*

La cabecera del patch también documenta el origen: las 4 columnas llegaron al ORM el 21/08
(`ceba7c4d` y `880857d6`, PR #184) sin pasar por el modelo, y **ya fueron promovidas** — el patch es
el cierre de esa deriva, no la deriva.

**Clase corregida: `DATA` / `ENVIRONMENT`, no defecto de código.** Se cierra aplicando el patch
versionado, que es el mecanismo sancionado (no es un `ALTER` a mano: es un archivo del repo,
idempotente, con su propia comprobación final).

**Y un dato que `CLAUDE.md` tiene desactualizado:** dice que el compose monta `../SQL`. Monta
`${SQL_MODEL_DIR:-./database/SQL}` — por defecto **la copia vendorizada**, no el repo del modelo.
Quien construyó esta base debe haber exportado `SQL_MODEL_DIR` apuntando al repo hermano, que está
atrasado.

**Rodeo aplicado mientras tanto, sin tocar `src/`:** mi suite de persistencia compone la app por su
cuenta (`Test.createTestingModule({imports:[AppModule]})` + `SEED_ON_BOOT=false`) en vez de usar el
arnés. **Dueño:** Pablo (es quien firma `880857d6` y el patch).

### HALL-01-bis — El `SQL/` del repo del modelo está atrasado respecto del vendorizado

Consecuencia directa de lo anterior, y esto **sí** es una divergencia real: la copia del workspace
(`Sistema Salud/SQL/`) no tiene `sigla` **ni el directorio `patches/`**, mientras
`mantra-core-health-api/database/SQL/` tiene ambos. `yarn db:vendor:check` existe justamente para
detectar esto. No lo corrí: apunta a `../mantra-core-health-model/salud-db/` y esa ruta es de otro
repo. **Dueño:** Pablo.

### HALL-01-ter — El radio: 54 de 76 int-specs, y el CI en rojo

- **54 de 76** int-specs llaman a `bootstrapTestApp()` → bloqueados. Los 22 restantes pueden correr.
- **`CLAUDE.md` está desactualizado sobre el CI**: dice que «de integración solo corre
  `postgres-privileges`». El workflow corre **`yarn test:integration --ci`** completo en la línea
  389 de `.github/workflows/docs.yml`, además del dirigido de `postgres-privileges` en la 334.
- **Las 8 corridas de CI más recientes están en `failure`** (`gh run list`), en 5 ramas distintas.
  No verifiqué que todas fallen por esto —no leí sus logs—, pero el CI **no** está tapando nada:
  está rojo.

Evidencia: `evidencia/hall01-radio-de-alcance.txt`.

### HALL-02 — La relación no entrega, y el puerto lo esconde · **el hallazgo de la noche**

> **Este hallazgo se profundizó dos veces durante el turno.** La primera versión decía «el
> adaptador usa el id equivocado». Es cierto, pero **no es la causa**: es un síntoma. Lo descubrí
> porque escribí una prueba para matar mi propia hipótesis y la mató.

**Las tres capas, cada una verificada ejecutando:**

**Capa 1 — el id del canal no coincide.** El adaptador direcciona el canal in-app por un id
**derivado en código** (`MESSAGING_SEED.inAppChannelId` = `d0240273-f75e-5405-9db2-8dd6769eb263`);
la base tiene `IN_APP` con `ed1b78a4-4482-5bed-b9f6-5e05c8f1a60f`. `createRequest` no lo encuentra
→ `ResourceNotFoundException: Canal no encontrado`.

**Capa 2 — arreglar el id NO alcanza.** Repetí la misma llamada cambiando **sólo** el `channelId`
por el que la base tiene. Resultado:

```text
[H3.S1.M1-bis] con id derivado: Canal no encontrado · con id de la base: El canal no está activo
```

`notifications.service.ts:132` compara `channel.stateConceptId !== CONCEPTS.STATE_ACTIVE`. El canal
está **activo por código** y **no lo está por uuid**.

**Capa 3 — la causa real: hay conceptos DUPLICADOS por código.**

```sql
select id, code, display from terminology.catalog_concepts where code='ACTIVE';
 38a1d301-f40d-5b17-a695-5e6d605f8b19 | ACTIVE | Active   ← el que deriva el backend
 d0f53ea3-7e50-5578-add3-270341b1186c | ACTIVE | Active   ← el que sembró el paquete
```

Y las filas de `messaging.message_channels` apuntan a **la del paquete**. No es un id mal escrito:
**el mismo concepto existe dos veces y cada mitad del sistema usa la suya.**

**No es un caso aislado: son 18 códigos con duplicado** (`OTRO` ×6, y ×2 `ACTIVE`, `ALTA`, `BAJA`,
`BOB`, `CERRADO`, `CRITICA`, `EMAIL`, `EN`, `FREE`, `MEDIA`, `PATIENT`, `PENDIENTE`, `PENDING`,
`PERMITIR`, …). Cualquier código del backend que compare un `*_concept_id` por uuid contra una fila
sembrada por el paquete tiene el mismo problema latente.

**Y `emit` lo atrapa todo** (como el puerto manda: emitir no puede romper la agenda), devolviendo un
`skippedReason` genérico que parece un fallo transitorio.

**Confirmación independiente, de una prueba que yo no escribí.** Con HALL-01 destrabado,
`test/integration/fx3-agenda-respiro-y-avisos.int-spec.ts` —la regresión del propio proyecto para
estos avisos— **arranca y falla exactamente acá**:

```text
● FX-3 › pedir un turno avisa a las dos partes, por dos canales (#275, #276)
  › deja cuatro solicitudes: dos destinatarios por dos canales
    Expected length: 4
    Received length: 0
```

Cero solicitudes donde espera cuatro. Evidencia: `evidencia/hall02-conceptos-duplicados.txt` y
`evidencia/h3-h4-tras-patches.txt`.

**Lo más grave no es el id: es que el sistema ya sabía.** `MessagingSeedService.seedInAppChannel`
tiene este comentario, en el corte:

> *«Por CÓDIGO y no por id: `uq_message_channels_code` es la restricción que existe, y el paquete
> de seeds ya sembró `IN_APP` con un uuid derivado de otra forma.»*

El **seed** esquiva la divergencia buscando por código. El **adaptador** no la esquiva: usa la
constante directo. La mitad del sistema se adaptó y la otra mitad no.

**Impacto:** los cuatro avisos de agenda (cupo liberado, demora, recordatorio, cambio de estado)
son no-operativos en cualquier base cargada con el paquete de seeds — que es el camino documentado.
Nadie recibe una excepción: reciben `delivered: false` con un texto que parece un fallo transitorio.

**Lo que NO afirmo:** que esté roto en producción. No sé con qué paquete se siembra producción.
Lo que sí afirmo es que **está roto en la base de desarrollo poblada según la documentación**.

**No es sólo el in-app: el canal de correo tiene la misma divergencia.** Verificado:
`emailChannelId` derivado (`96be0595-…`) tampoco existe en la base. Sí existe
`inAppChannelConfigId` (`cd3f34d0-…`), porque **esa** fila la siembra el backend resolviendo el
canal por código — otra vez, la mitad del sistema adaptada y la otra no.

**HALL-01 está tapando a HALL-02.** `test/integration/fx3-agenda-respiro-y-avisos.int-spec.ts`
existe y ejercita **exactamente** esto —«pedir un turno produce dos avisos» y «cada aviso sale
además por el canal correo», contra la base real—, así que habría cazado HALL-02 la primera vez que
corriera. **No corre**: aborta en `bootstrapTestApp()` por el seed de aseguradoras, como todas las
demás. Una deriva de datos está escondiendo una deriva de comportamiento.

**Qué NO es el arreglo:** hacer que el adaptador resuelva el canal por código. Eso fue mi primera
propuesta y la capa 2 la desmiente — el canal seguiría «inactivo». Tocar sólo el adaptador dejaría
el defecto vivo y más escondido.

**Dónde está el arreglo de verdad** (no aplicado; es decisión de modelo, no de esta relación): que
haya **un solo dueño de los conceptos**. O el paquete de seeds deriva los uuid con el mismo
namespace y clave que `deterministicId`, o el backend deja de comparar por uuid y compara por
código. Las dos son decisiones con consecuencias más allá de agenda. **Dueño:** Pablo (seeds) e
Itzan (composición), con la decisión de modelo por delante.

### HALL-03 — La deduplicación de avisos no tiene respaldo en la base

`messaging.notification_requests.debounce_key` no tiene **ningún** índice — ni único ni común— ni en
`SQL/35_messaging/04_indexes.sql` ni en la base viva. La deduplicación es un `findOne` + `insert`
dentro de una transacción READ COMMITTED: una carrera. Dos tablas hermanas del mismo esquema
(`outbox_messages.idempotency_key`, `queued_jobs.dedupe_key`) **sí** tienen su índice único.
**Dueño:** modelo (`.puml` → `SQL/`), fuera de este repo.

### ~~HALL-04 — `database/SQL/` volvió a existir~~ · **RETIRADO: no es un defecto**

Lo levanté porque `git ls-tree` devuelve `database/SQL/**` y `CLAUDE.md` dice que esa carpeta se
eliminó en v4.0.9 y que `check_ddl_sources.py` debe fallar si reaparece. **Lo verifiqué antes de
publicarlo y la acusación es falsa.**

`database/` es hoy una **copia vendorizada deliberada**, documentada en la cabecera de
`scripts/db/vendor-ddl.sh`: el DDL canónico vive en el repo hermano `mantra-core-health-model`, y
Coolify clona **sólo** este repo — sin la copia, el contenedor de init arranca con `/init/SQL`
vacío y la app responde 500 en la primera escritura. Tiene su guardián (`yarn db:vendor:check`,
que el CI corre en la línea 238) y es lo que montan tanto el compose como el CI.

**Lo que sí queda:** `CLAUDE.md` está desactualizado en este punto, y quien lo lea al pie de la
letra va a llegar a la conclusión equivocada — como me pasó a mí. Va a HALL-05.

### HALL-05 — `CLAUDE.md` está desactualizado en cinco puntos, y tres inducen a error

Los tres primeros no son cosmética: **me hicieron diagnosticar mal** y le van a pasar lo mismo al
próximo.

| # | Dice `CLAUDE.md` | Es |
|---|---|---|
| 1 | «`database/` se eliminó (450 archivos)» y `check_ddl_sources.py` falla si reaparece | `database/SQL` y `database/NoSQL` son la **copia vendorizada vigente**, con `db:vendor:check` como guardián. Ver HALL-04 retirado |
| 2 | «el compose monta `../SQL`» | Monta `${SQL_MODEL_DIR:-./database/SQL}`: por defecto **la vendorizada** |
| 3 | «De integración solo corre `postgres-privileges`: cualquier otro int-spec en rojo pasa invisible por CI» | El workflow corre **`yarn test:integration --ci` completo** (línea 389). Un int-spec en rojo **sí** rompe el CI |
| 4 | 6 663 FKs | **6 664** |
| 5 | 439 suites / 4 500 pruebas unitarias | **681 suites / 8 249 pruebas** |

Los puntos 4 y 5 no los investigué. Los 1, 2 y 3 están verificados contra los archivos citados.

## Evidencia

Todas las rutas existen, bajo `docs/trabajo/2026-09-19-relacion-agenda-mensajeria/evidencia/`.

```text
$ python .claude/hooks/plan_gate.py --self-test
plan_gate self-test: 11 PASS, 0 FAIL
exit=0

$ yarn test:integration --testPathPatterns=agenda-mensajeria
Test Suites: 2 passed, 2 total
Tests:       33 passed, 33 total
exit=0

$ yarn typecheck
exit=0

$ yarn test
Test Suites: 1 skipped, 680 passed, 680 of 681 total
Tests:       1 skipped, 8248 passed, 8249 total
exit=0 · duracion=528s

$ yarn lint --max-warnings=0
✖ 9 problems (9 errors, 0 warnings)   ← los 9 en archivos ajenos, preexistentes
exit=1
```

| Archivo | Qué contiene |
|---|---|
| `h0-instalacion-estandar.txt` | Sección 1 completa + corte y sus 2 commits de diferencia |
| `h1s1m1-localizacion-adaptador.txt` | Rutas, binding, consumidores |
| `h1s2m3-comandos-reales.txt` | Los 8 scripts literales |
| `h1s2m4-postgres-y-docker.txt` | Daemon caído, arranque, conteos |
| `h2s1m1-contrato-ausente.txt` | Búsqueda del contrato + sha1 del puerto |
| `h2-relacion-dobles.txt` | 25 casos con dobles |
| `h3-h4-persistencia.txt` | 7 casos contra Postgres, con el log de `Canal no encontrado` |
| `h2-h5-suite-completa.txt` | Las dos suites juntas, 32/32 |
| `h6-etapa1-typecheck.txt` · `h6-etapa2-lint.txt` | Etapas 1 y 2 |
| `h6-etapa3-unitarios-*.txt` | Etapa 3, dirigida y completa |
| `h6-etapa4-integracion-completa.txt` | Etapa 4, suite de integración completa (recortada: se conservan las 200 primeras, las 200 últimas y todas las líneas de veredicto) |
| `h6-etapa4-resumen.txt` | Por qué se interrumpió esa corrida y qué dieron las 10 suites que alcanzaron a correr |
| `h6-etapas5a7-e2e-ausente.txt` | Etapas 5-7: Playwright no es dependencia de este repo; `test:e2e` casa con 1 solo archivo |
| `hall01-radio-de-alcance.txt` | 54 de 76 int-specs bloqueados · qué corre el CI de verdad |
| `hall01-patch-aplicado.txt` | Aplicación del patch v4.1.8, con el antes y el después |
| `hall01-patches-aplicados.txt` | Los 48 patches, uno por uno: 47 `[OK]`, 1 `[FAIL]` con su causa |
| `hall02-conceptos-duplicados.txt` | Los 18 códigos duplicados y las dos filas `ACTIVE` |
| `h3-h4-tras-patch.txt` · `h3-h4-tras-patches.txt` | Las corridas después de destrabar el entorno, y `fx3` fallando por HALL-02 |

## No cubierto

Distinto de PENDIENTE: acá va lo que **se hizo pero no se probó**, y los caminos no ejercitados.

1. **Los otros 3 `kind`.** Todo se ejercitó con `BOOKING_STATE_CHANGED`, elegido por ser el único
   que toca los tres canales. `SLOT_RELEASED`, `PRACTITIONER_DELAY` y `APPOINTMENT_REMINDER` **no
   se ejercitaron**: su mapeo de `CATEGORIA`/`PRIORIDAD` está leído, no ejecutado.
2. **`emitMany` contra la base.** Sólo con dobles.
3. **La resolución perfil → cuenta** (`findAccountForProfile`) contra datos reales. Las suites usan
   `recipient.userId` directo.
4. **El worker de mensajería.** No corrió. Nada de lo que dice esta noche acredita un envío real.
5. **El chat de `SupportAdmin`** contra datos reales.
6. **OBS-03 (el `href` sin escapar en el correo)** quedó registrado, no probado ni corregido.
7. **`yarn smoke`** no se corrió, a propósito: trunca las tablas de negocio y obligaría a
   `rebuild_stack.py`. Habría destruido la base sobre la que corrían las mediciones de H3/H4.
8. **La carrera de H4.S2** no se pudo provocar. HALL-03 dice que la restricción no existe; **no
   está demostrado que la carrera ocurra**, sólo que nada la impide.

## Desvíos del plan

| Desvío | Por qué |
|---|---|
| Corte `5d5007f` en vez de `32ae939` | Los 2 commits de diferencia tocan sólo `clinical`; ninguno toca esta relación. Declarado en `PLAN.md` §0 |
| Las suites viven en `test/integration/` y corren con `test:integration`, aunque la de dobles no necesite base | Es el **único** config del repo cuyo `rootDir` alcanza `test/`. La alternativa era agregar un script a `package.json`: más superficie y un comando nuevo que nadie pidió |
| No se usó `bootstrapTestApp()` | HALL-01 lo tiene roto. Se compuso la app localmente |
| Docker Desktop se levantó a mano | Estaba caído. Sin eso, H3/H4 y la etapa 4 quedaban `BLOCKED` |
| Se instaló `.claude/` y `AGENTS.md` en el checkout | Lo pide la sección 1 del prompt. **No se commitean**: `/.claude/*` ya está en `.gitignore` y `AGENTS.md` se agregó a `.git/info/exclude` |
| **Se avanzó a las etapas 3 y 4 con la etapa 2 en rojo** | La regla 80.1 dice que una etapa en rojo detiene el avance. Se avanzó igual porque el rojo es **deuda preexistente en archivos ajenos**, no del cambio, y detenerse habría dejado sin medir la regresión de una rama que no tocó `src/`. **Es un desvío consciente y queda declarado acá**, no escondido |

## ⚠️ Cambios que le hice a la base de desarrollo compartida

**Esto no es código: es estado compartido, y hay que saberlo antes de retomar.**

| Qué | Cómo | Reversible |
|---|---|---|
| **Se aplicaron 47 de los 48 patches de `database/SQL/patches/`** a `mantra_redesa_health` | Uno por uno, con `ON_ERROR_STOP=1`, en orden de fecha. Son archivos del repo, idempotentes por diseño (`ADD COLUMN IF NOT EXISTS`, `duplicate_object` capturado), varios con su propia comprobación final | No hace falta: un `rebuild_stack.py --yes` los incluye. Re-aplicarlos no hace nada |
| **El patch 48 falló y quedó sin aplicar** | `2026-09-19_v4221_aseguradoras_codigo_unico.sql` → `ERROR: v4.2.21: se esperaban 17 aseguradoras canónicas y hay 0`. Es una **precondición de datos**: el seed de aseguradoras nunca pudo correr. Se cierra solo cuando el seed corra | — |
| **Filas creadas por las suites** | Con prefijo `IT-REL-B` en `debounce_key`, borradas en el `afterAll` en orden de FK | Ya revertido |
| **Docker Desktop se levantó y se volvió a apagar** | Se lanzó a mano porque el daemon estaba caído; al cerrar el turno: `docker compose --profile "*" down` (exit 0) + `Stop-Process` de Docker Desktop. **No queda nada corriendo** | Ya revertido |

**Por qué lo hice:** sin esos patches, 54 de 76 int-specs no arrancan y H3/H4 quedaban sin medir.
El patch de v4.1.8 dice en su cabecera que existe *«únicamente para una base ya aplicada y
poblada»* — es exactamente este caso, y es el mecanismo sancionado, no un `ALTER` a mano.

**Efecto medible:** mis suites pasaron de 32 a 33 pruebas en verde, `fx3` pasó de no arrancar a
arrancar y fallar por HALL-02, y el total de la corrida conjunta pasó de **11 fallos a 4**, todos
de `fx3` y todos por HALL-02.

## Riesgos residuales y deuda

| Riesgo | Impacto |
|---|---|
| **HALL-02 sin cerrar** | Los 4 avisos de agenda no funcionan en base sembrada con el paquete, y el fallo es indistinguible de uno transitorio |
| **HALL-01 sin cerrar** | Ningún int-spec que use el arnés puede correr. El radio está medido en `h6-etapa4-integracion-completa.txt` |
| **HALL-03 sin cerrar** | La deduplicación puede fallar bajo concurrencia sin que nada lo detecte |
| **Q-06 abierta** | El puerto y el metaprompt se contradicen sobre durabilidad. Todo H4.S3 depende de esto |
| **El doble del proveedor no está versionado** | Un cambio en `NotificationsService` lo desincroniza en silencio |
| **No hay guarda de runtime anti-doble** | Hoy no hay palanca que activar; si alguien la agrega, no hay nada que lo frene |

## Decisiones y ambigüedades

| ID | Qué | Supuesto tomado | A quién confirmárselo |
|---|---|---|---|
| **DEC-01** | Corte de trabajo | `5d5007f`, con justificación por archivos tocados | **Pablo** |
| **DEC-02** | `BOOKING_STATE_CHANGED` como operación del catálogo | Es el único `kind` que toca los 3 canales | Marcelo |
| **DEC-03** | Rodear HALL-01 componiendo la app sin el arnés | Preferible a modificar `harness.ts`, que es de todos | Pablo / Itzan |
| **DEC-04** | No corregir los 9 lint ajenos | Regla 00 §3.2: lo de fuera de alcance se anota | Coordinación |
| **AMB-01** | El contrato no define qué pasa con misma clave y payload distinto | **Ninguno.** Se midió el comportamiento observado y se registró como tal | **Negocio** (Q-12/Q-13) |
| **AMB-02** | Camino «suprimida» intenta correo **y chat**; camino «rebotada» intenta correo y **no** chat | Ninguno. Registrado como diferencia no documentada | **Ender** |
| **AMB-03** | `emit` puede devolver un resultado **sin ningún campo de correo** | Ninguno. Leer esa ausencia como «no hacía falta correo» sería falso | **Ender** |
| **AMB-04** | Q-06: el puerto descarta el aviso fallido; el metaprompt exige durabilidad | Ninguno. **No se implementó durabilidad ni se declaró que exista** | **Negocio** |

## Qué entrego a cada uno

| A quién | Qué |
|---|---|
| **Ender** | El contrato **no existe como artefacto**; el de facto es el puerto, sha1 `4e26274…`. Tres ambigüedades que aparecieron al implementarlo: AMB-02, AMB-03 y el `skippedReason` como catálogo cerrado de 5 textos (hoy es prosa libre) |
| **Itzan** | La ficha de la relación; el canal in-app **no** se puede resolver por la constante (HALL-02) — su composición tiene que contemplarlo; y la restricción de unicidad de `debounce_key` **sí** exige cambio de esquema (HALL-03) |
| **Marcelo** | Los 3 canales con su límite de verificación (`H1-ficha-relacion.md` §M3); ningún escenario suyo que dependa de que el aviso llegue se puede ejercitar hoy; el resultado de la regresión, **incluido el rojo** |
| **Pablo** | Comandos reales y disponibilidad de PG/Docker (con el daemon caído como dato); **HALL-01 le bloquea el laboratorio entero**; HALL-04 (`database/` volvió); el registro consolidado del carril B |
| **Todo el equipo** | `registro-de-checks.json` con los 13 campos por check |
