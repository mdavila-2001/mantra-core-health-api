import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Una autoridad de identidad del tenant, para el listado del hub (CV-13). */
export class IdentityAuthoritySummaryDto {
  /** Identificador único de la autoridad. */
  @ApiProperty({ format: 'uuid' }) id!: string;

  /** Código de la autoridad, único dentro del tenant. */
  @ApiProperty() authorityCode!: string;

  /** Nombre visible. */
  @ApiProperty() name!: string;

  /** Concepto del tipo de autoridad. */
  @ApiProperty({ format: 'uuid' }) authorityTypeConceptId!: string;

  /** Concepto de la jurisdicción, si se declaró. */
  @ApiPropertyOptional({ format: 'uuid' }) jurisdictionConceptId?: string;

  /** Concepto del estado de verificación. */
  @ApiProperty({ format: 'uuid' }) verificationStatusConceptId!: string;

  /** Concepto de estado. */
  @ApiProperty({ format: 'uuid' }) statusConceptId!: string;

  /** Fecha de creación. */
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date;
}

/** Página de autoridades de identidad del tenant del actor. */
export class ListIdentityAuthoritiesResponseDto {
  /** Filas de esta página, ordenadas por `id`. */
  @ApiProperty({ type: [IdentityAuthoritySummaryDto] })
  items!: IdentityAuthoritySummaryDto[];

  /** Cantidad devuelta en esta página. */
  @ApiProperty() count!: number;

  /** Tope aplicado a la consulta. */
  @ApiProperty() limit!: number;

  /** Cursor opaco de continuación, o `null` si ésta es la última página. */
  @ApiProperty({ nullable: true, type: String }) nextCursor!: string | null;
}

/** Una política de verificación de identidad (catálogo de plataforma). */
export class IdentityPolicySummaryDto {
  /** Identificador único de la política. */
  @ApiProperty({ format: 'uuid' }) id!: string;

  /** Código de la política. */
  @ApiProperty() policyCode!: string;

  /** Concepto del tipo de sujeto. */
  @ApiProperty({ format: 'uuid' }) subjectTypeConceptId!: string;

  /** Concepto del riesgo de la transacción. */
  @ApiProperty({ format: 'uuid' }) transactionRiskConceptId!: string;

  /** Nivel de aseguramiento de identidad exigido. */
  @ApiProperty({ format: 'uuid' })
  requiredIdentityAssuranceLevelConceptId!: string;

  /** Número de versión. */
  @ApiProperty() versionNumber!: number;

  /** Inicio de vigencia. */
  @ApiProperty({ type: String, format: 'date-time' }) effectiveFrom!: Date;

  /** Fin de vigencia. */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  effectiveTo?: Date;

  /** Concepto de estado. */
  @ApiProperty({ format: 'uuid' }) statusConceptId!: string;
}

/** Página de políticas de verificación de identidad. */
export class ListIdentityPoliciesResponseDto {
  /** Filas de esta página, ordenadas por `id`. */
  @ApiProperty({ type: [IdentityPolicySummaryDto] })
  items!: IdentityPolicySummaryDto[];

  /** Cantidad devuelta en esta página. */
  @ApiProperty() count!: number;

  /** Tope aplicado a la consulta. */
  @ApiProperty() limit!: number;

  /** Cursor opaco de continuación, o `null` si ésta es la última página. */
  @ApiProperty({ nullable: true, type: String }) nextCursor!: string | null;
}
