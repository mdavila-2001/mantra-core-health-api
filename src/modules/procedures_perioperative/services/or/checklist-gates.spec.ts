import { describe, expect, it, jest } from '@jest/globals';
import { assertChecklistPhase } from './checklist-gates';

const reader = (checklist: unknown) => ({
  findSafetyChecklistByCase: jest.fn<any>().mockResolvedValue(checklist),
});

describe('check-list OMS bloqueante (§F4.3)', () => {
  it('sin check-list: las tres fases bloquean con su reason', async () => {
    for (const [gate, reason] of [
      ['SIGN_IN', 'CHECKLIST_SIGN_IN_REQUIRED'],
      ['TIME_OUT', 'CHECKLIST_TIME_OUT_REQUIRED'],
      ['SIGN_OUT', 'CHECKLIST_SIGN_OUT_REQUIRED'],
    ] as const) {
      await expect(
        assertChecklistPhase(reader(null), {}, 'c1', gate),
      ).rejects.toMatchObject({ status: 422, reason });
    }
  });

  it('Entrada hecha deja pasar la inducción pero no la incisión', async () => {
    const r = reader({ signInCompletedAt: new Date() });
    await expect(
      assertChecklistPhase(r, {}, 'c1', 'SIGN_IN'),
    ).resolves.toBeUndefined();
    await expect(
      assertChecklistPhase(r, {}, 'c1', 'TIME_OUT'),
    ).rejects.toMatchObject({ reason: 'CHECKLIST_TIME_OUT_REQUIRED' });
  });
});
