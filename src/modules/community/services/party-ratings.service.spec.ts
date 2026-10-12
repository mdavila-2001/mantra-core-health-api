import { jest } from '@jest/globals';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { UniqueConstraintViolationException } from '@mikro-orm/postgresql';
import {
  ConflictException,
  PreconditionFailedException,
} from '../../../common';
import { CLIN } from '../../clinical/clinical.concepts';
import {
  EncounterParticipants,
  type Encounters,
} from '../../clinical/entities';
import {
  Practices,
  PractitionerRoleAssignments,
} from '../../practice/entities';
import { PRAC } from '../../practice/practice.concepts';
import {
  AppointmentBookings,
  SchedulableResources,
} from '../../scheduling/entities';
import { COMM } from '../community.concepts';
import { PartyRatingsService } from './party-ratings.service';
import { RatingPartiesService } from './rating-parties.service';
import type { RatePartyDto } from '../dto/party-rating.dto';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Implementación opcional.
 * @returns El mock.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/** Paciente con perfil clínico. */
const paciente = { id: 'u-pat', roles: [], patientProfileId: 'pat-1' } as any;
/** Médico con perfil profesional. */
const medico = {
  id: 'u-doc',
  roles: ['CLINICIAN'],
  practitionerProfileId: 'hp-1',
} as any;
/** Quien administra la organización `org-1`. */
const adminOrg = { id: 'u-admin', roles: [] } as any;

/** Atención terminada de pat-1 con hp-1, reservada en un recurso de org-1. */
const atencion = {
  id: 'enc-1',
  patientProfileId: 'pat-1',
  primaryPractitionerId: 'hp-1',
  statusConceptId: CLIN.ENCOUNTER_FINISHED,
  appointmentId: 'apt-1',
} as unknown as Encounters;

/** Vínculo activo de hp-1 en org-1. */
const vinculo = {
  id: 'ra-1',
  practitionerProfileId: 'hp-1',
  practiceId: 'org-1',
  statusConceptId: PRAC.ROLE_ASSIGNMENT_ACTIVE,
};

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * `tx.findOne` despacha por entidad, así cada caso cambia sólo la fila que le
 * importa.
 *
 * @param overrides - Filas a devolver por entidad.
 * @returns El servicio y sus dobles.
 */
function build(overrides: Map<unknown, unknown> = new Map()) {
  const filas = new Map<unknown, unknown>([
    [Practices, { id: 'org-1', adminUserId: 'u-admin' }],
    [AppointmentBookings, { id: 'bk-1', resourceId: 'res-1' }],
    [SchedulableResources, { id: 'res-1', practiceId: 'org-1' }],
    [PractitionerRoleAssignments, vinculo],
    [EncounterParticipants, null],
    ...overrides,
  ]);
  const tx: any = {
    flush: mockFn().mockResolvedValue(undefined),
    findOne: mockFn((entity: unknown) =>
      Promise.resolve(filas.get(entity) ?? null),
    ),
  };
  const em: any = { transactional: mockFn((cb: any) => cb(tx)) };
  const ratingsRepo = {
    findExisting: mockFn().mockResolvedValue(null),
    create: mockFn((_em: unknown, data: any) => ({
      id: 'r-1',
      overallRating: data.overallRating,
    })),
    update: mockFn((row: any, stars: number) => {
      row.overallRating = stars;
      return row;
    }),
  };
  const encountersRepo = { findById: mockFn().mockResolvedValue(atencion) };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new PartyRatingsService(
    em,
    ratingsRepo as any,
    encountersRepo as any,
    new RatingPartiesService(),
    logger as any,
  );
  return { service, ratingsRepo, encountersRepo, tx };
}

/**
 * Arma un cuerpo válido con lo que cada caso cambie.
 *
 * @param partial - Campos del caso.
 * @returns El cuerpo.
 */
function cuerpo(partial: Partial<RatePartyDto>): RatePartyDto {
  return { overallRating: 4, ...partial } as RatePartyDto;
}

describe('PartyRatingsService — calificación en malla', () => {
  describe('las seis direcciones habilitadas', () => {
    it('paciente → médico, por la atención terminada', async () => {
      const { service, ratingsRepo } = build();
      const r = await service.rate(
        cuerpo({
          reviewerType: 'PATIENT',
          targetType: 'PRACTITIONER',
          targetId: 'hp-1',
          encounterId: 'enc-1',
        }),
        paciente,
      );
      expect(r).toEqual({ id: 'r-1', overallRating: 4, created: true });
      const data = ratingsRepo.create.mock.calls[0][1];
      expect(data.reviewer).toEqual({ type: 'PATIENT', id: 'pat-1' });
      expect(data.target).toEqual({ type: 'PRACTITIONER', id: 'hp-1' });
      expect(data.basis).toEqual({ encounterId: 'enc-1' });
      expect(data.moderationStatusConceptId).toBe(COMM.MODERATION_PENDING);
    });

    it('paciente → organización, por la reserva de esa atención', async () => {
      const { service } = build();
      await expect(
        service.rate(
          cuerpo({
            reviewerType: 'PATIENT',
            targetType: 'ORGANIZATION',
            targetId: 'org-1',
            encounterId: 'enc-1',
          }),
          paciente,
        ),
      ).resolves.toMatchObject({ created: true });
    });

    it('médico → paciente, por la atención terminada', async () => {
      const { service } = build();
      await expect(
        service.rate(
          cuerpo({
            reviewerType: 'PRACTITIONER',
            targetType: 'PATIENT',
            targetId: 'pat-1',
            encounterId: 'enc-1',
          }),
          medico,
        ),
      ).resolves.toMatchObject({ created: true });
    });

    it('organización → paciente, si la sesión la administra', async () => {
      const { service, ratingsRepo } = build();
      await service.rate(
        cuerpo({
          reviewerType: 'ORGANIZATION',
          reviewerOrganizationId: 'org-1',
          targetType: 'PATIENT',
          targetId: 'pat-1',
          encounterId: 'enc-1',
        }),
        adminOrg,
      );
      expect(ratingsRepo.create.mock.calls[0][1].reviewer).toEqual({
        type: 'ORGANIZATION',
        id: 'org-1',
      });
    });

    it('médico → organización, por el vínculo de trabajo', async () => {
      const { service, ratingsRepo } = build();
      await service.rate(
        cuerpo({
          reviewerType: 'PRACTITIONER',
          targetType: 'ORGANIZATION',
          targetId: 'org-1',
          roleAssignmentId: 'ra-1',
        }),
        medico,
      );
      expect(ratingsRepo.create.mock.calls[0][1].basis).toEqual({
        roleAssignmentId: 'ra-1',
      });
    });

    it('organización → médico, también con un vínculo ya terminado', async () => {
      const { service } = build(
        new Map([
          [
            PractitionerRoleAssignments,
            { ...vinculo, statusConceptId: PRAC.ROLE_ASSIGNMENT_ENDED },
          ],
        ]),
      );
      await expect(
        service.rate(
          cuerpo({
            reviewerType: 'ORGANIZATION',
            reviewerOrganizationId: 'org-1',
            targetType: 'PRACTITIONER',
            targetId: 'hp-1',
            roleAssignmentId: 'ra-1',
          }),
          adminOrg,
        ),
      ).resolves.toMatchObject({ created: true });
    });
  });

  it('recalificar el mismo respaldo actualiza la fila, no crea otra', async () => {
    const { service, ratingsRepo } = build();
    ratingsRepo.findExisting.mockResolvedValue({ id: 'r-0', overallRating: 2 });
    const r = await service.rate(
      cuerpo({
        reviewerType: 'PATIENT',
        targetType: 'PRACTITIONER',
        targetId: 'hp-1',
        encounterId: 'enc-1',
        overallRating: 5,
      }),
      paciente,
    );
    expect(r).toEqual({ id: 'r-0', overallRating: 5, created: false });
    expect(ratingsRepo.create).not.toHaveBeenCalled();
  });

  describe('pares que no se califican', () => {
    it.each([
      ['PATIENT', 'PATIENT', paciente],
      ['ORGANIZATION', 'ORGANIZATION', adminOrg],
    ] as const)('%s → %s da 403', async (reviewerType, targetType, actor) => {
      const { service } = build();
      await expect(
        service.rate(
          cuerpo({
            reviewerType,
            reviewerOrganizationId: 'org-1',
            targetType,
            targetId: 'x',
            encounterId: 'enc-1',
          }),
          actor,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('la identidad sale de la sesión, no del cuerpo', () => {
    it('una sesión sin perfil de paciente no califica como paciente', async () => {
      const { service } = build();
      await expect(
        service.rate(
          cuerpo({
            reviewerType: 'PATIENT',
            targetType: 'PRACTITIONER',
            targetId: 'hp-1',
            encounterId: 'enc-1',
          }),
          medico,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('quien no administra la organización no califica en su nombre', async () => {
      const { service } = build();
      await expect(
        service.rate(
          cuerpo({
            reviewerType: 'ORGANIZATION',
            reviewerOrganizationId: 'org-1',
            targetType: 'PATIENT',
            targetId: 'pat-1',
            encounterId: 'enc-1',
          }),
          medico,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('calificar como organización exige decir cuál', async () => {
      const { service } = build();
      await expect(
        service.rate(
          cuerpo({
            reviewerType: 'ORGANIZATION',
            targetType: 'PATIENT',
            targetId: 'pat-1',
            encounterId: 'enc-1',
          }),
          adminOrg,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('sin respaldo real no hay calificación', () => {
    it('con un paciente de por medio exige la atención', async () => {
      const { service } = build();
      await expect(
        service.rate(
          cuerpo({
            reviewerType: 'PRACTITIONER',
            targetType: 'PATIENT',
            targetId: 'pat-1',
          }),
          medico,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('una atención que no terminó no habilita', async () => {
      const { service, encountersRepo } = build();
      encountersRepo.findById.mockResolvedValue({
        ...atencion,
        statusConceptId: 'en-curso',
      });
      await expect(
        service.rate(
          cuerpo({
            reviewerType: 'PRACTITIONER',
            targetType: 'PATIENT',
            targetId: 'pat-1',
            encounterId: 'enc-1',
          }),
          medico,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('el médico no califica a un paciente que no estuvo en esa atención', async () => {
      const { service } = build();
      await expect(
        service.rate(
          cuerpo({
            reviewerType: 'PRACTITIONER',
            targetType: 'PATIENT',
            targetId: 'otro-paciente',
            encounterId: 'enc-1',
          }),
          medico,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('un médico que no atendió no califica, salvo que haya participado', async () => {
      const otroMedico = { ...medico, practitionerProfileId: 'hp-2' };
      const sinParticipar = build();
      await expect(
        sinParticipar.service.rate(
          cuerpo({
            reviewerType: 'PRACTITIONER',
            targetType: 'PATIENT',
            targetId: 'pat-1',
            encounterId: 'enc-1',
          }),
          otroMedico,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);

      const participante = build(
        new Map([[EncounterParticipants, { id: 'ep-1' }]]),
      );
      await expect(
        participante.service.rate(
          cuerpo({
            reviewerType: 'PRACTITIONER',
            targetType: 'PATIENT',
            targetId: 'pat-1',
            encounterId: 'enc-1',
          }),
          otroMedico,
        ),
      ).resolves.toMatchObject({ created: true });
    });

    it('la organización de otra reserva no califica esa atención', async () => {
      const { service } = build(
        new Map([[SchedulableResources, { id: 'res-1', practiceId: 'org-2' }]]),
      );
      await expect(
        service.rate(
          cuerpo({
            reviewerType: 'PATIENT',
            targetType: 'ORGANIZATION',
            targetId: 'org-1',
            encounterId: 'enc-1',
          }),
          paciente,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('entre médico y organización exige el vínculo', async () => {
      const { service } = build();
      await expect(
        service.rate(
          cuerpo({
            reviewerType: 'PRACTITIONER',
            targetType: 'ORGANIZATION',
            targetId: 'org-1',
          }),
          medico,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it.each([
      ['pendiente', PRAC.ROLE_ASSIGNMENT_PENDING],
      ['rechazada', PRAC.ROLE_ASSIGNMENT_REJECTED],
    ])('una solicitud %s no es un vínculo', async (_n, statusConceptId) => {
      const { service } = build(
        new Map([
          [PractitionerRoleAssignments, { ...vinculo, statusConceptId }],
        ]),
      );
      await expect(
        service.rate(
          cuerpo({
            reviewerType: 'PRACTITIONER',
            targetType: 'ORGANIZATION',
            targetId: 'org-1',
            roleAssignmentId: 'ra-1',
          }),
          medico,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('el vínculo de otra organización no habilita', async () => {
      const { service } = build(
        new Map([
          [PractitionerRoleAssignments, { ...vinculo, practiceId: 'org-2' }],
        ]),
      );
      await expect(
        service.rate(
          cuerpo({
            reviewerType: 'PRACTITIONER',
            targetType: 'ORGANIZATION',
            targetId: 'org-1',
            roleAssignmentId: 'ra-1',
          }),
          medico,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  it('el médico no califica a la organización que él mismo administra', async () => {
    const { service } = build(
      new Map([[Practices, { id: 'org-1', adminUserId: 'u-doc' }]]),
    );
    await expect(
      service.rate(
        cuerpo({
          reviewerType: 'PRACTITIONER',
          targetType: 'ORGANIZATION',
          targetId: 'org-1',
          roleAssignmentId: 'ra-1',
        }),
        medico,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('dos pedidos cruzados sobre el mismo respaldo dan 409, no 500', async () => {
    const { service, tx } = build();
    tx.flush.mockRejectedValue(
      new UniqueConstraintViolationException(new Error('23505') as any),
    );
    await expect(
      service.rate(
        cuerpo({
          reviewerType: 'PATIENT',
          targetType: 'PRACTITIONER',
          targetId: 'hp-1',
          encounterId: 'enc-1',
        }),
        paciente,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
