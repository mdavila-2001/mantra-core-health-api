# Reporte — Motor de la carga masiva de terminología

> **AVANCE: 85 / 110 — 77,3 %.**

- Fecha: 2026-09-25 · Plan: [PLAN.md](./PLAN.md) · Rama: `itzan/carga-masiva-motor-2026-09-25` · Base: `dev`
- Corte: `origin/dev` @ `343795cc2d08745692f491c50e81427215043315`
- Peldaño de evidencia alcanzado (regla 30): **`VERIFIED`** para el motor y la plantilla. El endpoint se
  ejercitó contra la aplicación atendiendo peticiones, con la base respondiendo: **18 comprobaciones, todas
  en verde**, incluidas la no duplicación contada en base y la matriz de autorización. Debajo: lint 0, tipos
  0, compilación 0, **23 suites y 252 pruebas** del módulo, y la suite completa del repositorio en **714
  suites · 8 657 pruebas · 0 fallos**.
- **No llega a `REGRESSION_VERIFIED`**, y por dos motivos distintos: no se escribieron las pruebas de
  integración que harían que una regresión futura se note sola, y **el contrato publicado no viaja en la
  entrega** (abajo, «Lo que el arranque destapó»).

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
| H6.S1.M2–M3 | El contrato se regenera desde el código y valida | generador del repositorio y Redocly | PASS · 1 254 rutas · **0 errores** de Redocly · los dos códigos de éxito del endpoint declarados |
| H7.S1 | Regresión completa del repositorio | suite unitaria entera | PASS · **714 suites · 8 657 pruebas · 0 fallos** · `evidencia/h7/regresion.txt` |
| Cierre | Las cuatro etapas sobre todo lo escrito | lint del módulo, tipos del proyecto, compilación, pruebas del módulo | PASS · 0 · 0 · 0 · **23 suites, 252 pruebas** · `evidencia/h3/cierre-verificacion.txt` |

## A medias

### H2.S5.M7 — el registro de lectura dentro del módulo

- **Qué anda:** el registro existe, está inyectado en el servicio y probado por sí mismo: devuelve el
  parseador de cada formato registrado, no devuelve nada para el formato de planilla —que el detector
  reconoce pero todavía no tiene quien lo lea— y no confunde una propiedad heredada del prototipo con un
  perfil.
- **Qué no anda:** nada observado.
- **Qué falta exactamente:** nada. La aplicación arrancó y resolvió el módulo entero, y el endpoint
  respondió usando ese registro: quedó observado.
- **Dónde quedó:** `terminology.module.ts` y `services/import-parsers.provider.ts`, commiteados.

### H4 — la protección contra la regresión

- **Qué anda:** la idempotencia y la matriz de autorización están **comprobadas contra la aplicación viva**,
  y el conteo en base lo confirma.
- **Qué no anda:** nada observado.
- **Qué falta exactamente:** escribir esas mismas comprobaciones como pruebas de integración del
  repositorio. Sin ellas, lo verificado hoy no queda protegido: una regresión futura no se nota sola.
- **Dónde quedó:** la evidencia de las llamadas, en `evidencia/h3/llamadas-reales.txt`.

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
| H4.S1.M2–M6 | TODO | Escribir las pruebas de integración del importador. El comportamiento ya está comprobado a mano; falta dejarlo protegido |
| H4.S2.M5 | TODO | Si la terminología es global o tiene dueño organizacional; la respuesta decide si el caso existe |
| H7.S1.M3 | TODO | Correr la suite de integración completa |
| H7.S2 | TODO | El PR se puede abrir; **en verde no puede quedar**, y por una causa que no es de acá: el gate del repositorio no llega a compilar (abajo, punto 3). Además, el contrato publicado espera a que se corrija el arranque y se regenere en la rama de integración |

## Evidencia

```text
$ lint de lo tocado
exit=0

$ comprobación de tipos del proyecto entero
exit=0

$ pruebas del módulo de terminología
Test Suites: 23 passed, 23 total
Tests:       252 passed, 252 total
exit=0

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

## No cubierto

- **Lo verificado no quedó protegido.** Las 18 comprobaciones se hicieron contra la aplicación viva, a mano.
  No están escritas como pruebas de integración del repositorio, así que una regresión futura no se nota
  sola. Es lo que falta para `REGRESSION_VERIFIED`.
- **La suite de integración completa no se corrió.**
- **La matriz negativa no se probó rol por rol.** Se probó que una sesión sin el rol recibe 403; con un
  profesional y con un paciente concretos, no.
- **Dos importaciones a la vez no se probaron.** La no duplicación está garantizada por el índice único de
  la base, no por una carrera observada.
- **El tope de tamaño de la subida no se ejercitó.** Está declarado y es el mismo que el resto del
  repositorio; no se mandó un archivo que lo supere.
- **El formato de planilla se reconoce pero no se lee.** El parseador llega por otro carril y se suma a la
  lista sin tocar nada de lo entregado.
- **El perfil `designaciones` queda fuera de este carril** (Q-9, resuelta en el plan con su evidencia).
- **El contrato publicado no viaja en la entrega**, por lo que se explica abajo.
- **La plantilla en formato de planilla no se genera.** Necesita la misma dependencia que el parseador, que
  llega por otro carril; pedirla hoy se rechaza con su código, igual que importar una.

## Lo que el arranque destapó — tres cosas que frenan a todo el repositorio, ninguna de este carril

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

### 2. Los artefactos generados están atrasados en `dev`

Con la aplicación arriba, regenerar el contrato produce mucho más que este carril: aparecen **dos rutas** de
otra línea de trabajo y una docena de esquemas suyos, más cambios en la documentación generada de seis
módulos. Es consecuencia de lo anterior: sin poder arrancar la aplicación, nadie pudo regenerarlos.

El detector de cambios incompatibles lo confirma, con la misma base y el mismo archivo de excepciones que
usa el gate: **4 rupturas, ninguna de este carril** — dos campos que se volvieron obligatorios en el alta de
profesional y en su alta asistida.

**Qué se hizo con eso:** el contrato de este carril se regeneró, se validó (Redocly, 0 errores) y su
resultado está guardado en `evidencia/h6/`, pero **no viaja en la entrega**: commitearlo metería en este PR
el contrato de otros cinco carriles y cuatro rupturas ajenas que además lo dejarían en rojo. El orden
correcto es al revés: corregir el defecto de arriba en la rama de integración, regenerar ahí, y entonces
este PR trae sólo lo suyo.

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

## Desvíos del plan

| Qué se desvió | Por qué |
|---|---|
| H2.S5.M4 — el perfil `designaciones` queda **DESCARTADO** en este carril | La decisión no llegó antes de la hora 1, así que se resolvió por lectura, como prevé la propia microtarea. Las tres piezas que el contrato exige existen, pero las columnas no son las cuatro que supone y el alta es un camino de escritura distinto, con su propia regla de unicidad. Detalle y evidencia en el plan, bajo «Q-9» |
| H2.S5.M7 queda **A MEDIAS** y no HECHO | Su DoD pide compilación y arranque. Sólo la compilación está observada |
| H3.S3.M2 — el perfil **no** lleva lista cerrada en el DTO | Cerrarla ahí haría que un perfil inexistente saliera con el error de validación genérico del formulario, y el contrato pide que salga con su propio código. La lista la cierra el importador, que es quien sabe qué perfiles existen |
| El archivo en blanco se comprueba **antes** de reconocer el formato | Lo destapó una prueba: un archivo de puros saltos de línea salía como «formato no admitido», que manda a quien lo subió a buscar el problema donde no está. Ahora sale como archivo vacío, que es lo que es |

## Riesgos residuales

| Riesgo | Impacto |
|---|---|
| Sin índice único por versión y código, dos subidas simultáneas del mismo archivo podrían duplicar | Medio: se prueba en H4.S1.M6; el esquema no se toca |
| El estado HTTP de un archivo rechazado por errores no está en el contrato compartido | Medio: si la pantalla espera 201 y llega 200, ramifica mal. Decidido acá como 200 y avisado (Q-I6) |
| El formato de planilla queda reconocido pero sin lector hasta que se integre el otro carril | Bajo: hoy responde como formato no admitido, con motivo legible; no rompe ningún camino |

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
| Q-I2 | Sin índice único, la carrera entre dos subidas se mide antes de afirmar nada | Pendiente de H4.S1.M6 | Quien lleva el modelo |
