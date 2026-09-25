import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ResourceNotFoundException } from '../../../common';
import { CommunityPublicController } from './community-public.controller';

/**
 * El controlador público, en lo único que puede fallar por su cuenta: **qué
 * parámetros declara**.
 *
 * No prueba reglas de negocio —ésas viven en `community-public.service.spec.ts`—
 * sino la frontera que el carril vino a cerrar. `specialty` viajaba desde el
 * cliente desde antes y se perdía acá, entre la petición y el servicio, porque
 * el método no lo declaraba: ningún error, ninguna traza, y una pantalla con un
 * filtro que no filtraba. Una prueba de servicio no habría visto nada, porque el
 * servicio nunca llegó a recibirlo.
 */
describe('CommunityPublicController', () => {
  /** Arma el controlador con un servicio doble. */
  const build = () => {
    const service = {
      search: mockFn().mockResolvedValue({ items: [] }),
      postReactions: mockFn().mockResolvedValue({ items: [] }),
      postComments: mockFn().mockResolvedValue({ items: [] }),
      commentReplies: mockFn().mockResolvedValue({ items: [] }),
      nearby: mockFn().mockResolvedValue({ items: [] }),
    };
    const reviews = {
      listPublicReviewsBySlug: mockFn().mockResolvedValue({
        items: [],
        count: 0,
        limit: 50,
        nextCursor: null,
        ratingAverage: null,
        ratingCount: 0,
      }),
    };
    return {
      service,
      reviews,
      controller: new CommunityPublicController(service as any, reviews as any),
    };
  };

  describe('directorio de profesionales (AC-02-7)', () => {
    it('la especialidad llega al servicio en vez de perderse en la frontera', async () => {
      const d = build();

      await d.controller.searchPractitioners(
        'cardio',
        'true',
        'concepto-especialidad',
        undefined,
        '10',
      );

      expect(d.service.search).toHaveBeenCalledWith({
        q: 'cardio',
        kind: 'PRACTITIONER',
        verified: true,
        specialtyConceptId: 'concepto-especialidad',
        cursor: undefined,
        limit: 10,
      });
    });

    it('sin especialidad pedida el filtro no se inventa', async () => {
      const d = build();

      await d.controller.searchPractitioners();

      expect(d.service.search).toHaveBeenCalledWith(
        expect.objectContaining({ specialtyConceptId: undefined }),
      );
    });

    it('departamento y municipio llegan al servicio (2.3)', async () => {
      const d = build();

      await d.controller.searchPractitioners(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        'depto-lp',
        'muni-el-alto',
      );

      expect(d.service.search).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'PRACTITIONER',
          departmentConceptId: 'depto-lp',
          municipalityConceptId: 'muni-el-alto',
        }),
      );
    });
  });

  describe('directorio de organizaciones — filtro territorial (2.3)', () => {
    it('departamento y municipio llegan al servicio junto con la ciudad', async () => {
      const d = build();

      await d.controller.searchOrganizations(
        'clinica',
        'El Alto',
        undefined,
        undefined,
        'depto-lp',
        'muni-el-alto',
      );

      expect(d.service.search).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'ORGANIZATION',
          city: 'El Alto',
          departmentConceptId: 'depto-lp',
          municipalityConceptId: 'muni-el-alto',
        }),
      );
    });
  });

  /**
   * Mismo defecto que `specialty` tenía arriba, en `nearby`: `kind` viajaba
   * desde el cliente y el servicio lo sabía filtrar, pero el método del
   * controlador no lo declaraba y se perdía en la frontera — `/nearby-places`
   * recibía los cuatro verticales mezclados sin que nada lo avisara.
   */
  describe('nearby — el vertical no se pierde en la frontera', () => {
    it('el vertical llega al servicio en vez de perderse en la frontera', async () => {
      const d = build();

      await d.controller.nearby(
        '-17.78',
        '-63.18',
        '5',
        'DIAGNOSTIC_UNIT',
        '20',
      );

      expect(d.service.nearby).toHaveBeenCalledWith({
        lat: -17.78,
        lng: -63.18,
        radiusKm: 5,
        kind: 'DIAGNOSTIC_UNIT',
        limit: 20,
      });
    });

    it('un vertical fuera del contrato de nearby no se inventa', async () => {
      const d = build();

      await d.controller.nearby('-17.78', '-63.18', undefined, 'MEDICATION');

      expect(d.service.nearby).toHaveBeenCalledWith(
        expect.objectContaining({ kind: undefined }),
      );
    });

    it('sin vertical el filtro no se inventa', async () => {
      const d = build();

      await d.controller.nearby('-17.78', '-63.18');

      expect(d.service.nearby).toHaveBeenCalledWith(
        expect.objectContaining({ kind: undefined }),
      );
    });
  });

  describe('lecturas sociales públicas (TAREA 01 §5.1)', () => {
    it('quién reaccionó delega con su cursor y su tope', async () => {
      const d = build();

      await d.controller.postReactions('post-1', 'cur', '5');

      expect(d.service.postReactions).toHaveBeenCalledWith('post-1', {
        cursor: 'cur',
        limit: 5,
      });
    });

    it('el hilo de comentarios delega con su cursor y su tope', async () => {
      const d = build();

      await d.controller.postComments('post-1', 'cur', '5');

      expect(d.service.postComments).toHaveBeenCalledWith('post-1', {
        cursor: 'cur',
        limit: 5,
      });
    });

    it('las respuestas cuelgan del comentario, no de la publicación', async () => {
      const d = build();

      await d.controller.commentReplies('c-1', undefined, undefined);

      expect(d.service.commentReplies).toHaveBeenCalledWith('c-1', {
        cursor: undefined,
        limit: undefined,
      });
    });

    it('un tope no numérico se ignora y lo recorta el servicio, no da 400', async () => {
      const d = build();

      await d.controller.postComments('post-1', undefined, 'abc');

      expect(d.service.postComments).toHaveBeenCalledWith('post-1', {
        cursor: undefined,
        limit: undefined,
      });
    });
  });
  describe('opiniones de la ficha pública (P31)', () => {
    it('traduce el prefijo de la vertical al concepto de tipo, como la ficha', async () => {
      const d = build();

      await d.controller.listPublicProfileReviews(
        'p',
        'dra-perez',
        undefined,
        10,
      );

      expect(d.reviews.listPublicReviewsBySlug).toHaveBeenCalledWith(
        'dra-perez',
        expect.any(String),
        { cursor: undefined, limit: 10 },
      );
    });

    it('un prefijo inventado da 404, el mismo que un slug que no existe', async () => {
      // Un 400 acá abriría por la puerta de al lado la distinción entre «no
      // existe» y «no está publicado», que esta superficie no hace.
      const d = build();

      // Lanza de forma síncrona, igual que `getProfileByPrefix`: el prefijo se
      // valida antes de tocar nada, así que no hay promesa que rechazar.
      expect(() =>
        d.controller.listPublicProfileReviews('zz', 'dra-perez', undefined, 10),
      ).toThrow(ResourceNotFoundException);
      expect(d.reviews.listPublicReviewsBySlug).not.toHaveBeenCalled();
    });

    it('sin limit usa el tope por defecto en vez de pedir todo', async () => {
      const d = build();

      await d.controller.listPublicProfileReviews('p', 'dra-perez');

      expect(d.reviews.listPublicReviewsBySlug).toHaveBeenCalledWith(
        'dra-perez',
        expect.any(String),
        { cursor: undefined, limit: 50 },
      );
    });
  });
});
