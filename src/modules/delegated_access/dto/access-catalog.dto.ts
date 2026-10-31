import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PermissionAtomViewDto {
  @ApiProperty() code!: string;
  @ApiProperty() name!: string;
  @ApiProperty() category!: string;
  @ApiProperty({ enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] })
  sensitivity!: string;
  @ApiProperty() requiresReason!: boolean;
  @ApiProperty() requiresStepUp!: boolean;
  @ApiPropertyOptional({ enum: ['DOCTOR', 'SECOND_APPROVER'], nullable: true })
  approvalMode!: string | null;
  @ApiProperty() purposeOfUse!: string;
  @ApiProperty() legalBasis!: string;
  @ApiProperty() touchesClinicalData!: boolean;
  @ApiProperty() isFieldLevel!: boolean;
  @ApiProperty({
    description: 'Falso: solo `SECURITY_ADMIN`, nunca personal de apoyo.',
  })
  supportAssignable!: boolean;
  @ApiProperty() isDangerous!: boolean;
}

export class PermissionCategoryViewDto {
  @ApiProperty() code!: string;
  @ApiProperty() name!: string;
}

export class LegacyAliasViewDto {
  @ApiProperty({ description: 'Uno de los 15 códigos antiguos.' })
  code!: string;
  @ApiProperty({ type: [String], description: 'Permisos que da hoy.' })
  atoms!: string[];
  @ApiProperty({
    description:
      'Permiso que se exige cuando se pregunta con el código antiguo.',
  })
  primary!: string;
}

export class PermissionCatalogResponseDto {
  @ApiProperty({ type: [PermissionAtomViewDto] })
  atoms!: PermissionAtomViewDto[];
  @ApiProperty({ type: [PermissionCategoryViewDto] })
  categories!: PermissionCategoryViewDto[];
  @ApiProperty({ type: [LegacyAliasViewDto] }) aliases!: LegacyAliasViewDto[];
}

export class GrantSummaryViewDto {
  @ApiProperty({ format: 'uuid' }) grantId!: string;
  @ApiProperty({ enum: ['ALLOW', 'DENY'] }) effect!: string;
  @ApiProperty() targetKind!: string;
  @ApiProperty({
    description: 'Frase en lenguaje simple (la arma el servidor).',
  })
  summary!: string;
  @ApiProperty({ type: [String] }) atoms!: string[];
}

export class EngagementSummaryResponseDto {
  @ApiProperty({ format: 'uuid' }) engagementId!: string;
  @ApiProperty({ type: [GrantSummaryViewDto] }) grants!: GrantSummaryViewDto[];
  @ApiProperty({ type: [String] }) plain!: string[];
}

export class EffectiveAtomViewDto {
  @ApiProperty() atom!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] })
  sensitivity!: string;
  @ApiProperty({ enum: ['LEGACY', 'ATOM', 'BOTH'] }) origin!: string;
  @ApiProperty({ type: [String] }) grantIds!: string[];
  @ApiProperty({ description: 'Algún permiso que lo da trae condiciones.' })
  conditional!: boolean;
}

export class DeniedAtomViewDto {
  @ApiProperty() atom!: string;
  @ApiProperty({ format: 'uuid' }) grantId!: string;
}

export class EngagementEffectiveResponseDto {
  @ApiProperty({ format: 'uuid' }) engagementId!: string;
  @ApiProperty({ type: [EffectiveAtomViewDto] }) atoms!: EffectiveAtomViewDto[];
  @ApiProperty({
    type: [DeniedAtomViewDto],
    description: 'Prohibiciones expresas vigentes.',
  })
  denied!: DeniedAtomViewDto[];
}
