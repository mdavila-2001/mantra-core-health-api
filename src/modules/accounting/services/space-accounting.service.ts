import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { CONCEPTS } from '../../../common/constants/concepts';
import { OutboxService } from '../../messaging/services/outbox.service';
import { InfrastructureAccessService } from '../../practice/services/infrastructure-access.service';
import { checkIfMatchWhenPresent } from '../../practice/services/structure-input';
import { AccountingErrorReason } from '../accounting.error-reasons';
import { CostCenters, InfrastructureItems } from '../entities';

/** Concepto `{code, display}`. */
export interface AccountingConceptView {
  code: string;
  display: string;
}

/** Vista de un activo de infraestructura (forma `InfrastructureItem` de la web). */
export interface InfrastructureItemView {
  id: string;
  practiceId: string;
  code: string;
  name: string;
  category: string;
  careSpace: { id: string; code: string; name: string; path: string } | null;
  locationText: string | null;
  bookValue: string;
  currencyCode: string;
  rowVersion: number;
}

/** Vista de un centro de costo con su unidad. */
export interface CostCenterView {
  id: string;
  practiceId: string;
  code: string;
  name: string;
  clinicalUnit: { id: string; name: string } | null;
  status: AccountingConceptView;
}

const ITEMS_SQL = `
  WITH RECURSIVE chain AS (
    SELECT i.id AS item, cs.id, cs.parent_space_id, cs.name, 0 AS depth
      FROM accounting.infrastructure_items i
      JOIN practice.care_spaces cs ON cs.id = i.care_space_id
     WHERE i.practice_id = ? AND i.tenant_id = ?
    UNION ALL
    SELECT c.item, p.id, p.parent_space_id, p.name, c.depth + 1
      FROM chain c JOIN practice.care_spaces p ON p.id = c.parent_space_id
     WHERE c.depth < 32
  ), paths AS (
    SELECT item, string_agg(name, ' / ' ORDER BY depth DESC) AS path FROM chain GROUP BY item
  )
  SELECT i.id, i.practice_id, i.name, i.location_text, i.acquisition_cost, i.row_version,
         i.care_space_id, cs.code AS space_code, cs.name AS space_name, paths.path,
         coalesce(cat.display, cat.code) AS category
    FROM accounting.infrastructure_items i
    LEFT JOIN practice.care_spaces cs ON cs.id = i.care_space_id
    LEFT JOIN paths ON paths.item = i.id
    LEFT JOIN terminology.catalog_concepts cat ON cat.id = i.category_concept_id
   WHERE i.practice_id = ? AND i.tenant_id = ?`;

/**
 * Contabilidad por espacio y por unidad (CONTRATO-F2-F5 §F5f). Autoriza a
 * nivel práctica con el evaluador de §0.3 (`f5f.accounting.*`); todo id que
 * manda el cliente se resuelve en el tenant activo (404 si no) y en la misma
 * práctica (422).
 */
@Injectable()
export class SpaceAccountingService {
  constructor(
    private readonly em: EntityManager,
    private readonly access: InfrastructureAccessService,
    private readonly outbox: OutboxService,
  ) {}

  /** `GET /accounting/infrastructure-items?practiceId`. */
  async listItems(
    practiceId: string,
    actor: AuthenticatedUser,
    tenantId: string,
  ): Promise<InfrastructureItemView[]> {
    const em = this.em.fork();
    await this.access.assertPracticeLevel(
      em,
      actor,
      practiceId,
      tenantId,
      'f5f.accounting.read',
    );
    return this.itemRows(em, practiceId, tenantId);
  }

  /** `PATCH /accounting/infrastructure-items/:id {careSpaceId}`. */
  locateItem(
    itemId: string,
    careSpaceId: string | null,
    ifMatch: string | undefined,
    actor: AuthenticatedUser,
    tenantId: string,
  ): Promise<InfrastructureItemView> {
    return this.em.transactional(async (tx) => {
      const item = await tx.findOne(InfrastructureItems, { id: itemId });
      if (!item || item.tenantId !== tenantId)
        throw new ResourceNotFoundException('Activo no encontrado', {
          itemId,
        });
      await this.access.assertPracticeLevel(
        tx,
        actor,
        item.practiceId,
        tenantId,
        'f5f.accounting.write',
      );
      checkIfMatchWhenPresent(ifMatch, item.rowVersion);
      if (careSpaceId) {
        const [space] = await tx.execute<
          { tenant_id: string; practice_id: string }[]
        >(
          `SELECT cs.tenant_id, ps.practice_id FROM practice.care_spaces cs
             JOIN practice.practice_sites ps ON ps.id = cs.practice_site_id
            WHERE cs.id = ?`,
          [careSpaceId],
          'all',
        );
        if (!space || space.tenant_id !== tenantId)
          throw new ResourceNotFoundException('Espacio no encontrado', {
            careSpaceId,
          });
        if (space.practice_id !== item.practiceId)
          throw new PreconditionFailedException(
            'El espacio no es de la práctica del activo',
            {},
            AccountingErrorReason.INFRASTRUCTURE_SPACE_PRACTICE_MISMATCH,
          );
      }
      const previous = item.careSpaceId ?? null;
      item.careSpaceId = careSpaceId ?? undefined;
      item.updatedAt = new Date();
      item.updatedByUserId = actor.id;
      await tx.flush();
      await this.outbox.publishDomainEvent(tx, {
        tenantId,
        eventType: 'accounting.infrastructure_item.located',
        aggregateType: 'accounting.infrastructure_items',
        aggregateId: item.id,
        payloadJson: {
          infrastructureItemId: item.id,
          fromCareSpaceId: previous,
          toCareSpaceId: careSpaceId,
        },
        actorUserId: actor.id,
      });
      const [view] = (
        await this.itemRows(tx, item.practiceId, tenantId)
      ).filter((v) => v.id === item.id);
      return view;
    });
  }

  /** `GET /accounting/cost-centers?practiceId`. */
  async listCostCenters(
    practiceId: string,
    actor: AuthenticatedUser,
    tenantId: string,
  ): Promise<CostCenterView[]> {
    const em = this.em.fork();
    await this.access.assertPracticeLevel(
      em,
      actor,
      practiceId,
      tenantId,
      'f5f.accounting.read',
    );
    return this.costCenterRows(em, practiceId, tenantId);
  }

  /** `POST /accounting/cost-centers/:id/unit-link {clinicalUnitId}`. */
  linkUnit(
    costCenterId: string,
    clinicalUnitId: string,
    actor: AuthenticatedUser,
    tenantId: string,
  ): Promise<CostCenterView> {
    return this.em.transactional(async (tx) => {
      const center = await tx.findOne(CostCenters, { id: costCenterId });
      if (!center || center.tenantId !== tenantId)
        throw new ResourceNotFoundException('Centro de costo no encontrado', {
          costCenterId,
        });
      await this.access.assertPracticeLevel(
        tx,
        actor,
        center.practiceId,
        tenantId,
        'f5f.accounting.write',
      );
      if (center.statusConceptId !== CONCEPTS.STATE_ACTIVE)
        throw new PreconditionFailedException(
          'El centro de costo no está activo',
          {},
          AccountingErrorReason.COST_CENTER_NOT_ACTIVE,
        );
      const [unit] = await tx.execute<
        { tenant_id: string; practice_id: string }[]
      >(
        `SELECT u.tenant_id, ps.practice_id FROM practice.clinical_units u
           JOIN practice.practice_sites ps ON ps.id = u.practice_site_id
          WHERE u.id = ?`,
        [clinicalUnitId],
        'all',
      );
      if (!unit || unit.tenant_id !== tenantId)
        throw new ResourceNotFoundException('Unidad clínica no encontrada', {
          clinicalUnitId,
        });
      if (unit.practice_id !== center.practiceId)
        throw new PreconditionFailedException(
          'La unidad no es de la práctica del centro de costo',
          {},
          AccountingErrorReason.COST_CENTER_UNIT_PRACTICE_MISMATCH,
        );
      const taken = await tx.findOne(CostCenters, {
        clinicalUnitId,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        id: { $ne: center.id },
      });
      if (taken) throw unitTaken();
      center.clinicalUnitId = clinicalUnitId;
      center.updatedAt = new Date();
      center.updatedByUserId = actor.id;
      try {
        await tx.flush();
      } catch (error) {
        if (isUnitUniqueViolation(error)) throw unitTaken();
        throw error;
      }
      await this.outbox.publishDomainEvent(tx, {
        tenantId,
        eventType: 'accounting.cost_center.unit_linked',
        aggregateType: 'accounting.cost_centers',
        aggregateId: center.id,
        payloadJson: { costCenterId: center.id, clinicalUnitId },
        actorUserId: actor.id,
      });
      const [view] = (
        await this.costCenterRows(tx, center.practiceId, tenantId)
      ).filter((v) => v.id === center.id);
      return view;
    });
  }

  private async itemRows(
    em: EntityManager,
    practiceId: string,
    tenantId: string,
  ): Promise<InfrastructureItemView[]> {
    const rows = await em.execute<Record<string, string | number | null>[]>(
      `${ITEMS_SQL} ORDER BY i.name, i.id`,
      [practiceId, tenantId, practiceId, tenantId],
      'all',
    );
    return rows.map((r) => ({
      id: String(r.id),
      practiceId: String(r.practice_id),
      code: '',
      name: String(r.name),
      category: r.category == null ? '' : String(r.category),
      careSpace: r.care_space_id
        ? {
            id: String(r.care_space_id),
            code: String(r.space_code ?? ''),
            name: String(r.space_name ?? ''),
            path: String(r.path ?? r.space_name ?? ''),
          }
        : null,
      locationText: r.location_text == null ? null : String(r.location_text),
      bookValue: r.acquisition_cost == null ? '0' : String(r.acquisition_cost),
      currencyCode: '',
      rowVersion: Number(r.row_version),
    }));
  }

  private async costCenterRows(
    em: EntityManager,
    practiceId: string,
    tenantId: string,
  ): Promise<CostCenterView[]> {
    const rows = await em.execute<Record<string, string | null>[]>(
      `SELECT c.id, c.practice_id, c.code, c.name, c.clinical_unit_id, u.name AS unit_name,
              st.code AS status_code, st.display AS status_display
         FROM accounting.cost_centers c
         LEFT JOIN practice.clinical_units u ON u.id = c.clinical_unit_id
         LEFT JOIN terminology.catalog_concepts st ON st.id = c.status_concept_id
        WHERE c.practice_id = ? AND c.tenant_id = ?
        ORDER BY c.code, c.id`,
      [practiceId, tenantId],
      'all',
    );
    return rows.map((r) => ({
      id: r.id!,
      practiceId: r.practice_id!,
      code: r.code ?? '',
      name: r.name ?? '',
      clinicalUnit: r.clinical_unit_id
        ? { id: r.clinical_unit_id, name: r.unit_name ?? '' }
        : null,
      status: {
        code: r.status_code ?? '',
        display: r.status_display ?? r.status_code ?? '',
      },
    }));
  }
}

function unitTaken(): ConflictException {
  return new ConflictException(
    'La unidad ya tiene un centro de costo activo',
    {},
    AccountingErrorReason.UNIT_ALREADY_HAS_COST_CENTER,
  );
}

function isUnitUniqueViolation(error: unknown): boolean {
  let current: unknown = error;
  for (let d = 0; d < 5 && current; d += 1) {
    const c = current as {
      code?: unknown;
      constraint?: unknown;
      message?: unknown;
      cause?: unknown;
    };
    if (
      c.code === '23505' &&
      (c.constraint === 'ux_cost_centers_unit_active' ||
        (typeof c.message === 'string' &&
          c.message.includes('ux_cost_centers_unit_active')))
    )
      return true;
    current = c.cause;
  }
  return false;
}
