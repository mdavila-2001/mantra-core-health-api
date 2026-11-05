# ADR-0029: El `fork()` sin argumentos hereda la transacción de la petición bajo RLS

## Estado
Aceptado (2026-11-04). Complementa a [ADR-0006](ADR-0006-multi-tenancy-rls.md).

## Contexto
Con `RLS_ENFORCE=true`, el tenant de la petición vive en `set_config('app.current_tenant_id', ..., true)`,
es decir, **local a la transacción** que abre el interceptor de tenant (ver
[aislamiento de tenant](../security/tenant-isolation.md)). Las políticas RLS están forzadas: una consulta
que corre fuera de esa transacción no tiene GUC de tenant y no ve ninguna fila (lectura vacía, o escritura
rechazada por `WITH CHECK`).

El `EntityManager.fork()` de MikroORM 7 sin argumentos **no** hereda el contexto transaccional: toma otra
conexión del pool, sin `set_config`. El patrón `this.em.fork()` para leer es habitual en el código (más de
quinientos archivos inyectan el `EntityManager`), así que cada fork plano en una ruta de petición era una
lectura que, con RLS activo, devolvía vacío o no veía lo escrito en la misma petición y aún sin confirmar.
Se venía corrigiendo módulo por módulo, con `fork({ keepTransactionContext: true })` a mano, y el
defecto reaparecía con cada fork nuevo.

## Fuerzas y restricciones
- El error es silencioso: no hay excepción, solo datos ausentes. No puede depender de que cada autor
  recuerde la opción.
- Hay forks que sí deben tener su propia conexión (cerrojos, escrituras que persisten aunque la petición
  falle).
- No se agregan dependencias ni se modifica MikroORM.

## Opciones consideradas
1. **Codemod que reescriba todos los forks** a `fork({ keepTransactionContext: true })`: un diff enorme y
   transversal que no protege los forks que se escriban después; el defecto vuelve en el siguiente PR.
2. **Seguir módulo por módulo**: es lo que se hacía; deja la mayoría de los forks sin corregir y sin
   forma de saber cuáles faltan.
3. **Subclase del `EntityManager` cuyo `fork()` sin argumentos hereda** (elegida): corrige de una vez
   todos los forks planos y los futuros, y deja la excepción como un acto explícito.

## Decisión
`TransactionInheritingEntityManager` (`src/orm/transaction-inheriting-entity-manager.ts`) extiende el
`EntityManager` de `@mikro-orm/postgresql`. Su `fork()` **sin argumentos** equivale a
`fork({ keepTransactionContext: <hay una transacción viva> })`. Si la transacción ya hizo COMMIT o
ROLLBACK (código que sigue corriendo en el contexto asíncrono de la petición), el fork no la reutiliza:
el driver fallaría con «Transaction is already committed».

Cualquier fork **con** opciones se respeta tal cual; nunca se reescribe.

Se registra con la opción `entityManager` de `src/orm/config/orm.config.ts`. Como esa opción deja
registrados solo el token del núcleo y la subclase, `OrmModule` agrega un alias
(`src/orm/entity-manager-alias.provider.ts`) para que el token de `@mikro-orm/postgresql`, que es el que
inyecta el código, resuelva a la misma instancia.

## Consecuencias

### Las tres familias de excepciones
Lo que antes se corregía a mano pasa a ser el comportamiento por defecto. Lo que se escribe ahora es la
**excepción**, siempre con opciones explícitas:

| Familia | Cómo se escribe | Cuándo |
|---|---|---|
| Hereda la transacción | `em.fork()` | Lecturas y escrituras que forman parte de la petición. Es el valor por defecto. |
| Conexión propia | `em.fork({ keepTransactionContext: false })` | El fork fija su propio `set_config`, toma cerrojos, o escribe algo que debe persistir aunque la petición falle (trabajos de arranque, vaciado de métricas, coordinación de almacenamiento). |
| Savepoint | `em.fork({ keepTransactionContext: true }).transactional(...)` con el `try/catch` **afuera** | Un fork cuyo error se traga (avisos, efectos secundarios): sin savepoint, un fallo SQL dejaría abortada la transacción de la petición. El savepoint se revierte y la petición sigue. |

Un fork con opciones que no mencionan `keepTransactionContext` (por ejemplo `{ clear: false }`) **no**
hereda: quien pasa opciones decide todo.

### Lo que no cubre
- **Guards, endpoints `@TenantAgnostic` y WebSocket**: corren antes de que exista la transacción de la
  petición, o sin ella, así que no hay nada que heredar. Leen con el helper de tenant
  (`withTenantRls` / `readWithSystemRls`, en `src/common/tenant/`), que abre su propia transacción con el
  `set_config` correspondiente.
- **SQL crudo sin contexto**: `getConnection().execute(...)` sin `ctx` va por otra conexión aunque el
  `EntityManager` herede. El SQL crudo debe pasar por `em.execute`, y una regla de lint prohíbe
  `getConnection().execute` sin contexto (con una lista cerrada de excepciones en `eslint.config.mjs`).
- Un fork que sobrevive a la petición (tarea en segundo plano) no tiene transacción viva y se comporta como
  antes: su propia conexión, sin tenant. Si necesita tenant debe fijarlo.

### Riesgos
- Un fork heredado comparte la transacción: un error SQL dentro de él aborta toda la petición. Por eso los
  forks que se tragan el error van con savepoint.
- La subclase depende de `getTransactionContext()` de MikroORM; una actualización mayor del ORM debe
  revisar el comportamiento de `fork` (hay una prueba unitaria que lo fija).

## Cómo se revierte
Quitar la opción `entityManager` de `src/orm/config/orm.config.ts` (y, con ella, el alias de
`src/orm/orm.module.ts`). El `fork()` vuelve al de MikroORM. Los forks explícitos
(`keepTransactionContext: true` / `false`) siguen funcionando igual, de modo que la reversión no obliga a
tocar ningún servicio; los forks planos recuperan el comportamiento anterior (otra conexión, sin tenant).

## Evidencia
`src/orm/transaction-inheriting-entity-manager.ts` y su spec,
`src/orm/entity-manager-alias.provider.ts`, `src/orm/config/orm.config.ts`,
[`docs/security/tenant-isolation.md`](../security/tenant-isolation.md).
