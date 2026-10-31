import type { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../common';
import { GovernanceStepUpGate } from './governance-step-up.gate';
import type { SupportStepUpPort } from './support-access-context.ports';

const em = {} as EntityManager;
const actor = (sessionId?: string): AuthenticatedUser =>
  ({ id: 'u1', roles: ['SECURITY_ADMIN'], sessionId }) as AuthenticatedUser;

function gate(port?: Partial<SupportStepUpPort>): GovernanceStepUpGate {
  return new GovernanceStepUpGate(port as SupportStepUpPort | undefined);
}

async function reasonOf(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
    return undefined;
  } catch (err) {
    return {
      status: (err as { getStatus(): number }).getStatus(),
      reason: (err as { reason?: string }).reason,
      details: (err as { details?: unknown }).details,
    };
  }
}

describe('GovernanceStepUpGate', () => {
  it('deja pasar un sello fresco', async () => {
    const g = gate({ ageMinutes: async () => 3 });
    await expect(g.assertFresh(em, actor('s1'))).resolves.toBeUndefined();
  });

  it('sin sello: 403 STEP_UP_REQUIRED con maxAgeMinutes y enrolled', async () => {
    const g = gate({
      ageMinutes: async () => null,
      isEnrolled: async () => true,
    });
    expect(await reasonOf(g.assertFresh(em, actor('s1'), 15))).toEqual({
      status: 403,
      reason: 'STEP_UP_REQUIRED',
      details: { maxAgeMinutes: 15, enrolled: true },
    });
  });

  it('un sello más viejo que el máximo también pide el paso', async () => {
    const g = gate({
      ageMinutes: async () => 11,
      isEnrolled: async () => false,
    });
    expect(await reasonOf(g.assertFresh(em, actor('s1')))).toMatchObject({
      status: 403,
      reason: 'STEP_UP_REQUIRED',
      details: { maxAgeMinutes: 10, enrolled: false },
    });
  });

  it('sin sesión en el token pide el paso (no se puede sellar)', async () => {
    const g = gate({
      ageMinutes: async () => 1,
      isEnrolled: async () => false,
    });
    expect(await reasonOf(g.assertFresh(em, actor()))).toMatchObject({
      reason: 'STEP_UP_REQUIRED',
    });
  });

  it('falla cerrado cuando el almacén no responde', async () => {
    const g = gate({ ageMinutes: async () => undefined });
    expect(await reasonOf(g.assertFresh(em, actor('s1')))).toMatchObject({
      status: 403,
      reason: 'STEP_UP_UNAVAILABLE',
    });
  });

  it('falla cerrado cuando no hay puerto de paso extra', async () => {
    expect(await reasonOf(gate().assertFresh(em, actor('s1')))).toMatchObject({
      reason: 'STEP_UP_UNAVAILABLE',
    });
  });

  it('acota el máximo de edad al rango permitido', async () => {
    const g = gate({
      ageMinutes: async () => null,
      isEnrolled: async () => false,
    });
    expect(await reasonOf(g.assertFresh(em, actor('s1'), 9999))).toMatchObject({
      details: { maxAgeMinutes: 60 },
    });
  });
});
