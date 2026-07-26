import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { PublicProjectionsService } from './public-projections.service';

function build() {
  const em = { fork: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new PublicProjectionsService(em as any, logger as any);
  return { service };
}

describe('PublicProjectionsService (UC-30-10)', () => {
  it('serves a public projection by slug without PHI', async () => {
    const { service } = build();
    const res = await service.getBySlug('dr-ada-lovelace');
    expect(res.slug).toBe('dr-ada-lovelace');
    expect(res.records).toEqual([]);
    expect(res.generatedAt).toBeInstanceOf(Date);
  });

  it('serves the public directory filtered by city and specialty', async () => {
    const { service } = build();
    const res = await service.searchDirectory({ city: 'Lima', specialty: 'cardiology' });
    expect(res.slug).toContain('Lima');
    expect(res.slug).toContain('cardiology');
  });
});
