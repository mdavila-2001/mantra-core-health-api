import { jest } from '@jest/globals';

// Loose-typed mock factory: runtime 'jest' pero sin los tipos estrictos Mock<never>.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ForbiddenException } from '@nestjs/common';
import { CommunitySocialService } from './community-social.service';
import { AttachableFileService } from '../../common/services';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = {
    flush: mockFn().mockResolvedValue(undefined),
    remove: mockFn(),
  };
  // `fork` devuelve el mismo doble: `getOwnProfile` lee con un contexto propio
  // y `upsertOwnProfile` escribe en una transacción, pero para la prueba es el
  // mismo objeto.
  const em: any = { transactional: mockFn((cb: any) => cb(tx)) };
  em.fork = mockFn(() => em);
  const profilesRepo = {
    findById: mockFn(),
    findByTenant: mockFn(() => Promise.resolve([])),
    findByTarget: mockFn(() => Promise.resolve(null)),
    findBySlug: mockFn(() => Promise.resolve(null)),
    create: mockFn(),
  };
  const postsRepo = {
    findByAuthor: mockFn(() => Promise.resolve([])),
    create: mockFn(),
    createMedia: mockFn(),
    upsertHashtag: mockFn(),
    linkHashtag: mockFn(),
    createMention: mockFn(),
  };
  const commentsRepo = { findById: mockFn(), create: mockFn() };
  const reactionsRepo = { findByActorTarget: mockFn(), create: mockFn() };
  const bookmarksRepo = { findByProfileTarget: mockFn(), create: mockFn() };
  const followsRepo = {
    findByFollowerTarget: mockFn(),
    findMutualBetween: mockFn().mockResolvedValue([]),
    create: mockFn(),
  };
  const blocksRepo = { findByPair: mockFn(), create: mockFn() };
  // La propiedad del perfil con el que se firma se concede por defecto: *que* se
  // exija se prueba caso por caso más abajo, y *cómo* se decide es asunto de
  // `CommunityVisibilityService`, que tiene su propia prueba con la regla real.
  const visibility = {
    assertActsAsProfile: mockFn(() => Promise.resolve(undefined)),
  };
  // Por defecto el archivo adjunto existe, es del actor y su versión está limpia:
  // así las pruebas que no hablan de media no tienen que montarlo.
  const filesRepo = {
    findById: mockFn(() =>
      Promise.resolve({
        id: 'f1',
        createdByUserId: actor.id,
        currentVersionId: 'v1',
        lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
      }),
    ),
  };
  const fileVersionsRepo = {
    findById: mockFn(() =>
      Promise.resolve({
        id: 'v1',
        malwareScanStatusConceptId: CONCEPTS.SCAN_CLEAN,
      }),
    ),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  // El servicio compartido va **de verdad**, no doblado: la regla que interesa
  // acá es la que corre en producción, y sus casos siguen escribiéndose contra
  // los repositorios como antes de extraerla.
  const attachableFiles = new AttachableFileService(
    filesRepo as any,
    fileVersionsRepo as any,
    logger as any,
  );

  const service = new CommunitySocialService(
    em as any,
    profilesRepo as any,
    postsRepo as any,
    commentsRepo as any,
    reactionsRepo as any,
    bookmarksRepo as any,
    followsRepo as any,
    blocksRepo as any,
    visibility as any,
    attachableFiles,
    logger as any,
  );
  return {
    service,
    em,
    tx,
    profilesRepo,
    postsRepo,
    commentsRepo,
    reactionsRepo,
    bookmarksRepo,
    followsRepo,
    blocksRepo,
    visibility,
    filesRepo,
    fileVersionsRepo,
  };
}

describe('CommunitySocialService', () => {
  describe('createProfile', () => {
    it('creates the public profile and returns its id/slug', async () => {
      const d = build();
      d.profilesRepo.create.mockReturnValue({
        id: 'p1',
        slug: 's',
        displayName: 'N',
        statusConceptId: CONCEPTS.STATE_ACTIVE,
      });
      const res = await d.service.createProfile(
        { tenantId: 't', targetId: 'u', slug: 's', displayName: 'N' },
        actor,
      );
      expect(res).toEqual({
        id: 'p1',
        slug: 's',
        displayName: 'N',
        status: CONCEPTS.STATE_ACTIVE,
      });
      expect(d.tx.flush).toHaveBeenCalled();
    });
  });

  describe('getOwnProfile', () => {
    /**
     * No tener vitrina es el estado normal de todo el mundo hasta que decide
     * publicar algo: no puede salir como un fallo.
     */
    it('devuelve null cuando el sujeto todavía no tiene vitrina', async () => {
      const d = build();
      d.profilesRepo.findByTarget.mockResolvedValue(null);

      const perfil = await d.service.getOwnProfile({
        id: 'u-1',
        roles: [],
      } as any);

      expect(perfil).toBeNull();
    });

    /** Un profesional se representa por su perfil profesional, no por la cuenta. */
    it('resuelve por el perfil profesional cuando la sesión es de un practitioner', async () => {
      const d = build();
      d.profilesRepo.findByTarget.mockResolvedValue({
        id: 'pp-1',
        tenantId: 't-1',
        targetId: 'hp-1',
        slug: 'dra-salas',
        displayName: 'Dra. Salas',
        statusConceptId: CONCEPTS.STATE_ACTIVE,
      });

      await d.service.getOwnProfile({
        id: 'u-1',
        roles: [],
        practitionerProfileId: 'hp-1',
      } as any);

      expect(d.profilesRepo.findByTarget).toHaveBeenCalledWith(d.em, 'hp-1');
    });

    it('una cuenta sin perfil profesional se representa a sí misma', async () => {
      const d = build();
      await d.service.getOwnProfile({ id: 'u-1', roles: [] } as any);

      expect(d.profilesRepo.findByTarget).toHaveBeenCalledWith(d.em, 'u-1');
    });

    /**
     * El desajuste que se comprobó en vivo: la escritura acepta como titular el
     * perfil profesional **o** la cuenta, y la lectura miraba sólo el primero.
     * Una profesional con vitrina a nombre de su cuenta publicaba con ella y
     * recibía `null` al pedir la suya.
     */
    it('encuentra la vitrina creada a nombre de la cuenta de un profesional', async () => {
      const d = build();
      d.profilesRepo.findByTarget.mockImplementation((_em: any, targetId: string) =>
        Promise.resolve(
          targetId === 'u-1'
            ? {
                id: 'pp-1',
                tenantId: 't-1',
                targetId: 'u-1',
                slug: 'dra-salas',
                displayName: 'Dra. Salas',
                statusConceptId: CONCEPTS.STATE_ACTIVE,
              }
            : null,
        ),
      );

      const perfil = await d.service.getOwnProfile({
        id: 'u-1',
        roles: [],
        practitionerProfileId: 'hp-1',
      } as any);

      expect(perfil?.id).toBe('pp-1');
      // Primero el perfil profesional, que es el sujeto canónico; la cuenta es
      // el camino alternativo, no el preferido.
      expect(d.profilesRepo.findByTarget).toHaveBeenNthCalledWith(1, d.em, 'hp-1');
      expect(d.profilesRepo.findByTarget).toHaveBeenNthCalledWith(2, d.em, 'u-1');
    });
  });

  describe('upsertOwnProfile', () => {
    it('editar la vitrina propia con su mismo slug no da conflicto', async () => {
      // El slug ocupado es el suyo: si la comprobación mirase sólo el sujeto
      // preferido, editar su propia vitrina le respondería «ese enlace ya está
      // en uso».
      const d = build();
      const propia = {
        id: 'pp-1',
        tenantId: 't-1',
        targetId: 'u-1',
        slug: 'dra-salas',
        displayName: 'Dra. Salas',
        statusConceptId: CONCEPTS.STATE_ACTIVE,
      };
      d.profilesRepo.findBySlug.mockResolvedValue(propia);
      d.profilesRepo.findByTarget.mockImplementation((_em: any, targetId: string) =>
        Promise.resolve(targetId === 'u-1' ? propia : null),
      );

      await expect(
        d.service.upsertOwnProfile(
          { tenantId: 't-1', slug: 'dra-salas', displayName: 'Dra. Salas' },
          { id: 'u-1', roles: [], practitionerProfileId: 'hp-1' } as any,
        ),
      ).resolves.toBeDefined();
    });

    /** Sin vitrina previa: crea. */
    it('crea la vitrina cuando el sujeto no tenía ninguna', async () => {
      const d = build();
      d.profilesRepo.findByTarget
        .mockResolvedValueOnce(null) // dentro de la transacción, antes de crear
        .mockResolvedValueOnce({
          id: 'pp-1',
          tenantId: 't-1',
          targetId: 'u-1',
          slug: 'nuevo-slug',
          displayName: 'Nombre',
          statusConceptId: CONCEPTS.STATE_ACTIVE,
        }); // la relectura posterior

      const resultado = await d.service.upsertOwnProfile(
        { tenantId: 't-1', slug: 'nuevo-slug', displayName: 'Nombre' },
        { id: 'u-1', roles: [] } as any,
      );

      expect(d.profilesRepo.create).toHaveBeenCalled();
      expect(resultado.slug).toBe('nuevo-slug');
    });

    /** Con vitrina previa: actualiza el objeto existente, no crea uno nuevo. */
    it('actualiza la vitrina existente en vez de duplicarla', async () => {
      const d = build();
      const existente = {
        id: 'pp-1',
        tenantId: 't-1',
        targetId: 'u-1',
        slug: 'slug-viejo',
        displayName: 'Nombre viejo',
        headline: undefined,
        biography: undefined,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
      };
      d.profilesRepo.findByTarget.mockResolvedValue(existente);
      // El `findBySlug` dentro de la transacción encuentra la MISMA fila que se
      // está editando: no es un choque, es la vitrina propia.
      d.profilesRepo.findBySlug.mockResolvedValue(existente);

      await d.service.upsertOwnProfile(
        { tenantId: 't-1', slug: 'slug-nuevo', displayName: 'Nombre nuevo' },
        { id: 'u-1', roles: [] } as any,
      );

      expect(d.profilesRepo.create).not.toHaveBeenCalled();
      expect(existente.slug).toBe('slug-nuevo');
      expect(existente.displayName).toBe('Nombre nuevo');
    });

    /**
     * Dos vitrinas con el mismo slug serían dos enlaces que llevan a personas
     * distintas según cuál resuelva primero.
     */
    it('rechaza un slug que ya usa otro sujeto', async () => {
      const d = build();
      d.profilesRepo.findBySlug.mockResolvedValue({
        id: 'pp-de-otro',
        targetId: 'otro-sujeto',
      });

      await expect(
        d.service.upsertOwnProfile(
          { tenantId: 't-1', slug: 'ocupado', displayName: 'Nombre' },
          { id: 'u-1', roles: [] } as any,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.profilesRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('publishPost (UC-19-01)', () => {
    it('throws when the author profile does not exist', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.publishPost('missing', { bodyText: 'x' } as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('flushes the post before children and links hashtags', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue({
        id: 'p1',
        commentsDefaultEnabled: true,
      });
      d.postsRepo.create.mockReturnValue({
        id: 'post1',
        authorPublicProfileId: 'p1',
        publicationStatusConceptId: 'pub',
        publishedAt: new Date(),
      });
      d.postsRepo.upsertHashtag.mockResolvedValue({ id: 'h1' });
      const res = await d.service.publishPost(
        'p1',
        {
          bodyText: 'hi',
          hashtags: ['salud'],
          media: [{ fileId: 'f1' }],
          mentions: [{ mentionedProfileId: 'm1' }],
        },
        actor,
      );
      expect(res.id).toBe('post1');
      expect(res.hashtagCount).toBe(1);
      expect(res.mediaCount).toBe(1);
      expect(d.postsRepo.linkHashtag).toHaveBeenCalledWith(
        d.tx,
        'h1',
        'post1',
        expect.any(String),
        actor.id,
      );
      expect(d.postsRepo.createMention).toHaveBeenCalled();
    });

    /** Autor válido con un post listo para publicar; sólo cambia la media. */
    function withAuthor(d: ReturnType<typeof build>) {
      d.profilesRepo.findById.mockResolvedValue({
        id: 'p1',
        commentsDefaultEnabled: true,
      });
      d.postsRepo.create.mockReturnValue({
        id: 'post1',
        authorPublicProfileId: 'p1',
        publicationStatusConceptId: 'pub',
        publishedAt: new Date(),
      });
    }

    it('refuses to attach a file uploaded by someone else', async () => {
      const d = build();
      withAuthor(d);
      d.filesRepo.findById.mockResolvedValue({
        id: 'f1',
        createdByUserId: 'otro-usuario',
        currentVersionId: 'v1',
        lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
      });

      await expect(
        d.service.publishPost(
          'p1',
          { bodyText: 'hi', media: [{ fileId: 'f1' }] } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.postsRepo.createMedia).not.toHaveBeenCalled();
    });

    it('refuses a media file that does not exist', async () => {
      const d = build();
      withAuthor(d);
      d.filesRepo.findById.mockResolvedValue(null);

      await expect(
        d.service.publishPost(
          'p1',
          { bodyText: 'hi', media: [{ fileId: 'fantasma' }] } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.postsRepo.createMedia).not.toHaveBeenCalled();
    });

    it('refuses a media file whose current version is infected', async () => {
      const d = build();
      withAuthor(d);
      d.fileVersionsRepo.findById.mockResolvedValue({
        id: 'v1',
        malwareScanStatusConceptId: CONCEPTS.SCAN_INFECTED,
      });

      await expect(
        d.service.publishPost(
          'p1',
          { bodyText: 'hi', media: [{ fileId: 'f1' }] } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.postsRepo.createMedia).not.toHaveBeenCalled();
    });

    it('refuses a soft-deleted media file', async () => {
      const d = build();
      withAuthor(d);
      d.filesRepo.findById.mockResolvedValue({
        id: 'f1',
        createdByUserId: actor.id,
        currentVersionId: 'v1',
        deletedAt: new Date('2026-01-01'),
        lifecycleStatusConceptId: CONCEPTS.FILE_DELETED,
      });

      await expect(
        d.service.publishPost(
          'p1',
          { bodyText: 'hi', media: [{ fileId: 'f1' }] } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.postsRepo.createMedia).not.toHaveBeenCalled();
    });

    it('attaches media in a stable order when the file is the author own', async () => {
      const d = build();
      withAuthor(d);

      await d.service.publishPost(
        'p1',
        {
          bodyText: 'hi',
          media: [{ fileId: 'f1' }, { fileId: 'f2' }],
        } as any,
        actor,
      );

      expect(d.postsRepo.createMedia).toHaveBeenCalledTimes(2);
      expect(d.postsRepo.createMedia).toHaveBeenNthCalledWith(
        1,
        d.tx,
        expect.objectContaining({ fileId: 'f1', ordinal: 0 }),
      );
      expect(d.postsRepo.createMedia).toHaveBeenNthCalledWith(
        2,
        d.tx,
        expect.objectContaining({ fileId: 'f2', ordinal: 1 }),
      );
    });
  });

  describe('createComment (UC-19-02)', () => {
    it('computes thread depth and increments the parent reply count', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue({ id: 'p1' });
      const parent = {
        id: 'c0',
        rootCommentId: null,
        threadDepth: 0,
        replyCount: 2,
        updatedAt: new Date(),
      };
      d.commentsRepo.findById.mockResolvedValue(parent);
      d.commentsRepo.create.mockReturnValue({ id: 'c1' });
      const res = await d.service.createComment(
        {
          authorProfileId: 'p1',
          commentableType: 'POST',
          commentableRefId: 'post1',
          parentCommentId: 'c0',
          bodyText: 'hi',
        } as any,
        actor,
      );
      expect(res.threadDepth).toBe(1);
      expect(res.rootCommentId).toBe('c0');
      expect(parent.replyCount).toBe(3);
    });

    it('throws when the author profile does not exist', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.createComment(
          {
            authorProfileId: 'x',
            commentableType: 'POST',
            commentableRefId: 'r',
            bodyText: 'y',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('react (UC-19-03)', () => {
    it('updates the existing reaction type (created=false)', async () => {
      const d = build();
      d.reactionsRepo.findByActorTarget.mockResolvedValue({
        id: 'r1',
        reactionTypeConceptId: 'old',
        updatedAt: new Date(),
      });
      const res = await d.service.react(
        {
          actorProfileId: 'p1',
          reactableType: 'POST',
          reactableRefId: 'post1',
          reactionType: 'LOVE',
        } as any,
        actor,
      );
      expect(res).toEqual({ id: 'r1', created: false, reactionType: 'LOVE' });
      expect(d.reactionsRepo.create).not.toHaveBeenCalled();
    });

    it('creates a new reaction when none exists (created=true)', async () => {
      const d = build();
      d.reactionsRepo.findByActorTarget.mockResolvedValue(null);
      d.reactionsRepo.create.mockReturnValue({ id: 'r2' });
      const res = await d.service.react(
        {
          actorProfileId: 'p1',
          reactableType: 'POST',
          reactableRefId: 'post1',
          reactionType: 'LIKE',
        } as any,
        actor,
      );
      expect(res).toEqual({ id: 'r2', created: true, reactionType: 'LIKE' });
    });
  });

  describe('bookmark (UC-19-04)', () => {
    it('rejects duplicate bookmarks', async () => {
      const d = build();
      d.bookmarksRepo.findByProfileTarget.mockResolvedValue({ id: 'b1' });
      await expect(
        d.service.bookmark(
          {
            profileId: 'p1',
            bookmarkableType: 'POST',
            bookmarkableRefId: 'post1',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('follow (UC-19-05)', () => {
    it('rejects self-follow', async () => {
      const d = build();
      await expect(
        d.service.follow(
          {
            followerProfileId: 'p1',
            followableType: 'PROFILE',
            followableRefId: 'p1',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects an already active follow (conflict)', async () => {
      const d = build();
      d.followsRepo.findByFollowerTarget.mockResolvedValue({
        id: 'f1',
        statusConceptId: CONCEPTS.STATE_ACTIVE,
      });
      await expect(
        d.service.follow(
          {
            followerProfileId: 'p1',
            followableType: 'PROFILE',
            followableRefId: 'p2',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('block (UC-19-14)', () => {
    it('rejects blocking oneself', async () => {
      const d = build();
      await expect(
        d.service.block(
          { blockerProfileId: 'p1', blockedProfileId: 'p1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('creates the block and prunes mutual follows', async () => {
      const d = build();
      d.blocksRepo.findByPair.mockResolvedValue(null);
      d.blocksRepo.create.mockReturnValue({ id: 'blk1' });
      const follow = {
        id: 'f1',
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        updatedAt: new Date(),
      };
      d.followsRepo.findMutualBetween.mockResolvedValue([follow]);
      const res = await d.service.block(
        {
          blockerProfileId: 'p1',
          blockedProfileId: 'p2',
          reason: 'SPAM',
        } as any,
        actor,
      );
      expect(res).toEqual({ id: 'blk1' });
      expect(follow.statusConceptId).not.toBe(CONCEPTS.STATE_ACTIVE);
    });

    /**
     * Un bloqueo levantado deja la fila en `STATE_REVOKED`. Si el 409 de
     * duplicado no distinguía el estado, «bloqueé, desbloqueé, quiero volver a
     * bloquear» quedaba bloqueado para siempre.
     */
    it('vuelve a bloquear reactivando la fila revocada, sin 409', async () => {
      const d = build();
      const previo = {
        id: 'blk1',
        statusConceptId: CONCEPTS.STATE_REVOKED,
        updatedAt: new Date(),
      };
      d.blocksRepo.findByPair.mockResolvedValue(previo);
      const res = await d.service.block(
        { blockerProfileId: 'p1', blockedProfileId: 'p2' } as any,
        actor,
      );
      expect(res).toEqual({ id: 'blk1' });
      expect(previo.statusConceptId).toBe(CONCEPTS.STATE_ACTIVE);
      expect(d.blocksRepo.create).not.toHaveBeenCalled();
    });
  });

  /**
   * El perfil con el que se firma una escritura no lo elige el cliente.
   *
   * Cada una de estas llamadas recibía el perfil autor en el cuerpo o en la ruta
   * y ninguna comprobaba que fuera del actor. Con el uuid de un perfil ajeno
   * —que las lecturas del muro publican— se podía publicar, comentar, reaccionar,
   * guardar, seguir y bloquear en nombre de otro.
   *
   * Se prueba que la comprobación se pide **con el perfil correcto** y que su
   * negativa corta la operación. La regla en sí vive en
   * `CommunityVisibilityService`.
   */
  describe('propiedad del perfil que firma', () => {
    const casos: readonly {
      nombre: string;
      perfil: string;
      ejecutar: (d: ReturnType<typeof build>) => Promise<unknown>;
    }[] = [
      {
        nombre: 'publishPost',
        perfil: 'p1',
        ejecutar: (d) => {
          d.profilesRepo.findById.mockResolvedValue({ id: 'p1' });
          d.postsRepo.create.mockReturnValue({ id: 'post1' });
          return d.service.publishPost('p1', { bodyText: 'x' } as any, actor);
        },
      },
      {
        nombre: 'createComment',
        perfil: 'p1',
        ejecutar: (d) => {
          d.profilesRepo.findById.mockResolvedValue({ id: 'p1' });
          d.commentsRepo.create.mockReturnValue({ id: 'c1' });
          return d.service.createComment(
            {
              authorProfileId: 'p1',
              commentableType: 'POST',
              commentableRefId: 'post1',
              bodyText: 'x',
            } as any,
            actor,
          );
        },
      },
      {
        nombre: 'react',
        perfil: 'p1',
        ejecutar: (d) => {
          d.reactionsRepo.findByActorTarget.mockResolvedValue(null);
          d.reactionsRepo.create.mockReturnValue({ id: 'r1' });
          return d.service.react(
            {
              actorProfileId: 'p1',
              reactableType: 'POST',
              reactableRefId: 'post1',
              reactionType: 'LIKE',
            } as any,
            actor,
          );
        },
      },
      {
        nombre: 'bookmark',
        perfil: 'p1',
        ejecutar: (d) => {
          d.bookmarksRepo.findByProfileTarget.mockResolvedValue(null);
          d.bookmarksRepo.create.mockReturnValue({ id: 'b1' });
          return d.service.bookmark(
            {
              profileId: 'p1',
              bookmarkableType: 'POST',
              bookmarkableRefId: 'post1',
            } as any,
            actor,
          );
        },
      },
      {
        nombre: 'follow',
        perfil: 'p1',
        ejecutar: (d) => {
          d.followsRepo.findByFollowerTarget.mockResolvedValue(null);
          d.followsRepo.create.mockReturnValue({ id: 'f1' });
          return d.service.follow(
            {
              followerProfileId: 'p1',
              followableType: 'PROFILE',
              followableRefId: 'p2',
            } as any,
            actor,
          );
        },
      },
      {
        nombre: 'block',
        perfil: 'p1',
        ejecutar: (d) => {
          d.blocksRepo.findByPair.mockResolvedValue(null);
          d.blocksRepo.create.mockReturnValue({ id: 'blk1' });
          return d.service.block(
            { blockerProfileId: 'p1', blockedProfileId: 'p2' } as any,
            actor,
          );
        },
      },
      {
        nombre: 'unfollow',
        perfil: 'p1',
        ejecutar: (d) => {
          d.followsRepo.findByFollowerTarget.mockResolvedValue(null);
          return d.service.unfollow(
            {
              followerProfileId: 'p1',
              followableType: 'PROFILE',
              followableRefId: 'p2',
            } as any,
            actor,
          );
        },
      },
      {
        nombre: 'unbookmark',
        perfil: 'p1',
        ejecutar: (d) => {
          d.bookmarksRepo.findByProfileTarget.mockResolvedValue(null);
          return d.service.unbookmark(
            {
              profileId: 'p1',
              bookmarkableType: 'POST',
              bookmarkableRefId: 'post1',
            } as any,
            actor,
          );
        },
      },
      {
        nombre: 'unblock',
        perfil: 'p1',
        ejecutar: (d) => {
          d.blocksRepo.findByPair.mockResolvedValue(null);
          return d.service.unblock(
            { blockerProfileId: 'p1', blockedProfileId: 'p2' } as any,
            actor,
          );
        },
      },
    ];

    for (const caso of casos) {
      it(`${caso.nombre} exige que el perfil sea del actor`, async () => {
        const d = build();
        await caso.ejecutar(d);
        expect(d.visibility.assertActsAsProfile).toHaveBeenCalledWith(
          expect.anything(),
          caso.perfil,
          actor,
        );
      });

      it(`${caso.nombre} no escribe si el perfil no es del actor`, async () => {
        const d = build();
        d.visibility.assertActsAsProfile.mockRejectedValue(
          new Error('perfil ajeno'),
        );
        await expect(caso.ejecutar(d)).rejects.toThrow('perfil ajeno');
        expect(d.tx.flush).not.toHaveBeenCalled();
      });
    }
  });

  describe('unfollow (UC-19-05, cara inversa)', () => {
    it('pasa el follow activo a FOLLOW_REMOVED sin borrar la fila', async () => {
      const d = build();
      const follow = {
        id: 'f1',
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        updatedAt: new Date(),
      };
      d.followsRepo.findByFollowerTarget.mockResolvedValue(follow);
      const res = await d.service.unfollow(
        {
          followerProfileId: 'p1',
          followableType: 'PROFILE',
          followableRefId: 'p2',
        } as any,
        actor,
      );
      expect(res).toEqual({ removed: true });
      expect(follow.statusConceptId).not.toBe(CONCEPTS.STATE_ACTIVE);
    });

    /**
     * Es un conmutador: si el follow ya no está, el estado final es el que se
     * pedía. Un error obligaría a la pantalla a tratarlo como fallo.
     */
    it('devuelve removed=false cuando ya no seguía, sin error', async () => {
      const d = build();
      d.followsRepo.findByFollowerTarget.mockResolvedValue({
        id: 'f1',
        statusConceptId: 'otro-estado',
      });
      await expect(
        d.service.unfollow(
          {
            followerProfileId: 'p1',
            followableType: 'PROFILE',
            followableRefId: 'p2',
          } as any,
          actor,
        ),
      ).resolves.toEqual({ removed: false });
    });
  });

  describe('unbookmark (UC-19-04, cara inversa)', () => {
    it('quita el marcador', async () => {
      const d = build();
      d.bookmarksRepo.findByProfileTarget.mockResolvedValue({
        id: 'b1',
        collectionName: undefined,
      });
      const res = await d.service.unbookmark(
        {
          profileId: 'p1',
          bookmarkableType: 'POST',
          bookmarkableRefId: 'post1',
        } as any,
        actor,
      );
      expect(res).toEqual({ removed: true });
      expect(d.tx.remove).toHaveBeenCalled();
    });

    it('no quita un marcador de otra colección cuando se acotó a una', async () => {
      const d = build();
      d.bookmarksRepo.findByProfileTarget.mockResolvedValue({
        id: 'b1',
        collectionName: 'lecturas',
      });
      const res = await d.service.unbookmark(
        {
          profileId: 'p1',
          bookmarkableType: 'POST',
          bookmarkableRefId: 'post1',
          collectionName: 'guardados',
        } as any,
        actor,
      );
      expect(res).toEqual({ removed: false });
      expect(d.tx.remove).not.toHaveBeenCalled();
    });
  });

  describe('unblock (UC-19-14, cara inversa)', () => {
    it('revoca el bloqueo activo', async () => {
      const d = build();
      const block = {
        id: 'blk1',
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        updatedAt: new Date(),
      };
      d.blocksRepo.findByPair.mockResolvedValue(block);
      const res = await d.service.unblock(
        { blockerProfileId: 'p1', blockedProfileId: 'p2' } as any,
        actor,
      );
      expect(res).toEqual({ removed: true });
      expect(block.statusConceptId).toBe(CONCEPTS.STATE_REVOKED);
    });

    /**
     * Bloquear cortó dos relaciones que existían; desbloquear devuelve el
     * permiso de volver a seguir, no la decisión de seguir.
     */
    it('no reactiva los follows que la poda del bloqueo removió', async () => {
      const d = build();
      d.blocksRepo.findByPair.mockResolvedValue({
        id: 'blk1',
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        updatedAt: new Date(),
      });
      await d.service.unblock(
        { blockerProfileId: 'p1', blockedProfileId: 'p2' } as any,
        actor,
      );
      expect(d.followsRepo.findMutualBetween).not.toHaveBeenCalled();
    });
  });
});
