import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/** Efecto de una regla de autorización. */
export const EFFECTS = ['ALLOW', 'DENY'] as const;
export type Effect = (typeof EFFECTS)[number];

/** Cuerpo de `POST /authz/tenants/{tenantId}/access-policies` (UC-06-02). */
export class CreateAccessPolicyDto {
  @ApiProperty({ description: 'Nombre de la política', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiProperty({ description: 'Efecto de la política', enum: EFFECTS })
  @IsIn(EFFECTS)
  effect!: Effect;

  @ApiPropertyOptional({ description: 'Recurso objetivo (p. ej. patient.record)', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  targetResource?: string;

  @ApiPropertyOptional({ description: 'Condición ABAC (JSON)', type: Object })
  @IsOptional()
  @IsObject()
  conditionJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Prioridad de desempate (menor = antes)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;
}
