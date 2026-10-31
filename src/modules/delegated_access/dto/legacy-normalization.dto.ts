import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsUUID,
} from 'class-validator';

/** Normaliza los permisos heredados (15 códigos) a átomos (CONTRATO-GOBIERNO §2.5, M2). */
export class NormalizeLegacyDto {
  @ApiPropertyOptional({
    default: true,
    description: 'Simulacro: informa qué cambiaría sin escribir nada.',
  })
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;

  @ApiPropertyOptional({
    type: [String],
    description: 'Solo estos vínculos; vacío = todos los de la organización.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  @IsUUID('all', { each: true })
  engagementIds?: string[];

  @ApiPropertyOptional({
    description:
      'Reconoce que alguien perderá un permiso implícito (p. ej. pedir un acceso temporal) al normalizar.',
  })
  @IsOptional()
  @IsBoolean()
  acknowledgeTightening?: boolean;
}

export class RevertNormalizeDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Lote que devolvió la normalización.',
  })
  @IsUUID()
  batchId!: string;
}

/** Obligación que empezaría a regir porque el permiso pasa a ser un átomo. */
export class NormalizeObligationDto {
  @ApiProperty() atom!: string;
  @ApiProperty() requiresReason!: boolean;
  @ApiProperty() requiresStepUp!: boolean;
  @ApiPropertyOptional({ enum: ['DOCTOR', 'SECOND_APPROVER'], nullable: true })
  approval?: string | null;
  @ApiProperty({ description: 'Frase en lenguaje simple.' }) message!: string;
}

export class NormalizeGrantPlanDto {
  @ApiProperty({ format: 'uuid' }) grantId!: string;
  @ApiProperty({ type: [String] }) aliases!: string[];
  @ApiProperty({ type: [String] }) atomsBefore!: string[];
  @ApiProperty({ type: [String] }) atomsAfter!: string[];
  @ApiProperty({ type: [String] }) atomsAdded!: string[];
  @ApiProperty({ type: [NormalizeObligationDto] })
  newObligations!: NormalizeObligationDto[];
}

export class NormalizeTighteningDto {
  @ApiProperty({ format: 'uuid' }) engagementId!: string;
  @ApiProperty() atom!: string;
  @ApiProperty({ description: 'Frase en lenguaje simple.' }) message!: string;
}

export class NormalizeEngagementPlanDto {
  @ApiProperty({ format: 'uuid' }) engagementId!: string;
  @ApiProperty({ format: 'uuid' }) userId!: string;
  @ApiPropertyOptional() templateCode?: string;
  @ApiProperty({ type: [NormalizeGrantPlanDto] })
  grants!: NormalizeGrantPlanDto[];
  @ApiProperty({ type: [NormalizeTighteningDto] })
  tightening!: NormalizeTighteningDto[];
}

export class NormalizeLegacyResponseDto {
  @ApiProperty() dryRun!: boolean;
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Solo al aplicar: para revertir.',
  })
  batchId?: string;
  @ApiProperty({ type: [NormalizeEngagementPlanDto] })
  engagements!: NormalizeEngagementPlanDto[];
  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' } })
  totals!: Record<string, number>;
  @ApiProperty({
    description: 'Hay estrechamientos: aplicar exige `acknowledgeTightening`.',
  })
  requiresAcknowledgement!: boolean;
}

export class RevertNormalizeResponseDto {
  @ApiProperty({ format: 'uuid' }) batchId!: string;
  @ApiProperty() restoredAliasRows!: number;
  @ApiProperty() removedAtomRows!: number;
}
