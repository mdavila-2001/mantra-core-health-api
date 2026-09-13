import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `insurance_carriers`.
 */
@Entity({ schema: 'insurance', tableName: 'insurance_carriers' })
export class InsuranceCarriers {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Valor de carrier code mantenido por la instancia.
   */
  @Property({ fieldName: 'carrier_code', columnType: 'varchar' })
  carrierCode!: string;

  /**
   * Valor de legal name mantenido por la instancia.
   */
  @Property({ fieldName: 'legal_name', columnType: 'varchar' })
  legalName!: string;

  /**
   * Valor de sigla mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  sigla?: string;

  /**
   * Valor de address mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  address?: string;

  /**
   * Numero de WhatsApp con el que la aseguradora atiende reclamos y dudas de
   * cobertura (subtarea 2.3, v4.2.10). Formato internacional E.164 con
   * el signo '+' (lo exige y normaliza el DTO de escritura): sin el codigo de
   * pais, el enlace `wa.me` no sabria a que numero abrir el chat. `undefined`
   * significa que la aseguradora todavia no publico este canal.
   */
  @Property({
    fieldName: 'whatsapp_number',
    columnType: 'varchar',
    nullable: true,
  })
  whatsappNumber?: string;

  /**
   * Telefono de call center / linea gratuita para reclamos y dudas de
   * cobertura (subtarea 2.3, v4.2.10). Se persiste tal como la propia
   * aseguradora lo publica -- las lineas gratuitas bolivianas son del tipo
   * "800-10-xxxx" y no son E.164 -- por eso no comparte el patron de
   * `whatsappNumber`.
   */
  @Property({
    fieldName: 'call_center_phone',
    columnType: 'varchar',
    nullable: true,
  })
  callCenterPhone?: string;

  /**
   * Correo del area de siniestros o atencion al cliente de la aseguradora
   * (subtarea 2.3, v4.2.10). Ninguno de los tres canales reemplaza al motivo
   * TIPIFICADO del rechazo (`claim_line_adjudications.reason_concept_id`) ni
   * a la cita de la clausula contractual (`policy_clause_reference`,
   * v4.2.9): son el como comunicarse, no el porque de un rechazo.
   */
  @Property({
    fieldName: 'support_email',
    columnType: 'varchar',
    nullable: true,
  })
  supportEmail?: string;

  /**
   * Valor de regulator identifier mantenido por la instancia.
   */
  @Property({
    fieldName: 'regulator_identifier',
    columnType: 'varchar',
    nullable: true,
  })
  regulatorIdentifier?: string;

  /**
   * Identificador asociado a jurisdiction concept.
   */
  @Property({
    fieldName: 'jurisdiction_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  jurisdictionConceptId?: string;

  /**
   * Identificador asociado a public profile.
   */
  @Property({ fieldName: 'public_profile_id', type: 'uuid', nullable: true }) // FK → community.public_profiles
  publicProfileId?: string;

  /**
   * Identificador asociado a verification status concept.
   */
  @Property({ fieldName: 'verification_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  verificationStatusConceptId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
