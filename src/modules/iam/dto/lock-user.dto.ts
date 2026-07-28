import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Cuerpo de `POST /iam/users/:id/lock` (UC-01-07). */
export class LockUserDto {
  /**
   * Valor de reason mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Motivo administrativo del bloqueo' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
