import request from 'supertest';
import { bootstrapTestApp, bearer, type TestContext } from './harness';
import { SEED } from '../../src/common';

/**
 * Las lecturas del módulo Community (19), ejercidas de punta a punta contra la
 * aplicación y la base reales.
 *
 * Existe por el mismo motivo que `frontend-read-flows.int-spec.ts`: hasta esta
 * rama el módulo era **de sólo escritura**. Se podía publicar, comentar,
 * reaccionar, seguir y bloquear, y no había una sola operación para volver a
 * leer nada — ni siquiera el feed, que el fan-out materializaba en
 * `feed_items` para nadie.
 *
 * Cada caso escribe con los endpoints reales y vuelve a leer con los nuevos.
 * Las tres reglas que las unitarias no pueden demostrar —porque con el
 * `EntityManager` simulado la visibilidad la decide el propio mock— se
 * verifican acá contra filas de verdad: la visibilidad declarada del post, el
 * bloqueo entre perfiles, y que la review publicada no arrastre el encuentro
 * clínico que la respalda.
 */
describe('Lecturas de Community (integración)', () => {
  let ctx: TestContext;
  /** Sufijo único: la suite corre contra una base con datos de otras corridas. */
  const u = Date.now();

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  const http = () => request(ctx.app.getHttpServer());
  const auth = () => bearer(ctx.adminToken);

  /** Crea un perfil público y devuelve su id. */
  async function createProfile(suffix: string): Promise<string> {
    const res = await http()
      .post('/community/public-profiles')
      .set(auth())
      .send({
        tenantId: SEED.tenantId,
        targetId: ctx.adminUserId,
        slug: `int-${suffix}-${u}`,
        displayName: `Perfil ${suffix}`,
      })
      .expect(201);
    return res.body.id as string;
  }

  /** Publica un post del perfil dado y devuelve su id. */
  async function publishPost(
    profileId: string,
    body: Record<string, unknown>,
  ): Promise<string> {
    const res = await http()
      .post(`/community/profiles/${profileId}/posts`)
      .set(auth())
      .send(body)
      .expect(201);
    return res.body.id as string;
  }

  describe('perfil y muro', () => {
    it('la ficha del perfil se puede volver a leer, con sellos y prestigio', async () => {
      const profileId = await createProfile('ficha');

      const res = await http()
        .get(`/community/profiles/${profileId}`)
        .set(auth())
        .expect(200);

      expect(res.body.id).toBe(profileId);
      expect(res.body.slug).toBe(`int-ficha-${u}`);
      expect(Array.isArray(res.body.badges)).toBe(true);
      expect(res.body).toHaveProperty('prestige');
    });

    it('un perfil inexistente responde 404', async () => {
      await http()
        .get('/community/profiles/00000000-0000-4000-8000-000000000000')
        .set(auth())
        .expect(404);
    });

    it('el post publicado aparece en el muro de su autor', async () => {
      const profileId = await createProfile('muro');
      const postId = await publishPost(profileId, { bodyText: 'hola mundo' });

      const res = await http()
        .get(`/community/profiles/${profileId}/posts`)
        .set(auth())
        .expect(200);

      expect(
        (res.body.items as Array<{ id: string }>).map((post) => post.id),
      ).toContain(postId);
    });

    it('un cursor corrupto es error del cliente (400), no un 500', async () => {
      const profileId = await createProfile('cursor');

      await http()
        .get(`/community/profiles/${profileId}/posts?cursor=no-es-un-cursor`)
        .set(auth())
        .expect(400);
    });

    it('el cursor pagina sin repetir ni saltear filas', async () => {
      const profileId = await createProfile('pag');
      const primero = await publishPost(profileId, { bodyText: 'uno' });
      const segundo = await publishPost(profileId, { bodyText: 'dos' });

      const page1 = await http()
        .get(`/community/profiles/${profileId}/posts?limit=1`)
        .set(auth())
        .expect(200);
      expect(page1.body.items).toHaveLength(1);
      expect(page1.body.nextCursor).toBeTruthy();

      const page2 = await http()
        .get(
          `/community/profiles/${profileId}/posts?limit=1&cursor=${encodeURIComponent(
            page1.body.nextCursor as string,
          )}`,
        )
        .set(auth())
        .expect(200);

      const leidos = [
        ...(page1.body.items as Array<{ id: string }>).map((p) => p.id),
        ...(page2.body.items as Array<{ id: string }>).map((p) => p.id),
      ];
      expect(new Set(leidos).size).toBe(leidos.length);
      expect(leidos).toEqual(expect.arrayContaining([primero, segundo]));
    });
  });

  describe('visibilidad declarada del post', () => {
    it('un post PRIVATE no lo ve otro perfil, y responde 404 (no 403)', async () => {
      const autor = await createProfile('priv-autor');
      const lector = await createProfile('priv-lector');
      const postId = await publishPost(autor, {
        bodyText: 'sólo para mí',
        visibility: 'PRIVATE',
      });

      // El autor sí lo ve.
      await http()
        .get(`/community/posts/${postId}?actorProfileId=${autor}`)
        .set(auth())
        .expect(200);

      // Un tercero recibe 404: un 403 ya confirmaría que ese perfil publicó algo.
      await http()
        .get(`/community/posts/${postId}?actorProfileId=${lector}`)
        .set(auth())
        .expect(404);
    });

    it('un post FOLLOWERS sólo lo ve quien sigue al autor', async () => {
      const autor = await createProfile('fol-autor');
      const seguidor = await createProfile('fol-seguidor');
      const extraño = await createProfile('fol-extranio');
      const postId = await publishPost(autor, {
        bodyText: 'para mis seguidores',
        visibility: 'FOLLOWERS',
      });

      await http()
        .post('/community/follows')
        .set(auth())
        .send({
          followerProfileId: seguidor,
          followableType: 'PROFILE',
          followableRefId: autor,
        })
        .expect(201);

      await http()
        .get(`/community/posts/${postId}?actorProfileId=${seguidor}`)
        .set(auth())
        .expect(200);

      await http()
        .get(`/community/posts/${postId}?actorProfileId=${extraño}`)
        .set(auth())
        .expect(404);
    });

    it('un post sin visibilidad declarada se lee como público', async () => {
      const autor = await createProfile('pub-autor');
      const cualquiera = await createProfile('pub-lector');
      const postId = await publishPost(autor, { bodyText: 'abierto' });

      await http()
        .get(`/community/posts/${postId}?actorProfileId=${cualquiera}`)
        .set(auth())
        .expect(200);
    });
  });

  describe('bloqueo entre perfiles', () => {
    it('quien bloquea deja de ver el muro del bloqueado, en los dos sentidos', async () => {
      const bloqueador = await createProfile('blk-a');
      const bloqueado = await createProfile('blk-b');
      await publishPost(bloqueado, { bodyText: 'contenido del bloqueado' });

      await http()
        .post('/community/blocks')
        .set(auth())
        .send({ blockerProfileId: bloqueador, blockedProfileId: bloqueado })
        .expect(201);

      // El bloqueador no ve al bloqueado…
      const comoBloqueador = await http()
        .get(
          `/community/profiles/${bloqueado}/posts?actorProfileId=${bloqueador}`,
        )
        .set(auth())
        .expect(200);
      expect(comoBloqueador.body.items).toHaveLength(0);

      // …y el bloqueado tampoco ve al bloqueador: bloquear en un solo sentido
      // dejaría al bloqueado leyendo a quien lo bloqueó.
      await publishPost(bloqueador, { bodyText: 'contenido del bloqueador' });
      const comoBloqueado = await http()
        .get(
          `/community/profiles/${bloqueador}/posts?actorProfileId=${bloqueado}`,
        )
        .set(auth())
        .expect(200);
      expect(comoBloqueado.body.items).toHaveLength(0);
    });
  });

  describe('comentarios y reacciones', () => {
    it('el hilo devuelve las respuestas anidadas bajo su raíz', async () => {
      const perfil = await createProfile('hilo');
      const postId = await publishPost(perfil, { bodyText: 'con hilo' });

      const raiz = await http()
        .post('/community/comments')
        .set(auth())
        .send({
          authorProfileId: perfil,
          commentableType: 'POST',
          commentableRefId: postId,
          bodyText: 'comentario raíz',
        })
        .expect(201);

      await http()
        .post('/community/comments')
        .set(auth())
        .send({
          authorProfileId: perfil,
          commentableType: 'POST',
          commentableRefId: postId,
          parentCommentId: raiz.body.id,
          bodyText: 'respuesta',
        })
        .expect(201);

      const res = await http()
        .get(`/community/posts/${postId}/comments`)
        .set(auth())
        .expect(200);

      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].id).toBe(raiz.body.id);
      expect(res.body.items[0].replies).toHaveLength(1);
      expect(res.body.items[0].replies[0].bodyText).toBe('respuesta');
    });

    it('el resumen de reacciones cuenta por tipo y marca la del actor', async () => {
      const perfil = await createProfile('react');
      const postId = await publishPost(perfil, { bodyText: 'reaccionable' });

      await http()
        .put('/community/reactions')
        .set(auth())
        .send({
          actorProfileId: perfil,
          reactableType: 'POST',
          reactableRefId: postId,
          reactionType: 'LIKE',
        })
        .expect(200);

      const res = await http()
        .get(`/community/posts/${postId}/reactions?actorProfileId=${perfil}`)
        .set(auth())
        .expect(200);

      expect(res.body.total).toBe(1);
      expect(res.body.tallies).toHaveLength(1);
      expect(res.body.actorReactionTypeConceptId).toBeTruthy();
    });
  });

  describe('reviews', () => {
    it('la review publicada NUNCA arrastra el encuentro clínico ni el paciente', async () => {
      const profesional = await createProfile('rev-target');

      await http()
        .post(`/community/profiles/${profesional}/reviews`)
        .set(auth())
        .send({
          reviewerPatientProfileId: ctx.patientSubtypeId,
          overallRating: 5,
          reviewText: 'excelente atención',
        })
        .expect(201);

      const res = await http()
        .get(`/community/profiles/${profesional}/reviews`)
        .set(auth())
        .expect(200);

      const serializado = JSON.stringify(res.body);
      expect(serializado).not.toContain('verifiedEncounterId');
      expect(serializado).not.toContain('reviewerPatientProfileId');
      expect(serializado).not.toContain(ctx.patientSubtypeId);
    });
  });

  describe('fan-out del feed (ciclo del worker)', () => {
    it('descubre el post pendiente, lo reparte y el seguidor lo lee en su timeline', async () => {
      const autor = await createProfile('feed-autor');
      const seguidor = await createProfile('feed-seguidor');

      await http()
        .post('/community/follows')
        .set(auth())
        .send({
          followerProfileId: seguidor,
          followableType: 'PROFILE',
          followableRefId: autor,
        })
        .expect(201);

      const postId = await publishPost(autor, { bodyText: 'para el feed' });

      // 1. Descubrimiento: es lo que el worker consulta cada tick.
      const pending = await http()
        .get('/internal/community/feed/pending')
        .set(auth())
        .expect(200);
      const item = (
        pending.body.items as Array<{
          postId: string;
          followerProfileIds: string[];
        }>
      ).find((candidate) => candidate.postId === postId);
      expect(item).toBeDefined();
      expect(item?.followerProfileIds).toContain(seguidor);

      // 2. Reparto.
      await http()
        .post('/internal/community/feed/rebuild')
        .set(auth())
        .send({
          sourceRefId: postId,
          followerProfileIds: item?.followerProfileIds ?? [],
          origin: 'FOLLOWING',
        })
        .expect(201);

      // 3. Lectura: el timeline del seguidor trae el post hidratado.
      const feed = await http()
        .get(`/community/feed?profileId=${seguidor}`)
        .set(auth())
        .expect(200);

      const entrada = (
        feed.body.items as Array<{
          sourceRefId: string;
          post: { bodyText: string } | null;
        }>
      ).find((candidate) => candidate.sourceRefId === postId);
      expect(entrada).toBeDefined();
      expect(entrada?.post?.bodyText).toBe('para el feed');
    });

    it('repartir dos veces no duplica la entrada del timeline', async () => {
      const autor = await createProfile('idem-autor');
      const seguidor = await createProfile('idem-seguidor');
      const postId = await publishPost(autor, { bodyText: 'idempotente' });

      const cuerpo = {
        sourceRefId: postId,
        followerProfileIds: [seguidor],
        origin: 'FOLLOWING',
      };
      const primera = await http()
        .post('/internal/community/feed/rebuild')
        .set(auth())
        .send(cuerpo)
        .expect(201);
      const segunda = await http()
        .post('/internal/community/feed/rebuild')
        .set(auth())
        .send(cuerpo)
        .expect(201);

      expect(primera.body.itemsCreated).toBe(1);
      expect(segunda.body.itemsCreated).toBe(0);
    });
  });

  describe('lecturas privadas', () => {
    it('la bandeja de notificaciones trae el total sin leer', async () => {
      const perfil = await createProfile('notif');

      const res = await http()
        .get(`/community/notifications?profileId=${perfil}`)
        .set(auth())
        .expect(200);

      expect(typeof res.body.unreadCount).toBe('number');
      expect(Array.isArray(res.body.items)).toBe(true);
    });

    it('el listado de grupos exige la organización', async () => {
      await http().get('/community/groups').set(auth()).expect(400);

      await http()
        .get(`/community/groups?tenantId=${SEED.tenantId}`)
        .set(auth())
        .expect(200);
    });
  });

  it('ninguna lectura responde sin sesión', async () => {
    const perfil = await createProfile('sin-auth');

    await http().get(`/community/profiles/${perfil}`).expect(401);
    await http().get(`/community/feed?profileId=${perfil}`).expect(401);
  });
});
