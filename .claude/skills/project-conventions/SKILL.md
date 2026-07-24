---
name: project-conventions
description: "Reglas transversales OBLIGATORIAS de mantra-core-health-api que aplican a cualquier cambio: idioma español sin emojis, límite de 300 líneas por archivo, entidades no editables a mano, sin enums de TypeScript para negocio, temperatura cero, nomenclatura (snake_case archivos / PascalCase clases), y política de tokens vía graphify. Usar al inicio de cualquier tarea de este repo para no violar sus invariantes."
---

# project-conventions

Reglas que se cumplen en **todo** el repositorio, sin excepción. Aplícalas en cualquier
cambio, aunque la tarea no las mencione. Son las mismas de `CLAUDE.md`, reunidas para revisar
de un vistazo antes de tocar código.

## Invariantes

- **Idioma**: comentarios, documentación, mensajes de log y de commit **en español**. **Sin emojis** en ningún sitio.
- **Máximo 300 líneas por archivo.** Sin excepción; el catálogo generado se trocea para respetarlo.
- **Las entidades no se editan a mano.** Se generan por introspección (`yarn orm:gen`). Si algo
  no cuadra, se corrige el DDL/catálogo y se regenera (ver skills `mikro-orm-migrations`, `orm-catalog`).
- **Índices y claves foráneas NO van en las entidades** — van en `src/orm/catalog/`. Las columnas
  FK se mapean como `uuid` escalares, sin `@ManyToOne`, para no acoplar los 57 módulos.
- **Nada de enums de TypeScript para valores de negocio.** Se resuelven contra
  `terminology.catalog_concepts` vía columnas `*_concept_id`. Único enum nativo: `terminology.technical_data_type`.
- **Temperatura cero**: nada que el modelo no declare. Lo no resuelto se marca como **deuda explícita**
  y se reporta; no se inventa (ver `docs/auditoria-orm.md` §2.4).
- **Nomenclatura**: archivos en `snake_case`, clases en `PascalCase`.
- Validación de DTOs con `class-validator`/`class-transformer`; entorno con **Joi**.
- Un módulo NestJS por dominio bajo `src/modules/<dominio>/`; sin acoplar dominios (skill `nestjs-module`).
- **Logging con pino en TODAS las capas.** Regla base del proyecto:
  - **Nunca** `console.log`/`console.error`/`console.warn` en código de la app (única
    excepción: el splash de arranque de `main.ts`, anterior al logger).
  - Se obtiene el logger por inyección: `PinoLogger` de `nestjs-pino` en services,
    controllers, guards y workers; en piezas construidas fuera del contenedor (config,
    puente del ORM) se usa el `Logger` de `@nestjs/common`, que `main.ts` enruta a pino con
    `app.useLogger`. No se instancia pino a mano en cada archivo.
  - Configuración central en **`src/logging`** (`LoggingModule`, global): nivel por
    `LOG_LEVEL`, redacción de secretos, logging HTTP automático. No se reconfigura por módulo.
  - Mensajes **en español, sin emojis**. Los datos van como **campos estructurados**
    (objeto con clave `msg` + campos), no interpolados en el texto, para poder filtrarlos.
  - Nunca registrar credenciales, tokens ni PII; si un campo nuevo es sensible, añádelo a la
    lista de redacción de `src/logging/pino-options.ts`.

## Política de tokens (obligatoria)

Fuente primaria = el **grafo** en `graphify-out/`, no leer archivos. Orden de preferencia:

1. `graphify query "<pregunta>"` (`--budget 1500` para acotar).
2. `graphify path "<A>" "<B>"` — relación entre conceptos/módulos.
3. `graphify explain "<símbolo>"` — nodo concreto.
4. El **README de la carpeta** (están escritos para responder sin abrir código).
5. `graphify-out/GRAPH_REPORT.md` — solo revisión arquitectónica amplia.
6. `Read`/`Grep` sobre `src/` — **último recurso**, sabiendo ya el archivo exacto.

**Zonas prohibidas para lectura exploratoria** (usar su README o `yarn orm:audit`):
`src/modules/*/entities/`, `src/orm/catalog/indexes/`, `src/orm/catalog/foreign-keys/`, y las
notas de la bóveda `SALUD/Entidades` y `SALUD/FK`.

## Antes de cerrar cualquier cambio

- `yarn lint && yarn build` (y `yarn test` si tocaste lógica).
- `graphify update .` tras modificar código (solo AST, sin coste de API).
- Verifica que no superaste 300 líneas y que no quedó texto/emojis en inglés.
