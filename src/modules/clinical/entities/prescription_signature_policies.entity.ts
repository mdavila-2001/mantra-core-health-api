import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Política PARAMETRIZABLE de firma de receta (REDESA D-05 / CAN-RX). Define, por
 * tenant, si la firma es obligatoria en función de la jurisdicción, el tipo de
 * medicamento y el canal de emisión. Las dimensiones nulas actúan como comodín
 * ("aplica a todo"). Se resuelve la política vigente MÁS ESPECÍFICA; si ninguna
 * aplica, el sistema es FAIL-SAFE y no exige firma.
 */
@Entity({ schema: 'clinical', tableName: 'prescription_signature_policies' })
export class PrescriptionSignaturePolicies {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /** Código de jurisdicción (comodín si nulo). */
  @Property({
    fieldName: 'jurisdiction_code',
    columnType: 'varchar',
    nullable: true,
  })
  jurisdictionCode?: string;

  /** Tipo de medicamento (concept id); comodín si nulo. FK → terminology.catalog_concepts */
  @Property({
    fieldName: 'medication_type_concept_id',
    type: 'uuid',
    nullable: true,
  })
  medicationTypeConceptId?: string;

  /** Canal de emisión (concept id); comodín si nulo. FK → terminology.catalog_concepts */
  @Property({ fieldName: 'channel_concept_id', type: 'uuid', nullable: true })
  channelConceptId?: string;

  /** Si la firma es obligatoria cuando esta política aplica. Default FAIL-SAFE. */
  @Property({ fieldName: 'signature_required', columnType: 'boolean' })
  signatureRequired: boolean = false;

  @Property({ fieldName: 'effective_from', columnType: 'timestamptz' })
  effectiveFrom!: Date;

  /** Nulo = vigente indefinidamente. Desactivar = poblar con `now` (sin borrado duro). */
  @Property({ fieldName: 'effective_to', columnType: 'timestamptz', nullable: true })
  effectiveTo?: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
