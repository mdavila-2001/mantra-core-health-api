import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { IsStrictBoolean } from '../../../common/validators/strict-boolean.validator';

const PRICE = /^\d{1,10}(\.\d{1,2})?$/;
const PRICE_MESSAGE =
  'El precio tiene que ser un número mayor o igual a cero, con hasta dos decimales.';
const NOT_BLANK = /\S/;

/** Optional fields shared by `LabServiceDraft` and `LabServiceChanges`; null clears. */
class LabServiceFieldsDto {
  @ApiPropertyOptional({ type: String, format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID('all', { message: 'La categoría no existe.' })
  categoryId?: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Not persisted: no free-text column',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  sampleType?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  preparation?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @IsInt({ message: 'El tiempo de entrega va en horas enteras.' })
  @Min(0, { message: 'El tiempo de entrega va en horas enteras.' })
  @Max(8760)
  turnaroundHours?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsStrictBoolean()
  requiresMedicalOrder?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsStrictBoolean()
  homeCollection?: boolean;

  @ApiPropertyOptional({ type: Number, nullable: true, example: 10 })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El descuento va de 0 a 100 %.' },
  )
  @Min(0, { message: 'El descuento va de 0 a 100 %.' })
  @Max(100, { message: 'El descuento va de 0 a 100 %.' })
  alovidaDiscountPercent?: number | null;

  @ApiPropertyOptional() @IsOptional() @IsStrictBoolean() available?: boolean;
}

/** Body of `POST /diagnostics/lab/services` (`LabServiceDraft`). */
export class LabServiceDraftDto extends LabServiceFieldsDto {
  @ApiProperty({ example: 'HEMOGRAMA' })
  @IsString()
  @Matches(NOT_BLANK, { message: 'Falta el código del servicio.' })
  @MaxLength(40, { message: 'El código no puede pasar de 40 caracteres.' })
  code!: string;

  @ApiProperty()
  @IsString()
  @Matches(NOT_BLANK, { message: 'Falta el nombre del servicio.' })
  @MaxLength(200)
  name!: string;

  @ApiProperty({ example: '45.00' })
  @IsString({ message: PRICE_MESSAGE })
  @Matches(PRICE, { message: PRICE_MESSAGE })
  price!: string;

  @ApiPropertyOptional({ enum: ['PUBLISHED', 'DRAFT'] })
  @IsOptional()
  @IsIn(['PUBLISHED', 'DRAFT'], { message: 'Estado desconocido.' })
  status?: 'PUBLISHED' | 'DRAFT';
}

/** Body of `PATCH /diagnostics/lab/services/:id` (`LabServiceChanges`). */
export class LabServiceChangesDto extends LabServiceFieldsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(NOT_BLANK, { message: 'Falta el código del servicio.' })
  @MaxLength(40, { message: 'El código no puede pasar de 40 caracteres.' })
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(NOT_BLANK, { message: 'Falta el nombre del servicio.' })
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ example: '45.00' })
  @IsOptional()
  @IsString({ message: PRICE_MESSAGE })
  @Matches(PRICE, { message: PRICE_MESSAGE })
  price?: string;

  @ApiPropertyOptional({ enum: ['PUBLISHED', 'DRAFT', 'WITHDRAWN'] })
  @IsOptional()
  @IsIn(['PUBLISHED', 'DRAFT', 'WITHDRAWN'], { message: 'Estado desconocido.' })
  status?: 'PUBLISHED' | 'DRAFT' | 'WITHDRAWN';
}
