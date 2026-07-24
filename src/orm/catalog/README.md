# src/orm/catalog — El modelo oficial como datos

Todo lo que el modelo canónico declara y una entidad MikroORM escalar no puede expresar.

## Por qué existe

Las entidades de `src/modules/**/entities` se generan por introspección de la base y, por
convención del repositorio, no se editan a mano. Eso significa que describen columnas y
poco más. Quedan fuera del código dos piezas grandes del modelo físico:

1. **Los índices secundarios.** El modelo los declara en elementos `<<INDEX_SET>>` (1193
   conjuntos, ~7370 definiciones). Una base creada solo desde las entidades tendría las
   tablas correctas y ni un índice más que las claves primarias: cada filtro por `tenant_id`
   o cada join por `*_concept_id` sería un escaneo secuencial.
2. **Las claves foráneas.** Las columnas FK están mapeadas como `uuid` escalares, sin
   `@ManyToOne`, para no acoplar los 57 módulos entre sí. MikroORM no puede emitir ninguna.

Este catálogo las declara aparte. Se genera desde la bóveda con `yarn orm:catalog` y lo
aplican las capas 05 y 06 del arranque.

## Contenido

| Archivo o carpeta | Qué declara | Origen | Volumen |
|---|---|---|---|
| `catalog.types.ts` | Los tipos de tupla y los contratos | escrito a mano | — |
| `schemas.catalog.ts` | Los 57 esquemas, con su módulo del modelo | generado | 57 |
| `extensions.catalog.ts` | Extensiones de PostgreSQL requeridas | escrito a mano | 4 |
| `types.catalog.ts` | Tipos enumerados nativos | escrito a mano | 1 |
| `indexes/` | Índices secundarios por schema | generado | 7313 |
| `foreign-keys/` | Claves foráneas por schema | generado | 5993 |
| `physical.catalog.ts` | Hypertables e índices vectoriales | escrito a mano | 13 |

## El formato de tupla

Los catálogos generados usan tuplas y no objetos:

```ts
['sessions', 'user_id', 'iam', 'users', 'id']
```

en lugar de

```ts
{ table: 'sessions', column: 'user_id', targetSchema: 'iam', ... }
```

La razón es de escala: son ~13 300 declaraciones. En forma de objeto ocuparían unas 90 000
líneas repartidas en cientos de archivos. En forma de tupla ocupan una línea cada una,
ningún archivo supera las 190 líneas y el conjunto sigue siendo diffable línea a línea
cuando el modelo cambie. El orden de los campos está documentado en `catalog.types.ts` y
repetido como comentario en la cabecera de cada archivo generado.

## Deuda conocida heredada del modelo

Estas no son omisiones de la implementación: son cosas que el modelo oficial todavía no
fija, y el código las señala en vez de inventarlas.

- **`terminology.technical_data_type` con valores provisionales.** El modelo declara el
  enum y lista "definir sus valores" como pendiente. Sin al menos un valor, PostgreSQL no
  crea el tipo y no se pueden crear las seis tablas que lo usan. Se materializa un conjunto
  marcado `provisional: true` y el arranque lo reporta como incidencia en cada ejecución.
- **`vector_rag.vector_embeddings.embedding` sin dimensión.** El modelo la declara como
  `vector` a secas. pgvector admite esa forma para almacenar pero no para indexar: HNSW
  necesita una dimensión fija. El índice se omite con una condición previa explícita en
  lugar de fijar aquí un 1536 que es una decisión del modelo y además irreversible.
- **57 índices no expresables como tupla.** Cinco son GiST funcionales sobre
  `tstzrange(...)` y el resto pertenece a vistas materializadas o a stores no relacionales.
  Un índice sobre expresión necesitaría un campo `expression` en `IndexTuple`.
- **Dos índices del modelo referencian columnas que no existen.** Un defecto de la bóveda,
  no de aquí: `uq_payment_provider_transaction` nombra `payment_gateway_id` y
  `provider_transaction_id` cuando la entidad declara `gateway_id` y
  `gateway_transaction_ref`; `uq_inventory_position_lot` nombra `pharmacy_site_id`,
  `product_id` y `lot_id` cuando la entidad declara `inventory_location_id`,
  `pharmacy_product_id` e `inventory_lot_id`. Se descartan y se reportan.

## Regenerar

```bash
yarn orm:catalog     # borra y reescribe indexes/ y foreign-keys/ y schemas.catalog.ts
```

Los archivos escritos a mano (`catalog.types.ts`, `extensions.catalog.ts`,
`types.catalog.ts`, `physical.catalog.ts`) **no** se tocan al regenerar.
