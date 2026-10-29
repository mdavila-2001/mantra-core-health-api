import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  roleAuthorizesInTenant,
  type AuthenticatedUser,
} from '../../../../common';
import {
  FUNCTIONS,
  FUNCTION_PROFILES,
  type FunctionCode,
} from '../../../practice/infrastructure-catalog';
import { PRAC } from '../../../practice/practice.concepts';
import {
  InfrastructureAccessService,
  type InfraTarget,
} from '../../../practice/services/infrastructure-access.service';
import { strOrNull } from '../../domain/row-text';
import { spaceBelongsToUnit } from '../../../practice/services/space-unit-membership';
import { PharmacyInventoryErrorReason as Reason } from '../../pharmacy_inventory.error-reasons';
import type {
  ResolvedStockPoint,
  StockPointAccessPort,
  StockPointInput,
} from '../../application/ports/stock-point-access.port';

/** El 404 uniforme del módulo para lo que no existe o es ajeno. */
const NOT_AVAILABLE = 'Recurso de farmacia no disponible';

/**
 * Quién puede ubicar stock en un espacio y qué espacios y unidades son un punto
 * de stock válido (CONTRATO-F2-F5 F5c).
 *
 * - Autoridad: el personal de farmacia del tenant (`PHARMACY_STAFF`) o, por la
 *   estructura, plataforma, organización y la sucursal de la sede
 *   (`InfrastructureAccessService`, acciones `infra.stock.*`). Se autoriza contra la
 *   **sede de práctica de la farmacia**, que es la autoritativa: el espacio y la
 *   unidad del cuerpo deben ser de esa sede, así que no hace falta (ni sirve) fiarse
 *   de ellos para decidir el alcance.
 * - Validación: espacio y unidad se buscan en el tenant (404 uniforme), son de la
 *   sede de la farmacia (422 `STOCK_POINT_SITE_MISMATCH`), el espacio tiene perfil
 *   `stockPoint` (422 `SPACE_NOT_STOCK_POINT`) y ambos están activos.
 */
@Injectable()
export class PracticeStockPointAccessAdapter implements StockPointAccessPort {
  /**
   * @param infra - Evaluador único de «quién puede qué sobre qué espacio».
   */
  constructor(private readonly infra: InfrastructureAccessService) {}

  /** ¿Es personal de farmacia (o plataforma) del tenant? Ve y opera el stock sin pasar por la estructura. */
  isPharmacyOperator(actor: AuthenticatedUser, tenantId: string): boolean {
    return roleAuthorizesInTenant(actor, 'PHARMACY_STAFF', tenantId);
  }

  /** Sede de práctica de una sede de farmacia, o `null` si no existe. */
  async practiceSiteOf(
    tx: EntityManager,
    pharmacySiteId: string,
  ): Promise<string | null> {
    const rows = await tx.execute<{ practice_site_id: string }[]>(
      `select practice_site_id from pharmacy.pharmacy_sites where id = ?`,
      [pharmacySiteId],
    );
    return rows[0] ? String(rows[0].practice_site_id) : null;
  }

  /**
   * Autoriza ubicar o reubicar stock en la sede de práctica de la farmacia.
   *
   * @throws ResourceNotFoundException (404) fuera del tenant o de la sucursal del actor.
   * @throws InsufficientRoleException (403 `INFRA_ACTION_NOT_ALLOWED`) si ve la sede pero ningún rol permite la acción.
   */
  async assertCanManage(
    tx: EntityManager,
    actor: AuthenticatedUser,
    tenantId: string,
    practiceSiteId: string,
  ): Promise<void> {
    if (this.isPharmacyOperator(actor, tenantId)) return;
    await this.infra.assertCan(
      actor,
      'infra.stock.manage',
      { siteId: practiceSiteId },
      tx,
    );
  }

  /**
   * Autoriza ver las ubicaciones de un espacio.
   *
   * @throws ResourceNotFoundException (404) si el espacio no es del tenant o está fuera del alcance.
   */
  async assertCanView(
    tx: EntityManager,
    actor: AuthenticatedUser,
    tenantId: string,
    careSpaceId: string,
  ): Promise<void> {
    if (this.isPharmacyOperator(actor, tenantId)) {
      const rows = await tx.execute<{ id: string }[]>(
        `select id from practice.care_spaces where id = ? and tenant_id = ?`,
        [careSpaceId, tenantId],
      );
      if (rows.length === 0) throw this.notAvailable();
      return;
    }
    const target: InfraTarget = { careSpaceId };
    await this.infra.assertCan(actor, 'infra.stock.view', target, tx);
  }

  /**
   * Resuelve el espacio y la unidad del cuerpo como un punto de stock válido de la
   * sede de práctica de la farmacia.
   *
   * @param tx - Transacción o contexto activo.
   * @param tenantId - Tenant del contexto.
   * @param practiceSiteId - Sede de práctica de la sede de farmacia.
   * @param input - Espacio y unidad pedidos.
   * @returns Lo que se guarda.
   * @throws ResourceNotFoundException (404) si el espacio o la unidad no son del tenant.
   * @throws PreconditionFailedException (422) por sede, perfil, vigencia o unidad incoherentes.
   */
  async resolve(
    tx: EntityManager,
    tenantId: string,
    practiceSiteId: string,
    input: StockPointInput,
  ): Promise<ResolvedStockPoint> {
    const now = new Date();
    let spaceId: string | null = null;
    let unitId: string | null = null;

    if (input.careSpaceId) {
      const rows = await tx.execute<Record<string, unknown>[]>(
        `select id, practice_site_id, space_type_concept_id, status_concept_id, valid_from, valid_to
           from practice.care_spaces where id = ? and tenant_id = ?`,
        [input.careSpaceId, tenantId],
      );
      const space = rows[0];
      if (!space) throw this.notAvailable();
      if (String(space.practice_site_id) !== practiceSiteId) {
        throw this.mismatch(
          Reason.STOCK_POINT_SITE_MISMATCH,
          'El espacio no es de la sede de la farmacia',
        );
      }
      const fn = FUNCTIONS.byConceptId(String(space.space_type_concept_id));
      const profile = fn
        ? FUNCTION_PROFILES[fn.code as FunctionCode]
        : undefined;
      if (!profile?.stockPoint) {
        throw this.mismatch(
          Reason.SPACE_NOT_STOCK_POINT,
          'El espacio no es un punto de stock',
          { functionCode: fn?.code ?? null },
        );
      }
      const from = this.asDate(space.valid_from);
      const to = this.asDate(space.valid_to);
      if (
        String(space.status_concept_id) !== PRAC.SPACE_ACTIVE ||
        (from && from.getTime() > now.getTime()) ||
        (to && to.getTime() <= now.getTime())
      ) {
        throw this.mismatch(
          Reason.STOCK_POINT_SPACE_NOT_ACTIVE,
          'El espacio no está activo',
        );
      }
      spaceId = String(space.id);
    }

    if (input.clinicalUnitId) {
      const rows = await tx.execute<Record<string, unknown>[]>(
        `select id, practice_site_id, status_concept_id
           from practice.clinical_units where id = ? and tenant_id = ?`,
        [input.clinicalUnitId, tenantId],
      );
      const unit = rows[0];
      if (!unit) throw this.notAvailable();
      if (String(unit.practice_site_id) !== practiceSiteId) {
        throw this.mismatch(
          Reason.STOCK_POINT_SITE_MISMATCH,
          'La unidad no es de la sede de la farmacia',
        );
      }
      if (String(unit.status_concept_id) !== PRAC.UNIT_ACTIVE) {
        throw this.mismatch(
          Reason.STOCK_POINT_UNIT_NOT_ACTIVE,
          'La unidad no está activa',
        );
      }
      unitId = String(unit.id);
    }

    if (spaceId && unitId && !(await spaceBelongsToUnit(tx, spaceId, unitId))) {
      throw this.mismatch(
        Reason.STOCK_POINT_UNIT_MISMATCH,
        'El espacio no pertenece a la unidad indicada',
      );
    }
    return { careSpaceId: spaceId, clinicalUnitId: unitId };
  }

  /** Fecha del driver (`Date` o texto ISO), o `null`. */
  private asDate(value: unknown): Date | null {
    if (value === null || value === undefined) return null;
    return value instanceof Date ? value : new Date(strOrNull(value) ?? '');
  }

  private notAvailable(): ResourceNotFoundException {
    return new ResourceNotFoundException(
      NOT_AVAILABLE,
      undefined,
      Reason.PHARMACY_INVENTORY_RESOURCE_NOT_AVAILABLE,
    );
  }

  private mismatch(
    reason: Reason,
    message: string,
    details?: Record<string, unknown>,
  ): PreconditionFailedException {
    return new PreconditionFailedException(message, details, reason);
  }
}
