import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Query de paginación compartida por todos los listados. Los límites duros
 * (`Max(100)`) no son cosmética: acotan el coste de una consulta y cierran la
 * puerta a la paginación abusiva como vector de extracción masiva de datos.
 */
export class PaginationQueryDto {
  /**
   * Valor de page mantenido por la instancia.
   */
  @ApiPropertyOptional({
    minimum: 1,
    default: 1,
    description: 'Página (1-based)',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page: number = 1;

  /**
   * Valor de page size mantenido por la instancia.
   */
  @ApiPropertyOptional({
    minimum: 1,
    maximum: 100,
    default: 20,
    description: 'Tamaño de página',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  pageSize: number = 20;

  /**
   * Valor de order mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order: 'ASC' | 'DESC' = 'DESC';

  /**
   * Valor de sort by mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Campo de ordenamiento. Debe ser un identificador de columna ' +
      '(letras, números, guión bajo); el servicio aplica además su propia ' +
      'allowlist de columnas ordenables',
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^[A-Za-z_][A-Za-z0-9_]*$/, {
    message: 'sortBy debe ser un identificador de columna válido',
  })
  sortBy: string = 'createdAt';

  /** Offset derivado para el ORM. */
  get offset(): number {
    return (this.page - 1) * this.pageSize;
  }
}
