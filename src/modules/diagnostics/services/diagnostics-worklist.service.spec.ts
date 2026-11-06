import { describe, expect, it, jest } from '@jest/globals';
import { ResourceNotFoundException } from '../../../common';
import { CLIN } from '../../clinical/clinical.concepts';
import { DIAG } from '../diagnostics.concepts';
import { DiagnosticsWorklistService } from './diagnostics-worklist.service';
import { summaryOf } from './diagnostics-reception.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const TENANT = 'lab-1';

function order(n: number, over: Partial<any> = {}): any {
  return {
    id: `sr-${n}`,
    performerTenantId: TENANT,
    custodianTenantId: 'clinica',
    patientProfileId: `p-${n}`,
    categoryConceptId: CLIN.SERVICE_REQUEST_CATEGORY_LAB,
    createdAt: new Date(`2026-10-0${n}T10:00:00Z`),
    ...over,
  };
}

function build(
  orders: any[],
  blocks: any[][],
  states: Record<string, string> = {},
) {
  const em = {
    find: mockFn(async (_E: unknown, where: any) =>
      orders.filter((o) => where.id.$in.includes(o.id)),
    ),
    findOne: mockFn(
      async (_E: unknown, where: any) =>
        orders.find((o) => o.id === where.id) ?? null,
    ),
  };
  const repo = {
    findBlock: mockFn(),
    findState: mockFn(
      async (_em: any, _t: string, id: string) => states[id] ?? null,
    ),
  };
  for (const b of blocks) repo.findBlock.mockResolvedValueOnce(b);
  const reception = {
    loadLabels: mockFn(async () => undefined),
    toItems: mockFn(async (_em: any, _t: string, page: any[]) =>
      page.map((o) => ({ serviceRequestId: o.id })),
    ),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new DiagnosticsWorklistService(
    { fork: () => em } as any,
    repo as any,
    reception as any,
    logger as any,
  );
  return { service, repo, reception, em };
}

const row = (n: number, state: string): any => ({
  id: `sr-${n}`,
  createdAt: new Date(`2026-10-0${n}T10:00:00Z`),
  state,
});

describe('DiagnosticsWorklistService.list', () => {
  it('trae el estado derivado de cada fila y el ámbito pedido', async () => {
    const d = build(
      [order(2), order(1)],
      [[row(2, 'IN_PROCESS'), row(1, 'PENDING')]],
    );
    const page = await d.service.list(TENANT, { scope: 'LAB' } as any);
    expect(page.items).toEqual([
      { serviceRequestId: 'sr-2', state: 'IN_PROCESS', scope: 'LAB' },
      { serviceRequestId: 'sr-1', state: 'PENDING', scope: 'LAB' },
    ]);
    expect(page.nextCursor).toBeNull();
  });

  it('el ámbito IMAGING consulta las dos categorías de imagen; LAB, laboratorio y patología', async () => {
    const d = build([], [[]]);
    await d.service.list(TENANT, { scope: 'IMAGING' } as any);
    expect(d.repo.findBlock.mock.calls[0][2]).toEqual([
      CLIN.SERVICE_REQUEST_CATEGORY_IMAGING,
      DIAG.SERVICE_REQUEST_CATEGORY_IMAGING,
    ]);
    const l = build([], [[]]);
    await l.service.list(TENANT, { scope: 'LAB' } as any);
    expect(l.repo.findBlock.mock.calls[0][2]).toContain(
      CLIN.SERVICE_REQUEST_CATEGORY_LAB,
    );
    expect(l.repo.findBlock.mock.calls[0][2]).toContain(
      CLIN.SERVICE_REQUEST_CATEGORY_PATHOLOGY,
    );
  });

  it('el tenant del contexto es el ejecutor que se consulta, y los estados viajan al filtro', async () => {
    const d = build([], [[]]);
    await d.service.list(TENANT, { scope: 'LAB', states: ['REPORTED'] } as any);
    const [, tenant, , states] = d.repo.findBlock.mock.calls[0];
    expect(tenant).toBe(TENANT);
    expect(states).toEqual(['REPORTED']);
  });

  it('con más filas que el tope devuelve nextCursor y sigue después de la última devuelta', async () => {
    const d = build(
      [order(3), order(2), order(1)],
      [[row(3, 'PENDING'), row(2, 'PENDING'), row(1, 'PENDING')]],
    );
    // chunkSize mínimo es 50, así que el bloque (3) < chunk y se agota; con limit 2 sobra una.
    const page = await d.service.list(TENANT, {
      scope: 'LAB',
      limit: 2,
    } as any);
    expect(page.count).toBe(2);
    expect(page.nextCursor).not.toBeNull();
  });

  it('un cursor mal formado es 400', async () => {
    const d = build([], [[]]);
    await expect(
      d.service.list(TENANT, { scope: 'LAB', cursor: 'basura' } as any),
    ).rejects.toThrow();
  });
});

describe('DiagnosticsWorklistService.getById (C6)', () => {
  it('correcto: la orden del ejecutor con su estado', async () => {
    const d = build([order(1)], [], { 'sr-1': 'RECEIVED' });
    const item = await d.service.getById(TENANT, 'sr-1');
    expect(item).toMatchObject({
      serviceRequestId: 'sr-1',
      state: 'RECEIVED',
      scope: 'LAB',
    });
  });

  it('imagen: el ámbito sale de la categoría', async () => {
    const d = build(
      [order(1, { categoryConceptId: DIAG.SERVICE_REQUEST_CATEGORY_IMAGING })],
      [],
      { 'sr-1': 'PENDING' },
    );
    expect((await d.service.getById(TENANT, 'sr-1')).scope).toBe('IMAGING');
  });

  it('otro ejecutor: 404, sin llegar a calcular estado ni a proyectar PHI', async () => {
    const d = build([order(1, { performerTenantId: 'otro-lab' })], [], {});
    await expect(d.service.getById(TENANT, 'sr-1')).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
    expect(d.repo.findState).not.toHaveBeenCalled();
    expect(d.reception.toItems).not.toHaveBeenCalled();
  });

  it('sin ejecutor: 404', async () => {
    const d = build([order(1, { performerTenantId: undefined })], [], {});
    await expect(d.service.getById(TENANT, 'sr-1')).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
  });

  it('inexistente: 404 idéntico', async () => {
    const d = build([], [], {});
    await expect(d.service.getById(TENANT, 'x')).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
  });
});

describe('summaryOf', () => {
  it('laboratorio: nombre y cuántos componentes', () => {
    expect(
      summaryOf('Hemograma', {
        components: [{}, {}, {}],
        imaging: null,
      }),
    ).toBe('Hemograma · 3 componentes');
    expect(summaryOf('Glicemia', { components: [{}], imaging: null })).toBe(
      'Glicemia · 1 componente',
    );
  });

  it('imagen: región, lateralidad y contraste', () => {
    expect(
      summaryOf('Radiografía de mano', {
        components: [],
        imaging: {
          bodySiteDisplay: 'Mano',
          lateralityDisplay: 'Izquierda',
          contrastDisplay: null,
        },
      }),
    ).toBe('Radiografía de mano · Mano · Izquierda');
  });

  it('sin detalle: sólo el estudio; sin nombre: «Estudio»', () => {
    expect(summaryOf('Glicemia', undefined)).toBe('Glicemia');
    expect(summaryOf(null, undefined)).toBe('Estudio');
  });
});
