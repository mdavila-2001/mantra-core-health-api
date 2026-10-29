import type { EntityManager } from '@mikro-orm/postgresql';

/**
 * ¿Cuelga el espacio (o alguno de sus ancestros) de la unidad o de una unidad hija,
 * ya sea por su unidad dueña o por un vínculo vigente (`space_unit_assignments`)?
 *
 * Es la misma noción de «contiene» que usa `InfrastructureAccessService` para el
 * alcance de unidad; vive aquí para que laboratorio, farmacia y acceso delegado no
 * la reescriban.
 *
 * @param tx - Transacción o contexto activo.
 * @param spaceId - Espacio.
 * @param unitId - Unidad.
 * @returns `true` si el espacio pertenece a la unidad.
 */
export async function spaceBelongsToUnit(
  tx: EntityManager,
  spaceId: string,
  unitId: string,
): Promise<boolean> {
  const rows = await tx.execute<{ ok: number }[]>(
    `with recursive anc(id, parent_space_id) as (
       select id, parent_space_id from practice.care_spaces where id = ?
       union all
       select p.id, p.parent_space_id from practice.care_spaces p join anc on p.id = anc.parent_space_id
     ),
     unit_down(id) as (
       select id from practice.clinical_units where id = ?
       union
       select c.id from practice.clinical_units c join unit_down d on c.parent_unit_id = d.id
     )
     select 1 as ok from anc
      where exists (select 1 from practice.care_spaces cs
                     where cs.id = anc.id and cs.clinical_unit_id in (select id from unit_down))
         or exists (select 1 from practice.space_unit_assignments sua
                     where sua.care_space_id = anc.id
                       and sua.clinical_unit_id in (select id from unit_down)
                       and (sua.valid_to is null or sua.valid_to > now()))
      limit 1`,
    [spaceId, unitId],
  );
  return rows.length > 0;
}
