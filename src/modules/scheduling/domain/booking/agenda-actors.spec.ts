import { describe, expect, it } from '@jest/globals';
import {
  attendsIn,
  isPatientActor,
  operatesAnyAgenda,
  type AgendaActor,
} from './agenda-actors';

const A = 'tenant-a';
const B = 'tenant-b';

/** Mostrador en B que además tiene cuenta de paciente. */
const counterInB: AgendaActor = {
  roles: ['PATIENT', 'SCHEDULING_AGENT'],
  scopedRoles: { [B]: ['SCHEDULING_AGENT'] },
};
/** Médico de B (perfil profesional global) que además es paciente en A. */
const doctorInB: AgendaActor = {
  roles: ['PATIENT', 'PRACTITIONER'],
  scopedRoles: { [B]: ['PRACTITIONER'] },
  practitionerProfileId: 'hp-1',
};

describe('agenda-actors · el oficio se lee en la organización del recurso', () => {
  describe('operatesAnyAgenda', () => {
    it('el rol con ámbito rige solo en la organización donde se asignó', () => {
      expect(operatesAnyAgenda(counterInB, B)).toBe(true);
      expect(operatesAnyAgenda(counterInB, A)).toBe(false);
    });

    it('un rol sin ámbito es global y rige en todas', () => {
      const global: AgendaActor = { roles: ['SCHEDULING_ADMIN'] };
      expect(operatesAnyAgenda(global, A)).toBe(true);
      expect(operatesAnyAgenda(global, B)).toBe(true);
    });

    it('con ámbito y sin organización indicada falla cerrado', () => {
      expect(operatesAnyAgenda(counterInB, undefined)).toBe(false);
    });

    it('SUPERADMIN acotado a una organización no opera las demás', () => {
      const scoped: AgendaActor = {
        roles: ['SUPERADMIN'],
        scopedRoles: { [A]: ['SUPERADMIN'] },
      };
      expect(operatesAnyAgenda(scoped, A)).toBe(true);
      expect(operatesAnyAgenda(scoped, B)).toBe(false);
    });
  });

  describe('attendsIn', () => {
    it('atiende donde tiene el rol de profesional y perfil profesional', () => {
      expect(attendsIn(doctorInB, B)).toBe(true);
      expect(attendsIn(doctorInB, A)).toBe(false);
    });

    it('un perfil profesional sin rol de profesional no atiende', () => {
      const profileOnly: AgendaActor = {
        roles: ['PATIENT'],
        practitionerProfileId: 'hp-1',
      };
      expect(attendsIn(profileOnly, A)).toBe(false);
    });

    it('un rol de profesional sin perfil profesional no atiende', () => {
      expect(attendsIn({ roles: ['PRACTITIONER'] }, A)).toBe(false);
    });
  });

  describe('isPatientActor', () => {
    it('el médico de B es paciente en A: no lo exime su perfil global (SEG V-1)', () => {
      expect(isPatientActor(doctorInB, A)).toBe(true);
      expect(isPatientActor(doctorInB, B)).toBe(false);
    });

    it('el mostrador de B es paciente en A: su rol de agenda no viaja (SEG S1-A4)', () => {
      expect(isPatientActor(counterInB, A)).toBe(true);
      expect(isPatientActor(counterInB, B)).toBe(false);
    });

    it('sin actor no es paciente', () => {
      expect(isPatientActor(undefined, A)).toBe(false);
    });
  });
});
