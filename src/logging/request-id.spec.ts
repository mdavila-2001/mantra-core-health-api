import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { genReqId } from './pino-options';

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Restaura `TRUST_PROXY_HOPS` entre pruebas: no es un env leído una sola vez. */
const originalTrustProxyHops = process.env.TRUST_PROXY_HOPS;
afterEach(() => {
  if (originalTrustProxyHops === undefined) delete process.env.TRUST_PROXY_HOPS;
  else process.env.TRUST_PROXY_HOPS = originalTrustProxyHops;
});

function fakeRes() {
  return { setHeader: mockFn() } as any;
}

describe('genReqId (TX-14)', () => {
  it('generates a UUID v4 when there is no trusted proxy, ignoring any client-supplied id', () => {
    delete process.env.TRUST_PROXY_HOPS;
    const req = { headers: { 'x-request-id': 'client-chosen-id' } } as any;
    const res = fakeRes();

    const id = genReqId(req, res);

    expect(id).toMatch(UUID_V4);
    expect(id).not.toBe('client-chosen-id');
  });

  it('echoes the generated id in the X-Request-Id response header', () => {
    delete process.env.TRUST_PROXY_HOPS;
    const req = { headers: {} } as any;
    const res = fakeRes();

    const id = genReqId(req, res);

    expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', id);
  });

  it('respects the inbound id when it comes from a trusted proxy', () => {
    process.env.TRUST_PROXY_HOPS = '1';
    const req = { headers: { 'x-request-id': 'nginx-generated-id' } } as any;
    const res = fakeRes();

    const id = genReqId(req, res);

    expect(id).toBe('nginx-generated-id');
    expect(res.setHeader).toHaveBeenCalledWith(
      'X-Request-Id',
      'nginx-generated-id',
    );
  });

  it('still generates a UUID behind a trusted proxy when no id arrives', () => {
    process.env.TRUST_PROXY_HOPS = '1';
    const req = { headers: {} } as any;
    const res = fakeRes();

    const id = genReqId(req, res);

    expect(id).toMatch(UUID_V4);
  });

  it('takes the first value when the header arrives duplicated', () => {
    process.env.TRUST_PROXY_HOPS = '1';
    const req = {
      headers: { 'x-request-id': ['first-id', 'second-id'] },
    } as any;
    const res = fakeRes();

    expect(genReqId(req, res)).toBe('first-id');
  });
});
