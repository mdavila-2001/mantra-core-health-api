import { ForbiddenException } from '@nestjs/common';
import {
  ConflictException,
  DomainException,
  PreconditionFailedException,
} from '../../../common';
import { supportDecisionToException } from './support-decision-http';

const MSG = 'No puede buscar pacientes en esta organización';
const challenge = (kind: string, details: Record<string, unknown> = {}) =>
  supportDecisionToException(
    {
      allowed: false,
      effect: 'CHALLENGE',
      reason: 'X' as any,
      challenge: { kind: kind as any, details },
    },
    MSG,
  );

describe('supportDecisionToException (PEP de delegated_access, community y búsqueda)', () => {
  it('permitido: nada que lanzar', () => {
    expect(
      supportDecisionToException(
        { allowed: true, reason: 'ALLOWED' as any },
        MSG,
      ),
    ).toBeUndefined();
  });
  it('CHALLENGE(REASON) 422, STEP_UP 403, APPROVAL 403 y aprobación de otra acción 409', () => {
    expect(
      (
        challenge('REASON', { minLength: 5 }) as PreconditionFailedException
      ).getStatus(),
    ).toBe(422);
    const stepUp = challenge('STEP_UP_ENROLL', {
      maxAgeMinutes: 10,
      enrolled: false,
    }) as DomainException;
    expect([stepUp.getStatus(), stepUp.reason, stepUp.details]).toEqual([
      403,
      'STEP_UP_REQUIRED',
      { maxAgeMinutes: 10, enrolled: false },
    ]);
    const approval = challenge('APPROVAL', {
      approverKind: 'SECOND_APPROVER',
      atom: 'billing.receipt.void',
      secreto: 1,
    }) as DomainException;
    expect([approval.getStatus(), approval.reason, approval.details]).toEqual([
      403,
      'APPROVAL_REQUIRED',
      { approverKind: 'SECOND_APPROVER', atom: 'billing.receipt.void' },
    ]);
    const changed = challenge('APPROVAL', {
      approvalProblem: 'FOUR_EYES_PAYLOAD_CHANGED',
    }) as ConflictException;
    expect([changed.getStatus(), changed.reason]).toEqual([
      409,
      'FOUR_EYES_PAYLOAD_CHANGED',
    ]);
  });
  it('DENY: el mensaje del PEP, y el motivo solo si es de la persona u organización', () => {
    const own = supportDecisionToException(
      { allowed: false, effect: 'DENY', reason: 'LIMIT_EXCEEDED' as any },
      MSG,
    ) as ForbiddenException;
    expect(own.message).toBe(MSG);
    expect((own.getResponse() as any).details).toEqual({
      reason: 'LIMIT_EXCEEDED',
    });
    const other = supportDecisionToException(
      { allowed: false, effect: 'DENY', reason: 'PATIENT_EXCLUDED' as any },
      MSG,
    ) as ForbiddenException;
    expect((other.getResponse() as any).details).toBeUndefined();
  });
});
