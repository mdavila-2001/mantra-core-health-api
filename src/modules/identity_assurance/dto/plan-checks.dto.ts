import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';

/** Un check requerido dentro del plan (UC-27-04). */
export class PlanCheckItemDto {
  @ApiProperty({ description: 'Concepto: tipo de check', format: 'uuid' })
  @IsUUID()
  checkTypeConceptId!: string;

  @ApiPropertyOptional({ description: 'Autoridad contra la que se ejecuta el check', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  authorityId?: string;

  @ApiPropertyOptional({ description: '¿El check es obligatorio?', default: true })
  @IsOptional()
  @IsBoolean()
  required?: boolean;
}

/** Cuerpo de `POST /identity/verification-cases/{id}/checks:plan` (UC-27-04). */
export class PlanChecksDto {
  @ApiProperty({ description: 'Checks a planificar', type: [PlanCheckItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PlanCheckItemDto)
  checks!: PlanCheckItemDto[];
}
