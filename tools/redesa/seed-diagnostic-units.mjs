#!/usr/bin/env node
/**
 * Seed demo idempotente del directorio de laboratorios (módulo 23).
 *
 * Solo escribe en `diagnostic_units`. La práctica y sus sedes se reutilizan
 * mediante SELECT; si no existen, el script se detiene en vez de crear datos en
 * otro dominio. `DIAGNOSTIC_UNITS_SEED_TENANT_ID` permite fijar el tenant; sin
 * ella se usa el tenant de la práctica con sedes actualizada más recientemente.
 */
import { createHash } from 'node:crypto';
import 'dotenv/config';
import pg from 'pg';

const db = new pg.Client({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5434),
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'mantra_redesa_health',
});

const requestedTenant = process.env.DIAGNOSTIC_UNITS_SEED_TENANT_ID ?? null;

/**
 * Alias del script → código real del catálogo.
 *
 * El script nombraba los conceptos con alias cortos (`DU_TYPE_LAB`) que el seed
 * de terminología nunca materializó: los suyos van prefijados por módulo
 * (`diagnostic_units:UNIT_TYPE_LABORATORY`). Por eso este seeder abortaba con
 * «faltan conceptos» y el directorio de laboratorios seguía vacío (F-15,
 * 18/08/2026) — no faltaba el seed de terminología, faltaba la traducción.
 *
 * Se mantiene el alias como clave para no tocar las treinta llamadas a
 * `concept(...)` que hay más abajo: lo que cambia es contra qué se resuelve.
 */
const CONCEPTOS = {
  DU_TYPE_LAB: 'diagnostic_units:UNIT_TYPE_LABORATORY',
  DU_TYPE_IMAGING: 'diagnostic_units:UNIT_TYPE_IMAGING',
  DU_OWN_PRIVATE: 'diagnostic_units:OWNERSHIP_PRIVATE',
  DU_VERIF_VERIFIED: 'diagnostic_units:VERIFICATION_VERIFIED',
  DU_UNIT_ACTIVE: 'diagnostic_units:UNIT_ACTIVE',
  DU_SITE_PRIMARY: 'diagnostic_units:SITE_ROLE_PRIMARY',
  DU_SITE_COLLECTION: 'diagnostic_units:SITE_ROLE_COLLECTION',
  DU_SITE_ACTIVE: 'diagnostic_units:SITE_ACTIVE',
  DU_STUDY_CBC: 'diagnostic_units:STUDY_COMPLETE_BLOOD_COUNT',
  DU_STUDY_GLUCOSE: 'diagnostic_units:STUDY_GLUCOSE',
  DU_STUDY_PCR: 'diagnostic_units:STUDY_PCR',
  DU_STUDY_CHEST_XRAY: 'diagnostic_units:STUDY_CHEST_XRAY',
  DU_STUDY_ABDOMINAL_ULTRASOUND: 'diagnostic_units:STUDY_ABDOMINAL_ULTRASOUND',
  DU_MODALITY_LAB: 'diagnostic_units:MODALITY_LABORATORY',
  DU_MODALITY_XRAY: 'diagnostic_units:MODALITY_XRAY',
  DU_MODALITY_ULTRASOUND: 'diagnostic_units:MODALITY_ULTRASOUND',
  DU_OFFER_ACTIVE: 'diagnostic_units:OFFERING_ACTIVE',
  DU_PS_STANDARD: 'diagnostic_units:PRICE_SCHEDULE_STANDARD',
  DU_CUR_BOB: 'diagnostic_units:CURRENCY_BOB',
  DU_SCHED_ACTIVE: 'diagnostic_units:SCHEDULE_ACTIVE',
  DU_PRICE_ACTIVE: 'diagnostic_units:PRICE_ACTIVE',
  DU_ACC_ISO15189: 'diagnostic_units:ACCREDITATION_ISO15189',
  DU_EQ_ANALYZER: 'diagnostic_units:EQUIPMENT_TYPE_ANALYZER',
  DU_EQ_XRAY: 'diagnostic_units:EQUIPMENT_TYPE_XRAY',
  DU_EQ_ULTRASOUND: 'diagnostic_units:EQUIPMENT_TYPE_ULTRASOUND',
  DU_EQ_OPERATIONAL: 'diagnostic_units:EQUIPMENT_OPERATIONAL',
};

const REQUIRED_CONCEPT_CODES = Object.keys(CONCEPTOS);

function stableId(tenantId, key) {
  const hex = createHash('md5')
    .update(`mantra:diagnostic-units-demo:${tenantId}:${key}`)
    .digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function resolveContext() {
  const { rows } = await db.query(
    `WITH selected_practice AS (
       SELECT p.id, p.tenant_id
         FROM practice.practices p
        WHERE ($1::uuid IS NULL OR p.tenant_id = $1::uuid)
          AND EXISTS (
            SELECT 1 FROM practice.practice_sites ps WHERE ps.practice_id = p.id
          )
        ORDER BY p.updated_at DESC
        LIMIT 1
     )
     SELECT p.id AS practice_id,
            p.tenant_id,
            ps.id AS practice_site_id,
            ps.code AS practice_site_code,
            ps.name AS practice_site_name
       FROM selected_practice p
       JOIN practice.practice_sites ps ON ps.practice_id = p.id
      ORDER BY ps.created_at ASC`,
    [requestedTenant],
  );
  if (rows.length === 0) {
    throw new Error(
      'No existe una práctica con sedes para el tenant solicitado. Ejecute primero el seed de desarrollo o indique otro tenant.',
    );
  }
  return {
    tenantId: rows[0].tenant_id,
    practiceId: rows[0].practice_id,
    sites: rows,
  };
}

async function loadConcepts() {
  const { rows } = await db.query(
    `SELECT id, code
       FROM terminology.catalog_concepts
      WHERE code = ANY($1::varchar[])`,
    [Object.values(CONCEPTOS)],
  );
  // Indexado por el alias del script, no por el código del catálogo.
  const porCodigo = new Map(rows.map((row) => [row.code, row.id]));
  const concepts = new Map(
    REQUIRED_CONCEPT_CODES.filter((alias) => porCodigo.has(CONCEPTOS[alias])).map(
      (alias) => [alias, porCodigo.get(CONCEPTOS[alias])],
    ),
  );
  const missing = REQUIRED_CONCEPT_CODES.filter((code) => !concepts.has(code));
  if (missing.length > 0) {
    throw new Error(
      `Faltan conceptos de diagnostic_units: ${missing.join(', ')}. Arranque la API para materializar el seed de terminología.`,
    );
  }
  return concepts;
}

function concept(concepts, code) {
  const id = concepts.get(code);
  if (!id) throw new Error(`Concepto no resuelto: ${code}`);
  return id;
}

async function ensureUnit(context, concepts, definition) {
  const proposedId = stableId(context.tenantId, `unit:${definition.code}`);
  await db.query(
    `INSERT INTO diagnostic_units.diagnostic_units (
       id, tenant_id, practice_id, primary_practice_site_id, code, name,
       diagnostic_unit_type_concept_id, ownership_type_concept_id,
       accepts_external_orders, walk_in_available, home_collection_available,
       verification_status_concept_id, status_concept_id, created_at, updated_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,now(),now())
     ON CONFLICT (tenant_id, code) DO NOTHING`,
    [
      proposedId,
      context.tenantId,
      context.practiceId,
      definition.practiceSiteId,
      definition.code,
      definition.name,
      concept(concepts, definition.type),
      concept(concepts, 'DU_OWN_PRIVATE'),
      definition.acceptsExternalOrders,
      definition.walkInAvailable,
      definition.homeCollectionAvailable,
      concept(concepts, 'DU_VERIF_VERIFIED'),
      concept(concepts, 'DU_UNIT_ACTIVE'),
    ],
  );
  const { rows } = await db.query(
    `SELECT id FROM diagnostic_units.diagnostic_units
      WHERE tenant_id = $1 AND code = $2`,
    [context.tenantId, definition.code],
  );
  return rows[0].id;
}

async function ensureSite(context, concepts, unitId, definition) {
  const id = stableId(context.tenantId, `site:${definition.key}`);
  await db.query(
    `INSERT INTO diagnostic_units.diagnostic_unit_sites (
       id, diagnostic_unit_id, practice_site_id, site_role_concept_id,
       accession_prefix, sample_collection_available, imaging_available,
       status_concept_id, created_at, updated_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,now(),now())
     ON CONFLICT (id) DO NOTHING`,
    [
      id,
      unitId,
      definition.practiceSiteId,
      concept(concepts, definition.role),
      definition.prefix,
      definition.sampleCollection,
      definition.imaging,
      concept(concepts, 'DU_SITE_ACTIVE'),
    ],
  );
  return id;
}

async function ensureOffering(context, concepts, unitId, siteId, definition) {
  const id = stableId(context.tenantId, `offering:${definition.key}`);
  await db.query(
    `INSERT INTO diagnostic_units.diagnostic_study_offerings (
       id, diagnostic_unit_id, diagnostic_unit_site_id, study_code,
       study_concept_id, modality_concept_id, display_name, description,
       preparation_instructions, expected_duration_minutes,
       expected_turnaround_minutes, requires_medical_order,
       home_collection_eligible, status_concept_id, created_at, updated_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,now(),now())
     ON CONFLICT (id) DO NOTHING`,
    [
      id,
      unitId,
      siteId,
      definition.code,
      concept(concepts, definition.study),
      concept(concepts, definition.modality),
      definition.name,
      definition.description,
      definition.preparation,
      definition.duration,
      definition.turnaround,
      definition.requiresOrder,
      definition.homeCollection,
      concept(concepts, 'DU_OFFER_ACTIVE'),
    ],
  );
  return id;
}

async function ensureSchedule(context, concepts, unitId, siteId, key) {
  const id = stableId(context.tenantId, `schedule:${key}`);
  await db.query(
    `INSERT INTO diagnostic_units.diagnostic_price_schedules (
       id, diagnostic_unit_id, diagnostic_unit_site_id, code,
       price_schedule_type_concept_id, currency_concept_id, valid_from,
       public_visibility, status_concept_id, created_at, updated_at
     ) VALUES ($1,$2,$3,$4,$5,$6,now(),true,$7,now(),now())
     ON CONFLICT (id) DO NOTHING`,
    [
      id,
      unitId,
      siteId,
      `PUBLIC-${key}`,
      concept(concepts, 'DU_PS_STANDARD'),
      concept(concepts, 'DU_CUR_BOB'),
      concept(concepts, 'DU_SCHED_ACTIVE'),
    ],
  );
  return id;
}

async function ensurePrice(
  context,
  concepts,
  scheduleId,
  offeringId,
  key,
  version,
  amount,
) {
  const id = stableId(context.tenantId, `price:${key}`);
  await db.query(
    `INSERT INTO diagnostic_units.diagnostic_study_prices (
       id, price_schedule_id, diagnostic_study_offering_id, version_number,
       base_amount, patient_amount, effective_from, status_concept_id, recorded_at
     ) VALUES ($1,$2,$3,$4,$5,$5,now(),$6,now())
     ON CONFLICT (id) DO NOTHING`,
    [
      id,
      scheduleId,
      offeringId,
      version,
      amount,
      concept(concepts, 'DU_PRICE_ACTIVE'),
    ],
  );
}

async function ensureEquipment(context, concepts, siteId, definition) {
  const id = stableId(context.tenantId, `equipment:${definition.key}`);
  await db.query(
    `INSERT INTO diagnostic_units.diagnostic_equipment (
       id, diagnostic_unit_site_id, equipment_type_concept_id, manufacturer,
       model, serial_number, modality_concept_id, last_calibration_at,
       next_calibration_due_at, operational_status_concept_id, created_at, updated_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,now() - interval '30 days',
               now() + interval '335 days',$8,now(),now())
     ON CONFLICT (id) DO NOTHING`,
    [
      id,
      siteId,
      concept(concepts, definition.type),
      definition.manufacturer,
      definition.model,
      `DEMO-${definition.key}`,
      concept(concepts, definition.modality),
      concept(concepts, 'DU_EQ_OPERATIONAL'),
    ],
  );
}

async function ensureAccreditation(context, concepts, unitId, siteId) {
  const id = stableId(context.tenantId, 'accreditation:iso15189');
  await db.query(
    `INSERT INTO diagnostic_units.diagnostic_unit_accreditations (
       id, diagnostic_unit_id, diagnostic_unit_site_id,
       accreditation_concept_id, accreditation_number, valid_from, valid_to,
       verification_status_concept_id, created_at, updated_at
     ) VALUES ($1,$2,$3,$4,'ISO-DEMO-15189',current_date - 365,
               current_date + 730,$5,now(),now())
     ON CONFLICT (id) DO NOTHING`,
    [
      id,
      unitId,
      siteId,
      concept(concepts, 'DU_ACC_ISO15189'),
      concept(concepts, 'DU_VERIF_VERIFIED'),
    ],
  );
}

async function main() {
  await db.connect();
  try {
    await db.query('BEGIN');
    const context = await resolveContext();
    const concepts = await loadConcepts();
    const primary = context.sites[0].practice_site_id;
    const secondary = context.sites[1]?.practice_site_id ?? primary;

    const definitions = [
      {
        code: 'LAB-CENTRAL',
        name: 'Laboratorio Central Mantra',
        type: 'DU_TYPE_LAB',
        practiceSiteId: primary,
        acceptsExternalOrders: true,
        walkInAvailable: true,
        homeCollectionAvailable: true,
        role: 'DU_SITE_PRIMARY',
        sampleCollection: true,
        imaging: false,
        prefix: 'LCM',
        offerings: [
          {
            key: 'lab-central-cbc',
            code: 'HEM-COMP',
            study: 'DU_STUDY_CBC',
            modality: 'DU_MODALITY_LAB',
            name: 'Hemograma completo',
            description: 'Conteo automatizado de células sanguíneas.',
            preparation: 'No requiere ayuno.',
            duration: 15,
            turnaround: 240,
            requiresOrder: false,
            homeCollection: true,
            amount: '85.00',
          },
          {
            key: 'lab-central-glucose',
            code: 'GLUC',
            study: 'DU_STUDY_GLUCOSE',
            modality: 'DU_MODALITY_LAB',
            name: 'Glucosa en sangre',
            description: 'Determinación cuantitativa de glucosa.',
            preparation: 'Ayuno de 8 horas.',
            duration: 10,
            turnaround: 180,
            requiresOrder: false,
            homeCollection: true,
            amount: '35.00',
          },
        ],
        equipment: [
          {
            key: 'lab-central-analyzer',
            type: 'DU_EQ_ANALYZER',
            modality: 'DU_MODALITY_LAB',
            manufacturer: 'DemoLab',
            model: 'Analyzer 500',
          },
        ],
      },
      {
        code: 'LAB-NORTE',
        name: 'Laboratorio Norte Mantra',
        type: 'DU_TYPE_LAB',
        practiceSiteId: secondary,
        acceptsExternalOrders: true,
        walkInAvailable: true,
        homeCollectionAvailable: false,
        role: 'DU_SITE_COLLECTION',
        sampleCollection: true,
        imaging: false,
        prefix: 'LNM',
        offerings: [
          {
            key: 'lab-north-pcr',
            code: 'PCR',
            study: 'DU_STUDY_PCR',
            modality: 'DU_MODALITY_LAB',
            name: 'Proteína C reactiva',
            description: 'Marcador de respuesta inflamatoria.',
            preparation: 'No requiere preparación especial.',
            duration: 10,
            turnaround: 360,
            requiresOrder: true,
            homeCollection: false,
            amount: '70.00',
          },
        ],
        equipment: [
          {
            key: 'lab-north-analyzer',
            type: 'DU_EQ_ANALYZER',
            modality: 'DU_MODALITY_LAB',
            manufacturer: 'DemoLab',
            model: 'Analyzer Compact',
          },
        ],
      },
      {
        // Tres unidades más para que el directorio se vea como un directorio y
        // no como una lista de ejemplo (F-15): con nombres bolivianos, y con
        // los mismos estudios del catálogo — no se inventan conceptos nuevos.
        code: 'LAB-SUR',
        name: 'Laboratorio Clínico Zona Sur',
        type: 'DU_TYPE_LAB',
        practiceSiteId: secondary,
        acceptsExternalOrders: true,
        walkInAvailable: true,
        homeCollectionAvailable: false,
        role: 'DU_SITE_PRIMARY',
        sampleCollection: true,
        imaging: false,
        prefix: 'LCS',
        offerings: [
          {
            key: 'lab-sur-cbc',
            code: 'HEM-COMP',
            study: 'DU_STUDY_CBC',
            modality: 'DU_MODALITY_LAB',
            name: 'Hemograma completo',
            description: 'Conteo automatizado de células sanguíneas.',
            preparation: 'No requiere ayuno.',
            duration: 15,
            turnaround: 300,
            requiresOrder: false,
            homeCollection: false,
            amount: '75.00',
          },
        ],
        equipment: [
          {
            key: 'lab-sur-analyzer',
            type: 'DU_EQ_ANALYZER',
            modality: 'DU_MODALITY_LAB',
            manufacturer: 'DemoLab',
            model: 'Analyzer 300',
          },
        ],
      },
      {
        code: 'LAB-MIRAFLORES',
        name: 'Laboratorio Miraflores',
        type: 'DU_TYPE_LAB',
        practiceSiteId: primary,
        acceptsExternalOrders: false,
        walkInAvailable: true,
        homeCollectionAvailable: true,
        role: 'DU_SITE_COLLECTION',
        sampleCollection: true,
        imaging: false,
        prefix: 'LMF',
        offerings: [
          {
            key: 'lab-miraflores-glucose',
            code: 'GLUC',
            study: 'DU_STUDY_GLUCOSE',
            modality: 'DU_MODALITY_LAB',
            name: 'Glucosa en sangre',
            description: 'Determinación cuantitativa de glucosa.',
            preparation: 'Ayuno de 8 horas.',
            duration: 10,
            turnaround: 120,
            requiresOrder: false,
            homeCollection: true,
            amount: '30.00',
          },
          {
            key: 'lab-miraflores-pcr',
            code: 'PCR',
            study: 'DU_STUDY_PCR',
            modality: 'DU_MODALITY_LAB',
            name: 'Proteína C reactiva',
            description: 'Marcador de inflamación aguda.',
            preparation: 'No requiere ayuno.',
            duration: 10,
            turnaround: 360,
            requiresOrder: false,
            homeCollection: true,
            amount: '95.00',
          },
        ],
        equipment: [
          {
            key: 'lab-miraflores-analyzer',
            type: 'DU_EQ_ANALYZER',
            modality: 'DU_MODALITY_LAB',
            manufacturer: 'DemoLab',
            model: 'Analyzer 200',
          },
        ],
      },
      {
        code: 'IMG-SOPOCACHI',
        name: 'Centro de Imagenología Sopocachi',
        type: 'DU_TYPE_IMAGING',
        practiceSiteId: secondary,
        acceptsExternalOrders: true,
        walkInAvailable: false,
        homeCollectionAvailable: false,
        role: 'DU_SITE_PRIMARY',
        sampleCollection: false,
        imaging: true,
        prefix: 'CIS',
        offerings: [
          {
            key: 'imaging-sopocachi-ultrasound',
            code: 'ECO-ABD',
            study: 'DU_STUDY_ABDOMINAL_ULTRASOUND',
            modality: 'DU_MODALITY_ULTRASOUND',
            name: 'Ecografía abdominal',
            description: 'Evaluación ecográfica de órganos abdominales.',
            preparation: 'Ayuno de 6 horas.',
            duration: 30,
            turnaround: 180,
            requiresOrder: true,
            homeCollection: false,
            amount: '190.00',
          },
        ],
        equipment: [
          {
            key: 'imaging-sopocachi-ultrasound',
            type: 'DU_EQ_ULTRASOUND',
            modality: 'DU_MODALITY_ULTRASOUND',
            manufacturer: 'Demo Imaging',
            model: 'US-2',
          },
        ],
      },
      {
        code: 'IMG-CENTRAL',
        name: 'Imagen Diagnóstica Mantra',
        type: 'DU_TYPE_IMAGING',
        practiceSiteId: primary,
        acceptsExternalOrders: true,
        walkInAvailable: false,
        homeCollectionAvailable: false,
        role: 'DU_SITE_PRIMARY',
        sampleCollection: false,
        imaging: true,
        prefix: 'IDM',
        offerings: [
          {
            key: 'imaging-xray',
            code: 'RX-TORAX',
            study: 'DU_STUDY_CHEST_XRAY',
            modality: 'DU_MODALITY_XRAY',
            name: 'Radiografía de tórax',
            description: 'Radiografía digital de tórax en dos proyecciones.',
            preparation: 'Retirar objetos metálicos.',
            duration: 20,
            turnaround: 1440,
            requiresOrder: true,
            homeCollection: false,
            amount: '160.00',
          },
          {
            key: 'imaging-ultrasound',
            code: 'ECO-ABD',
            study: 'DU_STUDY_ABDOMINAL_ULTRASOUND',
            modality: 'DU_MODALITY_ULTRASOUND',
            name: 'Ecografía abdominal',
            description: 'Evaluación ecográfica de órganos abdominales.',
            preparation: 'Ayuno de 6 horas.',
            duration: 30,
            turnaround: 120,
            requiresOrder: true,
            homeCollection: false,
            amount: '220.00',
          },
        ],
        equipment: [
          {
            key: 'imaging-xray',
            type: 'DU_EQ_XRAY',
            modality: 'DU_MODALITY_XRAY',
            manufacturer: 'Demo Imaging',
            model: 'DR-X1',
          },
          {
            key: 'imaging-ultrasound',
            type: 'DU_EQ_ULTRASOUND',
            modality: 'DU_MODALITY_ULTRASOUND',
            manufacturer: 'Demo Imaging',
            model: 'US-Color',
          },
        ],
      },
    ];

    for (const definition of definitions) {
      const unitId = await ensureUnit(context, concepts, definition);
      const siteId = await ensureSite(context, concepts, unitId, {
        ...definition,
        key: definition.code,
      });
      const scheduleId = await ensureSchedule(
        context,
        concepts,
        unitId,
        siteId,
        definition.code,
      );
      for (const [index, offering] of definition.offerings.entries()) {
        const offeringId = await ensureOffering(
          context,
          concepts,
          unitId,
          siteId,
          offering,
        );
        await ensurePrice(
          context,
          concepts,
          scheduleId,
          offeringId,
          offering.key,
          index + 1,
          offering.amount,
        );
      }
      for (const equipment of definition.equipment) {
        await ensureEquipment(context, concepts, siteId, equipment);
      }
      if (definition.code === 'LAB-CENTRAL') {
        await ensureAccreditation(context, concepts, unitId, siteId);
      }
    }

    await db.query('COMMIT');
    console.log(
      `✓ diagnostic_units demo: ${definitions.length} unidades idempotentes para tenant ${context.tenantId}`,
    );
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  } finally {
    await db.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
