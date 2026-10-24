import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { ErrorCode } from '../../../common';
import { AutomationErrorReason } from '../automation.error-reasons';
import {
  TargetRecordRepository,
  parseTargetResource,
} from './target-record.repository';

const TARGET = { schemaName: 'crm', tableName: 'leads' };
const COLUMNS = { patient_id: 'p-1', note_text: 'texto' };

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * @param rows - Valor de rows requerido por la operación.
 * @returns Resultado de build.
 */
function build(rows: any = [{ id: 'registro-1' }]) {
  const execute = mockFn(async () => rows);
  const em = {
    getConnection: mockFn(() => ({ execute })),
    getTransactionContext: mockFn(() => 'tx-ctx'),
  };
  return { repo: new TargetRecordRepository(), em, execute };
}

describe('parseTargetResource', () => {
  it('parte esquema y tabla', () => {
    expect(parseTargetResource('crm.leads')).toEqual({
      schemaName: 'crm',
      tableName: 'leads',
    });
  });

  it('rechaza un destino sin esquema', () => {
    expect(() => parseTargetResource('encounters')).toThrow(/esquema\.tabla/);
  });

  it('rechaza un destino con más de un punto', () => {
    expect(() => parseTargetResource('a.b.c')).toThrow(/esquema\.tabla/);
  });
});

describe('TargetRecordRepository', () => {
  it('entrecomilla esquema, tabla y columnas, y parametriza los valores', async () => {
    const d = build();

    await d.repo.writeRecord(d.em as any, TARGET, COLUMNS, [], false);

    const [sql, params, method, ctx] = d.execute.mock.calls[0];
    expect(sql).toContain('"crm"."leads"');
    expect(sql).toContain('"patient_id"');
    expect(sql).toContain('values (?, ?)');
    expect(params).toEqual(['p-1', 'texto']);
    expect(method).toBe('all');
    expect(ctx).toBe('tx-ctx');
  });

  it('sin clave de deduplicación no añade ON CONFLICT', async () => {
    const d = build();

    await d.repo.writeRecord(d.em as any, TARGET, COLUMNS, [], false);

    expect(d.execute.mock.calls[0][0]).not.toContain('on conflict');
  });

  it('con clave y sin upsert, la colisión no escribe', async () => {
    const d = build();

    await d.repo.writeRecord(
      d.em as any,
      TARGET,
      COLUMNS,
      ['patient_id'],
      false,
    );

    expect(d.execute.mock.calls[0][0]).toContain(
      'on conflict ("patient_id") do nothing',
    );
  });

  it('con upsert actualiza todo menos las columnas de la clave', async () => {
    const d = build();

    await d.repo.writeRecord(
      d.em as any,
      TARGET,
      COLUMNS,
      ['patient_id'],
      true,
    );

    const sql = d.execute.mock.calls[0][0];
    expect(sql).toContain('do update set "note_text" = excluded."note_text"');
    expect(sql).not.toContain('"patient_id" = excluded."patient_id"');
  });

  it('con upsert y sin columnas actualizables, no hace nada', async () => {
    const d = build();

    await d.repo.writeRecord(
      d.em as any,
      TARGET,
      { patient_id: 'p-1' },
      ['patient_id'],
      true,
    );

    expect(d.execute.mock.calls[0][0]).toContain('do nothing');
  });

  it('devuelve written=false cuando la colisión no devolvió fila', async () => {
    const d = build([]);

    const result = await d.repo.writeRecord(
      d.em as any,
      TARGET,
      COLUMNS,
      ['patient_id'],
      false,
    );

    expect(result).toEqual({ written: false });
  });

  it('rechaza una tabla de destino que no es un identificador SQL', async () => {
    const d = build();

    await expect(
      d.repo.writeRecord(
        d.em as any,
        { schemaName: 'crm', tableName: 'leads; drop table x' },
        COLUMNS,
        [],
        false,
      ),
    ).rejects.toThrow(/identificador SQL/);
    expect(d.execute).not.toHaveBeenCalled();
  });

  it('rechaza una columna de destino hostil', async () => {
    const d = build();

    await expect(
      d.repo.writeRecord(
        d.em as any,
        TARGET,
        { 'a") , (select 1': 1 },
        [],
        false,
      ),
    ).rejects.toThrow(/identificador SQL/);
  });

  it('rechaza una columna de deduplicación hostil', async () => {
    const d = build();

    await expect(
      d.repo.writeRecord(
        d.em as any,
        TARGET,
        COLUMNS,
        ['patient_id) --'],
        false,
      ),
    ).rejects.toThrow(/identificador SQL/);
  });

  it('rechaza escribir sin ninguna columna', async () => {
    const d = build();

    await expect(
      d.repo.writeRecord(d.em as any, TARGET, {}, [], false),
    ).rejects.toThrow(/ninguna columna/);
  });
});

/** Captura el error lanzado por `fn` (síncrono) para inspeccionarlo. */
function thrown(fn: () => unknown): any {
  try {
    fn();
  } catch (error) {
    return error;
  }
  throw new Error('Se esperaba una excepción');
}

describe('AUTO-02 · errores de configuración del escritor dinámico', () => {
  it('destino con un solo segmento: 400 VALIDATION_FAILED con reason catalogado', () => {
    const error = thrown(() => parseTargetResource('leads'));

    expect(error.getStatus()).toBe(400);
    expect(error.code).toBe(ErrorCode.VALIDATION_FAILED);
    expect(error.reason).toBe(
      AutomationErrorReason.AUTOMATION_RECORD_TARGET_INVALID,
    );
  });

  it('destino configurado como `clinical`: rechazado antes de ejecutar', async () => {
    const error = thrown(() => parseTargetResource('clinical.encounters'));
    expect(error.getStatus()).toBe(400);
    expect(error.reason).toBe(
      AutomationErrorReason.AUTOMATION_RECORD_TARGET_INVALID,
    );

    const d = build();
    await expect(
      d.repo.writeRecord(
        d.em as any,
        { schemaName: 'clinical', tableName: 'encounters' },
        COLUMNS,
        [],
        false,
      ),
    ).rejects.toMatchObject({
      reason: AutomationErrorReason.AUTOMATION_RECORD_TARGET_INVALID,
    });
    expect(d.execute).not.toHaveBeenCalled();
  });

  it('identificador inválido: 400 sin reflejar el valor recibido ni SQL', async () => {
    const d = build();

    const error: any = await d.repo
      .writeRecord(
        d.em as any,
        { schemaName: 'crm', tableName: 'leads; drop table x' },
        COLUMNS,
        [],
        false,
      )
      .catch((e: unknown) => e);

    expect(error.getStatus()).toBe(400);
    expect(error.code).toBe(ErrorCode.VALIDATION_FAILED);
    expect(error.reason).toBe(
      AutomationErrorReason.AUTOMATION_RECORD_TARGET_INVALID,
    );
    expect(JSON.stringify(error.getResponse())).not.toMatch(/drop table/);
    expect(d.execute).not.toHaveBeenCalled();
  });

  it('columna fuera de la lista blanca: 400 y no llega a la base', async () => {
    const d = build();

    await expect(
      d.repo.writeRecord(
        d.em as any,
        TARGET,
        { 'a") , (select 1': 1 },
        [],
        false,
      ),
    ).rejects.toMatchObject({
      reason: AutomationErrorReason.AUTOMATION_RECORD_TARGET_INVALID,
    });
    expect(d.execute).not.toHaveBeenCalled();
  });

  it('mapeo vacío: 400 AUTOMATION_RECORD_MAPPING_EMPTY sin fila nueva', async () => {
    const d = build();

    const error: any = await d.repo
      .writeRecord(d.em as any, TARGET, {}, [], false)
      .catch((e: unknown) => e);

    expect(error.getStatus()).toBe(400);
    expect(error.code).toBe(ErrorCode.VALIDATION_FAILED);
    expect(error.reason).toBe(
      AutomationErrorReason.AUTOMATION_RECORD_MAPPING_EMPTY,
    );
    expect(d.execute).not.toHaveBeenCalled();
  });

  it.each(['42P01', '42703', '42P10'])(
    'la base rechaza el destino (%s): 400 sin SQL ni identificadores',
    async (sqlstate) => {
      const execute = mockFn(async () => {
        throw Object.assign(
          new Error('relation "crm.leads" does not exist: select secreto'),
          { code: sqlstate },
        );
      });
      const em = {
        getConnection: mockFn(() => ({ execute })),
        getTransactionContext: mockFn(() => 'tx-ctx'),
      };

      const error: any = await new TargetRecordRepository()
        .writeRecord(em as any, TARGET, COLUMNS, [], false)
        .catch((e: unknown) => e);

      expect(error.getStatus()).toBe(400);
      expect(error.reason).toBe(
        AutomationErrorReason.AUTOMATION_RECORD_TARGET_INVALID,
      );
      expect(JSON.stringify(error.getResponse())).not.toMatch(
        /secreto|crm\.leads|relation/,
      );
    },
  );

  it('un error inesperado de la base que no es de configuración se propaga intacto', async () => {
    const original = Object.assign(new Error('boom'), { code: '23505' });
    const execute = mockFn(async () => {
      throw original;
    });
    const em = {
      getConnection: mockFn(() => ({ execute })),
      getTransactionContext: mockFn(() => 'tx-ctx'),
    };

    await expect(
      new TargetRecordRepository().writeRecord(
        em as any,
        TARGET,
        COLUMNS,
        [],
        false,
      ),
    ).rejects.toBe(original);
  });

  it('dedupe sin columnas actualizables: la colisión devuelve written=false', async () => {
    const d = build([]);

    const result = await d.repo.writeRecord(
      d.em as any,
      TARGET,
      { patient_id: 'p-1' },
      ['patient_id'],
      true,
    );

    expect(d.execute.mock.calls[0][0]).toContain('do nothing');
    expect(result).toEqual({ written: false });
  });
});
