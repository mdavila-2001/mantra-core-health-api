import { jest } from '@jest/globals';
import {
  GOVERNANCE_RULES_CACHE_MAX_TTL_SEC,
  GOVERNANCE_RULES_INVALIDATE_CHANNEL,
  GOVERNANCE_RULES_STALE_MAX_SEC,
  SupportGovernanceRules,
  rulesCacheTtlSeconds,
  toRuleFacts,
} from './support-governance-rules.reader';
import { DELEG } from '../delegated_access.concepts';
import { evaluateSupportAccessV2 } from '../domain';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const NOW = new Date('2026-11-03T14:30:00Z');
const logger = { setContext: mockFn(), warn: mockFn() };

const row = (over: Record<string, unknown>) =>
  ({ id: 'r1', permissionPattern: 'billing.*', ...over }) as any;

describe('toRuleFacts', () => {
  it('DENY_PERMISSION con mensaje, REQUIRE_CONDITION con su condición y FIELD_FLOOR con su piso', () => {
    expect(
      toRuleFacts(
        row({
          ruleKindConceptId: DELEG.GOV_RULE_DENY_PERMISSION,
          roleTemplateCode: 'FRONT_DESK',
          messageText: 'Recepción no cobra',
        }),
      ),
    ).toMatchObject({
      kind: 'DENY_PERMISSION',
      roleTemplateCode: 'FRONT_DESK',
      message: 'Recepción no cobra',
    });
    expect(
      toRuleFacts(
        row({
          ruleKindConceptId: DELEG.GOV_RULE_REQUIRE_CONDITION,
          ruleJson: {
            condition: { schemaVersion: 1, network: { require: 'ORG_RULES' } },
          },
        }),
      ),
    ).toMatchObject({
      kind: 'REQUIRE_CONDITION',
      condition: { network: { require: 'ORG_RULES' } },
    });
    expect(
      toRuleFacts(
        row({
          ruleKindConceptId: DELEG.GOV_RULE_FIELD_FLOOR,
          ruleJson: { maxVisibility: 'PARTIAL' },
        }),
      ),
    ).toMatchObject({ kind: 'FIELD_FLOOR', maxVisibility: 'PARTIAL' });
  });

  it('CEILING no actúa al decidir (solo al escribir y en el barrido)', () => {
    expect(
      toRuleFacts(row({ ruleKindConceptId: DELEG.GOV_RULE_CEILING })),
    ).toBeUndefined();
  });

  it('falla cerrado: una condición rota cierra el átomo y un piso ilegible anula el campo', () => {
    const broken = toRuleFacts(
      row({
        ruleKindConceptId: DELEG.GOV_RULE_REQUIRE_CONDITION,
        ruleJson: { condition: 'x' },
      }),
    );
    const verdict = evaluateSupportAccessV2(
      [
        {
          engagementId: 'e',
          active: true,
          userId: 'u',
          acceptances: [
            { practitionerProfileId: 'p', mayReplyOnBehalf: false },
          ],
          grants: [
            {
              grantId: 'g',
              targetKind: 'ALL',
              active: true,
              expansionMode: 'DYNAMIC',
              actions: ['billing.collect'],
            },
          ],
        },
      ],
      {
        action: 'billing.collect',
        practitionerProfileId: 'p',
        practitionerRoleAssignmentIds: ['r'],
      },
      NOW,
      { rules: [broken!] },
    );
    expect(verdict.decision.allowed).toBe(false);
    expect(verdict.decision.reason).toBe('CONDITION_UNREADABLE');
    expect(
      toRuleFacts(
        row({
          ruleKindConceptId: DELEG.GOV_RULE_FIELD_FLOOR,
          ruleJson: { maxVisibility: '???' },
        }),
      ),
    ).toMatchObject({ maxVisibility: 'NULLIFY' });
  });
});

describe('SupportGovernanceRules (caché por organización)', () => {
  const rule = row({
    ruleKindConceptId: DELEG.GOV_RULE_DENY_PERMISSION,
    messageText: 'no',
  });

  it('lee una vez y sirve de la caché dentro del TTL: sin consultas en régimen', async () => {
    const repo = { findActiveForTenant: mockFn().mockResolvedValue([rule]) };
    const reader = new SupportGovernanceRules(repo as any, logger as any);
    await reader.forTenant({} as any, 't1', NOW);
    await reader.forTenant({} as any, 't1', new Date(NOW.getTime() + 10_000));
    expect(repo.findActiveForTenant).toHaveBeenCalledTimes(1);
    await reader.forTenant({} as any, 't1', new Date(NOW.getTime() + 31_000));
    expect(repo.findActiveForTenant).toHaveBeenCalledTimes(2);
  });

  it('escribir una regla invalida la caché: el efecto es inmediato (G-02)', async () => {
    const repo = {
      findActiveForTenant: mockFn()
        .mockResolvedValueOnce([rule])
        .mockResolvedValueOnce([]),
    };
    const reader = new SupportGovernanceRules(repo as any, logger as any);
    expect(await reader.forTenant({} as any, 't1', NOW)).toHaveLength(1);
    reader.invalidate('t1');
    expect(await reader.forTenant({} as any, 't1', NOW)).toHaveLength(0);
  });

  it('cada organización tiene su caché', async () => {
    const repo = { findActiveForTenant: mockFn().mockResolvedValue([rule]) };
    const reader = new SupportGovernanceRules(repo as any, logger as any);
    await reader.forTenant({} as any, 't1', NOW);
    await reader.forTenant({} as any, 't2', NOW);
    expect(repo.findActiveForTenant).toHaveBeenCalledTimes(2);
  });

  it('si la lectura falla: usa la última lista conocida; sin ninguna, deja que el error salga (no inventa una lista vacía)', async () => {
    const repo = {
      findActiveForTenant: mockFn()
        .mockResolvedValueOnce([rule])
        .mockRejectedValue(new Error('db')),
    };
    const reader = new SupportGovernanceRules(repo as any, logger as any);
    await reader.forTenant({} as any, 't1', NOW);
    expect(
      await reader.forTenant({} as any, 't1', new Date(NOW.getTime() + 60_000)),
    ).toHaveLength(1);
    await expect(reader.forTenant({} as any, 'tx', NOW)).rejects.toThrow('db');
  });

  it('TTL por ajuste; lo inválido deja el de siempre', () => {
    expect(
      rulesCacheTtlSeconds({ SUPPORT_GOVERNANCE_RULES_CACHE_TTL_SEC: '5' }),
    ).toBe(5);
    expect(
      rulesCacheTtlSeconds({ SUPPORT_GOVERNANCE_RULES_CACHE_TTL_SEC: 'abc' }),
    ).toBe(30);
    expect(rulesCacheTtlSeconds({})).toBe(30);
  });
});

describe('SEG A-M8: caché L1 acotada, respaldo con tope e invalidación entre réplicas', () => {
  const rule = {
    id: 'r1',
    ruleKindConceptId: DELEG.GOV_RULE_DENY_PERMISSION,
    permissionPattern: 'billing.*',
  } as any;

  it('el TTL tiene un tope de 60 s aunque el ajuste pida más (antes hasta 3600 s)', () => {
    expect(GOVERNANCE_RULES_CACHE_MAX_TTL_SEC).toBe(60);
    expect(
      rulesCacheTtlSeconds({ SUPPORT_GOVERNANCE_RULES_CACHE_TTL_SEC: '3600' }),
    ).toBe(60);
    expect(
      rulesCacheTtlSeconds({ SUPPORT_GOVERNANCE_RULES_CACHE_TTL_SEC: '61' }),
    ).toBe(60);
    expect(
      rulesCacheTtlSeconds({ SUPPORT_GOVERNANCE_RULES_CACHE_TTL_SEC: '45' }),
    ).toBe(45);
    // Lo fuera de rango sigue cayendo al valor de siempre.
    expect(
      rulesCacheTtlSeconds({ SUPPORT_GOVERNANCE_RULES_CACHE_TTL_SEC: '9999' }),
    ).toBe(60);
    expect(
      rulesCacheTtlSeconds({ SUPPORT_GOVERNANCE_RULES_CACHE_TTL_SEC: '-1' }),
    ).toBe(30);
  });

  it('si la base falla, la lista vieja sirve solo hasta un tope; pasado el tope el error sale (no se siguen usando reglas viejas)', async () => {
    const repo = {
      findActiveForTenant: mockFn()
        .mockResolvedValueOnce([rule])
        .mockRejectedValue(new Error('db')),
    };
    const reader = new SupportGovernanceRules(repo as any, logger as any);
    await reader.forTenant({} as any, 't1', NOW);
    const within = new Date(
      NOW.getTime() + (GOVERNANCE_RULES_STALE_MAX_SEC - 1) * 1000,
    );
    expect(await reader.forTenant({} as any, 't1', within)).toHaveLength(1);
    const beyond = new Date(
      NOW.getTime() + (GOVERNANCE_RULES_STALE_MAX_SEC + 1) * 1000,
    );
    await expect(reader.forTenant({} as any, 't1', beyond)).rejects.toThrow(
      'db',
    );
  });

  describe('invalidación entre réplicas (Redis pub/sub)', () => {
    function withRedis() {
      const handlers: Record<string, (channel: string, msg: string) => void> =
        {};
      const subscriber = {
        on: mockFn((event: string, fn: any) => {
          handlers[event] = fn;
        }),
        subscribe: mockFn().mockResolvedValue(1),
        quit: mockFn().mockResolvedValue('OK'),
      };
      const redis = {
        publish: mockFn().mockResolvedValue(1),
        duplicate: mockFn().mockReturnValue(subscriber),
      };
      return { redis, subscriber, handlers };
    }

    it('invalidar publica en el canal para que las otras réplicas descarten su caché', async () => {
      const r = withRedis();
      const repo = { findActiveForTenant: mockFn().mockResolvedValue([rule]) };
      const reader = new SupportGovernanceRules(
        repo as any,
        logger as any,
        r.redis as any,
      );
      reader.invalidate('t1');
      expect(r.redis.publish).toHaveBeenCalledWith(
        GOVERNANCE_RULES_INVALIDATE_CHANNEL,
        expect.stringContaining('t1'),
      );
    });

    it('un mensaje de otra réplica vacía la caché de esa organización (y «*» la de todas)', async () => {
      const r = withRedis();
      const repo = { findActiveForTenant: mockFn().mockResolvedValue([rule]) };
      const reader = new SupportGovernanceRules(
        repo as any,
        logger as any,
        r.redis as any,
      );
      await reader.onModuleInit();
      expect(r.subscriber.subscribe).toHaveBeenCalledWith(
        GOVERNANCE_RULES_INVALIDATE_CHANNEL,
      );
      await reader.forTenant({} as any, 't1', NOW);
      await reader.forTenant({} as any, 't2', NOW);
      expect(repo.findActiveForTenant).toHaveBeenCalledTimes(2);

      // Otra réplica escribió una regla de t1.
      r.handlers.message(
        GOVERNANCE_RULES_INVALIDATE_CHANNEL,
        JSON.stringify({ from: 'otra-replica', tenantId: 't1' }),
      );
      await reader.forTenant({} as any, 't1', NOW);
      await reader.forTenant({} as any, 't2', NOW);
      expect(repo.findActiveForTenant).toHaveBeenCalledTimes(3);

      r.handlers.message(
        GOVERNANCE_RULES_INVALIDATE_CHANNEL,
        JSON.stringify({ from: 'otra-replica' }),
      );
      await reader.forTenant({} as any, 't2', NOW);
      expect(repo.findActiveForTenant).toHaveBeenCalledTimes(4);
    });

    it('un mensaje ilegible no rompe nada y descarta todo por precaución', async () => {
      const r = withRedis();
      const repo = { findActiveForTenant: mockFn().mockResolvedValue([rule]) };
      const reader = new SupportGovernanceRules(
        repo as any,
        logger as any,
        r.redis as any,
      );
      await reader.onModuleInit();
      await reader.forTenant({} as any, 't1', NOW);
      r.handlers.message(GOVERNANCE_RULES_INVALIDATE_CHANNEL, 'no-es-json');
      await reader.forTenant({} as any, 't1', NOW);
      expect(repo.findActiveForTenant).toHaveBeenCalledTimes(2);
    });

    it('si Redis falla al publicar, invalidar sigue funcionando en esta réplica (el TTL acotado es el respaldo)', async () => {
      const r = withRedis();
      r.redis.publish.mockRejectedValue(new Error('redis caído'));
      const repo = { findActiveForTenant: mockFn().mockResolvedValue([rule]) };
      const reader = new SupportGovernanceRules(
        repo as any,
        logger as any,
        r.redis as any,
      );
      await reader.forTenant({} as any, 't1', NOW);
      expect(() => reader.invalidate('t1')).not.toThrow();
      await reader.forTenant({} as any, 't1', NOW);
      expect(repo.findActiveForTenant).toHaveBeenCalledTimes(2);
    });

    it('sin Redis (pruebas, generador OpenAPI) no hay suscripción ni error', async () => {
      const repo = { findActiveForTenant: mockFn().mockResolvedValue([rule]) };
      const reader = new SupportGovernanceRules(repo as any, logger as any);
      await expect(reader.onModuleInit()).resolves.toBeUndefined();
      expect(() => reader.invalidate('t1')).not.toThrow();
      await expect(reader.onModuleDestroy()).resolves.toBeUndefined();
    });
  });
});
