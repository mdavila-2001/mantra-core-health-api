import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Respuesta de alta de autoridad (UC-27-01). */
export class AuthorityResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() authorityCode!: string;
  @ApiProperty({ format: 'uuid' }) status!: string;
  @ApiProperty() createdAt!: Date;
}

/** Respuesta de alta de endpoint de autoridad (UC-27-01). */
export class AuthorityEndpointResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) identityAuthorityId!: string;
  @ApiProperty({ format: 'uuid' }) status!: string;
  @ApiProperty() createdAt!: Date;
}

/** Respuesta de alta de política de verificación (soporte de UC-27-02). */
export class PolicyResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() policyCode!: string;
  @ApiProperty({ format: 'uuid' }) status!: string;
  @ApiProperty() createdAt!: Date;
}

/** Respuesta de un caso de verificación (UC-27-02). */
export class CaseResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) status!: string;
  @ApiPropertyOptional() openedAt?: Date;
  @ApiPropertyOptional() expiresAt?: Date;
}

/** Respuesta de aporte de evidencia (UC-27-03). */
export class EvidenceResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) verificationStatus!: string;
  @ApiProperty() createdAt!: Date;
}

/** Respuesta de planificación de checks (UC-27-04). */
export class ChecksPlannedResponseDto {
  @ApiProperty({ format: 'uuid' }) caseId!: string;
  @ApiProperty({ type: [String] }) checkIds!: string[];
  @ApiProperty({ format: 'uuid' }) caseStatus!: string;
}

/** Respuesta de un intento contra autoridad (UC-27-05). */
export class AttemptResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() attemptNumber!: number;
  @ApiProperty({ format: 'uuid' }) outcome!: string;
  @ApiProperty({ format: 'uuid' }) checkStatus!: string;
}

/** Respuesta de un resultado de check (UC-27-06). */
export class CheckResultResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() resultVersion!: number;
  @ApiProperty({ format: 'uuid' }) result!: string;
  @ApiProperty({ format: 'uuid' }) checkStatus!: string;
}

/** Respuesta de una señal de fraude (UC-27-07). */
export class FraudSignalResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) resolution!: string;
  @ApiProperty({ format: 'uuid' }) caseStatus!: string;
}

/** Respuesta de apertura de revisión manual (UC-27-08). */
export class ManualReviewResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) status!: string;
  @ApiProperty({ format: 'uuid' }) caseStatus!: string;
}

/** Respuesta de decisión de revisión manual (UC-27-09). */
export class ReviewDecisionResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) status!: string;
  @ApiProperty({ format: 'uuid' }) caseStatus!: string;
}

/** Respuesta de emisión de aserción (UC-27-10). */
export class AssertionResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiPropertyOptional() assertionIdentifier?: string;
  @ApiProperty({ format: 'uuid' }) assuranceLevel!: string;
  @ApiPropertyOptional() issuedAt?: Date;
  @ApiProperty({ format: 'uuid' }) caseStatus!: string;
}

/** Respuesta de revocación de aserción (UC-27-11). */
export class AssertionRevokedResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() revokedAt!: Date;
  @ApiProperty({ format: 'uuid' }) caseStatus!: string;
}

/** Respuesta del barrido de expiración (UC-27-12). */
export class ExpireSweepResponseDto {
  @ApiProperty() expiredCount!: number;
  @ApiProperty({ type: [String] }) caseIds!: string[];
}
