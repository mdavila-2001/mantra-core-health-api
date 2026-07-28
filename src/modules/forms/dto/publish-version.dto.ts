import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

/** Un miembro del set (campo asociado a la versión que se publica). */
export class SetMemberInputDto {
  /**
   * Identificador asociado a field.
   */
  @ApiProperty({ description: 'Definición de campo miembro', format: 'uuid' })
  @IsUUID()
  fieldId!: string;

  /**
   * Identificador asociado a section.
   */
  @ApiPropertyOptional({
    description: 'Sección a la que pertenece',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  sectionId?: string;

  /**
   * Valor de required mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: '¿Campo requerido en el set?' })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Orden dentro del set' })
  @IsOptional()
  @IsInt()
  @Min(0)
  ordinal?: number;
}

/** Cuerpo de `POST /forms/definition-sets/{id}/versions/{ver}/publish` (UC-09-03). */
export class PublishVersionDto {
  /**
   * Valor de members mantenido por la instancia.
   */
  @ApiProperty({
    type: [SetMemberInputDto],
    description: 'Miembros a componer',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SetMemberInputDto)
  members!: SetMemberInputDto[];
}
