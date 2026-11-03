import { Injectable } from '@nestjs/common';
import { PRAC } from '../../../practice/practice.concepts';
import {
  FUNCTION_PROFILE_BY_CODE,
  PRACTICE_CONCEPT_BY_ID,
} from '../../../practice/domain/structure/structure-catalog';
import type { CareSpaceStockPointPort } from '../../application/ports/care-space-stock-point.port';
import type { UnitOfWork } from '../../application/ports/unit-of-work';
import type {
  StockPointSpaceFacts,
  StockPointUnitFacts,
} from '../../domain/stock-points/stock-point-rules';

/**
 * `CareSpaceStockPointPort` sobre `practice.care_spaces`,
 * `practice.clinical_units` y `pharmacy.pharmacy_sites` (SQL de sólo lectura en
 * la transacción del llamador).
 */
@Injectable()
export class PracticeCareSpaceStockPointAdapter implements CareSpaceStockPointPort {
  /** @inheritdoc */
  async describeSpace(
    uow: UnitOfWork,
    careSpaceId: string,
  ): Promise<StockPointSpaceFacts | null> {
    const [row] = await uow.execute<
      {
        tenant_id: string;
        practice_site_id: string;
        space_type_concept_id: string;
        status_concept_id: string;
        valid_to: string | null;
      }[]
    >(
      `SELECT tenant_id, practice_site_id, space_type_concept_id, status_concept_id, valid_to
         FROM practice.care_spaces WHERE id = ?`,
      [careSpaceId],
      'all',
    );
    if (!row) return null;
    const code = PRACTICE_CONCEPT_BY_ID.get(row.space_type_concept_id)?.code;
    return {
      tenantId: row.tenant_id,
      practiceSiteId: row.practice_site_id,
      stockPoint: code
        ? (FUNCTION_PROFILE_BY_CODE.get(code)?.stockPoint ?? false)
        : false,
      active:
        row.status_concept_id === PRAC.SPACE_ACTIVE &&
        (!row.valid_to || new Date(row.valid_to).getTime() > Date.now()),
    };
  }

  /** @inheritdoc */
  async describeUnit(
    uow: UnitOfWork,
    clinicalUnitId: string,
  ): Promise<StockPointUnitFacts | null> {
    const [row] = await uow.execute<
      { tenant_id: string; practice_site_id: string }[]
    >(
      'SELECT tenant_id, practice_site_id FROM practice.clinical_units WHERE id = ?',
      [clinicalUnitId],
      'all',
    );
    return row
      ? { tenantId: row.tenant_id, practiceSiteId: row.practice_site_id }
      : null;
  }

  /** @inheritdoc */
  async practiceSiteOfPharmacySite(
    uow: UnitOfWork,
    pharmacySiteId: string,
  ): Promise<string | null> {
    const [row] = await uow.execute<{ practice_site_id: string }[]>(
      'SELECT practice_site_id FROM pharmacy.pharmacy_sites WHERE id = ?',
      [pharmacySiteId],
      'all',
    );
    return row?.practice_site_id ?? null;
  }
}
