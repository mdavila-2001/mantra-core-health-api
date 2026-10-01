import { ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Cuerpo de `PATCH /pharmacies/{pharmacyId}/products/{productId}` (P47 §2).
 *
 * Sólo los datos descriptivos que `pharmacy_products` guarda. Cada clave es
 * opcional: una clave ausente deja el dato como está y `null` lo borra. Lo
 * demás que manda el simulador del frontend (precio, categoría, descripción,
 * existencias, estado e imágenes) no tiene columna: el `ValidationPipe` global
 * lo rechaza con 400 hasta que P47 §3-5 se cierre.
 */
@ApiSchema({ name: 'PharmacyUpdateProductDto' })
export class UpdateProductDto {
  /**
   * Marca comercial; `null` la borra.
   */
  @ApiPropertyOptional({
    description: 'Marca comercial; `null` la borra',
    minLength: 1,
    maxLength: 300,
    nullable: true,
    type: String,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  brandName?: string | null;

  /**
   * Nombre genérico; `null` lo borra.
   */
  @ApiPropertyOptional({
    description: 'Nombre genérico; `null` lo borra',
    minLength: 1,
    maxLength: 300,
    nullable: true,
    type: String,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  genericName?: string | null;

  /**
   * Concentración (texto libre); `null` la borra.
   */
  @ApiPropertyOptional({
    description: 'Concentración (texto libre); `null` la borra',
    minLength: 1,
    maxLength: 200,
    nullable: true,
    type: String,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  strengthText?: string | null;

  /**
   * Tamaño de empaque (texto libre); `null` lo borra.
   */
  @ApiPropertyOptional({
    description: 'Tamaño de empaque (texto libre); `null` lo borra',
    minLength: 1,
    maxLength: 200,
    nullable: true,
    type: String,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  packageSizeText?: string | null;

  /**
   * Si requiere receta; `null` lo borra.
   */
  @ApiPropertyOptional({
    description: 'Requiere receta; `null` lo borra',
    nullable: true,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  requiresPrescription?: boolean | null;
}
