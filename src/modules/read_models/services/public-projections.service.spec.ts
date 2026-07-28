import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { PublicProjectionsService } from './public-projections.service';

function build() {
  const execute = mockFn().mockResolvedValue([]);
  const connection = { execute };
  const em = { fork: mockFn(), getConnection: mockFn(() => connection) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new PublicProjectionsService(em as any, logger as any);
  return { service, execute };
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

  it('degrades to empty records (no faked success) when the MV is missing', async () => {
    const { service, execute } = build();
    execute.mockRejectedValueOnce(new Error('relation does not exist'));

    const res = await service.getBySlug('dr-missing');

    expect(res.records).toEqual([]);
    expect(res.refreshedAt).toBeNull();
    expect(res.generatedAt).toBeInstanceOf(Date);
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
