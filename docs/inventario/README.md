# Inventario del sistema

Inventario **generado desde el código y el modelo**, no escrito a mano. Alimenta el portal interno
(catálogo de operaciones, mapa de flujos y catálogo de datos). Cada dato conserva su fuente
(`archivo:línea`) y, cuando es una deducción, la confianza con que se obtuvo.

| Inventario | Qué contiene | Cómo regenerarlo | Documentación |
|---|---|---|---|
| Endpoints | 1 operación HTTP = 1 registro: tablas que afecta, DTO y restricciones, requerimientos, payload mínimo, explicación de negocio y de sistema, riesgo, pruebas | `yarn inventario:endpoints` | [endpoints/](endpoints/index.md) |
| Flujos | Procesos de negocio, máquinas de estado y el árbol de decisión de cada operación (qué comprueba, qué puede fallar con qué estado HTTP, qué escribe), con su mapa y hallazgos | `yarn inventario:flujos` | [flujos/](flujos/index.md) · [mapa](flujos/mapa.md) · [hallazgos](flujos/hallazgos.md) |
| Catálogo de datos | 1 tabla = 1 ficha: columnas con su rol estructural y su descripción (con fuente o «sin dato»), relaciones, índices con su «para qué», restricciones, operaciones que la tocan, gobierno y deriva contra el ORM y la base | `yarn inventario:catalogo` · `yarn inventario:deriva-bd` | [catalogo/](catalogo/index.md) · [deriva](catalogo/deriva.md) · [glosario](catalogo/glosario.md) |

`yarn inventario:verificar` falla si lo escrito en `inventario/` y `docs/inventario/` no coincide con el
código: es la señal de que alguien cambió una ruta, un DTO o una consulta y no regeneró.

Necesita el repositorio del modelo como hermano (`../mantra-core-health-model`) o la variable
`MODEL_ROOT`; sin él se detiene con un mensaje, no inventa el propósito ni el dominio de cada módulo.

## Origen de cada operación

| Origen | Significado |
|---|---|
| `CONTRATO` | Está publicada en `openapi/openapi.json`. |
| `CONTRATO_AUSENTE` | El handler existe en el código pero el contrato no la publica. Su cuerpo se lee de `@Body() dto: X` y su ruta de los decoradores. |

## Cómo se deduce qué tablas toca una operación

Análisis estático del código TypeScript (no se ejecuta nada): se sigue la llamada del handler al
servicio, de éste al repositorio y de ahí a la entidad. Cada tabla trae su **confianza**:

| Confianza | Se obtuvo así | Ejemplo |
|---|---|---|
| `DIRECTA` | La entidad es el primer argumento de una llamada al `EntityManager`. | `em.findOne(SlotHolds, …)` |
| `POR_TIPO` | Se dedujo del tipo de una variable. | `slot.remainingCapacity -= 1` actualiza `bookable_slots` aunque no haya un `UPDATE` explícito |
| `POR_REGISTRO` | La entidad la elige un literal o constante que se pasa a un repositorio genérico. | `historyRepo.append(tx, 'appointment_bookings', …)` escribe en `audit.appointment_bookings_history` |
| `POR_SQL` | Se leyó de un literal SQL (también con constantes) y existe como tabla. | `FROM scheduling.appointment_bookings` |

Se siguen puertos (interfaces) hasta sus implementaciones; si un puerto tiene varias, se unen los
efectos de todas. Lo que depende de un dato en tiempo de ejecución se lista como **no resuelto** y no
se inventa una tabla.

## Lo que el inventario NO afirma

- **Datos personales:** el modelo y el código no clasifican las columnas por sensibilidad
  (`system_ops.field_registry` existe pero está vacío). Por eso todos los registros llevan
  `datosPersonales: SIN_FUENTE`. No se infiere por el nombre de un campo.
- **Que una operación efectivamente escribe:** `POR_TIPO` supone que el cambio se persiste con un
  `flush` en la misma unidad de trabajo. En las 10 operaciones cotejadas a mano era así; no se verificó
  en todas.
- **Que las pruebas cubren la operación:** «pruebas que la mencionan» es una búsqueda textual de la
  ruta o del handler, no cobertura.
- **Que la explicación de negocio sea la definitiva:** se compone con el `summary` del contrato, la
  fila del caso de uso del README y la nota del modelo (que está en inglés). Queda `AUTO_DETECTADA`
  hasta que una persona la revise.

## Riesgo

| Nivel | Condición |
|---|---|
| `ALTO` | Ruta pública que escribe · borra filas · escribe estando autenticada y sin `@Roles` en el controlador |
| `MEDIO` | Escribe, con roles declarados |
| `BAJO` | Sólo lee, o no toca tablas relacionales |

No usa datos personales ni financieros (ver arriba). Es un indicador para ordenar la revisión, no una
evaluación de seguridad.

## Lo curado a mano

`tools/inventario/curado/sin-tablas.json` explica por qué 11 operaciones no tocan tablas, con la fuente
leída y la fecha de revisión. Una operación nueva sin tablas y sin motivo hace fallar
`yarn inventario:test`: hay que mirarla y agregarla ahí.

## Flujos: qué es cada cosa

- **Proceso de módulo:** uno por módulo. Cada etapa es un caso de uso (UC) de la tabla «UC → ruta» del
  README. Lo que el README no asigna a un UC se agrupa por controlador y se marca
  `AGRUPACION_POR_CONTROLADOR`: no se inventa un caso de uso.
- **Proceso crítico:** los dos de `docs/business/critical-workflows.md`, con sus pasos en el orden del
  documento. Las referencias relativas (`.../revoke`) se resuelven contra la última ruta completa.
- **Árbol de decisión:** se lee del código del handler y de los métodos que invoca (hasta 4 niveles).
  Una condición que no falla, no escribe y no llama a nada se poda. El estado de un error sale de la
  excepción: las del proyecto se leen de `src/common/errors` (la `PreconditionFailedException` del
  proyecto responde **422**, no 412); las de `@nestjs/common` de la tabla de Nest. Un `Error` común lo
  atiende el filtro global como `500 INTERNAL`.
- **Máquina de estados:** tabla `*_TRANSITIONS` del código con forma «estado → destinos». «Esta
  operación dispara este estado» es `POR_REFERENCIA`: el handler alcanza un método que valida contra la
  tabla y nombra ese estado. Los nombres son los identificadores del código, no se resuelven al
  catálogo de conceptos.
- **Mapa y hallazgos:** cruzan flujos, riesgo, pruebas y consumidores. «Quién la llama» sale del
  inventario de clientes del frontend (`docs/reports/generated/api-inventory.md`); necesita el repo del
  frontend como hermano (`../mantra-core-health`) o `FRONT_ROOT`. Sin él, la columna dice «sin dato» y
  los hallazgos que dependen de él no se calculan.

### Lo que los flujos NO afirman

- **Que el árbol sea exhaustivo:** sólo ve lo que el análisis estático alcanza. Un `throw` dentro de
  una llamada que depende de un dato en tiempo de ejecución no aparece (queda como «no resuelto» en la
  ficha de la operación).
- **Que una rama sea alcanzable:** el árbol muestra las ramas del código, no prueba que existan datos
  que las activen.
- **Que el orden de los efectos sea el de ejecución real** cuando hay iteraciones o callbacks: se
  muestran en el orden del texto.
- **Que un proceso de módulo sea un flujo de negocio validado:** es la agrupación que declara el
  README. Queda `AUTO_DETECTADA` hasta que alguien lo revise.

## Catálogo de datos: de dónde sale cada cosa

La **fuente de verdad es el DDL canónico del modelo** (`SQL/` del repo del modelo; los CSV de
`docs/data-catalog` son su lectura). El ORM y la base desplegada son vistas que se comparan con él, no
fuentes: una diferencia no dice quién tiene razón, dice que hay que mirarla.

| Dato | Fuente | Qué pasa si no hay |
|---|---|---|
| Tablas, columnas, tipos, nulabilidad, PK, FK, únicos | `docs/data-catalog/*.csv` del modelo | Falla con un mensaje |
| Índices | `indexes.csv` **más** las sentencias `CREATE INDEX … USING brin\|gin\|gist` de `SQL/*/04_indexes.sql`, que el generador del CSV no lista (431 hoy). Se marcan `SQL_NO_CATALOGADO_EN_CSV` | — |
| Propósito de la tabla | `business_rationale` del modelo, con su estado (hoy todas `DOMAIN_CURATED_DRAFT`) | «Sin propósito registrado» |
| Descripción de columna | 1.º comentario del `.puml` justo antes de la columna (`MODELO_PUML`); 2.º JSDoc de la entidad que no sea de plantilla (`JSDOC_ENTIDAD`); 3.º convención de columnas estándar (`JSDOC_ESTANDAR`) | «sin dato». No se infiere por el nombre |
| «Para qué» de un índice | Regla de `indexing-strategy.md` que el índice cumple de forma verificable (único, cubre una FK, GiST/BRIN/GIN); predicado parcial; consultas de repositorio que filtran por su primera columna (`POR_PREFIJO_DE_FILTRO`, candidatura estática) | «sin uso detectado estáticamente» |
| Append-only | Lo que el README del módulo declara con una de tres formas explícitas | «no declarado» (no es lo mismo que «no es append-only») |
| Datos personales, financiera, crítica para auditoría, retención, responsable | **Ninguna**. Las semillas de `system_ops.entity_registry` y `field_registry` son registros de ejemplo cuyo `column_name` es un título («Core Field Registry») | `SIN_FUENTE`. Es una decisión de gobierno de datos, no un dato que falte leer |
| Deriva contra el ORM | Entidades MikroORM leídas del AST (`fieldName`, tipo, `nullable`) | — |
| Deriva contra la base | `inventario/catalogo/deriva-bd.json`, generado por `deriva-bd.mjs` con `DERIVA_DATABASE_URL` (sólo `SELECT` sobre el catálogo del sistema) | `SIN_VERIFICAR` |

### Lo que el catálogo NO afirma

- **Que una descripción sea correcta ni vigente:** se cita de dónde sale. Sólo el 23 % de las columnas
  tiene alguna, y el 70 % de ellas es la convención de columnas estándar (`id`, `created_at`, `updated_at`).
- **Que un índice «no se use»:** «sin uso detectado» significa que el análisis estático no lo encontró;
  no hay planes de ejecución ni estadísticas de la base.
- **Que la base desplegada de verdad esté al día:** la comparación se hizo con una base descartable
  construida con el DDL canónico. Demuestra que el modelo es coherente consigo mismo.
- **Que las 32 entidades sin tabla relacional estén mal:** 24 viven en `NoSQL/` (Timescale y pgvector) y
  el catálogo es sólo relacional. `deriva.md` dice dónde está cada una.
