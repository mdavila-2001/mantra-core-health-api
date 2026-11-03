import type { FilterQuery } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { UiVisibilityElements, UiVisibilityRules } from '../entities';
import {
  elementWhere,
  inForce,
  ruleWhere,
} from './mikro-orm-ui-visibility.store';

/**
 * Traducción de los filtros del almacén a SQL, SIN base de datos (la inicialización de MikroORM no conecta): comprueba que
 * la metadata de las entidades se descubre, que cada filtro compila y que el SQL lleva las
 * condiciones que el contrato exige. NO ejecuta nada contra PostgreSQL.
 */
describe('MikroOrmUiVisibilityStore · SQL de los filtros (sin base de datos)', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      // Misma ruta de descubrimiento que la aplicación (`orm.config.ts`): ts-morph sobre las fuentes.
      entities: ['src/modules/ui_visibility/entities/*.entity.ts'],
      entitiesTs: ['src/modules/ui_visibility/entities/*.entity.ts'],
      metadataProvider: TsMorphMetadataProvider,
      metadataCache: { enabled: false },
      dbName: 'sin_conexion',
      forceUtcTimezone: true,
    });
  });

  afterAll(async () => {
    await orm.close(true);
  });

  const rulesSql = (where: FilterQuery<UiVisibilityRules>) =>
    orm.em
      .fork()
      .createQueryBuilder(UiVisibilityRules)
      .where(where as never)
      .getFormattedQuery();
  const elementsSql = (where: FilterQuery<UiVisibilityElements>) =>
    orm.em
      .fork()
      .createQueryBuilder(UiVisibilityElements)
      .where(where as never)
      .getFormattedQuery();

  it('las entidades se mapean a las tablas y columnas del modelo', () => {
    const rules = orm.getMetadata().get(UiVisibilityRules);
    expect(`${rules.schema}.${rules.tableName}`).toBe(
      'authz.ui_visibility_rules',
    );
    expect(Object.values(rules.properties).map((p) => p.fieldNames[0])).toEqual(
      expect.arrayContaining([
        'element_id',
        'subject_type',
        'subject_id',
        'scope_tenant_id',
        'valid_from',
        'valid_to',
        'ended_at',
        'row_version',
      ]),
    );
    const elements = orm.getMetadata().get(UiVisibilityElements);
    expect(`${elements.schema}.${elements.tableName}`).toBe(
      'authz.ui_visibility_elements',
    );
  });

  it('«en vigor ahora»: no terminada y dentro de la ventana', () => {
    const sql = rulesSql(inForce(new Date('2026-10-31T12:00:00.000Z')));
    expect(sql).toContain('"ended_at" is null');
    expect(sql).toContain('"valid_from" is null');
    expect(sql).toContain('"valid_from" <= ');
    expect(sql).toContain('"valid_to" is null');
    expect(sql).toContain('"valid_to" > ');
  });

  it('active=false es la negación de «en vigor»', () => {
    const sql = rulesSql(
      ruleWhere({ active: false, now: new Date('2026-10-31T12:00:00.000Z') }),
    );
    expect(sql).toMatch(/not \(/i);
    expect(sql).toContain('"ended_at" is null');
  });

  it('el filtro de ámbito y de elemento llegan a la consulta', () => {
    const sql = rulesSql(
      ruleWhere({
        now: new Date(),
        elementId: '0a000000-0000-4000-8000-000000000001',
        scopeTenantId: '33333333-3333-4333-8333-333333333333',
        subjectType: 'TENANT',
      }),
    );
    expect(sql).toContain('"element_id" = ');
    expect(sql).toContain('"scope_tenant_id" = ');
    expect(sql).toContain('"subject_type" = ');
  });

  it('la búsqueda de texto es ILIKE sobre clave y etiqueta y escapa los comodines', () => {
    const sql = elementsSql(elementWhere({ q: '50%_x' }));
    expect(sql).toMatch(/"key" ilike/i);
    expect(sql).toMatch(/"label" ilike/i);
    expect(sql).toContain('50\\\\%\\\\_x');
  });

  it('sin filtros no hay WHERE', () => {
    expect(ruleWhere({ now: new Date() })).toEqual({});
    expect(elementWhere({})).toEqual({});
  });
});
