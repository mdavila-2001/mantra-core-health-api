import { jest } from '@jest/globals';

// Loose-typed mock factory: runtime 'jest' pero sin los tipos estrictos Mock<never>.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { CommunityEngagementService } from './community-engagement.service';
import { CONCEPTS } from '../../../common';
import {
  REACTION_CONCEPT_BY_CODE,
  SOCIAL_OBJECT_CONCEPT_BY_CODE,
} from '../community.concepts';

const em = {} as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const reactionsRepo = {
    summarizeByTargets: mockFn().mockResolvedValue([]),
    listByActorTargets: mockFn().mockResolvedValue([]),
  };
  const commentsRepo = { countByTargets: mockFn().mockResolvedValue([]) };
  const service = new CommunityEngagementService(
    reactionsRepo as any,
    commentsRepo as any,
  );
  return { service, reactionsRepo, commentsRepo };
}

describe('CommunityEngagementService', () => {
  it('una página vacía no consulta nada', async () => {
    const d = build();
    await expect(d.service.ofPosts(em, [])).resolves.toEqual(new Map());
    expect(d.reactionsRepo.summarizeByTargets).not.toHaveBeenCalled();
    expect(d.commentsRepo.countByTargets).not.toHaveBeenCalled();
  });

  /**
   * El punto de todo el servicio: agrupado por publicación, no una consulta por
   * tarjeta. Un muro de cincuenta publicaciones no puede costar cien viajes.
   */
  it('resuelve toda la página en una consulta por dimensión', async () => {
    const d = build();
    await d.service.ofPosts(em, ['post-1', 'post-2', 'post-3'], 'p-lector');

    expect(d.reactionsRepo.summarizeByTargets).toHaveBeenCalledTimes(1);
    expect(d.commentsRepo.countByTargets).toHaveBeenCalledTimes(1);
    expect(d.reactionsRepo.listByActorTargets).toHaveBeenCalledTimes(1);
    expect(d.reactionsRepo.summarizeByTargets).toHaveBeenCalledWith(
      em,
      SOCIAL_OBJECT_CONCEPT_BY_CODE.POST,
      ['post-1', 'post-2', 'post-3'],
    );
  });

  it('suma el total por tipo y reparte por publicación', async () => {
    const d = build();
    d.reactionsRepo.summarizeByTargets.mockResolvedValue([
      { reactableRefId: 'post-1', reactionTypeConceptId: 'LIKE', count: 7 },
      { reactableRefId: 'post-1', reactionTypeConceptId: 'INSIGHT', count: 5 },
      { reactableRefId: 'post-2', reactionTypeConceptId: 'LIKE', count: 1 },
    ]);
    d.commentsRepo.countByTargets.mockResolvedValue([
      { commentableRefId: 'post-1', count: 3 },
    ]);

    const mapa = await d.service.ofPosts(em, ['post-1', 'post-2']);

    expect(mapa.get('post-1')?.reactions.total).toBe(12);
    expect(mapa.get('post-1')?.reactions.tallies).toHaveLength(2);
    expect(mapa.get('post-1')?.commentCount).toBe(3);
    expect(mapa.get('post-2')?.reactions.total).toBe(1);
    // Sin comentarios es 0, no `undefined`: una tarjeta necesita un número.
    expect(mapa.get('post-2')?.commentCount).toBe(0);
  });

  it('una publicación sin nada aparece igual, con ceros', async () => {
    const d = build();
    const mapa = await d.service.ofPosts(em, ['post-solo']);
    expect(mapa.get('post-solo')).toEqual({
      reactions: { tallies: [], total: 0 },
      commentCount: 0,
    });
  });

  /**
   * Lo que arregla el carril: sin el estado propio en la lectura, el botón
   * marcado sólo existía mientras durara el gesto y al recargar volvía a apagado
   * aunque la reacción estuviera guardada.
   */
  it('marca la reacción propia del lector para que sobreviva a la recarga', async () => {
    const d = build();
    d.reactionsRepo.listByActorTargets.mockResolvedValue([
      { reactableRefId: 'post-1', reactionTypeConceptId: 'LIKE' },
    ]);

    const mapa = await d.service.ofPosts(em, ['post-1', 'post-2'], 'p-lector');

    expect(mapa.get('post-1')?.reactions.actorReactionTypeConceptId).toBe(
      'LIKE',
    );
    // `null` es «no reaccionó», que es distinto de «no se preguntó».
    expect(mapa.get('post-2')?.reactions.actorReactionTypeConceptId).toBeNull();
  });

  /**
   * `undefined` y `null` no son lo mismo: la interfaz necesita distinguir «no
   * reaccionó» —puede pintar el botón apagado— de «no tengo el dato» —no puede
   * afirmar ninguna de las dos cosas—.
   */
  it('un lector sin perfil no recibe estado propio, ni siquiera nulo', async () => {
    const d = build();
    const mapa = await d.service.ofPosts(em, ['post-1']);

    expect(
      'actorReactionTypeConceptId' in (mapa.get('post-1')?.reactions ?? {}),
    ).toBe(false);
    expect(d.reactionsRepo.listByActorTargets).not.toHaveBeenCalled();
  });

  /**
   * El módulo se escribe con la palabra y se leía sólo con el uuid. Una interfaz
   * que recibe el uuid no puede marcar el botón que le corresponde sin resolver
   * terminología en cada render.
   */
  it('resuelve el código de la reacción junto al concepto', async () => {
    const d = build();
    d.reactionsRepo.summarizeByTargets.mockResolvedValue([
      {
        reactableRefId: 'post-1',
        reactionTypeConceptId: REACTION_CONCEPT_BY_CODE.LIKE,
        count: 2,
      },
    ]);
    d.reactionsRepo.listByActorTargets.mockResolvedValue([
      {
        reactableRefId: 'post-1',
        reactionTypeConceptId: REACTION_CONCEPT_BY_CODE.INSIGHTFUL,
      },
    ]);

    const mapa = await d.service.ofPosts(em, ['post-1'], 'p-lector');

    expect(mapa.get('post-1')?.reactions.tallies[0]?.reactionType).toBe('LIKE');
    expect(mapa.get('post-1')?.reactions.actorReactionType).toBe('INSIGHTFUL');
  });

  /**
   * Un concepto que no está en el enum del módulo —dato viejo o escrito por
   * fuera— se informa como no resuelto. Inventar un código diría que la fila
   * guarda algo que no guarda.
   */
  it('no inventa un código para un concepto desconocido', async () => {
    const d = build();
    d.reactionsRepo.summarizeByTargets.mockResolvedValue([
      {
        reactableRefId: 'post-1',
        reactionTypeConceptId: 'concepto-de-otra-epoca',
        count: 1,
      },
    ]);

    const mapa = await d.service.ofPosts(em, ['post-1']);

    expect(mapa.get('post-1')?.reactions.tallies[0]?.reactionType).toBeNull();
    expect(mapa.get('post-1')?.reactions.total).toBe(1);
  });

  it('sólo cuenta comentarios vigentes', async () => {
    const d = build();
    await d.service.ofPosts(em, ['post-1']);
    expect(d.commentsRepo.countByTargets).toHaveBeenCalledWith(
      em,
      SOCIAL_OBJECT_CONCEPT_BY_CODE.POST,
      ['post-1'],
      CONCEPTS.STATE_ACTIVE,
    );
  });
});
