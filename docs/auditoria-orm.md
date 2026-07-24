# Auditoría del ORM — mantra-core-health-redesa-api

Revisión completa de la capa de persistencia contra el modelo oficial SALUD v4.0.x de la
bóveda `mantra_core_technologies_health_docs`. Cubre fidelidad, observabilidad, limpieza de
código y eficiencia computacional.

Todas las cifras de esta auditoría están medidas, no estimadas: la secuencia de arranque se
ejecutó contra PostgreSQL 18.4 con TimescaleDB y pgvector en contenedor.

---

## 1. Estado de partida

| Aspecto | Situación encontrada |
|---|---|
| Entidades mapeadas | 1123 de 1159 tablas del modelo |
| Índices en código | 0 de ~7370 declarados por el modelo |
| Claves foráneas en código | 0 de 5993 |
| Creación del esquema | Delegada en `docker-compose`, apuntando a `../SQL`, **un directorio que no existe en este checkout** |
| Observabilidad de la capa de datos | Ninguna: `console.log` de MikroORM, sin métricas ni umbral de lentitud |
| Núcleo ORM | Disperso en `src/config`, `src/database` y dos configs en la raíz de `src` |
| Residuos | `temp/` con 1125 JSON de caché, `src/graphify-out/`, `tsc_output.txt` |

El diagnóstico central: **la aplicación no podía construir su propia base**, y aunque
hubiera podido, el DDL resultante habría tenido tablas sin un solo índice secundario ni
integridad referencial.

---

## 2. Fidelidad: modelo oficial contra código

### 2.1 Resultado

| Métrica | Antes | Después |
|---|---|---|
| Entidades mapeadas | 1123 | **1159** |
| Entidades del modelo sin mapear | 36 | **0** |
| Entidades en código que el modelo no declara | 0 | **0** |
| Columnas del modelo sin mapear | 5 | **0** |
| Divergencias de tipo | 5 | **0** |
| Divergencias de obligatoriedad | 11 | **0** |
| Índices declarados en el repositorio | 0 | **7313** de 7370 |
| Claves foráneas declaradas | 0 | **5993** de 5993 resolubles |

Verificado además en runtime contra la base real: `Fidelidad verificada: 1159 entidades
coinciden con la base (1159 tablas presentes)`.

### 2.2 Entidades materializadas (36)

Tablas que el modelo declara y el repositorio no tenía. Se generaron desde las notas de la
bóveda con el mismo estilo que produce el generador por introspección.

| Schema | Entidades |
|---|---|
| `community` | `feedback_tickets`, `feedback_ticket_comments`, `feedback_ticket_events`, `prestige_awards`, `prestige_scores` |
| `directory` | `tenant_affiliation_documents`, `tenant_legal_representatives`, `tenant_web_configs` |
| `scheduling` | `calendar_absences` |
| `system_ops` | `partition_specs` |
| `time_series` | las 12 series del módulo 58 (nuevo módulo NestJS) |
| `vector_rag` | las 14 entidades del módulo 59 (nuevo módulo NestJS) |

### 2.3 Columnas recuperadas (5)

| Tabla | Columnas | Consecuencia de su ausencia |
|---|---|---|
| `accounting.company_bank_accounts` | `account_holder_name`, `account_holder_tax_id` | Sin control antifraude de titularidad en tesorería |
| `erp.business_partner_bank_accounts` | `account_holder_name`, `account_holder_tax_id` | Sin "name matching" antes de emitir transferencias |
| `system_ops.entity_registry` | `partition_spec_id` | El registro de entidades no sabía si una tabla está particionada |

### 2.4 Deuda que pertenece al modelo, no al código

Estas no se han "arreglado" porque arreglarlas sería inventar decisiones que corresponden al
modelo. Están señaladas en el código y reportadas en cada arranque.

1. **`terminology.technical_data_type` sin dominio de valores.** El propio documento de
   materialización física de la bóveda lo lista como pendiente. Bloquea la creación de seis
   tablas. Se materializa un conjunto provisional de 13 valores técnicos marcado
   `provisional: true`, ampliable con `ALTER TYPE ... ADD VALUE` sin pérdida de datos.
2. **`vector_rag.vector_embeddings.embedding` sin dimensión.** Impide crear el índice HNSW.
   Se omite con condición previa explícita en vez de fijar un 1536 arbitrario e irreversible.
3. **78 vistas y vistas materializadas sin materializar** (73 de ellas en `read_models`). La
   bóveda publica sus columnas pero no la consulta que las define; no se puede generar el
   DDL sin inventarse la semántica.
4. **Dos índices del modelo nombran columnas inexistentes.** Defecto de la bóveda:
   `uq_payment_provider_transaction` pide `payment_gateway_id` y `provider_transaction_id`
   cuando la entidad tiene `gateway_id` y `gateway_transaction_ref`;
   `uq_inventory_position_lot` pide `pharmacy_site_id`, `product_id`, `lot_id` cuando la
   entidad tiene `inventory_location_id`, `pharmacy_product_id`, `inventory_lot_id`.
5. **5 índices GiST funcionales** sobre `tstzrange(...)` no representables como tupla.
   Requieren un campo `expression` en `IndexTuple`.
6. **`authz.service_principals`**: la nota de la bóveda no declara la columna `id` que la
   entidad sí tiene como clave primaria.

---

## 3. Inyección idempotente del DDL

Implementada en `src/orm/bootstrap` como **siete capas ordenadas por dependencia dura de
PostgreSQL**, bajo un advisory lock que serializa réplicas concurrentes.

### 3.1 Medición contra PostgreSQL 18 real

**Arranque contra base vacía:**

```
Capa 01 extensions:    3 aplicados,  1 ya existían  (28 ms)
Capa 02 schemas:      57 aplicados,  0 ya existían   (1 ms)
Capa 03 types:         1 aplicado,   0 ya existían   (2 ms)
Capa 04 tables:     1215 aplicados,  0 ya existían (529 ms)
Capa 05 indexes:    7313 aplicados,  0 ya existían (627 ms)
Capa 06 foreign-keys:5993 aplicados, 0 ya existían (2255 ms)
Capa 07 physical:     12 aplicados,  1 ya existían  (18 ms)
Esquema materializado en 3485 ms: 14594 objetos aplicados
Fidelidad verificada: 1159 entidades coinciden con la base
```

**Segundo arranque (idempotencia):**

```
Esquema materializado en 983 ms: 0 objetos aplicados, 26699 ya presentes
Fidelidad verificada: 1159 entidades coinciden con la base
```

**Estado final de la base:** 1162 tablas, 8527 índices, 6015 claves foráneas, 65 esquemas.
Como referencia, la base construida por las herramientas externas del modelo declaraba
1123 tablas, 8886 índices y 6014 FKs.

### 3.2 Tres defectos graves detectados al ejecutarlo

Ninguno se habría visto sin correr la secuencia contra una base real.

**a) `safe: true` no protege los objetos de esquema, solo los datos.**
MikroORM emitía **12 969 sentencias `drop index` y `drop constraint`** en el segundo
arranque: una por cada objeto del catálogo que no aparece en la metadata de las entidades.
La capa 04 habría borrado en cada despliegue exactamente lo que las capas 05 y 06 acababan
de crear, dejando la base sin índices ni integridad referencial en cada arranque, en un
ciclo que nunca converge. Corregido con un filtro explícito de formas destructivas
(`keepAdditiveStatements`).

**b) Un lote único de miles de `ALTER TABLE` agota la tabla de bloqueos.**
`out of shared memory: you might need to increase max_locks_per_transaction`. Cada `ALTER
TABLE` toma un `ACCESS EXCLUSIVE` que PostgreSQL retiene hasta el fin de la transacción, y
un envío único se ejecuta como una transacción implícita. Corregido troceando en lotes de
200.

**c) PostgreSQL trunca identificadores de más de 63 bytes en silencio.**
54 de las 5993 claves foráneas superan ese límite. La comprobación contra `pg_constraint`
nunca casaba, el arranque las creía faltantes y las reintentaba en cada despliegue fallando
con "constraint already exists". Corregido con `shortenIdentifier`, que conserva un prefijo
legible y añade un sufijo hash determinista.

### 3.3 Garantías de diseño

- **Nunca destructivo.** Ninguna capa borra tablas, columnas ni datos. Una retirada del
  modelo exige una migración revisada.
- **Modo de operación configurable.** `ORM_SCHEMA_SYNC` = `safe` | `dry-run` | `off`. Ninguna
  capa consulta el modo: lo aplica el contexto que reciben, así que todas escriben su SQL
  igual.
- **Fallos tolerados con criterio.** Abortan el arranque solo los que impiden operar. Una
  extensión opcional sin permisos, un índice único que los datos ya violan o una condición
  previa incumplida se agrupan en una advertencia final.

---

## 4. Observabilidad

| Antes | Después |
|---|---|
| `console.log` con colores ANSI, sin nivel ni timestamp | Logger de NestJS: mismo formato, nivel y transporte que el resto |
| Sin noción de consulta lenta | Umbral configurable (`ORM_SLOW_QUERY_MS`, 200 ms) que registra como **advertencia** aunque el debug esté apagado |
| Sin métricas | `QueryMetrics`: volumen, desglose por familia, lentas, fallidas, latencia acumulada y consulta más lenta |
| Conexión anónima en `pg_stat_activity` | `application_name = mantra-redesa-health-api` |
| Sin visibilidad del arranque | Informe por capa con aplicados / ya presentes / incidencias / duración |
| Sin verificación de coherencia | `SchemaFidelityService` compara 1159 entidades contra `information_schema` en 37-72 ms por arranque |

El coste de las métricas en el camino caliente es aritmética entera más un `slice(0,16)`
sobre el SQL. Nada se formatea ni se serializa salvo que el nivel de log lo exija.

---

## 5. Eficiencia computacional

### 5.1 Patrón aplicado en todas las capas

**Una lectura al catálogo de PostgreSQL, diferencia en memoria, escritura solo de lo que
falta.** La alternativa evidente -lanzar 7313 `CREATE INDEX IF NOT EXISTS` y 5993 bloques
`DO` y dejar que la base decida- costaría más de 13 000 viajes de ida y vuelta en cada
arranque de cada réplica para, en el caso normal, no hacer nada.

Efecto medido en el segundo arranque: capa de índices **10 ms**, capa de FKs **4 ms**.

### 5.2 Otras correcciones

| Cambio | Efecto |
|---|---|
| `metadataCache.options.cacheDir` a `node_modules/.cache/mikro-orm` | El adaptador escribe un JSON por entidad; con el valor por defecto (`<cwd>/temp`) dejaba 1159 archivos sueltos en la raíz del repositorio. Ahora quedan donde corresponde a un artefacto derivado |
| Lotes de 200 sentencias en la capa de tablas | Acota los bloqueos vivos; evita el agotamiento de memoria compartida |
| Lotes de 50 en índices y FKs | Compromiso entre viajes a la base y legibilidad del error cuando un lote falla |
| Condiciones previas en la capa física | Evita 12 llamadas inútiles a `create_hypertable` por arranque y, sobre todo, hace que el informe diga la verdad |
| Verificación de fidelidad en 2 consultas | Frente a 1159 si se comprobara tabla por tabla |
| Índices descendentes conservados (400) | Evitan un paso de ordenación en `ORDER BY ... DESC LIMIT`, el patrón con el que se leen logs de auditoría e historiales |
| Pool configurable (`DB_POOL_MIN`/`MAX`) | Antes se usaban los valores por defecto sin control; con varias réplicas eso agota `max_connections` |

### 5.3 Coste que se asume conscientemente

Las claves foráneas se añaden **validando** los datos existentes, lo que obliga a un escaneo
completo de la tabla origen en una base poblada (2255 ms sobre base vacía). Se acepta: una FK
`NOT VALID` es una FK que miente sobre el estado del sistema, y el objetivo de este arranque
es fidelidad, no velocidad de despliegue.

---

## 6. Clean code y estructura

### 6.1 Reorganización

```
antes                              después
src/config/database.env.ts    ->   src/orm/config/orm.env.ts
src/database/database.module  ->   src/orm/orm.module.ts
src/mikro-orm.config.ts       ->   src/orm/config/orm.config.ts   (+ reexport para la CLI)
src/mikro-orm-generator.config->   src/orm/config/orm.generator.config.ts
(no existía)                  ->   src/orm/catalog/       modelo oficial como datos
(no existía)                  ->   src/orm/bootstrap/     7 capas + cerrojo + identificadores
(no existía)                  ->   src/orm/fidelity/      verificación en runtime
(no existía)                  ->   src/orm/observability/ logger + métricas
(no existía)                  ->   tools/catalog/         generadores desde la bóveda
```

### 6.2 Límite de 300 líneas

**Cumplido sin excepciones.** El archivo más largo de `src/orm` tiene 211 líneas
(`schema-fidelity.service.ts`); el mayor del catálogo generado, 190. Los ~13 300 elementos
del catálogo se trocean automáticamente a 180 entradas por archivo.

Ningún archivo del repositorio supera las 300 líneas.

### 6.3 Otros

- **Formato declarativo.** El catálogo son tuplas de datos, no código imperativo. Las capas
  se declaran en un array ordenado. Las condiciones previas y las extensiones requeridas son
  campos, no `if`.
- **Comentarios explicativos, no descriptivos.** Cada decisión no obvia lleva su porqué y,
  cuando existe, el síntoma concreto que produce equivocarse. Cero emojis.
- **README por carpeta**: `src/orm`, `config`, `catalog`, `catalog/indexes`,
  `catalog/foreign-keys`, `bootstrap`, `bootstrap/layers`, `fidelity`, `observability`,
  `src/modules`, `time_series`, `vector_rag`, `tools/catalog`.
- **Residuos eliminados**: `temp/` (1125 archivos de caché, reubicada a `node_modules/.cache`),
  `src/graphify-out/`, `tsc_output.txt`.

---

## 7. Verificación

```bash
npx tsc --noEmit          # 0 errores
yarn lint                 # 0 errores
yarn build                # correcto
yarn orm:audit            # 0 entidades faltantes, 0 columnas faltantes, 0 divergencias
node dist/main            # arranque contra base vacía y contra base construida
```

## 8. Siguientes pasos recomendados

1. **Fijar el dominio de `technical_data_type`** en el modelo y retirar la marca
   `provisional`.
2. **Declarar la dimensión del vector de embeddings**; con eso el índice HNSW se crea solo.
3. **Publicar la definición SQL de las 78 vistas** para poder materializarlas.
4. **Corregir en la bóveda** los dos índices que nombran columnas inexistentes.
5. **Soporte de índices sobre expresión** (`expression` en `IndexTuple`) para recuperar los
   5 GiST funcionales.
6. **Exponer `QueryMetrics.snapshot()`** en un endpoint de salud; `@nestjs/terminus` ya está
   entre las dependencias.
