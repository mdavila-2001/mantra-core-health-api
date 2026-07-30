# Servicios de operaciones de plataforma

Lógica de negocio. Cada método público resuelve un caso de uso en **una transacción**.

## Servicios

Cuatro, uno por ritmo de trabajo:

- **`OpsReleasesService`** (UC-46-01 … 05) — cambios, aprobaciones del CAB, artefactos, despliegues
  y reversiones. Lo que ocurre cuando se publica algo.
- **`OpsIncidentsService`** (UC-46-06 … 08) — corridas de health check, incidentes y postmortems. Lo
  que ocurre cuando algo se rompe.
- **`OpsReliabilityService`** (UC-46-09 … 11) — SLO, presupuesto de error y capacidad. Lo que se mide
  continuamente, sin que pase nada.
- **`OpsPracticesService`** (UC-46-12 … 14) — revisiones de preparación, runbooks y ejercicios de
  resiliencia. Lo que se hace periódicamente para que las otras tres vayan mejor.

## Dependencias cruzadas

Son deliberadas y en una sola dirección:

- `OpsReleasesService` → `OpsReliabilityRepository` (¿hay congelamiento?) y `OpsPracticesRepository`
  (¿hay revisión con "go"?). Las tres puertas del despliegue viven en el servicio que despliega, no
  repartidas por ahí.
- `OpsIncidentsService` → `OpsImprovementsRepository` (las acciones del postmortem entran al backlog).
- `OpsPracticesService` → `OpsIncidentsRepository` (la ejecución de un runbook dentro de un incidente
  deja entrada en su timeline) y `OpsImprovementsRepository`.

Ningún servicio llama a otro servicio: sólo a repositorios. Así una transacción nunca queda repartida
entre dos dueños.

## Reglas de negocio

### Releases

- **Cambio (01)**: componente activo, número correlativo por tenant, ventana planificada no invertida
  y contenida en la ventana de mantenimiento si se ata a una. Nace en `requested`.
- **Aprobación (02)**: el solicitante no aprueba, no se vota dos veces en el mismo paso, no se salta
  un paso, y el cambio pasa a `approved` cuando los pasos aprobados alcanzan los exigidos. Un
  rechazo cierra el cambio en `rejected`.
- **Artefacto (03)**: referencia y versión únicas, herramienta homologada si se declara, hash
  normalizado a minúsculas, `is_immutable = true` siempre.
- **Despliegue (04)**: cambio `approved`, artefacto activo **del mismo componente**, revisión con
  "go" en producción, sin congelamiento. `is_current` sólo se mueve con `SUCCEEDED`, y sólo entonces
  el cambio pasa a `implemented`.
- **Reversión (05)**: el origen debe ser `succeeded` o `failed` **y** vigente; el destino, del mismo
  componente y entorno. Crea un despliegue `recreate` correcto y vigente, y deja el origen en
  `rolled_back`.

### Incidentes

- **Corrida (06)**: check activo y habilitado. `FAIL`, `TIMEOUT` y `ERROR` cuentan como fallo;
  `PASS` y `WARN` cortan la racha. Alcanzado el umbral (o 1 si el check no declara ninguno), se abre
  incidente salvo que ya haya uno vivo para ese check.
- **Incidente (07)**: `open → acknowledged → mitigated → resolved`, admitiendo `mitigate` desde
  `open`. Resolver exige causa raíz y resolución. `UPDATE` no mueve el estado. Un respondiente
  repetido no se duplica, pero su acuse de recibo sí se registra.
- **Postmortem (08)**: incidente `resolved`, uno solo por incidente, códigos de acción sin repetir, y
  al menos una acción. Cada acción abre además una mejora en el backlog.

### Fiabilidad

- **SLO (09)**: ventana no invertida, con eventos, buenos ≤ totales, dentro de la vigencia del
  objetivo. Idempotente por `window_end`. Estado: `pass` si alcanza el objetivo, `warn` si alcanza el
  umbral de aviso, `fail` en otro caso.
- **Quema (10)**: política activa con al menos una medición detrás. Por debajo del umbral de aviso no
  hay nada que registrar. Severidad: `exhausted` si no queda presupuesto, `critical` sobre el umbral
  crítico, `warning` en otro caso.
- **Capacidad (11)**: plan activo, medición dentro del horizonte, capacidad mayor que cero. El plan
  sólo se recomputa si se cruza el guardrail **y** llegan datos nuevos.

### Prácticas

- **Revisión (12)**: sólo `in_progress`; los hallazgos que se cierran deben ser de esa revisión y
  estar abiertos; un hallazgo crítico o alto abierto impide el "go"; lo que queda abierto pasa al
  backlog.
- **Runbook (13)**: runbook activo, versión correlativa a la última publicada, y pasa a ser la
  vigente. La ejecución exige versión existente e incidente existente si se declara.
- **Resiliencia (14)**: ejercicio no cerrado, con objetivo de recuperación vigente. El resultado sale
  de comparar lo observado con el objetivo, y el incumplimiento abre una mejora.

## Precisión numérica

- **Contadores de evento y segundos de RTO/RPO son `bigint`**: viajan como cadena y se comparan y
  dividen con `BigInt`. `ratio()` calcula el cumplimiento con 8 decimales exactos; pasar por `number`
  perdería precisión justo en las ventanas grandes, que son las que deciden si el SLO se cumple.
- **Los umbrales y porcentajes son `numeric` de rango corto** (tasas de quema, utilización): se
  comparan como `number`, que los representa exactamente, y la utilización se emite con 5 decimales,
  los de la columna.

## Convención del guardrail de capacidad

`capacity_plans.cost_guardrails_json` es JSON libre en el modelo. Este módulo lee de él la clave
**`maxUtilizationPercent`**; si no está, no hay guardrail y ninguna medición lo cruza. La convención
se declara en una constante del servicio en lugar de adivinarse en cada lectura.

## Cómo se sabe si los despliegues están congelados

No hay fila de "congelamiento". `deploymentsFrozen()` recorre las políticas activas que congelan al
agotarse y mira el **último** evento de quema de cada una: si alguna dejó el presupuesto en cero o
por debajo, hay congelamiento. Derivarlo del histórico evita que una marca se quede desincronizada
con lo que realmente pasó.

## Transacciones y concurrencia

Un caso de uso equivale a una transacción, incluidas las compuestas: despliegue + cesión del vigente
+ cierre del cambio; reversión + marcado del origen; postmortem + acciones + mejoras; revisión +
hallazgos + mejoras. Bloqueos: ver el README de `repositories/`.

## Excepciones

`ResourceNotFoundException` (componente, herramienta, ventana, cambio, artefacto, despliegue, check,
incidente, objetivo, política, plan, revisión, hallazgo, runbook, versión o ejercicio desconocidos),
`PreconditionFailedException` (componente inactivo, ventana cerrada o desbordada, herramienta no
homologada, cambio no aprobado, artefacto de otro componente, producción sin "go", congelamiento
activo, despliegue no reversible o ya no vigente, sin destino estable, check deshabilitado,
transición inválida, resolución sin causa, incidente no resuelto, ventana de medición inválida o
fuera de vigencia, quema por debajo del aviso, capacidad cero, medición fuera del horizonte, hallazgo
bloqueante abierto, runbook inactivo, ejercicio sin objetivo) y `ConflictException` (número
irrepetible agotado, referencia o versión de artefacto duplicada, doble voto, postmortem duplicado,
hallazgo ya cerrado, versión de runbook tomada, ejercicio ya cerrado).

## Logs

`operation: 'ops.<área>.<acción>'`. `warn` en todo lo que alguien debería mirar: rechazo del CAB,
despliegue fallido, reversión, apertura de incidente, SLO incumplido, quema, guardrail cruzado, "no
go", runbook que no completa y ejercicio que incumple su objetivo.

## Pruebas

- `ops-releases.service.spec.ts` (43): correlativos y colisiones, contención en la ventana,
  segregación de deberes, orden y unicidad del voto, inmutabilidad del artefacto, las tres puertas
  del despliegue, cesión del vigente sólo al éxito y reversión con destino explícito o derivado.
- `ops-incidents.service.spec.ts` (29): conteo de fallos consecutivos y corte con `WARN`, umbral
  ausente, no duplicar el incidente vivo, cada transición y sus estados de origen, resolución sin
  causa, respondiente repetido, y postmortem con acciones y mejoras.
- `ops-reliability.service.spec.ts` (30): cumplimiento exacto con contadores mayores que `2^53`, las
  tres franjas de estado, idempotencia por ventana, severidades de quema, congelamiento según la
  política, y guardrail de capacidad con y sin recomputación.
- `ops-practices.service.spec.ts` (29): hallazgo bloqueante frente a "go", paso al backlog, numeración
  de versiones, timeline sólo dentro de incidente, y comparación exacta de RTO/RPO con `BigInt`.
