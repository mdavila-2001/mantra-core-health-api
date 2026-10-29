import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PreconditionFailedException } from '../../../common';
import type { BedBoardCell } from '../dto/care-space-ops.types';
import type { SampleCollectionPointView } from '../dto/sample-collection-point.types';
import { FUNCTIONS } from '../infrastructure-catalog';
import { CollectionPointErrorReason } from '../practice-collection.error-reasons';
import { OpsStateService } from './ops-state';
import { placeholders, str, type SpaceOpsRow } from './ops-rows';
import { practiceOutOfScope } from './practice-scope';

/** Función del espacio que es un punto de toma. */
const SAMPLE_COLLECTION = 'SPACE_FN_SAMPLE_COLLECTION';

/** Higiene con la que un punto no se ofrece (sucio, en limpieza o contaminado). */
const NOT_READY_HYGIENE: ReadonlySet<string> = new Set([
  'HYG_DIRTY',
  'HYG_CLEANING',
  'HYG_CONTAMINATED',
]);

/** ¿Se ofrece este punto? Activo, disponible y listo. */
function isOfferable(cell: BedBoardCell): boolean {
  return (
    cell.lifecycle?.code === 'SPACE_ACTIVE' &&
    cell.availability.code === 'SPACE_OP_AVAILABLE' &&
    !NOT_READY_HYGIENE.has(cell.hygiene.code)
  );
}

/**
 * Puntos de toma de muestras de una sede (CONTRATO-F2-F5 F5b): espacios con función
 * `SAMPLE_COLLECTION`, vistos con el estado operativo de F2.
 *
 * - **Listar** es de la sede del tenant del contexto (otra sede: 404) y solo trae los
 *   puntos que se ofrecen: activos, disponibles y no sucios (un punto bloqueado o en
 *   limpieza no se sugiere, `procesos/08`).
 * - **Sugerir** (`assertSuggestable`) valida el **par** sede ↔ punto aunque la sede sea
 *   de otra organización (flujo «en este centro»): el modelo solo puede comprobar que
 *   el espacio es de la sede, la API es quien decide que esa sede se puede sugerir (el
 *   llamador ya comprobó que ofrece el procedimiento). Toda falla es la misma 422, sin
 *   revelar si el espacio existe en otra sede.
 * - **Registrar la toma** (`assertCollectable`) exige además que la sede sea del tenant
 *   que toma la muestra.
 */
@Injectable()
export class SampleCollectionPointsService {
  /**
   * @param ops - Estado operativo de los espacios (F2).
   */
  constructor(private readonly ops: OpsStateService) {}

  /**
   * Puntos de toma que se ofrecen en la sede.
   *
   * @param tx - Transacción o contexto activo.
   * @param tenantId - Tenant del contexto.
   * @param siteId - Sede (debe ser del tenant).
   * @param now - Ahora.
   * @throws ResourceNotFoundException (404) si la sede no es del tenant.
   */
  async list(
    tx: EntityManager,
    tenantId: string,
    siteId: string,
    now: Date = new Date(),
  ): Promise<SampleCollectionPointView[]> {
    await this.assertSiteInTenant(tx, tenantId, siteId);
    const spaces = (await this.ops.loadSiteSpaces(tx, tenantId, siteId))
      .filter((row) => this.isPoint(row))
      .sort((a, b) => a.code.localeCompare(b.code));
    const cells = await this.ops.cells(tx, siteId, spaces, {
      // Un punto de toma no muestra pacientes ni texto clínico libre.
      patientVisible: () => false,
      clinicalVisible: () => false,
      now,
    });
    const offered = cells.filter(isOfferable);
    const units = await this.unitsOf(
      tx,
      tenantId,
      spaces.filter((s) => offered.some((c) => c.id === s.id)),
    );
    return offered.map((cell) => ({
      careSpace: {
        id: cell.id,
        code: cell.code,
        name: cell.name,
        path: cell.path,
      },
      unit: units.get(cell.id) ?? null,
      cell,
    }));
  }

  /**
   * El primer punto que se ofrece en la sede, o `null` (la orden no lleva punto).
   * Sirve para cualquier sede, también de otra organización: devuelve solo un id.
   */
  async firstOffered(
    tx: EntityManager,
    siteId: string,
    now: Date = new Date(),
  ): Promise<string | null> {
    const tenantId = await this.tenantOfSite(tx, siteId);
    if (!tenantId) return null;
    const [first] = await this.list(tx, tenantId, siteId, now);
    return first?.careSpace.id ?? null;
  }

  /**
   * Exige que el espacio sea un punto de toma que se ofrece en la sede.
   *
   * @throws PreconditionFailedException (422 `COLLECTION_POINT_INVALID`).
   */
  async assertSuggestable(
    tx: EntityManager,
    siteId: string,
    careSpaceId: string,
    now: Date = new Date(),
  ): Promise<void> {
    const tenantId = await this.tenantOfSite(tx, siteId);
    const offered = tenantId
      ? (await this.list(tx, tenantId, siteId, now)).some(
          (point) => point.careSpace.id === careSpaceId,
        )
      : false;
    if (!offered) throw this.invalid();
  }

  /**
   * Exige que el espacio sea un punto de toma de la sede **del tenant que toma la
   * muestra**. No pide disponibilidad: la toma registra lo que ocurrió.
   *
   * @throws PreconditionFailedException (422 `COLLECTION_POINT_INVALID`).
   */
  async assertCollectable(
    tx: EntityManager,
    tenantId: string,
    siteId: string,
    careSpaceId: string,
  ): Promise<void> {
    const rows = await this.ops.loadSiteSpaces(tx, tenantId, siteId);
    const space = rows.find((row) => row.id === careSpaceId);
    if (!space || !this.isPoint(space)) throw this.invalid();
  }

  /**
   * Nombre de un punto que el llamador acaba de validar con {@link assertSuggestable}.
   * No filtra por tenant: la sede puede ser de otra organización.
   */
  async nameOf(tx: EntityManager, careSpaceId: string): Promise<string | null> {
    const rows = await tx.execute<{ name: string }[]>(
      `select name from practice.care_spaces where id = ?`,
      [careSpaceId],
    );
    return rows[0] ? str(rows[0].name) : null;
  }

  /**
   * Nombre de cada punto pedido, solo de los que son del tenant.
   *
   * @returns Punto → nombre; un punto de otro tenant no figura.
   */
  async namesIn(
    tx: EntityManager,
    tenantId: string,
    careSpaceIds: readonly (string | null | undefined)[],
  ): Promise<Map<string, string>> {
    const ids = [
      ...new Set(careSpaceIds.filter((id): id is string => Boolean(id))),
    ];
    if (ids.length === 0) return new Map();
    const rows = await tx.execute<Record<string, unknown>[]>(
      `select id, name from practice.care_spaces
        where tenant_id = ? and id in (${placeholders(ids.length)})`,
      [tenantId, ...ids],
    );
    return new Map(rows.map((r) => [str(r.id), str(r.name)] as const));
  }

  // --------------------------------------------------------------- internos

  private isPoint(row: SpaceOpsRow): boolean {
    return (
      FUNCTIONS.byConceptId(row.spaceTypeConceptId)?.code === SAMPLE_COLLECTION
    );
  }

  private invalid(): PreconditionFailedException {
    return new PreconditionFailedException(
      'El punto de toma no es válido para esa sede',
      undefined,
      CollectionPointErrorReason.COLLECTION_POINT_INVALID,
    );
  }

  private async assertSiteInTenant(
    tx: EntityManager,
    tenantId: string,
    siteId: string,
  ): Promise<void> {
    const rows = await tx.execute<{ id: string }[]>(
      `select id from practice.practice_sites where id = ? and tenant_id = ?`,
      [siteId, tenantId],
    );
    if (rows.length === 0) throw practiceOutOfScope('Sitio no encontrado');
  }

  private async tenantOfSite(
    tx: EntityManager,
    siteId: string,
  ): Promise<string | null> {
    const rows = await tx.execute<{ tenant_id: string }[]>(
      `select tenant_id from practice.practice_sites where id = ?`,
      [siteId],
    );
    return rows[0] ? str(rows[0].tenant_id) : null;
  }

  /** Unidad de cada punto: la dueña, o el primer vínculo vigente. */
  private async unitsOf(
    tx: EntityManager,
    tenantId: string,
    spaces: readonly SpaceOpsRow[],
  ): Promise<Map<string, { id: string; code: string; name: string }>> {
    if (spaces.length === 0) return new Map();
    const ids = spaces.map((s) => s.id);
    const rows = await tx.execute<Record<string, unknown>[]>(
      `select distinct on (cs.id) cs.id as space_id, u.id, u.code, u.name
         from practice.care_spaces cs
         join practice.clinical_units u on u.tenant_id = cs.tenant_id
          and u.id = coalesce(
                cs.clinical_unit_id,
                (select sua.clinical_unit_id from practice.space_unit_assignments sua
                  where sua.care_space_id = cs.id
                    and (sua.valid_to is null or sua.valid_to > now())
                  order by sua.valid_from nulls first limit 1))
        where cs.tenant_id = ? and cs.id in (${placeholders(ids.length)})`,
      [tenantId, ...ids],
    );
    return new Map(
      rows.map((r) => [
        str(r.space_id),
        { id: str(r.id), code: str(r.code), name: str(r.name) },
      ]),
    );
  }
}
