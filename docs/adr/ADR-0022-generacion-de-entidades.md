# ADR-0022: Generación de entidades — cuerpo desde el modelo, documentación en pasada aparte

## Estado
Aceptado (2026-08-06, v4.0.10). Es el ADR que `orm-mapping-guide.md` §6 dejó
explícitamente pendiente («Política de generación/regeneración de entidades ante
cambios del modelo»).

## Contexto

Cuatro documentos de este repositorio declaraban que las entidades de
`src/modules/**/entities/` «se generan por introspección de la base»
(`yarn orm:gen`). Era falso, y verificablemente falso:

- `orm:gen` escribe en `generated-entities/` (directorio que no existe en el repo),
  con archivos `Users.entity.ts` (la convención es `users.entity.ts`), importando de
  `@mikro-orm/core` (las 1 186 entidades importan de `@mikro-orm/decorators/legacy`)
  y sin los comentarios `// FK → schema.tabla` que `src/modules/README.md` declara
  como la trazabilidad que queda en el código.
- La huella dactilar del generador real está en el propio código: 22 comentarios
  `// FK (destino no resuelto)` que solo produce `salud-db/gen_entities.py`.
- La premisa «la base genera las entidades» además está rota por diseño desde que
  `ORM_SCHEMA_SYNC=off` es obligatorio: la base no se garantiza sincronizada, el
  modelo sí.

El JSDoc de las entidades tampoco lo emitió ningún generador de entidades: lo
inyectó `tools/documentation/generate-documentation.mjs` (post-procesador AST,
idempotente, respeta la prosa escrita a mano) en una única corrida colada en un
commit de seeds, sin script en `package.json`. Y 7 entidades tienen prosa a medida
—invariantes de seguridad incluidas— que una regeneración ingenua destruía; por eso
la regeneración estuvo vetada de facto entre v4.0.8 y v4.0.10.

## Decisión

**El cuerpo y la documentación de una entidad son dos artefactos con dos
generadores, corriendo en este orden:**

1. **Cuerpo** — `python salud-db/gen_entities.py <NN|all>` (desde los `.puml`, la
   misma fuente que el DDL). Desde v4.0.10 **preserva los bloques `/** … */`
   existentes** (por nombre de propiedad) al reescribir, y el barrel `index.ts` es
   la unión de lo generado más los exports cuyo archivo siga existiendo — así las
   entidades que el `.puml` no materializa (las 6 tablas fantasma de la deriva
   conocida) no desaparecen del ORM en silencio.
2. **Formato** — `npx prettier --write "src/modules/**/entities/**/*.ts"`. El
   generador emite decoradores en una línea; Prettier los envuelve. Sin este paso
   el diff miente.
3. **Documentación** — `yarn docs:tsdoc` (`generate-documentation.mjs`): rellena el
   JSDoc templado **solo donde falta**. La prosa a mano tiene prioridad y no se
   toca.

Para huecos (tabla del modelo sin entidad): `yarn orm:entities:missing`, que es
no destructivo.

**`orm:gen` queda retirado** del `package.json`. `src/orm/config/orm.generator.config.ts`
se conserva con una nota, por si algún día se decide el camino de introspección de
verdad — que exigiría fijar `path`, `fileName`, el import y emitir `COMMENT ON`
desde `gen_ddl.py` para no perder la documentación. Hoy es la ruta de mayor
esfuerzo por menos valor.

## Consecuencias

- La regeneración masiva vuelve a ser segura: verificado el 2026-08-06 regenerando
  las 1 186 entidades — 19 archivos con diff, todos benignos (sufijo `(inferida)`
  en FKs sin nota del vault, `fieldName` redundantes eliminados, orden de columnas
  alineado al `.puml`, 1 barrel reordenado), 7/7 entidades con prosa a medida
  intactas, `yarn build` y `yarn typecheck` en verde.
- Los cuatro documentos que afirmaban la introspección quedan corregidos y apuntan
  acá: `src/modules/README.md`, `src/orm/catalog/catalog.types.ts`,
  `src/orm/README.md`, `orm-mapping-guide.md` §2.3.
- La secuencia oficial de alta de tabla (`ddl-sources.md`) incorpora los pasos 2 y 3.

## Evidencia

`salud-db/gen_entities.py` (`extract_jsdoc`, unión del barrel),
`tools/documentation/generate-documentation.mjs`, `package.json` (`docs:tsdoc`,
sin `orm:gen`), diff de la regeneración del 2026-08-06.
