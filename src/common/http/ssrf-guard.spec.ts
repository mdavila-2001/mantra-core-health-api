import { jest } from '@jest/globals';
import {
  assertOutboundUrlAllowed,
  pinnedLookup,
  resolveOutboundDestination,
  type ResolvedAddress,
} from './ssrf-guard';
import { PreconditionFailedException } from '../errors/domain.exception';

/**
 * MCH-006 · la guarda anti-SSRF decide sobre la dirección, no sobre el texto.
 *
 * `new URL()` normaliza el host antes de que la guarda lo vea: una IPv4 mapeada
 * llega como `::ffff:7f00:1`, no como `::ffff:127.0.0.1`. Por eso los casos se
 * escriben tal como los escribiría un atacante y se deja que URL los normalice.
 */
describe('assertOutboundUrlAllowed (MCH-006)', () => {
  const previous = process.env.NODE_ENV;
  beforeEach(() => {
    process.env.NODE_ENV = 'production';
  });
  afterAll(() => {
    process.env.NODE_ENV = previous;
  });

  it.each([
    'http://127.0.0.1/',
    'http://[::1]/',
    'http://[0:0:0:0:0:0:0:1]/',
    'http://[::]/',
    // IPv4 mapeada: URL la normaliza a hex y el filtro textual dejaba pasar.
    'http://[::ffff:127.0.0.1]/',
    'http://[::ffff:169.254.169.254]/',
    'http://[::ffff:10.0.0.1]/',
    // Link-local completo (fe80::/10), no sólo el prefijo textual `fe80:`.
    'http://[fe80::1]/',
    'http://[fe90::1]/',
    'http://[febf::1]/',
    // ULA (fc00::/7) y site-local obsoleto.
    'http://[fc00::1]/',
    'http://[fdff:ffff::1]/',
    'http://[fec0::1]/',
    // Multicast, NAT64 y 6to4 que encapsulan una IPv4 privada.
    'http://[ff02::1]/',
    'http://[64:ff9b::a9fe:a9fe]/',
    'http://[2002:7f00:1::1]/',
    // Formas IPv4 que URL normaliza (entero, hex) y rangos no enrutables.
    'http://2130706433/',
    'http://0x7f.1/',
    'http://100.64.0.1/',
    'http://198.18.0.1/',
    'http://224.0.0.1/',
    'http://255.255.255.255/',
    'http://localhost./',
  ])('rechaza %s en producción', (url) => {
    expect(() => assertOutboundUrlAllowed(url)).toThrow(
      PreconditionFailedException,
    );
  });

  it.each([
    'https://api.proveedor.example/webhook',
    'http://8.8.8.8/',
    'http://[2606:4700:4700::1111]/',
    'http://[::ffff:8.8.8.8]/',
    'http://[64:ff9b::808:808]/',
  ])('permite %s (pública)', (url) => {
    expect(() => assertOutboundUrlAllowed(url)).not.toThrow();
  });

  it('rechaza esquemas que no son http/https', () => {
    expect(() => assertOutboundUrlAllowed('file:///etc/passwd')).toThrow(
      PreconditionFailedException,
    );
  });
});

describe('resolveOutboundDestination + pinnedLookup (MCH-006)', () => {
  const previous = process.env.NODE_ENV;
  beforeEach(() => {
    process.env.NODE_ENV = 'production';
  });
  afterAll(() => {
    process.env.NODE_ENV = previous;
  });

  /** Resolvedor de laboratorio que responde, por llamada, la lista dada. */
  function resolver(...responses: ResolvedAddress[][]) {
    let n = 0;
    const fn = jest.fn(() =>
      Promise.resolve(responses[Math.min(n++, responses.length - 1)]),
    );
    return fn;
  }

  it('rechaza si un solo registro A/AAAA es interno, aunque otro sea público', async () => {
    const r = resolver([
      { address: '8.8.8.8', family: 4 },
      { address: 'fd00::1', family: 6 },
    ]);
    await expect(
      resolveOutboundDestination('https://mixto.example/x', r),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('rechaza un AAAA link-local fuera del prefijo textual fe80:', async () => {
    const r = resolver([{ address: 'fe8f::1', family: 6 }]);
    await expect(
      resolveOutboundDestination('https://v6.example/x', r),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('rechaza un nombre sin direcciones (fail-closed)', async () => {
    const r = resolver([]);
    await expect(
      resolveOutboundDestination('https://vacio.example/x', r),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('AC03 · el lookup anclado entrega la dirección validada aunque el DNS cambie después', async () => {
    const r = resolver(
      [{ address: '8.8.4.4', family: 4 }],
      [{ address: '169.254.169.254', family: 4 }],
    );
    const destination = await resolveOutboundDestination(
      'https://rebinding.example/x',
      r,
    );
    const lookup = pinnedLookup(destination);

    const unique = await new Promise<string>((ok, ko) =>
      lookup('rebinding.example', {}, (err, address) =>
        err ? ko(err) : ok(address as string),
      ),
    );
    const todas = await new Promise<unknown>((ok, ko) =>
      lookup('rebinding.example', { all: true }, (err, address) =>
        err ? ko(err) : ok(address),
      ),
    );

    expect(unique).toBe('8.8.4.4');
    expect(todas).toEqual([{ address: '8.8.4.4', family: 4 }]);
    expect(r).toHaveBeenCalledTimes(1);
  });

  it('el lookup anclado no resuelve otro host (p. ej. tras un cambio de destino)', async () => {
    const destination = await resolveOutboundDestination(
      'https://uno.example/x',
      resolver([{ address: '8.8.4.4', family: 4 }]),
    );
    const err = await new Promise<NodeJS.ErrnoException | null>((ok) =>
      pinnedLookup(destination)('otro.example', {}, (e) => ok(e)),
    );
    expect(err?.code).toBe('EOUTBOUNDPOLICY');
  });
});
