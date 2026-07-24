# src/orm/bootstrap — Inyección idempotente del DDL

Lo que ocurre entre "NestJS terminó de inicializar los módulos" y "el servidor HTTP acepta
la primera petición".

## Contrato

Arrancar contra una base vacía deja el modelo completo. Arrancar contra una base ya
construida no cambia nada. Ninguna de las dos cosas borra datos jamás.

Medido contra PostgreSQL 18:

```
Base vacía          57 schemas · 1 tipo · 1215 sentencias · 7313 índices · 5993 FKs · 12 hypertables
                    Esquema materializado en 3485 ms: 14594 objetos aplicados

Segundo arranque    Esquema materializado en 983 ms: 0 objetos aplicados, 26699 ya presentes
                    Fidelidad verificada: 1159 entidades coinciden con la base
```

## Archivos

| Archivo | Responsabilidad |
|---|---|
| `schema-bootstrap.service.ts` | Orquesta: toma el cerrojo, recorre las capas, compone el informe |
| `ddl-layer.contract.ts` | El contrato que cumple cada capa y el contexto que recibe |
| `advisory-lock.ts` | Exclusión mutua entre réplicas mediante advisory lock de PostgreSQL |
| `identifier.ts` | Acota nombres al límite de 63 bytes de PostgreSQL sin colisiones |
| `layers/` | Las siete capas, en orden de dependencia |

## Por qué `OnApplicationBootstrap`

En ese momento todos los módulos están inicializados, lo que garantiza que MikroORM
terminó de descubrir las 1159 entidades; con `OnModuleInit` el descubrimiento podría estar
incompleto y el DDL saldría parcial. Además ocurre **antes** de que el servidor HTTP empiece
a aceptar tráfico, así que ninguna petición llega a una base a medio construir.

## El cerrojo entre réplicas

En un despliegue con N réplicas, las N arrancan a la vez y las N intentan crear las mismas
tablas. El resultado sin coordinación no son errores limpios de `duplicate_table`, sino
interbloqueos entre transacciones que toman bloqueos `ACCESS EXCLUSIVE` sobre las mismas
relaciones en distinto orden: el arranque falla de forma intermitente.

`advisory-lock.ts` usa `pg_advisory_xact_lock` sobre una transacción vacía que se mantiene
abierta durante todo el arranque. Detalle no obvio: un `pg_advisory_lock` de sesión no
serviría, porque el pool no garantiza que las siguientes sentencias viajen por la misma
conexión y el cerrojo pertenece a la sesión que lo tomó. Atarlo a una transacción propia
elimina esa incertidumbre y garantiza la liberación aunque el proceso muera.

Consecuencia operativa: **el pool necesita al menos dos conexiones**, una para el cerrojo y
otra para el trabajo. Por eso `DB_POOL_MIN` vale 2.

Cualquier otro proceso que modifique el esquema (un job de migración) debería tomar el
mismo cerrojo: `SCHEMA_BOOTSTRAP_LOCK_KEY = 728431905112004`.

## Modos

`ORM_SCHEMA_SYNC` decide el comportamiento y ninguna capa lo consulta: lo aplica el contexto
que construye `schema-bootstrap.service.ts`, de modo que las capas escriben su SQL siempre
igual.

| Modo | Efecto |
|---|---|
| `safe` | Calcula y aplica el DDL aditivo. Por defecto |
| `dry-run` | Calcula el DDL y lo registra, sin ejecutarlo. `yarn orm:schema:dump` |
| `off` | No toca la base. Para entornos donde la estructura la gestiona un DBA |

Las lecturas al catálogo de PostgreSQL sí se hacen siempre, incluso en `dry-run`: son las
que permiten calcular qué falta.

## Fallos tolerados y fallos que abortan

Abortan el arranque: una extensión marcada como obligatoria que no se puede instalar, y
cualquier error en la sincronización de tablas.

No abortan, se agrupan en una advertencia final: extensiones opcionales sin permisos (típico
en PostgreSQL gestionado), lotes de índices o FKs que fallan por datos preexistentes que
violan la restricción, y sentencias físicas cuya condición previa no se cumple. El criterio
es que el servicio pueda operar con la capacidad degradada en vez de no arrancar.

## Lecciones aprendidas ejecutándolo

Las tres cosas que rompieron al probarlo contra PostgreSQL real, por si vuelven a aparecer:

1. **`safe: true` no protege los objetos de esquema, solo los datos.** MikroORM emitía
   12 969 `drop index` y `drop constraint` en el segundo arranque, uno por cada objeto del
   catálogo que no está en la metadata de las entidades. La capa 04 los filtra.
2. **Enviar miles de `ALTER TABLE` en un único lote agota `max_locks_per_transaction`**
   ("out of shared memory"). Se trocea en lotes de 200.
3. **PostgreSQL trunca identificadores de más de 63 bytes sin avisar.** Ver
   `identifier.ts`.
