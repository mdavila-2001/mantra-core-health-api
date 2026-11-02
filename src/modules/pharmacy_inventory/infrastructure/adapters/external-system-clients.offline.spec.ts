import { jest } from '@jest/globals';
import axios from 'axios';
import { createExternalSystemClient } from './external-system-clients';

const config = {
  format: 'ALOVIDA_STANDARD',
  baseUrl: 'https://synthetic.invalid',
  externalPharmacyCode: 'synthetic',
} as const;
afterEach(() => jest.restoreAllMocks());

it.each([
  [401, 'AUTH_REJECTED'],
  [403, 'AUTH_REJECTED'],
  [500, 'UNREACHABLE'],
] as const)(
  'HTTP %s maps to %s without exposing secrets',
  async (status, errorReason) => {
    const get = jest.fn(async () => {
      throw {
        isAxiosError: true,
        response: { status },
        config: { headers: { 'X-Api-Key': 'synthetic-private-key' } },
      };
    });
    const create = jest.spyOn(axios, 'create').mockReturnValue({ get } as any);
    await expect(
      createExternalSystemClient(
        config,
        'synthetic-private-key',
        3000,
      ).checkHealth(),
    ).rejects.toMatchObject({ errorReason });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ proxy: false, maxRedirects: 0, timeout: 3000 }),
    );
    try {
      await createExternalSystemClient(
        config,
        'synthetic-private-key',
        3000,
      ).checkHealth();
    } catch (error) {
      expect(String(error)).not.toContain('synthetic-private-key');
    }
  },
);
it('carries cancellation through every page of the canonical chain client', async () => {
  const get = jest.fn(async () => ({
    data: { data: [], meta: { total_pages: 2 } },
  }));
  jest.spyOn(axios, 'create').mockReturnValue({ get } as any);
  const controller = new AbortController();
  await createExternalSystemClient(
    { ...config, format: 'SIMULATED_CHAIN' },
    'synthetic',
    3000,
  ).stockForSite('BRANCH', undefined, { signal: controller.signal });
  expect(get).toHaveBeenCalledTimes(2);
  for (const call of get.mock.calls as any[])
    expect(call[1]).toMatchObject({ signal: controller.signal });
});
