import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `POST /community/blocks` (UC-19-14). */
export class CreateBlockDto {
  /**
   * Identificador asociado a blocker profile.
   */
  @ApiProperty({ description: 'Perfil que bloquea', format: 'uuid' })
  @IsUUID()
  blockerProfileId!: string;

  /**
   * Identificador asociado a blocked profile.
   */
  @ApiProperty({ description: 'Perfil bloqueado', format: 'uuid' })
  @IsUUID()
  blockedProfileId!: string;

  /**
   * Valor de reason mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Razón del bloqueo',
    enum: ['HARASSMENT', 'SPAM', 'OTHER'],
  })
  @IsOptional()
  @IsIn(['HARASSMENT', 'SPAM', 'OTHER'])
  reason?: 'HARASSMENT' | 'SPAM' | 'OTHER';
}
