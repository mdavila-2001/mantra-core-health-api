import { ApiProperty } from '@nestjs/swagger';
import { MoneyDto } from './claims-read.dto';
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
