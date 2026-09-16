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
import { COMM } from '../community.concepts';

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
    displayNamesByPerson: mockFn().mockResolvedValue(new Map()),
  };
  const searchRepo = {
    findPublicBySlug: mockFn().mockResolvedValue(null),
    ratingsByProfile: mockFn().mockResolvedValue(new Map()),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new CommunityReviewsReadService(
    em as any,
    profilesRepo as any,
    reviewsRepo as any,
    searchRepo as any,
    logger as any,
  );
  return { service, profilesRepo, reviewsRepo, searchRepo };
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

describe('CommunityReviewsReadService — opiniones de la ficha pública (P31)', () => {
  const perfil = {
    id: 'p-1',
    targetTypeConceptId: COMM.PROFILE_TARGET_PRACTITIONER,
  };

  it('404 si el slug no existe', async () => {
    const d = build();
    d.searchRepo.findPublicBySlug.mockResolvedValue(null);
    await expect(
      d.service.listPublicReviewsBySlug('no-existe', undefined, { limit: 10 }),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('404 si el slug es del tipo equivocado, sin redirigir', async () => {
    // `/p/` promete un profesional; servir una farmacia ahí rompería el
    // JSON-LD de la página, que declara `Physician`.
    const d = build();
    d.searchRepo.findPublicBySlug.mockResolvedValue({
      ...perfil,
      targetTypeConceptId: 'otro-tipo',
    });
    await expect(
      d.service.listPublicReviewsBySlug(
        'farmacia-x',
        COMM.PROFILE_TARGET_PRACTITIONER,
        {
          limit: 10,
        },
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('el promedio es el del perfil, no el de la página', async () => {
    const d = build();
    d.searchRepo.findPublicBySlug.mockResolvedValue(perfil);
    // Una sola reseña de 5 en la página; el perfil promedia 4,6 sobre 12.
    d.reviewsRepo.listByTargetPage.mockResolvedValue([review]);
    d.searchRepo.ratingsByProfile.mockResolvedValue(
      new Map([['p-1', { average: 4.6, count: 12 }]]),
    );

    const res = await d.service.listPublicReviewsBySlug(
      'dra-perez',
      undefined,
      {
        limit: 10,
      },
    );

    expect(res.ratingAverage).toBe(4.6);
    expect(res.ratingCount).toBe(12);
    expect(res.items).toHaveLength(1);
  });

  it('sin reseñas el promedio es null y no cero', async () => {
    // Cero estrellas es una calificación pésima; «todavía nadie calificó» no
    // lo es, y decirlo con un 0 sería contar otra cosa.
    const d = build();
    d.searchRepo.findPublicBySlug.mockResolvedValue(perfil);
    d.searchRepo.ratingsByProfile.mockResolvedValue(new Map());

    const res = await d.service.listPublicReviewsBySlug(
      'dra-perez',
      undefined,
      {
        limit: 10,
      },
    );

    expect(res.ratingAverage).toBeNull();
    expect(res.ratingCount).toBe(0);
    expect(res.items).toEqual([]);
  });

  it('descarta las reseñas removidas por moderación, igual que el promedio', async () => {
    const d = build();
    d.searchRepo.findPublicBySlug.mockResolvedValue(perfil);

    await d.service.listPublicReviewsBySlug('dra-perez', undefined, {
      limit: 10,
    });

    expect(d.reviewsRepo.listByTargetPage).toHaveBeenCalledWith(
      expect.anything(),
      'p-1',
      COMM.PUBLICATION_PUBLISHED,
      COMM.MODERATION_REMOVED,
      undefined,
      11,
    );
  });

  it('firma con el nombre sólo si el autor eligió mostrarlo', async () => {
    const d = build();
    d.searchRepo.findPublicBySlug.mockResolvedValue(perfil);
    d.reviewsRepo.listByTargetPage.mockResolvedValue([
      {
        ...review,
        id: 'r-firmada',
        reviewerPatientProfileId: 'persona-1',
        reviewerDisplayModeConceptId: COMM.REVIEW_DISPLAY_REAL_NAME,
      },
      {
        ...review,
        id: 'r-anonima',
        reviewerPatientProfileId: 'persona-2',
        reviewerDisplayModeConceptId: COMM.REVIEW_DISPLAY_ANONYMOUS,
      },
    ]);
    d.reviewsRepo.displayNamesByPerson.mockResolvedValue(
      new Map([
        ['persona-1', 'Ana Quispe'],
        ['persona-2', 'Beto Rojas'],
      ]),
    );

    const res = await d.service.listPublicReviewsBySlug(
      'dra-perez',
      undefined,
      {
        limit: 10,
      },
    );

    expect(res.items[0].reviewerDisplayName).toBe('Ana Quispe');
    // Aunque el mapa traiga su nombre, la anónima no lo publica.
    expect(res.items[1].reviewerDisplayName).toBeNull();
  });

  it('ni siquiera PIDE el nombre de quien publicó como anónimo', async () => {
    // Traerlo y descartarlo después dejaría el nombre del autor anónimo en la
    // memoria del proceso, que es lo que la reseña anónima promete que no pasa.
    const d = build();
    d.searchRepo.findPublicBySlug.mockResolvedValue(perfil);
    d.reviewsRepo.listByTargetPage.mockResolvedValue([
      {
        ...review,
        reviewerPatientProfileId: 'persona-2',
        reviewerDisplayModeConceptId: COMM.REVIEW_DISPLAY_ANONYMOUS,
      },
    ]);

    await d.service.listPublicReviewsBySlug('dra-perez', undefined, {
      limit: 10,
    });

    expect(d.reviewsRepo.displayNamesByPerson).toHaveBeenCalledWith(
      expect.anything(),
      [],
    );
  });

  it('nunca expone el encuentro ni el paciente, tampoco en la superficie pública', async () => {
    const d = build();
    d.searchRepo.findPublicBySlug.mockResolvedValue(perfil);
    d.reviewsRepo.listByTargetPage.mockResolvedValue([review]);

    const res = await d.service.listPublicReviewsBySlug(
      'dra-perez',
      undefined,
      {
        limit: 10,
      },
    );

    const serializado = JSON.stringify(res);
    expect(serializado).not.toContain('encuentro-secreto');
    expect(serializado).not.toContain('paciente-secreto');
  });
});
