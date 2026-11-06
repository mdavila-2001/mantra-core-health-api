import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/** Query of `GET /diagnostics/lab/services` (`LabServiceQuery`). */
export class LabServiceQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) q?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ enum: ['PUBLISHED', 'DRAFT', 'WITHDRAWN'] })
  @IsOptional()
  @IsIn(['PUBLISHED', 'DRAFT', 'WITHDRAWN'])
  status?: 'PUBLISHED' | 'DRAFT' | 'WITHDRAWN';

  // Query values are text: only the literals 'true'/'false' are booleans.
  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Transform(({ obj, key }: { obj: Record<string, unknown>; key: string }) =>
    obj[key] === 'true' ? true : obj[key] === 'false' ? false : obj[key],
  )
  @IsBoolean()
  available?: boolean;
}

/**
 * One CSV row already parsed by the browser. `service` is validated row by row
 * in the import service, so a bad row is REJECTED instead of failing the batch.
 */
export class LabImportRowDto {
  @ApiProperty() @IsInt() @Min(0) line!: number;

  @ApiProperty({ type: Object, description: 'A LabServiceDraft' })
  @IsObject()
  service!: Record<string, unknown>;
}

/** Body of `POST /diagnostics/lab/services/import`. */
export class LabImportDto {
  @ApiProperty({ enum: ['CREATE_OR_UPDATE', 'UPDATE_ONLY'] })
  @IsIn(['CREATE_OR_UPDATE', 'UPDATE_ONLY'])
  mode!: 'CREATE_OR_UPDATE' | 'UPDATE_ONLY';

  @ApiProperty({ type: [LabImportRowDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'El archivo no trae filas.' })
  @ArrayMaxSize(2000, { message: 'Hasta 2000 filas por archivo.' })
  @ValidateNested({ each: true })
  @Type(() => LabImportRowDto)
  rows!: LabImportRowDto[];
}

/** Body of `POST`/`PATCH /diagnostics/lab/categories`. */
export class LabCategoryNameDto {
  @ApiProperty({ example: 'Hematología' })
  @IsString()
  @Matches(/\S/, { message: 'Falta el nombre de la categoría.' })
  @MaxLength(60, { message: 'El nombre no puede pasar de 60 caracteres.' })
  name!: string;
}
