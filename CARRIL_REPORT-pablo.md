# Carriles Pablo (tanda 3) — reporte

**Base:** `dev` al día (API `816e2d93`)
**Entorno:** stack `mantra-redesa` — Postgres :5433, OpenSearch :9201, API desde el fuente en :3011
(el contenedor `mantra-redesa-api-1` corre una imagen anterior; para probar el código de la rama
hay que levantarla aparte).

| Carril | Estado |
|---|---|
| **P10** · Búsqueda real (OpenSearch) | **Cerrado y verificado contra el stack vivo** |
| P11 · Defensa y SEO | No arrancado |
| P12 · Jobs del worker | No arrancado |
| **P13** · Confianza y señales | **Cerrado y verificado contra el stack vivo** |
| P14 · SSE | No arrancado |
| P15 · Calidad a escala | No arrancado |
| P16 · Billing (lecturas) | No arrancado (cola) |

---

## P10 · Búsqueda real — OpenSearch deja de estar de adorno

**Rama:** `pablo/p10-opensearch`

### Lo que estaba pasando

OpenSearch corría en `:9201` desde el primer día del stack **con cero documentos de dominio**
(`_cat/indices` sólo mostraba `.plugins-ml-config` y `top_queries-*`). El buscador público que P4
dejó visible filtraba en SQL con `LIKE`: sin stemming, sin ranking, y `/public/nearby` devolvía
siempre `items: []` con un log que decía «aún sin índice geográfico».

Y había algo peor debajo, que sólo se vio al montar el journey: **`community.public_profiles`
tenía las 8 filas con `visibility_concept_id` NULL**. `POST /community/public-profiles` —el alta
de bootstrap— nunca escribía esa columna, y el directorio compara por igualdad contra `PUBLIC`,
no por «distinto de privado». Es decir: **el buscador público de P4 estaba sirviendo un directorio
estructuralmente vacío y nada fallaba.** El `PUT /community/profiles/me` del dueño sí la escribía;
sólo el camino de admin no. Arreglado en esta rama (ver «Lo que se corrigió de paso»).

### Lo que se hizo

1. **Analizador español + geo, declarados en código.** El carril mandaba usar
   `search_platform.search_index_templates`; esa tabla **no existe** en la base (`\dt
   search_platform.*` no devuelve nada, el esquema no está creado) — el mecanismo real es el
   registro `SEARCH_INDEX_REGISTRY` de `search-platform.constants.ts`, y ahí se declaró todo.
   Índice nuevo `community_public_profiles` con `es_text` (`lowercase` + `asciifolding` +
   `spanish_stop` + `light_spanish` stemmer), normalizador `es_keyword` para los filtros,
   `search_as_you_type` en `displayName.autocomplete` y `location` como `geo_point`.
2. **Índice aparte del interno, con tenant sentinela.** El directorio público atraviesa todos los
   tenants sin sesión; el índice interno `directory_profiles` se apoya en el filtro de tenant para
   separarlos. Mezclarlos habría obligado a relajar esa barrera, así que el directorio vive en su
   propio índice sellado con `PUBLIC_DIRECTORY_TENANT = 'public-directory'`, que **no es ninguna
   organización**. La invariante de `SearchIndexService` (todo query lleva su `term { tenantId }`)
   queda intacta.
3. **Job `search-indexer`** en `worker-community`. **Compara** base contra índice en cada tick en
   vez de reindexar siempre: reindexar cada minuto sería tirar el índice sesenta veces por hora y
   dejar el buscador a oscuras entre el borrado y el primer lote. Si faltan documentos → upsert;
   si sobran (un perfil despublicado que sigue apareciendo a anónimos) → recrear.
4. **Reindexado completo**: `yarn search:reindex`. Idempotente por id de documento, pagina por
   clave (no por `offset`, que se saltea filas si hay altas concurrentes), imprime «indexados N de
   N» y **sale con 1 si el índice no lo confirma**.
5. **Los endpoints públicos consultan el índice y degradan a SQL** sin cambiar un solo campo del
   DTO — el front no toca nada.
6. **«Más cercana» real**: `geo_distance` acota por radio en el `filter` y `_geo_distance` ordena;
   la distancia sale de OpenSearch, no de un recálculo en memoria sobre una página ya recortada.
   La red de SQL usa caja envolvente + el mismo `haversineKm` que rotula la pantalla.
7. **Sólo campos públicos (tarea 40)**, con dos barreras: el índice declara `documentKeys` y
   `SearchIndexService` **rechaza la escritura** de un documento con un campo de más; y la lectura
   vuelve a enumerar claves a mano. Un campo nuevo en el índice no se publica solo.

No se hizo el punto 7 opcional (embeddings con `vector_rag`): el propio carril lo condiciona a que
la búsqueda léxica funcione primero.

### Verificación contra el stack vivo

Fixture por API (2 perfiles públicos) + direcciones con coordenadas en La Paz y El Alto.

```
$ yarn search:reindex
  Antes:  2 perfiles públicos · 0 documentos · índice disponible
  indexados 2 de 2 — el índice confirma 2 · 312 ms
  ✓ Directorio público reindexado: 2 de 2
```

| Comprobación | Resultado |
|---|---|
| `GET /public/search?q=cardiologo` (sin tilde) | Devuelve «Dra. Marisol Quispe Ticona / Cardiología» |
| `GET /public/search?q=cardiología` (con tilde) | El mismo perfil |
| `GET /public/search?q=pediatras` (plural) | Devuelve «Dr. Ramiro Mamani / Pediatría» — stemming |
| `city` en la fila del buscador | Ya no es `null`: llega «La Paz» / «El Alto» desde el índice |
| `GET /public/nearby?lat=-16.5&lng=-68.15&radiusKm=20` | `cardio-la-paz` a 0 km, `pediatra-el-alto` a 4.4 km, en ese orden |
| El mismo con `radiusKm=2` | Sólo `cardio-la-paz`: El Alto queda fuera del radio |
| `GET /internal/community/search/health` | `{available: true, profiles: 2, documents: 2, serving: true}` |

**Degradación** (API levantada contra `OPENSEARCH_NODE=http://localhost:9299`, inalcanzable):

| Comprobación | Resultado |
|---|---|
| `GET /public/search?q=cardiologo` | **HTTP 200**, `items: []` — el SQL no hace stemming |
| `GET /public/search?q=Quispe` | **HTTP 200**, devuelve el perfil: la red de SQL sirve de verdad |
| `GET /public/search` (sin texto) | **HTTP 200**, el directorio entero |
| `GET /public/nearby?...&radiusKm=20` | **HTTP 200**, las mismas distancias (0 y 4.4 km) |

Es exactamente lo que el carril pedía: **encuentra menos y peor, pero no rompe.** Que `cardiologo`
devuelva vacío por SQL y el perfil por índice es la medida de para qué sirvió P10.

Capturas en `evidencias/p10/`.

### Pruebas

`yarn test src/modules/community src/modules/search_platform src/worker/jobs` → **383 pasan**
(48 suites). Nuevas: 22 en `search-index.service.spec` (analizador, geo, guardia de campos,
`recreateIndex`), 11 en `community-search-index.service.spec` (la proyección no filtra ni un
identificador interno; sus claves son exactamente las declaradas), 13 en
`community-public.service.spec` (sirve del índice, degrada a SQL, geo) y 5 en
`search-indexer.job.spec`. `yarn lint` y `yarn typecheck` limpios.

### Lo que se corrigió de paso

`POST /community/public-profiles` ahora acepta `visibility` (opcional, **privada por omisión** —
publicarse en un directorio abierto es una decisión, no el efecto secundario de un alta) y la
escribe. Sin esto, ningún perfil creado por el camino de admin podía aparecer nunca en el
directorio público. Es aditivo y no cambia el comportamiento de quien no manda el campo.

### Para P11 y P13

- **P11 va encima de P10** sobre los endpoints públicos (orden que el carril me pedía definir):
  P10 ya está en `dev`, así que el rate limit y el ETag se montan sobre el camino del índice.
- **P13**: el documento del índice ya declara `verified` y `hasPublishedAgenda`; el segundo está
  hoy en `false` fijo, esperando el cruce con `scheduling`. El orden del buscador ya pone
  `verified` primero (decisión D7: se indexan, rankean después).
- El indexador descubre altas y bajas **comparando**, no escuchando. Un disparador aditivo en la
  escritura del perfil bajaría la latencia del minuto a cero; queda anotado, no olvidado.


---

## P13 · Confianza y señales — el sello de verificado deja de ser decorativo

**Rama:** `pablo/p13-confianza-senales` (sale de `pablo/p10-opensearch`, no de `dev`: el sello
tiene que viajar también al índice, y hacerlo en dos ramas paralelas era garantizar el conflicto).

### Lo que estaba pasando, verificado

- **`community.verified_badges` no tenía ningún camino de escritura desde la aplicación.** Había
  lectura (`listBadgesBySubject`) y nada que la llenara: un sello sólo podía existir si alguien
  metía la fila a mano en la base. Y al revés, los profesionales que **sí** pasaban la
  verificación de matrícula (H-01, que ya funciona) **no ganaban el sello**, porque
  `identity_assurance` activaba la licencia y nadie miraba community.
- El buscador leía `public_profiles.verification_status_concept_id`, una columna que nada mantenía
  atada a la verificación real.
- Los resultados no decían si el profesional **atiende**: `PAC-CITA-001` («puedo agendar con lo
  que veo») era una promesa que la pantalla no podía cumplir.
- `ORG-PUB-005` no existía: el profesional publicaba su vitrina y no sabía si servía de algo.

### Lo que se hizo

1. **El puente `identity_assurance` → `verified_badges`.** Se engancha en
   `IdentityVerificationEffectsService`, que ya era el lugar donde un caso verificado se traduce a
   su efecto de dominio (activar la matrícula, verificar el tenant) — el mismo patrón aditivo, sin
   que el motor de verificación tenga que conocer community. El sello se emite **dentro de la
   misma transacción que cierra el caso**, y su `validTo` sale del vencimiento de la propia
   matrícula: un sello que dure más que la habilitación que lo respalda es el sello que miente.
2. **Revocación, por los tres caminos por los que un sello puede dejar de valer:**
   - `IdentityAssertionsService.revoke` → la autoridad retiró el respaldo (`REVOKED`);
   - `IdentityCasesService.expireSweep` → el caso venció (`EXPIRED`);
   - job nuevo `badge-expiry` en `worker-community` → **el sello venció por su propia fecha**,
     que es el caso que ningún evento cuenta. Sin él, un sello con vencimiento se seguiría
     mostrando activo hasta que alguien revocara el caso a mano.

   El perfil queda en `STATE_EXPIRED` y **no en `PENDING`**: la pantalla tiene que poder decir
   «Verificación vencida». `PENDING` diría «nunca se verificó», que es falso, y un hueco silencioso
   sería indistinguible de un perfil que nunca lo intentó.
3. **Un campo y una semántica en todas las superficies.** `verifiedBadge` (`status` +
   procedencia + fechas) en el resultado del buscador y en la ficha pública. `verified` se mantiene
   —el front ya lo consume— pero pasa a ser su **resumen derivado**: `verified === (status ===
   'VERIFIED')`. El sello manda sobre la columna resumen; si se desincronizaran, gana el que tiene
   la evidencia detrás, y hay una prueba que lo fija.
4. **«Atiende» en resultados.** `hasPublishedAgenda` sale de `scheduling.practitioner_schedules`
   vigente, y `nextAvailableDate` de `scheduling.bookable_slots` con capacidad libre, **truncado a
   día**: la hora exacta cambia entre que la tarjeta se pinta y el paciente la toca. Son dos
   columnas y no una porque un profesional puede tener agenda declarada y ningún hueco libre, y el
   CTA tiene que decir la verdad en los dos casos. Va también al índice (coordinado con P10, que
   ya lo declaraba en `false` esperando este cruce).
5. **Estadísticas del perfil (`ORG-PUB-005`).** `GET /community/profiles/me/stats`: visitas y
   apariciones en búsquedas de los últimos 7 días, con desglose diario. Se guarda **un número por
   perfil y día** en Redis —el mismo mecanismo que P12 prevé para los contadores del módulo—: sin
   id de visitante, ni IP, ni sesión. Como consecuencia son visitas y no visitantes únicos, y así
   se rotula. El registro no se espera y sus fallos se tragan: la ficha de un profesional no puede
   caerse porque Redis esté ocupado.
6. **Prestigio conectado.** `verificationTerm()` es el punto por el que P12 va a leer el término,
   y está en community a propósito: si el job leyera la columna resumen por su cuenta, el prestigio
   quedaría atado a lo que se puede desincronizar en vez de al sello con evidencia. Un sello
   vigente suma; uno vencido **no resta** — castigaría a quien está renovando la matrícula.

**La escotilla manual**: el carril decía «restringida a `SECURITY_ADMIN` con auditoría, o se
elimina si nadie la usa». No existía ninguna, y eliminar lo que no existe no ayuda a nadie: se creó
`POST /internal/community/verification/badges` con `SECURITY_ADMIN`, marcada como
`BADGE_METHOD_MANUAL_ADMIN` en el propio sello —así la ficha puede decir cómo se verificó y una
auditoría puede separarlas después— y anotada en `audit.verified_badges_history`.

Sobre esa tabla: **ya recibía filas por disparador de base**, con la operación genérica
(`OPERATION_INSERT` / `OPERATION_UPDATE`). Eso dice que la fila cambió, no qué significó — y un
`UPDATE` sobre un sello puede ser una renovación o una revocación, que son cosas opuestas para
quien audita. Las filas nuevas agregan esa intención más el estado con que quedó el sello.

### Verificación contra el stack vivo

| Comprobación | Resultado |
|---|---|
| `POST …/verification/badges` (SECURITY_ADMIN) | `{"action":"granted"}` |
| Ficha pública tras el alta | `verified: true`, `verifiedBadge.status: "VERIFIED"` con su método y fecha |
| Buscador tras reindexar | El sello viaja al índice y **las dos formas coinciden** |
| Documento indexado | `verifiedBadgeStatus: VERIFIED`, y sigue **sin `targetId` ni tenant real** (`tenantId = public-directory`) |
| `POST …/badges/:id/revoke` | `{"revoked":1}` |
| Ficha tras revocar | `verified: false`, `status: "EXPIRED"`, `validUntil` con la fecha — **«vencida», no un hueco** |
| Auditoría | `BADGE_HISTORY_OP_GRANTED` y `BADGE_HISTORY_OP_REVOKED` fechados, junto a las filas del disparador |
| Agenda publicada | `hasPublishedAgenda: true`, `nextAvailableDate: null` — hay agenda y no hay huecos, y se dice así |
| `POST …/verification/badges` sin token | **HTTP 401** |

El 403 con un token de no-administrador no se pudo ejercer: la base de desarrollo no tiene ninguna
cuenta sembrada sin `SECURITY_ADMIN`. En su lugar hay un spec que fija los roles exigidos por cada
handler del controlador, que es la condición que el guard aplica.

Capturas en `evidencias/p13/`.

### Dos defectos que aparecieron al correr el journey

1. **El historial se insertaba antes que el sello** y la FK lo rechazaba (500 → 422). El historial
   apunta al sello por uuid y no por relación, así que el ORM no podía deducir el orden. Resuelto
   con un flush explícito dentro de la misma transacción.
2. **`verified_badges_history.data_snapshot` es NOT NULL** y no se estaba llenando. Se llena con el
   estado del sello tras el movimiento — que además es lo que hace útil el registro: permite
   responder «cómo estaba» aunque la fila cambie después, que es justo cuando la pregunta importa.

Los dos los encontró la corrida contra la API viva, no las pruebas: son de los que sólo aparecen
cuando hay una base real del otro lado.

### Pruebas

`yarn test src/modules/community src/modules/identity_assurance src/modules/search_platform
src/modules/redis_runtime src/worker/jobs/community` → **427 pasan** (42 suites). Nuevas: 15 en
`community-verification.service.spec` (el sello sólo nace de una verificación real; vencido no es
lo mismo que inexistente; el prestigio sale del sello y no de la columna), 12 en
`identity-verification-effects.service.spec` (el puente, en los dos sentidos), 11 en
`community-public.service.spec` (las dos formas de servir el mismo perfil coinciden), 7 en
`community-profile-stats.service.spec`, 6 en `community-verification.controller.spec` (la escotilla
está cerrada con llave) y 4 en `badge-expiry.job.spec`.

### Lo que NO se hizo

- **La jerarquía visual del buscador** (verificados primero) ya la puso P10 al ordenar por
  `verified`. Acá no se tocó el ranking: cambiarlo en el mismo PR que introduce el dato mezclaría
  dos decisiones.
- **La tarjeta «Tu perfil esta semana» en el front**: la API la sirve; la pantalla es del carril
  de front, no de éste.


---

## Imagen Docker relanzada

El contenedor `mantra-redesa-api-1` corría una imagen anterior a esta tanda (por eso las
verificaciones de arriba se hicieron contra la API levantada desde el fuente en `:3011`).
Reconstruida y relanzada con el código de los dos carriles:

```
$ GIT_COMMIT=$(git rev-parse HEAD) BUILD_TIME=$(date -Iseconds) docker compose build api
  Image mantra-redesa-api:local Built

$ docker inspect <api> --format '{{range .Config.Env}}...'
  GIT_COMMIT=a365a193fe39afaf65c4e03fa343ae80de357545   ← el commit de P13
  BUILD_TIME=2026-08-18T19:46:07-04:00
```

Verificación contra el contenedor en `:3000`:

| Comprobación | Resultado |
|---|---|
| `GET /public/search?q=cardiologo` | `cardio-la-paz` · badge `VERIFIED` · `hasPublishedAgenda: true` · `city: La Paz` |
| `GET /public/nearby?lat=-16.5&lng=-68.15&radiusKm=20` | 0 km y 4.4 km, en ese orden |
| `worker-community` | Arranca con `CommunityWorkerModule` — fan-out + `search-indexer` + `badge-expiry` |

**El job del indexador, probado de punta a punta**: se borró el índice de OpenSearch a mano y el
worker lo reconstruyó solo en el tick siguiente, sin intervención:

```
Search index out of sync with the public directory  {profiles: 2, documents: 0, recreate: false}
indexados 2 de 2                                    {indexed: 2, total: 2, confirmed: 2}
```

`recreate: false` es la decisión correcta: faltaban documentos, no sobraban, así que se rellenó con
upsert en vez de tirar el índice y dejar el buscador a oscuras.

### Dos rodeos que hubo que hacer en esta máquina

1. **`docker stop` da `permission denied`** (ya conocido en este kernel). El contenedor se apagó
   mandándole la señal desde adentro — y no con `kill`, que la imagen `node:24-bookworm-slim` no
   trae: `docker exec <api> node -e "process.kill(1,'SIGTERM')"`.
2. **`postgres-init` no puede completar**: monta `../SQL` y `../NoSQL` desde la raíz del workspace,
   y en esta máquina `SQL/` está vacío y `NoSQL/` sólo tiene `55_document_store_mongodb` y
   `57_search_platform_opensearch` — falta `58_time_series_timescaledb`, que el script pide. Como
   la base **ya está provisionada** (los 60+ esquemas existen), se levantó con
   `docker compose up -d --no-deps api worker-community`. Es un hueco del entorno, no del código,
   pero cualquiera que intente recrear el stack desde cero en esta máquina se lo va a encontrar.


---

## Los tres PRs, encadenados

| PR | Rama | Base | Qué es |
|---|---|---|---|
| [#156](https://github.com/mdavila-2001/mantra-core-health-api/pull/156) | `pablo/ci-guardrails-bloqueantes` | `dev` | Destraba el gate de guardrails + cierra una fuga real en la cola de moderación |
| [#154](https://github.com/mdavila-2001/mantra-core-health-api/pull/154) | `pablo/p10-opensearch` | #156 | P10 |
| [#155](https://github.com/mdavila-2001/mantra-core-health-api/pull/155) | `pablo/p13-confianza-senales` | #154 | P13 |

Están encadenados y no los tres contra `dev` a propósito: P13 necesita el índice de P10 para que el
sello viaje también ahí, y los dos necesitan #156 para que `redesa:guardrails` —que es un gate duro
del CI— salga con 0. Cada PR se retarguetea solo a `dev` cuando el de abajo mergee.

**Orden de merge: #156 → #154 → #155.**

### La fuga que apareció al destrabar el CI

Revisando los 4 hallazgos bloqueantes de `dev` uno por uno, tres eran falsos positivos de la misma
clase (lecturas de directorio público, que cruzan tenants a propósito) y **uno era un defecto de
verdad**: `ModerationRepository.listQueuePage` listaba la cola de moderación **sin ningún filtro de
tenant**, ni en el repositorio ni en el servicio ni en el controlador. Un moderador de una clínica
veía los reportes de todas las demás. Cerrado, con dos pruebas que lo fijan.

Los tres falsos positivos van a una lista de excepciones **nueva y aparte** de la de barridos del
worker: la justificación es distinta —allá el motivo es que no se sabe qué tenants tienen algo
pendiente; acá es que la barrera no es el tenant sino el par publicación/estado— y hay que poder
revisarlas por separado.

### Dos checks en rojo que NO son de estos carriles

1. **`diagnostic_units.indexes.spec.ts`**, preexistente en `dev`. `9c5d27cf` lo había arreglado y
   `6b26d1c3` lo revirtió al regenerar el catálogo. `src/orm/catalog/indexes/*.idx.ts` dice «no
   editar a mano» y se genera desde la bóveda SALUD, que no está en esta máquina — corregirlo acá
   se revertiría otra vez. Y el spec pide lo correcto: único sobre `tenant_id` solo significa **una
   unidad diagnóstica por tenant**, y único sobre `code` solo hace chocar códigos entre
   organizaciones. Silenciarlo borraría un defecto de modelado real. **Es de Marcelo, con la
   bóveda.**
2. **El runner self-hosted**: desde esta noche las corridas mueren en `corepack enable` con
   `EACCES: permission denied, symlink … -> '/usr/bin/pnpm'`, **antes de llegar a ningún check**.
   Es nuevo (las corridas de hace unas horas sí pasaban ese paso). Mientras siga así **ningún PR de
   nadie puede ponerse en verde**. No toqué el workflow —es M0 y no puedo verificar el arreglo con
   el runner encolado—; la corrección propuesta está comentada en #156.
