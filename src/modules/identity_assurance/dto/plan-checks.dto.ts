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
  /**
   * Identificador asociado a check type concept.
   */
  @ApiProperty({ description: 'Concepto: tipo de check', format: 'uuid' })
  @IsUUID()
  checkTypeConceptId!: string;

  /**
   * Identificador asociado a authority.
   */
  @ApiPropertyOptional({
    description: 'Autoridad contra la que se ejecuta el check',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  authorityId?: string;

  /**
   * Valor de required mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: '¿El check es obligatorio?',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  required?: boolean;
}

/** Cuerpo de `POST /identity/verification-cases/{id}/checks:plan` (UC-27-04). */
export class PlanChecksDto {
  /**
   * Valor de checks mantenido por la instancia.
   */
  @ApiProperty({ description: 'Checks a planificar', type: [PlanCheckItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PlanCheckItemDto)
  checks!: PlanCheckItemDto[];
}
