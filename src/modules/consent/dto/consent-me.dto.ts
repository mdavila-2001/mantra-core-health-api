import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { CreateTreatmentInformedConsentDto } from './create-treatment-informed-consent.dto';

/** Estado legible de un registro de consentimiento, derivado de su concepto. */
export type ConsentRecordState = 'ACTIVE' | 'WITHDRAWN' | 'EXPIRED' | 'OTHER';

/** Propósito de tratamiento al que se refiere un consentimiento. */
export class ConsentPurposeDto {
  /**
   * Identificador del propósito.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Código estable del propósito.
   */
  @ApiPropertyOptional()
  code?: string;

  /**
   * Nombre del propósito, para mostrarlo tal cual.
   */
  @ApiPropertyOptional()
  name?: string;
}

/** Un consentimiento del titular, vigente o retirado. */
export class MyConsentDto {
  /**
   * Identificador del consentimiento (el que se pasa a `withdraw`).
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Estado legible.
   */
  @ApiProperty({ enum: ['ACTIVE', 'WITHDRAWN', 'EXPIRED', 'OTHER'] })
  state!: ConsentRecordState;

  /**
   * Propósito del consentimiento.
   */
  @ApiProperty({ type: ConsentPurposeDto })
  purpose!: ConsentPurposeDto;

  /**
   * Inicio de la vigencia.
   */
  @ApiPropertyOptional()
  validFrom?: Date;

  /**
   * Fin de la vigencia (se cierra al retirarlo).
   */
  @ApiPropertyOptional()
  validTo?: Date;

  /**
   * Cuándo se retiró, si se retiró.
   */
  @ApiPropertyOptional()
  withdrawnAt?: Date;

  /**
   * Versión de la política aceptada.
   */
  @ApiPropertyOptional()
  policyVersion?: string;

  /**
   * Alta del registro.
   */
  @ApiProperty()
  createdAt!: Date;
}

/** Una autorización de divulgación del titular. */
export class MyHipaaAuthorizationDto {
  /**
   * Identificador de la autorización.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Estado legible.
   */
  @ApiProperty({ enum: ['ACTIVE', 'WITHDRAWN', 'EXPIRED', 'OTHER'] })
  state!: ConsentRecordState;

  /**
   * Propósito.
   */
  @ApiProperty({ type: ConsentPurposeDto })
  purpose!: ConsentPurposeDto;

  /**
   * A quién se divulga.
   */
  @ApiProperty()
  recipientDescription!: string;

  /**
   * Qué información se divulga.
   */
  @ApiProperty()
  informationDescription!: string;

  /**
   * Cuándo vence.
   */
  @ApiPropertyOptional()
  expiresAt?: Date;

  /**
   * Cuándo se firmó.
   */
  @ApiPropertyOptional()
  signedAt?: Date;

  /**
   * Cuándo se revocó.
   */
  @ApiPropertyOptional()
  revokedAt?: Date;
}

/** Una objeción del titular a un tratamiento de sus datos. */
export class MyObjectionDto {
  /**
   * Identificador de la objeción.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * `RAISED` si sigue abierta, `RESOLVED` si ya se resolvió.
   */
  @ApiProperty({ enum: ['RAISED', 'RESOLVED', 'OTHER'] })
  state!: 'RAISED' | 'RESOLVED' | 'OTHER';

  /**
   * Propósito objetado.
   */
  @ApiProperty({ type: ConsentPurposeDto })
  purpose!: ConsentPurposeDto;

  /**
   * Motivo declarado.
   */
  @ApiPropertyOptional()
  reasonText?: string;

  /**
   * Cuándo se planteó.
   */
  @ApiPropertyOptional()
  raisedAt?: Date;

  /**
   * Cuándo se resolvió.
   */
  @ApiPropertyOptional()
  resolvedAt?: Date;
}

/** Un consentimiento informado de tratamiento, visto por el titular. */
export class MyTreatmentConsentDto {
  /**
   * Identificador del registro.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Encuentro en el que se firmó.
   */
  @ApiProperty({ format: 'uuid' })
  encounterId!: string;

  /**
   * `ACCEPTED` o `DECLINED`.
   */
  @ApiProperty({ enum: ['ACCEPTED', 'DECLINED', 'OTHER'] })
  decision!: 'ACCEPTED' | 'DECLINED' | 'OTHER';

  /**
   * Versión del material informativo.
   */
  @ApiPropertyOptional()
  informationVersion?: string;

  /**
   * Cuándo se firmó.
   */
  @ApiPropertyOptional()
  signedAt?: Date;

  /**
   * Cuándo se retiró.
   */
  @ApiPropertyOptional()
  withdrawnAt?: Date;
}

/** Respuesta con lista de un tipo de registro de «Mi privacidad». */
export class MyConsentListDto {
  /**
   * Registros del titular, del más reciente al más antiguo.
   */
  @ApiProperty({ type: [MyConsentDto] })
  items!: MyConsentDto[];
}

/** Respuesta de las autorizaciones de divulgación. */
export class MyHipaaAuthorizationListDto {
  /**
   * Autorizaciones del titular.
   */
  @ApiProperty({ type: [MyHipaaAuthorizationDto] })
  items!: MyHipaaAuthorizationDto[];
}

/** Respuesta de las objeciones. */
export class MyObjectionListDto {
  /**
   * Objeciones del titular.
   */
  @ApiProperty({ type: [MyObjectionDto] })
  items!: MyObjectionDto[];
}

/** Respuesta de los consentimientos informados. */
export class MyTreatmentConsentListDto {
  /**
   * Consentimientos informados del titular.
   */
  @ApiProperty({ type: [MyTreatmentConsentDto] })
  items!: MyTreatmentConsentDto[];
}

/**
 * Cuerpo del consentimiento informado que registra el médico (CL-77).
 *
 * Es el DTO de `POST /consent/treatment-informed-consents` sin `patientProfileId`,
 * `encounterId` ni `tenantId`: el paciente y el tenant salen del encuentro de la
 * ruta, nunca del cuerpo.
 */
export class RegisterEncounterInformedConsentDto extends OmitType(
  CreateTreatmentInformedConsentDto,
  ['patientProfileId', 'encounterId', 'tenantId'] as const,
) {}
