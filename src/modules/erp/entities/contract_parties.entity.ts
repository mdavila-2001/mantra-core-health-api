import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `contract_parties`.
 */
@Entity({ schema: 'erp', tableName: 'contract_parties' })
export class ContractParties {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a contract.
   */
  @Property({ fieldName: 'contract_id', type: 'uuid' }) // FK → erp.contracts
  contractId!: string;

  /**
   * Identificador asociado a party role concept.
   */
  @Property({ fieldName: 'party_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  partyRoleConceptId!: string;

  /**
   * Identificador asociado a party type concept.
   */
  @Property({ fieldName: 'party_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  partyTypeConceptId!: string;

  /**
   * Valor de party ref type mantenido por la instancia.
   */
  @Property({
    fieldName: 'party_ref_type',
    columnType: 'varchar',
    nullable: true,
  })
  partyRefType?: string;

  /**
   * Identificador asociado a party ref.
   */
  @Property({ fieldName: 'party_ref_id', type: 'uuid', nullable: true })
  partyRefId?: string;

  /**
   * Valor de party name mantenido por la instancia.
   */
  @Property({ fieldName: 'party_name', columnType: 'varchar', nullable: true })
  partyName?: string;

  /**
   * Identificador asociado a signatory user.
   */
  @Property({ fieldName: 'signatory_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  signatoryUserId?: string;

  /**
   * Valor de signed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'signed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  signedAt?: Date;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
