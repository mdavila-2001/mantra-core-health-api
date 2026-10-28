import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `practitioner_insurer_requests`.
 *
 * ## Qué guarda
 *
 * El pedido de un profesional para figurar como prestador de una aseguradora
 * («trabajo con estos seguros»). Lo hace el médico —en el alta o después— y lo
 * decide la aseguradora desde su bandeja: aprobarlo es el sello oficial que el
 * médico ve en «Mis verificaciones».
 *
 * ## Por qué no es `network_provider_memberships`
 *
 * Aquélla es el **contrato**: cuelga de una red concreta y de un rol en una
 * práctica, y nace del lado de la aseguradora. Ésta es la **solicitud**: nombra
 * a la compañía y no a una red, y puede nacer el día del alta, cuando el médico
 * todavía no tiene ningún rol en ninguna práctica.
 *
 * Una sola fila VIVA —pendiente o aprobada— por médico y aseguradora
 * (`uq_practitioner_insurer_requests_live_pair`, único parcial). Volver a pedir
 * después de un rechazo o un retiro crea otra fila: la anterior es historia.
 */
@Entity({ schema: 'insurance', tableName: 'practitioner_insurer_requests' })
export class PractitionerInsurerRequests {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * El profesional que pide.
   */
  @Property({ fieldName: 'practitioner_profile_id', type: 'uuid' }) // FK → profiles.health_practitioner_profiles
  practitionerProfileId!: string;

  /**
   * La aseguradora a la que se le pide.
   */
  @Property({ fieldName: 'insurance_carrier_id', type: 'uuid' }) // FK → insurance.insurance_carriers
  insuranceCarrierId!: string;

  /**
   * Pendiente · aprobada · rechazada · retirada (`INS.PRACTITIONER_REQUEST_*`).
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Por qué la aseguradora la rechazó. **Lo lee el médico**: no es una nota
   * interna, y un rechazo sin motivo es mudo para quien lo recibe.
   */
  @Property({
    fieldName: 'decision_reason_text',
    columnType: 'varchar',
    nullable: true,
  })
  decisionReasonText?: string;

  /**
   * Cuándo la aseguradora decidió. `null` mientras está pendiente.
   */
  @Property({
    fieldName: 'decided_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  decidedAt?: Date;

  /**
   * Quién de la aseguradora decidió.
   */
  @Property({ fieldName: 'decided_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  decidedByUserId?: string;

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
