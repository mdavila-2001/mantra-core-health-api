import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import {
  EntityManager,
  MikroORM,
  PostgreSqlDriver,
} from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import request from 'supertest';
import { StudyCatalogController } from '../../src/modules/study_catalog/controllers/study-catalog.controller';
import { StudyCatalogReaderGuard } from '../../src/modules/study_catalog/guards/study-catalog-reader.guard';
import { StudyCatalogRepository } from '../../src/modules/study_catalog/repositories/study-catalog.repository';
import { StudyCatalogService } from '../../src/modules/study_catalog/services/study-catalog.service';
import { ValueSetsRepository } from '../../src/modules/terminology/repositories/value-sets.repository';
import { ValueSetMembers } from '../../src/modules/terminology/entities';

/**
 * Catálogo de estudios contra Postgres real, con el esquema del modelo v4.2.82, los
 * seeds del arranque y `tools/study-catalogs/load-study-catalogs.mjs` ya aplicados
 * (precondición, no se siembra desde acá). Real: HTTP, controlador, servicio y SQL.
 * Doble: el guard de lectura (su matriz tiene su propio spec); no hay JWT acá.
 * El ORM se levanta sin descubrir las 1 100 entidades: el catálogo es SQL directo,
 * y la prueba del `filter` de `$expand` registra sólo `ValueSetMembers`.
 */
describe('Catálogo de estudios (integración, Postgres real)', () => {
  let app: INestApplication;
  let orm: MikroORM;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    orm = await MikroORM.init({
      driver: PostgreSqlDriver,
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5433),
      user: process.env.DB_USER ?? 'mantra',
      password: process.env.DB_PASSWORD,
      dbName: process.env.DB_NAME ?? 'mantra_redesa_health',
      entities: [ValueSetMembers],
      metadataProvider: TsMorphMetadataProvider,
      discovery: { warnWhenNoEntities: false },
    });
    const moduleRef = await Test.createTestingModule({
      controllers: [StudyCatalogController],
      providers: [
        StudyCatalogService,
        StudyCatalogRepository,
        { provide: EntityManager, useValue: orm.em },
      ],
    })
      .overrideGuard(StudyCatalogReaderGuard)
      .useValue({ canActivate: () => true })
      .compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    await orm?.close();
  });

  const find = async (q: string, family?: string) => {
    const res = await http()
      .get('/clinical/study-catalog')
      .query({ q, ...(family ? { family } : {}), limit: 100 })
      .expect(200);
    return res.body.items as {
      conceptId: string;
      code: string;
      display: string;
      family: string;
    }[];
  };

  describe('C1 · listado', () => {
    it('busca sin tildes ni mayúsculas, por nombre, sinónimo y componente', async () => {
      const porSinonimo = await find('BIOMETRÍA hemática');
      expect(porSinonimo.map((i) => i.code)).toContain('HEMOGRAMA');
      const porComponente = await find('hemoglobina', 'LAB');
      expect(porComponente.map((i) => i.code)).toContain('HEMOGRAMA');
      const sinTilde = await find('hemoglobina');
      const conTilde = await find('hemoglobína');
      expect(conTilde.map((i) => i.conceptId)).toEqual(
        sinTilde.map((i) => i.conceptId),
      );
    });

    it('filtra por familia y trae modalidad y región en imagen', async () => {
      const res = await http()
        .get('/clinical/study-catalog')
        .query({ family: 'IMAGING', q: 'mano', limit: 100 })
        .expect(200);
      expect(res.body.items.length).toBeGreaterThan(0);
      for (const item of res.body.items) {
        expect(item.family).toBe('IMAGING');
        expect(item.modalityConceptId).toEqual(expect.any(String));
        expect(item.bodySiteConceptId).toEqual(expect.any(String));
      }
      const labs = await http()
        .get('/clinical/study-catalog')
        .query({ family: 'LAB', limit: 100 })
        .expect(200);
      expect(
        labs.body.items.every((i: { family: string }) => i.family === 'LAB'),
      ).toBe(true);
    });

    it('trae sección, nombres de componentes, región y lateralidad sembrados (aditivo)', async () => {
      const labs = await http()
        .get('/clinical/study-catalog')
        .query({ family: 'LAB', q: 'hemograma', limit: 100 })
        .expect(200);
      const hemo = labs.body.items.find(
        (i: { code: string }) => i.code === 'HEMOGRAMA',
      );
      expect(hemo.section).toEqual({ code: 'HEMATO', name: 'Hematología' });
      expect(hemo.componentNames.length).toBeGreaterThan(5);
      expect(hemo.componentNames.length).toBeLessThanOrEqual(60);
      expect(hemo.componentNames.length).toBe(hemo.componentCount);
      expect(hemo.regionCode).toBeNull();
      expect(hemo.requiresLaterality).toBeNull();
      const imgs = await http()
        .get('/clinical/study-catalog')
        .query({ family: 'IMAGING', q: 'mano', limit: 100 })
        .expect(200);
      for (const i of imgs.body.items) {
        expect(i.section).toBeNull();
        expect(i.componentNames).toEqual([]);
        expect(i.regionCode).toEqual(expect.any(String));
        expect(typeof i.requiresLaterality).toBe('boolean');
      }
    });

    it('pagina por cursor sin repetir ni saltar, en orden alfabético', async () => {
      const all: string[] = [];
      let cursor: string | undefined;
      let pages = 0;
      do {
        const res = await http()
          .get('/clinical/study-catalog')
          .query({ limit: 100, ...(cursor ? { cursor } : {}) })
          .expect(200);
        all.push(
          ...res.body.items.map((i: { conceptId: string }) => i.conceptId),
        );
        cursor = res.body.nextCursor ?? undefined;
        pages += 1;
      } while (cursor && pages < 50);
      expect(pages).toBeGreaterThan(5);
      expect(new Set(all).size).toBe(all.length);
      const sinPaginar = await http()
        .get('/clinical/study-catalog')
        .query({ limit: 100 })
        .expect(200);
      expect(all.slice(0, 100)).toEqual(
        sinPaginar.body.items.map((i: { conceptId: string }) => i.conceptId),
      );
    });

    it('lo marcado verificar no está en el catálogo', async () => {
      expect(
        (await find('FORMULA_LEUCOCITARIA_MANUAL')).map((i) => i.code),
      ).not.toContain('FORMULA_LEUCOCITARIA_MANUAL');
      expect(
        (await find('RX_COLUMNA_TOTAL_BENDING')).map((i) => i.code),
      ).not.toContain('RX_COLUMNA_TOTAL_BENDING');
    });

    it('rechaza familia, límite y cursor inválidos con 400', async () => {
      await http()
        .get('/clinical/study-catalog')
        .query({ family: 'NOPE' })
        .expect(400);
      await http()
        .get('/clinical/study-catalog')
        .query({ limit: 101 })
        .expect(400);
      await http()
        .get('/clinical/study-catalog')
        .query({ limit: 0 })
        .expect(400);
      await http()
        .get('/clinical/study-catalog')
        .query({ cursor: 'basura' })
        .expect(400);
      await http()
        .get('/clinical/study-catalog')
        .query({ q: 'x'.repeat(101) })
        .expect(400);
    });

    it('un texto con comodines o comillas no rompe ni se interpreta', async () => {
      const res = await http()
        .get('/clinical/study-catalog')
        .query({ q: "50%_'; DROP TABLE x;--" })
        .expect(200);
      expect(res.body.items).toEqual([]);
    });
  });

  describe('C2 · detalle', () => {
    it('análisis: componentes ordenados, muestra sugerida entre las elegibles y aviso LOINC', async () => {
      const [hemograma] = (await find('hemograma completo', 'LAB')).filter(
        (i) => i.code === 'HEMOGRAMA',
      );
      const res = await http()
        .get(`/clinical/study-catalog/${hemograma.conceptId}`)
        .expect(200);
      const b = res.body;
      expect(b.family).toBe('LAB');
      expect(b.legacyCode).toBe('LAB_HEMOGRAMA');
      expect(b.components.length).toBeGreaterThanOrEqual(3);
      expect(b.components.map((c: { ordinal: number }) => c.ordinal)).toEqual(
        [...b.components.map((c: { ordinal: number }) => c.ordinal)].sort(
          (x: number, y: number) => x - y,
        ),
      );
      expect(b.components[0]).toMatchObject({
        selectedByDefault: true,
        children: [],
      });
      expect(b.componentCount).toBe(b.components.length);
      expect(b.allowedSpecimenTypes.length).toBeGreaterThan(10);
      expect(b.imaging).toBeNull();
      expect(b.lab.loincCode).toBe('57021-8');
      expect(b.attribution.map((a: { source: string }) => a.source)).toContain(
        'LOINC',
      );
    });

    it('imagen: modalidad fija, regiones que contiene la del estudio, lateralidad y contraste', async () => {
      const [rx] = (await find('radiografia de mano', 'IMAGING')).filter((i) =>
        /MANO/.test(i.code),
      );
      expect(rx).toBeDefined();
      const b = (
        await http().get(`/clinical/study-catalog/${rx.conceptId}`).expect(200)
      ).body;
      expect(b.family).toBe('IMAGING');
      expect(b.allowedModalities).toHaveLength(1);
      expect(b.allowedModalities[0]).toMatchObject({
        isDefault: true,
        code: 'RX',
      });
      expect(
        b.allowedBodySites.filter((s: { isDefault: boolean }) => s.isDefault),
      ).toHaveLength(1);
      expect(
        b.allowedBodySites.some(
          (s: { admitsLaterality: boolean }) => s.admitsLaterality,
        ),
      ).toBe(true);
      expect(b.lateralityOptions).toHaveLength(3);
      expect(b.contrastOptions).toHaveLength(3);
      expect(
        b.contrastOptions.filter((o: { isDefault: boolean }) => o.isDefault),
      ).toHaveLength(1);
      expect(b.components).toEqual([]);
      expect(b.lab).toBeNull();
      expect(b.attribution.map((a: { source: string }) => a.source)).toEqual(
        expect.arrayContaining(['DICOM', 'SNOMED CT']),
      );
    });

    it('404 si el concepto no existe o no es un estudio del catálogo (p. ej. un componente)', async () => {
      await http()
        .get('/clinical/study-catalog/00000000-0000-4000-8000-000000000000')
        .expect(404);
      await http().get('/clinical/study-catalog/no-es-uuid').expect(400);
      const [hemograma] = (await find('hemograma completo', 'LAB')).filter(
        (i) => i.code === 'HEMOGRAMA',
      );
      const detail = (
        await http()
          .get(`/clinical/study-catalog/${hemograma.conceptId}`)
          .expect(200)
      ).body;
      await http()
        .get(`/clinical/study-catalog/${detail.components[0].conceptId}`)
        .expect(404);
    });
  });

  describe('C3 · filter de $expand', () => {
    const repo = new ValueSetsRepository();
    const versionId = async () => {
      const rows = await orm.em.getConnection().execute<{ id: string }[]>(
        `SELECT v.id FROM terminology.value_set_versions v JOIN terminology.value_sets s ON s.id = v.value_set_id
          WHERE s.internal_code = 'imaging-body-structure' AND v.is_default IS TRUE`,
        [],
        'all',
      );
      return rows[0].id;
    };

    it('sin filtro devuelve las 156 regiones; con filter deja las que contienen todas las palabras, sin tildes', async () => {
      const v = await versionId();
      const all = await repo.findMembersPage(orm.em.fork(), v, undefined, 500);
      expect(all).toHaveLength(156);
      const toraxNoTilde = await repo.findMembersPage(
        orm.em.fork(),
        v,
        undefined,
        500,
        ['torax'],
      );
      const toraxTilde = await repo.findMembersPage(
        orm.em.fork(),
        v,
        undefined,
        500,
        ['tórax'].map((t) => t.normalize('NFD').replace(/\p{M}/gu, '')),
      );
      expect(toraxNoTilde.length).toBeGreaterThan(0);
      expect(toraxNoTilde.length).toBeLessThan(156);
      expect(toraxTilde.map((m) => m.conceptId).sort()).toEqual(
        toraxNoTilde.map((m) => m.conceptId).sort(),
      );
      const sinCoincidencia = await repo.findMembersPage(
        orm.em.fork(),
        v,
        undefined,
        500,
        ['zzzzzz'],
      );
      expect(sinCoincidencia).toEqual([]);
    });

    it('el filtro se combina con el cursor sin repetir', async () => {
      const v = await versionId();
      const first = await repo.findMembersPage(orm.em.fork(), v, undefined, 2, [
        'mano',
      ]);
      const rest = await repo.findMembersPage(
        orm.em.fork(),
        v,
        { ordinal: first[1].ordinal ?? null, conceptId: first[1].conceptId },
        50,
        ['mano'],
      );
      const whole = await repo.findMembersPage(
        orm.em.fork(),
        v,
        undefined,
        500,
        ['mano'],
      );
      expect([...first, ...rest].map((m) => m.conceptId)).toEqual(
        whole.map((m) => m.conceptId),
      );
    });
  });
});
