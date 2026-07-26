import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

/**
 * Cuerpo opcional de `POST /integrations/messages/{id}:dispatch` (UC-12-06).
 *
 * En producción el worker despacha contra el proveedor real; para la operación
 * síncrona (y para poder ejercitar el flujo de reintentos/dead-letter) se acepta
 * un resultado simulado del envío.
 */
export class DispatchMessageDto {
  @ApiPropertyOptional({ description: 'Si true, el envío se marca como FAILED (para reintentos)' })
  @IsOptional()
  @IsBoolean()
  simulateFailure?: boolean;

  @ApiPropertyOptional({ description: 'Código HTTP devuelto por el proveedor', minimum: 100 })
  @IsOptional()
  @IsInt()
  @Min(100)
  httpStatus?: number;

  @ApiPropertyOptional({ description: 'Detalle del error cuando falla', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  errorText?: string;
}
