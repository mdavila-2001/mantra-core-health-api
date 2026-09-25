# Plan — Motor de la carga masiva de terminología: dry-run, todo o nada, idempotencia, autorización, plantilla y OpenAPI

- Fecha: 2026-09-25 · Repos afectados: API · Predecesor: el import NDJSON que ya existe (`concept-file-import.service.ts`)
- Corte: `origin/dev` @ `343795cc2d08745692f491c50e81427215043315` · Rama: `itzan/carga-masiva-motor-2026-09-25` · Base del PR: `dev`
- Contrato compartido: `CONTRATO-CARGA-MASIVA.md` del reparto (§1 tipos literales, §2 HTTP, §4 fixtures, §5 supuestos)
- Resultado observable: un `SECURITY_ADMIN` sube un CSV o NDJSON de conceptos a una versión en borrador y puede
  validarlo sin guardar (`dryRun`), importarlo todo o nada, re-importarlo sin duplicar (`skipped`), recibir cada
  error con fila, columna y motivo, y descargar la plantilla del perfil; ningún otro rol entra y ningún camino
  devuelve 500.
- Kill-test: con la API arrancada y un token `SECURITY_ADMIN`, `ok-50.csv` con `dryRun=true` → `totalRead: 50,
  errors: 0, batchId: null` y `count(*)` sin cambio; sin `dryRun` → `inserted: 50`; otra vez → `inserted: 0,
  skipped: 50`; `con-errores.csv` → `aborted: true, errors: 5, inserted: 0` y `count(*)` igual; `no-es-nada.pdf` →
  422 `IMPORT_FORMAT_UNSUPPORTED` sin stacktrace; sin token → 401.

## Ficha de resultado

```text
RESULTADO
Actor:          SECURITY_ADMIN
Dónde:          POST /terminology/versions/{versionId}/import-file · GET /terminology/import-template
Estado inicial: sistema de codificación de prueba ZZ-… con una versión en borrador; archivo NDJSON o CSV sintético
Acción:         sube el archivo, con o sin dryRun, con perfil conceptos (por omisión)
Observable:     informe con format, profile, dryRun, aborted, totalRead, inserted, skipped, errors,
                errorSamples[{line, column?, message}] y preview (20 filas válidas)
Persistencia:   count(*) de catalog_concepts por versión y filas de catalog_import_batches con checksum
Borde / error:  archivo con 1+ problemas → aborted, nada escrito, sin lote; formato no admitido, vacío o perfil
                desconocido → 422 con código IMPORT_*; mismo archivo dos veces → skipped, sin duplicar
Fuera:          parseador XLSX, fixtures, cambios de esquema, front, jobs, actualizar conceptos existentes
Peldaño:        UNKNOWN
```

## Criterios de aceptación

| ID | Criterio (dado / cuando / entonces) |
|---|---|
| REQ-B-1 | Dado un CSV válido de 50 filas, cuando se sube con `dryRun=true`, entonces responde 200 con `totalRead: 50, errors: 0, batchId: null`, `preview` de 20, y `count(*)` de la versión no cambia ni se registra lote |
| REQ-B-2 | Dado el mismo CSV, cuando se sube sin `dryRun`, entonces responde 201 con `inserted: 50` y queda un lote con `checksum` |
| REQ-B-3 | Dado el mismo CSV ya importado, cuando se sube otra vez, entonces `inserted: 0, skipped: 50`, `count(*)` sigue en 50 y hay dos lotes con el mismo `checksum` (probado contra Postgres real) |
| REQ-B-4 | Dado un CSV con 5 filas malas, cuando se sube, entonces `aborted: true, errors: 5, inserted: 0`, cada muestra con `line`, `column` y `message`, y `count(*)` no cambia |
| REQ-B-5 | Dado un archivo que no es NDJSON/CSV/XLSX, vacío, o un `profile` desconocido, cuando se sube, entonces 422 con `IMPORT_FORMAT_UNSUPPORTED` / `IMPORT_EMPTY_FILE` / `IMPORT_PROFILE_UNKNOWN`, sin stacktrace; ningún buffer basura produce 500 |
| REQ-B-6 | Dado cualquiera de los dos endpoints, cuando lo llama alguien sin token / `PRACTITIONER` / `PATIENT`, entonces 401 / 403 / 403 y nada se escribe |
| REQ-B-7 | Dado `GET /terminology/import-template?profile=conceptos&format=csv`, cuando lo llama `SECURITY_ADMIN`, entonces descarga `plantilla-conceptos.csv` con encabezado canónico y fila de ejemplo, y re-importarla en dry-run da 1 fila y 0 errores |
| REQ-B-8 | Dado el NDJSON que ya se importaba, cuando se sube después del cambio, entonces la respuesta coincide con la de antes salvo los campos nuevos (compatibilidad) |
| REQ-B-9 | Dado cualquier camino, cuando el servicio registra en el log, entonces sólo hay contadores e identificadores, nunca `code`, `display` ni valores de filas |
| REQ-B-10 | Dado el contrato OpenAPI, cuando se regenera y valida, entonces muestra `dryRun`, `profile`, la respuesta ensanchada, los tres 422 e `import-template`, sin diff pendiente |

## Alcance

- IN: corte, baseline, base y API vivas · ejercicio del import actual · contrato de fila (`row-contract.ts`) ·
  detector de formato · parseador CSV · perfiles · NDJSON movido detrás del contrato · barrel y provider ·
  caracterización del servicio · servicio ensanchado (detección, parseo vía provider, validación por fila, todo o
  nada, dry-run, omisión de existentes por tanda, lote con checksum, logs sin contenido) · DTO ensanchado aditivo ·
  controlador con `dryRun` y `profile` · códigos `IMPORT_*` · test de integración de idempotencia contra Postgres ·
  matriz negativa de autorización · `import-template.service.ts` + `GET import-template` · OpenAPI · `PLAN.md`,
  `REPORTE.md`, `evidencia/`.
- OUT: el parseador XLSX, los fixtures de `test/fixtures/terminology-import/**` y la dependencia XLSX en
  `package.json`/`yarn.lock` (carril de Marcelo; el XLSX se cablea al integrar) · cualquier cambio de esquema ·
  `entities/**`, `src/orm/**`, `common/storage/**`, `common/files/**` · el front · cargas por job (Q-3) · aplicar
  filas válidas de un archivo con errores (Q-2) · actualizar un concepto existente (Q-7) · publicar la versión ·
  cargar catálogos reales · refactor del servicio más allá de lo que pide cada microtarea.
- Archivos reservados para este carril: `src/modules/terminology/import/**` (menos `xlsx-parser*`) ·
  `services/concept-file-import.service.ts` (+spec) · `services/import-parsers.provider.ts` ·
  `services/import-template.service.ts` · `services/row-validator.ts` (+spec) ·
  `controllers/terminology-versions.controller.ts` · `dto/import-concepts-file.dto.ts` · `terminology.module.ts`
  (sólo `providers`) · `src/common/errors/error-codes.ts` (sólo `IMPORT_*`) · `test/integration/terminology/**` ·
  `openapi/**` · `docs/trabajo/2026-09-25-itzan-motor/**`.
- Ambigüedades registradas:

| ID | Ambigüedad | Supuesto | A quién confirmar |
|---|---|---|---|
| Q-2 | Errores parciales | Todo o nada; si hoy se insertan las filas buenas, el cambio de contrato se declara | Pablo |
| Q-4 | Dónde persiste formato/perfil/dry-run | No persiste: va en la respuesta | Dueño del modelo |
| Q-7 | `code` que ya existe en la versión | `skipped`, nunca se actualiza | Pablo |
| Q-I1 | HTTP en dry-run: ¿200 o 201? | 200: el repo ya usa `@Res({ passthrough: true })` (`audio-assets.controller.ts:46`, `data-catalog.controller.ts:254`, `iam-auth.controller.ts:279`) | Pablo |
| Q-I2 | Sin índice único `(versión, code)`, ¿dos subidas simultáneas pueden duplicar? | Se prueba en H4.S1.M6; si duplica, riesgo residual y deuda del modelo | Dueño del modelo |
| Q-I3 | ¿`preview` en la respuesta real o sólo en dry-run? | En ambas (mismas 20 filas) | Justin / Pablo |

<!-- Fase 1 (descubrimiento) y fase 2 (plan por hitos) se agregan debajo al abrirlas. -->

## Fase 1 — Descubrimiento factual

Confirmado leyendo el árbol en el corte `343795cc`. Nada de esto se asume.

| # | Hecho | Dónde | Qué cambia |
|---|---|---|---|
| 1 | **Hoy NO es todo o nada**: `leer()` junta válidos y problemas, y `escribir()` inserta igual los válidos | `concept-file-import.service.ts:130-160` y su spec «una línea rota no arrastra a las buenas» (`:163`) | **Q-2 resuelta contra la realidad, leyendo el código.** El contrato pide todo o nada, así que es un **cambio de contrato deliberado**: se declara en `decision-todo-o-nada.md` y ese caso del spec se reescribe, no se debilita |
| 2 | El spec de caracterización **ya existe**, con 12 casos | `concept-file-import.service.spec.ts` | H2.S1.M2 se cumple corriéndolo y ampliándolo; no se crea de cero |
| 3 | El logger hace `...respuesta`, que arrastra `errorSamples` | `:177-180` | **Trampa para REQ-B-9**: al sumar `preview`, ese spread mandaría filas enteras al log. El log pasa a campos explícitos |
| 4 | Un mensaje de error **incrusta el `code`** de la fila | `:323` | Mismo riesgo. Se conserva en la respuesta (quien carga necesita saber cuál se repite) pero **nunca** en el log |
| 5 | Archivo de 0 bytes → **422 con código `PRECONDITION_FAILED`**. La `PreconditionFailedException` de este repo responde 422, no 412 (`domain.exception.ts:118`) | `:123-127` | El estado ya es el que pide el contrato; lo que cambia es el **código**, que pasa a `IMPORT_EMPTY_FILE`. Corregido: mi lectura anterior decía 412 y era falsa |
| 5-bis | **El contrato compartido se equivoca con los 412**: declara 412 para «falta el archivo» y «versión no está en borrador», y este repo responde **422** en los dos casos, porque su excepción de precondición es 422 | `domain.exception.ts:106-124` | Hay que avisarlo a quien construye la pantalla: si ramifica por 412, no va a entrar nunca. No se toca el comportamiento: el que manda es el repo |
| 6 | `skipped` = códigos que ya existían en la versión, omitidos | `:362-372` | Coincide con el contrato (Q-7). Sin cambio |
| 7 | La omisión ya consulta **por tanda**, no por fila | `findExistingCodes(tx, versionId, tanda.map(...))` en `:362` | H3.S2.M5 ya está resuelto por el código existente: se conserva |
| 8 | El NUL se rechaza por fila, con su motivo | `:305-319` | Se conserva al mover el NDJSON detrás del contrato |
| 9 | `CONCEPTOS_POR_TANDA = 500`, `MUESTRA_DE_ERRORES = 20`, `MAX_CODE = MAX_DISPLAY = 255` | `:30-37` | Los reusa el perfil `conceptos`; no se duplican |
| 10 | El repo **sí** usa `@Res({ passthrough: true })` | `audio-assets.controller.ts:46`, `data-catalog.controller.ts:254`, `iam-auth.controller.ts:279` | **Q-I1 resuelta: 200 en dry-run, 201 en real.** No hay desviación que avisar |
| 11 | Jest es `^30.0.0`: el flag es `--testPathPatterns` (plural) | `package.json` | Los DoD del encargo dicen el singular; se corre con el plural |

### Desvíos del encargo que ya se pueden declarar

- **Un cambio de comportamiento** (hecho 1): hoy se insertan las filas buenas de un archivo con errores y el
  contrato pide todo o nada. Se implementa el contrato y se declara el cambio.
- **Un cambio de código de error** (hecho 5): el archivo vacío ya responde 422; pasa a llevar `IMPORT_EMPTY_FILE`
  en vez del código genérico de precondición.
- **Un error del propio contrato compartido** (hecho 5-bis): declara 412 donde este repo responde 422. Se avisa.
- **H1.S2.M7 pierde su razón de ser** como descubrimiento (el hecho 1 ya lo responde), pero se ejecuta igual
  contra la API viva como evidencia del «antes».

## Fase 2 — Plan por hitos

Orden: **H1 → H2.S1 → H2.S2 (publicar) → H2.S3 → H2.S4 → H2.S5 → H3 → H4.S1 → H4.S2 → H5 → H6 → H7.**

### H1 — Corte, baseline, API viva y el import actual ejercitado

**CA:** Dado el endpoint de hoy, cuando alguien pregunta qué devolvía antes del cambio, entonces hay respuestas
JSON reales guardadas para archivo bueno ×2, archivo con errores y un CSV.
**DoD:** `evidencia/antes/` con baseline, `compose.txt`, readiness 200 y cuatro respuestas con su HTTP.
**Estado:** EN CURSO

#### H1.S1 — Corte y baseline

**CA:** Dado un rojo posterior, cuando se pregunta si lo causó este carril, entonces la respuesta sale de un archivo.
**DoD:** salidas con exit code; rojos previos clasificados.
**Estado:** HECHO — lint, tipos y compilación en 0; 16 suites y 176 pruebas del módulo. Ningún rojo previo.

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Checkout limpio del corte, con la rama del trabajo | SHA en el plan | `git rev-parse HEAD` → `343795cc` | HECHO |
| H1.S1.M2 | Instalar dependencias | exit 0 | `evidencia/antes/install.txt` | HECHO |
| H1.S1.M3 | Baseline `lint`, `typecheck`, `build` | Tres exit codes | `evidencia/antes/baseline.txt` → 0, 0, 0 | HECHO |
| H1.S1.M4 | Baseline de los tests del módulo terminology | Conteo | `evidencia/antes/test-terminology.txt` → 16 suites, 176 pruebas | HECHO |
| H1.S1.M5 | Clasificar cada rojo previo | Tabla o «ninguno» | **ninguno**: las cuatro etapas del baseline salieron en 0 | HECHO |

#### H1.S2 — Base, API, token y el endpoint de hoy

**CA:** Dado el endpoint, cuando se lo llama hoy con NDJSON bueno ×2, NDJSON con 2 líneas rotas y un CSV,
entonces hay cuatro respuestas guardadas con su HTTP.
**DoD:** `evidencia/antes/import-*.json`.
**Estado:** TODO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S2.M1 | Configuración del checkout, sin secretos reales | La API valida su configuración al arrancar | revisión de las obligatorias | TODO |
| H1.S2.M2 | Base viva | Postgres respondiendo | comprobación de la base → `evidencia/antes/base.txt` | TODO |
| H1.S2.M3 | Arrancar la API y esperar por condición | Readiness 200 | `curl` del readiness | TODO |
| H1.S2.M4 | Token `SECURITY_ADMIN` en variable de shell | no vacío | login | TODO |
| H1.S2.M5 | Sistema y versión en borrador de prueba `ZZ-PRUEBA-…` | `versionId` | `evidencia/antes/sistema-prueba.json` | TODO |
| H1.S2.M6 | `cinco.ndjson` sintético importado dos veces | Dos JSON | `import-ndjson-1.json`, `-2.json` | TODO |
| H1.S2.M7 | NDJSON con 2 líneas rotas | JSON + conteo | `import-ndjson-malo.json` | TODO |
| H1.S2.M8 | `ok-50.csv` importado hoy, antes de tocar nada | JSON | `import-csv-antes.json` | TODO |
| H1.S2.M9 | Sin token y con rol insuficiente contra el endpoint, hoy | Dos HTTP | `evidencia/antes/authz-*.txt` | TODO |

### H2 — Contrato de fila, detector, parseador CSV y perfiles

**CA:** Dado `src/modules/terminology/import/`, cuando otro carril hace `fetch` una hora después del arranque,
entonces encuentra `row-contract.ts` con los tipos literales del contrato §1; y al cerrar el hito existen
`detectarFormato`, `CsvParser`, `PERFILES_DE_IMPORTACION.conceptos`, `NdjsonParser` y el barrel, con specs en
verde y la caracterización del servicio intacta.
**DoD:** push de `row-contract.ts` dentro de la primera hora; tests de `import/` en verde.
**Estado:** HECHO — `e57c0126` a las 03:45; 6 suites y 59 pruebas en verde.

#### H2.S1 — Caracterizar antes de mover

**CA:** Dado el servicio de hoy, cuando se corre su spec, entonces cubre NDJSON bueno, línea rota, largo 256 y
versión publicada; y ese spec no cambia al terminar H3 salvo en los dos puntos de contrato declarados.
**DoD:** spec en verde, commiteado antes de tocar el servicio.
**Estado:** HECHO — el spec ya existía completo; no hizo falta ampliarlo.

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H2.S1.M1 | Leer 2 specs vecinos para copiar cómo doblan el contexto de persistencia y el logger | Rutas en el plan | `concept-file-import.service.spec.ts` (12 casos, doble de contexto y de logger) | HECHO |
| H2.S1.M2 | Correr el spec existente y fijar su salida como caracterización | 12 PASS | incluido en `evidencia/antes/test-terminology.txt` | HECHO |
| H2.S1.M3 | Commit de la caracterización, si hizo falta ampliarla | Commit sólo con el spec | **DESCARTADO**: el spec ya existía completo y pasa sin cambios | DESCARTADO |

#### H2.S2 — `row-contract.ts` publicado en la primera hora

**CA:** Dado §1 del contrato, cuando se lee `row-contract.ts`, entonces tiene esos tipos con esos nombres,
`FormatoNoAdmitidoError` y la firma de `detectarFormato`. Publicado, no se renombra nada.
**DoD:** typecheck exit 0; push; spec mínimo en verde; hora anotada en el daily.
**Estado:** HECHO — publicado dentro de la hora 1 y anunciado con SHA y hora.

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H2.S2.M1 | Anotar 3 rasgos de forma del servicio para copiarlos | 3 rasgos en el plan | ver «Rasgos de forma», abajo | HECHO |
| H2.S2.M2 | `import/row-contract.ts` con los tipos de §1 literales y documentación por tipo | Compila | typecheck exit 0 | HECHO |
| H2.S2.M3 | `row-contract.spec.ts`: el error conserva su motivo y es un `Error` | 2 PASS | 6 PASS dentro de las 176 | HECHO |
| H2.S2.M4 | `import/index.ts` exportando los tipos | Compila | typecheck exit 0 | HECHO |
| H2.S2.M5 | Commit y **push** de la rama | Visible en el remoto dentro de la hora 1 | `e57c0126`, 03:45 — dentro de la hora 1 | HECHO |
| H2.S2.M6 | Línea en el daily con la hora y el SHA | Escrita | el daily | HECHO |

#### H2.S3 — Detector de formato por contenido

**CA:** Dado un buffer, cuando se llama `detectarFormato`, entonces devuelve `xlsx` (firma ZIP más la cadena
`xl/workbook.xml`), `ndjson` (primera línea no vacía parsea como objeto) o `csv` (texto UTF-8, BOM tolerado, con
`,` o `;` en la primera línea); y lanza `FormatoNoAdmitidoError` con motivo legible para todo lo demás.
**DoD:** `format-detector.spec.ts` en verde con 8 casos.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H2.S3.M1 | `format-detector.ts` sin dependencia nueva | Compila | typecheck | HECHO |
| H2.S3.M2 | Spec: xlsx, ndjson, csv y csv con BOM | 4 PASS | tests de `format-detector` | HECHO |
| H2.S3.M3 | Spec: PDF, buffer vacío, ZIP sin la cadena del libro, texto sin separador; cada motivo distinto | 4 PASS | idem | HECHO |
| H2.S3.M4 | Spec: contenido JSON por línea con nombre `.csv` → `ndjson` | 1 PASS | idem | HECHO |
| H2.S3.M5 | Exportar desde `index.ts` | Compila | typecheck | HECHO |

#### H2.S4 — Parseador CSV

**CA:** Dado un CSV con encabezado, cuando se parsea, entonces las columnas se resuelven por nombre y alias del
perfil, el separador se detecta entre `,` y `;`, las comillas con `""` y los saltos dentro de comillas se
respetan, el BOM se tolera, y cada problema apunta a la fila lógica del archivo.
**DoD:** `csv-parser.spec.ts` en verde sobre los casos de §4 del contrato.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H2.S4.M1 | `csv-parser.ts` propio, con `numero` 1-based contando el encabezado | Compila | typecheck | HECHO |
| H2.S4.M2 | Decidir fixtures: propios en el spec hasta que el otro carril publique los suyos | Decisión en el plan | `git ls-tree -r origin/dev -- test/fixtures/terminology-import` vacío al cerrar H2 → fixtures propios, armados dentro de cada spec | HECHO |
| H2.S4.M3 | Spec: `ok-50` → 50 filas, 0 problemas, primera fila con `numero` 2 | PASS | tests de `csv-parser` | HECHO |
| H2.S4.M4 | Spec: `bom`, `separador-punto-y-coma`, `unicode` | 3 PASS | idem | HECHO |
| H2.S4.M5 | Spec: `comillas-y-saltos` con la definición intacta | PASS | idem | HECHO |
| H2.S4.M6 | Spec: `columnas-desordenadas` y `columna-desconocida` | 2 PASS | idem | HECHO |
| H2.S4.M7 | Spec: `sin-encabezado`, `vacio-solo-encabezado`, `fila-vacia-al-final` | 3 PASS | idem | HECHO |
| H2.S4.M8 | Spec: alias con tildes en el encabezado | PASS | idem | HECHO |
| H2.S4.M9 | Spec: `con-errores` → 50 filas y 0 problemas **de lectura** | PASS | idem | HECHO |

#### H2.S5 — Perfiles, NDJSON detrás del contrato, provider y barrel

**CA:** El parseador CSV resuelve columnas desde `PERFILES_DE_IMPORTACION`; `NdjsonParser` produce `FilaLeida`
con el código que ya existía en el servicio; el provider inyecta los dos parseadores más el detector y los perfiles.
**DoD:** `import-profiles.spec.ts` en verde; specs de H2.S4 siguen verdes; la aplicación arranca.
**Estado:** HECHO salvo el arranque contra la aplicación viva, que se comprueba en H3.S3. El perfil `designaciones` queda DESCARTADO en este carril (ver «Q-9»).

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H2.S5.M1 | `import-profiles.ts` con `conceptos` y su ejemplo sintético | Compila | typecheck | HECHO |
| H2.S5.M2 | El parseador CSV resuelve columnas desde el perfil | Specs de H2.S4 verdes | tests de `import/` | HECHO |
| H2.S5.M3 | Spec: alias insensibles a mayúsculas, tildes conservadas, espacios recortados | 3 PASS | tests de `import-profiles` | HECHO |
| H2.S5.M4 | Perfil `designaciones` sólo si el otro carril confirma Q-9; si no, `DESCARTADO` con la referencia | Perfil o `DESCARTADO` | ver «Q-9» abajo: las tres piezas existen, pero la forma no es la del contrato y el alta es otro camino de escritura | DESCARTADO |
| H2.S5.M5 | `NdjsonParser` con el código del servicio, movido tal cual | Caracterización verde | tests de `concept-file-import` | HECHO |
| H2.S5.M6 | `index.ts` con la lista de parseadores y el comentario de XLSX pendiente | Compila | typecheck | HECHO |
| H2.S5.M7 | `import-parsers.provider.ts` registrado en el módulo | La aplicación arranca | build exit 0; la comprobación contra la aplicación viva queda para H3.S3 | A MEDIAS |
| H2.S5.M8 | `import/README.md` con la tabla índice, como las carpetas vecinas | Existe | listado | HECHO |
| H2.S5.M9 | Sin contenido de filas en los logs de la carpeta | Búsqueda vacía | búsqueda de `logger.` y `console.` | HECHO |
| H2.S5.M10 | Commit y push | Visible | `bb1f6ce3`, 10:02 | HECHO |

##### Q-9 — el perfil `designaciones` queda fuera de este carril

La decisión no llegó antes de la hora 1, así que se resolvió por lectura, como
prevé la microtarea. **Las tres piezas que el contrato exige existen:**

| Pieza | Dónde | Qué declara |
|---|---|---|
| Entidad | `entities/concept_designations.entity.ts:18-47` | `conceptId`, `languageConceptId`, `designationTypeConceptId`, `value`, `preferred` |
| DTO | `dto/create-designation.dto.ts:49-79` | `value` obligatorio; `language` entre `ES` y `EN`; `designationType` entre `PREFERRED` y `SYNONYM` |
| Repositorio | `services/concepts.service.ts:120-196` | `addDesignation`, con `createDesignation`, `findByLanguageForUpdate` y `createProperty` |

Aun así el perfil **no entra en este carril**, y no por esfuerzo sino por forma:

1. **Las columnas no son las cuatro que supone el contrato.** Tres de ellas son
   referencias a conceptos, no texto: la designación cuelga de un concepto por su
   identificador, y el idioma y el tipo son ellos mismos conceptos del catálogo.
   Un archivo que traiga códigos exige un paso de resolución que hoy no existe en
   ningún punto del importador.
2. **El alta es otro camino de escritura.** La designación preferida es única por
   idioma y se resuelve tomando un bloqueo sobre las hermanas del mismo idioma
   (`concepts.service.ts:149`). Lo que este carril escribe son conceptos, con su
   omisión por código ya existente. Sumar designaciones no es un perfil más: es
   una segunda transacción con su propia regla de unicidad.

Publicar el perfil sin ese camino sería peor que no tenerlo: el archivo se
aceptaría, se leería entero y recién al escribir se descubriría que no hay dónde
guardarlo.

**Lo que sí queda listo:** sumar un perfil es agregar una entrada a
`PERFILES_DE_IMPORTACION`, sin tocar el detector, los parseadores ni el
validador. El día que ese camino de escritura exista, el perfil es una tabla.

**Para quien integre:** si la pantalla necesita el selector con dos opciones, hoy
la segunda no tiene destino.

### H3 — El servicio ensanchado

**CA:** Dado `importFromFile(versionId, buffer, actor, { dryRun, profile })`: detecta el formato, parsea con el
provider, valida cada fila; con al menos un problema → `aborted: true`, `inserted: 0`, sin lote; con `dryRun` →
el mismo informe más `preview`, sin escribir ni registrar; si no → escribe por tandas omitiendo existentes y
registra el lote con su huella. Ningún camino devuelve 500 ni loguea contenido.
**DoD:** spec unitario con doble de repositorio; llamada real de cada camino más el conteo de filas.
**Estado:** A MEDIAS — todo el comportamiento está escrito y medido contra dobles; falta ejercitarlo contra la aplicación viva.

#### H3.S1 — Validación por fila

**CA:** Cada problema tiene fila, columna y motivo en castellano accionable.
**DoD:** `row-validator.spec.ts` en verde.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H3.S1.M1 | `services/row-validator.ts` con `validarFilas(filas, perfil)` | Compila | typecheck | HECHO |
| H3.S1.M2 | Spec: `con-errores` → 5 problemas en las filas 5, 9, 14, 20 y 33, con sus columnas | PASS | tests de `row-validator` | HECHO |
| H3.S1.M3 | Spec: `duplicado-en-archivo` → 1 problema en la segunda aparición | PASS | idem | HECHO |
| H3.S1.M4 | Spec: motivos legibles, sin jerga | 3 PASS | idem | HECHO |
| H3.S1.M5 | Spec: la definición ausente no es problema; espacios recortados antes de validar | 2 PASS | idem | HECHO |
| H3.S1.M6 | El NUL sigue siendo problema de fila (comportamiento heredado, hecho 8) | PASS | idem | HECHO |

#### H3.S2 — DTO y servicio

**CA:** Todo campo previo del DTO conserva nombre y tipo; los nuevos son los de §2; el servicio se comporta como
dice el CA del hito.
**DoD:** spec del servicio (caracterización más los casos nuevos) en verde.
**Estado:** HECHO — 24 casos en verde, de 12 que había.

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H3.S2.M1 | DTO: `format`, `profile`, `dryRun`, `aborted`, `preview[]`, columna opcional en las muestras; el identificador de lote pasa a admitir nulo | Compila | typecheck | HECHO |
| H3.S2.M2 | Servicio: detectar → elegir parseador → parsear → validar | Caracterización verde | tests de `concept-file-import` | HECHO |
| H3.S2.M3 | Todo o nada (**cambio de contrato declarado**, hecho 1) | Spec + `decision-todo-o-nada.md` | idem | HECHO |
| H3.S2.M4 | Dry-run: vista previa de 20 filas válidas, sin escribir ni registrar lote | Spec con doble que falla si se lo llama | idem | HECHO |
| H3.S2.M5 | Conservar la omisión por tanda que ya existe (hecho 7) | Spec que cuenta consultas | idem | HECHO |
| H3.S2.M6 | Lote con leídas, insertadas, errores, huella y marcas de tiempo | Spec | idem | HECHO |
| H3.S2.M7 | Los tres códigos `IMPORT_*`; el archivo vacío pasa a llevar su código propio dentro del mismo 422 (hecho 5) | Spec ×3 | idem | HECHO |
| H3.S2.M8 | Nunca 500: buffer basura y fallo dentro del parseador salen como 422 | 2 PASS | idem | HECHO |
| H3.S2.M9 | **Log por campos explícitos** (hechos 3 y 4): nunca la vista previa, las muestras ni los valores | Búsqueda pegada + spec con logger doble | búsqueda de `logger.` | HECHO |

#### H3.S3 — Controlador y llamadas reales

**CA:** El endpoint recibe `dryRun` y `profile` como campos del formulario, los valida y los pasa al servicio;
cada camino se observa contra la API real.
**DoD:** `evidencia/h3/*.json` más el conteo de filas antes y después por camino.
**Estado:** A MEDIAS — el endpoint recibe los dos campos y decide su estado, con 4 casos en el spec del controlador. Las llamadas reales están BLOQUEADAS: piden la aplicación arriba.

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H3.S3.M1 | Leer cómo reciben campos junto al archivo los otros imports del repo | Rutas en el plan | — | HECHO |
| H3.S3.M2 | DTO del cuerpo con validación y documentación ensanchada | build | typecheck y build exit 0; **desvío:** el perfil **no** lleva lista cerrada, a propósito (ver abajo) | HECHO |
| H3.S3.M3 | 200 al validar y 201 al escribir (**Q-I1 resuelta**) | Decisión anotada | este plan; 4 casos en el spec del controlador | HECHO |
| H3.S3.M4 | Dry-run de `ok-50.csv` → 50 leídas, 0 errores, sin lote; conteo igual | 3 salidas | `evidencia/h3/` | BLOQUEADO — necesita la aplicación arriba contra una base viva, que no levanta esta sesión |
| H3.S3.M5 | Importación real → 50 insertadas; conteo +50 | 2 salidas | idem | BLOQUEADO — necesita la aplicación arriba contra una base viva, que no levanta esta sesión |
| H3.S3.M6 | `con-errores.csv` → abortado, 5 errores, 0 insertadas, con columna | 2 salidas | idem | BLOQUEADO — necesita la aplicación arriba contra una base viva, que no levanta esta sesión |
| H3.S3.M7 | `no-es-nada.pdf` → 422 por formato, sin rastro de pila | Salida | idem | BLOQUEADO — necesita la aplicación arriba contra una base viva, que no levanta esta sesión |
| H3.S3.M8 | Archivo vacío → 422; perfil desconocido → 422 | 2 salidas | idem | BLOQUEADO — necesita la aplicación arriba contra una base viva, que no levanta esta sesión |
| H3.S3.M9 | `cinco.ndjson` → igual que en H1.S2.M6 salvo los campos nuevos | Diff acotado | `evidencia/h3/ndjson-compat.diff` | BLOQUEADO — necesita la aplicación arriba contra una base viva, que no levanta esta sesión |

##### Por qué el perfil no lleva lista cerrada en el DTO (desvío de H3.S3.M2)

El contrato pide que un perfil fuera de la lista responda con su propio código.
Si la lista se cierra en el DTO, quien pida un perfil inexistente recibe el error de validación
genérico del formulario, y la pantalla no puede distinguirlo de un campo mal escrito. Cerrándola en
el importador —que es quien sabe qué perfiles existen— el rechazo llega con el código que la
pantalla necesita. El campo sigue validado: tiene que ser texto y tiene tope de largo.

##### Q-I6 (nueva) — qué estado HTTP devuelve un archivo rechazado por errores

El contrato fija **201** para la importación que escribe y **200** para la validación sin escribir,
pero no dice nada del archivo que se rechaza entero por traer errores. Ese caso no es un error de la
petición: es su respuesta, el informe de qué corregir.

**Decisión de este carril: 200.** Un 201 afirmaría que se creó algo, y con `aborted: true` no se
creó nada. Queda anotada para confirmar con quien construye la pantalla y con quien integra.

##### Lo que quedó BLOQUEADO, y contra qué se cerró mientras tanto (regla 65)

Las llamadas reales de H3.S3 necesitan la aplicación atendiendo peticiones contra una base viva, y
eso no lo decide esta sesión. El contrato que falta —el endpoint— sí se puede nombrar, así que se
cerró contra un doble de la respuesta HTTP, en los tres niveles:

| Nivel | Qué se ejercitó | Dónde |
|---|---|---|
| Correcto | Una importación que escribió conserva su 201 | spec del controlador |
| Límite | Validar sin escribir baja a 200, y un archivo rechazado por errores también | idem |
| Inválido | Sin archivo no se llama al importador y la petición se rechaza | idem |

El doble **no reemplaza** la llamada real. Lo que sólo se puede observar con la aplicación arriba:
el estado que termina escribiendo el marco, la conversión del campo de formulario a booleano, el
tope de tamaño de la subida y el rechazo por rol. Queda declarado en «No cubierto» del reporte.

### H4 — Idempotencia contra Postgres y matriz de autorización

**CA:** El mismo archivo importado dos veces contra Postgres real no inserta nada la segunda, cuenta 50 omitidas
y deja dos lotes con la misma huella; ningún rol distinto de `SECURITY_ADMIN` pasa.
**DoD:** el spec de integración del import en verde; matriz negativa en verde; llamada real ×2.
**Estado:** TODO

#### H4.S1 — Integración

**CA:** Dado el spec de integración, cuando corre contra la base del stack, entonces pasa.
**DoD:** salida pegada.
**Estado:** TODO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H4.S1.M1 | ¿Hay índice único por versión y código? | Hallazgo con ruta | búsqueda en los índices del catálogo | TODO |
| H4.S1.M2 | Leer 2 specs de integración vecinos | Rutas en el plan | — | TODO |
| H4.S1.M3 | Spec: `ok-50.csv` ×2 → 50/0 y luego 0/50; 50 filas; 2 lotes con la misma huella | PASS | `evidencia/h4/integration.txt` | TODO |
| H4.S1.M4 | Spec: `con-errores.csv` → abortado, 0 filas, 0 lotes | PASS | idem | TODO |
| H4.S1.M5 | Spec: dry-run → 0 filas, 0 lotes | PASS | idem | TODO |
| H4.S1.M6 | Spec de carrera: dos importaciones concurrentes → 50 filas al final (Q-I2) | PASS o riesgo documentado | idem | TODO |
| H4.S1.M7 | Importación real ×2 sobre una versión nueva | 2 salidas | `evidencia/h4/idem-*.json` | TODO |
| H4.S1.M8 | Consultas de verificación: conteo, duplicados en cero, rótulos nulos en cero | 3 salidas | `evidencia/h4/consultas.txt` | TODO |

#### H4.S2 — Autorización

**CA:** Sin token, con rol de profesional, con rol de paciente y con `SECURITY_ADMIN` → 401, 403, 403 y 2xx; y
los negativos no escriben.
**DoD:** spec con los cuatro casos más dos llamadas reales.
**Estado:** TODO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H4.S2.M1 | Cómo se prueban roles en el repo | Ruta del patrón | este plan | TODO |
| H4.S2.M2 | Spec: sin token → 401 | PASS | según el patrón | TODO |
| H4.S2.M3 | Spec: profesional → 403; paciente → 403; conteo sin cambio | 2 PASS | idem | TODO |
| H4.S2.M4 | Spec: `SECURITY_ADMIN` → 2xx | PASS | idem | TODO |
| H4.S2.M5 | Organización ajena, si terminología lo es; si es global, `DESCARTADO` con evidencia | Spec o `DESCARTADO` | idem | TODO |
| H4.S2.M6 | Llamadas reales sin token y con rol insuficiente | 2 HTTP | `evidencia/h4/authz-*.txt` | TODO |
| H4.S2.M7 | Límite de peticiones heredado del global: anotar, no agregar uno nuevo | Hallazgo | este plan | TODO |

### H5 — Plantilla por perfil

**CA:** El endpoint de plantilla con `SECURITY_ADMIN` descarga `plantilla-conceptos.<ext>` con las columnas
canónicas y la fila de ejemplo; formato o perfil desconocidos → 422; y re-importarla en dry-run da 1 fila y 0 errores.
**DoD:** dos descargas con su tipo y la re-importación pegadas; spec de autorización.
**Estado:** A MEDIAS — la plantilla se genera, se descarga con su tipo y su nombre, y el importador la vuelve a leer sin un problema. Falta la descarga por HTTP y la re-importación real.

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H5.S1.M1 | Cómo devuelve archivos el repo | Patrón en el plan | archivo como flujo con el tipo y el nombre puestos en la respuesta, como en la entrega de audio | HECHO |
| H5.S1.M2 | `import-template.service.ts` que genera desde los perfiles | Compila | typecheck exit 0 | HECHO |
| H5.S1.M3 | Spec: CSV de 2 líneas, encabezado canónico, ejemplo sintético | PASS | 8 casos de `import-template` | HECHO |
| H5.S1.M4 | Spec: formato desconocido y perfil desconocido → 422 | 2 PASS | idem, con los códigos propios | HECHO |
| H5.S1.M5 | El endpoint con su rol, su tipo de salida y su cabecera de descarga | build | build exit 0; 3 casos del controlador | HECHO |
| H5.S1.M6 | Descarga real y comprobación de su tipo | Archivo + tipo | lo que genera está en `evidencia/h5/plantilla.txt`; la descarga por HTTP falta | BLOQUEADO — necesita la aplicación arriba contra una base viva |
| H5.S1.M7 | Re-importar la plantilla en dry-run → 1 leída, 0 errores | Salida | cerrado contra el parseador y el validador reales: 1 fila, 0 problemas de lectura y 0 de validación. Falta la llamada HTTP | A MEDIAS |
| H5.S1.M8 | Spec de autorización del endpoint | 2 PASS | el rol declarado se comprueba en los dos endpoints; la matriz negativa completa es H4.S2 | A MEDIAS |

### H6 — Contrato publicado y códigos de error

**CA:** El contrato publicado muestra `dryRun`, `profile`, la respuesta ensanchada, los tres 422 y la plantilla,
sin diferencias pendientes de commitear.
**DoD:** el comando del repo con exit 0; su validación sin errores nuevos.
**Estado:** A MEDIAS — los decoradores del contrato están escritos y los tres códigos declarados; regenerar el artefacto está BLOQUEADO.

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H6.S1.M1 | Cómo se genera y valida el contrato en el repo | Comando en el plan | `docs:openapi:generate` (compila y levanta la aplicación) y `docs:validate` | HECHO |
| H6.S1.M2 | Regenerar o editar siguiendo al vecino | exit 0 | el generador **levanta la aplicación entera** para leer los decoradores: sale en 1 sin configuración de base. Salida en `evidencia/h6/openapi.txt` | BLOQUEADO — necesita la aplicación arriba contra una base viva |
| H6.S1.M3 | Validación sin errores nuevos respecto del baseline | Salida | depende de M2 | BLOQUEADO — necesita la aplicación arriba contra una base viva |
| H6.S1.M4 | Los tres códigos en el catálogo de errores, con la forma de los vecinos | Diff mínimo | `git diff origin/dev -- error-codes.ts`: 19 líneas, sólo altas, cada una con su porqué | HECHO |

### H7 — Regresión, PR mergeable y cierre honesto

**CA:** Repetido el baseline, ningún rojo es nuevo; el PR queda `MERGEABLE`; el reporte abre con el avance y
declara qué se cerró contra el doble.
**DoD:** diffs, salidas de `gh` pegadas, primeras líneas del reporte.
**Estado:** TODO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H7.S1.M1 | Repetir lint, typecheck y build | Sin rojos nuevos | diff contra el baseline | TODO |
| H7.S1.M2 | Suite unitaria completa, una vez | Sin rojos nuevos | `evidencia/h7/test.txt` | TODO |
| H7.S1.M3 | Suite de integración completa | Sin rojos nuevos | `evidencia/h7/integration.txt` | TODO |
| H7.S1.M4 | El diff no toca archivos de otros ni el esquema | Búsqueda vacía | `git diff origin/dev --stat` filtrado | TODO |
| H7.S2.M1 | Rebase sobre `origin/dev` | Limpio | `git status` | TODO |
| H7.S2.M2 | PR con la plantilla del repo, base `dev` | URL | `gh pr create --base dev` | TODO |
| H7.S2.M3 | Estado del PR consultado con `gh` | `MERGEABLE` | `evidencia/pr/view.json` | TODO |
| H7.S2.M4 | Checks del PR | Ninguno en fallo | `evidencia/pr/checks.txt` | TODO |
| H7.S2.M5 | Sección «Pendiente de integrar»: XLSX y qué se verificó sólo con NDJSON y CSV | Lista | `REPORTE.md` | TODO |
| H7.S2.M6 | Procesos corriendo cerrados o declarados | Lista o «ninguno» | revisión al cerrar | TODO |
| H7.S2.M7 | Reporte con el avance en la primera línea, las tres secciones, el peldaño por área y la sección de seguridad | Primeras líneas | el reporte | TODO |
| H7.S2.M8 | Daily con la instalación del estándar, el avance y los dos cambios de contrato | Existe | listado | TODO |

## Riesgos y bloqueos previstos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| El cambio a todo o nada rompe a un consumidor del comportamiento viejo | Alto | Se declara en el reporte y en el daily; los campos previos no cambian de nombre ni de tipo |
| La pantalla ramifica por 412 siguiendo el contrato, y la API responde 422 | Alto | Avisado en el daily apenas se detectó |
| La vista previa o las muestras se filtran al log por el spread actual de la respuesta | Alto | H3.S2.M9: log por campos explícitos, con spec de logger doble |
| Sin índice único por versión y código, dos subidas simultáneas duplican | Medio | H4.S1.M6 lo prueba; si duplica, riesgo residual y deuda del modelo, sin tocar el esquema |

| Las 109 microtareas no entran en una noche | Alto | Orden por prioridad; lo que no cierre queda `A MEDIAS` con las cuatro respuestas |

## Rasgos de forma del código vecino (H2.S2.M1)

Los tres que se copian, tomados de `concept-file-import.service.ts`:

1. **La documentación explica el porqué, no el qué**, en castellano y con secciones `## Por qué …` dentro del
   propio bloque (`:46-88`). Cuando una decisión se tomó descartando otra, se cuenta la descartada y el motivo.
2. **Constantes nombradas arriba del archivo**, cada una con su propia documentación justificando el valor,
   nunca un número suelto en medio del código (`:23-37`).
3. **Comentarios en línea que registran el caso real** que motivó una guarda, con la consecuencia concreta que
   evitan (`:132-136`, `:305-309`). Las excepciones siempre llevan contexto como segundo argumento.
