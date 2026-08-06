# src/modules — Módulos de dominio

**59 módulos NestJS, uno por schema PostgreSQL del modelo canónico SALUD v4.0.x.**
1159 entidades en total.

## Convención estricta

```
src/modules/<dominio>/
  <dominio>.module.ts        MikroOrmModule.forFeature(Object.values(entities)) + controller + service
  <dominio>.controller.ts
  <dominio>.service.ts
  entities/
    <tabla>.entity.ts        una entidad por tabla, nombre de archivo igual al de la tabla
    index.ts                 barrel; forFeature depende de él
```

El barrel no es opcional: `Object.values(entities)` es lo que registra los repositorios, así
que una entidad que no se reexporte queda descubierta por MikroORM pero sin repositorio
inyectable en su módulo.

## Las entidades se generan, no se escriben

El cuerpo lo produce `python salud-db/gen_entities.py` desde los `.puml` del modelo
canónico (la misma fuente que el DDL), y la documentación la rellena `yarn docs:tsdoc`
en una pasada aparte que respeta la prosa escrita a mano — ver
[ADR-0022](../../docs/adr/ADR-0022-generacion-de-entidades.md). La regla del proyecto
es **no editar el cuerpo a mano**: si algo no cuadra, se corrige el `.puml` y se
regenera. El JSDoc a medida sí es bienvenido: la regeneración lo preserva.

Dos consecuencias que explican cómo están escritas:

- **Las claves foráneas son `uuid` escalares, no relaciones `@ManyToOne`.** Con 5993
  referencias entre 57 módulos, modelarlas como relaciones obligaría a que casi todos los
  módulos se importasen entre sí y produciría ciclos. La integridad referencial la declara
  `src/orm/catalog/foreign-keys` y la aplica la capa 06 del arranque. El comentario
  `// FK → schema.tabla` de cada columna es la trazabilidad que queda en el código.
- **Los índices no están en las entidades.** Están en `src/orm/catalog/indexes`.

`row_version` lleva `version: true`: es la columna de bloqueo optimista del modelo. Sin ella,
dos escrituras concurrentes sobre la misma fila se pisan sin que nadie se entere.

## Terminología en vez de enums

El modelo resuelve prácticamente todos sus valores cerrados contra
`terminology.catalog_concepts` mediante columnas `*_concept_id`, no contra enums nativos de
PostgreSQL ni enums de TypeScript. Es una decisión de gobernanza: añadir un valor a un
catálogo es un INSERT; añadirlo a un enum es una migración.

**No inventar enums de TypeScript para estos campos.** El único enum nativo del modelo es
`terminology.technical_data_type`.

## Módulos sin entidades propias

Ninguno: los 59 tienen su carpeta `entities/`. Los stores no relacionales del modelo
(`document_store` en MongoDB, `redis_runtime`, `search_platform` en OpenSearch) no tienen
módulo aquí porque MikroORM cubre solo PostgreSQL.

## Añadir un módulo

1. Crear la carpeta con los cuatro archivos de la convención.
2. Añadir el schema al catálogo: `yarn orm:catalog`.
3. Registrar el módulo en `src/app.module.ts`.
4. Comprobar con `yarn orm:audit` que no queda ninguna entidad del modelo sin mapear.

## Volumen por dominio

Los cinco mayores: `audit` (123 entidades), `ads` (73), `erp` (51), `payments` (47),
`accounting` (42). El detalle completo, con su número de módulo del modelo, está en
`src/orm/catalog/schemas.catalog.ts`.
