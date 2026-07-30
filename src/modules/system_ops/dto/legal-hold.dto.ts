import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Cuerpo de `POST /admin/governance/legal-holds` (UC-11-08). */
export class CreateLegalHoldDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ description: 'Tenant del hold', format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Identificador asociado a target type concept.
   */
  @ApiProperty({ description: 'Tipo de objetivo (concept id)', format: 'uuid' })
  @IsUUID()
  targetTypeConceptId!: string;

  /**
   * Identificador asociado a target.
   */
  @ApiProperty({ description: 'Id del objetivo bajo hold', format: 'uuid' })
  @IsUUID()
  targetId!: string;

  /**
   * Identificador asociado a reason concept.
   */
  @ApiProperty({ description: 'Razón del hold (concept id)', format: 'uuid' })
  @IsUUID()
  reasonConceptId!: string;

  /**
   * Valor de authority reference mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Referencia de la autoridad',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  authorityReference?: string;

  /**
   * Valor de starts at mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Inicio del hold (ISO)' })
  @IsOptional()
  @IsDateString()
  startsAt?: string;
}

/** Cuerpo de `POST /admin/governance/legal-holds/{id}/release` (UC-11-08). */
export class ReleaseLegalHoldDto {
  /**
   * Valor de reason mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Motivo del levantamiento',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason?: string;
}
