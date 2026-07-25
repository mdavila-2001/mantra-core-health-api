# src/orm/config — Configuración de la capa relacional

Tres archivos, con una separación que no es arbitraria.

| Archivo | Quién lo consume | Por qué está separado |
|---|---|---|
| `orm.env.ts` | NestJS (`ConfigModule`) y la CLI de MikroORM | La CLI carga la configuración fuera del contenedor de dependencias, así que la validación tiene que ser una función pura, no un proveedor inyectable |
| `orm.config.ts` | `OrmModule` y la CLI | Configuración de runtime |
| `orm.generator.config.ts` | Solo `yarn orm:gen` | Importa `@mikro-orm/entity-generator`, que es devDependency. Mezclarlo con el runtime haría que producción exigiera un paquete que no está instalado |

## orm.env.ts

Valida el entorno con Joi y lo normaliza a `OrmEnv`, una estructura agrupada por
responsabilidad (`connection`, `pool`, `schema`, `observability`) en vez de un objeto plano
de variables.

Dos decisiones que conviene no revertir:

- **No hay defaults para host, puerto ni credenciales.** Un default de `localhost` convierte
  una variable mal escrita en un arranque exitoso contra la base equivocada. Sin default, el
  proceso muere en el primer segundo nombrando la variable que falta.
- **`abortEarly: false`.** Al levantar un entorno nuevo interesa ver de una vez las cinco
  variables que faltan, no descubrirlas en cinco reinicios consecutivos.

También valida una invariante cruzada que Joi no expresa bien por sí solo: `DB_POOL_MIN`
no puede superar a `DB_POOL_MAX`.

## orm.config.ts

Puntos que responden a un problema concreto y que se deshacen con facilidad si no se sabe
por qué están:

- **`metadataCache.options.cacheDir`** — la caché se mueve a `node_modules/.cache/mikro-orm`.
  El valor por defecto es `<cwd>/temp` y el adaptador de archivos escribe **un JSON por
  entidad**, así que con 1159 entidades aparecían 1159 archivos sueltos en la raíz del
  repositorio. Bajo `node_modules/.cache` quedan donde corresponde a un artefacto derivado y
  ya ignorado por git. La caché en sí es necesaria: sin ella cada arranque vuelve a analizar
  con ts-morph los 1159 archivos.
- **`schemaGenerator.createForeignKeyConstraints: false`** — las FKs las declara el
  catálogo. Ver `src/orm/catalog/foreign-keys/README.md`.
- **`forceUtcTimezone: true`** — todas las marcas temporales del modelo son `timestamptz`.
  Sin esto, la zona horaria del contenedor se cuela en las conversiones y produce
  desplazamientos de horas en historiales clínicos.
- **`driverOptions: { application_name }`** — aparece en `pg_stat_activity`, así que un DBA
  puede atribuir una consulta bloqueante a este servicio sin adivinar. **No anidarlo bajo
  `connection`**: `pg` reserva esa clave para inyectar un objeto `Connection` propio, y
  pasarle un literal rompe el establecimiento de la conexión con un
  `TypeError: con.connect is not a function` que no dice nada.
- **`loggerFactory`** — enruta el logger interno de MikroORM al de NestJS. Ver
  `src/orm/observability/README.md`.

`TsMorphMetadataProvider` se mantiene porque las entidades usan propiedades opcionales
cuyo tipo TypeScript no siempre sobrevive a `emitDecoratorMetadata`. El coste de analizar
los 1159 archivos se paga una sola vez gracias a la caché.

## orm.generator.config.ts

El flujo del proyecto es de doble sentido:

```
modelo oficial (bóveda)  ->  DDL  ->  base de datos  ->  entidades
```

El modelo genera el DDL y la base genera las entidades. Esta configuración cubre el último
tramo. Regla asociada: **las entidades no se editan a mano**; si algo no cuadra se corrige
el DDL y se regenera.

`onProcessedMetadata` marca `row_version` como columna de versión. La introspección no
puede deducirlo (es un `integer` corriente) y sin `version: true` dos escrituras
concurrentes sobre la misma fila se pisan sin que nadie se entere.
