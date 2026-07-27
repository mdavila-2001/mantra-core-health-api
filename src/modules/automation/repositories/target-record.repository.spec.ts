import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import {
  TargetRecordRepository,
  parseTargetResource,
} from './target-record.repository';

const TARGET = { schemaName: 'clinical', tableName: 'encounters' };
const COLUMNS = { patient_id: 'p-1', note_text: 'texto' };

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
    expect(parseTargetResource('clinical.encounters')).toEqual({
      schemaName: 'clinical',
      tableName: 'encounters',
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
    expect(sql).toContain('"clinical"."encounters"');
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
        { schemaName: 'clinical', tableName: 'encounters; drop table x' },
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
