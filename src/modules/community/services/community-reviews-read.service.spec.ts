import { jest } from '@jest/globals';

// Loose-typed mock factory: runtime 'jest' pero sin los tipos estrictos Mock<never>.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { CommunityReviewsReadService } from './community-reviews-read.service';
import { ResourceNotFoundException } from '../../../common';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const em = { fork: mockFn(() => ({})) };
  const profilesRepo = { findById: mockFn().mockResolvedValue({ id: 'p-1' }) };
  const reviewsRepo = {
    listByTargetPage: mockFn().mockResolvedValue([]),
    listDimensionScores: mockFn().mockResolvedValue([]),
    listResponses: mockFn().mockResolvedValue([]),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new CommunityReviewsReadService(
    em as any,
    profilesRepo as any,
    reviewsRepo as any,
    logger as any,
  );
  return { service, profilesRepo, reviewsRepo };
}

const review = {
  id: 'r-1',
  targetPublicProfileId: 'p-1',
  reviewerPatientProfileId: 'paciente-secreto',
  verifiedEncounterId: 'encuentro-secreto',
  overallRating: 5,
  reviewText: 'excelente',
  verificationStatusConceptId: 'verificada',
  createdAt: new Date('2026-08-01T10:00:00Z'),
};

describe('CommunityReviewsReadService', () => {
  it('404 si el perfil calificado no existe', async () => {
    const d = build();
    d.profilesRepo.findById.mockResolvedValue(null);
    await expect(
      d.service.listProfileReviews('p-x', { limit: 10 }),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('NUNCA expone el encuentro clínico ni el paciente que escribió', async () => {
    const d = build();
    d.reviewsRepo.listByTargetPage.mockResolvedValue([review]);

    const res = await d.service.listProfileReviews('p-1', { limit: 10 });

    const serializado = JSON.stringify(res);
    expect(serializado).not.toContain('encuentro-secreto');
    expect(serializado).not.toContain('paciente-secreto');
    expect(serializado).not.toContain('verifiedEncounterId');
    expect(serializado).not.toContain('reviewerPatientProfileId');
    // Lo que sí viaja es el estado de verificación, que es lo que la pantalla
    // necesita para el sello de «paciente verificado».
    expect(res.items[0].verificationStatusConceptId).toBe('verificada');
  });

  it('agrupa dimensiones y respuestas bajo su review', async () => {
    const d = build();
    d.reviewsRepo.listByTargetPage.mockResolvedValue([
      review,
      { ...review, id: 'r-2' },
    ]);
    d.reviewsRepo.listDimensionScores.mockResolvedValue([
      { reviewId: 'r-1', dimensionConceptId: 'trato', score: 5 },
      { reviewId: 'r-2', dimensionConceptId: 'trato', score: 3 },
    ]);
    d.reviewsRepo.listResponses.mockResolvedValue([
      {
        reviewId: 'r-2',
        id: 'resp-1',
        responderPublicProfileId: 'p-1',
        responseText: 'gracias',
      },
    ]);

    const res = await d.service.listProfileReviews('p-1', { limit: 10 });

    expect(res.items[0].dimensionScores).toHaveLength(1);
    expect(res.items[0].responses).toHaveLength(0);
    expect(res.items[1].responses[0].responseText).toBe('gracias');
  });

  it('devuelve cursor cuando hay página siguiente', async () => {
    const d = build();
    d.reviewsRepo.listByTargetPage.mockResolvedValue([
      review,
      { ...review, id: 'r-2' },
    ]);

    const res = await d.service.listProfileReviews('p-1', { limit: 1 });

    expect(res.items).toHaveLength(1);
    expect(res.nextCursor).not.toBeNull();
  });
});
