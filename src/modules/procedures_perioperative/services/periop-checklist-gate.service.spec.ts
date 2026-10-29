import { jest } from '@jest/globals';
import { PeriopChecklistGateService } from './periop-checklist-gate.service';
import { ProceduresPerioperativeErrorReason as Reason } from '../procedures_perioperative.error-reasons';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const CASE = '55555555-5555-5555-5555-555555555555';
const at = new Date('2026-11-02T10:00:00Z');

function build(checklist: unknown) {
  const preopRepo = {
    findChecklistByCase: mockFn().mockResolvedValue(checklist),
  };
  return { gate: new PeriopChecklistGateService(preopRepo as any), preopRepo };
}

describe('PeriopChecklistGateService · INV-39', () => {
  it.each([
    ['SIGN_IN', Reason.CHECKLIST_SIGN_IN_REQUIRED],
    ['TIME_OUT', Reason.CHECKLIST_TIME_OUT_REQUIRED],
    ['SIGN_OUT', Reason.CHECKLIST_SIGN_OUT_REQUIRED],
  ] as const)(
    'sin la fase %s se responde 422 con su reason',
    async (phase, reason) => {
      const { gate } = build({});
      await expect(
        gate.assertPhase({} as any, CASE, phase),
      ).rejects.toMatchObject({
        status: 422,
        reason,
        details: { phase, hasChecklist: true },
      });
    },
  );

  it('un caso sin check-list tampoco pasa', async () => {
    const { gate } = build(null);
    await expect(
      gate.assertPhase({} as any, CASE, 'SIGN_IN'),
    ).rejects.toMatchObject({
      status: 422,
      reason: Reason.CHECKLIST_SIGN_IN_REQUIRED,
      details: { hasChecklist: false },
    });
  });

  it('cada fase mira su propia fecha: la Entrada completa no habilita la Pausa', async () => {
    const { gate } = build({ signInCompletedAt: at });
    await expect(
      gate.assertPhase({} as any, CASE, 'SIGN_IN'),
    ).resolves.toBeUndefined();
    await expect(
      gate.assertPhase({} as any, CASE, 'TIME_OUT'),
    ).rejects.toMatchObject({
      reason: Reason.CHECKLIST_TIME_OUT_REQUIRED,
    });
    await expect(
      gate.assertPhase({} as any, CASE, 'SIGN_OUT'),
    ).rejects.toMatchObject({
      reason: Reason.CHECKLIST_SIGN_OUT_REQUIRED,
    });
  });

  it('con las tres fases completas todas pasan', async () => {
    const { gate } = build({
      signInCompletedAt: at,
      timeOutCompletedAt: at,
      signOutCompletedAt: at,
    });
    for (const phase of ['SIGN_IN', 'TIME_OUT', 'SIGN_OUT'] as const) {
      await expect(
        gate.assertPhase({} as any, CASE, phase),
      ).resolves.toBeUndefined();
    }
  });
});
