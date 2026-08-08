# src/orm — Núcleo de persistencia relacional

Todo lo que este servicio sabe sobre PostgreSQL vive aquí. Los 59 módulos de dominio
(`src/modules/*`) solo aportan entidades y consumen el `EntityManager`; ninguno configura
la conexión, ni crea estructura, ni decide cómo se registra una consulta.

## Qué problema resuelve esta carpeta

El modelo canónico SALUD v4.0.x describe **1159 tablas repartidas en 57 esquemas**, con
~7300 índices y 5993 claves foráneas. Ese modelo vive en una bóveda Obsidian externa
(`mantra_core_technologies_health_docs`), no en este repositorio, y el DDL que lo
materializa se generaba con herramientas fuera de este proyecto.

El objetivo de este núcleo es que **la aplicación sea autosuficiente**: arrancarla contra
una base vacía debe bastar para tener el modelo completo, y arrancarla contra una base ya
construida no debe cambiar absolutamente nada.

Medido contra PostgreSQL 18 real:

| Arranque | Resultado |
|---|---|
| Base vacía | 57 schemas, 1 tipo, 1215 sentencias de estructura, 7313 índices, 5993 FKs, 12 hypertables — **3,5 s** |
| Segunda vez | **0 objetos aplicados**, 26 699 ya presentes — 1,0 s |
| Fidelidad | 1159 entidades coinciden con 1159 tablas |

## Mapa de la carpeta

| Subcarpeta | Responsabilidad |
|---|---|
| `config/` | Entorno validado con Joi y construcción de la configuración de MikroORM |
| `catalog/` | El modelo oficial materializado como datos: schemas, tipos, índices, FKs, físico |
| `bootstrap/` | La secuencia de 7 capas que inyecta el DDL en el arranque, y su cerrojo entre réplicas |
| `fidelity/` | Verificación en runtime de que cada entidad se corresponde con su tabla |
| `observability/` | Puente al logger de NestJS, detección de consultas lentas y contadores |

`orm.module.ts` los reúne; `index.ts` es la única superficie pública.

## El reparto de responsabilidades sobre el esquema

Es la decisión estructural del diseño y conviene tenerla presente antes de tocar nada:

- **La metadata de las entidades manda sobre tablas y columnas.** Lo sincroniza MikroORM.
- **El catálogo manda sobre índices y restricciones.** Lo aplican las capas 05 y 06.

El motivo es que las entidades se generan desde los `.puml` del modelo (ADR-0022) y
mapean las columnas de clave foránea como `uuid` escalares, sin relaciones `@ManyToOne`. Con 5993 referencias
entre 57 módulos, modelarlas como relaciones obligaría a que casi todos los módulos se
importasen entre sí. El precio de esa decisión es que MikroORM no puede emitir ni una
clave foránea; el catálogo paga ese precio.

Consecuencia práctica que hay que respetar: la capa de tablas **filtra** del diff de
MikroORM todo `drop index` y `drop constraint`. Sin ese filtro borraría en cada arranque
lo que las capas siguientes acaban de crear. Está explicado en
`bootstrap/layers/04-tables.layer.ts`.

## Variables de entorno

| Variable | Por defecto | Efecto |
|---|---|---|
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | sin valor | Conexión. Obligatorias, sin default a propósito |
| `DB_POOL_MIN` / `DB_POOL_MAX` | 2 / 10 | Tamaño del pool. El mínimo de 2 es necesario: el cerrojo de arranque ocupa una conexión |
| `ORM_SCHEMA_SYNC` | `safe` | `safe` aplica el DDL aditivo, `dry-run` solo lo registra, `off` no toca la base |
| `ORM_VERIFY_FIDELITY` | `true` | Compara entidades contra `information_schema` al terminar el arranque |
| `MIKRO_ORM_DEBUG` | `false` | Volcado de todas las consultas. Muy ruidoso |
| `ORM_SLOW_QUERY_MS` | `200` | Umbral por encima del cual una consulta se registra como advertencia |

## Cosas que se rompen fácil

- **`ORM_SCHEMA_SYNC=safe` en producción con varias réplicas** es seguro: el advisory lock
  serializa. Lo que no es seguro es tenerlo activo mientras otro proceso aplica migraciones
  sin usar el mismo cerrojo (`SCHEMA_BOOTSTRAP_LOCK_KEY`).
- **Regenerar entidades** (`python salud-db/gen_entities.py` + prettier + `yarn docs:tsdoc`,
  ver ADR-0022) cambia tablas y columnas, no índices ni FKs. Si el modelo añade un índice,
  hay que regenerar el catálogo (`yarn orm:catalog`).
- **Nombres de más de 63 bytes**: PostgreSQL los trunca en silencio. Todo nombre de índice
  o restricción pasa por `bootstrap/identifier.ts`; saltarse ese paso produce un bucle en
  el que el arranque cree que faltan objetos que en realidad existen.

## Comandos

```bash
yarn orm:audit           # modelo oficial vs entidades y catálogo (informe JSON)
yarn orm:catalog         # regenera catálogo de índices, FKs y schemas desde la bóveda
yarn orm:entities:missing# genera las entidades que el modelo declara y el repo no tiene
yarn orm:schema:dump     # arranque en dry-run: imprime el DDL sin ejecutarlo
yarn orm <cmd>           # CLI de MikroORM
```
