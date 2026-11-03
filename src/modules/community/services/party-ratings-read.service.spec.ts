import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { COMM } from '../community.concepts';
import { PartyRatingsReadService } from './party-ratings-read.service';
import { RatingPartiesService } from './rating-parties.service';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Implementación opcional.
 * @returns El mock.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/** Una calificación de un médico a un paciente, con la atención detrás. */
const fila = {
  id: 'r-1',
  reviewerPractitionerProfileId: 'hp-1',
  targetPatientProfileId: 'pat-1',
  verifiedEncounterId: 'enc-1',
  overallRating: 4,
  commentText: 'Puntual',
  updatedAt: new Date('2026-10-09T10:00:00Z'),
};

/**
 * Construye el sistema bajo prueba.
 *
 * @param practicasAdministradas - Cuántas organizaciones administra la sesión.
 * @returns El servicio y sus dobles.
 */
function build(practicasAdministradas = 0) {
  const forked: any = {
    count: mockFn().mockResolvedValue(practicasAdministradas),
    findOne: mockFn().mockResolvedValue(null),
  };
  const em: any = { fork: mockFn(() => forked) };
  const ratingsRepo = {
    aggregate: mockFn().mockResolvedValue({ average: 4, count: 1 }),
    findByTarget: mockFn().mockResolvedValue([fila]),
    findByReviewer: mockFn().mockResolvedValue([fila]),
  };
  const service = new PartyRatingsReadService(
    em,
    ratingsRepo as any,
    new RatingPartiesService(),
  );
  return { service, ratingsRepo };
}

const paciente = { id: 'u-pat', roles: [], patientProfileId: 'pat-1' } as any;
const otroPaciente = { id: 'u-x', roles: [], patientProfileId: 'pat-2' } as any;
const medico = { id: 'u-doc', roles: [], practitionerProfileId: 'hp-9' } as any;
const adminOrg = { id: 'u-admin', roles: [] } as any;
const objetivoPaciente = { type: 'PATIENT', id: 'pat-1' } as const;

describe('PartyRatingsReadService — quién ve qué', () => {
  it('cualquier sesión lee la nota de un médico', async () => {
    const { service } = build();
    await expect(
      service.summary({ type: 'PRACTITIONER', id: 'hp-1' }, otroPaciente),
    ).resolves.toEqual({ average: 4, count: 1 });
  });

  describe('la nota de un paciente', () => {
    it('la lee un médico', async () => {
      const { service } = build();
      await expect(
        service.summary(objetivoPaciente, medico),
      ).resolves.toMatchObject({ count: 1 });
    });

    it('la lee quien administra una organización', async () => {
      const { service } = build(1);
      await expect(
        service.summary(objetivoPaciente, adminOrg),
      ).resolves.toMatchObject({ count: 1 });
    });

    it('la lee el propio paciente', async () => {
      const { service } = build();
      await expect(
        service.list(objetivoPaciente, paciente),
      ).resolves.toMatchObject({ count: 1 });
    });

    it('NO la lee otro paciente', async () => {
      const { service } = build();
      await expect(
        service.list(objetivoPaciente, otroPaciente),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  it('la lista no dice quién calificó ni qué atención lo respalda', async () => {
    const { service } = build();
    const lista = await service.list(objetivoPaciente, medico);
    expect(lista.items).toEqual([
      {
        id: 'r-1',
        reviewerType: 'PRACTITIONER',
        overallRating: 4,
        commentText: 'Puntual',
        updatedAt: fila.updatedAt,
      },
    ]);
    expect(JSON.stringify(lista)).not.toContain('hp-1');
    expect(JSON.stringify(lista)).not.toContain('enc-1');
  });

  it('lo que moderación retiró no cuenta', async () => {
    const { service, ratingsRepo } = build();
    await service.summary({ type: 'ORGANIZATION', id: 'org-1' }, medico);
    expect(ratingsRepo.aggregate.mock.calls[0][2]).toEqual([
      COMM.MODERATION_REMOVED,
    ]);
  });

  it('mis calificaciones salen de mi identidad, no de un parámetro', async () => {
    const { service, ratingsRepo } = build();
    const mias = await service.mine('PRACTITIONER', undefined, {
      ...medico,
      practitionerProfileId: 'hp-1',
    });
    expect(ratingsRepo.findByReviewer.mock.calls[0][1]).toEqual({
      type: 'PRACTITIONER',
      id: 'hp-1',
    });
    expect(mias[0]).toMatchObject({
      targetType: 'PATIENT',
      targetId: 'pat-1',
      encounterId: 'enc-1',
    });
  });
});
