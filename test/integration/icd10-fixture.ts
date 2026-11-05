import { randomUUID } from 'node:crypto';
import type { MikroORM } from '@mikro-orm/postgresql';

/**
 * Concepto CIE-10-CM sintético, mínimo, para las suites que sólo necesitan que
 * `resolveIcd10ConceptId` encuentre un código.
 *
 * El catálogo ICD-10-CM real lo importa un job aparte (descarga masiva del CMS);
 * el comando base de integración "nunca debe fallar por un prerrequisito
 * implícito" (README), así que una suite que necesita `I10` no puede dar por
 * hecho ese import. Esto crea sólo lo que falta —fuente, sistema de códigos,
 * versión por defecto y concepto— con el mismo esquema que lee el servicio
 * (`internal_code = 'icd10cm'`), y devuelve una función que borra exactamente
 * lo que creó. Si el catálogo real ya trae el código, no toca nada.
 *
 * La fila lleva una marca (`[fixture sintético]`) en `display` para que nadie
 * la confunda con un dato del CMS si una corrida muere antes de limpiar.
 *
 * @param orm - ORM del contexto de pruebas.
 * @param code - Código CIE-10-CM a garantizar (por ejemplo `I10`).
 * @param display - Texto del concepto sintético.
 * @returns Función que borra lo creado; no hace nada si el catálogo ya lo tenía.
 */
export async function ensureIcd10Concept(
  orm: MikroORM,
  code: string,
  display: string,
): Promise<() => Promise<void>> {
  const db = orm.em.fork().getConnection();

  const existing = await db.execute<{ id: string }[]>(
    `select cc.id
       from terminology.catalog_concepts cc
       join terminology.code_system_versions csv on csv.id = cc.code_system_version_id
       join terminology.code_systems cs on cs.id = csv.code_system_id
      where cs.internal_code = 'icd10cm' and cc.code = ?
      limit 1`,
    [code],
  );
  if (existing.length > 0) return async () => undefined;

  const created: { table: string; id: string }[] = [];
  const insert = async (
    table: string,
    id: string,
    columns: Record<string, unknown>,
  ): Promise<void> => {
    const names = Object.keys(columns);
    await db.execute(
      `insert into ${table} (id, ${names.join(', ')}, created_at, updated_at)
       values (?, ${names.map(() => '?').join(', ')}, now(), now())`,
      [id, ...Object.values(columns)],
    );
    created.push({ table, id });
  };

  const systems = await db.execute<{ id: string }[]>(
    `select id from terminology.code_systems where internal_code = 'icd10cm'`,
  );
  let codeSystemId = systems[0]?.id;
  if (codeSystemId === undefined) {
    const sources = await db.execute<{ id: string }[]>(
      `select id from terminology.terminology_sources where code = 'icd10cm-fixture'`,
    );
    let sourceId = sources[0]?.id;
    if (sourceId === undefined) {
      sourceId = randomUUID();
      await insert('terminology.terminology_sources', sourceId, {
        code: 'icd10cm-fixture',
        name: 'ICD-10-CM [fixture sintético]',
      });
    }
    codeSystemId = randomUUID();
    await insert('terminology.code_systems', codeSystemId, {
      source_id: sourceId,
      internal_code: 'icd10cm',
      name: 'ICD-10-CM [fixture sintético]',
      canonical_url: 'http://hl7.org/fhir/sid/icd-10-cm',
    });
  }

  const versions = await db.execute<{ id: string }[]>(
    `select id from terminology.code_system_versions
      where code_system_id = ? order by is_default desc nulls last limit 1`,
    [codeSystemId],
  );
  let versionId = versions[0]?.id;
  if (versionId === undefined) {
    versionId = randomUUID();
    await insert('terminology.code_system_versions', versionId, {
      code_system_id: codeSystemId,
      version: 'fixture',
      is_default: true,
    });
  }

  await insert('terminology.catalog_concepts', randomUUID(), {
    code_system_version_id: versionId,
    code,
    display: `${display} [fixture sintético]`,
  });

  return async () => {
    // Hijas antes que madres: lo último que se creó es lo primero que se borra.
    for (const { table, id } of [...created].reverse()) {
      await db.execute(`delete from ${table} where id = ?`, [id]);
    }
  };
}
