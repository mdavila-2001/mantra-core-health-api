# Inventario del sistema

Inventario **generado desde el código y el modelo**, no escrito a mano. Alimenta el portal interno
(catálogo de operaciones, mapa de flujos y catálogo de datos). Cada dato conserva su fuente
(`archivo:línea`) y, cuando es una deducción, la confianza con que se obtuvo.

| Inventario | Qué contiene | Cómo regenerarlo | Documentación |
|---|---|---|---|
| Endpoints | 1 operación HTTP = 1 registro: tablas que afecta, DTO y restricciones, requerimientos, payload mínimo, explicación de negocio y de sistema, riesgo, pruebas | `yarn inventario:endpoints` | [endpoints/](endpoints/index.md) |

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
