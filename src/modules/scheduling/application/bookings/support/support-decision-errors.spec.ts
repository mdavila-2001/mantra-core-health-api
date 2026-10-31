import { ForbiddenException } from '@nestjs/common';
import {
  ConflictException,
  DomainException,
  PreconditionFailedException,
} from '../../../../../common';
import {
  SUPPORT_DENIED_MESSAGE,
  supportAnswerToException,
} from './support-decision-errors';

const challenge = (
  kind: string,
  details: Record<string, unknown> = {},
  reason = 'X',
) =>
  supportAnswerToException({
    allowed: false,
    effect: 'CHALLENGE',
    reason,
    challenge: { kind: kind as any, details },
  });

describe('supportAnswerToException (traducción de CHALLENGE y DENY, §8.4)', () => {
  it('una acción permitida no produce excepción', () => {
    expect(
      supportAnswerToException({ allowed: true, reason: 'ALLOWED' }),
    ).toBeUndefined();
  });

  it('CHALLENGE(REASON) ⇒ 422 REASON_REQUIRED con el largo mínimo', () => {
    const e = challenge('REASON', {
      minLength: 10,
      otro: 'no sale',
    }) as PreconditionFailedException;
    expect(e).toBeInstanceOf(PreconditionFailedException);
    expect(e.getStatus()).toBe(422);
    expect(e.reason).toBe('REASON_REQUIRED');
    expect(e.details).toEqual({
      failureCode: 'REASON_REQUIRED',
      minLength: 10,
    });
  });

  it('CHALLENGE(STEP_UP) y STEP_UP_ENROLL ⇒ 403 STEP_UP_REQUIRED con { maxAgeMinutes, enrolled }', () => {
    for (const kind of ['STEP_UP', 'STEP_UP_ENROLL']) {
      const e = challenge(kind, {
        maxAgeMinutes: 10,
        enrolled: kind === 'STEP_UP',
        basura: 1,
      }) as DomainException;
      expect(e.getStatus()).toBe(403);
      expect(e.reason).toBe('STEP_UP_REQUIRED');
      expect(e.details).toEqual({
        maxAgeMinutes: 10,
        enrolled: kind === 'STEP_UP',
      });
    }
  });

  it('CHALLENGE(APPROVAL) ⇒ 403 APPROVAL_REQUIRED con { approverKind, atom }', () => {
    const e = challenge('APPROVAL', {
      approverKind: 'DOCTOR',
      atom: 'agenda.appointment.cancel',
      ttlMinutes: 60,
    }) as DomainException;
    expect(e.getStatus()).toBe(403);
    expect(e.reason).toBe('APPROVAL_REQUIRED');
    expect(e.details).toMatchObject({
      approverKind: 'DOCTOR',
      atom: 'agenda.appointment.cancel',
    });
  });

  it('una aprobación ya consumida sigue siendo 403 APPROVAL_REQUIRED y dice por qué', () => {
    const e = challenge('APPROVAL', {
      approverKind: 'DOCTOR',
      approvalProblem: 'FOUR_EYES_ALREADY_CONSUMED',
    }) as DomainException;
    expect(e.getStatus()).toBe(403);
    expect(e.details?.approvalProblem).toBe('FOUR_EYES_ALREADY_CONSUMED');
  });

  it('F-01: una aprobación de OTRA acción ⇒ 409 FOUR_EYES_PAYLOAD_CHANGED', () => {
    const e = challenge('APPROVAL', {
      approvalProblem: 'FOUR_EYES_PAYLOAD_CHANGED',
    }) as ConflictException;
    expect(e).toBeInstanceOf(ConflictException);
    expect(e.getStatus()).toBe(409);
    expect(e.reason).toBe('FOUR_EYES_PAYLOAD_CHANGED');
  });

  it('DENY ⇒ 403 con el mensaje de siempre; el motivo sale solo si es de la persona u organización', () => {
    const horario = supportAnswerToException({
      allowed: false,
      effect: 'DENY',
      reason: 'TIME_WINDOW',
    }) as ForbiddenException;
    expect(horario).toBeInstanceOf(ForbiddenException);
    expect(horario.message).toBe(SUPPORT_DENIED_MESSAGE);
    expect((horario.getResponse() as any).details).toEqual({
      reason: 'TIME_WINDOW',
    });
  });

  it('un DENY estructural o de pacientes NO revela el motivo (no se filtra info de otros)', () => {
    for (const reason of [
      'NO_ENGAGEMENT',
      'DOCTOR_NOT_ACCEPTED',
      'NO_COVERING_GRANT',
      'TARGET_OUTSIDE_TENANT',
      'PATIENT_EXCLUDED',
      'EXPLICIT_DENY',
    ]) {
      const e = supportAnswerToException({
        allowed: false,
        reason,
      }) as ForbiddenException;
      expect(e.message).toBe(SUPPORT_DENIED_MESSAGE);
      expect((e.getResponse() as any).details).toBeUndefined();
    }
  });
});
