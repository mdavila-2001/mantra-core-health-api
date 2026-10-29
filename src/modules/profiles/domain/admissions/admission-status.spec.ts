import { describe, expect, it } from '@jest/globals';
import {
  ADMISSION_STATUS_CODES,
  ADMISSION_STATUS_CONCEPT,
  ADMISSION_TRANSITIONS,
  admissionStatusCode,
  canTransition,
  profileVerificationFor,
  targetStatus,
  visibleVerification,
  type AdmissionAction,
  type AdmissionStatusCode,
} from './admission-status';
import { PROF } from '../../profiles.concepts';

const NOW = new Date('2026-10-29T12:00:00.000Z');

describe('máquina de estados de la admisión', () => {
  const todas = Object.keys(ADMISSION_TRANSITIONS) as AdmissionAction[];

  it('cada estado tiene su concepto y se resuelve de ida y vuelta', () => {
    for (const code of ADMISSION_STATUS_CODES) {
      expect(admissionStatusCode(ADMISSION_STATUS_CONCEPT[code])).toBe(code);
    }
    expect(new Set(Object.values(ADMISSION_STATUS_CONCEPT)).size).toBe(
      ADMISSION_STATUS_CODES.length,
    );
  });

  it('un concepto desconocido no se adivina', () => {
    expect(() => admissionStatusCode('no-es-un-estado')).toThrow();
  });

  it.each<[AdmissionAction, AdmissionStatusCode, AdmissionStatusCode]>([
    ['CLAIM', 'ENVIADA', 'EN_REVISION'],
    ['REQUEST_INFO', 'EN_REVISION', 'INFORMACION_REQUERIDA'],
    ['RESUBMIT', 'INFORMACION_REQUERIDA', 'ENVIADA'],
    ['RESUBMIT', 'RECHAZADA', 'ENVIADA'],
    ['RESUBMIT', 'EXPIRADA', 'ENVIADA'],
    ['RESUBMIT', 'ABANDONADA', 'ENVIADA'],
    ['VERIFY', 'EN_REVISION', 'VERIFICADA'],
    ['REJECT', 'EN_REVISION', 'RECHAZADA'],
    ['SUSPEND', 'VERIFICADA', 'SUSPENDIDA'],
    ['REINSTATE', 'SUSPENDIDA', 'VERIFICADA'],
    ['EXPIRE', 'VERIFICADA', 'EXPIRADA'],
    ['WITHDRAW', 'ENVIADA', 'RETIRADA'],
    ['WITHDRAW', 'INFORMACION_REQUERIDA', 'RETIRADA'],
    ['RELEASE', 'EN_REVISION', 'ENVIADA'],
    ['ABANDON', 'INFORMACION_REQUERIDA', 'ABANDONADA'],
  ])('%s desde %s es válida y lleva a %s', (action, from, to) => {
    expect(canTransition(action, from)).toBe(true);
    expect(targetStatus(action)).toBe(to);
  });

  it('toda otra combinación acción/estado es inválida', () => {
    for (const action of todas) {
      for (const from of ADMISSION_STATUS_CODES) {
        const valida = ADMISSION_TRANSITIONS[action].from.includes(from);
        expect(canTransition(action, from)).toBe(valida);
      }
    }
  });

  it('RETIRADA es terminal: ninguna acción sale de ella', () => {
    for (const action of todas) {
      expect(canTransition(action, 'RETIRADA')).toBe(false);
    }
  });

  it('no se verifica sin haberla tomado ni se salta la revisión', () => {
    expect(canTransition('VERIFY', 'ENVIADA')).toBe(false);
    expect(canTransition('REJECT', 'ENVIADA')).toBe(false);
    expect(canTransition('VERIFY', 'VERIFICADA')).toBe(false);
  });

  it('EXPIRADA es sólo la vigencia vencida de una VERIFICADA; el abandono es otro estado', () => {
    expect(canTransition('EXPIRE', 'INFORMACION_REQUERIDA')).toBe(false);
    expect(canTransition('ABANDON', 'VERIFICADA')).toBe(false);
  });
});

describe('proyección sobre el perfil', () => {
  it('sólo VERIFICADA es verificado; ENVIADA equivale a PRACT_VERIF_PENDING', () => {
    for (const code of ADMISSION_STATUS_CODES) {
      expect(profileVerificationFor(code)).toBe(
        code === 'VERIFICADA' ? PROF.PRACT_VERIF_VERIFIED : PROF.PRACT_VERIF_PENDING,
      );
    }
  });
});

describe('estado visible de verificación (el check)', () => {
  const verificada = (validUntil?: string) => ({
    status: 'VERIFICADA' as const,
    decidedAt: new Date('2026-10-01T10:00:00.000Z'),
    validUntil: validUntil ? new Date(`${validUntil}T00:00:00.000Z`) : null,
  });

  it('sin admisión (padrón) es UNVERIFIED, nunca IN_REVIEW', () => {
    expect(visibleVerification(undefined, NOW)).toEqual({
      status: 'UNVERIFIED',
      verifiedAt: null,
      validUntil: null,
    });
  });

  it.each<AdmissionStatusCode>(['ENVIADA', 'EN_REVISION', 'INFORMACION_REQUERIDA'])(
    '%s se ve «en proceso»',
    (status) => {
      expect(visibleVerification({ status }, NOW).status).toBe('IN_REVIEW');
    },
  );

  it.each<AdmissionStatusCode>(['RECHAZADA', 'RETIRADA', 'ABANDONADA'])(
    '%s no muestra nada',
    (status) => {
      expect(visibleVerification({ status }, NOW).status).toBe('UNVERIFIED');
    },
  );

  it('VERIFICADA vigente muestra el check con sus fechas', () => {
    const view = visibleVerification(verificada('2027-10-29'), NOW);
    expect(view).toEqual({
      status: 'VERIFIED',
      verifiedAt: '2026-10-01T10:00:00.000Z',
      validUntil: '2027-10-29',
    });
  });

  it('el último día de vigencia todavía vale (fin de día en La Paz, inclusive)', () => {
    // 29/10 23:59 en La Paz es 30/10 03:59 UTC.
    const lastMinute = new Date('2026-10-30T03:59:00.000Z');
    expect(visibleVerification(verificada('2026-10-29'), lastMinute).status).toBe(
      'VERIFIED',
    );
  });

  it('pasado el fin de día de La Paz la verificación vence aunque el barrido no corrió', () => {
    const firstMinuteAfter = new Date('2026-10-30T04:01:00.000Z');
    expect(
      visibleVerification(verificada('2026-10-29'), firstMinuteAfter).status,
    ).toBe('EXPIRED');
  });

  it('la suspensión y el vencimiento quitan el check', () => {
    expect(visibleVerification({ status: 'SUSPENDIDA' }, NOW).status).toBe(
      'SUSPENDED',
    );
    expect(visibleVerification({ status: 'EXPIRADA' }, NOW).status).toBe('EXPIRED');
  });
});
