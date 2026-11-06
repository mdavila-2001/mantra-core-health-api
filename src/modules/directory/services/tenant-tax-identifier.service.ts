import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS, touch } from '../../../common';
import { IdentifiersRepository } from '../../common/repositories';

/** What it takes to record an organization's tax identifier (NIT in Bolivia). */
export interface TenantTaxIdentifierInput {
  readonly tenantId: string;
  readonly value: string;
  /** Legal name of the holder, as printed on invoices. */
  readonly holderName?: string;
  readonly actorUserId: string;
}

/**
 * The organization's tax identifier, stored on its own in `common.identifiers`
 * (owner `OWNER_TENANT`, type `ID_TYPE_TAX`).
 *
 * Before this, the NIT only lived as `document_number` of the tax document row,
 * and that row requires a file: a sign-up without the PDF lost the NIT the form
 * had asked for. The document now points here through `identifier_id`.
 */
@Injectable()
export class TenantTaxIdentifierService {
  constructor(private readonly identifiers: IdentifiersRepository) {}

  /**
   * Records the NIT and returns the id of the current row. The same value keeps
   * the current row; a different one closes it (`valid_to`) and opens a new one,
   * so the history stays.
   */
  async register(
    tx: EntityManager,
    input: TenantTaxIdentifierInput,
  ): Promise<string> {
    const value = input.value.trim();
    const current = await this.current(tx, input.tenantId);
    if (current?.value === value) return current.id;
    if (current) {
      current.validTo = new Date();
      touch(current, input.actorUserId);
    }
    const created = this.identifiers.create(tx, {
      ownerTypeConceptId: CONCEPTS.OWNER_TENANT,
      ownerId: input.tenantId,
      typeConceptId: CONCEPTS.ID_TYPE_TAX,
      value,
      holderName: input.holderName,
      useConceptId: CONCEPTS.USE_OFFICIAL,
      stateConceptId: CONCEPTS.STATE_ACTIVE,
      actorUserId: input.actorUserId,
    });
    // The tax document references this row through a plain uuid with an
    // immediate FK, and MikroORM does not order inserts across plain uuid
    // columns: write it now, before any document points at it.
    await tx.flush();
    return created.id;
  }

  /** The current NIT of the organization, if it declared one. */
  async currentValue(
    em: EntityManager,
    tenantId: string,
  ): Promise<string | undefined> {
    return (await this.current(em, tenantId))?.value;
  }

  private async current(em: EntityManager, tenantId: string) {
    const rows = await this.identifiers.findCurrentByOwner(em, tenantId);
    return rows.find(
      (row) =>
        row.typeConceptId === CONCEPTS.ID_TYPE_TAX &&
        row.ownerTypeConceptId === CONCEPTS.OWNER_TENANT,
    );
  }
}
