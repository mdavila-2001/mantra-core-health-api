import 'dotenv/config';
import { MikroORM } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../src/common/constants/concepts';
import { TerminologySeedService } from '../../src/common/seed/terminology-seed.service';
import { VademecumSeedService } from '../../src/common/seed/vademecum-seed.service';
import { CEXT } from '../../src/modules/clinical_ext/clinical_ext.concepts';
import buildConfig from '../../src/orm/config/orm.config';

/**
 * Verificación real de la vía canónica del vademécum contra PostgreSQL.
 *
 * No aplica SQL de seed ni inventa prerequisitos: materializa primero el
 * catálogo interno mediante {@link TerminologySeedService} y sólo después
 * ejecuta {@link VademecumSeedService}, igual que `SeedBootstrapService`.
 */
describe('Seed canónico de Vademécum (DB real)', () => {
  let orm: MikroORM;
  let prerequisitesBeforeVademecum: Array<{ id: string }>;
  let secondRunInserted: number;

  const logger = {
    setContext: () => undefined,
    info: () => undefined,
    warn: () => undefined,
  };

  beforeAll(async () => {
    orm = await MikroORM.init(buildConfig);
    const terminology = new TerminologySeedService(orm, logger as never);
    const vademecum = new VademecumSeedService(orm, logger as never);

    await terminology.run();

    const prerequisiteIds = [
      CONCEPTS.LANG_EN,
      CONCEPTS.LANG_ES,
      CEXT.SEVERITY_HIGH,
      CEXT.SEVERITY_MODERATE,
    ];
    prerequisitesBeforeVademecum = await orm.em
      .fork()
      .getConnection()
      .execute(
        `select id
         from terminology.catalog_concepts
         where id in (?, ?, ?, ?)`,
        prerequisiteIds,
      );

    await vademecum.run('development', false);
    const secondRun = await vademecum.run('development', false);
    secondRunInserted = secondRun.inserted;
  }, 120000);

  afterAll(async () => {
    await orm.close(true);
  });

  it('materializa idiomas y severidades antes del contenido dependiente', () => {
    expect(new Set(prerequisitesBeforeVademecum.map(({ id }) => id))).toEqual(
      new Set([
        CONCEPTS.LANG_EN,
        CONCEPTS.LANG_ES,
        CEXT.SEVERITY_HIGH,
        CEXT.SEVERITY_MODERATE,
      ]),
    );
  });

  it('mantiene activa y validada la FK de idioma de las designaciones', async () => {
    const constraints = await orm.em.fork().getConnection().execute(`
      select convalidated
      from pg_constraint
      where conname = 'fk_concept_designations_language_concept_id'
    `);

    expect(constraints).toEqual([{ convalidated: true }]);

    const dangling = await orm.em.fork().getConnection().execute(`
      select count(*)::int as count
      from terminology.concept_designations designation
      left join terminology.catalog_concepts language
        on language.id = designation.language_concept_id
      where designation.language_concept_id is not null
        and language.id is null
    `);
    expect(dangling).toEqual([{ count: 0 }]);
  });

  it('materializa la vancomicina mediante VademecumSeedService', async () => {
    const rows = await orm.em.fork().getConnection().execute(`
      select concept.code, concept.display
      from terminology.catalog_concepts concept
      join terminology.code_system_versions version
        on version.id = concept.code_system_version_id
      join terminology.code_systems system
        on system.id = version.code_system_id
      where system.internal_code = 'vademecum'
        and concept.code = 'J01XA01'
    `);

    expect(rows).toHaveLength(1);
    expect(rows[0].display).toBe('Vancomycin');
  });

  it('materializa interacciones contra la severidad canónica', async () => {
    const rows = await orm.em.fork().getConnection().execute(`
      select interaction.severity_concept_id
      from clinical_ext.drug_interactions interaction
      join terminology.catalog_concepts substance_a
        on substance_a.id = interaction.substance_a_concept_id
      join terminology.catalog_concepts substance_b
        on substance_b.id = interaction.substance_b_concept_id
      where substance_a.code = 'J01XA01'
        and substance_b.code = 'J01GB03'
    `);

    expect(rows).toEqual([{ severity_concept_id: CEXT.SEVERITY_HIGH }]);
  });

  it('es idempotente al repetir el seeder vigente', () => {
    expect(secondRunInserted).toBe(0);
  });
});
