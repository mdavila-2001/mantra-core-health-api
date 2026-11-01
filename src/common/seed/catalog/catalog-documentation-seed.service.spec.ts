import type {
  CatalogacionInventory,
  InvColumn,
  InvOperation,
  InvTable,
} from '../../../modules/data_catalog/application/catalogacion/catalogacion-inventory';
import { readCatalogacionInventory } from '../../../modules/data_catalog/application/catalogacion/catalogacion-inventory';
import type { VaultDataset } from '../../../modules/data_catalog/application/catalogacion/quality-context';
import { SEED_ACTOR_ID } from '../seed-actor';
import vaultJson from './data/vault-table-notes.json';
import { runCatalogSeed } from './catalog-documentation-seed.service';
import { InMemoryCatalogSeedStore } from './catalog-seed.store';
import {
  ANNOTATIONS,
  ANNOTATION_REVISIONS,
  GLOSSARY_TERMS,
  type ObjectIndex,
} from './catalog-seed.types';

/**
 * DOBLE DECLARADO: `InMemoryCatalogSeedStore` NO es Postgres. Prueba el plan, el orden, las reglas
 * («nunca aprobado», «no se copia plantilla») y la idempotencia del servicio; no prueba el SQL de
 * `PgCatalogSeedStore`, los tipos de columna ni los índices únicos reales.
 */

const NOW = new Date('2026-10-31T12:00:00.000Z');

const col = (
  name: string,
  nativeType: string,
  desc: { text: string; kind: string } | null = null,
  extra: Partial<InvColumn> = {},
): InvColumn => ({
  name,
  ordinal: 1,
  nativeType,
  nullable: false,
  primaryKey: false,
  unique: false,
  defaultExpr: null,
  foreignKeys: [],
  description: {
    text: desc?.text ?? null,
    kind: desc?.kind ?? null,
    reference: desc ? 'src/x.ts:1' : null,
  },
  ...extra,
});

const table = (
  schema: string,
  name: string,
  purpose: string | null,
  columns: InvColumn[],
): InvTable => ({
  id: `${schema}.${name}`,
  schema,
  name,
  domain: {
    name: 'Identidad y Seguridad',
    number: 7,
    reference: 'semantic-data-analysis.md:27',
  },
  purpose: {
    text: purpose,
    state: purpose ? 'DOMAIN_CURATED_DRAFT' : 'PENDING_REVIEW',
    reference: purpose ? 'diagram.puml' : null,
  },
  ormEntity: null,
  appendOnly: { declared: false, reference: null },
  columns,
  outgoingRelations: 0,
  incomingRelations: 0,
  indexes: { total: 1, unique: 1 },
  operations: [],
});

const op = (
  id: string,
  method: string,
  tables: InvOperation['tables'],
): InvOperation => ({
  id,
  origin: 'CONTRATO',
  method,
  path: `/x/${id}`,
  module: 'consent',
  businessExplanation: { state: 'AUTO_DETECTADA', text: 'Hace algo.' },
  systemExplanation: { state: 'AUTO_DETECTADA', text: 'Lo atiende X.' },
  reviewState: 'AUTO_DETECTADA',
  requestDto: null,
  responseDto: null,
  requestFields: [],
  responseFields: [],
  tables,
  hasNoTables: false,
  isMutation: method !== 'GET',
  flowCodes: [],
});

function fixture(): { inventory: CatalogacionInventory; vault: VaultDataset } {
  const histories = ['a', 'b', 'c'].map((n) =>
    table(
      'audit',
      `${n}_history`,
      `Preserva versiones o estados históricos de ${n} para auditar.`,
      [
        col(
          'id',
          'uuid',
          {
            text: 'Identificador único de la instancia.',
            kind: 'JSDOC_ESTANDAR',
          },
          { primaryKey: true },
        ),
      ],
    ),
  );
  const events = table(
    'consent',
    'consent_events',
    'Mantiene la secuencia de eventos de consentimiento para reconstruir otorgamientos.',
    [
      col(
        'id',
        'uuid',
        {
          text: 'Identificador único de la instancia.',
          kind: 'JSDOC_ESTANDAR',
        },
        { primaryKey: true },
      ),
      col('created_at', 'timestamptz'),
      col('subject_type_concept_id', 'uuid'),
      col('patient_phone', 'varchar', {
        text: 'Teléfono de contacto del paciente en la visita.',
        kind: 'JSDOC_ENTIDAD',
      }),
    ],
  );
  const sinFicha = table(
    'consent',
    'sin_escaneo',
    'Guarda la cola de revocaciones pendientes de procesar.',
    [col('id', 'uuid')],
  );
  const tables = [...histories, events, sinFicha];
  events.operations = [
    {
      operationId: 'ConsentsController_capture',
      access: 'ESCRIBE',
      detail: 'CREA',
      confidence: 'DIRECTA',
    },
    {
      operationId: 'ConsentsController_list',
      access: 'LEE',
      detail: null,
      confidence: 'DIRECTA',
    },
  ];
  const operations = [
    op('ConsentsController_capture', 'POST', [
      {
        schema: 'consent',
        table: 'consent_events',
        access: 'ESCRIBE',
        detail: 'CREA',
        confidence: 'POR_TIPO',
        source: null,
      },
      {
        schema: 'consent',
        table: 'consent_events',
        access: 'ESCRIBE',
        detail: 'CREA',
        confidence: 'DIRECTA',
        source: null,
      },
      {
        schema: 'consent',
        table: 'fantasma',
        access: 'LEE',
        detail: null,
        confidence: 'DIRECTA',
        source: null,
      },
    ]),
    op('ConsentsController_list', 'GET', [
      {
        schema: 'consent',
        table: 'consent_events',
        access: 'LEE',
        detail: null,
        confidence: 'DIRECTA',
        source: null,
      },
    ]),
  ];
  const glossary = [
    {
      term: 'PHI',
      definition: 'Información de salud protegida.',
      source: 'repo-a:glossary.md:7',
      relatedTables: [],
    },
    {
      term: 'PHI',
      definition: 'Información de salud protegida.',
      source: 'repo-b:glossary.md:2',
      relatedTables: [],
    },
    {
      term: 'Tenant',
      definition: 'Una organización.',
      source: 'repo-a:glossary.md:9',
      relatedTables: [],
    },
    {
      term: 'Tenant',
      definition: 'Una clínica cliente.',
      source: 'repo-b:glossary.md:3',
      relatedTables: [],
    },
  ];
  const vault: VaultDataset = {
    source: { vault: 'SALUD/Entidades', sha256: 'x' },
    tables: {
      'audit.a_history': {
        reference: 'SALUD/Entidades/E audit.a_history.md',
        sha256: 'y',
        business: 'Historial de cambios de la tabla a, con quién y cuándo.',
        existence:
          'Sin esta tabla no se puede reconstruir el estado previo de a ante una auditoría.',
      },
    },
  };
  return {
    inventory: { directory: '(memoria)', tables, operations, glossary },
    vault,
  };
}

function objectsFor(
  inventory: CatalogacionInventory,
  omit: string[] = [],
): ObjectIndex {
  return new Map(
    inventory.tables
      .filter((t) => !omit.includes(t.id))
      .map((t) => [
        t.id,
        {
          id: `obj:${t.id}`,
          columns: new Map(
            t.columns.map((c) => [c.name, `col:${t.id}.${c.name}`]),
          ),
        },
      ]),
  );
}

const sums = (
  r: Awaited<ReturnType<typeof runCatalogSeed>>['result'],
): number =>
  r.domains.inserted +
  r.classifications.inserted +
  r.glossaryTerms.inserted +
  r.glossaryRevisions.inserted +
  r.lineageEdges.inserted +
  r.annotations.inserted +
  r.annotationRevisions.inserted +
  r.evidence.inserted +
  r.objectDomainLinks.inserted;

const snapshot = (store: InMemoryCatalogSeedStore): string =>
  JSON.stringify(
    [...store.tables].map(([k, v]) => [k, [...v.keys()].sort()]).sort(),
  );

describe('siembra de la catalogación (contra el doble en memoria, no Postgres)', () => {
  it('primera corrida siembra; la segunda no inserta ni cambia nada', async () => {
    const { inventory, vault } = fixture();
    const store = new InMemoryCatalogSeedStore().withObjects(
      objectsFor(inventory, ['consent.sin_escaneo']),
    );
    const primera = await runCatalogSeed({ store, inventory, vault, now: NOW });
    expect(sums(primera.result)).toBeGreaterThan(0);
    expect(primera.result.unresolved.tables).toBe(1);
    const antes = snapshot(store);
    const segunda = await runCatalogSeed({
      store,
      inventory,
      vault,
      now: new Date('2027-01-01T00:00:00Z'),
    });
    expect(sums(segunda.result)).toBe(0);
    expect(snapshot(store)).toBe(antes);
  });

  it('nada queda aprobado y todo lo escribe el actor semilla', async () => {
    const { inventory, vault } = fixture();
    const store = new InMemoryCatalogSeedStore().withObjects(
      objectsFor(inventory),
    );
    await runCatalogSeed({ store, inventory, vault, now: NOW });
    const fichas = store.rows(ANNOTATIONS.table);
    expect(fichas.length).toBeGreaterThan(0);
    for (const f of fichas) {
      expect(['DRAFT', 'AUTO_DETECTED', 'NEEDS_REVIEW']).toContain(
        f.review_status,
      );
      expect(f.approved_revision_no).toBeNull();
      expect(f.created_by_user_id).toBe(SEED_ACTOR_ID);
    }
    for (const t of store.rows(GLOSSARY_TERMS.table)) {
      expect(t.status).toBe('DRAFT');
      expect(t.approved_by_user_id).toBeNull();
    }
    for (const e of store.rows('data_catalog.catalog_lineage_edges'))
      expect(e.is_official).toBe(false);
    for (const r of store.rows(ANNOTATION_REVISIONS.table))
      expect(r.author_user_id).toBe(SEED_ACTOR_ID);
  });

  it('no copia una plantilla como descripción: queda null con pregunta abierta; la bóveda propia sí entra', async () => {
    const { inventory, vault } = fixture();
    const store = new InMemoryCatalogSeedStore().withObjects(
      objectsFor(inventory),
    );
    await runCatalogSeed({ store, inventory, vault, now: NOW });
    const fichas = store.rows(ANNOTATIONS.table);
    const deObjeto = (id: string) =>
      fichas.find(
        (f) => f.object_id === `obj:${id}` && f.target_kind === 'OBJECT',
      )!;
    const b = deObjeto('audit.b_history');
    expect(b.purpose).toBeNull();
    expect(b.review_status).toBe('AUTO_DETECTED');
    expect(
      (b.open_questions as { field: string }[]).map((q) => q.field),
    ).toEqual(
      expect.arrayContaining(['purpose', 'existenceRationale', 'rowGrain']),
    );
    const a = deObjeto('audit.a_history');
    // el comentario del modelo es plantilla: el propósito sale de la nota propia de la bóveda
    expect(a.purpose).toBe(
      'Historial de cambios de la tabla a, con quién y cuándo.',
    );
    expect(a.definition).toBeNull();
    expect(a.existence_rationale).toMatch(/reconstruir el estado previo/);
    expect(a.review_status).toBe('DRAFT');
    const eventos = deObjeto('consent.consent_events');
    expect(eventos.purpose).toMatch(/secuencia de eventos de consentimiento/);
    expect(eventos.producers).toEqual(['consent']);
    expect(eventos.consumers).toEqual(['consent']);
  });

  it('columnas: regla determinista sin curar, clasificador con su propuesta, sin relleno para el resto', async () => {
    const { inventory, vault } = fixture();
    const store = new InMemoryCatalogSeedStore().withObjects(
      objectsFor(inventory),
    );
    await runCatalogSeed({ store, inventory, vault, now: NOW });
    const delObjeto = store
      .rows(ANNOTATIONS.table)
      .filter(
        (f) =>
          f.object_id === 'obj:consent.consent_events' &&
          f.target_kind === 'COLUMN',
      );
    const porCol = new Map(delObjeto.map((f) => [String(f.column_id), f]));
    const createdAt = porCol.get('col:consent.consent_events.created_at')!;
    expect(createdAt.definition).toBe(
      'Fecha y hora en que se creó el registro.',
    );
    expect(createdAt.review_status).toBe('AUTO_DETECTED');
    expect(createdAt.origin).toBe('AUTO_CLASSIFIER');
    const telefono = porCol.get('col:consent.consent_events.patient_phone')!;
    expect(telefono.definition).toBe(
      'Teléfono de contacto del paciente en la visita.',
    );
    expect(telefono.review_status).toBe('DRAFT');
    expect(telefono.sensitivity).toBe('PHI_IDENTIFIER');
    expect(
      porCol.has('col:consent.consent_events.subject_type_concept_id'),
    ).toBe(false);
  });

  it('respeta lo que ya existe: una ficha de una persona (otro id) no se duplica ni se pisa', async () => {
    const { inventory, vault } = fixture();
    const store = new InMemoryCatalogSeedStore().withObjects(
      objectsFor(inventory),
    );
    await store.insertMissing(ANNOTATIONS, [
      {
        id: 'humana-1',
        target_kind: 'OBJECT',
        object_id: 'obj:consent.consent_events',
        column_id: null,
        purpose: 'Escrito por una persona.',
        review_status: 'APPROVED',
        origin: 'MANUAL',
      },
    ]);
    const r = await runCatalogSeed({ store, inventory, vault, now: NOW });
    const delObjeto = store
      .rows(ANNOTATIONS.table)
      .filter(
        (f) =>
          f.object_id === 'obj:consent.consent_events' &&
          f.target_kind === 'OBJECT',
      );
    expect(delObjeto).toHaveLength(1);
    expect(delObjeto[0].purpose).toBe('Escrito por una persona.');
    const revs = store
      .rows(ANNOTATION_REVISIONS.table)
      .filter((x) => String(x.annotation_id).length > 0);
    expect(revs.every((x) => x.annotation_id !== 'humana-1')).toBe(true);
    expect(r.result.annotations.inserted).toBeGreaterThan(0);
  });

  it('sin escaneo no hay fichas (se informa), pero sí el resto; con el escaneo, la siguiente corrida las siembra', async () => {
    const { inventory, vault } = fixture();
    const store = new InMemoryCatalogSeedStore();
    const primera = await runCatalogSeed({ store, inventory, vault, now: NOW });
    expect(primera.result.annotations).toMatchObject({
      inserted: 0,
      skipped: 'NO_OBSERVED_OBJECTS',
    });
    expect(primera.result.glossaryTerms.inserted).toBeGreaterThan(0);
    store.withObjects(objectsFor(inventory));
    const segunda = await runCatalogSeed({ store, inventory, vault, now: NOW });
    expect(segunda.result.annotations.inserted).toBeGreaterThan(0);
    expect(segunda.result.glossaryTerms.inserted).toBe(0);
    expect(segunda.result.objectDomainLinks.inserted).toBeGreaterThan(0);
    expect(store.domainOf('obj:consent.consent_events')).toBeDefined();
  });

  it('una tabla destino que no existe se omite y se informa; los demás pasos corren', async () => {
    const { inventory, vault } = fixture();
    const store = new InMemoryCatalogSeedStore()
      .withObjects(objectsFor(inventory))
      .withoutTable('data_catalog.catalog_glossary_terms');
    const r = await runCatalogSeed({ store, inventory, vault, now: NOW });
    expect(r.result.glossaryTerms).toMatchObject({
      inserted: 0,
      skipped: 'TABLE_MISSING',
    });
    expect(r.result.glossaryRevisions.inserted).toBe(0);
    expect(r.result.domains.inserted).toBeGreaterThan(0);
  });

  it('linaje: una arista por operación/tabla/acceso con la mejor confianza; tablas fuera del catálogo se cuentan, no se siembran', async () => {
    const { inventory, vault } = fixture();
    const store = new InMemoryCatalogSeedStore();
    const r = await runCatalogSeed({ store, inventory, vault, now: NOW });
    const aristas = store.rows('data_catalog.catalog_lineage_edges');
    expect(aristas).toHaveLength(2);
    expect(aristas.find((a) => a.edge_kind === 'ESCRIBE')).toMatchObject({
      confidence: 'DIRECTA',
      source_ref: 'ConsentsController_capture',
      target_ref: 'consent.consent_events',
      origin: 'INVENTORY',
    });
    expect(r.result.lineageSkippedUncataloged).toBe(1);
  });

  it('glosario: el mismo término con la misma definición se deduplica; con definiciones distintas se conservan con código por fuente', async () => {
    const { inventory, vault } = fixture();
    const store = new InMemoryCatalogSeedStore();
    const r = await runCatalogSeed({ store, inventory, vault, now: NOW });
    const codigos = store
      .rows(GLOSSARY_TERMS.table)
      .map((t) => t.term_code)
      .sort();
    expect(codigos).toEqual(['PHI', 'TENANT__REPO_A', 'TENANT__REPO_B']);
    expect(r.result.glossaryDuplicatesDropped).toBe(1);
  });

  it('los niveles de clasificación son los del clasificador, sin UNKNOWN y sin reglas de manejo inventadas', async () => {
    const { inventory, vault } = fixture();
    const store = new InMemoryCatalogSeedStore();
    await runCatalogSeed({ store, inventory, vault, now: NOW });
    const filas = store.rows('system_ops.data_classifications');
    expect(filas.map((f) => f.code)).not.toContain('UNKNOWN');
    expect(filas.find((f) => f.code === 'PHI_IDENTIFIER')).toMatchObject({
      is_pii: true,
      is_phi: true,
    });
    expect(filas.find((f) => f.code === 'INTERNAL')).toMatchObject({
      is_pii: null,
      is_phi: null,
    });
    for (const f of filas)
      expect((f.handling_rules_json as { declared: boolean }).declared).toBe(
        false,
      );
  });
});

describe('siembra sobre el inventario REAL (doble en memoria con todas las tablas «observadas»)', () => {
  it('es idempotente y no deja nada aprobado', async () => {
    const inventory = readCatalogacionInventory();
    const store = new InMemoryCatalogSeedStore().withObjects(
      objectsFor(inventory),
    );
    const vault = vaultJson as unknown as VaultDataset;
    const primera = await runCatalogSeed({ store, inventory, vault, now: NOW });
    expect(primera.result.annotations.inserted).toBeGreaterThan(
      inventory.tables.length - 1,
    );
    expect(primera.result.lineageEdges.inserted).toBeGreaterThan(5000);
    const antes = snapshot(store);
    const segunda = await runCatalogSeed({ store, inventory, vault, now: NOW });
    expect(sums(segunda.result)).toBe(0);
    expect(snapshot(store)).toBe(antes);
    expect(
      store.rows(ANNOTATIONS.table).some((f) => f.review_status === 'APPROVED'),
    ).toBe(false);

    console.info(
      JSON.stringify({
        primera: primera.result,
        plan: primera.plan.annotations.stats,
      }),
    );
  }, 180_000);
});
