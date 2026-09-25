# Reporte — Motor de la carga masiva de terminología

> **AVANCE: 53 / 110 — 48,2 %.**

- Fecha: 2026-09-25 · Plan: [PLAN.md](./PLAN.md) · Rama: `itzan/carga-masiva-motor-2026-09-25` · Base: `dev`
- Corte: `origin/dev` @ `343795cc2d08745692f491c50e81427215043315`
- Peldaño de evidencia alcanzado (regla 30): **`TESTED`** para el trabajo en conjunto, que es el más bajo de
  sus áreas. Todo lo escrito tiene pruebas dirigidas en verde —21 suites y 240 pruebas del módulo, con lint y
  comprobación de tipos en 0—, y **ninguna área llegó a `VERIFIED`**: nada se ejercitó todavía contra la
  aplicación atendiendo peticiones, que es lo único que prueba el camino completo.

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
| Cierre | Las tres etapas sobre todo lo escrito | lint de lo tocado, tipos del proyecto, pruebas del módulo | PASS · 0 · 0 · **21 suites, 240 pruebas** · `evidencia/h3/servicio.txt` |

## A medias

### H2.S5.M7 — el registro de lectura dentro del módulo

- **Qué anda:** el registro existe, está inyectado en el servicio y probado por sí mismo: devuelve el
  parseador de cada formato registrado, no devuelve nada para el formato de planilla —que el detector
  reconoce pero todavía no tiene quien lo lea— y no confunde una propiedad heredada del prototipo con un
  perfil.
- **Qué no anda:** nada observado.
- **Qué falta exactamente:** verlo resuelto por la aplicación al arrancar. La compilación sale en 0; el
  arranque se observa en H3.S3.
- **Dónde quedó:** `terminology.module.ts` y `services/import-parsers.provider.ts`, commiteados.

### H3.S3 — el endpoint contra la aplicación viva

- **Qué anda:** el controlador recibe los dos campos del formulario, los pasa al importador y fija el estado
  de la respuesta. Los cuatro casos del spec cubren los tres niveles del contrato: escribió (201), validó
  (200), rechazó (200) y sin archivo (rechazo sin llamar al importador).
- **Qué no anda:** nada observado.
- **Qué falta exactamente:** las seis llamadas reales —validación, importación, archivo con errores, formato
  no admitido, archivo vacío y perfil inexistente— con el conteo de filas antes y después de cada una. Y con
  ellas, tres cosas que un doble no puede mostrar: el estado que termina escribiendo el marco, la conversión
  del campo de formulario a booleano, y el tope de tamaño de la subida.
- **Dónde quedó:** `controllers/terminology-versions.controller.ts` y su spec, commiteados. Compila y las
  pruebas del módulo pasan enteras.

## Pendiente

| ID | Estado | Qué lo destraba |
|---|---|---|
| H1.S2 completo | BLOQUEADO | La aplicación arriba contra una base viva, para guardar cómo responde el endpoint **antes** del cambio. El corte es inmutable, así que esa captura no se pierde: se toma desde `343795cc` cuando se pueda |
| H3.S3.M4–M9 | BLOQUEADO | Lo mismo. Cerrado contra un doble en los tres niveles mientras tanto (ver el plan, «Lo que quedó BLOQUEADO») |
| H4, H5, H6, H7 | TODO | Orden del plan. H4 necesita además Postgres para la idempotencia |

## Evidencia

```text
$ lint de lo tocado
exit=0

$ comprobación de tipos del proyecto entero
exit=0

$ pruebas del módulo de terminología
Test Suites: 21 passed, 21 total
Tests:       240 passed, 240 total
exit=0
```

Índice de `evidencia/`:

| Archivo | Qué guarda |
|---|---|
| `antes/install.txt` | Instalación de dependencias sobre el corte, con su código de salida |
| `antes/baseline.txt` | Lint, comprobación de tipos y compilación del corte, antes de tocar nada |
| `antes/test-terminology.txt` | Línea base de las pruebas del módulo: 16 suites, 176 pruebas |
| `h2/parseo.txt` | Las cuatro etapas sobre la lectura por formato y la validación |
| `h3/servicio.txt` | Las tres etapas sobre el servicio ensanchado y el endpoint |

## No cubierto

- **Nada se ejercitó contra la aplicación atendiendo peticiones.** Todo lo medido son pruebas dirigidas con
  el contexto de persistencia doblado: prueban el comportamiento del servicio, no que el camino HTTP
  completo funcione.
- **El estado HTTP no está observado.** El spec comprueba que el controlador lo pide; que el marco lo
  escriba en la respuesta es otra cosa.
- **La conversión del campo de formulario no está observada.** En `multipart/form-data` todo campo viaja
  como texto y hay una transformación que lo lee como booleano; sólo una petición real la ejercita.
- **La idempotencia contra Postgres no se midió.** El mismo archivo dos veces se prueba en H4.
- **El rechazo por rol no se midió.** La matriz negativa de autorización es H4.S2.
- **El formato de planilla se reconoce pero no se lee.** El parseador llega por otro carril y se suma a la
  lista sin tocar nada de lo entregado.
- **El perfil `designaciones` queda fuera de este carril** (Q-9, resuelta en el plan con su evidencia).

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
