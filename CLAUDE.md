# mantra-core-health-api

Backend de salud (NestJS 11 + TypeScript) con arquitectura modular por dominio.
Persistencia poliglota: **PostgreSQL** (MikroORM 7, relacional principal), **MongoDB**,
**OpenSearch**, **Redis** (BullMQ para colas), **S3** (object storage), **TimescaleDB** y
**pgvector**. AuthN con JWT/Passport + MFA (otplib), AuthZ con CASL. Logging con pino.
Docs con Swagger.

El modelo canónico es **SALUD v4.0.x**, y vive fuera de este repositorio, en la bóveda
Obsidian `../mantra_core_technologies_health_docs/SALUD`. **1159 tablas en 57 esquemas**.

---

## Política de tokens — usar el grafo, no leer archivos

Este proyecto tiene un **grafo de conocimiento** en `graphify-out/` construido sobre `src/`.
Es la fuente primaria para responder cualquier pregunta sobre el código.

**Orden de preferencia, de más barato a más caro:**

1. `graphify query "<pregunta>"` — subgrafo acotado. `--budget 1500` para acotar más.
2. `graphify path "<A>" "<B>"` — relación entre dos conceptos o módulos.
3. `graphify explain "<símbolo>"` — explicación enfocada de un nodo.
4. **El README de la carpeta** (ver mapa abajo) — están escritos para responder sin abrir código.
5. `graphify-out/GRAPH_REPORT.md` — solo para revisión arquitectónica amplia.
6. `Read`/`Grep` sobre `src/` — **último recurso**, y solo sabiendo ya el archivo exacto.

Binario: `/Library/Frameworks/Python.framework/Versions/3.14/bin/graphify` (o `graphify` en PATH).
Tras modificar código: `graphify update .` (solo AST, sin coste de API).

### Zonas prohibidas para lectura exploratoria

Leer estas rutas quema decenas de miles de tokens sin aportar nada; la información
equivalente está en su README:

| Ruta | Volumen | Leer en su lugar |
|---|---|---|
| `src/modules/*/entities/` | 1159 archivos | `src/modules/README.md` |
| `src/orm/catalog/indexes/` | 7313 tuplas, 72 archivos | `src/orm/catalog/indexes/README.md` |
| `src/orm/catalog/foreign-keys/` | 5993 tuplas, 65 archivos | `src/orm/catalog/foreign-keys/README.md` |
| `../mantra_core_technologies_health_docs/SALUD/Entidades/` | 2497 notas | `yarn orm:audit` |
| `../mantra_core_technologies_health_docs/SALUD/FK/` | 6465 notas | idem |

Para una entidad concreta sí se puede abrir su archivo: son de 30 a 100 líneas.
Para preguntas agregadas sobre el modelo, usar `yarn orm:audit`, que responde con cifras.

---

## Estructura

```
src/
  app.module.ts        raíz: ConfigModule (Joi) + OrmModule + 59 módulos de dominio
  main.ts
  orm/                 NÚCLEO DE PERSISTENCIA — leer src/orm/README.md
    config/            entorno validado y configuración de MikroORM
    catalog/           el modelo oficial como datos: schemas, tipos, índices, FKs, físico
    bootstrap/         7 capas que inyectan el DDL en el arranque + advisory lock
    fidelity/          verificación entidad-tabla en runtime
    observability/     logger, consultas lentas, métricas
  logging/             logging con pino para todo el backend — leer src/logging/README.md
  modules/<dominio>/   un módulo por schema — leer src/modules/README.md
  mikro-orm.config.ts  reexport para la CLI; la config real está en src/orm/config
tools/catalog/         generadores desde la bóveda (dev, no se despliega)
docs/auditoria-orm.md  auditoría completa del ORM con cifras medidas
```

**Los 59 dominios**: iam, common, terminology, directory, profiles, authz, consent, clinical,
forms, audit, system_ops, integrations, geo, practice, chart, accounting, billing,
clinical_ext, community, diagnostics, organization_extensions, diagnostic_units, pharmacy,
pharmacy_inventory, insurance, identity_assurance, telemetry, delegated_access, read_models,
integration_contracts, workflow, messaging, qa_lab, tracking, erp, reporting, auth_providers,
scheduling, payments, ads, health_context, system_context, platform_ops, education,
automation, crm, marketing, promotions, health_data, procedures_perioperative,
polyglot_storage, object_storage, graph_intelligence, cross_store_consistency, lakehouse,
time_series, vector_rag.

---

## Reglas del proyecto

- **Idioma**: comentarios, documentación y mensajes de log **en español**. Sin emojis.
- **Límite de 300 líneas por archivo.** Se cumple en todo el repositorio sin excepción; el
  catálogo generado se trocea automáticamente para respetarlo.
- **Las entidades no se editan a mano.** Se generan por introspección (`yarn orm:gen`). Si
  algo no cuadra, se corrige el DDL y se regenera.
- **Los índices y las claves foráneas no van en las entidades**, van en
  `src/orm/catalog/`. Las columnas FK se mapean como `uuid` escalares, sin `@ManyToOne`,
  para no acoplar los 57 módulos entre sí.
- **Nada de enums de TypeScript para valores de negocio.** El modelo los resuelve contra
  `terminology.catalog_concepts` mediante columnas `*_concept_id`. El único enum nativo es
  `terminology.technical_data_type`.
- **Logging con pino en todas las capas.** Nunca `console.*` en código de la app (salvo el
  splash de `main.ts`). Se inyecta `PinoLogger` (`nestjs-pino`); las piezas fuera del
  contenedor usan el `Logger` de `@nestjs/common`, que `main.ts` enruta a pino. Config central
  en `src/logging` (nivel por `LOG_LEVEL`, secretos redactados). Detalle en la skill
  `project-conventions` y en `src/logging/README.md`.
- **Temperatura cero**: nada que el modelo no declare. Lo no resuelto se marca como deuda
  explícita y se reporta, no se inventa (ver `docs/auditoria-orm.md` §2.4).
- Nombres de archivo en `snake_case`; clases en `PascalCase`.
- Validación de DTOs con `class-validator`/`class-transformer`; entorno con Joi.

---

## Comandos

```bash
yarn start:dev            # nest start --watch
yarn build                # nest build
yarn lint                 # eslint --fix
yarn test                 # jest

yarn orm <cmd>            # CLI de MikroORM
yarn orm:gen              # regenerar entidades por introspección
yarn orm:audit            # modelo oficial vs entidades y catálogo (cifras, no volcado)
yarn orm:catalog          # regenerar catálogo de índices, FKs y schemas desde la bóveda
yarn orm:entities:missing # crear las entidades que el modelo declara y falten
yarn orm:schema:dump      # arranque en dry-run: imprime el DDL sin ejecutarlo

docker compose up -d      # infra local
```

## Arranque y esquema

La aplicación **construye su propia base**. `ORM_SCHEMA_SYNC=safe` (por defecto) aplica el
DDL de forma idempotente y no destructiva al arrancar: base vacía a modelo completo en
~3,5 s; segundo arranque, 0 objetos aplicados. `dry-run` lo imprime sin ejecutar; `off` no
toca nada.

Variables en `src/orm/README.md`. Detalles del mecanismo en `src/orm/bootstrap/README.md`.

## Skills — enrutado OBLIGATORIO

**Ante cualquier prompt de este proyecto, antes de actuar**, identifica qué skill(s) de la
tabla aplican a la tarea y **cárgalas con la herramienta Skill antes de editar código o
responder**. `project-conventions` se considera **siempre**: sus invariantes rigen todo cambio.
No se cargan todas en cada prompt (violaría la política de tokens); se cargan las **relevantes**,
y hacerlo no es opcional.

| Si la tarea trata de… | Carga la skill |
|---|---|
| Cualquier cosa (reglas transversales, idioma, 300 líneas, tokens/graphify) | **project-conventions** (siempre) |
| Arranque, DDL, catálogo, índices, FKs, hypertables, fidelidad, observabilidad ORM | **orm-catalog** |
| Generar/regenerar entidades, migraciones, introspección MikroORM | **mikro-orm-migrations** |
| MongoDB, OpenSearch, Redis, S3, TimescaleDB, pgvector, consistencia cross-store | **polyglot-storage** |
| Crear/estructurar un módulo NestJS, controller, service, DI | **nestjs-module** |
| Endpoints HTTP, DTOs, validación, Swagger, versionado, errores | **api-design** |
| Guards, CASL, JWT/Passport, MFA, consent, delegated access | **authz-casl** |
| Colas, productores, workers, jobs, retries/backoff con BullMQ | **bullmq-queues** |
| Tests unitarios/e2e, mocks, testcontainers | **testing-jest** |
| Diseño de esquema/consultas a bajo nivel (genérico) | **database-design** |
| Cualquier pregunta sobre el código/arquitectura | **graphify** (query/path/explain) |

Si ninguna encaja, procede aplicando **project-conventions**. Si dudas entre dos, carga ambas.

### Inventario

De proyecto: **project-conventions**, **orm-catalog**, **polyglot-storage**, **nestjs-module**,
**mikro-orm-migrations**, **api-design**, **testing-jest**, **bullmq-queues**, **authz-casl**.
Globales enlazadas: `database-design`, `graphify`.
