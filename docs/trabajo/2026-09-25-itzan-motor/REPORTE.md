# Reporte — Motor de la carga masiva de terminología

> **AVANCE: 94 / 110 — 85,5 %.**

- Fecha: 2026-09-25 · Plan: [PLAN.md](./PLAN.md) · Rama: `itzan/carga-masiva-motor-2026-09-25` · Base: `dev`
- Corte inicial: `origin/dev` @ `343795cc2d08745692f491c50e81427215043315`
- Reintegrada sobre `origin/dev` @ `4dcaa27961588444bcfdeb4cbe8a3aa2d1b71650` (2026-09-25, tarde), sin conflictos
- Peldaño de evidencia alcanzado (regla 30): **`VERIFIED`** para el motor y la plantilla. El endpoint se
  ejercitó contra la aplicación atendiendo peticiones, con la base respondiendo: **18 comprobaciones, todas
  en verde**, incluidas la no duplicación contada en base y la matriz de autorización. Debajo: lint 0, tipos
  0, compilación 0, **23 suites y 252 pruebas** del módulo, y la suite completa del repositorio en **714
  suites · 8 657 pruebas · 0 fallos**.
- **`REGRESSION_VERIFIED` para el motor**: las pruebas de integración ya existen y corren contra Postgres
  real, así que lo verificado a mano quedó protegido — una regresión futura se nota sola. **4 de 4** →
  `evidencia/h4/integration.txt`.
- **El contrato publicado viaja en la entrega.** Dejó de arrastrar trabajo ajeno en cuanto se corrigió el
  arranque y alguien regeneró el artefacto en la rama de integración: el diff de acá es **una ruta nueva y
  el resumen del importador**, nada más (abajo, «Lo que el arranque destapó», punto 2).

> Reporte en curso: el trabajo sigue abierto y este archivo se actualiza al cerrar cada microtarea.

## Completado

| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1 | Corte limpio, dependencias y línea base antes de tocar nada | lint, tipos y compilación | PASS · 0, 0, 0 · `evidencia/antes/baseline.txt` |
| H1.S1.M4 | Línea base de las pruebas del módulo | pruebas de `terminology` | PASS · 16 suites, 176 pruebas · `evidencia/antes/test-terminology.txt` |
| H2.S1 | La caracterización del servicio de hoy quedó fijada antes de mover nada | pruebas de `concept-file-import` | PASS · 12 casos, sin cambios en el spec |
| H2.S2 | Contrato de fila publicado para los demás carriles **dentro de la hora 1** | `git log origin/<rama>` | PASS · `e57c0126` a las 03:45 |
| H2.S3 | El formato se decide por contenido: firma del archivo y primera línea, nunca la extensión | pruebas de `format-detector` | PASS · 11 casos, un motivo distinto por cada rechazo |
| H2.S4 | Parseador CSV propio, sin dependencia nueva: separador, comillas, saltos dentro de celda y marca de orden de bytes | pruebas de `csv-parser` | PASS · las filas se numeran como las ve quien abre el archivo |
| H2.S5 | Perfiles con alias en castellano, la lectura de objetos por línea detrás del mismo contrato, y el registro de lectura inyectado | pruebas de `import-profiles` y del registro | PASS · 6 pruebas del registro, incluida la de un identificador heredado del prototipo |
| H3.S1 | Las reglas del catálogo viven en un solo lugar, así que los tres formatos dan los mismos errores | pruebas de `row-validator` | PASS · fila, columna y motivo legible en cada problema |
| H3.S2 | **Todo o nada**, validación sin escribir con vista previa, formato reconocido por contenido, tres códigos de error propios y registro sin contenido del archivo | pruebas de `concept-file-import` | PASS · **24 casos**, de 12 que había |
| H3.S3.M1–M3 | El endpoint recibe `dryRun` y `profile` del formulario y decide su estado: 201 si escribió, 200 si validó o si rechazó | pruebas del controlador | PASS · 4 casos de estado y delegación |
| H5 | Plantilla descargable por perfil, generada desde el mismo perfil que después lee el importador | pruebas de `import-template` y del controlador | PASS · 11 casos, incluida la que vuelve a leer la plantilla con el parseador real y exige cero problemas |
| H6.S1.M4 | Los tres códigos de error en el catálogo, con la forma de los vecinos | `git diff origin/dev -- error-codes.ts` | PASS · 19 líneas, sólo altas, cada una con su porqué |
| H3.S3 · H4 · H5 | El endpoint ejercitado de verdad: importa, valida sin escribir, aborta entero, rechaza lo que no puede leer, no duplica, y sólo lo atiende quien tiene el rol | llamadas reales contra la aplicación | PASS · **18 comprobaciones en verde** · `evidencia/h3/llamadas-reales.txt` |
| H4.S1 | La no duplicación no depende del servicio: la base tiene `uq_catalog_concepts_version_code` sobre (versión, código) | consulta de índices | PASS · importar dos veces el mismo archivo de 2 filas deja **2** conceptos |
| H4.S1.M2–M6 | Lo comprobado a mano quedó **protegido**: idempotencia, archivo rechazado entero, validación sin escribir y dos subidas simultáneas, contra Postgres real y con las fixtures versionadas del repositorio | pruebas de integración del importador | PASS · **4 de 4** · `evidencia/h4/integration.txt` |
| H4.S2.M5 · M7 | El catálogo **no tiene dueño organizacional**, así que el caso de la organización ajena no existe; y el límite de peticiones es el global del repositorio, sin agregar uno propio | lectura de entidades y del módulo raíz | PASS · uno DESCARTADO con evidencia, el otro anotado |
| H6.S1.M2–M3 | El contrato publicado **viaja en la entrega**: se regeneró desde el código y el diff es sólo de este carril | generador del repositorio y Redocly | PASS · 1 255 rutas · 1 366 operaciones · una ruta nueva y el resumen del importador, nada ajeno |
| H7.S1 | Regresión completa del repositorio | suite unitaria entera | PASS · **714 suites · 8 657 pruebas · 0 fallos** · `evidencia/h7/regresion.txt` |
| Cierre | Las cuatro etapas sobre todo lo escrito | lint del módulo, tipos del proyecto, compilación, pruebas del módulo | PASS · 0 · 0 · 0 · **23 suites, 252 pruebas** · `evidencia/h3/cierre-verificacion.txt` |

## Al reintegrarse con `dev` (2026-09-25, tarde)

La rama se llevó al `dev` del día. Tres cosas que conviene dejar dichas:

**El contrato que este carril publicó en la primera hora ya viajó.** El PR #462 lo llevó por cherry-pick
—`row-contract.ts`, `csv-parser.ts`, `format-detector.ts` e `import-profiles.ts`—, y comparados uno a uno
contra esta rama los cuatro son **idénticos**: nadie tuvo que retocarlos para construir encima. El rebase
sobre `dev` no dio **un solo conflicto**.

**La planilla se enchufó donde estaba previsto.** El parseador de XLSX se registró en la lista de
`PARSEADORES_DE_IMPORTACION` y con eso el formato quedó cubierto **sin tocar el servicio ni el detector**:
el detector ya reconocía la firma del contenedor y el contrato ya declaraba el formato. Es la razón por la
que esa lista existía, y funcionó como se esperaba.

**Integrarlo destapó un agujero de este carril, y se corrigió.** El servicio llamaba al parseador sin red.
Reconocer un archivo por sus primeros bytes no garantiza poder abrirlo: con una planilla cifrada, truncada
o corrupta, el error de la biblioteca (`Unsupported ZIP encryption`) **se escapaba como fallo interno** en
vez de salir como rechazo con motivo. Ahora se convierte en el mismo rechazo que un formato no admitido
—ver **Q-I7** en el plan, donde queda registrado por qué se reusa ese código en vez de inventar uno
nuevo—, y el motivo de la biblioteca queda en el registro, nunca en la respuesta.

Comprobado: **24 suites · 272 pruebas · 0 fallos** en el módulo (eran 23 · 252), `typecheck` en **0**, y
**0 hallazgos de linter en los archivos de este carril**.

## Lo que la prueba contra la base real dejó a la vista

Las cuatro comprobaciones de integración pasaron, pero una de ellas contestó algo que ningún doble podía
contestar. Va aparte porque es lo más útil que produjo este hito.

**Dos subidas simultáneas del mismo archivo no duplican — y la garantía no la da el importador.** El
servicio consulta qué códigos ya existen y después escribe, y entre esas dos cosas hay una ventana; si dos
subidas la atraviesan a la vez, las dos creen estar insertando conceptos nuevos. Lo que impide el duplicado
es el índice único de la base. En la prueba, una de las dos peticiones escribió las 50 filas y la otra fue
rechazada por la restricción; la versión terminó con **50 conceptos y 50 códigos distintos**, y ninguna de
las dos respondió con un fallo del servidor.

**De ahí sale un estado que el contrato no declara.** La petición que pierde la carrera recibe **409**, y
el contrato publica 200, 201 y 422. No se le inventó un manejo propio: es un conflicto real y ese es su
estado. Queda anotado como **Q-I8** en el plan, porque decidir qué ve quien carga —reintentar en silencio,
avisar, o nada— es del lado de la pantalla, no de acá.

**Lo que sí hubo que verificar es que el conflicto no cuente de más.** El error del motor de base trae el
nombre de la restricción y el valor de la clave que la violó. Comprobado: **no llegan al cliente**. El
manejador global del repositorio los deja en el registro y responde con código, mensaje e identificador de
correlación, y explica el porqué en el mismo lugar (`src/common/filters/all-exceptions.filter.ts:201-208`).

**Las fixtures son las del repositorio, no copias.** Cuando este carril escribió sus parseadores, los
archivos de prueba todavía no existían y cada spec armaba los suyos. Ya están versionados, así que las
pruebas de integración leen `test/fixtures/terminology-import/` — las mismas que consume la pantalla. Una
divergencia entre lo que la API acepta y lo que el formulario manda ahora aparece como un rojo.

## A medias

### H2.S5.M7 — el registro de lectura dentro del módulo

- **Qué anda:** el registro existe, está inyectado en el servicio y probado por sí mismo: devuelve el
  parseador de **cada uno de los tres formatos del contrato** —incluida la planilla, desde que se integró
  el parseador que llegó por el otro carril— y no confunde una propiedad heredada del prototipo con un
  perfil. Además se sumó la prueba que se rompe sola si alguien agrega un formato al contrato sin
  registrar quién lo lee.
- **Qué no anda:** nada observado.
- **Qué falta exactamente:** nada. La aplicación arrancó y resolvió el módulo entero, y el endpoint
  respondió usando ese registro: quedó observado.
- **Dónde quedó:** `terminology.module.ts` y `services/import-parsers.provider.ts`, commiteados.

### H4.S2.M3 — la matriz negativa, rol por rol

- **Qué anda:** una sesión **sin** el rol recibe 403, tanto en la importación como en la descarga de la
  plantilla.
- **Qué no anda:** nada observado.
- **Qué falta exactamente:** probarlo con un rol concreto de cada clase —profesional y paciente—, no con una
  cuenta sin ningún rol.
- **Dónde quedó:** en la misma evidencia.

## Pendiente

| ID | Estado | Qué lo destraba |
|---|---|---|
| H4.S2.M3 | A MEDIAS | Una cuenta con rol de profesional y otra con rol de paciente. Hoy el 403 se comprobó con una cuenta sin ningún rol, que prueba la puerta pero no cada llave |
| H7.S2 | EN CURSO | El PR se abre con todo lo suyo, contrato publicado incluido. **En verde no puede quedar**, y por una causa que no es de acá: el trabajo del gate muere al levantar el almacenamiento de objetos, antes de compilar nada (abajo, punto 3). Un gate que no corrió no está en verde, está sin medir — por eso la verificación de esta entrega es toda local y con su salida guardada |

## Evidencia

```text
$ lint de lo tocado
exit=0

$ comprobación de tipos del proyecto entero
exit=0

$ pruebas del módulo de terminología
Test Suites: 24 passed, 24 total
Tests:       272 passed, 272 total
exit=0

$ pruebas de integración del importador, contra Postgres real
Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
exit=0

$ radio de integración del diff (importador + terminología + glosario)
Test Suites: 1 failed, 2 passed, 3 total
Tests:       1 failed, 24 passed, 25 total
el único rojo falla igual en dev sin tocar, con salida literal idéntica

$ suite completa del repositorio
Test Suites: 1 skipped, 714 passed, 714 of 715 total
Tests:       1 skipped, 8657 passed, 8658 total
exit=0

$ el endpoint contra la aplicación atendiendo peticiones
18 comprobaciones · 18 PASS · 0 FAIL
```

Índice de `evidencia/`:

| Archivo | Qué guarda |
|---|---|
| `antes/install.txt` | Instalación de dependencias sobre el corte, con su código de salida |
| `antes/baseline.txt` | Lint, comprobación de tipos y compilación del corte, antes de tocar nada |
| `antes/test-terminology.txt` | Línea base de las pruebas del módulo: 16 suites, 176 pruebas |
| `h2/parseo.txt` | Las cuatro etapas sobre la lectura por formato y la validación |
| `h3/servicio.txt` | Las tres etapas sobre el servicio ensanchado y el endpoint |
| `h5/plantilla.txt` | Las cuatro etapas de la plantilla, y el archivo exacto que genera |
| `h6/openapi.txt` | El primer intento de regenerar el contrato, y por qué falló |
| `h1/contrato-antes-despues.txt` | El contrato publicado del endpoint en el corte y ahora: qué códigos y qué campos gana |
| `h3/llamadas-reales.txt` | Las 18 comprobaciones contra la aplicación viva, con su código y su cuerpo |
| `h3/cierre-verificacion.txt` | Lint, tipos y pruebas del módulo al cerrar |
| `h6/openapi-generado.txt` | La regeneración del contrato: qué la impedía y su salida al lograrlo |
| `h6/validacion.txt` | Redocly y el detector de cambios incompatibles, con su salida literal |
| `h6/artefactos.txt` | El resto de los artefactos generados que el gate compara |
| `h7/regresion.txt` | La suite completa del repositorio |
| `h4/integration.txt` | Las pruebas de integración del importador contra Postgres real, y cómo se resolvió la carrera |
| `h7/integration.txt` | La regresión de integración: por qué el comando del README no termina, el radio del diff y el rojo heredado comprobado en las dos ramas |

## No cubierto

- **La matriz negativa no se probó rol por rol.** Se probó que una sesión sin el rol recibe 403; con un
  profesional y con un paciente concretos, no.
- **El tope de tamaño de la subida no se ejercitó.** Está declarado y es el mismo que el resto del
  repositorio; no se mandó un archivo que lo supere.
- **El perfil `designaciones` queda fuera de este carril** (Q-9, resuelta en el plan con su evidencia).
- **La plantilla en formato de planilla no se genera.** La dependencia ya está disponible desde que se
  integró el parseador, así que dejó de ser un impedimento y pasó a ser una decisión de alcance: pedirla
  hoy se rechaza con su código. Sumarla es una entrada más en la tabla de formatos de la plantilla.
- **El 409 de la carrera no se declara en el contrato publicado.** Se observó y se registró (Q-I8), pero
  documentarlo fija un comportamiento que todavía no se decidió del lado de la pantalla.
- **Las pruebas de integración corren contra una base ya poblada**, no contra una limpia. Crean su propio
  sistema de codificación con el prefijo reservado y no dependen de nada previo, pero no comprueban que el
  importador funcione sobre una base recién construida.

## Lo que el arranque destapó — cinco cosas que frenan a todo el repositorio, ninguna de este carril

Verificar exigía arrancar la aplicación. No arrancaba, y el motivo no era de acá.

### 1. La aplicación no arranca desde `dev`

`src/modules/insurance/services/practitioner-settlement-batches.service.ts:2` importa el
`EntityManager` **como tipo**:

```ts
import type { EntityManager } from '@mikro-orm/postgresql';
```

Un `import type` se borra al compilar, así que el primer parámetro del constructor queda anotado como
`Function` y el contenedor de dependencias no tiene qué inyectar. La aplicación muere al instanciar el
módulo, antes de atender nada:

```text
Nest can't resolve dependencies of the PractitionerSettlementBatchesService
(?, SettlementRepository, CatalogRepository, LinkedClaimAccessService, PracticeTenantLookupService).
Please make sure that the argument Function at index [0] is available in the InsuranceModule module.
```

Se ve en lo compilado, comparado con un vecino sano del mismo módulo:

```text
practitioner-settlement-batches.service.js:  design:paramtypes", [Function, repositories_1.SettlementRepository, …
insurance-catalog.service.js:                design:paramtypes", [postgresql_1.EntityManager]
```

**Alcance:** el archivo es **idéntico en `origin/dev`** (`git diff origin/dev` sobre él sale vacío), así que
el fallo es de la rama de integración, no de esta rama. Y el paso del gate que genera el contrato OpenAPI
arranca la aplicación exactamente igual: **ese paso está en rojo para todo PR** hasta que se corrija.
Se corrige quitando una palabra. **No se tocó**: es de otro carril, y además **ya hay un PR abierto con
exactamente esa corrección** (`#460`, de una línea). Para poder verificar, el defecto se neutralizó **en
local**, sin commitearlo: el árbol de esta rama no lo contiene (`git status` sobre ese módulo sale limpio).

Lo que ese PR **no** trae es la consecuencia de abajo: corregir el arranque sin regenerar los artefactos
mueve el rojo un paso más adelante, al que los compara.

> **CERRADO.** El PR #460 se fusionó el 2026-09-25 a las 16:25:57 UTC. La aplicación arranca desde la rama
> de integración, y este carril se reintegró sobre ese estado.

### 2. Los artefactos generados están atrasados en `dev`

Con la aplicación arriba, regenerar el contrato producía mucho más que este carril: aparecían **dos rutas**
de otra línea de trabajo y una docena de esquemas suyos, más cambios en la documentación generada de seis
módulos. Era consecuencia de lo anterior: sin poder arrancar la aplicación, nadie podía regenerarlos.

El detector de cambios incompatibles lo confirmaba, con la misma base y el mismo archivo de excepciones que
usa el gate: **4 rupturas, ninguna de este carril** — dos campos que se volvieron obligatorios en el alta de
profesional y en su alta asistida.

> **CERRADO también.** Corregido el arranque, alguien regeneró los artefactos en la rama de integración
> (`25b30c8a`). Comprobado que siguen al día: desde ese commit, **ningún controlador ni DTO cambió** en la
> rama de integración — el único archivo tocado bajo esas rutas es un `.spec.ts`
> (`git diff --name-only 25b30c8a origin/dev -- src/`). Así que regenerar acá ya produce **sólo** lo de
> este carril, y el contrato **sí viaja en la entrega**.

### 3. Antes que todo eso, el gate no llega a correr

El trabajo `docs` muere a los 90 segundos, en el paso que levanta el almacenamiento de objetos, mucho antes
de compilar nada:

```text
Unable to find image 'quay.io/minio/minio:RELEASE.2025-04-22T22-12-26Z' locally
docker: Error response from daemon: unauthorized: access to the requested resource is not authorized
##[error]Process completed with exit code 125.
```

Pasa en **las últimas corridas de cuatro personas distintas**, desde la madrugada: el registro de imágenes
dejó de servir esa etiqueta sin credenciales. No es de ningún carril, y mientras siga así **ningún PR de
este repositorio puede quedar en verde**, porque el primer paso en rojo corta los que siguen y todos los
gates quedan sin medir. Se clasifica `EXTERNAL`.

> **En curso, fuera de este carril.** La vía elegida es cargar credenciales del registro como secretos del
> repositorio, y la lleva quien administra el repositorio. Hasta que estén, este PR —como todos— entra con
> ese trabajo del gate en rojo. **Sin medir no es lo mismo que en verde**, y por eso la verificación de
> esta entrega se hizo entera de forma local, con su salida guardada.

### 4. El comando de integración que documenta el repositorio no es el que corre su CI

`test/integration/README.md` propone como comando base:

```bash
yarn test:integration --ci --runInBand
```

Con ese comando la suite **no termina**: muere con `FATAL ERROR: Ineffective mark-compacts near heap
limit — JavaScript heap out of memory` después de **6 de unas 90 suites**. Cada suite arranca la
aplicación entera, y `--runInBand` las corre a todas en el proceso principal.

La causa es que **`--runInBand` desactiva justamente la protección que la configuración ya declara**:
`test/jest-integration.json` fija `workerIdleMemoryLimit: "1GB"`, que hace que jest recicle el worker
cuando lo supera — y ese mecanismo sólo existe si hay worker. Con `--runInBand` no lo hay.

El workflow del repositorio lo corre **sin** ese flag (`.github/workflows/docs.yml:389`,
`yarn test:integration --ci`), que es por lo que allá no revienta. **La recomendación del README y el
comando del gate no coinciden**, y quien siga el README va a ver un fallo que no es del código.

Además, esa corrida local se hizo contra una base que lleva el día en uso, mientras el gate la corre
contra un stack recién provisionado: varias suites dependen del estado de los datos. Las dos cosas
juntas hacen que una corrida local completa no sea comparable con la del gate.

**Qué se hizo en su lugar:** el radio del diff, aislado. Este carril toca
`src/modules/terminology/**` y altas en `src/common/errors/error-codes.ts`, nada más.

| Spec | Resultado |
|---|---|
| `test/integration/terminology/concept-file-import.int-spec.ts` (nuevo) | **4 de 4** |
| `test/integration/terminology.int-spec.ts` | **20 de 20** |
| `test/integration/glossary.int-spec.ts` | **1 rojo, heredado** |

El rojo de `glossary` se comprobó **en la rama y en `dev` sin tocar**, con la salida literal de las dos
corridas: el mismo caso, el mismo mensaje.

```text
en la rama y en dev (4dcaa279), idéntico:
  ● Glosario médico › exclusión de borradores › un término en TERM_DRAFT no aparece …
    expected 404 "Not Found", got 200 "OK"
```

Por grafo de importaciones tampoco puede ser de acá: ese spec usa entidades y seeds del glosario, y
ninguno de los archivos que este carril modifica aparece entre sus dependencias.

### 5. El paso de linter está en rojo en `dev` — 20 hallazgos, ninguno de este carril

Al reintegrarse con `dev`, `yarn lint --max-warnings=0` —el mismo comando que corre el gate— devuelve
**20 hallazgos, los 20 en archivos de otro carril**, que este carril tiene prohibido tocar:

| Ruta | Línea | Regla |
|---|---|---|
| `src/modules/terminology/import/xlsx-parser.ts` | 71, 77, 108, 116, 122, 225, 249 | `prettier/prettier` |
| `src/modules/terminology/import/xlsx-parser.ts` | **254** | `@typescript-eslint/no-base-to-string` |
| `src/modules/terminology/import/xlsx-parser.spec.ts` | 44, 45, 46, 47, 48, 72, 73, 76, 101, 103, 105 | `prettier/prettier` |

Diecinueve son de formato y los arregla `yarn lint --fix` en una corrida. **El de la línea 254 no es de
formato**: `'valor' will use Object's default stringification format ('[object Object]')`. Si por ahí
puede pasar un objeto, una celda de la planilla terminaría importada como el texto `[object Object]` en
vez de su contenido — conviene que lo mire quien escribió el archivo.

Se verificó que **no los introdujo este carril**: `git diff origin/dev...HEAD` sobre esas dos rutas sale
**vacío**. Están en `dev` desde que entró el PR #462. No se tocan: se documentan. En los archivos de este
carril el linter da **0**.

## Seguridad

Qué toca este carril desde el punto de vista de seguridad, y qué se comprobó de cada cosa.

| Frente | Qué se hizo | Comprobado |
|---|---|---|
| **Quién entra** | Los dos endpoints exigen el rol de administración de seguridad | Sin sesión → 401. Con sesión sin el rol → 403, en el importador y en la plantilla. Rol por rol, **no** (queda declarado en «A medias») |
| **Qué se escribe** | Sólo conceptos de catálogo, en una versión en borrador y por el camino que ya existía | La versión publicada se rechaza; el conteo en base se verificó antes y después de cada camino |
| **Qué queda en el registro** | Contadores e identificadores, nunca `code`, `display` ni valores de filas | El servicio armaba su línea de log con un spread de la respuesta; al sumar la vista previa eso habría mandado filas enteras al registro. Pasó a campos explícitos, con un spec que usa un doble del registrador |
| **Qué devuelve un error** | Código, mensaje y correlación. Nunca rastro de pila, nombre de restricción ni valor de clave | El 422 de formato no admitido y el 409 de la carrera se leyeron enteros: ninguno los lleva |
| **Qué se guarda del archivo** | Nada. Se convierte en filas y se descarta; lo que identifica qué contenido entró es su huella | El lote registra huella, contadores y quién lo hizo, sin el archivo |
| **Con qué datos se probó** | Sólo sintéticos, con el prefijo reservado `ZZ-`, de las fixtures versionadas del repositorio | Ninguna prueba usa datos de personas |
| **Límites** | El de peticiones y el de tamaño de subida son los globales del repositorio; no se agregó ninguno propio | Un límite por endpoint escondería que el tope real es el de la aplicación. El de tamaño **no se ejercitó** (declarado en «No cubierto») |

**Un punto que no es de este carril pero conviene que se lea.** El manejador global de errores del
repositorio registra el detalle del motor de base, y ese detalle trae el valor de la clave que violó
la restricción — en este caso, un `code` de fila. No llega al cliente, y está decidido así a
propósito, con el porqué escrito al lado (`src/common/filters/all-exceptions.filter.ts:197-211`). Se
deja anotado porque este carril se propuso que el contenido de las filas no apareciera en los
registros, y ahí aparece por otra vía. No se tocó.

## Desvíos del plan

| Qué se desvió | Por qué |
|---|---|
| H2.S5.M4 — el perfil `designaciones` queda **DESCARTADO** en este carril | La decisión no llegó antes de la hora 1, así que se resolvió por lectura, como prevé la propia microtarea. Las tres piezas que el contrato exige existen, pero las columnas no son las cuatro que supone y el alta es un camino de escritura distinto, con su propia regla de unicidad. Detalle y evidencia en el plan, bajo «Q-9» |
| H2.S5.M7 estuvo **A MEDIAS** hasta poder arrancar la aplicación | Su DoD pide compilación y arranque. Cerrado: la aplicación arrancó, resolvió el módulo entero y el endpoint respondió usando ese registro, primero a mano y después en las pruebas de integración |
| H3.S3.M2 — el perfil **no** lleva lista cerrada en el DTO | Cerrarla ahí haría que un perfil inexistente saliera con el error de validación genérico del formulario, y el contrato pide que salga con su propio código. La lista la cierra el importador, que es quien sabe qué perfiles existen |
| El archivo en blanco se comprueba **antes** de reconocer el formato | Lo destapó una prueba: un archivo de puros saltos de línea salía como «formato no admitido», que manda a quien lo subió a buscar el problema donde no está. Ahora sale como archivo vacío, que es lo que es |

## Riesgos residuales

| Riesgo | Impacto |
|---|---|
| ~~Sin índice único por versión y código, dos subidas simultáneas del mismo archivo podrían duplicar~~ | **Descartado con evidencia:** el índice único existe y la carrera se probó contra Postgres real — 50 conceptos, 50 códigos distintos, ninguna respuesta 5xx |
| La petición que pierde una carrera recibe **409**, y el contrato publica 200, 201 y 422 | Medio: sólo se alcanza con dos subidas simultáneas de códigos que se pisan. Observado y registrado (Q-I8); qué ve quien carga se decide del lado de la pantalla |
| El estado HTTP de un archivo rechazado por errores no está en el contrato compartido | Medio: si la pantalla espera 201 y llega 200, ramifica mal. Decidido acá como 200 y avisado (Q-I6) |
| ~~El formato de planilla queda reconocido pero sin lector~~ | **Descartado:** el parseador se integró y quedó cableado; el formato se lee |

## Decisiones y ambigüedades

| ID | Qué se decidió | Sobre qué evidencia | A quién confirmar |
|---|---|---|---|
| Q-2 | **Todo o nada**, cambiando el comportamiento actual, que sí insertaba las filas buenas de un archivo con errores. Registrado en [decision-todo-o-nada.md](./decision-todo-o-nada.md) | `concept-file-import.service.ts:130-160` del corte, y su propio spec | Quien integra los carriles |
| Q-5 (nueva) | El archivo vacío conserva su 422 y pasa a llevar el código `IMPORT_EMPTY_FILE` en vez del genérico de precondición | `domain.exception.ts:118` | Quien integra los carriles |
| Q-9 | El perfil `designaciones` **no entra en este carril**. Entidad, DTO y repositorio existen los tres, pero tres de las cuatro columnas del contrato son referencias a conceptos y el alta toma un bloqueo por idioma: es otra transacción, no un perfil más | `concept_designations.entity.ts:18-47`, `create-designation.dto.ts:49-79`, `concepts.service.ts:120-196` | Quien integra los carriles y quien construye la pantalla |
| Q-I6 (nueva) | Un archivo rechazado entero por errores responde **200**, no 201: con `aborted: true` no se creó nada. El contrato no cubre este caso | El contrato sólo fija 201 real y 200 al validar | Quien construye la pantalla y quien integra |
| Q-I5 (nueva) | **El contrato compartido declara 412 donde este repo responde 422** (archivo ausente, versión no borrador). Manda el repo; se avisa para que la pantalla no ramifique por un estado que nunca va a llegar | `domain.exception.ts:106-124` | Quien construye la pantalla |
| Q-I1 | El dry-run responde 200 y la importación real 201 | El repo ya usa respuesta con control explícito del estado en tres controladores | Resuelta, sin desviación |
| Q-I4 (nueva) | La detección de formato se implementa en su propio archivo y se publica desde el barrel; el contrato de fila expone el **tipo** de esa firma, no una función sin implementación | El contrato compartido declara la función sin cuerpo, lo que en ejecución no serviría a quien la importe | Quien integra los carriles |
| Q-7 | Un código que ya existe en la versión se omite, nunca se actualiza | Es lo que el servicio ya hacía | Confirmada contra el código |
| Q-I2 | **Resuelta contra Postgres real:** dos subidas simultáneas no duplican. El índice único existe y es él quien lo impide — el importador consulta y después escribe, y entre esas dos cosas hay una ventana | `evidencia/h4/integration.txt`: 50 conceptos, 50 códigos distintos | Quien lleva el modelo |
| Q-I7 (nueva) | Una planilla reconocida pero ilegible —cifrada, truncada, corrupta— se rechaza reusando `IMPORT_FORMAT_UNSUPPORTED`, sin inventar un código nuevo: hay un cliente leyendo la respuesta y un valor nuevo sería contrato nuevo | Lo destapó integrar el parseador: el error de la biblioteca se escapaba como fallo interno | Quien construye la pantalla y quien integra |
| Q-I8 (nueva) | La petición que pierde una carrera recibe **409**, estado que el contrato no declara. Se deja tal como sale del manejador global, sin manejo propio: es un conflicto real. El detalle de la restricción no llega al cliente | `evidencia/h4/integration.txt`; `all-exceptions.filter.ts:201-208` | Quien construye la pantalla y quien integra |
