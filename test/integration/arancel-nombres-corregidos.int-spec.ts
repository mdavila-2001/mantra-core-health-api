import { MikroORM } from '@mikro-orm/postgresql';
import buildConfig from '../../src/orm/config/orm.config';
import { TerminologySeedService } from '../../src/common/seed/terminology-seed.service';
import { BoliviaFeeScheduleSeedService } from '../../src/common/seed/bolivia-fee-schedule-seed.service';
import {
  BO_FEE_PROPERTY_CODES,
  boFeeConceptId,
  boFeePropertyId,
} from '../../src/common/seed/bolivia-fee-schedule.catalog';

/**
 * Los nombres del arancel que el cliente pidió corregir (07/11/2026) llegan a
 * la base, y también a una base que ya tenía los nombres viejos.
 *
 * El médico ve estos nombres en «Mis servicios → Importar»: «Tratamiento
 * invasivo, mediante trombétisis…», «Implante de fitra de vena cava inforor»,
 * el grupo «ANGIOPLASTIAPERIFERICA.». El cliente pidió sacar «invasivo» de los
 * nombres y corregir los mal escritos; las correcciones viven en
 * `tools/bolivia-datasets/correcciones-arancel.json`.
 *
 * Contra la base y no con mocks porque lo que importa es la segunda mitad: una
 * base sembrada con el arancel anterior tiene que quedar con los nombres nuevos
 * en el próximo arranque, sin tocar ids. Eso lo hace `reconcile()` del seed, y
 * sólo se ve con filas reales.
 */
describe('Arancel · nombres corregidos (integración)', () => {
  let orm: MikroORM;
  const logger = {
    setContext: () => undefined,
    info: () => undefined,
    warn: () => undefined,
  };

  // Tratamiento por trombólisis dirigida por catéter, por miembro (Cardiología).
  const TROMBOLISIS = 'BO_ARM_CARDIOLOGIA_ANGIOPLASTIAPERIFERICA_TRATAMIEN';
  // Implante de filtro de vena cava inferior (Cardiología).
  const FILTRO = 'BO_ARM_CARDIOLOGIA_ANGIOPLASTIAPERIFERICA_IMPLANTE_';

  const display = async (code: string): Promise<string | undefined> => {
    const rows = await orm.em
      .fork()
      .getConnection()
      .execute<{ display: string }[]>(
        'select display from terminology.catalog_concepts where id = ?',
        [boFeeConceptId(code)],
      );
    return rows[0]?.display;
  };

  const grupo = async (code: string): Promise<string | undefined> => {
    const rows = await orm.em
      .fork()
      .getConnection()
      .execute<{ value_json: string }[]>(
        `select value_json #>> '{}' as value_json from terminology.concept_properties where id = ?`,
        [boFeePropertyId(code, BO_FEE_PROPERTY_CODES.grupo)],
      );
    return rows[0]?.value_json;
  };

  beforeAll(async () => {
    orm = await MikroORM.init(buildConfig);
    await new TerminologySeedService(orm, logger as never).run();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  it('siembra los nombres corregidos y ninguno dice «invasivo»', async () => {
    await new BoliviaFeeScheduleSeedService(orm, logger as never).run();

    expect(await display(TROMBOLISIS)).toBe(
      'Tratamiento mediante trombólisis dirigida por catéter, por miembro',
    );
    expect(await display(FILTRO)).toBe(
      'Implante de filtro de vena cava inferior',
    );
    expect(await grupo(FILTRO)).toBe('ANGIOPLASTIA PERIFÉRICA');

    const conInvasivo = await orm.em
      .fork()
      .getConnection()
      .execute<{ n: string }[]>(
        `select count(*) as n
           from terminology.value_set_members m
           join terminology.value_sets s on s.internal_code = 'VS_BO_MEDICAL_PROCEDURE'
           join terminology.value_set_versions v on v.id = m.value_set_version_id and v.value_set_id = s.id
           join terminology.catalog_concepts c on c.id = m.concept_id
           left join terminology.concept_properties p
             on p.concept_id = c.id and p.property_code = ?
          where c.display ilike '%invasiv%' or p.value_json #>> '{}' ilike '%invasiv%'`,
        [BO_FEE_PROPERTY_CODES.grupo],
      );
    expect(Number(conInvasivo[0].n)).toBe(0);
  });

  it('una base con los nombres viejos queda corregida en el próximo arranque, con el mismo id', async () => {
    const conn = orm.em.fork().getConnection();
    await conn.execute(
      'update terminology.catalog_concepts set display = ? where id = ?',
      [
        'Tratamiento invasivo, mediante trombétisis dirigida por catéter, por miembro,',
        boFeeConceptId(TROMBOLISIS),
      ],
    );
    await conn.execute(
      'update terminology.concept_properties set value_json = to_jsonb(?::text) where id = ?',
      [
        'ANGIOPLASTIAPERIFERICA.',
        boFeePropertyId(TROMBOLISIS, BO_FEE_PROPERTY_CODES.grupo),
      ],
    );

    const result = await new BoliviaFeeScheduleSeedService(
      orm,
      logger as never,
    ).run();

    expect(result.procedures).toBe(0);
    expect(result.reconciled).toBe(2);
    expect(await display(TROMBOLISIS)).toBe(
      'Tratamiento mediante trombólisis dirigida por catéter, por miembro',
    );
    expect(await grupo(TROMBOLISIS)).toBe('ANGIOPLASTIA PERIFÉRICA');
  });
});
