import { describe, expect, it } from '@jest/globals';
import { lastValueFrom, of } from 'rxjs';
import { RequestIdBodyInterceptor } from './request-id-body.interceptor';

const ctx = (method: string, id?: unknown) =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ method, id, headers: {} }) }),
  }) as any;
const run = (method: string, body: unknown, id: unknown = 'req-1') =>
  lastValueFrom(
    new RequestIdBodyInterceptor().intercept(ctx(method, id), {
      handle: () => of(body),
    }),
  );

describe('RequestIdBodyInterceptor', () => {
  it('suma requestId al cuerpo de una mutación', async () => {
    await expect(run('POST', { a: 1 })).resolves.toEqual({
      a: 1,
      requestId: 'req-1',
    });
  });
  it('no toca lecturas, listas ni un requestId ya puesto', async () => {
    await expect(run('GET', { a: 1 })).resolves.toEqual({ a: 1 });
    await expect(run('POST', [1, 2])).resolves.toEqual([1, 2]);
    await expect(run('PATCH', { requestId: 'x' })).resolves.toEqual({
      requestId: 'x',
    });
  });
  it('sin id de petición no inventa uno', async () => {
    await expect(run('POST', { a: 1 }, null)).resolves.toEqual({ a: 1 });
  });
});
