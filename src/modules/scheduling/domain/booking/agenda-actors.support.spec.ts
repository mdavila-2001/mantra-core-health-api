import {
  SUPPORT_STAFF_ROLE,
  actorKindOf,
  attendsIn,
  isPatientActor,
  isSupportActor,
  operatesAnyAgenda,
} from './agenda-actors';

describe('agenda-actors: personal de apoyo', () => {
  const support = { roles: [SUPPORT_STAFF_ROLE] };

  it('quien tiene vínculo y no administra agenda es persona de apoyo', () => {
    expect(isSupportActor(support)).toBe(true);
    expect(operatesAnyAgenda(support)).toBe(false);
  });

  it('SCHEDULING_ADMIN y SCHEDULING_AGENT siguen operando por su rol, aun con vínculo', () => {
    for (const role of ['SCHEDULING_ADMIN', 'SCHEDULING_AGENT']) {
      const actor = { roles: [SUPPORT_STAFF_ROLE, role] };
      expect(isSupportActor(actor)).toBe(false);
      expect(operatesAnyAgenda(actor)).toBe(true);
    }
  });

  it('la persona de apoyo no se confunde con un paciente y actúa del lado del prestador', () => {
    expect(isPatientActor(support)).toBe(false);
    expect(actorKindOf(support)).toBe('PROVIDER');
  });

  it('una cuenta de paciente sigue siendo paciente', () => {
    expect(isPatientActor({ roles: ['PATIENT'] })).toBe(true);
    expect(isSupportActor({ roles: ['PATIENT'] })).toBe(false);
  });

  describe('A4: los roles se miran por organización, no los globales', () => {
    const HOSPITAL = 'tenant-hospital';
    const CLINICA = 'tenant-clinica-b';

    it('un rol de agenda que rige en OTRA organización no anula la política de apoyo en esta', () => {
      // Lucía es FRONT_DESK (apoyo) del hospital y SCHEDULING_AGENT solo en la clínica B.
      const lucia = {
        roles: [SUPPORT_STAFF_ROLE, 'SCHEDULING_AGENT'],
        scopedRoles: {
          [HOSPITAL]: [SUPPORT_STAFF_ROLE],
          [CLINICA]: ['SCHEDULING_AGENT'],
        },
      };
      expect(operatesAnyAgenda(lucia, HOSPITAL)).toBe(false);
      expect(isSupportActor(lucia, HOSPITAL)).toBe(true);
      // En la clínica B sí opera por su rol y no es persona de apoyo.
      expect(operatesAnyAgenda(lucia, CLINICA)).toBe(true);
      expect(isSupportActor(lucia, CLINICA)).toBe(false);
    });

    it('un doctor que además es apoyo en otra organización no pasa por la política en la suya', () => {
      const doctor = {
        roles: ['PRACTITIONER', SUPPORT_STAFF_ROLE],
        scopedRoles: { [CLINICA]: [SUPPORT_STAFF_ROLE] },
        practitionerProfileId: 'prof-1',
      };
      expect(isSupportActor(doctor, HOSPITAL)).toBe(false);
      expect(isSupportActor(doctor, CLINICA)).toBe(true);
    });

    it('un rol sin ámbito (global) rige en toda organización', () => {
      const agente = { roles: ['SCHEDULING_AGENT'] };
      expect(operatesAnyAgenda(agente, HOSPITAL)).toBe(true);
      expect(operatesAnyAgenda(agente, CLINICA)).toBe(true);
    });

    it('sin organización indicada se mantiene la lectura global anterior', () => {
      const lucia = {
        roles: [SUPPORT_STAFF_ROLE, 'SCHEDULING_AGENT'],
        scopedRoles: { [CLINICA]: ['SCHEDULING_AGENT'] },
      };
      expect(operatesAnyAgenda(lucia)).toBe(true);
    });
  });

  describe('SEG A-A1: «paciente» se decide con la organización del recurso', () => {
    const A = 'aaaaaaaa-0000-0000-0000-000000000001';
    const B = 'bbbbbbbb-0000-0000-0000-000000000002';
    // PoC dual.ts: secretaria del hospital A con cuenta de paciente en la clínica B.
    const dual = {
      roles: ['PATIENT', SUPPORT_STAFF_ROLE],
      scopedRoles: { [A]: [SUPPORT_STAFF_ROLE] },
    };

    it('con vínculo de apoyo solo en A, en B sigue siendo paciente (no se salta el candado)', () => {
      expect(isSupportActor(dual, B)).toBe(false);
      expect(isPatientActor(dual, B)).toBe(true);
    });

    it('en A (donde sí es apoyo) no es paciente: la política de apoyo decide', () => {
      expect(isPatientActor(dual, A)).toBe(false);
    });

    it('un rol de agenda que rige solo en A no la vuelve operadora en B', () => {
      const agentA = {
        roles: ['PATIENT', 'SCHEDULING_AGENT'],
        scopedRoles: { [A]: ['SCHEDULING_AGENT'] },
      };
      expect(isPatientActor(agentA, A)).toBe(false);
      expect(isPatientActor(agentA, B)).toBe(true);
    });

    it('un profesional con el rol sin ámbito (global) no es paciente en ninguna organización', () => {
      expect(
        isPatientActor(
          { roles: ['PRACTITIONER'], practitionerProfileId: 'p' },
          B,
        ),
      ).toBe(false);
    });
  });

  describe('SEG V-1: «atiende» se decide con el rol en la organización, no con el perfil global', () => {
    const A = 'aaaaaaaa-0000-0000-0000-000000000001';
    const B = 'bbbbbbbb-0000-0000-0000-000000000002';
    // PoC dual.ts (variante): médico de A con cuenta de paciente en B. El
    // `hpid` del token es global; el oficio de médico solo rige en A.
    const doc = {
      roles: ['PATIENT', 'PRACTITIONER'],
      scopedRoles: { [A]: ['PRACTITIONER'] },
      practitionerProfileId: 'pp-1',
    };

    it('el médico de A es paciente en B (no se salta el candado de representación)', () => {
      expect(isPatientActor(doc, B)).toBe(true);
      expect(attendsIn(doc, B)).toBe(false);
    });

    it('en A, donde sí atiende, no es paciente', () => {
      expect(isPatientActor(doc, A)).toBe(false);
      expect(attendsIn(doc, A)).toBe(true);
    });

    it('un perfil profesional sin rol de profesional en ninguna parte tampoco exime (falla cerrado)', () => {
      const sinRol = { roles: ['PATIENT'], practitionerProfileId: 'pp-2' };
      expect(isPatientActor(sinRol, A)).toBe(true);
      expect(attendsIn(sinRol, A)).toBe(false);
    });

    it('un rol de profesional sin perfil no atiende: no tiene agenda', () => {
      expect(attendsIn({ roles: ['PRACTITIONER'] }, A)).toBe(false);
    });
  });
});
