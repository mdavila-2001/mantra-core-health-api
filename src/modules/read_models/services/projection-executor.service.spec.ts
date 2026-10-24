import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { ProjectionExecutor } from './projection-executor.service';
import { PreconditionFailedException } from '../../../common';
import { RM } from '../read_models.concepts';
import { ReadModelsErrorReason } from '../read_models.error-reasons';

const TENANT = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const PATIENT = '55555555-5555-5555-5555-555555555555';
const REFRESHED = new Date('2026-10-01T10:00:00Z');

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * @returns El ejecutor y la conexión simulada.
 */
function build() {
  const connection = { execute: mockFn().mockResolvedValue([]) };
  const em = { getConnection: mockFn().mockReturnValue(connection) };
  const logger = {
    setContext: mockFn(),
    info: mockFn(),
    warn: mockFn(),
    error: mockFn(),
  };
  const executor = new ProjectionExecutor(em as any, logger as any);
  return { executor, connection };
}

const definition = (overrides: Record<string, unknown> = {}): any => ({
  id: 'def-1',
  schemaName: 'read_models',
  objectName: 'mv_accounts',
  statusConceptId: RM.DEF_ACTIVE,
  objectTypeConceptId: RM.OBJECT_TYPE_MATERIALIZED_VIEW,
  rowLevelSecurityRequired: true,
  defaultPageSize: 2,
  maximumPageSize: 3,
  stableCursorColumnsJson: ['id'],
  ...overrides,
});
const field = (code: string, overrides: Record<string, unknown> = {}): any => ({
  fieldCode: code,
  sourceColumn: code,
  filterable: false,
  ...overrides,
});
const sort = (overrides: Record<string, unknown> = {}): any => ({
  sortCode: 'name_asc',
  sortExpression: 'name',
  directionConceptId: RM.SORT_ASC,
  nullsPositionConceptId: RM.NULLS_LAST,
  ...overrides,
});

/**
 * Petición base: una MV materializada con dos campos y un orden, acotada por
 * tenant (el aislamiento explícito que el ejecutor exige).
 *
 * @param overrides - Campos a pisar.
 * @returns La petición.
 */
function request(overrides: Record<string, unknown> = {}): any {
  return {
    definition: definition(),
    viewId: 'view-1',
    fields: [field('id'), field('name', { filterable: true })],
    sortOptions: [sort()],
    filters: [{ filterCode: 'name', sourceColumn: 'name' }],
    tenantScoped: true,
    tenantId: TENANT,
    patientScoped: false,
    requestedFilters: {},
    refreshedAt: REFRESHED,
    materialized: true,
    ...overrides,
  };
}

/**
 * Aserción del 422 con su razón.
 *
 * @param promise - Operación que debe fallar.
 * @param reason - Razón esperada.
 */
async function expectReason(promise: Promise<unknown>, reason: string) {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(PreconditionFailedException);
  expect((error as PreconditionFailedException).reason).toBe(reason);
  expect((error as PreconditionFailedException).details).toBeUndefined();
}

describe('ProjectionExecutor (RM-02)', () => {
  it('Correcto: dos filas proyectadas con sólo las columnas del contrato, por código de campo', async () => {
    const d = build();
    d.connection.execute.mockResolvedValue([
      { id: 1, name: 'Ana', secreto: 'x' },
      { id: 2, name: 'Beto', secreto: 'y' },
    ]);

    const page = await d.executor.execute(request());

    expect(page.rows).toEqual([
      { id: 1, name: 'Ana' },
      { id: 2, name: 'Beto' },
    ]);
    expect(page.nextCursor).toBeNull();
    const [sql, params] = d.connection.execute.mock.calls[0];
    expect(sql).toBe(
      'SELECT "id", "name" FROM "read_models"."mv_accounts" WHERE "tenant_id" = ? ORDER BY "name" ASC NULLS LAST, "id" ASC LIMIT ? OFFSET ?',
    );
    expect(params).toEqual([TENANT, 3, 0]);
  });

  it('Límite: el tamaño pedido se recorta al máximo de la definición y hay cursor si sobra una fila', async () => {
    const d = build();
    d.connection.execute.mockResolvedValue([
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
      { id: 3, name: 'c' },
      { id: 4, name: 'd' },
    ]);

    const page = await d.executor.execute(request({ requestedLimit: 999 }));

    expect(d.connection.execute.mock.calls[0][1]).toEqual([TENANT, 4, 0]);
    expect(page.rows).toHaveLength(3);
    expect(page.nextCursor).toEqual(expect.stringContaining('.'));
  });

  it('el cursor continúa donde quedó la página anterior y su página final puede venir vacía', async () => {
    const d = build();
    d.connection.execute.mockResolvedValueOnce([
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
      { id: 3, name: 'c' },
    ]);
    const first = await d.executor.execute(request({ requestedLimit: 2 }));
    expect(first.nextCursor).not.toBeNull();

    d.connection.execute.mockResolvedValueOnce([]);
    const last = await d.executor.execute(
      request({ requestedLimit: 2, cursor: first.nextCursor }),
    );

    expect(d.connection.execute.mock.calls[1][1]).toEqual([TENANT, 3, 2]);
    expect(last).toEqual({ rows: [], nextCursor: null });
  });

  it.each([
    ['alterado', (c: string) => `${c.slice(0, -2)}xx`],
    ['sin firma', (c: string) => c.split('.')[0]],
    ['basura', () => 'no-es-un-cursor'],
  ])('un cursor %s se rechaza sin ejecutar SQL', async (_name, tamper) => {
    const d = build();
    d.connection.execute.mockResolvedValueOnce([
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
      { id: 3, name: 'c' },
    ]);
    const first = await d.executor.execute(request({ requestedLimit: 2 }));
    d.connection.execute.mockClear();

    await expectReason(
      d.executor.execute(
        request({ requestedLimit: 2, cursor: tamper(first.nextCursor!) }),
      ),
      ReadModelsErrorReason.READ_MODEL_CURSOR_INVALID,
    );
    expect(d.connection.execute).not.toHaveBeenCalled();
  });

  it('un cursor de otra vista, de otro orden o de otra foto de la MV se rechaza', async () => {
    const d = build();
    d.connection.execute.mockResolvedValue([
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
      { id: 3, name: 'c' },
    ]);
    const first = await d.executor.execute(request({ requestedLimit: 2 }));

    for (const changed of [
      { viewId: 'view-2' },
      { sortCode: 'other', sortOptions: [sort(), sort({ sortCode: 'other' })] },
      { refreshedAt: new Date('2026-10-02T10:00:00Z') },
      { requestedFilters: { name: 'ana' } },
      { tenantId: 'otro' },
    ]) {
      await expectReason(
        d.executor.execute(
          request({ requestedLimit: 2, cursor: first.nextCursor, ...changed }),
        ),
        ReadModelsErrorReason.READ_MODEL_CURSOR_INVALID,
      );
    }
  });

  describe('Error: nada fuera de la lista blanca llega al SQL', () => {
    it.each([
      ['filtro no declarado', { requestedFilters: { admin: '1' } }],
      [
        'filtro sobre una columna no filtrable',
        {
          fields: [field('id'), field('name')],
          requestedFilters: { name: 'x' },
        },
      ],
      ['orden no declarado', { sortCode: 'por_sueldo' }],
      [
        'orden sobre una columna no autorizada',
        { sortOptions: [sort({ sortExpression: 'secreto' })] },
      ],
      [
        'orden con una expresión SQL',
        { sortOptions: [sort({ sortExpression: 'name; DROP TABLE x' })] },
      ],
    ])('%s: se rechaza sin ejecutar SQL', async (_name, overrides) => {
      const d = build();

      await expectReason(
        d.executor.execute(request(overrides)),
        ReadModelsErrorReason.READ_MODEL_QUERY_NOT_ALLOWED,
      );
      expect(d.connection.execute).not.toHaveBeenCalled();
    });

    it('el valor de un filtro viaja como parámetro, nunca en el SQL', async () => {
      const d = build();

      await d.executor.execute(
        request({ requestedFilters: { name: "x'; DROP TABLE y; --" } }),
      );

      const [sql, params] = d.connection.execute.mock.calls[0];
      expect(sql).toContain('WHERE "tenant_id" = ? AND "name" = ?');
      expect(sql).not.toContain('DROP');
      expect(params[1]).toBe("x'; DROP TABLE y; --");
    });

    it.each([
      ['esquema', { definition: definition({ schemaName: 'a"; drop' }) }],
      ['objeto', { definition: definition({ objectName: 'x y' }) }],
      ['columna del contrato', { fields: [field('id'), field('na"me')] }],
      [
        'columna estable',
        { definition: definition({ stableCursorColumnsJson: ['id"; --'] }) },
      ],
    ])(
      'un %s inválido es proyección no disponible',
      async (_name, overrides) => {
        const d = build();

        await expectReason(
          d.executor.execute(request(overrides)),
          ReadModelsErrorReason.READ_MODEL_PROJECTION_UNAVAILABLE,
        );
        expect(d.connection.execute).not.toHaveBeenCalled();
      },
    );
  });

  describe('Falla catalogada: proyección no disponible (422), nunca una lista vacía', () => {
    it.each([
      [
        'definición no activa',
        { definition: definition({ statusConceptId: RM.DEF_RETIRED }) },
      ],
      [
        'objeto de otro tipo',
        { definition: definition({ objectTypeConceptId: 'otro' }) },
      ],
      ['MV que nunca se materializó', { materialized: false }],
      [
        'sin acotar por tenant ni por paciente y sin RLS declarada',
        {
          definition: definition({ rowLevelSecurityRequired: false }),
          tenantScoped: false,
        },
      ],
      [
        'RLS declarada pero sin acotar por tenant ni por paciente (la bandera no aísla, aunque haya tenant activo)',
        {
          definition: definition({ rowLevelSecurityRequired: true }),
          tenantScoped: false,
          patientScoped: false,
          tenantId: TENANT,
        },
      ],
      [
        'sin orden estable',
        {
          definition: definition({ stableCursorColumnsJson: null }),
          sortOptions: [sort()],
        },
      ],
      ['acotada por tenant sin tenant', { tenantId: undefined }],
      ['acotada por paciente sin paciente', { patientScoped: true }],
    ])('%s', async (_name, overrides) => {
      const d = build();

      await expectReason(
        d.executor.execute(request(overrides)),
        ReadModelsErrorReason.READ_MODEL_PROJECTION_UNAVAILABLE,
      );
      expect(d.connection.execute).not.toHaveBeenCalled();
    });

    it('una VIEW no necesita haberse materializado', async () => {
      const d = build();

      await d.executor.execute(
        request({
          definition: definition({
            objectTypeConceptId: RM.OBJECT_TYPE_VIEW,
          }),
          materialized: false,
        }),
      );

      expect(d.connection.execute).toHaveBeenCalledTimes(1);
    });

    it('un fallo de la base (MV ausente) es 422 y no filtra el detalle', async () => {
      const d = build();
      d.connection.execute.mockRejectedValue(
        new Error('relation "read_models.mv_accounts" does not exist'),
      );

      await expectReason(
        d.executor.execute(request()),
        ReadModelsErrorReason.READ_MODEL_PROJECTION_UNAVAILABLE,
      );
    });
  });

  it('sin campos autorizados no hay nada que seleccionar: página vacía legítima sin SQL', async () => {
    const d = build();

    const page = await d.executor.execute(request({ fields: [] }));

    expect(page).toEqual({ rows: [], nextCursor: null });
    expect(d.connection.execute).not.toHaveBeenCalled();
  });

  it('acota por tenant y por paciente con parámetros, antes de filtros y orden', async () => {
    const d = build();

    await d.executor.execute(
      request({
        definition: definition({ rowLevelSecurityRequired: false }),
        tenantScoped: true,
        tenantId: TENANT,
        patientScoped: true,
        patientProfileId: PATIENT,
      }),
    );

    const [sql, params] = d.connection.execute.mock.calls[0];
    expect(sql).toContain('WHERE "tenant_id" = ? AND "patient_profile_id" = ?');
    expect(params).toEqual([TENANT, PATIENT, 3, 0]);
  });

  it('el desempate de la opción de orden también da un orden estable', async () => {
    const d = build();

    await d.executor.execute(
      request({
        definition: definition({ stableCursorColumnsJson: null }),
        sortOptions: [sort({ stableTieBreakerExpression: 'id' })],
      }),
    );

    expect(d.connection.execute.mock.calls[0][0]).toContain(
      'ORDER BY "name" ASC NULLS LAST, "id" ASC',
    );
  });

  it('el orden por defecto de la vista se usa cuando el cliente no pide uno', async () => {
    const d = build();

    await d.executor.execute(
      request({
        defaultSortCode: 'name_desc',
        sortOptions: [
          sort(),
          sort({
            sortCode: 'name_desc',
            directionConceptId: RM.SORT_DESC,
            nullsPositionConceptId: RM.NULLS_FIRST,
          }),
        ],
      }),
    );

    expect(d.connection.execute.mock.calls[0][0]).toContain(
      'ORDER BY "name" DESC NULLS FIRST',
    );
  });
});
