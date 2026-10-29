import { ApiProperty } from '@nestjs/swagger';
import { MoneyDto } from './claims-read.dto';
import { PRIOR_AUTHORIZATION_QUOTE_STATUSES } from './claim-quote.dto';
import {
  PATIENT_OBJECTION_REASONS,
  type PatientObjectionReason,
} from './claim-dispute.dto';
import { InsuranceConceptDto } from './read.dto';
import {
  RECEIVED_CLAIM_OUTCOMES,
  type ReceivedClaimOutcome,
} from './received-claims.dto';

/** El servidor decide el lado de la sesión; laboratorio precede a imagen si coexisten. */
export const MY_CLAIMS_VIEWS = [
  'PATIENT',
  'PRACTITIONER',
  'LABORATORY',
  'IMAGING',
  'NONE',
] as const;
export type MyClaimsView = (typeof MY_CLAIMS_VIEWS)[number];

/** Profesional visible en autoservicio, sin su identificador interno. */
export class MyClaimPractitionerDto {
  @ApiProperty()
  displayName!: string;

  @ApiProperty({ nullable: true, type: String })
  specialty!: string | null;
}

/** Estado de la aprobación previa de una línea del desglose. */
export type PriorAuthorizationQuoteStatus =
  (typeof PRIOR_AUTHORIZATION_QUOTE_STATUSES)[number];

/** Cómo entra cada servicio al cobro: con seguro, o el total como particular. */
export const PATIENT_CHARGE_KINDS = ['INSURED_SHARE', 'PRIVATE_FULL'] as const;
export type PatientChargeKind = (typeof PATIENT_CHARGE_KINDS)[number];

/** Estados de la objeción del paciente que se le muestran. */
export const MY_CLAIM_OBJECTION_STATUSES = ['OPEN', 'RESOLVED'] as const;
export type MyClaimObjectionStatus =
  (typeof MY_CLAIM_OBJECTION_STATUSES)[number];

/** Un servicio del desglose: lo que cubre el plan y lo que paga cada parte. */
export class MyClaimBreakdownLineDto {
  /** Identificador de la línea del reclamo. */
  @ApiProperty({ format: 'uuid' })
  key!: string;

  /** Nombre del servicio. */
  @ApiProperty()
  service!: string;

  /** Precio del servicio, cadena decimal. */
  @ApiProperty()
  billedAmount!: string;

  /** Porcentaje que cubre el plan, cadena decimal. */
  @ApiProperty()
  coveragePercent!: string;

  /** Copago, cadena decimal. */
  @ApiProperty()
  copayAmount!: string;

  /** Lo que paga la persona, cadena decimal. */
  @ApiProperty()
  patientAmount!: string;

  /** Lo que paga la aseguradora, cadena decimal. */
  @ApiProperty()
  insurerAmount!: string;

  /** Con seguro, o el total como particular. */
  @ApiProperty({ enum: PATIENT_CHARGE_KINDS })
  chargeKind!: PatientChargeKind;

  /** Estado de la aprobación previa; `null` si el cobro es particular. */
  @ApiProperty({
    enum: PRIOR_AUTHORIZATION_QUOTE_STATUSES,
    nullable: true,
    type: String,
  })
  authorizationStatus!: PriorAuthorizationQuoteStatus | null;
}

/** El desglose completo del cobro a la persona, calculado por el servidor. */
export class MyClaimBreakdownDto {
  /** Código de la moneda, si el reclamo la declara. */
  @ApiProperty({ nullable: true, type: String })
  currencyCode!: string | null;

  /** Total a cargo de la persona, cadena decimal. */
  @ApiProperty()
  patientTotal!: string;

  /** Total a cargo de la aseguradora, cadena decimal. */
  @ApiProperty()
  insurerTotal!: string;

  /** Un renglón por servicio. */
  @ApiProperty({ type: [MyClaimBreakdownLineDto] })
  lines!: MyClaimBreakdownLineDto[];
}

/** La objeción que la persona presentó sobre un cobro: motivo cerrado, sin texto libre. */
export class MyClaimObjectionDto {
  /** Identificador de la objeción. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Motivo elegido de la lista cerrada. */
  @ApiProperty({ enum: PATIENT_OBJECTION_REASONS })
  reason!: PatientObjectionReason;

  /** Cuándo la presentó. */
  @ApiProperty({ format: 'date-time' })
  submittedAt!: string;

  /** Abierta, o ya resuelta. */
  @ApiProperty({ enum: MY_CLAIM_OBJECTION_STATUSES })
  status!: MyClaimObjectionStatus;
}

/** Dictamen vigente, sin la identidad del operador de la aseguradora. */
export class MyClaimDecisionDto {
  @ApiProperty({ enum: RECEIVED_CLAIM_OUTCOMES })
  outcome!: ReceivedClaimOutcome;

  @ApiProperty({ format: 'date-time' })
  decidedAt!: string;

  @ApiProperty({ nullable: true, type: String })
  reason!: string | null;
}

/** Proyección P56: sólo los datos necesarios para entender la decisión. */
export class MyClaimDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  claimIdentifier!: string;

  @ApiProperty({ nullable: true, type: String })
  patientName!: string | null;

  @ApiProperty({ nullable: true, type: MyClaimPractitionerDto })
  practitioner!: MyClaimPractitionerDto | null;

  @ApiProperty()
  providerName!: string;

  @ApiProperty({ nullable: true, type: InsuranceConceptDto })
  service!: InsuranceConceptDto | null;

  @ApiProperty()
  additionalServiceCount!: number;

  @ApiProperty({ type: MoneyDto })
  billedTotal!: MoneyDto;

  @ApiProperty({ nullable: true, type: MoneyDto })
  approvedTotal!: MoneyDto | null;

  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  submittedAt!: string | null;

  @ApiProperty({ nullable: true, type: String, format: 'date' })
  serviceDate!: string | null;

  @ApiProperty()
  insurerName!: string;

  @ApiProperty({ nullable: true, type: String })
  planName!: string | null;

  @ApiProperty({ nullable: true, type: InsuranceConceptDto })
  status!: InsuranceConceptDto | null;

  @ApiProperty({ nullable: true, type: MyClaimDecisionDto })
  decision!: MyClaimDecisionDto | null;

  /**
   * El desglose del cobro a la persona. Solo en la vista del paciente y para
   * las solicitudes más recientes; `null` en cualquier otro caso.
   */
  @ApiProperty({ nullable: true, type: MyClaimBreakdownDto })
  breakdown!: MyClaimBreakdownDto | null;

  /** La objeción de la persona, si la presentó. Solo en la vista del paciente. */
  @ApiProperty({ nullable: true, type: MyClaimObjectionDto })
  patientObjection!: MyClaimObjectionDto | null;
}

/** Hasta 500 filas; NONE es una cuenta sin alcance, no un error de permisos. */
export class MyClaimListDto {
  @ApiProperty({ enum: MY_CLAIMS_VIEWS })
  view!: MyClaimsView;

  @ApiProperty({ type: [MyClaimDto] })
  items!: MyClaimDto[];

  @ApiProperty()
  truncated!: boolean;
}
