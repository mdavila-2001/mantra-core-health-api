import { jest } from '@jest/globals';
import { CommunityGroupAudienceService } from './community-group-audience.service';
import { COMM } from '../community.concepts';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const HOUR = 3_600_000;

/** Sesión de un profesional con perfil profesional en el token. */
const doctor = {
  id: 'u-doc',
  roles: ['PRACTITIONER'],
  practitionerProfileId: 'hp-1',
} as any;

/** Sesión de un paciente con perfil de paciente en el token. */
const patient = {
  id: 'u-pat',
  roles: ['PATIENT'],
  patientProfileId: 'pp-1',
} as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * @returns Resultado de build.
 */
function build() {
  const groupsRepo = {
    isActiveTenantMember: mockFn().mockResolvedValue(false),
    hasFinishedEncounter: mockFn().mockResolvedValue(false),
  };
  const profilesRepo = {
    findByTarget: mockFn().mockResolvedValue({ id: 'pub-1' }),
  };
  const badgesRepo = {
    findActive: mockFn().mockResolvedValue(null),
  };
  const service = new CommunityGroupAudienceService(
    groupsRepo as any,
    profilesRepo as any,
    badgesRepo as any,
  );
  return { service, groupsRepo, profilesRepo, badgesRepo };
}

describe('CommunityGroupAudienceService (API#837)', () => {
  describe('isRestricted', () => {
    it('sólo los tres públicos autorizados restringen el foro', () => {
      const { service } = build();
      expect(service.isRestricted(COMM.GROUP_VISIBILITY_VERIFIED_DOCTORS)).toBe(
        true,
      );
      expect(
        service.isRestricted(COMM.GROUP_VISIBILITY_ORGANIZATION_STAFF),
      ).toBe(true);
      expect(
        service.isRestricted(COMM.GROUP_VISIBILITY_ATTENDED_PATIENTS),
      ).toBe(true);
      // «Invitados» y «público general» ya eran privado y público.
      expect(service.isRestricted(COMM.GROUP_VISIBILITY_PUBLIC)).toBe(false);
      expect(service.isRestricted(COMM.GROUP_VISIBILITY_PRIVATE)).toBe(false);
      expect(service.isRestricted(COMM.GROUP_VISIBILITY_SECRET)).toBe(false);
    });
  });

  describe('doctores verificados', () => {
    const vis = COMM.GROUP_VISIBILITY_VERIFIED_DOCTORS;

    it('con el sello de matrícula vigente pertenece al público', async () => {
      const d = build();
      d.badgesRepo.findActive.mockResolvedValue({
        validFrom: new Date(Date.now() - HOUR),
        validTo: new Date(Date.now() + HOUR),
      });

      await expect(
        d.service.isEligible({} as any, vis, 't1', doctor),
      ).resolves.toBe(true);
      expect(d.profilesRepo.findByTarget).toHaveBeenCalledWith(
        expect.anything(),
        'hp-1',
      );
      expect(d.badgesRepo.findActive).toHaveBeenCalledWith(
        expect.anything(),
        'pub-1',
        COMM.BADGE_TYPE_LICENSE_VERIFIED,
      );
    });

    it('un sello sin vencimiento conocido también vale', async () => {
      const d = build();
      d.badgesRepo.findActive.mockResolvedValue({ validFrom: undefined });

      await expect(
        d.service.isEligible({} as any, vis, 't1', doctor),
      ).resolves.toBe(true);
    });

    it('un sello vencido, aunque el barrido no lo haya revocado, no abre la puerta', async () => {
      const d = build();
      d.badgesRepo.findActive.mockResolvedValue({
        validFrom: new Date(Date.now() - 2 * HOUR),
        validTo: new Date(Date.now() - HOUR),
      });

      await expect(
        d.service.isEligible({} as any, vis, 't1', doctor),
      ).resolves.toBe(false);
    });

    it('un sello que todavía no rige no cuenta', async () => {
      const d = build();
      d.badgesRepo.findActive.mockResolvedValue({
        validFrom: new Date(Date.now() + HOUR),
      });

      await expect(
        d.service.isEligible({} as any, vis, 't1', doctor),
      ).resolves.toBe(false);
    });

    it('sin sello, no', async () => {
      const d = build();
      await expect(
        d.service.isEligible({} as any, vis, 't1', doctor),
      ).resolves.toBe(false);
    });

    it('sin perfil profesional en la sesión, no se consulta nada', async () => {
      const d = build();
      await expect(
        d.service.isEligible({} as any, vis, 't1', patient),
      ).resolves.toBe(false);
      expect(d.profilesRepo.findByTarget).not.toHaveBeenCalled();
    });

    it('sin perfil público no hay sello que mirar', async () => {
      const d = build();
      d.profilesRepo.findByTarget.mockResolvedValue(null);
      await expect(
        d.service.isEligible({} as any, vis, 't1', doctor),
      ).resolves.toBe(false);
      expect(d.badgesRepo.findActive).not.toHaveBeenCalled();
    });
  });

  describe('personal de la organización', () => {
    const vis = COMM.GROUP_VISIBILITY_ORGANIZATION_STAFF;

    it('lo decide la membresía activa en la organización del foro', async () => {
      const d = build();
      d.groupsRepo.isActiveTenantMember.mockResolvedValue(true);

      await expect(
        d.service.isEligible({} as any, vis, 't1', doctor),
      ).resolves.toBe(true);
      expect(d.groupsRepo.isActiveTenantMember).toHaveBeenCalledWith(
        expect.anything(),
        'u-doc',
        't1',
      );
    });

    it('sin membresía, no', async () => {
      const d = build();
      await expect(
        d.service.isEligible({} as any, vis, 't1', doctor),
      ).resolves.toBe(false);
    });

    it('un foro sin organización no tiene personal', async () => {
      const d = build();
      d.groupsRepo.isActiveTenantMember.mockResolvedValue(true);
      await expect(
        d.service.isEligible({} as any, vis, undefined, doctor),
      ).resolves.toBe(false);
      expect(d.groupsRepo.isActiveTenantMember).not.toHaveBeenCalled();
    });
  });

  describe('pacientes atendidos', () => {
    const vis = COMM.GROUP_VISIBILITY_ATTENDED_PATIENTS;

    it('lo decide una atención terminada del paciente de la sesión en la organización', async () => {
      const d = build();
      d.groupsRepo.hasFinishedEncounter.mockResolvedValue(true);

      await expect(
        d.service.isEligible({} as any, vis, 't1', patient),
      ).resolves.toBe(true);
      expect(d.groupsRepo.hasFinishedEncounter).toHaveBeenCalledWith(
        expect.anything(),
        'pp-1',
        't1',
      );
    });

    it('sin atención terminada, no', async () => {
      const d = build();
      await expect(
        d.service.isEligible({} as any, vis, 't1', patient),
      ).resolves.toBe(false);
    });

    it('sin perfil de paciente en la sesión no se consulta nada', async () => {
      const d = build();
      await expect(
        d.service.isEligible({} as any, vis, 't1', doctor),
      ).resolves.toBe(false);
      expect(d.groupsRepo.hasFinishedEncounter).not.toHaveBeenCalled();
    });

    it('un foro sin organización no tiene pacientes atendidos', async () => {
      const d = build();
      d.groupsRepo.hasFinishedEncounter.mockResolvedValue(true);
      await expect(
        d.service.isEligible({} as any, vis, null, patient),
      ).resolves.toBe(false);
    });
  });

  it('una visibilidad sin público declarado no excluye a nadie', async () => {
    const d = build();
    await expect(
      d.service.isEligible(
        {} as any,
        COMM.GROUP_VISIBILITY_PUBLIC,
        't1',
        patient,
      ),
    ).resolves.toBe(true);
  });

  describe('hiddenFrom', () => {
    it('devuelve los públicos a los que la sesión no pertenece', async () => {
      const d = build();
      d.groupsRepo.isActiveTenantMember.mockResolvedValue(true);

      await expect(
        d.service.hiddenFrom({} as any, 't1', doctor),
      ).resolves.toEqual([
        COMM.GROUP_VISIBILITY_VERIFIED_DOCTORS,
        COMM.GROUP_VISIBILITY_ATTENDED_PATIENTS,
      ]);
    });

    it('un anónimo sin perfiles no ve ninguno de los tres', async () => {
      const d = build();
      await expect(
        d.service.hiddenFrom({} as any, 't1', { id: 'u', roles: [] } as any),
      ).resolves.toHaveLength(3);
    });
  });
});
