import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { CommunityReviewableCareService } from './community-reviewable-care.service';
import { ResourceNotFoundException, runWithTenant } from '../../../common';
import { CLIN } from '../../clinical/clinical.concepts';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = 'ten-1';
const PATIENT = 'pat-1';
const BOOKING = 'book-1';
const APPOINTMENT = 'appt-1';
const ENCOUNTER = 'enc-1';
const PRACTITIONER = 'prac-1';
const START = new Date('2026-10-20T14:00:00.000Z');

const patient = {
  id: 'usr-pac',
  roles: ['PATIENT'],
  patientProfileId: PATIENT,
} as any;

const booking = (overrides: Record<string, unknown> = {}) => ({
  id: BOOKING,
  tenantId: TENANT,
  patientProfileId: PATIENT,
  appointmentId: APPOINTMENT,
  ...overrides,
});

const encounter = (overrides: Record<string, unknown> = {}) => ({
  id: ENCOUNTER,
  patientProfileId: PATIENT,
  primaryPractitionerId: PRACTITIONER,
  statusConceptId: CLIN.ENCOUNTER_FINISHED,
  startAt: START,
  ...overrides,
});

const showcase = (overrides: Record<string, unknown> = {}) => ({
  id: 'vitrina-1',
  displayName: 'Dra. Ana Pérez',
  acceptsReviews: true,
  ...overrides,
});

/**
 * Construye el servicio con dependencias controladas: por defecto, el caso feliz.
 * @returns Servicio y dobles.
 */
function build() {
  const fork = { findOne: mockFn().mockResolvedValue(booking()) };
  const em = { fork: mockFn().mockReturnValue(fork) };
  const profilesRepo = {
    findByTarget: mockFn().mockResolvedValue(showcase()),
  };
  const reviewsRepo = {
    findByReviewerEncounter: mockFn().mockResolvedValue(null),
  };
  const encountersRepo = {
    findLatestIdsByAppointmentIds: mockFn().mockResolvedValue(
      new Map([[APPOINTMENT, ENCOUNTER]]),
    ),
    findById: mockFn().mockResolvedValue(encounter()),
  };
  const service = new CommunityReviewableCareService(
    em as any,
    profilesRepo as any,
    reviewsRepo as any,
    encountersRepo as any,
  );
  const get = (actor: any = patient, id: string = BOOKING) =>
    runWithTenant(TENANT, () => service.getReviewableCare(id, actor));
  return { get, service, fork, profilesRepo, reviewsRepo, encountersRepo };
}

describe('CommunityReviewableCareService', () => {
  it('atención terminada, vitrina que acepta reseñas y sin reseña previa: canReview', async () => {
    const d = build();

    const result = await d.get();

    expect(result).toEqual({
      encounterId: ENCOUNTER,
      appointmentBookingId: BOOKING,
      practitionerDisplayName: 'Dra. Ana Pérez',
      startAt: START,
      alreadyReviewed: false,
      canReview: true,
    });
    // La cadena: reserva → cita → encuentro más reciente de esa cita.
    expect(d.encountersRepo.findLatestIdsByAppointmentIds).toHaveBeenCalledWith(
      expect.anything(),
      [APPOINTMENT],
    );
    expect(d.profilesRepo.findByTarget).toHaveBeenCalledWith(
      expect.anything(),
      PRACTITIONER,
    );
    expect(d.reviewsRepo.findByReviewerEncounter).toHaveBeenCalledWith(
      expect.anything(),
      PATIENT,
      'vitrina-1',
      ENCOUNTER,
    );
  });

  it('ya reseñada: alreadyReviewed y no canReview', async () => {
    const d = build();
    d.reviewsRepo.findByReviewerEncounter.mockResolvedValue({ id: 'rev-1' });

    const result = await d.get();

    expect(result.alreadyReviewed).toBe(true);
    expect(result.canReview).toBe(false);
    expect(result.encounterId).toBe(ENCOUNTER);
  });

  it.each([
    ['en curso', CLIN.ENCOUNTER_IN_PROGRESS],
    ['llegó', CLIN.ENCOUNTER_ARRIVED],
  ])('encuentro %s: no se puede reseñar todavía', async (_name, status) => {
    const d = build();
    d.encountersRepo.findById.mockResolvedValue(
      encounter({ statusConceptId: status }),
    );

    const result = await d.get();

    expect(result.canReview).toBe(false);
    expect(result.alreadyReviewed).toBe(false);
    // El encuentro sí se devuelve: la pantalla puede volver a preguntar luego.
    expect(result.encounterId).toBe(ENCOUNTER);
  });

  it('la vitrina del profesional no acepta reseñas: no canReview', async () => {
    const d = build();
    d.profilesRepo.findByTarget.mockResolvedValue(
      showcase({ acceptsReviews: false }),
    );

    const result = await d.get();

    expect(result.canReview).toBe(false);
    expect(result.practitionerDisplayName).toBe('Dra. Ana Pérez');
  });

  it('acceptsReviews sin definir cuenta como que acepta (igual que publishReview)', async () => {
    const d = build();
    d.profilesRepo.findByTarget.mockResolvedValue(
      showcase({ acceptsReviews: undefined }),
    );
    expect((await d.get()).canReview).toBe(true);
  });

  it('el profesional no tiene vitrina: no se puede reseñar y no hay nombre', async () => {
    const d = build();
    d.profilesRepo.findByTarget.mockResolvedValue(null);

    const result = await d.get();

    expect(result).toMatchObject({
      practitionerDisplayName: null,
      alreadyReviewed: false,
      canReview: false,
    });
    expect(d.reviewsRepo.findByReviewerEncounter).not.toHaveBeenCalled();
  });

  it('el encuentro no tiene profesional principal: no se puede reseñar', async () => {
    const d = build();
    d.encountersRepo.findById.mockResolvedValue(
      encounter({ primaryPractitionerId: undefined }),
    );

    const result = await d.get();

    expect(result.canReview).toBe(false);
    expect(d.profilesRepo.findByTarget).not.toHaveBeenCalled();
  });

  describe('atención sin encuentro todavía', () => {
    const none = (id: string = BOOKING) => ({
      encounterId: null,
      appointmentBookingId: id,
      practitionerDisplayName: null,
      startAt: null,
      alreadyReviewed: false,
      canReview: false,
    });

    it('la reserva no tiene cita', async () => {
      const d = build();
      d.fork.findOne.mockResolvedValue(booking({ appointmentId: undefined }));
      expect(await d.get()).toEqual(none());
      expect(
        d.encountersRepo.findLatestIdsByAppointmentIds,
      ).not.toHaveBeenCalled();
    });

    it('la cita no tiene encuentro', async () => {
      const d = build();
      d.encountersRepo.findLatestIdsByAppointmentIds.mockResolvedValue(
        new Map(),
      );
      expect(await d.get()).toEqual(none());
      expect(d.encountersRepo.findById).not.toHaveBeenCalled();
    });

    it('el encuentro es de otro paciente: se trata como si no existiera', async () => {
      const d = build();
      d.encountersRepo.findById.mockResolvedValue(
        encounter({ patientProfileId: 'otro-paciente' }),
      );
      const result = await d.get();
      expect(result).toEqual(none());
      expect(JSON.stringify(result)).not.toContain(ENCOUNTER);
      expect(d.profilesRepo.findByTarget).not.toHaveBeenCalled();
    });
  });

  describe('no confirma la existencia de uuids ajenos', () => {
    const notFound = async (d: ReturnType<typeof build>) => {
      const error = await d.get().then(
        () => null,
        (e: unknown) => e as ResourceNotFoundException,
      );
      expect(error).toBeInstanceOf(ResourceNotFoundException);
      return error!;
    };

    it('reserva inexistente, de otro paciente y de otro tenant dan el mismo 404, sin details', async () => {
      const missing = build();
      missing.fork.findOne.mockResolvedValue(null);
      const foreign = build();
      foreign.fork.findOne.mockResolvedValue(
        booking({ patientProfileId: 'otro-paciente' }),
      );
      const otherTenant = build();
      otherTenant.fork.findOne.mockResolvedValue(
        booking({ tenantId: 'ten-2' }),
      );

      const a = await notFound(missing);
      const b = await notFound(foreign);
      const c = await notFound(otherTenant);

      for (const error of [a, b, c]) {
        expect(error.getResponse()).toEqual(a.getResponse());
        expect(JSON.stringify(error.getResponse())).not.toContain(BOOKING);
      }
      // Ni siquiera se miró la cadena clínica.
      for (const d of [missing, foreign, otherTenant]) {
        expect(d.encountersRepo.findById).not.toHaveBeenCalled();
        expect(d.profilesRepo.findByTarget).not.toHaveBeenCalled();
      }
    });

    it('una sesión sin perfil de paciente recibe 403 y no se consulta nada', async () => {
      const d = build();
      await expect(
        d.get({ id: 'u', roles: ['PRACTITIONER'] }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.fork.findOne).not.toHaveBeenCalled();
    });

    it('el paciente sale del token: se compara con la reserva, no con un parámetro', async () => {
      const d = build();
      const other = { id: 'u2', roles: ['PATIENT'], patientProfileId: 'pat-2' };
      await expect(d.get(other)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });
  });

  it('sin tenant activo no consulta', async () => {
    const d = build();
    await expect(
      d.service.getReviewableCare(BOOKING, patient),
    ).rejects.toThrow();
    expect(d.fork.findOne).not.toHaveBeenCalled();
  });
});
