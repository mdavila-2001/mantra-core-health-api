import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Respuesta de alta de autoridad (UC-27-01). */
export class AuthorityResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /**
   * Valor de authority code mantenido por la instancia.
   */
  @ApiProperty() authorityCode!: string;
  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ format: 'uuid' }) status!: string;
  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty() createdAt!: Date;
}

/** Respuesta de alta de endpoint de autoridad (UC-27-01). */
export class AuthorityEndpointResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /**
   * Identificador asociado a identity authority.
   */
  @ApiProperty({ format: 'uuid' }) identityAuthorityId!: string;
  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ format: 'uuid' }) status!: string;
  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty() createdAt!: Date;
}

/** Respuesta de alta de política de verificación (soporte de UC-27-02). */
export class PolicyResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /**
   * Valor de policy code mantenido por la instancia.
   */
  @ApiProperty() policyCode!: string;
  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ format: 'uuid' }) status!: string;
  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty() createdAt!: Date;
}

/** Respuesta de un caso de verificación (UC-27-02). */
export class CaseResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ format: 'uuid' }) status!: string;
  /**
   * Valor de opened at mantenido por la instancia.
   */
  @ApiPropertyOptional() openedAt?: Date;
  /**
   * Valor de expires at mantenido por la instancia.
   */
  @ApiPropertyOptional() expiresAt?: Date;
}

/** Respuesta de aporte de evidencia (UC-27-03). */
export class EvidenceResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /**
   * Valor de verification status mantenido por la instancia.
   */
  @ApiProperty({ format: 'uuid' }) verificationStatus!: string;
  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty() createdAt!: Date;
}

/** Respuesta de planificación de checks (UC-27-04). */
export class ChecksPlannedResponseDto {
  /**
   * Identificador asociado a case.
   */
  @ApiProperty({ format: 'uuid' }) caseId!: string;
  /**
   * Valor de check ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String] }) checkIds!: string[];
  /**
   * Valor de case status mantenido por la instancia.
   */
  @ApiProperty({ format: 'uuid' }) caseStatus!: string;
}

/** Respuesta de un intento contra autoridad (UC-27-05). */
export class AttemptResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /**
   * Valor de attempt number mantenido por la instancia.
   */
  @ApiProperty() attemptNumber!: number;
  /**
   * Valor de outcome mantenido por la instancia.
   */
  @ApiProperty({ format: 'uuid' }) outcome!: string;
  /**
   * Valor de check status mantenido por la instancia.
   */
  @ApiProperty({ format: 'uuid' }) checkStatus!: string;
}

/** Respuesta de un resultado de check (UC-27-06). */
export class CheckResultResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /**
   * Valor de result version mantenido por la instancia.
   */
  @ApiProperty() resultVersion!: number;
  /**
   * Valor de result mantenido por la instancia.
   */
  @ApiProperty({ format: 'uuid' }) result!: string;
  /**
   * Valor de check status mantenido por la instancia.
   */
  @ApiProperty({ format: 'uuid' }) checkStatus!: string;
  /**
   * Estado del caso si este resultado lo cerró; ausente si no lo cambió.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Estado del caso si este resultado lo resolvió',
  })
  caseStatus?: string;
}

/** Respuesta de una señal de fraude (UC-27-07). */
export class FraudSignalResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /**
   * Valor de resolution mantenido por la instancia.
   */
  @ApiProperty({ format: 'uuid' }) resolution!: string;
  /**
   * Valor de case status mantenido por la instancia.
   */
  @ApiProperty({ format: 'uuid' }) caseStatus!: string;
}

/** Respuesta de apertura de revisión manual (UC-27-08). */
export class ManualReviewResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ format: 'uuid' }) status!: string;
  /**
   * Valor de case status mantenido por la instancia.
   */
  @ApiProperty({ format: 'uuid' }) caseStatus!: string;
}

/** Respuesta de decisión de revisión manual (UC-27-09). */
export class ReviewDecisionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ format: 'uuid' }) status!: string;
  /**
   * Valor de case status mantenido por la instancia.
   */
  @ApiProperty({ format: 'uuid' }) caseStatus!: string;
}

/** Respuesta de emisión de aserción (UC-27-10). */
export class AssertionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /**
   * Valor de assertion identifier mantenido por la instancia.
   */
  @ApiPropertyOptional() assertionIdentifier?: string;
  /**
   * Valor de assurance level mantenido por la instancia.
   */
  @ApiProperty({ format: 'uuid' }) assuranceLevel!: string;
  /**
   * Valor de issued at mantenido por la instancia.
   */
  @ApiPropertyOptional() issuedAt?: Date;
  /**
   * Valor de case status mantenido por la instancia.
   */
  @ApiProperty({ format: 'uuid' }) caseStatus!: string;
}

/** Respuesta de revocación de aserción (UC-27-11). */
export class AssertionRevokedResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /**
   * Valor de revoked at mantenido por la instancia.
   */
  @ApiProperty() revokedAt!: Date;
  /**
   * Valor de case status mantenido por la instancia.
   */
  @ApiProperty({ format: 'uuid' }) caseStatus!: string;
}

/** Respuesta del barrido de expiración (UC-27-12). */
export class ExpireSweepResponseDto {
  /**
   * Valor de expired count mantenido por la instancia.
   */
  @ApiProperty() expiredCount!: number;
  /**
   * Valor de case ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String] }) caseIds!: string[];
}
