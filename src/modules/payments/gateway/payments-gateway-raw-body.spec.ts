import {
  GATEWAY_WEBHOOK_PATH,
  isGatewayWebhookPath,
} from './payments-gateway-raw-body';

/**
 * `isGatewayWebhookPath` corre en el `verify` del `json()` global: sobre la URL de
 * TODA petición con cuerpo, antes de autenticar y con el flag apagado. Su coste
 * tiene que ser lineal en la longitud de la URL (N1 de la re-revisión: una URL de
 * 15 000 barras bloqueaba el event loop ~240 ms por el `replace(/\/+$/u, '')`).
 */
describe('isGatewayWebhookPath', () => {
  describe('correcto: rutas legítimas', () => {
    it.each([
      ['exacta', GATEWAY_WEBHOOK_PATH],
      ['con barra final', `${GATEWAY_WEBHOOK_PATH}/`],
      ['con varias barras finales', `${GATEWAY_WEBHOOK_PATH}///`],
      ['en mayúsculas', '/PAYMENTS/Gateway-Webhooks'],
      ['con query', `${GATEWAY_WEBHOOK_PATH}?x=1`],
      ['con barra final y query', `${GATEWAY_WEBHOOK_PATH}/?x=1&y=/`],
      ['con query vacía', `${GATEWAY_WEBHOOK_PATH}?`],
    ])('%s se reconoce', (_name, url) => {
      expect(isGatewayWebhookPath(url)).toBe(true);
    });
  });

  describe('inválido: otras rutas', () => {
    it.each([
      ['sin url', undefined],
      ['vacía', ''],
      ['raíz', '/'],
      ['prefijo', '/payments'],
      ['sufijo de más', `${GATEWAY_WEBHOOK_PATH}/x`],
      ['sufijo pegado', `${GATEWAY_WEBHOOK_PATH}x`],
      ['prefijo de más', `/api${GATEWAY_WEBHOOK_PATH}`],
      ['barras antes', `/${GATEWAY_WEBHOOK_PATH}`],
      [
        'la ruta sólo está en la query',
        '/otra?next=/payments/gateway-webhooks',
      ],
      ['solo barras', '/////'],
    ])('%s no se reconoce', (_name, url) => {
      expect(isGatewayWebhookPath(url)).toBe(false);
    });
  });

  describe('límite: coste lineal (N1)', () => {
    const measure = (url: string): number => {
      const start = process.hrtime.bigint();
      isGatewayWebhookPath(url);
      return Number(process.hrtime.bigint() - start) / 1e6;
    };

    it.each([
      ['100 000 barras seguidas de una letra', `/${'/'.repeat(100_000)}x`],
      ['100 000 barras', '/'.repeat(100_000)],
      [
        'la ruta legítima con 100 000 barras finales',
        `${GATEWAY_WEBHOOK_PATH}${'/'.repeat(100_000)}`,
      ],
      ['100 000 barras antes de la query', `${'/'.repeat(100_000)}?a=b`],
    ])('%s normaliza en menos de 5 ms', (_name, url) => {
      measure(url); // calienta el JIT: la cota es del régimen estable
      const best = Math.min(measure(url), measure(url), measure(url));
      expect(best).toBeLessThan(5);
    });

    it('el tiempo crece de forma lineal, no cuadrática (x10 de longitud, bastante menos que x100)', () => {
      const small = `/${'/'.repeat(20_000)}x`;
      const large = `/${'/'.repeat(200_000)}x`;
      measure(small);
      measure(large);
      const tSmall = Math.max(measure(small), 0.01);
      const tLarge = measure(large);
      // Lineal: ~x10. Cuadrático: ~x100. Cota holgada para no depender de la máquina.
      expect(tLarge / tSmall).toBeLessThan(40);
    });

    it('la ruta legítima con 100 000 barras finales sigue reconociéndose', () => {
      expect(
        isGatewayWebhookPath(`${GATEWAY_WEBHOOK_PATH}${'/'.repeat(100_000)}`),
      ).toBe(true);
    });
  });
});
