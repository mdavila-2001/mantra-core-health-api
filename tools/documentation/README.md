# Herramientas de documentación

Esta carpeta contiene la automatización que completa la cobertura documental del repositorio sin
modificar su comportamiento.

## Generador

`generate-documentation.mjs` analiza el AST de TypeScript para añadir TSDoc únicamente a
declaraciones que todavía no lo tienen. Es el paso 3 de la regeneración de entidades
([ADR-0022](../../docs/adr/ADR-0022-generacion-de-entidades.md)), así que su alcance son **solo las
carpetas `entities/` de `src/modules/`**. No toca `src/common`, `src/worker`, los DTO, `database/`,
`mock-provider-server/`, `test/` ni `tools/`, y por defecto no crea `README.md` (issue #1246).

Ejecutar desde la raíz:

```bash
yarn docs:tsdoc                                   # TSDoc de las entidades
node tools/documentation/generate-documentation.mjs --readmes  # además, el README que falte en esas carpetas
yarn docs:tsdoc:test                              # pruebas del alcance
```

El comentario se inserta con la sangría de la declaración, así que la salida ya respeta Prettier.

El proceso es idempotente: una segunda ejecución no duplica comentarios ni reemplaza índices.

## Criterios

- Se excluyen dependencias, artefactos compilados, cobertura y metadatos de Git.
- Se documentan clases, interfaces, tipos, enumeraciones, propiedades, constructores, métodos,
  accesores y funciones.
- Los parámetros, retornos y errores detectables se expresan mediante etiquetas TSDoc.
- Los comentarios de negocio escritos a mano tienen prioridad y no se sobrescriben.
