import { jest } from '@jest/globals';
import { runWithTenant } from '../../../../common';
import { IamErrorReason } from '../../iam.error-reasons';
import { IpAccessRulesService } from './ip-access-rules.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = 't1';
const OTHER = 't2';
const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build(
  records: { tenantId: string; type: 'ALLOW' | 'DENY'; cidr: string }[] = [],
  opts: { stored?: any[] } = {},
) {
  const tx = {};
  const em = {
    fork: () => tx,
    transactional: mockFn((fn: (t: unknown) => unknown) => fn(tx)),
  };
  const port = {
    listEffective: mockFn().mockResolvedValue(records),
    listActive: mockFn().mockResolvedValue(opts.stored ?? []),
    replace: mockFn().mockResolvedValue(undefined),
    countActive: mockFn().mockResolvedValue(0),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new IpAccessRulesService(
    em as any,
    port as any,
    logger as any,
  );
  return { service, port, tx, logger };
}

const rules = (tenants: string[]) =>
  ({
    requireMfa: false,
    allowedHours: [],
    newDeviceAlert: false,
    enforceIpRules: tenants.length > 0,
    ipRuleTenantIds: tenants,
  }) as any;

describe('IpAccessRulesService', () => {
  describe('violationFor', () => {
    it('sin organizaciones que exijan reglas de red no consulta nada', async () => {
      const d = build();
      await expect(
        d.service.violationFor(d.tx as any, rules([]), '1.1.1.1'),
      ).resolves.toBeNull();
      await expect(
        d.service.violationFor(d.tx as any, undefined, '1.1.1.1'),
      ).resolves.toBeNull();
      expect(d.port.listEffective).not.toHaveBeenCalled();
    });

    it('permite el origen dentro de un rango permitido y niega el que cae fuera', async () => {
      const d = build([
        { tenantId: TENANT, type: 'ALLOW', cidr: '190.129.0.0/16' },
      ]);
      await expect(
        d.service.violationFor(d.tx as any, rules([TENANT]), '190.129.4.4'),
      ).resolves.toBeNull();
      await expect(
        d.service.violationFor(d.tx as any, rules([TENANT]), '8.8.8.8'),
      ).resolves.toBe('OUTSIDE_ALLOWED_NETWORK');
    });

    it('entiende una IPv4 mapeada en IPv6, que es como la entrega un socket dual', async () => {
      const d = build([
        { tenantId: TENANT, type: 'ALLOW', cidr: '190.129.0.0/16' },
      ]);
      await expect(
        d.service.violationFor(
          d.tx as any,
          rules([TENANT]),
          '::ffff:190.129.4.4',
        ),
      ).resolves.toBeNull();
    });

    it('sin reglas cargadas la política no deja a nadie afuera', async () => {
      const d = build([]);
      await expect(
        d.service.violationFor(d.tx as any, rules([TENANT]), '8.8.8.8'),
      ).resolves.toBeNull();
    });

    it('un origen ilegible se niega cuando hay reglas', async () => {
      const d = build([
        { tenantId: TENANT, type: 'ALLOW', cidr: '190.129.0.0/16' },
      ]);
      await expect(
        d.service.violationFor(d.tx as any, rules([TENANT]), undefined),
      ).resolves.toBe('OUTSIDE_ALLOWED_NETWORK');
      await expect(
        d.service.violationFor(d.tx as any, rules([TENANT]), 'basura'),
      ).resolves.toBe('OUTSIDE_ALLOWED_NETWORK');
    });

    it('con varias organizaciones, cada una con sus propias reglas; sin tenantId basta que una lo niegue', async () => {
      const d = build([
        { tenantId: TENANT, type: 'ALLOW', cidr: '190.129.0.0/16' },
        { tenantId: OTHER, type: 'ALLOW', cidr: '10.0.0.0/8' },
      ]);
      // Permitido en t1 pero fuera de la red de t2.
      await expect(
        d.service.violationFor(
          d.tx as any,
          rules([TENANT, OTHER]),
          '190.129.1.1',
        ),
      ).resolves.toBe('OUTSIDE_ALLOWED_NETWORK');
      // La regla de t2 no restringe a quien solo exige t1.
      await expect(
        d.service.violationFor(d.tx as any, rules([TENANT]), '190.129.1.1'),
      ).resolves.toBeNull();
    });

    it('N2: con tenantId solo rigen las reglas de ESA organización', async () => {
      const d = build([
        { tenantId: TENANT, type: 'ALLOW', cidr: '190.129.0.0/16' },
        { tenantId: OTHER, type: 'ALLOW', cidr: '10.0.0.0/8' },
      ]);
      const both = rules([TENANT, OTHER]);
      await expect(
        d.service.violationFor(d.tx as any, both, '190.129.1.1', TENANT),
      ).resolves.toBeNull();
      await expect(
        d.service.violationFor(d.tx as any, both, '190.129.1.1', OTHER),
      ).resolves.toBe('OUTSIDE_ALLOWED_NETWORK');
    });

    it('una regla DENY vigente niega aunque el origen esté en un rango permitido', async () => {
      const d = build([
        { tenantId: TENANT, type: 'ALLOW', cidr: '190.129.0.0/16' },
        { tenantId: TENANT, type: 'DENY', cidr: '190.129.7.0/24' },
      ]);
      await expect(
        d.service.violationFor(d.tx as any, rules([TENANT]), '190.129.7.9'),
      ).resolves.toBe('OUTSIDE_ALLOWED_NETWORK');
    });

    it('consulta solo las organizaciones que exigen reglas', async () => {
      const d = build([]);
      await d.service.violationFor(d.tx as any, rules([TENANT]), '1.1.1.1');
      expect(d.port.listEffective).toHaveBeenCalledWith(
        d.tx,
        [TENANT],
        expect.any(Date),
      );
    });
  });

  describe('N2: deniedTenantIds', () => {
    it('devuelve SOLO las organizaciones que niegan, cada una con sus reglas', async () => {
      const d = build([
        { tenantId: TENANT, type: 'ALLOW', cidr: '190.129.0.0/16' },
        { tenantId: OTHER, type: 'ALLOW', cidr: '10.0.0.0/8' },
      ]);
      await expect(
        d.service.deniedTenantIds(
          d.tx as any,
          rules([TENANT, OTHER]),
          '190.129.1.1',
        ),
      ).resolves.toEqual([OTHER]);
      await expect(
        d.service.deniedTenantIds(d.tx as any, rules([]), '190.129.1.1'),
      ).resolves.toEqual([]);
    });
  });

  describe('describeOrigin (GET /iam/me/network)', () => {
    it('devuelve la IP que ve el servidor, su familia y los saltos de proxy', () => {
      const d = build();
      expect(d.service.describeOrigin('::ffff:190.129.4.20', 2)).toEqual({
        ip: '190.129.4.20',
        family: 'ipv4',
        trustProxyHops: 2,
      });
      expect(d.service.describeOrigin('2001:db8::1', 0)).toEqual({
        ip: '2001:db8::1',
        family: 'ipv6',
        trustProxyHops: 0,
      });
    });

    it('una IP ilegible se informa como null para que la persona lo vea antes de guardar reglas', () => {
      const d = build();
      expect(d.service.describeOrigin(undefined, 0)).toEqual({
        ip: null,
        family: null,
        trustProxyHops: 0,
      });
    });
  });

  describe('N2: assertActorKeepsStoredRules y rescate', () => {
    it('rechaza si las reglas YA guardadas (incluso una futura) dejarían fuera al actor', async () => {
      const d = build([], {
        stored: [
          {
            type: 'ALLOW',
            cidr: '192.0.2.1/32',
            validFrom: new Date(Date.now() + 86_400_000),
          },
        ],
      });
      await expect(
        d.service.assertActorKeepsStoredRules(
          d.tx as any,
          TENANT,
          '190.129.1.1',
        ),
      ).rejects.toMatchObject({
        reason: IamErrorReason.IP_RULES_WOULD_LOCK_OUT_ACTOR,
      });
    });

    it('permite si no hay reglas guardadas o el origen está dentro', async () => {
      const d = build([], { stored: [] });
      await expect(
        d.service.assertActorKeepsStoredRules(d.tx as any, TENANT, '1.1.1.1'),
      ).resolves.toBeUndefined();
      const e = build([], {
        stored: [{ type: 'ALLOW', cidr: '190.129.0.0/16' }],
      });
      await expect(
        e.service.assertActorKeepsStoredRules(
          e.tx as any,
          TENANT,
          '190.129.1.1',
        ),
      ).resolves.toBeUndefined();
    });

    it('clearForTenant retira todas las reglas de la organización y dice cuántas había', async () => {
      const d = build([], {
        stored: [
          { type: 'ALLOW', cidr: '10.0.0.0/8' },
          { type: 'DENY', cidr: '10.1.0.0/16' },
        ],
      });
      await expect(d.service.clearForTenant(TENANT, 'system-1')).resolves.toBe(
        2,
      );
      expect(d.port.replace).toHaveBeenCalledWith(d.tx, TENANT, [], 'system-1');
      expect(d.logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'iam.ip_access_rules.rescue',
          tenantId: TENANT,
        }),
        expect.any(String),
      );
    });
  });

  describe('put', () => {
    const put = (d: ReturnType<typeof build>, body: any, ip = '190.129.1.1') =>
      runWithTenant(TENANT, () => d.service.put({ rules: body }, actor, ip));

    it('reemplaza las reglas de la organización activa, con el actor', async () => {
      const d = build();
      await put(d, [
        {
          type: 'ALLOW',
          cidr: ' 190.129.0.0/16 ',
          description: 'Sede central',
        },
      ]);
      expect(d.port.replace).toHaveBeenCalledWith(
        d.tx,
        TENANT,
        [
          expect.objectContaining({
            type: 'ALLOW',
            cidr: '190.129.0.0/16',
            description: 'Sede central',
          }),
        ],
        'admin-1',
      );
    });

    it('rechaza un CIDR inválido con su motivo', async () => {
      const d = build();
      await expect(
        put(d, [{ type: 'ALLOW', cidr: '190.129.0.0/99' }]),
      ).rejects.toMatchObject({
        status: 422,
        reason: IamErrorReason.IP_RULE_CIDR_INVALID,
      });
      expect(d.port.replace).not.toHaveBeenCalled();
    });

    it('rechaza una vigencia que termina antes de empezar', async () => {
      const d = build();
      await expect(
        put(d, [
          {
            type: 'ALLOW',
            cidr: '190.129.0.0/16',
            validFrom: '2026-12-01T00:00:00Z',
            validTo: '2026-11-01T00:00:00Z',
          },
        ]),
      ).rejects.toMatchObject({
        reason: IamErrorReason.IP_RULE_VALIDITY_INVALID,
      });
    });

    it('no guarda un conjunto que deja fuera el origen de quien lo guarda', async () => {
      const d = build();
      await expect(
        put(d, [{ type: 'ALLOW', cidr: '10.0.0.0/8' }], '190.129.1.1'),
      ).rejects.toMatchObject({
        status: 422,
        reason: IamErrorReason.IP_RULES_WOULD_LOCK_OUT_ACTOR,
      });
      expect(d.port.replace).not.toHaveBeenCalled();
    });

    it('un conjunto vacío quita la restricción de red', async () => {
      const d = build();
      await put(d, []);
      expect(d.port.replace).toHaveBeenCalledWith(d.tx, TENANT, [], 'admin-1');
    });

    it('una regla futura que incluye al origen no encierra a nadie', async () => {
      const d = build();
      await expect(
        put(d, [
          {
            type: 'ALLOW',
            cidr: '190.129.0.0/16',
            validFrom: new Date(Date.now() + 86_400_000).toISOString(),
          },
        ]),
      ).resolves.toBeDefined();
    });

    it('N2: un ALLOW programado para mañana que deja fuera al origen se rechaza AHORA (antes pasaba el chequeo y encerraba a todos después)', async () => {
      const d = build();
      await expect(
        put(d, [
          {
            type: 'ALLOW',
            cidr: '192.0.2.1/32',
            validFrom: new Date(Date.now() + 86_400_000).toISOString(),
          },
        ]),
      ).rejects.toMatchObject({
        status: 422,
        reason: IamErrorReason.IP_RULES_WOULD_LOCK_OUT_ACTOR,
      });
      expect(d.port.replace).not.toHaveBeenCalled();
    });

    it('N2: un DENY futuro sobre la red del actor también se rechaza', async () => {
      const d = build();
      await expect(
        put(d, [
          {
            type: 'DENY',
            cidr: '190.129.0.0/16',
            validFrom: new Date(Date.now() + 3 * 86_400_000).toISOString(),
          },
        ]),
      ).rejects.toMatchObject({
        reason: IamErrorReason.IP_RULES_WOULD_LOCK_OUT_ACTOR,
      });
    });
  });
});
