import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { TimescaleRepository } from './timescale.repository';

function build(rows: any = []) {
  const execute = mockFn(async () => rows);
  const em = {
    getConnection: mockFn(() => ({ execute })),
    getTransactionContext: mockFn(() => 'tx-ctx'),
  };
  return { repo: new TimescaleRepository(), em, execute };
}

const FROM = new Date('2026-01-01T00:00:00.000Z');
const TO = new Date('2026-01-02T00:00:00.000Z');

describe('TimescaleRepository', () => {
  describe('lista blanca', () => {
    it('rechaza una tabla que no está en el catálogo del módulo', async () => {
      const d = build();

      await expect(
        d.repo.createHypertable(d.em as any, 'pg_class'),
      ).rejects.toThrow(/no pertenece al catálogo/);
      expect(d.execute).not.toHaveBeenCalled();
    });

    it('rechaza un rollup que no está en el catálogo', async () => {
      const d = build();

      await expect(
        d.repo.ensureContinuousAggregate(d.em as any, 'cualquier_cosa'),
      ).rejects.toThrow(/no pertenece al catálogo/);
    });

    it('rechaza una dimensión de espacio que no es un identificador', async () => {
      const d = build();

      await expect(
        d.repo.addSpaceDimension(
          d.em as any,
          'device_raw_reading_series',
          'a; drop table x',
          4,
        ),
      ).rejects.toThrow(/identificador de columna/);
    });

    it('rechaza una segmentación de compresión con una columna hostil', async () => {
      const d = build();

      await expect(
        d.repo.enableCompression(
          d.em as any,
          'device_raw_reading_series',
          'tenant_id, a) --',
        ),
      ).rejects.toThrow(/no es válida/);
    });
  });

  describe('hypertables', () => {
    it('convierte con if_not_exists y migrate_data', async () => {
      const d = build();

      await d.repo.createHypertable(d.em as any, 'device_raw_reading_series');

      const sql = d.execute.mock.calls[0][0];
      expect(sql).toContain(
        "create_hypertable('time_series.device_raw_reading_series', 'time'",
      );
      expect(sql).toContain('if_not_exists => TRUE');
      expect(d.execute.mock.calls[0][3]).toBe('tx-ctx');
    });

    it('pasa la anchura del chunk como intervalo parametrizado', async () => {
      const d = build();

      await d.repo.setChunkTimeInterval(
        d.em as any,
        'normalized_vital_series',
        '7 days',
      );

      expect(d.execute.mock.calls[0][0]).toContain('?::interval');
      expect(d.execute.mock.calls[0][1]).toEqual(['7 days']);
    });

    it('parametriza el número de particiones de la dimensión de espacio', async () => {
      const d = build();

      await d.repo.addSpaceDimension(
        d.em as any,
        'device_raw_reading_series',
        'tenant_id',
        8,
      );

      expect(d.execute.mock.calls[0][1]).toEqual([8]);
    });
  });

  describe('compresión y retención', () => {
    it('devuelve los chunks candidatos como texto', async () => {
      const d = build([{ chunk: 'c1' }, { chunk: 'c2' }]);

      const chunks = await d.repo.listChunksOlderThan(
        d.em as any,
        'device_raw_reading_series',
        '30 days',
      );

      expect(chunks).toEqual(['c1', 'c2']);
      expect(d.execute.mock.calls[0][1]).toEqual(['30 days']);
    });

    it('comprime con if_not_compressed para tolerar el reintento', async () => {
      const d = build();

      await d.repo.compressChunk(
        d.em as any,
        '_timescaledb_internal._hyper_1_1_chunk',
      );

      expect(d.execute.mock.calls[0][0]).toContain('if_not_compressed => TRUE');
      expect(d.execute.mock.calls[0][1]).toEqual([
        '_timescaledb_internal._hyper_1_1_chunk',
      ]);
    });

    it('descarta chunks por intervalo parametrizado', async () => {
      const d = build([{ chunk: 'c1' }]);

      const dropped = await d.repo.dropChunksOlderThan(
        d.em as any,
        'location_ping_series',
        '7 days',
      );

      expect(dropped).toEqual(['c1']);
      expect(d.execute.mock.calls[0][0]).toContain('drop_chunks');
    });
  });

  describe('agregados continuos', () => {
    it('crea el agregado sin materializar', async () => {
      const d = build();

      await d.repo.ensureContinuousAggregate(
        d.em as any,
        'continuous_sli_hourly',
      );

      const sql = d.execute.mock.calls[0][0];
      expect(sql).toContain('CREATE MATERIALIZED VIEW IF NOT EXISTS');
      expect(sql).toContain('timescaledb.continuous');
      expect(sql).toContain('WITH NO DATA');
    });

    it('refresca fuera de la transacción: no pasa contexto transaccional', async () => {
      const d = build();

      await d.repo.refreshContinuousAggregate(
        d.em as any,
        'continuous_sli_hourly',
        FROM,
        TO,
      );

      const call = d.execute.mock.calls[0];
      expect(call[0]).toContain('CALL refresh_continuous_aggregate');
      expect(call[1]).toEqual([FROM, TO]);
      expect(call.length).toBe(2);
    });

    it('cuenta los buckets materializados de la ventana', async () => {
      const d = build([{ total: '24' }]);

      const total = await d.repo.countRollupBuckets(
        d.em as any,
        'continuous_sli_hourly',
        FROM,
        TO,
      );

      expect(total).toBe(24);
    });
  });

  describe('consulta de rango', () => {
    const PARAMS = {
      tenantId: '11111111-1111-1111-1111-111111111111',
      seriesId: 'serie-1',
      from: FROM,
      to: TO,
      bucket: '5 minutes',
      limit: 100,
    };

    it('entrecomilla la columna y compone la agregación', async () => {
      const d = build();

      await d.repo.queryRawRange(
        d.em as any,
        'normalized_vital_series',
        'numeric_value',
        'avg',
        PARAMS,
      );

      expect(d.execute.mock.calls[0][0]).toContain('avg("numeric_value")');
      expect(d.execute.mock.calls[0][1][0]).toBe('5 minutes');
    });

    it('usa count(*) cuando la serie no tiene columna numérica', async () => {
      const d = build();

      await d.repo.queryRawRange(
        d.em as any,
        'application_tracking_series',
        null,
        'count',
        PARAMS,
      );

      expect(d.execute.mock.calls[0][0]).toContain('count(*)');
    });

    it('rechaza agregar una serie sin columna numérica con algo que no sea count', async () => {
      const d = build();

      await expect(
        d.repo.queryRawRange(
          d.em as any,
          'application_tracking_series',
          null,
          'avg',
          PARAMS,
        ),
      ).rejects.toThrow(/sólo admite conteo/);
    });

    it('rechaza una agregación que no es un identificador', async () => {
      const d = build();

      await expect(
        d.repo.queryRawRange(
          d.em as any,
          'normalized_vital_series',
          'numeric_value',
          'avg(x); drop',
          PARAMS,
        ),
      ).rejects.toThrow(/agregación que no es válida/);
    });

    it('el rollup de auditoría lee su columna de conteo', async () => {
      const d = build();

      await d.repo.queryRollupRange(d.em as any, 'continuous_audit_daily', {
        tenantId: PARAMS.tenantId,
        from: FROM,
        to: TO,
        limit: 10,
      });

      expect(d.execute.mock.calls[0][0]).toContain('event_count AS value');
    });
  });
});
