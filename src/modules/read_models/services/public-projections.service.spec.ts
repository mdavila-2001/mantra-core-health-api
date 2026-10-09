import { ServiceUnavailableException } from '@nestjs/common';
import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { PublicProjectionsService } from './public-projections.service';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const execute = mockFn().mockResolvedValue([]);
  const connection = { execute };
  const em = { fork: mockFn(), getConnection: mockFn(() => connection) };
  const logger = {
    setContext: mockFn(),
    info: mockFn(),
    warn: mockFn(),
    error: mockFn(),
  };
  const service = new PublicProjectionsService(em as any, logger as any);
  return { service, execute, logger };
}

describe('PublicProjectionsService (UC-30-10)', () => {
  it('reads the public MV by slug and returns real records without PHI', async () => {
    const { service, execute } = build();
    execute.mockResolvedValueOnce([
      { slug: 'dr-ada-lovelace', display_name: 'Ada Lovelace', city: 'Lima' },
    ]);

    const res = await service.getBySlug('dr-ada-lovelace');

    expect(res.slug).toBe('dr-ada-lovelace');
    expect(res.records).toHaveLength(1);
    expect(res.generatedAt).toBeInstanceOf(Date);
    // El slug entra parametrizado, nunca interpolado en el SQL.
    const [sql, params] = execute.mock.calls[0];
    expect(sql).toContain('"read_models"."public_provider_directory"');
    expect(sql).toContain('WHERE "slug" = ?');
    expect(params).toEqual(['dr-ada-lovelace']);
  });

  it('P-12: if the MV cannot be read it answers 503, never an empty 200', async () => {
    const { service, execute, logger } = build();
    execute.mockRejectedValueOnce(new Error('relation does not exist'));

    await expect(service.getBySlug('dr-missing')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(logger.error).toHaveBeenCalledTimes(1);
  });

  it('P-12: the directory search also answers 503 instead of «no doctors»', async () => {
    const { service, execute } = build();
    execute.mockRejectedValueOnce(new Error('relation does not exist'));

    await expect(service.searchDirectory({ city: 'Lima' })).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('serves the public directory filtered by city and specialty', async () => {
    const { service, execute } = build();
    execute.mockResolvedValueOnce([{ slug: 'x', city: 'Lima' }]);

    const res = await service.searchDirectory({
      city: 'Lima',
      specialty: 'cardiology',
    });

    expect(res.slug).toContain('Lima');
    expect(res.slug).toContain('cardiology');
    expect(res.records).toHaveLength(1);
    const [sql, params] = execute.mock.calls[0];
    expect(sql).toContain('"city" = ?');
    expect(sql).toContain('"specialty" = ?');
    expect(sql).toContain('LIMIT ?');
    // Filtros parametrizados + límite de página acotado.
    expect(params).toEqual(['Lima', 'cardiology', 50]);
  });

  it('serves the whole (bounded) directory when no filter is provided', async () => {
    const { service, execute } = build();
    execute.mockResolvedValueOnce([]);

    const res = await service.searchDirectory({});

    expect(res.records).toEqual([]);
    const [sql, params] = execute.mock.calls[0];
    expect(sql).not.toContain('WHERE');
    expect(params).toEqual([50]);
  });
});
