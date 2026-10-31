import { jest } from '@jest/globals';
import { SupportApprovalGate } from './support-approval-gate';
import { DELEG } from '../delegated_access.concepts';
import { actionPayload, hashPayload } from '../domain/support-four-eyes';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const NOW = new Date('2026-11-03T14:30:00Z');

const A4 = {
  atom: 'agenda.appointment.cancel',
  practitionerRoleAssignmentId: 'pra-suarez',
  healthcareServiceId: 'svc-cardio',
  patientProfileId: 'pac-mateo',
  appointmentStartAt: new Date('2026-11-04T13:00:00Z'),
};

const approvedRow = (over: Record<string, unknown> = {}) => {
  const payload = actionPayload(A4);
  return {
    id: 'ap-1',
    tenantId: 't1',
    requesterUserId: 'marcos',
    kindConceptId: DELEG.FOUR_EYES_KIND_ACTION,
    permissionCode: A4.atom,
    statusConceptId: DELEG.FOUR_EYES_APPROVED,
    payloadJson: payload,
    payloadHash: hashPayload(payload),
    approvedUntil: new Date(NOW.getTime() + 30 * 60_000),
    consumedAt: null,
    ...over,
  };
};

const question = (over: Record<string, unknown> = {}) => ({
  tenantId: 't1',
  userId: 'marcos',
  atom: A4.atom,
  approvalId: 'ap-1',
  target: {
    practitionerRoleAssignmentIds: ['pra-suarez', 'pra-suarez-2'],
    healthcareServiceId: A4.healthcareServiceId,
    patientProfileId: A4.patientProfileId,
    appointmentStartAt: A4.appointmentStartAt,
  },
  now: NOW,
  ...over,
});

function build(row: any) {
  const repo = {
    findById: mockFn().mockResolvedValue(row),
    expireApproved: mockFn().mockResolvedValue(true),
    consume: mockFn().mockResolvedValue(true),
  };
  return { gate: new SupportApprovalGate(repo as any), repo };
}

describe('SupportApprovalGate.check', () => {
  it('vale: aprobada, vigente, sin consumir, misma persona, átomo y cuerpo exacto de la acción', async () => {
    const { gate } = build(approvedRow());
    await expect(gate.check({} as any, question() as any)).resolves.toEqual({
      ok: true,
    });
  });

  it('F-01: usada sobre OTRA cita (A1) → el cuerpo cambió', async () => {
    const { gate } = build(approvedRow());
    const other = question({
      target: {
        practitionerRoleAssignmentIds: ['pra-suarez'],
        healthcareServiceId: 'svc-cardio',
        patientProfileId: 'pac-otro',
        appointmentStartAt: new Date('2026-11-04T15:00:00Z'),
      },
    });
    await expect(gate.check({} as any, other as any)).resolves.toEqual({
      ok: false,
      problem: 'FOUR_EYES_PAYLOAD_CHANGED',
    });
  });

  it('F-01: a los 61 min venció: no vale y la solicitud pasa a EXPIRED', async () => {
    const { gate, repo } = build(
      approvedRow({ approvedUntil: new Date(NOW.getTime() - 60_000) }),
    );
    await expect(gate.check({} as any, question() as any)).resolves.toEqual({
      ok: false,
      problem: 'FOUR_EYES_EXPIRED',
    });
    expect(repo.expireApproved).toHaveBeenCalledWith({}, 'ap-1', NOW);
  });

  it('C-03: ya consumida → problema FOUR_EYES_ALREADY_CONSUMED', async () => {
    const { gate } = build(
      approvedRow({ consumedAt: new Date(NOW.getTime() - 5_000) }),
    );
    await expect(gate.check({} as any, question() as any)).resolves.toEqual({
      ok: false,
      problem: 'FOUR_EYES_ALREADY_CONSUMED',
    });
  });

  it('pendiente o rechazada: no aprobada', async () => {
    const { gate } = build(
      approvedRow({ statusConceptId: DELEG.FOUR_EYES_PENDING }),
    );
    await expect(gate.check({} as any, question() as any)).resolves.toEqual({
      ok: false,
      problem: 'FOUR_EYES_NOT_APPROVED',
    });
  });

  it('una aprobación inexistente, de otra persona, de otro átomo o de otro tipo se comporta como «no hay aprobación» (sin problema que revele nada)', async () => {
    for (const row of [
      null,
      approvedRow({ requesterUserId: 'otra-persona' }),
      approvedRow({ permissionCode: 'agenda.appointment.view' }),
      approvedRow({ kindConceptId: DELEG.FOUR_EYES_KIND_GRANT_CHANGE }),
    ]) {
      const { gate } = build(row);
      await expect(gate.check({} as any, question() as any)).resolves.toEqual({
        ok: false,
      });
    }
  });

  it('un cuerpo que ya no corresponde a su hash (manipulado) no vale', async () => {
    const { gate } = build(
      approvedRow({
        payloadJson: { ...actionPayload(A4), patientProfileId: 'pac-trucado' },
      }),
    );
    await expect(gate.check({} as any, question() as any)).resolves.toEqual({
      ok: false,
      problem: 'FOUR_EYES_PAYLOAD_CHANGED',
    });
  });

  it('consumir delega en la actualización atómica del repositorio', async () => {
    const { gate, repo } = build(approvedRow());
    await expect(gate.consume({} as any, 'ap-1', NOW)).resolves.toBe(true);
    expect(repo.consume).toHaveBeenCalledWith({}, 'ap-1', NOW);
  });
});
