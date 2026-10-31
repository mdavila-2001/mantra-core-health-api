import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { BookingAccess } from './booking-access';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const booking: any = {
  id: 'b1',
  tenantId: 'tenant-1',
  resourceId: 'res-1',
  careSpaceId: 'sala-105',
  healthcareServiceId: 'svc-consulta',
  patientProfileId: 'pac-luis',
  bookableSlotId: 'slot-1',
};
const ANA = {
  id: 'user-ana',
  roles: ['SUPPORT_STAFF'],
  tenantIds: ['tenant-1'],
} as any;

function build(answer: any) {
  const tx: any = {
    findOne: mockFn().mockResolvedValue({
      startAt: new Date('2026-11-04T14:30:00Z'),
    }),
  };
  const policy = {
    decide: mockFn().mockResolvedValue(answer),
    decideWithContext: mockFn().mockResolvedValue(answer),
  };
  const catalogRepo = {
    findResourceById: mockFn().mockResolvedValue({
      tenantId: 'tenant-1',
      resourceRefType: 'health_practitioner_profiles',
      resourceRefId: 'prof-rojas',
    }),
  };
  const access = new BookingAccess(
    {} as any,
    catalogRepo as any,
    {} as any,
    {} as any,
    policy as any,
  );
  return { access, policy, tx };
}

describe('BookingAccess: contexto y desafíos de la política (gobierno de accesos)', () => {
  it('pasa el paciente y el motivo ya validado a la política (decideWithContext)', async () => {
    const d = build({ allowed: true, reason: 'ALLOWED', grantId: 'g1' });
    await d.access.assertSupportMayAct(d.tx, booking, ANA, 'schedule.cancel', {
      reasonText: 'El paciente avisó que no viene',
    });
    expect(d.policy.decide).not.toHaveBeenCalled();
    const [question, hooks] = d.policy.decideWithContext.mock.calls[0];
    expect(question).toMatchObject({
      action: 'schedule.cancel',
      practitionerProfileId: 'prof-rojas',
      tenantId: 'tenant-1',
    });
    expect(hooks.context).toEqual({
      patientProfileId: 'pac-luis',
      proof: { reasonText: 'El paciente avisó que no viene' },
    });
  });

  it('la hora de la cita se lee del cupo SOLO cuando la política la pide (completeContext perezoso)', async () => {
    const d = build({ allowed: true, reason: 'ALLOWED' });
    await d.access.assertSupportMayAct(d.tx, booking, ANA, 'schedule.cancel');
    expect(d.tx.findOne).not.toHaveBeenCalled();
    const [, hooks] = d.policy.decideWithContext.mock.calls[0];
    await expect(hooks.completeContext()).resolves.toEqual({
      appointmentStartAt: new Date('2026-11-04T14:30:00Z'),
    });
    expect(d.tx.findOne).toHaveBeenCalledTimes(1);
  });

  it('CHALLENGE(APPROVAL) ⇒ 403 APPROVAL_REQUIRED y no sella el acceso', async () => {
    const d = build({
      allowed: false,
      effect: 'CHALLENGE',
      reason: 'APPROVAL_REQUIRED',
      challenge: { kind: 'APPROVAL', details: { approverKind: 'DOCTOR' } },
    });
    await expect(
      d.access.assertSupportMayAct(d.tx, booking, ANA, 'schedule.cancel'),
    ).rejects.toMatchObject({ reason: 'APPROVAL_REQUIRED' });
  });

  it('CHALLENGE(REASON) ⇒ 422 REASON_REQUIRED', async () => {
    const d = build({
      allowed: false,
      effect: 'CHALLENGE',
      reason: 'REASON_REQUIRED',
      challenge: { kind: 'REASON', details: { minLength: 5 } },
    });
    await expect(
      d.access.assertSupportMayAct(d.tx, booking, ANA, 'schedule.cancel'),
    ).rejects.toMatchObject({ reason: 'REASON_REQUIRED' });
  });

  it('DENY ⇒ ForbiddenException con el mensaje de siempre', async () => {
    const d = build({ allowed: false, reason: 'NO_COVERING_GRANT' });
    await expect(
      d.access.assertSupportMayAct(d.tx, booking, ANA, 'schedule.cancel'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('para listar, un desafío deja la cita fuera (no se enumera lo que pediría uno)', async () => {
    const d = build({
      allowed: false,
      effect: 'CHALLENGE',
      reason: 'APPROVAL_REQUIRED',
      challenge: { kind: 'APPROVAL', details: {} },
    });
    const rows = [{ booking }];
    await expect(
      d.access.keepVisibleToSupport(d.tx, rows, ANA),
    ).resolves.toEqual([]);
  });

  it('el destino del cupo (horizonte) viaja como newAppointmentStartAt al reservar', async () => {
    const d = build({ allowed: true, reason: 'ALLOWED' });
    await d.access.assertSupportMayOnSlot(
      d.tx,
      {
        resourceId: 'res-1',
        careSpaceId: 'sala-1',
        healthcareServiceId: 'svc',
        startAt: new Date('2026-12-01T13:00:00Z'),
      },
      ANA,
      'schedule.create',
    );
    const [, hooks] = d.policy.decideWithContext.mock.calls[0];
    expect(hooks.context).toEqual({
      newAppointmentStartAt: new Date('2026-12-01T13:00:00Z'),
    });
  });
});
