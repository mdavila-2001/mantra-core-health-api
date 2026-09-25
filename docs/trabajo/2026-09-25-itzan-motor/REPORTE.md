# Reporte — Motor de la carga masiva de terminología

> **AVANCE: 41 / 110 — 37,3 %.**

- Fecha: 2026-09-25 · Plan: [PLAN.md](./PLAN.md) · Rama: `itzan/carga-masiva-motor-2026-09-25` · Base: `dev`
- Corte: `origin/dev` @ `343795cc2d08745692f491c50e81427215043315`
- Peldaño de evidencia alcanzado (regla 30): **`WRITTEN`** para el trabajo en conjunto, que es el más bajo de
  sus áreas. Por área: **`TESTED`** en el contrato de fila, el detector de formato, los perfiles, los dos
  parseadores, el registro de lectura y el validador de filas — 21 suites y 224 pruebas en verde, con lint y
  comprobación de tipos en 0. **`WRITTEN`** en los tres códigos de error, que todavía no los usa nadie: los
  consume el servicio en H3.

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
| Cierre de H2 | Las cuatro etapas sobre todo lo escrito | lint de lo tocado, tipos del proyecto, pruebas del módulo | PASS · 0 · 0 · 21 suites, 224 pruebas · `evidencia/h2/parseo.txt` |

## A medias

### H2.S5.M7 — el registro de lectura dentro del módulo

- **Qué anda:** el registro existe y está probado por sí mismo: devuelve el parseador de cada formato
  registrado, no devuelve nada para el formato de planilla —que el detector reconoce pero todavía no tiene
  quien lo lea— y no confunde una propiedad heredada del prototipo con un perfil.
- **Qué no anda:** nada observado.
- **Qué falta exactamente:** verlo resuelto por la aplicación al arrancar. El DoD de esa microtarea pide
  compilación **y** arranque; la compilación sale en 0, el arranque se observa en H3.S3, cuando el endpoint se
  ejercita de verdad.
- **Dónde quedó:** `terminology.module.ts` y `services/import-parsers.provider.ts`, commiteados.

## Pendiente

| ID | Estado | Qué lo destraba |
|---|---|---|
| H1.S2 completo | TODO | Una base viva y la aplicación arrancada, para guardar las cuatro respuestas de hoy antes de cambiar el comportamiento |
| H3.S2, H3.S3 | TODO | Orden del plan |
| H4, H5, H6, H7 | TODO | Orden del plan |

## Evidencia

```text
$ lint de lo tocado
exit=0

$ comprobación de tipos del proyecto entero
exit=0

$ pruebas del módulo de terminología
Test Suites: 21 passed, 21 total
Tests:       224 passed, 224 total
exit=0
```

Índice de `evidencia/`:

| Archivo | Qué guarda |
|---|---|
| `antes/install.txt` | Instalación de dependencias sobre el corte, con su código de salida |
| `antes/baseline.txt` | Lint, comprobación de tipos y compilación del corte, antes de tocar nada |
| `antes/test-terminology.txt` | Línea base de las pruebas del módulo: 16 suites, 176 pruebas |
| `h2/parseo.txt` | Las cuatro etapas sobre la lectura por formato y la validación, cada una con su código de salida |

## No cubierto

- **El endpoint no se ejercitó contra la aplicación viva.** Ninguna afirmación sobre su comportamiento sale
  todavía de una observación: lo que hay medido son las piezas, no el camino completo.
- **El servicio de importación sigue intacto.** Ninguno de los dos cambios de comportamiento declarados está
  aplicado, y los tres códigos de error están declarados sin que nadie los use: los consume H3.
- **El formato de planilla se reconoce pero no se lee.** El detector lo distingue; el parseador llega por otro
  carril y se suma a la lista sin tocar nada de lo entregado.
- **El perfil `designaciones` queda fuera de este carril** (Q-9, resuelta en el plan con su evidencia).
- **La carrera entre dos subidas simultáneas no se midió.** Se prueba en H4.S1.M6.

## Desvíos del plan

| Qué se desvió | Por qué |
|---|---|
| H2.S5.M4 — el perfil `designaciones` queda **DESCARTADO** en este carril | La decisión no llegó antes de la hora 1, así que se resolvió por lectura, como prevé la propia microtarea. Las tres piezas que el contrato exige existen, pero las columnas no son las cuatro que supone y el alta es un camino de escritura distinto, con su propia regla de unicidad. Detalle y evidencia en el plan, bajo «Q-9» |
| H2.S5.M7 queda **A MEDIAS** y no HECHO | Su DoD pide compilación y arranque. Sólo la compilación está observada; el arranque se mide en H3.S3 y no se da por bueno antes |

## Riesgos residuales

| Riesgo | Impacto |
|---|---|
| El log del servicio esparce hoy la respuesta entera; al sumarle la vista previa, filas completas llegarían al registro | Alto: contenido de datos en los logs. Mitigado en H3.S2.M9 |
| Sin índice único por versión y código, dos subidas simultáneas del mismo archivo podrían duplicar | Medio: se prueba en H4.S1.M6; el esquema no se toca |
| El formato de planilla queda reconocido pero sin lector hasta que se integre el otro carril | Bajo: hoy responde como formato no admitido, con motivo legible; no rompe ningún camino |

## Decisiones y ambigüedades

| ID | Qué se decidió | Sobre qué evidencia | A quién confirmar |
|---|---|---|---|
| Q-2 | **Todo o nada**, cambiando el comportamiento actual, que sí inserta las filas buenas de un archivo con errores. Registrado en [decision-todo-o-nada.md](./decision-todo-o-nada.md) | `concept-file-import.service.ts:130-160` y su propio spec | Quien integra los carriles |
| Q-5 (nueva) | El archivo vacío conserva su 422 y pasa a llevar el código `IMPORT_EMPTY_FILE` en vez del genérico de precondición | `concept-file-import.service.ts:123-127` y `domain.exception.ts:118` | Quien integra los carriles |
| Q-9 | El perfil `designaciones` **no entra en este carril**. Entidad, DTO y repositorio existen los tres, pero tres de las cuatro columnas del contrato son referencias a conceptos y el alta toma un bloqueo por idioma: es otra transacción, no un perfil más | `concept_designations.entity.ts:18-47`, `create-designation.dto.ts:49-79`, `concepts.service.ts:120-196` | Quien integra los carriles y quien construye la pantalla |
| Q-I5 (nueva) | **El contrato compartido declara 412 donde este repo responde 422** (archivo ausente, versión no borrador). Manda el repo; se avisa para que la pantalla no ramifique por un estado que nunca va a llegar | `domain.exception.ts:106-124` | Quien construye la pantalla |
| Q-I1 | El dry-run responde 200 y la importación real 201 | El repo ya usa respuesta con control explícito del estado en tres controladores | Resuelta, sin desviación |
| Q-I4 (nueva) | La detección de formato se implementa en su propio archivo y se publica desde el barrel; el contrato de fila expone el **tipo** de esa firma, no una función sin implementación | El contrato compartido declara la función sin cuerpo, lo que en ejecución no serviría a quien la importe | Quien integra los carriles |
| Q-7 | Un código que ya existe en la versión se omite, nunca se actualiza | Es lo que el servicio ya hace | Confirmada contra el código |
| Q-I2 | Sin índice único, la carrera entre dos subidas se mide antes de afirmar nada | Pendiente de H4.S1.M6 | Quien lleva el modelo |
