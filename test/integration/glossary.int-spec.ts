import request from 'supertest';
import { MikroORM } from '@mikro-orm/postgresql';
import { bootstrapTestApp, bearer, type TestContext } from './harness';
import { CONCEPTS, SEED, createdBy } from '../../src/common';
import {
  CatalogConcepts,
  ValueSetMembers,
} from '../../src/modules/terminology/entities';
import { GlossarySeedService } from '../../src/common/seed/glossary-seed.service';
import {
  GLOSSARY_ALL_TERMS,
  GLOSSARY_CATEGORIES,
  glossaryTermConceptId,
  glossaryValueSetId,
  glossaryValueSetMemberId,
  glossaryValueSetVersionId,
} from '../../src/common/seed/glossary-taxonomy';
import { GLOSSARY_TERMS } from '../../src/common/seed/glossary-terms.catalog';

/**
 * Pruebas de integración del glosario médico (Carril 03) contra la base real:
 * búsqueda por texto, filtro por categoría con conteo, ficha con relaciones
 * tipadas, respaldo a castellano cuando falta el inglés, exclusión de
 * borradores y re-siembra idempotente.
 *
 * El glosario se materializa solo con `bootstrapTestApp()` — `GlossarySeedService`
 * ya corre en `SeedBootstrapService.onApplicationBootstrap()` — así que estas
 * pruebas no siembran nada por su cuenta salvo el término en borrador del
 * bloque de exclusión, que se limpia después de usarlo.
 */
describe('Glosario médico (integración)', () => {
  let ctx: TestContext;
  let orm: MikroORM;

  const anatomyCategory = GLOSSARY_CATEGORIES.find(
    (category) => category.key === 'anatomy',
  )!;
  const anatomyValueSetId = glossaryValueSetId(anatomyCategory.internalCode);
  const allTermsValueSetId = glossaryValueSetId(
    GLOSSARY_ALL_TERMS.internalCode,
  );

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    orm = ctx.orm;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  /**
   * Ejecuta la operación http.
   * @returns Resultado de http.
   */
  const http = () => request(ctx.app.getHttpServer());

  describe('categorías y conteo', () => {
    it('GET /terminology/value-sets?code= devuelve la categoría con su memberCount', async () => {
      const res = await http()
        .get('/terminology/value-sets')
        .query({ code: anatomyCategory.internalCode })
        .set(bearer(ctx.adminToken))
        .expect(200);

      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0]).toMatchObject({
        id: anatomyValueSetId,
        internalCode: anatomyCategory.internalCode,
        // 6 términos de anatomía en el catálogo curado (ver glossary-terms.catalog.spec.ts).
        memberCount: 6,
      });
    });

    it('GET /terminology/concepts?valueSetId=<anatomía> devuelve sólo los 6 términos de esa categoría', async () => {
      const res = await http()
        .get('/terminology/concepts')
        .query({ valueSetId: anatomyValueSetId, lang: 'ES', limit: 50 })
        .set(bearer(ctx.adminToken))
        .expect(200);

      expect(res.body.count).toBe(6);
      for (const item of res.body.items) {
        expect(item.category).toMatchObject({
          internalCode: anatomyCategory.internalCode,
          name: 'Anatomía',
        });
        expect(item.status).toBe('active');
        expect(typeof item.slug).toBe('string');
      }
      const slugs = res.body.items.map((item: { slug: string }) => item.slug);
      expect(slugs).toEqual(
        expect.arrayContaining(['corazon', 'pulmon', 'higado', 'rinon']),
      );
    });
  });

  describe('búsqueda por texto', () => {
    it('scoped al glosario (glossary-all-terms) encuentra el término por texto libre', async () => {
      // La búsqueda de texto corre sobre `code`/`display`
      // (`CatalogConceptsRepository.search`, sin cambios en este carril), no
      // sobre la designación ES: se busca sin tilde, que es lo que calza contra
      // el código determinista `GLOSSARY_CORAZON`. Buscar "Corazón" con tilde
      // no encontraría nada por la misma razón — limitación preexistente de la
      // búsqueda por texto, documentada en `CARRIL_REPORT.md`, no algo que este
      // carril deba resolver.
      const res = await http()
        .get('/terminology/concepts')
        .query({ q: 'corazon', valueSetId: allTermsValueSetId, lang: 'ES' })
        .set(bearer(ctx.adminToken))
        .expect(200);

      expect(res.body.count).toBe(1);
      expect(res.body.items[0]).toMatchObject({
        slug: 'corazon',
        display: 'Corazón',
        category: {
          internalCode: 'glossary-category-anatomy',
          name: 'Anatomía',
        },
        tags: ['Cardiovascular'],
        status: 'active',
      });
      expect(res.body.items[0].relationsCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('ficha de un término', () => {
    it('trae slug, categoría, definiciones y relaciones tipadas resueltas', async () => {
      const conceptId = glossaryTermConceptId('corazon');

      const res = await http()
        .get(`/terminology/concepts/${conceptId}`)
        .query({ lang: 'ES' })
        .set(bearer(ctx.adminToken))
        .expect(200);

      expect(res.body).toMatchObject({
        conceptId,
        slug: 'corazon',
        display: 'Corazón',
        category: {
          internalCode: 'glossary-category-anatomy',
          name: 'Anatomía',
        },
      });
      expect(res.body.tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            internalCode: 'glossary-tag-cardiovascular',
          }),
        ]),
      );
      expect(res.body.clinicalDefinition).toMatchObject({ translated: true });
      expect(res.body.plainSummary).toMatchObject({ translated: true });
      expect(res.body.relations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'RELATED_TERM',
            slug: 'insuficiencia-cardiaca',
          }),
          expect.objectContaining({
            type: 'RELATED_TERM',
            slug: 'electrocardiograma',
          }),
        ]),
      );
      // Campo declarado para uso futuro; ningún término lo trae hoy.
      expect(res.body.image).toBeUndefined();
    });

    it('respalda a castellano cuando el inglés no está cargado (locale fallback)', async () => {
      // "pulmon" no tiene contenido en inglés en el catálogo curado.
      const conceptId = glossaryTermConceptId('pulmon');

      const res = await http()
        .get(`/terminology/concepts/${conceptId}`)
        .query({ lang: 'EN' })
        .set(bearer(ctx.adminToken))
        .expect(200);

      expect(res.body.clinicalDefinition).toMatchObject({ translated: false });
      expect(res.body.clinicalDefinition.text).toContain(
        'esponjoso del sistema respiratorio',
      );
      expect(res.body.plainSummary).toMatchObject({ translated: false });
    });

    it('con inglés cargado, devuelve el texto en inglés y `translated: true`', async () => {
      // "corazon" sí tiene contenido en inglés en el catálogo curado.
      const conceptId = glossaryTermConceptId('corazon');

      const res = await http()
        .get(`/terminology/concepts/${conceptId}`)
        .query({ lang: 'EN' })
        .set(bearer(ctx.adminToken))
        .expect(200);

      expect(res.body.clinicalDefinition).toEqual({
        translated: true,
        text: expect.stringContaining('Four-chambered'),
      });
    });
  });

  describe('exclusión de borradores', () => {
    // Id determinista propio de la prueba, fuera del namespace `glossary:term:*`
    // del catálogo real: no colisiona con ningún término sembrado y se elimina
    // al final del bloque, así que el catálogo real nunca queda con un
    // borrador — el spec exige que no quede ninguno en la siembra real.
    const draftConceptId = '00000000-0000-4000-9000-00000000dfd1';
    let categoryVersionId: string | undefined;
    let membershipId: string | undefined;

    afterAll(async () => {
      const em = orm.em.fork();
      if (membershipId) {
        await em.nativeDelete(ValueSetMembers, { id: membershipId });
      }
      await em.nativeDelete(CatalogConcepts, { id: draftConceptId });
    });

    it('un término en TERM_DRAFT no aparece en la búsqueda por categoría ni en la ficha', async () => {
      const em = orm.em.fork();

      em.create(
        CatalogConcepts,
        {
          id: draftConceptId,
          codeSystemVersionId: SEED.codeSystemVersionId,
          code: 'GLOSSARY_TEST_DRAFT_TERM',
          display: 'Draft term for exclusion test',
          abstract: false,
          selectable: true,
          stateConceptId: CONCEPTS.TERM_DRAFT,
          ...createdBy(),
        },
        { partial: true },
      );
      await em.flush();

      categoryVersionId = glossaryValueSetVersionId(
        anatomyCategory.internalCode,
      );
      membershipId = glossaryValueSetMemberId(
        anatomyCategory.internalCode,
        draftConceptId,
      );
      em.create(
        ValueSetMembers,
        {
          id: membershipId,
          valueSetVersionId: categoryVersionId,
          conceptId: draftConceptId,
          included: true,
          ordinal: 999,
          ...createdBy(),
        },
        { partial: true },
      );
      await em.flush();

      const searchRes = await http()
        .get('/terminology/concepts')
        .query({ valueSetId: anatomyValueSetId, lang: 'ES', limit: 50 })
        .set(bearer(ctx.adminToken))
        .expect(200);
      expect(
        searchRes.body.items.some(
          (item: { conceptId: string }) => item.conceptId === draftConceptId,
        ),
      ).toBe(false);

      await http()
        .get(`/terminology/concepts/${draftConceptId}`)
        .query({ lang: 'ES' })
        .set(bearer(ctx.adminToken))
        .expect(404);
    });
  });

  describe('re-siembra idempotente', () => {
    it('correr el seed del glosario una segunda vez no inserta ni duplica ninguna fila', async () => {
      const logger = {
        setContext: () => undefined,
        info: () => undefined,
        warn: () => undefined,
      };
      const service = new GlossarySeedService(orm, logger as never);

      const result = await service.run();

      expect(result.valueSets).toBe(0);
      expect(result.terms).toBe(0);
      expect(result.designations).toBe(0);
      expect(result.properties).toBe(0);
      expect(result.memberships).toBe(0);
      expect(result.relationships).toBe(0);

      const em = orm.em.fork();
      const terms = await em.count(CatalogConcepts, {
        id: {
          $in: GLOSSARY_TERMS.map((term) => glossaryTermConceptId(term.slug)),
        },
      });
      expect(terms).toBe(GLOSSARY_TERMS.length);
    });
  });
});
