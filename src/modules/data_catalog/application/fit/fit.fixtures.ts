import {
  available,
  type FitInputs,
  type FitLiveObject,
  type FitOperation,
  type FitRoute,
  type FitStaticTable,
} from './fit.types';

/** Entradas coherentes y sin desajuste: cada prueba rompe UNA cosa. Datos sintéticos. */
export const NOW = new Date('2026-10-31T12:00:00.000Z');

export const route = (
  method: string,
  template: string,
  controller = 'C',
  handler = 'h',
): FitRoute => ({ method, template, controller, handler });

export const operation = (
  method: string,
  ruta: string,
  extra: Partial<FitOperation> = {},
): FitOperation => ({
  id: `C_${method}${ruta}`,
  method,
  route: ruta,
  origin: 'CONTRATO',
  isPublic: false,
  roles: ['DPO'],
  hasBody: false,
  bodyDto: null,
  responseDto: 'ThingDto',
  httpCode: null,
  tables: 1,
  noTablesDeclared: false,
  ...extra,
});

export const staticTable = (
  schema: string,
  table: string,
  columns: string[] = ['id', 'name'],
  systemDescription: string | null = 'Guarda las cosas del módulo.',
): FitStaticTable => ({ schema, table, columns, systemDescription });

export const liveObject = (
  schema: string,
  name: string,
  columns: string[] = ['id', 'name'],
  extra: Partial<FitLiveObject> = {},
): FitLiveObject => ({
  schema,
  name,
  kind: 'TABLE',
  tableComment: null,
  columns: columns.map((c) => ({
    name: c,
    nativeType: 'text',
    sensitivity: 'INTERNAL',
  })),
  card: {
    purpose: 'Registrar las cosas',
    definition: null,
    sensitivity: 'INTERNAL',
    reviewStatus: 'APPROVED',
  },
  ...extra,
});

export function baseInputs(over: Partial<FitInputs> = {}): FitInputs {
  return {
    now: NOW,
    routes: available([
      route('GET', '/things'),
      route('POST', '/things/:id/do'),
    ]),
    operations: available([
      operation('GET', '/things'),
      operation('POST', '/things/{id}/do', { hasBody: true, bodyDto: 'DoDto' }),
    ]),
    staticTables: available([staticTable('app', 'things')]),
    ormDrift: available({
      counts: {
        entidadesSinTabla: 0,
        tablasSinEntidad: 0,
        columnasAusentesEnOrm: 0,
        columnasDeMasEnOrm: 0,
        nulabilidad: 0,
        tipos: 0,
      },
      samples: {},
    }),
    deployedDbDrift: available({
      counts: {
        tablasAusentes: 0,
        columnasAusentes: 0,
        columnasDeMas: 0,
        nulabilidad: 0,
        tipos: 0,
        indicesAusentes: 0,
        fkAusentes: 0,
        tablasDeMas: 0,
        indicesDeMas: 0,
      },
      samples: {},
    }),
    liveObjects: available([liveObject('app', 'things')]),
    scan: available({
      lastSucceededAt: new Date(NOW.getTime() - 10 * 60_000),
      lastFinishedAt: new Date(NOW.getTime() - 10 * 60_000),
      lastStatus: 'SUCCEEDED',
    }),
    importedOperations: available([
      { key: 'a', method: 'GET', route: '/things', origin: 'CONTRATO' },
      {
        key: 'b',
        method: 'POST',
        route: '/things/{id}/do',
        origin: 'CONTRATO',
      },
    ]),
    mutability: available(null),
    deployment: { commit: 'abc1234', builtAt: '2026-10-31T00:00:00Z' },
    ...over,
  };
}
