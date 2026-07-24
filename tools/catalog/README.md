# tools/catalog — Generadores desde la bóveda SALUD

Herramientas de desarrollo. **No se compilan ni se despliegan**: son `.mjs` que corren con
Node directamente y solo se ejecutan a mano.

Traducen el modelo oficial, que vive en una bóveda Obsidian externa, a artefactos de este
repositorio.

## Dónde está la bóveda

Por defecto se asume hermana del repositorio:

```
GitHub/
  mantra-core-health-redesa-api/          <- este repo
  mantra_core_technologies_health_docs/   <- la bóveda
    SALUD/
      Entidades/    2497 notas: 1304 entidades + 1193 conjuntos de índices
      FK/           6465 notas de clave foránea
      Módulos/      M00..M63
      Patch v4.0.x/ extensiones de columnas sobre entidades existentes
```

Se reapunta con `SALUD_VAULT=/ruta/a/SALUD` sin tocar código.

## Los tres comandos

| Comando | Qué hace |
|---|---|
| `yarn orm:audit` | Compara el modelo con las entidades y el catálogo. Escribe un informe JSON |
| `yarn orm:catalog` | Regenera `src/orm/catalog/{indexes,foreign-keys}/` y `schemas.catalog.ts` |
| `yarn orm:entities:missing` | Crea las entidades que el modelo declara y el repositorio no tiene |

## Cómo se lee la bóveda

`lib/vault.mjs` normaliza tres formatos distintos que conviven en las notas:

1. **Bloques `puml`** en `## Campos`: el formato canónico. `* columna : tipo <<PK|FK|UK>>`,
   donde el asterisco marca NOT NULL.
2. **Bloques `text`** en `## Definición (del plan normativo)`: lo usan las entidades
   materializadas por los Patch v4.0.x. `- columna tipo FK NOT NULL`.
3. **Notas de extensión** (`Patch v4.0.x/Extensiones/Ext <schema>.<tabla>.md`): columnas
   añadidas a entidades que ya existían. Se fusionan sobre la entidad base.

Detalles del parseo que costaron un ciclo de depuración cada uno:

- Las columnas de índice pueden traer dirección (`recorded_at DESC`). Ignorarla descartaba
  400 índices descendentes, que son justo los que evitan un sort en `ORDER BY ... DESC LIMIT`.
- Las notas de extensión solo marcan NOT NULL explícitamente. Cuando no dicen nada hay que
  asumir opcional: la lectura contraria producía 11 falsas divergencias de obligatoriedad.
- 472 de las 6465 notas de FK no declaran destino. La propia bóveda las documenta como no
  resueltas; no se les inventa un destino por convención de nombres.

## Qué descarta cada generador, y por qué

**`generate-catalog.mjs`** descarta toda FK cuya columna de origen o tabla de destino no esté
mapeada por una entidad (una restricción hacia una tabla inexistente haría fallar el arranque
entero) y todo índice que nombre columnas ausentes. Trocea a 180 entradas por archivo para
que ninguno supere las 300 líneas.

**`generate-missing-entities.mjs`** salta vistas y vistas materializadas (su DDL es una
consulta que la bóveda no publica), stubs `<<REFERENCE_ONLY>>`, definiciones de máquina de
estado, y todo lo que pertenezca a stores no relacionales. También salta las entidades cuya
nota describe la estructura en prosa sin dar columnas.

Genera con el mismo estilo que produce el generador por introspección de MikroORM, de modo
que una regeneración futura desde la base no produzca un diff artificial.

## Después de regenerar

```bash
yarn orm:catalog && npx tsc --noEmit && yarn lint
```

Y si se tocaron entidades, un arranque contra una base limpia para confirmar que el DDL sigue
siendo aplicable e idempotente.
