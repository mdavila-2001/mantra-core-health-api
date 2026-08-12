import type {
  ForeignKeyTuple,
  IndexTuple,
  PhysicalStatementSpec,
  SchemaSpec,
} from './catalog.types';

/**
 * Catálogo de los schemas que **no** provienen de la bóveda SALUD.
 *
 * Existe por una razón mecánica: `schemas.catalog.ts`, `indexes/*.idx.ts` y
 * `foreign-keys/*.fk.ts` son artefactos **generados** (`yarn orm:catalog`) a
 * partir del modelo canónico. Cualquier línea que se añada a mano en ellos
 * desaparece en la siguiente regeneración, y desaparecería en silencio: el
 * arranque siguiente dejaría de crear el schema, la capa 04 fallaría con "schema
 * does not exist" y nadie ataría el fallo a un `yarn orm:catalog` de hace tres
 * semanas.
 *
 * Este archivo se escribe a mano, no lo toca el generador, y se une a los
 * catálogos oficiales en `catalog/index.ts`. La distinción es además informativa:
 * deja explícito qué parte del modelo físico es del modelo oficial y qué parte la
 * añadió el backend por su cuenta.
 *
 * Hoy contiene un solo dominio: `audio_tts`, la caché de síntesis de voz
 * (ver `src/modules/audio_tts/README.md`).
 */

/** Schemas propios del backend. `null` en el número de módulo: no son del modelo oficial. */
export const localSchemaCatalog: readonly SchemaSpec[] = [
  // [schema, número de módulo del modelo, carpeta del módulo NestJS, tablas mapeadas]
  ['audio_tts', null, 'audio_tts', 5],
];

/**
 * Índices de `audio_tts`.
 *
 * Los tres primeros no son afinado, son reglas:
 *   - `ux_audio_assets_asset_key` es lo que convierte dos peticiones concurrentes
 *     del mismo audio en una sola generación. Sin él se paga dos veces.
 *   - `ux_audio_generation_usage_asset` impide imputar el consumo del mismo asset
 *     dos veces, que es lo que ocurriría con cualquier reproceso.
 *   - `ux_audio_budget_month_window` garantiza una sola ventana por proveedor y
 *     mes; la PK es la clave textual `proveedor:mes`, así que sin este único
 *     nada impediría dos filas describiendo el mismo mes.
 *
 * Los parciales sostienen las dos consultas calientes del worker: reclamar lote y
 * detectar leases expirados. Su predicado los mantiene pequeños, que es lo que
 * importa en una tabla donde la enorme mayoría de filas acaba en `READY`.
 */
export const localAudioTtsIndexes: readonly IndexTuple[] = [
  // [tabla, nombre, columnas, único, método, predicado?]
  ['audio_assets', 'ux_audio_assets_asset_key', ['asset_key'], true, 'btree'],
  ['audio_assets', 'ix_audio_assets_status', ['status'], false, 'btree'],
  [
    'audio_assets',
    'ix_audio_assets_template',
    ['template_code', 'template_version'],
    false,
    'btree',
  ],
  [
    'audio_assets',
    'ix_audio_assets_claimable',
    ['created_at'],
    false,
    'btree',
    "status IN ('PENDING', 'FAILED_RETRYABLE')",
  ],
  [
    'audio_assets',
    'ix_audio_assets_lease',
    ['claimed_at'],
    false,
    'btree',
    "status = 'GENERATING'",
  ],
  [
    'audio_assets',
    'ix_audio_assets_fallback',
    ['template_code', 'status', 'language', 'created_at desc'],
    false,
    'btree',
  ],
  ['audio_assets', 'ix_audio_assets_tenant_id', ['tenant_id'], false, 'btree'],
  [
    'audio_generation_usage',
    'ux_audio_generation_usage_asset',
    ['asset_id'],
    true,
    'btree',
  ],
  [
    'audio_generation_usage',
    'ix_audio_generation_usage_month',
    ['provider', 'month_key'],
    false,
    'btree',
  ],
  [
    'audio_actor_generation_daily',
    'ix_audio_actor_generation_daily_day',
    ['day_key'],
    false,
    'btree',
  ],
  [
    'audio_budget_month',
    'ux_audio_budget_month_window',
    ['provider', 'month_key'],
    true,
    'btree',
  ],
  [
    'audio_templates',
    'ix_audio_templates_fallback',
    ['fallback_template_code'],
    false,
    'btree',
  ],
];

export const localIndexCatalog: Readonly<
  Record<string, readonly (readonly IndexTuple[])[]>
> = {
  audio_tts: [localAudioTtsIndexes],
};

/**
 * Claves ajenas de `audio_tts`.
 *
 * La de `tenant_id` cruza a `directory.tenants` y es la única salida del dominio:
 * un asset dinámico pertenece a un tenant real o a ninguno, nunca a un
 * identificador inventado.
 */
export const localAudioTtsForeignKeys: readonly ForeignKeyTuple[] = [
  // [tabla, columna, schema destino, tabla destino, columna destino]
  ['audio_assets', 'template_code', 'audio_tts', 'audio_templates', 'code'],
  ['audio_assets', 'tenant_id', 'directory', 'tenants', 'id'],
  ['audio_generation_usage', 'asset_id', 'audio_tts', 'audio_assets', 'id'],
  [
    'audio_templates',
    'fallback_template_code',
    'audio_tts',
    'audio_templates',
    'code',
  ],
];

export const localForeignKeyCatalog: Readonly<
  Record<string, readonly (readonly ForeignKeyTuple[])[]>
> = {
  audio_tts: [localAudioTtsForeignKeys],
};

/**
 * Comprobación idempotente de existencia de una restricción.
 *
 * Se consulta `pg_constraint` y no se captura `duplicate_object` porque el
 * segundo enfoque aborta la transacción del lote en PostgreSQL antes de poder
 * capturar nada útil cuando hay más de una sentencia en vuelo.
 */
function addConstraint(
  table: string,
  name: string,
  definition: string,
): string {
  return `DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = '${name}'
       AND conrelid = 'audio_tts.${table}'::regclass
  ) THEN
    ALTER TABLE audio_tts.${table} ADD CONSTRAINT ${name} ${definition};
  END IF;
END
$$`;
}

/**
 * Invariantes de `audio_tts` que MikroORM no deriva de una entidad escalar.
 *
 * Las cuatro primeras son de dominio, no de higiene:
 *   - los estados y las estrategias son un conjunto cerrado; un valor fuera de él
 *     dejaría un asset que ninguna consulta reclama ni descarta;
 *   - un asset `READY` sin `storage_uri` es la contradicción exacta que rompe al
 *     cliente: el resolutor lo anunciaría como disponible y no habría nada que
 *     reproducir;
 *   - los contadores no pueden ser negativos, y esa es la red que convierte un
 *     error de compensación de presupuesto en una transacción abortada en vez de
 *     en una contabilidad silenciosamente falsa.
 *
 * El trigger de `updated_at` existe porque el ciclo de vida se escribe con SQL
 * directo (claim, barrido, marcado de fallo): dejarlo en manos de la aplicación
 * significaría que el reconciliador, que decide por antigüedad, se apoyara en una
 * columna que cualquier UPDATE fuera del ORM deja obsoleta.
 */
export const localPhysicalCatalog: readonly PhysicalStatementSpec[] = [
  {
    id: 'constraint:audio_tts.audio_assets.status',
    description:
      'Acota el ciclo de vida de un asset de audio a sus cinco estados',
    sql: addConstraint(
      'audio_assets',
      'ck_audio_assets_status',
      "CHECK (status IN ('PENDING','GENERATING','READY','FAILED_RETRYABLE','FAILED_PERMANENT'))",
    ),
  },
  {
    id: 'constraint:audio_tts.audio_assets.ready_has_uri',
    description: 'Un asset READY tiene siempre dónde leerse',
    sql: addConstraint(
      'audio_assets',
      'ck_audio_assets_ready_has_uri',
      "CHECK (status <> 'READY' OR storage_uri IS NOT NULL)",
    ),
  },
  {
    id: 'constraint:audio_tts.audio_assets.counters',
    description: 'Intentos, reserva y tamaño no pueden ser negativos',
    sql: addConstraint(
      'audio_assets',
      'ck_audio_assets_counters',
      'CHECK (attempts >= 0 AND reserved_units >= 0 AND (bytes IS NULL OR bytes >= 0))',
    ),
  },
  {
    id: 'constraint:audio_tts.audio_assets.checksum',
    description:
      'El checksum, si existe, es un SHA-256 hexadecimal de 64 caracteres',
    sql: addConstraint(
      'audio_assets',
      'ck_audio_assets_checksum',
      'CHECK (checksum_sha256 IS NULL OR char_length(checksum_sha256) = 64)',
    ),
  },
  {
    id: 'constraint:audio_tts.audio_templates.strategy',
    description: 'La estrategia de una plantilla es STATIC, DYNAMIC o FALLBACK',
    sql: addConstraint(
      'audio_templates',
      'ck_audio_templates_strategy',
      "CHECK (strategy IN ('STATIC','DYNAMIC','FALLBACK') AND version > 0)",
    ),
  },
  {
    id: 'constraint:audio_tts.audio_generation_usage.units',
    description: 'El consumo imputado no puede ser negativo',
    sql: addConstraint(
      'audio_generation_usage',
      'ck_audio_generation_usage_units',
      'CHECK (usage_units >= 0)',
    ),
  },
  {
    id: 'constraint:audio_tts.audio_budget_month.counters',
    description: 'Reservado y liquidado no pueden ser negativos',
    sql: addConstraint(
      'audio_budget_month',
      'ck_audio_budget_month_counters',
      'CHECK (reserved_units >= 0 AND settled_units >= 0)',
    ),
  },
  {
    id: 'constraint:audio_tts.audio_actor_generation_daily.count',
    description: 'El contador diario por actor no puede ser negativo',
    sql: addConstraint(
      'audio_actor_generation_daily',
      'ck_audio_actor_generation_daily_count',
      'CHECK (generation_count >= 0)',
    ),
  },
  {
    id: 'function:audio_tts.touch_updated_at',
    description: 'Función del trigger que mantiene updated_at en audio_tts',
    sql: `CREATE OR REPLACE FUNCTION audio_tts.touch_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql`,
  },
  {
    id: 'trigger:audio_tts.audio_assets.touch_updated_at',
    description:
      'updated_at de audio_assets gestionado en base, no en la aplicación',
    sql: `CREATE OR REPLACE TRIGGER audio_assets_touch_updated_at
  BEFORE UPDATE ON audio_tts.audio_assets
  FOR EACH ROW EXECUTE FUNCTION audio_tts.touch_updated_at()`,
  },
  {
    id: 'trigger:audio_tts.audio_templates.touch_updated_at',
    description: 'updated_at de audio_templates gestionado en base',
    sql: `CREATE OR REPLACE TRIGGER audio_templates_touch_updated_at
  BEFORE UPDATE ON audio_tts.audio_templates
  FOR EACH ROW EXECUTE FUNCTION audio_tts.touch_updated_at()`,
  },
];
