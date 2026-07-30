import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { AggregateStateRepository } from './aggregate-state.repository';

const AGGREGATE_ID = '11111111-1111-1111-1111-111111111111';
const STATE_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const LOCATION = {
  schemaName: 'clinical',
  entityName: 'encounters',
  statusFieldName: 'status_concept_id',
};

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * @param rows - Valor de rows requerido por la operación.
 * @returns Resultado de build.
 */
function build(rows: any = []) {
  const execute = mockFn(async () => rows);
  const em = {
    getConnection: mockFn(() => ({ execute })),
    getTransactionContext: mockFn(() => 'tx-ctx'),
  };
  return { repo: new AggregateStateRepository(), em, execute };
}

describe('AggregateStateRepository', () => {
  describe('findForUpdate', () => {
    it('entrecomilla los identificadores y bloquea la fila', async () => {
      const d = build([{ state_concept_id: 'estado', row_version: 3 }]);

      const row = await d.repo.findForUpdate(
        d.em as any,
        LOCATION,
        AGGREGATE_ID,
      );

      const [sql, params, method, ctx] = d.execute.mock.calls[0];
      expect(sql).toContain('"clinical"."encounters"');
      expect(sql).toContain('"status_concept_id"');
      expect(sql).toContain('for update');
      expect(params).toEqual([AGGREGATE_ID]);
      expect(method).toBe('all');
      expect(ctx).toBe('tx-ctx');
      expect(row).toEqual({ stateConceptId: 'estado', rowVersion: 3 });
    });

    it('devuelve null si el agregado no existe', async () => {
      const d = build([]);

      await expect(
        d.repo.findForUpdate(d.em as any, LOCATION, AGGREGATE_ID),
      ).resolves.toBeNull();
    });

    it('rechaza un nombre de tabla que no es un identificador SQL', async () => {
      const d = build();

      await expect(
        d.repo.findForUpdate(
          d.em as any,
          { ...LOCATION, entityName: 'encounters; drop table x' },
          AGGREGATE_ID,
        ),
      ).rejects.toThrow(/identificador SQL/);
      expect(d.execute).not.toHaveBeenCalled();
    });

    it('rechaza un esquema con comillas', async () => {
      const d = build();

      await expect(
        d.repo.findForUpdate(
          d.em as any,
          { ...LOCATION, schemaName: 'cli"nical' },
          AGGREGATE_ID,
        ),
      ).rejects.toThrow(/identificador SQL/);
    });

    it('rechaza un campo de estado en mayúsculas', async () => {
      const d = build();

      await expect(
        d.repo.findForUpdate(
          d.em as any,
          { ...LOCATION, statusFieldName: 'STATUS' },
          AGGREGATE_ID,
        ),
      ).rejects.toThrow(/identificador SQL/);
    });
  });

  describe('updateState', () => {
    it('incrementa row_version y no filtra por versión si no se exige', async () => {
      const d = build({ affectedRows: 1 });

      const applied = await d.repo.updateState(
        d.em as any,
        LOCATION,
        AGGREGATE_ID,
        STATE_B,
      );

      const [sql, params] = d.execute.mock.calls[0];
      expect(sql).toContain('row_version = row_version + 1');
      expect(sql).not.toContain('and row_version = ?');
      expect(params).toEqual([STATE_B, AGGREGATE_ID]);
      expect(applied).toBe(true);
    });

    it('añade la condición de versión esperada cuando se exige bloqueo optimista', async () => {
      const d = build({ affectedRows: 1 });

      await d.repo.updateState(d.em as any, LOCATION, AGGREGATE_ID, STATE_B, 7);

      const [sql, params] = d.execute.mock.calls[0];
      expect(sql).toContain('and row_version = ?');
      expect(params).toEqual([STATE_B, AGGREGATE_ID, 7]);
    });

    it('devuelve false cuando el UPDATE no afecta a ninguna fila', async () => {
      const d = build({ affectedRows: 0 });

      await expect(
        d.repo.updateState(d.em as any, LOCATION, AGGREGATE_ID, STATE_B, 7),
      ).resolves.toBe(false);
    });

    it('no toca updated_by_user_id: el actor vive en el evento de transición', async () => {
      const d = build({ affectedRows: 1 });

      await d.repo.updateState(d.em as any, LOCATION, AGGREGATE_ID, STATE_B);

      expect(d.execute.mock.calls[0][0]).not.toContain('updated_by_user_id');
    });
  });
});
