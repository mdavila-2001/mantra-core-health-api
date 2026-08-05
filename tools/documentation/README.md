# Herramientas de documentación

Esta carpeta contiene la automatización que completa la cobertura documental del repositorio sin
modificar su comportamiento.

## Generador

`generate-documentation.mjs` analiza el AST de TypeScript para añadir TSDoc únicamente a
declaraciones que todavía no lo tienen. También crea el `README.md` de cada carpeta mantenida que
carezca de índice. Los documentos existentes se conservan para no perder explicaciones de dominio.

Ejecutar desde la raíz:

```bash
node tools/documentation/generate-documentation.mjs
```

El proceso es idempotente: una segunda ejecución no duplica comentarios ni reemplaza índices.

## Criterios

- Se excluyen dependencias, artefactos compilados, cobertura y metadatos de Git.
- Se documentan clases, interfaces, tipos, enumeraciones, propiedades, constructores, métodos,
  accesores y funciones.
- Los parámetros, retornos y errores detectables se expresan mediante etiquetas TSDoc.
- Los comentarios de negocio escritos a mano tienen prioridad y no se sobrescriben.
