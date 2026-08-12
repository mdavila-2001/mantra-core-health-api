# Entidades — Audio TTS

Las 5 tablas del schema `audio_tts`. Índices, restricciones `CHECK`, claves ajenas
y triggers **no** viven aquí: los declara
`src/orm/catalog/local.catalog.ts`, por la
misma división de responsabilidades que el resto del modelo (la metadata de las
entidades manda sobre tablas y columnas; el catálogo, sobre índices y
restricciones).

| Entidad | Tabla | Para qué |
|---|---|---|
| `AudioTemplates` | `audio_templates` | Catálogo de textos. PK = código funcional; el texto es dato, no despliegue |
| `AudioAssets` | `audio_assets` | El audio y **su cola**: `status`, `attempts`, lease y `next_attempt_at` son el estado completo de un trabajo |
| `AudioGenerationUsage` | `audio_generation_usage` | Consumo facturable por asset. UNIQUE por `asset_id`: un reproceso no puede imputar dos veces |
| `AudioActorGenerationDaily` | `audio_actor_generation_daily` | Cupo diario por actor. PK textual `actor:día` para que el incremento sea un `ON CONFLICT` atómico |
| `AudioBudgetMonth` | `audio_budget_month` | Presupuesto del mes: `reserved_units` (apartado al autorizar) y `settled_units` (gastado de verdad) |

Dos decisiones que se apartan del resto del modelo, con motivo:

- **Los estados son `varchar` con CHECK, no conceptos de `terminology`.** No son
  vocabulario clínico ni administrativo, son maquinaria interna de una caché:
  resolverlos por concepto añadiría una lectura de terminología al camino caliente
  de cada `resolve()` y obligaría a sembrar cinco conceptos que ninguna interfaz
  muestra.
- **`bytes` es `int`, no `bigint`.** El techo de respuesta del proveedor está
  acotado muy por debajo de int4, y `bigint` en MikroORM se materializa como
  `string` en JavaScript — un tipo con el que ninguna comparación numérica funciona
  como parece.
