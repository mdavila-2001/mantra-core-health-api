import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
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
    };
    return {
      service,
      controller: new CommunityPublicController(service as any),
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
});
