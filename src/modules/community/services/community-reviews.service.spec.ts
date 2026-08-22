import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { CommunityReviewsService } from './community-reviews.service';
import { ForbiddenException } from '@nestjs/common';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { CLIN } from '../../clinical/clinical.concepts';

/** Paciente con perfil clínico: es el único que puede calificar. */
const paciente = { id: 'u1', roles: [], patientProfileId: 'pat-1' } as any;

/** El profesional dueño de la vitrina `p1`, para las respuestas. */
const doctor = {
  id: 'u2',
  roles: ['CLINICIAN'],
  practitionerProfileId: 'hp-1',
} as any;

/** Una atención que sí habilita la reseña: del paciente, con hp-1, terminada. */
const atencionValida = {
  id: 'enc1',
  patientProfileId: 'pat-1',
  primaryPractitionerId: 'hp-1',
  statusConceptId: CLIN.ENCOUNTER_FINISHED,
};

/** La vitrina calificada, cuyo sujeto es el profesional `hp-1`. */
const vitrina = {
  id: 'p1',
  targetId: 'hp-1',
  acceptsReviews: true,
  createdByUserId: 'un-admin',
};

/** Cuerpo mínimo válido de una reseña. */
const cuerpo = { overallRating: 4, verifiedEncounterId: 'enc1' };

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx: any = {
    flush: mockFn().mockResolvedValue(undefined),
    // La comprobación de participantes consulta la entidad directamente.
    findOne: mockFn().mockResolvedValue(null),
  };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const profilesRepo = { findById: mockFn() };
  const reviewsRepo = {
    findById: mockFn(),
    findByTarget: mockFn(() => Promise.resolve([])),
    findByReviewerEncounter: mockFn().mockResolvedValue(null),
    findResponseByResponder: mockFn().mockResolvedValue(null),
    create: mockFn(),
    createResponse: mockFn(),
    createDimensionScore: mockFn(),
  };
  const encountersRepo = {
    findById: mockFn().mockResolvedValue(atencionValida),
  };
  // La propiedad se concede por defecto; los casos de perfil ajeno la hacen
  // rechazar. La regla en sí tiene su propia prueba en el servicio compartido.
  const visibility = {
    assertActsAsProfile: mockFn(() => Promise.resolve(undefined)),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new CommunityReviewsService(
    em as any,
    profilesRepo as any,
    reviewsRepo as any,
    encountersRepo as any,
    visibility as any,
    logger as any,
  );
  return { service, tx, profilesRepo, reviewsRepo, encountersRepo, visibility };
}

describe('CommunityReviewsService (UC-19-11)', () => {
  it('throws when the target profile does not exist', async () => {
    const d = build();
    d.profilesRepo.findById.mockResolvedValue(null);
    await expect(
      d.service.publishReview('missing', cuerpo as any, paciente),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('rejects when the profile does not accept reviews', async () => {
    const d = build();
    d.profilesRepo.findById.mockResolvedValue({
      ...vitrina,
      acceptsReviews: false,
    });
    await expect(
      d.service.publishReview('p1', cuerpo as any, paciente),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('rejects a duplicate verified review for the same encounter', async () => {
    const d = build();
    d.profilesRepo.findById.mockResolvedValue(vitrina);
    d.reviewsRepo.findByReviewerEncounter.mockResolvedValue({ id: 'rev0' });
    await expect(
      d.service.publishReview('p1', cuerpo as any, paciente),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('publishes a verified review with dimension scores', async () => {
    const d = build();
    d.profilesRepo.findById.mockResolvedValue(vitrina);
    d.reviewsRepo.create.mockReturnValue({ id: 'rev1', overallRating: 4 });

    const res = await d.service.publishReview(
      'p1',
      {
        ...cuerpo,
        dimensions: [{ dimension: 'COMMUNICATION', score: 5 }],
      } as any,
      paciente,
    );

    expect(res).toEqual({
      id: 'rev1',
      overallRating: 4,
      verified: true,
      dimensionCount: 1,
    });
    expect(d.reviewsRepo.createDimensionScore).toHaveBeenCalledTimes(1);
  });

  /**
   * El hueco crítico del carril. El endpoint recibía el reseñador y el encuentro
   * en el cuerpo y no comprobaba ninguno de los dos: el sello de «paciente
   * verificado» era autodeclarado.
   */
  describe('elegibilidad (carril P6 §3)', () => {
    it('el reseñador sale del token, no del cuerpo', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue(vitrina);
      d.reviewsRepo.create.mockReturnValue({ id: 'rev1', overallRating: 4 });

      await d.service.publishReview(
        'p1',
        // Aunque el cuerpo declare otro paciente, se usa el del token.
        { ...cuerpo, reviewerPatientProfileId: 'pat-de-otro' } as any,
        paciente,
      );

      expect(d.reviewsRepo.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ reviewerPatientProfileId: 'pat-1' }),
      );
    });

    it('una sesión sin perfil de paciente no puede calificar', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue(vitrina);

      await expect(
        d.service.publishReview(
          'p1',
          cuerpo as any,
          {
            id: 'u9',
            roles: [],
          } as any,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('una atención inexistente no habilita la reseña', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue(vitrina);
      d.encountersRepo.findById.mockResolvedValue(null);

      await expect(
        d.service.publishReview('p1', cuerpo as any, paciente),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.reviewsRepo.create).not.toHaveBeenCalled();
    });

    it('la atención de otro paciente no habilita la reseña', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue(vitrina);
      d.encountersRepo.findById.mockResolvedValue({
        ...atencionValida,
        patientProfileId: 'pat-de-otro',
      });

      await expect(
        d.service.publishReview('p1', cuerpo as any, paciente),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    /** Calificar una cita que todavía no ocurrió no califica nada. */
    it('una atención sin terminar no habilita la reseña', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue(vitrina);
      d.encountersRepo.findById.mockResolvedValue({
        ...atencionValida,
        statusConceptId: CLIN.ENCOUNTER_IN_PROGRESS,
      });

      await expect(
        d.service.publishReview('p1', cuerpo as any, paciente),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('una atención con otro profesional no habilita calificar a éste', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue(vitrina);
      d.encountersRepo.findById.mockResolvedValue({
        ...atencionValida,
        primaryPractitionerId: 'hp-de-otro',
      });

      await expect(
        d.service.publishReview('p1', cuerpo as any, paciente),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    /**
     * En una atención con equipo, quien atendió puede no ser el responsable
     * declarado. Exigir sólo `primary_practitioner_id` dejaría sin poder
     * calificar a la mitad de los que sí atendieron.
     */
    it('un participante del encuentro también habilita la reseña', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue(vitrina);
      d.encountersRepo.findById.mockResolvedValue({
        ...atencionValida,
        primaryPractitionerId: 'hp-de-otro',
      });
      d.tx.findOne.mockResolvedValue({ id: 'part-1' });
      d.reviewsRepo.create.mockReturnValue({ id: 'rev1', overallRating: 4 });

      await expect(
        d.service.publishReview('p1', cuerpo as any, paciente),
      ).resolves.toEqual(
        expect.objectContaining({ id: 'rev1', verified: true }),
      );
    });
  });

  /**
   * `community.review_responses` existía como tabla y la lectura ya las
   * devolvía, pero no había endpoint: un profesional podía ser calificado en
   * público y no tenía forma de contestar.
   */
  describe('respondToReview', () => {
    it('el titular de la vitrina puede responder', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue(vitrina);
      d.reviewsRepo.findById.mockResolvedValue({
        id: 'rev1',
        targetPublicProfileId: 'p1',
      });
      d.reviewsRepo.createResponse.mockReturnValue({ id: 'resp-1' });

      await expect(
        d.service.respondToReview(
          'p1',
          'rev1',
          { responseText: 'Gracias por el comentario.' } as any,
          doctor,
        ),
      ).resolves.toEqual({ id: 'resp-1' });
    });

    it('exige la titularidad de la vitrina con la regla compartida', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue(vitrina);
      d.reviewsRepo.findById.mockResolvedValue({
        id: 'rev1',
        targetPublicProfileId: 'p1',
      });
      d.reviewsRepo.createResponse.mockReturnValue({ id: 'resp-1' });

      await d.service.respondToReview(
        'p1',
        'rev1',
        { responseText: 'Gracias.' } as any,
        doctor,
      );

      expect(d.visibility.assertActsAsProfile).toHaveBeenCalledWith(
        expect.anything(),
        'p1',
        doctor,
      );
    });

    /**
     * Contestar en nombre de otro no lo habilita ningún rol — tampoco el de
     * moderación. `assertActsAsProfile` no tiene atajo de plataforma, y acá se
     * comprueba que su negativa corte la operación antes de escribir nada.
     */
    it('si la vitrina no es del actor, no escribe nada', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue(vitrina);
      d.visibility.assertActsAsProfile.mockRejectedValue(
        new ForbiddenException('perfil ajeno'),
      );

      await expect(
        d.service.respondToReview(
          'p1',
          'rev1',
          { responseText: 'Respondo yo.' } as any,
          { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.reviewsRepo.createResponse).not.toHaveBeenCalled();
    });

    /**
     * «No es de esta vitrina» y «no existe» dan lo mismo: distinguirlos
     * confirmaría la existencia de reseñas de otros perfiles.
     */
    it('una reseña de otra vitrina se trata como inexistente', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue(vitrina);
      d.reviewsRepo.findById.mockResolvedValue({
        id: 'rev1',
        targetPublicProfileId: 'otra-vitrina',
      });

      await expect(
        d.service.respondToReview(
          'p1',
          'rev1',
          { responseText: 'Hola.' } as any,
          doctor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('no se puede responder dos veces la misma reseña', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue(vitrina);
      d.reviewsRepo.findById.mockResolvedValue({
        id: 'rev1',
        targetPublicProfileId: 'p1',
      });
      d.reviewsRepo.findResponseByResponder.mockResolvedValue({ id: 'resp-0' });

      await expect(
        d.service.respondToReview(
          'p1',
          'rev1',
          { responseText: 'Otra vez.' } as any,
          doctor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
