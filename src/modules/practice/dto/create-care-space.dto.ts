import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CareSpaceAttributesDto } from './care-space-attributes.dto';

/** Cuerpo de `POST /sites/{siteId}/care-spaces` (UC-14-05). */
export class CreateCareSpaceDto extends CareSpaceAttributesDto {
  /**
   * Identificador asociado a clinical unit.
   */
  @ApiPropertyOptional({
    description: 'Unidad clínica (misma sede)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  clinicalUnitId?: string;

  /**
   * Identificador asociado a parent space.
   */
  @ApiPropertyOptional({
    description: 'Espacio padre (misma sede)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  parentSpaceId?: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Código único dentro de la sede',
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nombre del espacio', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  /**
   * Identificador asociado a space type concept.
   */
  @ApiPropertyOptional({
    description:
      'Obsoleto (F0): concepto de función. Usar functionCode; si vienen los dos, manda functionCode',
    deprecated: true,
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  spaceTypeConceptId?: string;

  @ApiPropertyOptional({
    description:
      'Forma FHIR (LOC_FORM_*). Ausente: LOC_FORM_ROOM (compatibilidad con F0)',
  })
  @IsOptional()
  @IsString()
  formCode?: string;

  @ApiPropertyOptional({
    description:
      'Función (SPACE_FN_* o SPACE_TYPE_ROOM). Ausente: SPACE_TYPE_ROOM (genérica)',
  })
  @IsOptional()
  @IsString()
  functionCode?: string;

  @ApiPropertyOptional({
    description:
      'Nacer ACTIVO en vez de PLANNED (el padre tiene que estar activo)',
  })
  @IsOptional()
  @IsBoolean()
  activate?: boolean;
}
