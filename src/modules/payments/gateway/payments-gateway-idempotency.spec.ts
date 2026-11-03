import { deriveGatewayIdempotencyKey } from './payments-gateway-idempotency';

const base = {
  tenantId: '11111111-1111-1111-1111-111111111111',
  sourceRefType: 'payment_debt',
  sourceRefId: '22222222-2222-2222-2222-222222222222',
  invoiceId: null,
  localIdempotencyKey: 'cobro-consulta-001',
};

describe('deriveGatewayIdempotencyKey', () => {
  describe('correcto', () => {
    it('es determinista: mismos datos persistidos, misma clave (estable entre reintentos y réplicas)', () => {
      expect(deriveGatewayIdempotencyKey(base)).toBe(
        deriveGatewayIdempotencyKey({ ...base }),
      );
    });

    it('cabe en el contrato (8 a 255 caracteres) y lleva el prefijo versionado', () => {
      const key = deriveGatewayIdempotencyKey(base);
      expect(key).toMatch(/^mantra-pi-v1-[0-9a-f]{64}$/u);
      expect(key.length).toBeGreaterThanOrEqual(8);
      expect(key.length).toBeLessThanOrEqual(255);
    });

    it('no filtra ninguno de los ids de origen', () => {
      const key = deriveGatewayIdempotencyKey(base);
      expect(key).not.toContain(base.sourceRefId);
      expect(key).not.toContain(base.tenantId);
      expect(key).not.toContain(base.localIdempotencyKey);
    });
  });

  describe('límite', () => {
    it('otra deuda u orden da otra clave', () => {
      expect(
        deriveGatewayIdempotencyKey({
          ...base,
          sourceRefId: '33333333-3333-3333-3333-333333333333',
        }),
      ).not.toBe(deriveGatewayIdempotencyKey(base));
    });

    it('otro intento de negocio (otra clave local) da otra clave: un reintento tras fallar no reusa el cobro fallido', () => {
      expect(
        deriveGatewayIdempotencyKey({
          ...base,
          localIdempotencyKey: 'cobro-consulta-002',
        }),
      ).not.toBe(deriveGatewayIdempotencyKey(base));
    });

    it('otro tenant da otra clave', () => {
      expect(
        deriveGatewayIdempotencyKey({
          ...base,
          tenantId: '44444444-4444-4444-4444-444444444444',
        }),
      ).not.toBe(deriveGatewayIdempotencyKey(base));
    });

    it('sin deuda ni orden, la factura ocupa su lugar', () => {
      const withInvoice = deriveGatewayIdempotencyKey({
        ...base,
        sourceRefType: null,
        sourceRefId: null,
        invoiceId: '55555555-5555-5555-5555-555555555555',
      });
      expect(withInvoice).not.toBe(deriveGatewayIdempotencyKey(base));
      expect(withInvoice).toMatch(/^mantra-pi-v1-/u);
    });

    it('un "|" en el texto libre no puede mover la frontera entre campos', () => {
      const a = deriveGatewayIdempotencyKey({
        ...base,
        sourceRefType: 'a|b',
        localIdempotencyKey: 'c',
      });
      const b = deriveGatewayIdempotencyKey({
        ...base,
        sourceRefType: 'a',
        localIdempotencyKey: 'b|c',
      });
      expect(a).not.toBe(b);
    });
  });

  describe('inválido', () => {
    it('undefined y null en los opcionales equivalen a ausentes (misma clave)', () => {
      expect(
        deriveGatewayIdempotencyKey({
          tenantId: base.tenantId,
          localIdempotencyKey: base.localIdempotencyKey,
        }),
      ).toBe(
        deriveGatewayIdempotencyKey({
          ...base,
          sourceRefType: null,
          sourceRefId: null,
          invoiceId: null,
        }),
      );
    });
  });
});
