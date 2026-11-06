import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { BRANCH_CATEGORIES, type BranchCategory } from '../branch-categories';

/**
 * Cuerpo de `PATCH /tenants/:tenantId/branches/:branchId`. `null` borra el dato;
 * la clave ausente lo deja como está. El código no se edita.
 */
export class UpdateBranchDto {
  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  name?: string;

  @ApiPropertyOptional({ maxLength: 1000, nullable: true })
  @ValidateIf((_o, v) => v !== null)
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @ApiPropertyOptional({ maxLength: 2000, nullable: true })
  @ValidateIf((_o, v) => v !== null)
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Matches(/^https?:\/\//i, { message: 'locationUrl debe ser http o https' })
  locationUrl?: string | null;

  @ApiPropertyOptional({ minimum: -90, maximum: 90, nullable: true })
  @ValidateIf((_o, v) => v !== null)
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number | null;

  @ApiPropertyOptional({ minimum: -180, maximum: 180, nullable: true })
  @ValidateIf((_o, v) => v !== null)
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number | null;

  @ApiPropertyOptional({
    description:
      'Categoría de la sede: default, head_office (casa matriz, una por organización) o branch.',
    enum: BRANCH_CATEGORIES,
  })
  @IsOptional()
  @IsIn(BRANCH_CATEGORIES)
  category?: BranchCategory;
}
