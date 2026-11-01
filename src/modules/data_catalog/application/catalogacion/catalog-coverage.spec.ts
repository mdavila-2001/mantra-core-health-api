import type {
  CatalogacionInventory,
  InvColumn,
  InvOperation,
  InvTable,
} from './catalogacion-inventory';
import { computeCoverage, ratio } from './catalog-coverage';
import type { VaultDataset } from './quality-context';

const col = (
  name: string,
  nativeType: string,
  text: string | null = null,
  kind: string | null = null,
): InvColumn => ({
  name,
  ordinal: 1,
  nativeType,
  nullable: false,
  primaryKey: false,
  unique: false,
  defaultExpr: null,
  foreignKeys: [],
  description: { text, kind, reference: text ? 'x.ts:1' : null },
});

const tabla = (
  name: string,
  purpose: string | null,
  columns: InvColumn[],
): InvTable => ({
  id: `s.${name}`,
  schema: 's',
  name,
  domain: null,
  purpose: { text: purpose, state: 'X', reference: null },
  ormEntity: null,
  appendOnly: { declared: false, reference: null },
  columns,
  outgoingRelations: 0,
  incomingRelations: 0,
  indexes: { total: 0, unique: 0 },
  operations: [],
});

const operacion = (
  id: string,
  over: Partial<InvOperation> = {},
): InvOperation => ({
  id,
  origin: 'CONTRATO',
  method: 'POST',
  path: '/x',
  module: 'm',
  businessExplanation: { state: 'AUTO_DETECTADA', text: 'Hace X.' },
  systemExplanation: { state: 'SIN_FUENTE', text: null },
  reviewState: 'AUTO_DETECTADA',
  requestDto: 'Dto',
  responseDto: null,
  requestFields: [
    {
      name: 'a',
      description: 'Valor de a mantenido por la instancia.',
      reference: null,
    },
  ],
  responseFields: [],
  tables: [
    {
      schema: 's',
      table: 'uno',
      access: 'ESCRIBE',
      detail: null,
      confidence: 'DIRECTA',
      source: null,
    },
  ],
  hasNoTables: false,
  isMutation: true,
  flowCodes: ['f'],
  ...over,
});

describe('ratio', () => {
  it('sin denominador no hay porcentaje: null, nunca 0 % ni 100 %', () => {
    expect(ratio(0, 0)).toEqual({ covered: 0, denominator: 0, ratio: null });
    expect(ratio(1, 3).ratio).toBe(0.3333);
  });
});

describe('computeCoverage', () => {
  const inventory: CatalogacionInventory = {
    directory: '(memoria)',
    tables: [
      tabla(
        'uno',
        'Registra los ingresos de pacientes al servicio de urgencias.',
        [col('id', 'uuid'), col('estado', 'varchar')],
      ),
      tabla('dos', null, [
        col(
          'x',
          'int4',
          'Valor de x mantenido por la instancia.',
          'JSDOC_ENTIDAD',
        ),
      ]),
    ],
    operations: [
      operacion('a'),
      operacion('b', {
        method: 'GET',
        isMutation: false,
        requestDto: null,
        tables: [],
        hasNoTables: true,
      }),
    ],
    glossary: [],
  };
  inventory.tables[0].operations = [
    {
      operationId: 'a',
      access: 'ESCRIBE',
      detail: null,
      confidence: 'DIRECTA',
    },
  ];
  const vault: VaultDataset = {
    source: { vault: 'v', sha256: 'h' },
    tables: {},
  };
  const c = computeCoverage(inventory, vault, {
    s: { business: 'Algo.', system: null },
    t: { business: null, system: null },
  });

  it('cuenta con numerador y denominador', () => {
    expect(c.tables.withCuratedPurpose).toMatchObject({
      covered: 1,
      denominator: 2,
    });
    expect(c.tables.purposeQuality).toEqual({
      CURADA: 1,
      PLANTILLA: 0,
      AUTO_DETECTADA: 0,
      VACIA: 1,
    });
    expect(c.tables.touchedByAnEndpoint).toMatchObject({
      covered: 1,
      denominator: 2,
    });
    expect(c.tables.withRowGrain).toMatchObject({ covered: 0, denominator: 2 });
    expect(c.columns.total).toBe(3);
    // id: regla estándar (AUTO); estado: sin texto (VACIA); x: molde (PLANTILLA)
    expect(c.columns.businessQuality).toEqual({
      CURADA: 0,
      PLANTILLA: 1,
      AUTO_DETECTADA: 1,
      VACIA: 1,
    });
    expect(c.columns.described).toMatchObject({ covered: 1, denominator: 3 });
    expect(c.schemas.withBusinessDescription).toMatchObject({
      covered: 1,
      denominator: 2,
    });
  });

  it('operaciones: contrato, tablas y calidad de las explicaciones', () => {
    expect(c.operations.mutationsWithRequestDto).toMatchObject({
      covered: 1,
      denominator: 1,
    });
    expect(c.operations.withRequestDto).toMatchObject({
      covered: 1,
      denominator: 2,
    });
    expect(c.operations.withTablesOrDeclaredNone).toMatchObject({
      covered: 2,
      denominator: 2,
    });
    expect(c.operations.directTableLinks).toMatchObject({
      covered: 1,
      denominator: 1,
    });
    expect(c.operations.businessQuality.AUTO_DETECTADA).toBe(2);
    expect(c.operations.systemQuality.VACIA).toBe(2);
    expect(c.operations.requestFieldQuality.PLANTILLA).toBe(2);
  });
});
